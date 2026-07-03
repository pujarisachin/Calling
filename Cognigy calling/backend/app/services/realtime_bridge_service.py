from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import dataclass

import websockets
from fastapi import WebSocket
from sqlalchemy import select

from app.core.config import Settings
from app.db.database import SessionLocal
from app.db.models import CallSession, TestCase
from app.services.transcript_service import TranscriptService

logger = logging.getLogger(__name__)


@dataclass
class RealtimeContext:
    test_id: str
    instructions: str


class RealtimeBridgeService:
    def __init__(self, settings: Settings):
        self.settings = settings

    async def bridge_twilio_media(self, twilio_ws: WebSocket) -> None:
        await twilio_ws.accept()

        if not self.settings.openai_api_key:
            logger.error("OPENAI_API_KEY is not configured for realtime bridge.")
            await twilio_ws.close(code=1011)
            return

        openai_url = f"wss://api.openai.com/v1/realtime?model={self.settings.openai_realtime_model}"
        headers = {
            "Authorization": f"Bearer {self.settings.openai_api_key}",
        }

        stream_sid: str | None = None
        call_sid: str | None = None
        active_context: RealtimeContext | None = None
        greeted = False

        try:
            async with websockets.connect(openai_url, additional_headers=headers, max_size=None) as openai_ws:
                await self._send_session_update(openai_ws, None)

                async def twilio_to_openai() -> None:
                    nonlocal stream_sid, call_sid, active_context, greeted
                    while True:
                        message = await twilio_ws.receive_text()
                        event = json.loads(message)
                        event_type = event.get("event")

                        if event_type == "start":
                            start_payload = event.get("start", {})
                            stream_sid = start_payload.get("streamSid") or event.get("streamSid")
                            call_sid = start_payload.get("callSid")
                            custom = start_payload.get("customParameters") or {}
                            test_id = custom.get("test_id")

                            active_context = self._resolve_context(call_sid=call_sid, test_id=test_id)
                            await self._send_session_update(openai_ws, active_context)

                            if not greeted:
                                await openai_ws.send(
                                    json.dumps(
                                        {
                                            "type": "response.create",
                                            "response": {
                                                "modalities": ["audio", "text"],
                                                "instructions": "Greet the callee and begin the test scenario naturally.",
                                            },
                                        }
                                    )
                                )
                                greeted = True
                        elif event_type == "media":
                            media = event.get("media", {})
                            payload = media.get("payload")
                            if payload:
                                await openai_ws.send(
                                    json.dumps(
                                        {
                                            "type": "input_audio_buffer.append",
                                            "audio": payload,
                                        }
                                    )
                                )
                        elif event_type == "stop":
                            break

                async def openai_to_twilio() -> None:
                    while True:
                        raw = await openai_ws.recv()
                        event = json.loads(raw)
                        event_type = event.get("type")

                        if event_type == "response.audio.delta" and stream_sid:
                            await twilio_ws.send_text(
                                json.dumps(
                                    {
                                        "event": "media",
                                        "streamSid": stream_sid,
                                        "media": {"payload": event.get("delta", "")},
                                    }
                                )
                            )
                        elif event_type == "conversation.item.input_audio_transcription.completed":
                            transcript_text = (event.get("transcript") or "").strip()
                            if transcript_text and active_context:
                                self._append_utterance(active_context.test_id, "Target User", transcript_text)
                        elif event_type == "response.audio_transcript.done":
                            transcript_text = (event.get("transcript") or "").strip()
                            if transcript_text and active_context:
                                self._append_utterance(active_context.test_id, "AI Tester", transcript_text)
                        elif event_type == "response.output_text.done":
                            transcript_text = (event.get("text") or "").strip()
                            if transcript_text and active_context:
                                self._append_utterance(active_context.test_id, "AI Tester", transcript_text)

                twilio_task = asyncio.create_task(twilio_to_openai())
                openai_task = asyncio.create_task(openai_to_twilio())
                done, pending = await asyncio.wait(
                    [twilio_task, openai_task],
                    return_when=asyncio.FIRST_COMPLETED,
                )
                for task in pending:
                    task.cancel()
                await asyncio.gather(*pending, return_exceptions=True)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Realtime media bridge failed: %s", exc)
        finally:
            try:
                await twilio_ws.close()
            except Exception:
                pass

    async def _send_session_update(self, openai_ws, context: RealtimeContext | None) -> None:
        instructions = (
            context.instructions
            if context
            else "You are an AI call tester. Have a short, clear voice conversation and gather details before confirming outcomes."
        )
        await openai_ws.send(
            json.dumps(
                {
                    "type": "session.update",
                    "session": {
                        "modalities": ["audio", "text"],
                        "voice": self.settings.openai_realtime_voice,
                        "input_audio_format": "g711_ulaw",
                        "output_audio_format": "g711_ulaw",
                        "input_audio_transcription": {"model": "whisper-1"},
                        "turn_detection": {"type": "server_vad"},
                        "instructions": instructions,
                    },
                }
            )
        )

    def _resolve_context(self, call_sid: str | None, test_id: str | None) -> RealtimeContext | None:
        with SessionLocal() as db:
            test_case = None

            if test_id:
                test_case = db.get(TestCase, test_id)

            if test_case is None and call_sid:
                call_session = db.scalar(select(CallSession).where(CallSession.provider_call_sid == call_sid))
                if call_session:
                    test_case = db.get(TestCase, call_session.test_id)

            if not test_case:
                return None

            instructions = (
                "You are a live AI tester on a phone call. Keep responses concise and natural. "
                f"Scenario: {test_case.scenario}. "
                f"Expected flow: {test_case.expected_flow or 'Not provided'}. "
                f"Success criteria: {', '.join(test_case.success_criteria)}. "
                f"Additional instructions: {test_case.additional_instructions or 'None'}."
            )
            return RealtimeContext(test_id=test_case.id, instructions=instructions)

    def _append_utterance(self, test_id: str, speaker: str, text: str) -> None:
        with SessionLocal() as db:
            TranscriptService.append_utterance(db, test_id, speaker, text)
