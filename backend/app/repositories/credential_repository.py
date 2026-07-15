from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from app.db.models import ProviderCredential


class CredentialRepository:
    @staticmethod
    def get(db: Session, provider_type: str) -> ProviderCredential | None:
        return db.get(ProviderCredential, provider_type)

    @staticmethod
    def upsert(db: Session, provider_type: str, config: dict) -> ProviderCredential:
        row = db.get(ProviderCredential, provider_type)
        if row:
            row.config = config
            row.updated_at = datetime.utcnow()
        else:
            row = ProviderCredential(provider_type=provider_type, config=config)
            db.add(row)
        db.commit()
        db.refresh(row)
        return row

    @staticmethod
    def delete(db: Session, provider_type: str) -> bool:
        row = db.get(ProviderCredential, provider_type)
        if not row:
            return False
        db.delete(row)
        db.commit()
        return True
