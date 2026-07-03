from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta

from openai import OpenAI

from app.core.config import Settings

logger = logging.getLogger(__name__)


class OpenAIRealtimeService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

    def generate_simulated_transcript(
        self,
        scenario: str,
        expected_flow: str | None,
        success_criteria: list[str],
        additional_instructions: str | None,
    ) -> list[dict]:
        if not self.client:
            return self._fallback_transcript(scenario)

        prompt = (
            "You are simulating a call transcript between two speakers:\n"
            "1) AI Tester\n"
            "2) Target Voice Bot\n\n"
            "Generate 10-16 realistic turns as JSON only with this schema:\n"
            "{\"transcript\": [{\"speaker\": \"AI Tester|Target Voice Bot\", \"text\": \"...\"}]}\n\n"
            f"Scenario: {scenario}\n"
            f"Expected flow: {expected_flow or 'Not provided'}\n"
            f"Success criteria: {success_criteria}\n"
            f"Additional instructions: {additional_instructions or 'None'}\n"
        )

        try:
            response = self.client.responses.create(
                model=self.settings.openai_model,
                input=prompt,
                temperature=0.2,
            )
            payload_text = response.output_text
            parsed = json.loads(payload_text)
            transcript_items = parsed.get("transcript", [])
            return self._with_timestamps(transcript_items)
        except Exception as exc:  # noqa: BLE001
            logger.warning("OpenAI transcript generation failed, fallback used: %s", exc)
            return self._fallback_transcript(scenario)

    def _with_timestamps(self, transcript_items: list[dict]) -> list[dict]:
        now = datetime.utcnow()
        output: list[dict] = []
        for idx, item in enumerate(transcript_items):
            output.append(
                {
                    "speaker": item.get("speaker", "Target Voice Bot"),
                    "text": item.get("text", ""),
                    "timestamp": now + timedelta(seconds=idx * 8),
                }
            )
        return output

    def _fallback_transcript(self, scenario: str) -> list[dict]:
        now = datetime.utcnow()
        return [
            {"speaker": "AI Tester", "text": f"Hello, I need help with: {scenario}", "timestamp": now},
            {
                "speaker": "Target Voice Bot",
                "text": "Sure, I can help with that. Could you provide any missing details?",
                "timestamp": now + timedelta(seconds=7),
            },
            {
                "speaker": "AI Tester",
                "text": "Please proceed and confirm when completed.",
                "timestamp": now + timedelta(seconds=14),
            },
            {
                "speaker": "Target Voice Bot",
                "text": "I have completed the requested flow and confirmed the result.",
                "timestamp": now + timedelta(seconds=22),
            },
        ]
