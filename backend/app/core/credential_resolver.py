from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.repositories.credential_repository import CredentialRepository


def build_effective_settings(db: Session) -> Settings:
    """Overlay user-saved Twilio/OpenAI credentials (if any) on top of the .env defaults."""
    base = get_settings()
    overrides: dict = {}

    twilio_row = CredentialRepository.get(db, "twilio")
    twilio_cfg = twilio_row.config if twilio_row else {}
    if twilio_cfg.get("account_sid"):
        overrides["twilio_account_sid"] = twilio_cfg["account_sid"]
    if twilio_cfg.get("auth_token"):
        overrides["twilio_auth_token"] = twilio_cfg["auth_token"]
    if twilio_cfg.get("phone_number"):
        overrides["twilio_from_number"] = twilio_cfg["phone_number"]

    openai_row = CredentialRepository.get(db, "openai")
    openai_cfg = openai_row.config if openai_row else {}
    if openai_cfg.get("api_key"):
        overrides["openai_api_key"] = openai_cfg["api_key"]
    if openai_cfg.get("model"):
        overrides["openai_model"] = openai_cfg["model"]

    if not overrides:
        return base
    return base.model_copy(update=overrides)
