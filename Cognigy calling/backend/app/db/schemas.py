from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class CreateTestRequest(BaseModel):
    phone_number: str = Field(min_length=8, max_length=32)
    test_name: str = Field(min_length=2, max_length=255)
    test_scenario: str = Field(min_length=3)
    expected_conversation_flow: str | None = None
    success_criteria: list[str] = Field(min_length=1)
    additional_instructions: str | None = None
    test_data: str | None = None
    persona_instructions: str | None = None
    enable_recording: bool = False


class CriteriaEvaluation(BaseModel):
    criterion: str
    status: Literal["pass", "partial", "fail"]
    notes: str


class QualityAssessment(BaseModel):
    intent_recognition: str
    response_relevance: str
    context_retention: str
    conversation_flow: str
    error_handling: str
    recovery_from_misunderstanding: str
    task_completion: str


class IssueItem(BaseModel):
    category: str
    description: str
    severity: Literal["low", "medium", "high"]


class AnalysisResult(BaseModel):
    overall_result: Literal["Pass", "Partial Pass", "Fail"]
    score: int = Field(ge=0, le=100)
    summary: str
    criteria_evaluation: list[CriteriaEvaluation]
    quality_assessment: QualityAssessment
    issues: list[IssueItem]
    suggestions: list[str]
    confidence: float = Field(ge=0, le=1)
    raw_response: str | None = None


class TranscriptUtteranceResponse(BaseModel):
    speaker: str
    text: str
    timestamp: datetime

    model_config = {"from_attributes": True}


class CallInfoResponse(BaseModel):
    status: str
    duration_seconds: int | None
    provider_call_sid: str | None
    started_at: datetime
    completed_at: datetime | None
    metadata: dict
    error_message: str | None


class TestResultResponse(BaseModel):
    id: str
    test_name: str
    phone_number: str
    scenario: str
    expected_flow: str | None
    success_criteria: list[str]
    additional_instructions: str | None
    test_data: str | None
    persona_instructions: str | None
    enable_recording: bool
    created_at: datetime
    call: CallInfoResponse | None
    transcript: list[TranscriptUtteranceResponse]
    analysis: AnalysisResult | None


class CreateTestResponse(BaseModel):
    test_id: str
    status: str
    message: str
