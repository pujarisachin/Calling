# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AI Voice Bot Testing Platform** — A fullstack application for automated voice call testing with AI-powered analysis. The backend orchestrates Twilio outbound calls, generates transcripts via OpenAI, and performs LLM-based analysis against success criteria. The frontend provides three-screen UI for test creation, live status monitoring, and detailed results.

**Tech Stack:**
- Backend: FastAPI + SQLAlchemy 2.0 + SQLite
- Frontend: React 18 + Vite
- Integrations: Twilio (calls), OpenAI (transcription & analysis)
- Deployment: Docker + docker-compose

## Architecture

### System Design

Service-oriented monolith with strict layer separation:
```
HTTP Routes → Services Layer → Data Layer (Repository + SQLAlchemy)
```

**4 Core Data Models** ([backend/app/db/models.py](backend/app/db/models.py)):
- `TestCase`: Test definition with scenario, criteria, and call parameters
- `CallSession`: Twilio call metadata and status lifecycle
- `TranscriptUtterance`: Transcript lines with speaker labels and timestamps
- `AnalysisReport`: LLM analysis result with score, issues, and suggestions

**6 Key Services** ([backend/app/services/](backend/app/services/)):
- `call_orchestrator.py`: Orchestrates test execution flow (test → call → transcript → analysis)
- `twilio_service.py`: Call initiation and webhook integration; auto-detects simulated mode if credentials missing
- `openai_realtime_service.py`: Handles transcription and analysis via OpenAI; graceful fallback if API unavailable
- `conversation_manager.py`: Manages conversational turn-taking logic
- `transcript_service.py`: Persistence and retrieval of call transcripts
- `analysis_engine.py`: Evaluates success criteria and generates scoring logic

**Data Flow:**
1. User creates test via frontend form → `POST /api/tests`
2. Backend calls `CallOrchestrator.run_test()` which initiates Twilio call
3. Twilio webhooks update call status at `POST /api/webhooks/twilio/status`
4. Frontend polls `/api/tests/{test_id}` every 3 seconds
5. Once call completes, backend generates transcript and analysis
6. Frontend displays full report with criteria evaluation

### Database Migration Strategy

**No migration tool (Alembic)** — SQLAlchemy `create_all()` for fresh DBs, manual patches for existing:
1. Modify model in `models.py`
2. Add `ALTER TABLE` logic to `_add_missing_columns()` in [backend/app/main.py:26](backend/app/main.py)
3. Deployed DBs auto-patch on startup

Example: `enable_recording` field was added by patching `_add_missing_columns()` to add the column at server startup.

### Configuration & Environment Variables

Settings loaded via [backend/app/core/config.py](backend/app/core/config.py) using `pydantic-settings`. `.env` file is `.gitignore`d.

**Required for real integration:**
```
TWILIO_ACCOUNT_SID=<sid>
TWILIO_AUTH_TOKEN=<token>
TWILIO_FROM_NUMBER=+1234567890
OPENAI_API_KEY=sk-...
```

**Optional (fallbacks to local defaults):**
- `DATABASE_URL` (default: `sqlite:///./voice_test.db`)
- `LOG_LEVEL` (default: `INFO`)
- `TWILIO_STATUS_CALLBACK_URL`, `TWILIO_ANSWER_URL` (for webhook routing)
- `TWILIO_INLINE_HOLD_SECONDS` (default: 45)
- `MAX_CALL_DURATION_SECONDS` (default: 120)

**Fallback Behavior:**
- Missing Twilio credentials → calls run in simulated mode (no actual Twilio calls)
- Missing OpenAI API key → fallback transcript/analysis using heuristics

## Common Development Commands

### Backend Setup & Run

```bash
# Navigate to backend
cd backend

# Create virtual environment (Python 3.12+)
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file from template
cp .env.example .env

# Run development server (hot-reload enabled)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Verify health endpoint
curl http://localhost:8000/health
```

