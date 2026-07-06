from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.database import SessionLocal, get_db
from app.db.schemas import CallInfoResponse, CreateTestRequest, CreateTestResponse, TestResultResponse
from app.repositories.test_repository import TestRepository
from app.services.analysis_engine import AnalysisEngine
from app.services.call_orchestrator import CallOrchestrator
from app.services.conversation_manager import ConversationManager
from app.services.openai_realtime_service import OpenAIRealtimeService
from app.services.transcript_service import TranscriptService
from app.services.twilio_service import TwilioService

router = APIRouter(prefix="/api/tests", tags=["tests"])


def _run_test_job(test_id: str) -> None:
    settings = get_settings()
    orchestrator = CallOrchestrator(
        twilio_service=TwilioService(settings),
        conversation_manager=ConversationManager(OpenAIRealtimeService(settings)),
        transcript_service=TranscriptService(),
        analysis_engine=AnalysisEngine(settings),
    )
    with SessionLocal() as db:
        orchestrator.run_test(db, test_id)


@router.post("", response_model=CreateTestResponse, status_code=status.HTTP_202_ACCEPTED)
def create_test(
    payload: CreateTestRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> CreateTestResponse:
    test_case = TestRepository.create_test(
        db=db,
        name=payload.test_name,
        phone_number=payload.phone_number,
        scenario=payload.test_scenario,
        expected_flow=payload.expected_conversation_flow,
        success_criteria=payload.success_criteria,
        additional_instructions=payload.additional_instructions,
        test_data=payload.test_data,
        persona_instructions=payload.persona_instructions,
        enable_recording=payload.enable_recording,
    )

    background_tasks.add_task(_run_test_job, test_case.id)

    return CreateTestResponse(
        test_id=test_case.id,
        status="queued",
        message="Test created. Execution started in background.",
    )


@router.post("/{test_id}/end-call", status_code=status.HTTP_200_OK)
def end_call(test_id: str, db: Session = Depends(get_db)) -> dict:
    call_session = TestRepository.get_call_session(db, test_id)
    if not call_session:
        raise HTTPException(status_code=404, detail="Call session not found")

    if not call_session.provider_call_sid:
        raise HTTPException(status_code=400, detail="Call has no provider call SID to hang up")

    settings = get_settings()
    TwilioService(settings).hangup_call(call_session.provider_call_sid)

    return {"status": "hangup_requested"}


@router.get("/{test_id}", response_model=TestResultResponse)
def get_test_result(test_id: str, db: Session = Depends(get_db)) -> TestResultResponse:
    test_case = TestRepository.get_test(db, test_id)
    if not test_case:
        raise HTTPException(status_code=404, detail="Test not found")

    call_session = TestRepository.get_call_session(db, test_id)
    transcript_rows = TranscriptService.get_transcript(db, test_id)
    report = TestRepository.get_analysis_report(db, test_id)

    analysis = None
    if report:
        analysis = {
            "overall_result": report.overall_result,
            "score": report.score,
            "summary": report.summary,
            "criteria_evaluation": report.criteria_evaluation,
            "quality_assessment": report.quality_assessment,
            "issues": report.issues,
            "suggestions": report.suggestions,
            "confidence": report.confidence,
            "raw_response": report.raw_response,
        }

    return TestResultResponse(
        id=test_case.id,
        test_name=test_case.name,
        phone_number=test_case.phone_number,
        scenario=test_case.scenario,
        expected_flow=test_case.expected_flow,
        success_criteria=test_case.success_criteria,
        additional_instructions=test_case.additional_instructions,
        test_data=test_case.test_data,
        persona_instructions=test_case.persona_instructions,
        enable_recording=test_case.enable_recording,
        created_at=test_case.created_at,
        call=CallInfoResponse(
            status=call_session.status,
            duration_seconds=call_session.duration_seconds,
            provider_call_sid=call_session.provider_call_sid,
            started_at=call_session.started_at,
            completed_at=call_session.completed_at,
            metadata=call_session.metadata_json,
            error_message=call_session.error_message,
        )
        if call_session
        else None,
        transcript=transcript_rows,
        analysis=analysis,
    )
