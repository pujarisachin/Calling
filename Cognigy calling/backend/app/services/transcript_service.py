from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import TranscriptUtterance


class TranscriptService:
    @staticmethod
    def save_transcript(db: Session, test_id: str, transcript_items: list[dict]) -> None:
        for item in transcript_items:
            db.add(
                TranscriptUtterance(
                    test_id=test_id,
                    speaker=item["speaker"],
                    text=item["text"],
                    timestamp=item["timestamp"],
                )
            )
        db.commit()

    @staticmethod
    def get_transcript(db: Session, test_id: str) -> list[TranscriptUtterance]:
        stmt = (
            select(TranscriptUtterance)
            .where(TranscriptUtterance.test_id == test_id)
            .order_by(TranscriptUtterance.timestamp.asc())
        )
        return list(db.scalars(stmt).all())

    @staticmethod
    def append_utterance(db: Session, test_id: str, speaker: str, text: str) -> None:
        db.add(
            TranscriptUtterance(
                test_id=test_id,
                speaker=speaker,
                text=text,
                timestamp=datetime.utcnow(),
            )
        )
        db.commit()
