from __future__ import annotations

from app.db.models import TestCase
from app.services.openai_realtime_service import OpenAIRealtimeService


class ConversationManager:
    def __init__(self, realtime_service: OpenAIRealtimeService):
        self.realtime_service = realtime_service

    def execute_test_conversation(self, test_case: TestCase) -> list[dict]:
        return self.realtime_service.generate_simulated_transcript(
            scenario=test_case.scenario,
            expected_flow=test_case.expected_flow,
            success_criteria=test_case.success_criteria,
            additional_instructions=test_case.additional_instructions,
        )
