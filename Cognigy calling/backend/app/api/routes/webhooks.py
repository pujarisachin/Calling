from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Form, Query, Response, WebSocket
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.database import get_db
from app.db.models import AnalysisReport, CallSession
from app.repositories.test_repository import TestRepository
from app.services.analysis_engine import AnalysisEngine
from app.services.realtime_bridge_service import RealtimeBridgeService
from app.services.report_generator import ReportGenerator
from app.services.transcript_service import TranscriptService

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


@router.post("/twilio/status")
def twilio_status_callback(
    call_sid: str = Form(alias="CallSid"),
    call_status: str = Form(alias="CallStatus"),
    call_duration: str | None = Form(default=None, alias="CallDuration"),
    test_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> dict:
    call_session = db.scalar(select(CallSession).where(CallSession.provider_call_sid == call_sid))
    if not call_session and test_id:
        call_session = db.scalar(select(CallSession).where(CallSession.test_id == test_id))

    if not call_session:
        return {"ok": True}

    call_session.status = call_status
    is_terminal = call_status in {"completed", "failed", "busy", "no-answer", "canceled"}
    if is_terminal:
        call_session.completed_at = datetime.utcnow()

    if call_duration and call_duration.isdigit():
        call_session.duration_seconds = int(call_duration)

    if is_terminal:
        _finalize_analysis_if_needed(db, call_session.test_id)

    db.commit()
    return {"ok": True}


@router.post("/twilio/answer")
def twilio_answer_callback(test_id: str | None = Query(default=None)) -> Response:
    settings = get_settings()
    if not settings.app_public_base_url:
        twiml = (
            '<?xml version="1.0" encoding="UTF-8"?>'
            "<Response>"
            "<Say>Realtime bridge is not configured. Please set APP_PUBLIC_BASE_URL.</Say>"
            "</Response>"
        )
        return Response(content=twiml, media_type="application/xml")

    base = settings.app_public_base_url.rstrip("/")
    media_ws_url = base.replace("https://", "wss://").replace("http://", "ws://")
    media_ws_url = f"{media_ws_url}/api/webhooks/twilio/media-stream"

    custom_parameter = (
        f"<Parameter name=\"test_id\" value=\"{test_id}\"/>" if test_id else ""
    )
    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        "<Response>"
        "<Say voice=\"Polly.Joanna\">Connecting to AI voice agent.</Say>"
        "<Connect>"
        f"<Stream url=\"{media_ws_url}\">{custom_parameter}</Stream>"
        "</Connect>"
        "</Response>"
    )
    return Response(content=twiml, media_type="application/xml")


@router.websocket("/twilio/media-stream")
async def twilio_media_stream(websocket: WebSocket) -> None:
    settings = get_settings()
    bridge = RealtimeBridgeService(settings)
    await bridge.bridge_twilio_media(websocket)


def _finalize_analysis_if_needed(db: Session, test_id: str) -> None:
    if TestRepository.get_analysis_report(db, test_id):
        return

    test_case = TestRepository.get_test(db, test_id)
    if not test_case:
        return

    transcript_rows = TranscriptService.get_transcript(db, test_id)

    if not transcript_rows:
        # No speech was captured — media stream never connected.
        # Store a diagnostic report instead of wasting an LLM call.
        no_transcript_criteria = [
            {"criterion": c, "status": "fail", "notes": "Call ended before any speech was captured. Verify the ngrok tunnel is running and APP_PUBLIC_BASE_URL is set correctly."}
            for c in (test_case.success_criteria or [])
        ]
        empty_quality = {
            "intent_recognition": "N/A", "response_relevance": "N/A",
            "context_retention": "N/A", "conversation_flow": "N/A",
            "error_handling": "N/A", "recovery_from_misunderstanding": "N/A",
            "task_completion": "N/A",
        }
        db.add(
            AnalysisReport(
                test_id=test_id,
                overall_result="Fail",
                score=0,
                summary="No speech was captured during this call. The media stream bridge did not connect. Check that the ngrok tunnel is running and the APP_PUBLIC_BASE_URL environment variable points to the active ngrok HTTPS URL.",
                criteria_evaluation=no_transcript_criteria,
                quality_assessment=empty_quality,
                issues=[{"category": "media_stream_not_connected", "description": "Twilio media stream WebSocket did not connect to the backend. The call ended before any audio was bridged.", "severity": "high"}],
                suggestions=[
                    "Start ngrok: ngrok http 8000",
                    "Update APP_PUBLIC_BASE_URL in the .env file with the new ngrok URL",
                    "Restart the backend container: docker compose restart backend",
                    "Re-run the test",
                ],
                confidence=1.0,
                raw_response=None,
            )
        )
        return

    settings = get_settings()
    analysis_engine = AnalysisEngine(settings)
    analysis_dict = analysis_engine.analyze_conversation(test_case, transcript_rows)
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
