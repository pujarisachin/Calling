from __future__ import annotations

from app.db.schemas import AnalysisResult


class ReportGenerator:
    @staticmethod
    def normalize_analysis(data: dict) -> AnalysisResult:
        return AnalysisResult.model_validate(data)
