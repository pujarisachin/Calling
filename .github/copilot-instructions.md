# AI Voice Bot Testing Platform - Workspace Instructions

## Project Overview
Fullstack application for automated voice call testing with AI. Backend orchestrates Twilio calls, transcription, and LLM-based analysis. Frontend provides test creation and results UI.

## Code Style & Patterns

### Backend (Python/FastAPI)
- **Framework**: FastAPI with Pydantic V2 (see [main.py](../backend/app/main.py))
- **Database**: SQLAlchemy 2.0 with manual schema migration (`_add_missing_columns()` pattern in startup)
- **Services**: Repository pattern with static methods (see [test_repository.py](../backend/app/repositories/test_repository.py))
- **Config**: Settings via environment variables using `pydantic-settings` and `.env` loading
- **Validation**: Pydantic schemas in [schemas.py](../backend/app/db/schemas.py) for request/response validation

### Frontend (React/Vite)
- **State Management**: useState for form/screen state, useMemo for computed values (see [App.jsx](../frontend/src/App.jsx) line 30-35)
- **Component Pattern**: Single App.jsx with screen-based conditional rendering (create/running/results)
- **Polling**: useEffect hooks poll `/api/tests/{testId}/result` every 2 seconds during test execution
- **Error Handling**: Controlled error state with user-friendly messages

## Architecture

### System Design
Service-oriented monolith with strict layer separation:
```
API Routes → Services Layer → Data Layer (SQLAlchemy + Repository)
```

**Main Services** (see [backend/app/services/](../backend/app/services/)):
- `call_orchestrator.py`: Orchestrates test execution flow
- `twilio_service.py`: Outbound call initiation and webhook integration
- `openai_realtime_service.py`: Transcript and analysis via OpenAI (with fallbacks)
- `conversation_manager.py`: Manages conversational state
- `transcript_service.py`: Transcript persistence and retrieval
- `analysis_engine.py`: Criteria evaluation and report scoring
- `report_generator.py`: Formats analysis into structured reports

### Data Flow
1. Frontend: User creates test → POST `/api/tests`
2. Backend: `call_orchestrator.create_test()` → initiates Twilio call
3. Backend: Twilio webhooks update call status (POST `/api/webhooks/call-status`)
4. Frontend: Polls `/api/tests/{testId}/result` every 2s until completion
5. Backend: After call ends, `call_orchestrator` triggers transcript + analysis
6. Frontend: Displays report with criteria evaluation

## Build & Test

### Backend Setup
```bash
# Install dependencies
pip install -r backend/requirements.txt

# Run development server (requires .env with TWILIO_ACCOUNT_SID, OPENAI_API_KEY)
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
# Install dependencies
cd frontend
npm install

# Development server
npm run dev

# Production build
npm run build
```

### Docker Deployment
```bash
# Full stack using docker-compose
docker-compose up --build

# Backend: http://localhost:8000
# Frontend: http://localhost:5173 (dev) or 80 (production)
```

### Testing
- No automated test suite currently; manual testing via frontend UI
- Unit tests skeleton exists in [tests.py](../backend/api/routes/tests.py)

## Project Conventions

### Environment Variables (No `.env` in git)
Required variables (see fallbacks in [config.py](../backend/app/core/config.py)):
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- `OPENAI_API_KEY`, `OPENAI_REALTIME_MODEL`
- `DATABASE_URL` (default: `sqlite:///./test.db`)
- `LOG_LEVEL` (default: `INFO`)

### Database Migration Strategy
No ORM migration tool (Alembic not used). Schema updates:
1. Modify model in [models.py](../backend/app/db/models.py)
2. Add manual ALTER TABLE logic to `_add_missing_columns()` in [main.py](../backend/app/main.py#L26)
3. SQLite `create_all()` handles fresh instances; existing DBs require manual patches

### Response Format
- Success: `{"status": "success", "data": {...}}`
- Errors: `{"status": "error", "error": "message"}` (via exception handlers)
- All APIs return Pydantic-validated responses (see [schemas.py](../backend/app/db/schemas.py))

## Integration Points

### Twilio
- **Call Initiation**: [twilio_service.py](../backend/app/services/twilio_service.py) uses `TwilioClient.calls.create()`
- **Webhooks**: POST callbacks at `/api/webhooks/call-status` and `/api/webhooks/call-answer`
- **Fallback**: If credentials missing, simulates call with mock status progression
- **Media Stream**: Ready-to-extend framework for WebSocket audio bridge (see comments in `twilio_service.py`)

### OpenAI
- **Transcription**: GPT-4.1-mini for call analysis (or fallback heuristics if API key missing)
- **Models**: See `OPENAI_REALTIME_MODEL` in config; currently uses production endpoint
- **Error Handling**: Graceful degradation with fallback analysis if OpenAI unavailable

### Database
- **Schema**: 4 entities - TestCase, CallSession, TranscriptUtterance, AnalysisReport
- **Relationships**: Cascade deletes configured; use repository static methods for CRUD
- **Defaults**: UUID primary keys and datetime-tz aware timestamps (UTC)

## Security

### Current Gaps ⚠️
- **No authentication**: All endpoints public (no API keys, OAuth, or user auth)
- **CORS**: Allows `origins=["*"]` — restrict in production
- **Webhook Validation**: Twilio webhooks not signature-verified
- **Rate Limiting**: None implemented

### Best Practices
- Inject credentials via environment variables (12-factor app pattern)
- Never log sensitive data (check logging in [logging.py](../backend/app/core/logging.py))
- Treat `.env` files as `.gitignore`d

### Recommendations for Future Work
1. Add Twilio webhook signature verification using `twilio.request_validator`
2. Implement OAuth2 with JWT tokens in FastAPI
3. Add rate limiting middleware (e.g., `slowapi`)
4. Audit CORS settings for production (whitelist specific origins)
