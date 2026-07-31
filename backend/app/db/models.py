from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class TestCase(Base):
    __tablename__ = "test_cases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(32), nullable=False)
    scenario: Mapped[str] = mapped_column(Text, nullable=False)
    expected_flow: Mapped[str | None] = mapped_column(Text, nullable=True)
    success_criteria: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    additional_instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    test_data: Mapped[str | None] = mapped_column(Text, nullable=True)
    persona_instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    agent_language: Mapped[str] = mapped_column(String(16), nullable=False, default="en-US")
    enable_recording: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class ProviderCredential(Base):
    __tablename__ = "provider_credentials"

    provider_type: Mapped[str] = mapped_column(String(32), primary_key=True)
    config: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class CallSession(Base):
    __tablename__ = "call_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    test_id: Mapped[str] = mapped_column(String(36), ForeignKey("test_cases.id"), nullable=False, unique=True)
    provider_call_sid: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="queued")
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    metadata_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    recording_url: Mapped[str | None] = mapped_column(String(512), nullable=True)


class TranscriptUtterance(Base):
    __tablename__ = "transcript_utterances"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    test_id: Mapped[str] = mapped_column(String(36), ForeignKey("test_cases.id"), nullable=False)
    speaker: Mapped[str] = mapped_column(String(32), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class AnalysisReport(Base):
    __tablename__ = "analysis_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    test_id: Mapped[str] = mapped_column(String(36), ForeignKey("test_cases.id"), nullable=False, unique=True)
    overall_result: Mapped[str] = mapped_column(String(32), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    criteria_evaluation: Mapped[list[dict]] = mapped_column(JSON, nullable=False, default=list)
    quality_assessment: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    issues: Mapped[list[dict]] = mapped_column(JSON, nullable=False, default=list)
    suggestions: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    raw_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    overall_sentiment: Mapped[str] = mapped_column(String(16), nullable=False, default="Neutral")
    sentiment_score: Mapped[int] = mapped_column(Integer, nullable=False, default=50)
    key_topics: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    intent: Mapped[str] = mapped_column(String(255), nullable=False, default="Unknown")
