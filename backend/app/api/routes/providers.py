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


class CarrierCredentialRequest(BaseModel):
    account_sid: str = ""
    auth_token: str = ""
    phone_number: str = ""


CARRIERS = {
    "twilio": "Twilio",
    "plivo": "Plivo",
    "vonage": "Vonage",
    "nice_cxone": "Nice CXone",
}


class AIProviderCredentialRequest(BaseModel):
    api_key: str = ""
    model: str = ""
    enabled: bool = True


AI_PROVIDERS = {
    "openai": {"name": "OpenAI", "category": "LLM Models", "default_model": "gpt-4.1-mini"},
    "anthropic": {"name": "Anthropic", "category": "LLM Models", "default_model": "claude-3"},
    "deepgram": {"name": "Deepgram", "category": "STT Models", "default_model": "nova-2"},
    "elevenlabs": {"name": "ElevenLabs", "category": "TTS Models", "default_model": "multilingual-v2"},
}


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


def _carrier_key(carrier_id: str) -> str:
    if carrier_id not in CARRIERS:
        raise HTTPException(status_code=404, detail="Unknown carrier")
    return carrier_id


@router.get("/carriers")
def list_carriers(db: Session = Depends(get_db)) -> dict:
    carriers = []
    for carrier_id, name in CARRIERS.items():
        row = CredentialRepository.get(db, carrier_id)
        config = (row.config if row else {}) or {}
        configured = bool(config.get("account_sid") and config.get("auth_token"))
        carriers.append(
            {
                "id": carrier_id,
                "name": name,
                "status": "Connected" if configured else "Disconnected",
                "account_sid": _mask(config.get("account_sid")),
                "phone_number": config.get("phone_number"),
                "updated_at": row.updated_at.isoformat() if row else None,
            }
        )
    return {"carriers": carriers}


@router.put("/carriers/{carrier_id}")
def update_carrier(carrier_id: str, payload: CarrierCredentialRequest, db: Session = Depends(get_db)) -> dict:
    carrier_id = _carrier_key(carrier_id)
    CredentialRepository.upsert(db, carrier_id, payload.model_dump())
    return {"status": "saved"}


@router.delete("/carriers/{carrier_id}")
def delete_carrier(carrier_id: str, db: Session = Depends(get_db)) -> dict:
    carrier_id = _carrier_key(carrier_id)
    CredentialRepository.delete(db, carrier_id)
    return {"status": "cleared"}


@router.post("/carriers/{carrier_id}/test-connection")
def test_carrier_connection(carrier_id: str, db: Session = Depends(get_db)) -> dict:
    carrier_id = _carrier_key(carrier_id)
    row = CredentialRepository.get(db, carrier_id)
    config = (row.config if row else {}) or {}
    account_sid = config.get("account_sid")
    auth_token = config.get("auth_token")
    phone_number = config.get("phone_number")

    if not account_sid or not auth_token:
        raise HTTPException(status_code=400, detail=f"{CARRIERS[carrier_id]} credentials are incomplete. Configure Account SID and Auth Token first.")
    if not phone_number:
        raise HTTPException(status_code=400, detail=f"Phone number is required for {CARRIERS[carrier_id]}")

    if carrier_id == "twilio":
        try:
            client = Client(account_sid, auth_token)
            client.api.accounts(account_sid).fetch()
        except TwilioException as exc:
            raise HTTPException(status_code=400, detail=f"Twilio connection failed: {exc}") from exc

    return {"status": "connected"}


def _ai_provider_key(provider_id: str) -> str:
    if provider_id not in AI_PROVIDERS:
        raise HTTPException(status_code=404, detail="Unknown AI provider")
    return provider_id


@router.get("/ai")
def list_ai_providers(db: Session = Depends(get_db)) -> dict:
    settings = get_settings()
    providers = []
    for provider_id, meta in AI_PROVIDERS.items():
        row = CredentialRepository.get(db, provider_id)
        config = (row.config if row else {}) or {}
        default_key = settings.openai_api_key if provider_id == "openai" else None
        configured = bool(config.get("api_key") or default_key)
        providers.append(
            {
                "id": provider_id,
                "name": meta["name"],
                "category": meta["category"],
                "model": config.get("model") or meta["default_model"],
                "api_key_set": configured,
                "enabled": config.get("enabled", True) if configured else False,
                "updated_at": row.updated_at.isoformat() if row else None,
            }
        )
    return {"providers": providers}


@router.put("/ai/{provider_id}")
def update_ai_provider(provider_id: str, payload: AIProviderCredentialRequest, db: Session = Depends(get_db)) -> dict:
    provider_id = _ai_provider_key(provider_id)
    existing = CredentialRepository.get(db, provider_id)
    config = dict(existing.config) if existing and existing.config else {}
    if payload.api_key:
        config["api_key"] = payload.api_key
    if payload.model:
        config["model"] = payload.model
    config["enabled"] = payload.enabled
    CredentialRepository.upsert(db, provider_id, config)
    return {"status": "saved"}


@router.patch("/ai/{provider_id}/toggle")
def toggle_ai_provider(provider_id: str, db: Session = Depends(get_db)) -> dict:
    provider_id = _ai_provider_key(provider_id)
    existing = CredentialRepository.get(db, provider_id)
    config = dict(existing.config) if existing and existing.config else {}
    config["enabled"] = not config.get("enabled", True)
    CredentialRepository.upsert(db, provider_id, config)
    return {"status": "saved", "enabled": config["enabled"]}


@router.delete("/ai/{provider_id}")
def delete_ai_provider(provider_id: str, db: Session = Depends(get_db)) -> dict:
    provider_id = _ai_provider_key(provider_id)
    CredentialRepository.delete(db, provider_id)
    return {"status": "cleared"}
