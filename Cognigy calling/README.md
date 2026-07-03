# AI Voice Bot Testing Platform

This project provides a modular baseline implementation of an AI Voice Bot Testing Agent with separate backend and frontend folders.

## Project Structure

- backend: FastAPI service, Twilio integration hooks, OpenAI integration, transcript storage, analysis engine, report APIs
- frontend: React app with 3 screens (Create Test, Running Test, Test Results)

## Backend (FastAPI + SQLite)

### Features Implemented

- Create test definitions with:
  - Target phone number
  - Test name
  - Scenario
  - Expected flow (optional)
  - Success criteria
  - Additional instructions (optional)
- Async test execution orchestration:
  - Creates outbound call via Twilio client (or simulated mode if Twilio env vars are missing)
  - Generates conversation transcript via OpenAI (or fallback transcript)
  - Runs LLM analysis (or fallback heuristic analysis)
  - Persists test, call metadata, transcript, and analysis report in SQLite
- Twilio webhook endpoints:
  - Status callback endpoint
  - Answer callback endpoint (TwiML placeholder ready for media stream bridge)
- Report endpoint returning:
  - Call status, duration, metadata
  - Transcript with speaker labels and timestamps
  - Overall result, score, summary, detailed criteria evaluation, issues, suggestions, confidence

### Backend Modules

- app/api: HTTP routes
- app/core: config and logging
- app/db: SQLAlchemy models, schema contracts, DB session
- app/repositories: DB access helpers
- app/services:
  - twilio_service
  - openai_realtime_service
  - conversation_manager
  - transcript_service
  - analysis_engine
  - report_generator
  - call_orchestrator

### Backend Setup

1. Open terminal in backend folder.
2. Create and activate a Python 3.12+ virtual environment.
3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Create env file from template:

```bash
copy .env.example .env
```

5. Run API:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

6. Verify health endpoint:

- GET http://localhost:8000/health

## Frontend (React + Vite)

### Features Implemented

- Create Test screen with full form input
- Running Test screen with status polling
- Test Results screen showing:
  - call status
  - duration
  - transcript
  - overall result
  - score
  - summary
  - criteria evaluation
  - issues
  - suggestions

### Frontend Setup

1. Open terminal in frontend folder.
2. Install dependencies:

```bash
npm install
```

3. Create env file:

```bash
copy .env.example .env
```

4. Start dev server:

```bash
npm run dev
```

By default, frontend expects backend at http://localhost:8000.

## API Endpoints

- POST /api/tests
  - Creates test and starts execution in background
- GET /api/tests/{test_id}
  - Fetches full test result payload
- POST /api/webhooks/twilio/status
  - Twilio status updates
- POST /api/webhooks/twilio/answer
  - Twilio answer TwiML callback

## Environment Variables

See backend/.env.example and frontend/.env.example.

Required for live integrations:

- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_FROM_NUMBER
- OPENAI_API_KEY

Optional when using a public tunnel:

- TWILIO_STATUS_CALLBACK_URL
- TWILIO_ANSWER_URL

## Notes on Realtime Voice Bridging

This version includes integration boundaries and Twilio webhook support, plus OpenAI-driven transcript/analysis generation. For full production call-audio bridging with OpenAI Realtime API, implement Twilio Media Streams in the answer webhook flow and connect stream audio bidirectionally to OpenAI Realtime sessions. The current architecture is intentionally modular so this can be added without changing API contracts.

## Running Without Ngrok (Company-Restricted Networks)

If your network blocks ngrok/cloud tunnels, outbound calling can still run.

- Leave `TWILIO_ANSWER_URL` empty in `backend/.env`.
- Leave `TWILIO_STATUS_CALLBACK_URL` empty in `backend/.env`.

In this mode, backend uses inline TwiML for call initiation, so Twilio can place the outbound call without public webhook access. You will still get test/report results through the app's orchestration and transcript/analysis flow.

Notes for Twilio trial accounts:

- Twilio trial inserts a mandatory announcement and may require DTMF key press before call continuation.
- This behavior cannot be removed on trial accounts.

In inline fallback mode, call hold duration is configurable via `TWILIO_INLINE_HOLD_SECONDS` (default `45`). Increase it if you need more time to interact after the trial prompt.

Important: no-tunnel mode is not a live two-way voice bridge. It keeps the call open and runs backend test orchestration, but it cannot stream your speech to OpenAI Realtime or stream AI audio back into the call. For live conversational audio, you must run with a publicly reachable webhook/media stream endpoint.
