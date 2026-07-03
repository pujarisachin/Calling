from __future__ import annotations

import logging
import time
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import AnalysisReport, CallSession, TestCase
from app.services.analysis_engine import AnalysisEngine
from app.services.conversation_manager import ConversationManager
from app.services.report_generator import ReportGenerator
from app.services.transcript_service import TranscriptService
from app.services.twilio_service import TwilioService

logger = logging.getLogger(__name__)


class CallOrchestrator:
    def __init__(
        self,
        twilio_service: TwilioService,
        conversation_manager: ConversationManager,
        transcript_service: TranscriptService,
        analysis_engine: AnalysisEngine,
    ):
        self.twilio_service = twilio_service
        self.conversation_manager = conversation_manager
        self.transcript_service = transcript_service
        self.analysis_engine = analysis_engine

    def run_test(self, db: Session, test_id: str) -> None:
        test_case = db.get(TestCase, test_id)
        call_session = db.scalar(select(CallSession).where(CallSession.test_id == test_id))
        if not test_case or not call_session:
            logger.error("Test or call session not found for id=%s", test_id)
            return

        try:
            call_result = self.twilio_service.start_outbound_call(test_case.phone_number)
            call_session.status = "running"
            call_session.provider_call_sid = call_result.provider_call_sid
            call_session.metadata_json = {
                "simulated": call_result.simulated,
                "twilio_initial_status": call_result.status,
                "conversation_mode": "simulated" if call_result.simulated else "telephony_no_bridge",
            }
            db.commit()

            transcript_rows = []
            if call_result.simulated:
                transcript_items = self.conversation_manager.execute_test_conversation(test_case)
                self.transcript_service.save_transcript(db, test_id, transcript_items)
                transcript_rows = self.transcript_service.get_transcript(db, test_id)
            else:
                call_session.metadata_json = {
                    **(call_session.metadata_json or {}),
                    "transcript_capture": "not_available",
                    "transcript_note": "No live call transcript is captured in telephony mode without a media bridge.",
                }
                db.commit()

            analysis_dict = self.analysis_engine.analyze_conversation(test_case, transcript_rows)
            analysis = ReportGenerator.normalize_analysis(analysis_dict)

            db.add(
                AnalysisReport(
                    test_id=test_id,
                    overall_result=analysis.overall_result,
                    score=analysis.score,
                    summary=analysis.summary,
                    criteria_evaluation=[item.model_dump() for item in analysis.criteria_evaluation],
                    quality_assessment=analysis.quality_assessment.model_dump(),
                    issues=[item.model_dump() for item in analysis.issues],
                    suggestions=analysis.suggestions,
                    confidence=analysis.confidence,
                    raw_response=analysis.raw_response,
                )
            )

            if call_session.provider_call_sid and not self.twilio_service.settings.twilio_status_callback_url:
                polled = self._poll_twilio_completion(call_session.provider_call_sid)
                if polled:
                    call_session.status = polled.get("status", call_session.status)
                    if polled.get("duration_seconds") is not None:
                        call_session.duration_seconds = polled["duration_seconds"]
                    call_session.metadata_json = {
                        **(call_session.metadata_json or {}),
                        "twilio_polled": True,
                        "twilio_polled_answered_by": polled.get("answered_by"),
                        "twilio_polled_end_time": polled.get("end_time"),
                    }

            completed_at = datetime.utcnow()
            call_session.completed_at = completed_at
            if call_session.status == "running":
                call_session.status = "completed"
            if call_session.duration_seconds is None:
                call_session.duration_seconds = int((completed_at - call_session.started_at).total_seconds())
            db.commit()
        except Exception as exc:  # noqa: BLE001
            logger.exception("Test orchestration failed: %s", exc)
            call_session.status = "failed"
            call_session.completed_at = datetime.utcnow()
            call_session.duration_seconds = int((call_session.completed_at - call_session.started_at).total_seconds())
            call_session.error_message = str(exc)
            db.commit()

    def _poll_twilio_completion(self, provider_call_sid: str, max_attempts: int = 6, delay_seconds: int = 3) -> dict | None:
        terminal_statuses = {"completed", "busy", "failed", "no-answer", "canceled"}
        latest = None
        for _ in range(max_attempts):
            latest = self.twilio_service.get_call_status(provider_call_sid)
            if latest and latest.get("status") in terminal_statuses:
                return latest
            time.sleep(delay_seconds)
        return latest
