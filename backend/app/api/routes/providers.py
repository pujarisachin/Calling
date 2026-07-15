from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from twilio.base.exceptions import TwilioException
from twilio.rest import Client

from app.core.config import get_settings
from app.db.database import get_db
from app.repositories.credential_repository import CredentialRepository

router = APIRouter(prefix="/api/providers", tags=["providers"])


class TwilioCredentialRequest(BaseModel):
    account_sid: str
    auth_token: str
    phone_number: str


class OpenAICredentialRequest(BaseModel):
    api_key: str
    model: str | None = None


def _mask(value: str | None) -> str | None:
    if not value:
        return None
    if len(value) <= 4:
        return "*" * len(value)
    return f"{'*' * (len(value) - 4)}{value[-4:]}"


@router.get("/credentials")
def get_credentials(db: Session = Depends(get_db)) -> dict:
    settings = get_settings()
    twilio_row = CredentialRepository.get(db, "twilio")
    openai_row = CredentialRepository.get(db, "openai")

    twilio_cfg = (twilio_row.config if twilio_row else {}) or {}
    openai_cfg = (openai_row.config if openai_row else {}) or {}

    return {
        "twilio": {
            "account_sid": _mask(twilio_cfg.get("account_sid")),
            "phone_number": twilio_cfg.get("phone_number"),
            "using_custom_credentials": bool(twilio_cfg.get("account_sid") and twilio_cfg.get("auth_token")),
            "default_configured": bool(settings.twilio_account_sid and settings.twilio_auth_token),
        },
        "openai": {
            "api_key": _mask(openai_cfg.get("api_key")),
            "model": openai_cfg.get("model") or settings.openai_model,
            "using_custom_credentials": bool(openai_cfg.get("api_key")),
            "default_configured": bool(settings.openai_api_key),
        },
    }


@router.put("/credentials/twilio", status_code=status.HTTP_200_OK)
def update_twilio_credentials(payload: TwilioCredentialRequest, db: Session = Depends(get_db)) -> dict:
    CredentialRepository.upsert(db, "twilio", payload.model_dump())
    return {"status": "saved"}


@router.put("/credentials/openai", status_code=status.HTTP_200_OK)
def update_openai_credentials(payload: OpenAICredentialRequest, db: Session = Depends(get_db)) -> dict:
    existing = CredentialRepository.get(db, "openai")
    config = dict(existing.config) if existing and existing.config else {}
    config["api_key"] = payload.api_key
    if payload.model:
        config["model"] = payload.model
    CredentialRepository.upsert(db, "openai", config)
    return {"status": "saved"}


@router.delete("/credentials/{provider_type}", status_code=status.HTTP_200_OK)
def clear_credentials(provider_type: str, db: Session = Depends(get_db)) -> dict:
    if provider_type not in ("twilio", "openai"):
        raise HTTPException(status_code=404, detail="Unknown provider type")
    CredentialRepository.delete(db, provider_type)
    return {"status": "cleared"}


@router.post("/credentials/twilio/test-connection")
def test_twilio_connection(payload: TwilioCredentialRequest) -> dict:
    try:
        client = Client(payload.account_sid, payload.auth_token)
        client.api.accounts(payload.account_sid).fetch()
    except TwilioException as exc:
        raise HTTPException(status_code=400, detail=f"Twilio connection failed: {exc}") from exc
    return {"status": "connected"}
