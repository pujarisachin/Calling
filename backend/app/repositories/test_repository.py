from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import AnalysisReport, CallSession, TestCase


class TestRepository:
    @staticmethod
    def create_test(
        db: Session,
        name: str,
        phone_number: str,
        scenario: str,
        expected_flow: str | None,
        success_criteria: list[str],
        additional_instructions: str | None,
        test_data: str | None = None,
        persona_instructions: str | None = None,
        enable_recording: bool = False,
    ) -> TestCase:
        test_case = TestCase(
            name=name,
            phone_number=phone_number,
            scenario=scenario,
            expected_flow=expected_flow,
            success_criteria=success_criteria,
            additional_instructions=additional_instructions,
            test_data=test_data,
            persona_instructions=persona_instructions,
            enable_recording=enable_recording,
        )
        db.add(test_case)
        db.flush()

        call_session = CallSession(test_id=test_case.id, status="queued")
        db.add(call_session)
        db.commit()
        db.refresh(test_case)
        return test_case

    @staticmethod
    def get_test(db: Session, test_id: str) -> TestCase | None:
        return db.get(TestCase, test_id)

    @staticmethod
    def get_call_session(db: Session, test_id: str) -> CallSession | None:
        stmt = select(CallSession).where(CallSession.test_id == test_id)
        return db.scalar(stmt)

    @staticmethod
    def get_analysis_report(db: Session, test_id: str) -> AnalysisReport | None:
        stmt = select(AnalysisReport).where(AnalysisReport.test_id == test_id)
        return db.scalar(stmt)

    @staticmethod
    def list_tests(db: Session, skip: int = 0, limit: int = 50) -> tuple[list[TestCase], int]:
        total = db.scalar(select(func.count()).select_from(TestCase)) or 0
        stmt = (
            select(TestCase)
            .order_by(TestCase.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        items = list(db.scalars(stmt).all())
        return items, total
