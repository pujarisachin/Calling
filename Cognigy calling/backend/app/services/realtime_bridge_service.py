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
        session_created = asyncio.Event()
        context_resolved = asyncio.Event()
        audio_deltas_sent = 0
        audio_deltas_dropped = 0

        try:
            logger.info("Connecting to OpenAI Realtime: %s", openai_url)
            async with websockets.connect(openai_url, additional_headers=headers, max_size=None) as openai_ws:
                logger.info("OpenAI Realtime WebSocket connected")

                async def twilio_to_openai() -> None:
                    nonlocal stream_sid, call_sid, active_context, greeted
                    while True:
                        message = await twilio_ws.receive_text()
                        event = json.loads(message)
                        event_type = event.get("event")
                        logger.debug("Twilio event: %s", event_type)

                        if event_type == "start":
                            start_payload = event.get("start", {})
                            stream_sid = start_payload.get("streamSid") or event.get("streamSid")
                            call_sid = start_payload.get("callSid")
                            custom = start_payload.get("customParameters") or {}
                            test_id = custom.get("test_id")
                            logger.info("Twilio stream started: stream_sid=%s call_sid=%s test_id=%s", stream_sid, call_sid, test_id)
                            active_context = self._resolve_context(call_sid=call_sid, test_id=test_id)
                            context_resolved.set()
                        elif event_type == "media":
                            # Only forward audio after OpenAI session is ready
                            if session_created.is_set():
                                media = event.get("media", {})
                                payload = media.get("payload")
                                if payload:
                                    await openai_ws.send(
                                        json.dumps({"type": "input_audio_buffer.append", "audio": payload})
                                    )
                        elif event_type == "stop":
                            logger.info("Twilio stream stopped")
                            break

                async def openai_to_twilio() -> None:
                    nonlocal greeted, audio_deltas_sent, audio_deltas_dropped
                    while True:
                        raw = await openai_ws.recv()
                        event = json.loads(raw)
                        event_type = event.get("type")

                        if event_type == "response.output_audio.delta":
                            pass  # high-volume; handled below
                        elif event_type == "error":
                            logger.error("OpenAI ERROR event: %s", json.dumps(event))
                        else:
                            logger.info("OpenAI event: %s | %s", event_type, json.dumps(event))

                        if event_type == "session.created":
                            logger.info("Session created — waiting for Twilio start context")
                            try:
                                await asyncio.wait_for(context_resolved.wait(), timeout=2.0)
                            except asyncio.TimeoutError:
                                logger.warning("Timed out waiting for Twilio start, using default context")
                            await self._send_session_update(openai_ws, active_context)
                            # Inject a synthetic user turn so the model has context to respond to.
                            # Some realtime models require an existing conversation item before
                            # response.create will generate audio. Keep it to a bare greeting so
                            # the model doesn't launch into a scripted monologue — it should say
                            # hello and then let the called bot lead the conversation.
                            logger.info("Injecting trigger message then response.create")
                            await openai_ws.send(json.dumps({
                                "type": "conversation.item.create",
                                "item": {
                                    "type": "message",
                                    "role": "user",
                                    "content": [{"type": "input_text", "text": "(The call has just connected. Say only a brief \"Hello?\" and then stop talking and wait for the other party to speak.)"}],
                                },
                            }))
                            await openai_ws.send(json.dumps({"type": "response.create"}))
                            greeted = True
                            session_created.set()
                        elif event_type == "response.output_audio.delta":
                            delta_b64 = event.get("delta", "")
                            if stream_sid and delta_b64:
                                if audio_deltas_sent == 0:
                                    logger.info("First audio delta → sending to Twilio stream_sid=%s", stream_sid)
                                audio_deltas_sent += 1
                                payload = delta_b64
                                await twilio_ws.send_text(
                                    json.dumps({
                                        "event": "media",
                                        "streamSid": stream_sid,
                                        "media": {"payload": payload},
                                    })
                                )
                            elif not stream_sid:
                                audio_deltas_dropped += 1
                                if audio_deltas_dropped == 1:
                                    logger.warning("Dropping audio delta — stream_sid not yet set (will count silently)")
                        elif event_type == "input_audio_buffer.speech_stopped":
                            logger.info("User speech stopped — requesting response")
                            await openai_ws.send(json.dumps({"type": "response.create"}))
                        elif event_type == "conversation.item.input_audio_transcription.completed":
                            transcript_text = (event.get("transcript") or "").strip()
                            logger.info("User speech transcribed: %s", transcript_text)
                            if transcript_text and active_context:
                                self._append_utterance(active_context.test_id, "Target User", transcript_text)
                        elif event_type == "response.output_audio_transcript.done":
                            transcript_text = (event.get("transcript") or "").strip()
                            logger.info("AI speech transcribed: %s", transcript_text)
                            if transcript_text and active_context:
                                self._append_utterance(active_context.test_id, "AI Tester", transcript_text)
                        elif event_type == "response.done":
                            logger.info(
                                "Response done — audio deltas sent=%d dropped=%d stream_sid=%s",
                                audio_deltas_sent, audio_deltas_dropped, stream_sid,
                            )
                            audio_deltas_sent = 0
                            audio_deltas_dropped = 0
                        elif event_type == "response.output_item.done":
                            # Try to get text from output items if audio transcript not available
                            item = event.get("item", {})
                            for content in item.get("content", []):
                                if content.get("type") == "text":
                                    text = (content.get("text") or "").strip()
                                    if text and active_context:
                                        logger.info("AI text output: %s", text)
                                        self._append_utterance(active_context.test_id, "AI Tester", text)

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
            else (
                "You are a real customer calling a company's automated voice assistant. Never say you are "
                "an AI or a tester. Say a brief hello, then let the assistant lead and respond naturally."
            )
        )
        # gpt-realtime-* models use the newer session schema: session.type must be
        # "realtime" (not "conversation"), and audio config is nested under
        # session.audio.{input,output} rather than top-level fields.
        await openai_ws.send(
            json.dumps(
                {
                    "type": "session.update",
                    "session": {
                        "type": "realtime",
                        "instructions": instructions,
                        "audio": {
                            "input": {
                                "format": {"type": "audio/pcmu"},
                                "turn_detection": {"type": "server_vad"},
                            },
                            "output": {
                                "format": {"type": "audio/pcmu"},
                            },
                        },
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
                "You are a real customer calling a company's automated voice assistant on the phone. "
                "You are NOT a tester, an AI, or a demo — never say you are an AI, testing, or evaluating "
                "anything, even if asked directly; stay in character as a genuine caller. "
                "Speak naturally and concisely, like a real person on a phone call. "
                "You called this number, so let the assistant lead: after your initial greeting, wait for it "
                "to speak first and respond to what it actually says rather than following a fixed script. "
                f"Your goal for this call: {test_case.scenario}. "
                f"Expected conversation flow: {test_case.expected_flow or 'Not provided — improvise naturally toward your goal.'} "
                f"You will consider the call successful if: {', '.join(test_case.success_criteria)}. "
                f"Additional instructions: {test_case.additional_instructions or 'None'}. "
                f"Specific test data to use when asked (e.g. name, DOB, phone/account number) — use exactly as given: "
                f"{test_case.test_data or 'None provided — improvise plausible values if asked.'} "
                f"How you should behave as the caller (tone, pacing, whether to stay silent, special phrasing "
                f"for certain answers, etc.): {test_case.persona_instructions or 'Behave like a cooperative, ordinary caller.'}"
            )
            return RealtimeContext(test_id=test_case.id, instructions=instructions)

    def _append_utterance(self, test_id: str, speaker: str, text: str) -> None:
        with SessionLocal() as db:
            TranscriptService.append_utterance(db, test_id, speaker, text)
