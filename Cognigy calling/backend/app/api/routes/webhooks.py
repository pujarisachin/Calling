from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Form, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import CallSession

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


@router.post("/twilio/status")
def twilio_status_callback(
    call_sid: str = Form(alias="CallSid"),
    call_status: str = Form(alias="CallStatus"),
    call_duration: str | None = Form(default=None, alias="CallDuration"),
    db: Session = Depends(get_db),
) -> dict:
    call_session = db.scalar(select(CallSession).where(CallSession.provider_call_sid == call_sid))
    if not call_session:
        return {"ok": True}

    call_session.status = call_status
    if call_status in {"completed", "failed", "busy", "no-answer", "canceled"}:
        call_session.completed_at = datetime.utcnow()

    if call_duration and call_duration.isdigit():
        call_session.duration_seconds = int(call_duration)

    db.commit()
    return {"ok": True}


@router.post("/twilio/answer")
def twilio_answer_callback() -> Response:
    # Basic TwiML response. In a production setup, this is where media stream bridging is configured.
    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        "<Response>"
        "<Say voice=\"Polly.Joanna\">Connecting your AI testing agent.</Say>"
        "<Pause length=\"1\"/>"
        "<Say voice=\"Polly.Joanna\">This endpoint is ready for media stream bridge integration.</Say>"
        "</Response>"
    )
    return Response(content=twiml, media_type="application/xml")
