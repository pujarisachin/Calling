from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.api.routes.providers import router as providers_router
from app.api.routes.tests import router as tests_router
from app.api.routes.webhooks import router as webhooks_router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.db.database import engine
from app.db.models import Base

settings = get_settings()
configure_logging(settings.log_level)

app = FastAPI(title="AI Voice Bot Testing Platform", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _add_missing_columns() -> None:
    # We use create_all (no migration tool), which never alters existing tables —
    # so columns added to models.py after a DB already exists must be patched in here.
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())

    patches = {
        "test_cases": {
            "test_data": "TEXT",
            "persona_instructions": "TEXT",
            "agent_language": "VARCHAR(16) NOT NULL DEFAULT 'en-US'",
            "enable_recording": "BOOLEAN NOT NULL DEFAULT 0",
        },
        "call_sessions": {
            "recording_url": "VARCHAR(512)",
        },
        "analysis_reports": {
            "overall_sentiment": "VARCHAR(16) NOT NULL DEFAULT 'Neutral'",
            "sentiment_score": "INTEGER NOT NULL DEFAULT 50",
            "key_topics": "JSON DEFAULT '[]'",
            "intent": "VARCHAR(255) NOT NULL DEFAULT 'Unknown'",
        },
    }

    with engine.begin() as connection:
        for table_name, new_columns in patches.items():
            if table_name not in table_names:
                continue
            existing_columns = {col["name"] for col in inspector.get_columns(table_name)}
            for column_name, column_type in new_columns.items():
                if column_name not in existing_columns:
                    connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"))


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    _add_missing_columns()


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok", "service": "ai-voice-bot-testing-backend"}


app.include_router(tests_router)
app.include_router(webhooks_router)
app.include_router(providers_router)
