from __future__ import annotations

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.credential_resolver import build_effective_settings
from app.db.database import SessionLocal, get_db
from app.db.schemas import (
    CallInfoResponse,
    CreateTestRequest,
    CreateTestResponse,
    TestListResponse,
    TestResultResponse,
    TestSummaryResponse,
)
from app.repositories.test_repository import TestRepository
from app.services.analysis_engine import AnalysisEngine
from app.services.call_orchestrator import CallOrchestrator
from app.services.conversation_manager import ConversationManager
from app.services.openai_realtime_service import OpenAIRealtimeService
from app.services.transcript_service import TranscriptService
from app.services.twilio_service import TwilioService

router = APIRouter(prefix="/api/tests", tags=["tests"])


def _run_test_job(test_id: str) -> None:
    with SessionLocal() as db:
        settings = build_effective_settings(db)
        orchestrator = CallOrchestrator(
            twilio_service=TwilioService(settings),
            conversation_manager=ConversationManager(OpenAIRealtimeService(settings)),
            transcript_service=TranscriptService(),
            analysis_engine=AnalysisEngine(settings),
        )
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


@router.get("", response_model=TestListResponse)
def list_tests(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> TestListResponse:
    test_cases, total = TestRepository.list_tests(db, skip=skip, limit=limit)

    items = []
    for test_case in test_cases:
        call_session = TestRepository.get_call_session(db, test_case.id)
        report = TestRepository.get_analysis_report(db, test_case.id)
        items.append(
            TestSummaryResponse(
                id=test_case.id,
                test_name=test_case.name,
                created_at=test_case.created_at,
                call_status=call_session.status if call_session else None,
                duration_seconds=call_session.duration_seconds if call_session else None,
                overall_sentiment=report.overall_sentiment if report else None,
                sentiment_score=report.sentiment_score if report else None,
                score=report.score if report else None,
                has_recording=bool(call_session and call_session.recording_url),
            )
        )

    return TestListResponse(items=items, total=total)


@router.get("/{test_id}/recording")
def get_test_recording(test_id: str, db: Session = Depends(get_db)) -> StreamingResponse:
    call_session = TestRepository.get_call_session(db, test_id)
    if not call_session or not call_session.recording_url:
        raise HTTPException(status_code=404, detail="Recording not available")

    settings = build_effective_settings(db)
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        raise HTTPException(status_code=400, detail="Twilio credentials not configured")

    try:
        response = httpx.get(
            call_session.recording_url,
            auth=(settings.twilio_account_sid, settings.twilio_auth_token),
            timeout=30.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch recording: {exc}") from exc

    return StreamingResponse(iter([response.content]), media_type="audio/mpeg")


@router.post("/{test_id}/end-call", status_code=status.HTTP_200_OK)
def end_call(test_id: str, db: Session = Depends(get_db)) -> dict:
    call_session = TestRepository.get_call_session(db, test_id)
    if not call_session:
        raise HTTPException(status_code=404, detail="Call session not found")

    if not call_session.provider_call_sid:
        raise HTTPException(status_code=400, detail="Call has no provider call SID to hang up")

    settings = build_effective_settings(db)
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
            "overall_sentiment": report.overall_sentiment,
            "sentiment_score": report.sentiment_score,
            "key_topics": report.key_topics,
            "intent": report.intent,
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
            has_recording=bool(call_session.recording_url),
        )
        if call_session
        else None,
        transcript=transcript_rows,
        analysis=analysis,
    )
