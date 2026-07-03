from __future__ import annotations

import json
import logging
import re

from openai import OpenAI

from app.core.config import Settings
from app.db.models import TestCase, TranscriptUtterance

logger = logging.getLogger(__name__)


class AnalysisEngine:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

    def analyze_conversation(self, test_case: TestCase, transcript: list[TranscriptUtterance]) -> dict:
        if not transcript:
            return self._fallback_empty_result(test_case.success_criteria)

        if not self.client:
            return self._fallback_heuristic_result(test_case.success_criteria)

        serialized_transcript = "\n".join(
            f"[{item.timestamp.isoformat()}] {item.speaker}: {item.text}" for item in transcript
        )

        prompt = (
            "Analyze the voice bot transcript and output strict JSON only.\n"
            "Do not use markdown fences or extra commentary.\n"
            "JSON schema:\n"
            "{\n"
            "  \"overall_result\": \"Pass|Partial Pass|Fail\",\n"
            "  \"score\": 0-100 integer,\n"
            "  \"summary\": string,\n"
            "  \"criteria_evaluation\": [{\"criterion\": string, \"status\": \"pass|partial|fail\", \"notes\": string}],\n"
            "  \"quality_assessment\": {\n"
            "    \"intent_recognition\": string,\n"
            "    \"response_relevance\": string,\n"
            "    \"context_retention\": string,\n"
            "    \"conversation_flow\": string,\n"
            "    \"error_handling\": string,\n"
            "    \"recovery_from_misunderstanding\": string,\n"
            "    \"task_completion\": string\n"
            "  },\n"
            "  \"issues\": [{\"category\": string, \"description\": string, \"severity\": \"low|medium|high\"}],\n"
            "  \"suggestions\": [string],\n"
            "  \"confidence\": 0-1 number\n"
            "}\n\n"
            f"Success criteria: {test_case.success_criteria}\n\n"
            f"Transcript:\n{serialized_transcript}"
        )

        try:
            response = self.client.responses.create(
                model=self.settings.openai_model,
                input=prompt,
                temperature=0.1,
            )
            response_text = (response.output_text or "").strip()
            data = self._parse_analysis_json(response_text)
            data["raw_response"] = response_text
            return data
        except Exception as exc:  # noqa: BLE001
            logger.warning("LLM analysis failed, fallback used: %s", exc)
            return self._fallback_heuristic_result(test_case.success_criteria)

    def _parse_analysis_json(self, response_text: str) -> dict:
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            pass

        fenced = re.search(r"```json\s*(\{.*?\})\s*```", response_text, flags=re.DOTALL | re.IGNORECASE)
        if fenced:
            return json.loads(fenced.group(1))

        first = response_text.find("{")
        last = response_text.rfind("}")
        if first != -1 and last != -1 and last > first:
            candidate = response_text[first : last + 1]
            return json.loads(candidate)

        raise json.JSONDecodeError("No JSON object found in model output", response_text, 0)

    def _fallback_empty_result(self, criteria: list[str]) -> dict:
        return {
            "overall_result": "Fail",
            "score": 0,
            "summary": "No transcript captured.",
            "criteria_evaluation": [
                {"criterion": item, "status": "fail", "notes": "No evidence available."} for item in criteria
            ],
            "quality_assessment": {
                "intent_recognition": "Unknown",
                "response_relevance": "Unknown",
                "context_retention": "Unknown",
                "conversation_flow": "Unknown",
                "error_handling": "Unknown",
                "recovery_from_misunderstanding": "Unknown",
                "task_completion": "Failed",
            },
            "issues": [{"category": "missing_transcript", "description": "No conversation data recorded.", "severity": "high"}],
            "suggestions": ["Ensure call audio/transcript capture is configured."],
            "confidence": 0.2,
            "raw_response": None,
        }

    def _fallback_heuristic_result(self, criteria: list[str]) -> dict:
        criteria_eval = [{"criterion": item, "status": "partial", "notes": "Heuristic evaluation in fallback mode."} for item in criteria]
        return {
            "overall_result": "Partial Pass",
            "score": 65,
            "summary": "Fallback analysis used because LLM integration is unavailable or failed.",
            "criteria_evaluation": criteria_eval,
            "quality_assessment": {
                "intent_recognition": "Moderate",
                "response_relevance": "Moderate",
                "context_retention": "Moderate",
                "conversation_flow": "Moderate",
                "error_handling": "Needs improvement",
                "recovery_from_misunderstanding": "Needs improvement",
                "task_completion": "Partially completed",
            },
            "issues": [
                {
                    "category": "analysis_fallback",
                    "description": "Detailed LLM analysis was not available due to model output parsing or API failure.",
                    "severity": "medium",
                }
            ],
            "suggestions": [
                "Verify model output format and API stability for structured analysis.",
                "Review call transcripts manually for final QA signoff.",
            ],
            "confidence": 0.55,
            "raw_response": None,
        }