### Frontend Setup & Run

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Development server (http://localhost:5173)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Docker Deployment

```bash
# Build and run full stack
docker-compose up --build

# Backend: http://localhost:8000
# Frontend: http://localhost:5173 (dev) or http://localhost (production)

# Stop
docker-compose down
```

## Key API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Service health check |
| `/api/tests` | POST | Create and start test |
| `/api/tests/{test_id}` | GET | Fetch test result (call status, transcript, analysis) |
| `/api/webhooks/twilio/status` | POST | Twilio status callback (call status updates) |
| `/api/webhooks/twilio/answer` | POST | Twilio answer callback (TwiML placeholder, media stream ready) |
| `/api/tests/{test_id}/end` | POST | Manually end running call |

**Response Format:**
- Success: `{"status": "success", "data": {...}}`
- Error: `{"status": "error", "error": "message"}`
- All responses validated via Pydantic schemas ([backend/app/db/schemas.py](backend/app/db/schemas.py))

## Code Patterns

### Backend

**Repository Pattern** — Static methods for CRUD; see [backend/app/repositories/test_repository.py](backend/app/repositories/test_repository.py):
```python
test = TestRepository.create(db, phone_number="...", scenario="...")
result = TestRepository.get_by_id(db, test_id)
```

**Config Loading** — Always use `get_settings()` from [backend/app/core/config.py](backend/app/core/config.py):
```python
from app.core.config import get_settings
settings = get_settings()
twilio_account = settings.twilio_account_sid
```

**Service Injection** — Services instantiated in routes and passed to orchestrators; supports testing and mocking.

### Frontend

**Screen State** — Single `useState("create"|"running"|"results")` drives conditional rendering (see [frontend/src/App.jsx:23-24](frontend/src/App.jsx)):
- `"create"`: Test creation form
- `"running"`: Live polling display with live transcript
- `"results"`: Final report with analysis

**Polling** — `useEffect` polls `/api/tests/{testId}` every 3 seconds during `"running"` state (see [frontend/src/App.jsx:37-61](frontend/src/App.jsx)).

**Error Handling** — Global `error` state displayed at bottom of page; cleared on form reset.

## Integration Points

### Twilio

- **Call Initiation** — [backend/app/services/twilio_service.py](backend/app/services/twilio_service.py) uses `TwilioClient.calls.create()`
- **Simulated Mode** — If credentials missing, auto-generates fake call SID and simulates status progression
- **Webhooks** — Status and answer callbacks expected at `/api/webhooks/twilio/{status,answer}`
- **Recording** — Enabled via `enable_recording` field in TestCase; Twilio records if credentials valid
- **Media Stream Ready** — Framework ready for WebSocket audio bridge to OpenAI Realtime (not yet implemented)

### OpenAI

- **Models Used:**
  - `gpt-4.1-mini` — Transcript generation and analysis (configurable via `OPENAI_MODEL`)
  - `gpt-realtime-2025-08-28` — Future realtime audio bridge (configured in docker-compose)
- **Fallback** — If API key missing, uses heuristic analysis on transcript
- **Error Handling** — Catches API errors, logs, continues with fallback

## Security Notes

⚠️ **Current Gaps (mitigations needed for production):**
- No authentication (all endpoints public)
- CORS allows `origins=["*"]` (restrict in production)
- Twilio webhooks not signature-verified
- No rate limiting

**Best Practices in Place:**
- Credentials injected via environment variables (12-factor app)
- `.env` files excluded from git
- No sensitive data logged (see [backend/app/core/logging.py](backend/app/core/logging.py))

## Testing

**No automated test suite currently.** Manual testing via frontend UI:
1. Fill form → Start Test
2. Monitor live transcript on "Running" screen
3. View final analysis on "Results" screen

To add unit tests:
- Backend: Use pytest + SQLAlchemy in-memory SQLite
- Frontend: Use Vitest + React Testing Library
- Mock Twilio/OpenAI responses

## Useful File References

| File | Purpose |
|------|---------|
| [backend/app/main.py](backend/app/main.py) | FastAPI app setup, database migration on startup |
| [backend/app/api/routes/tests.py](backend/app/api/routes/tests.py) | Test creation, result fetching, call end endpoints |
| [backend/app/services/call_orchestrator.py](backend/app/services/call_orchestrator.py) | Orchestrates test flow: call → transcript → analysis |
| [backend/app/services/openai_realtime_service.py](backend/app/services/openai_realtime_service.py) | Transcript and analysis generation |
| [backend/app/db/models.py](backend/app/db/models.py) | SQLAlchemy ORM models (TestCase, CallSession, etc.) |
| [frontend/src/App.jsx](frontend/src/App.jsx) | Single-component React app with three screens |
| [frontend/src/api.js](frontend/src/api.js) | HTTP client for backend API |
| [docker-compose.yml](docker-compose.yml) | Full-stack deployment configuration |

## Known Limitations & Future Work

- **No media stream bridging** — Currently transcript/analysis only; ready to add OpenAI Realtime audio bridge
- **No authentication** — All endpoints public; add OAuth2 + JWT for production
- **SQLite only** — Fine for dev/POC; migrate to PostgreSQL for production at scale
- **Inline TwiML fallback** — Useful for networks blocking ngrok; lacks live two-way voice (see README.md for details)

## When Adding Features

1. **New test field** → Add to `TestCase` model → Patch `_add_missing_columns()` → Update frontend form
2. **New analysis metric** → Extend `AnalysisReport` model → Update `analysis_engine.py` → Render in frontend
3. **New Twilio feature** → Add to `twilio_service.py` → Update webhook routes → Test via UI
4. **Database schema** → Never use Alembic; use manual ALTER TABLE in `_add_missing_columns()`
