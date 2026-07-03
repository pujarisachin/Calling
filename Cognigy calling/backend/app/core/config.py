from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = Field(default="development", alias="APP_ENV")
    app_host: str = Field(default="0.0.0.0", alias="APP_HOST")
    app_port: int = Field(default=8000, alias="APP_PORT")
    app_public_base_url: str | None = Field(default=None, alias="APP_PUBLIC_BASE_URL")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    database_url: str = Field(default="sqlite:///./voice_test.db", alias="DATABASE_URL")

    twilio_account_sid: str | None = Field(default=None, alias="TWILIO_ACCOUNT_SID")
    twilio_auth_token: str | None = Field(default=None, alias="TWILIO_AUTH_TOKEN")
    twilio_api_key_sid: str | None = Field(default=None, alias="TWILIO_API_KEY_SID")
    twilio_api_key_secret: str | None = Field(default=None, alias="TWILIO_API_KEY_SECRET")
    twilio_from_number: str | None = Field(default=None, alias="TWILIO_FROM_NUMBER")
    twilio_status_callback_url: str | None = Field(default=None, alias="TWILIO_STATUS_CALLBACK_URL")
    twilio_answer_url: str | None = Field(default=None, alias="TWILIO_ANSWER_URL")
    twilio_inline_hold_seconds: int = Field(default=45, alias="TWILIO_INLINE_HOLD_SECONDS")

    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4.1-mini", alias="OPENAI_MODEL")
    openai_realtime_model: str = Field(default="gpt-realtime-2025-08-28", alias="OPENAI_REALTIME_MODEL")
    openai_realtime_voice: str = Field(default="alloy", alias="OPENAI_REALTIME_VOICE")


@lru_cache
def get_settings() -> Settings:
    return Settings()
