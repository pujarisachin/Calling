from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from twilio.base.exceptions import TwilioException
from twilio.rest import Client

from app.core.config import Settings

logger = logging.getLogger(__name__)


@dataclass
class OutboundCallResult:
    provider_call_sid: str
    status: str
    simulated: bool


class TwilioService:
    def __init__(self, settings: Settings):
        self.settings = settings

    def _build_client(self) -> Client | None:
        account_sid = self.settings.twilio_account_sid
        auth_token = self.settings.twilio_auth_token
        api_key_sid = self.settings.twilio_api_key_sid
        api_key_secret = self.settings.twilio_api_key_secret

        if account_sid and not account_sid.startswith("AC"):
            logger.warning("TWILIO_ACCOUNT_SID does not start with 'AC'.")
        if api_key_sid and not api_key_sid.startswith("SK"):
            logger.warning("TWILIO_API_KEY_SID does not start with 'SK'.")

        if account_sid and api_key_sid and api_key_secret:
            return Client(api_key_sid, api_key_secret, account_sid)
        if account_sid and auth_token:
            return Client(account_sid, auth_token)
        return None

    def start_outbound_call(self, to_phone_number: str) -> OutboundCallResult:
        client = self._build_client()
        if client is None or not self.settings.twilio_from_number:
            logger.warning("Twilio credentials not configured. Using simulated call mode.")
            return OutboundCallResult(
                provider_call_sid="SIMULATED_CALL_SID",
                status="in-progress",
                simulated=True,
            )

        try:
            create_kwargs: dict = {
                "to": to_phone_number,
                "from_": self.settings.twilio_from_number,
            }

            # If public webhook URLs are unavailable (e.g., corp policy blocks tunnels),
            # use inline TwiML so outbound calls still work without ngrok.
            if self.settings.twilio_answer_url:
                create_kwargs["url"] = self.settings.twilio_answer_url
            else:
                hold_seconds = max(5, min(self.settings.twilio_inline_hold_seconds, 600))
                reminder_count = max(0, hold_seconds // 15)
                reminders = "".join(
                    "<Pause length=\"15\"/><Say>This is offline hold mode. Live two-way AI conversation is not active.</Say>"
                    for _ in range(reminder_count)
                )
                create_kwargs[
                    "twiml"
                ] = (
                    "<Response>"
                    "<Say>Automated voice bot test call started.</Say>"
                    "<Pause length=\"1\"/>"
                    "<Say>Live audio bridge is not configured in this mode. The line will stay open briefly.</Say>"
                    f"{reminders}"
                    f"<Pause length=\"{max(1, hold_seconds % 15)}\"/>"
                    "<Say>Test window has ended. Goodbye.</Say>"
                    "</Response>"
                )

            if self.settings.twilio_status_callback_url:
                create_kwargs["status_callback"] = self.settings.twilio_status_callback_url
                create_kwargs["status_callback_event"] = ["initiated", "ringing", "answered", "completed"]
                create_kwargs["status_callback_method"] = "POST"

            call = client.calls.create(**create_kwargs)
            return OutboundCallResult(
                provider_call_sid=call.sid,
                status=call.status,
                simulated=False,
            )
        except TwilioException as exc:
            logger.exception("Twilio outbound call failed: %s", exc)
            message = f"Twilio call failed: {exc}"
            if "HTTP 401" in str(exc) or "Authentication Error" in str(exc):
                message += (
                    " Verify Twilio credentials: use either "
                    "TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN or "
                    "TWILIO_ACCOUNT_SID + TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET."
                )
            raise RuntimeError(message) from exc

    def get_call_status(self, provider_call_sid: str) -> dict[str, Any] | None:
        client = self._build_client()
        if client is None or provider_call_sid == "SIMULATED_CALL_SID":
            return None

        try:
            call = client.calls(provider_call_sid).fetch()
            duration_seconds = None
            if call.duration and str(call.duration).isdigit():
                duration_seconds = int(call.duration)

            return {
                "status": call.status,
                "duration_seconds": duration_seconds,
                "answered_by": call.answered_by,
                "end_time": call.end_time.isoformat() if call.end_time else None,
            }
        except TwilioException as exc:
            logger.warning("Failed to fetch Twilio call status for %s: %s", provider_call_sid, exc)
            return None
