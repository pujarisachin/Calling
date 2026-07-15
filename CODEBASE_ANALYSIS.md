# AI Voice Bot Testing Platform - Codebase Analysis

## Project Overview
**Type**: Full-stack application (Python FastAPI backend + React/Vite frontend)
**Purpose**: Automate voice bot scenario testing with AI-driven conversation simulation, transcript capture, and analysis

---

## 1. CODE STYLE & PATTERNS

### Backend (Python) Patterns

#### Framework & Architecture
- **Framework**: FastAPI (async-first, modern Python web framework)
- **File**: [backend/app/main.py](backend/app/main.py)
  - Uses middleware pattern (`CORSMiddleware`) for cross-origin support
  - Startup event hooks for database initialization
  - Health check endpoint pattern (`/health`)
  - Router inclusion pattern for modular API organization

#### Service-Oriented Architecture
- **Pattern**: Dependency injection via dedicated service classes
- **Example Files**:
  - [backend/app/services/twilio_service.py](backend/app/services/twilio_service.py) - External API wrapper
  - [backend/app/services/call_orchestrator.py](backend/app/services/call_orchestrator.py) - Business logic orchestration
  - [backend/app/services/analysis_engine.py](backend/app/services/analysis_engine.py) - LLM integration
  - [backend/app/services/conversation_manager.py](backend/app/services/conversation_manager.py) - Conversation flow
  - [backend/app/services/openai_realtime_service.py](backend/app/services/openai_realtime_service.py) - Realtime streaming

#### Data Validation Pattern
- **Tool**: Pydantic V2 with BaseModel
- **File**: [backend/app/db/schemas.py](backend/app/db/schemas.py)
  - Input validation: `CreateTestRequest` with Field constraints (min_length, max_length)
  - Output validation: Response models like `TestResultResponse`
  - Literal types for enums: `Literal["Pass", "Partial Pass", "Fail"]`
  - Model configuration: `model_config = {"from_attributes": True}` for ORM mapping

#### Database ORM Pattern
- **Tool**: SQLAlchemy 2.0+ with Mapped types
- **File**: [backend/app/db/models.py](backend/app/db/models.py)
  - Modern declarative syntax with `Mapped[type]` hints
  - `DeclarativeBase` for base model
  - Column defaults: `default=lambda: str(uuid4())` for UUID generation
  - Type-safe column mapping: `mapped_column(String(36), primary_key=True)`
  - Foreign keys: `ForeignKey("test_cases.id")`
  - Temporal tracking: `DateTime` with `default=datetime.utcnow`

#### Configuration Management
- **Tool**: Pydantic Settings
- **File**: [backend/app/core/config.py](backend/app/core/config.py)
  - Environment variable mapping with Field aliases: `alias="TWILIO_ACCOUNT_SID"`
  - `.env` file support via `SettingsConfigDict(env_file=".env")`
  - LRU cache for singleton settings: `@lru_cache`
  - Type-safe config: All fields explicitly typed with defaults
  - Sensitive data: API keys loaded from environment only

#### Error Handling & Fallback Patterns
- **File**: [backend/app/services/analysis_engine.py](backend/app/services/analysis_engine.py) ([Lines 75-110](backend/app/services/analysis_engine.py#L75-L110))
  - Try-except with fallback methods: `_fallback_heuristic_result()`
  - Graceful degradation when LLM unavailable
  - Exception logging with context: `logger.warning("LLM analysis failed, fallback used: %s", exc)`

#### JSON Parsing Pattern
- **File**: [backend/app/services/analysis_engine.py](backend/app/services/analysis_engine.py) ([Lines 64-72](backend/app/services/analysis_engine.py#L64-L72))
  - Multi-strategy JSON extraction: direct parsing → markdown fence extraction → substring search
  - Handles imperfect LLM outputs robustly

#### Repository Pattern
- **File**: [backend/app/repositories/test_repository.py](backend/app/repositories/test_repository.py)
  - Static methods for data access
  - Clear separation: `create_test()`, `get_test()`, `get_call_session()`, `get_analysis_report()`
  - Transactional operations: `db.flush()` before commit for ID retrieval

#### Logging Pattern
- **File**: [backend/app/services/call_orchestrator.py](backend/app/services/call_orchestrator.py)
  - Module-level logger: `logger = logging.getLogger(__name__)`
  - Contextual logging: `logger.info("Connecting to OpenAI Realtime: %s", openai_url)`
  - Exception logging with details: `logger.exception("Test orchestration failed: %s", exc)`

---

### Frontend (JavaScript/React) Patterns

#### State Management
- **File**: [frontend/src/App.jsx](frontend/src/App.jsx) (Lines 1-50)
  - `useState` for form state: default values in `defaultForm` object
  - Screen state machine: `useState("create")` → "running" → "results"
  - Loading states: `loading`, `endingCall`, `error`
  - Memoization for computed state: `useMemo` for `isFinished` logic

#### Form Handling Pattern
- **File**: [frontend/src/App.jsx](frontend/src/App.jsx) (Lines 63-71)
  - Controlled components via `onChange` handler
  - Checkbox and text input differentiation: `type === "checkbox" ? checked : value`
  - Form state as object: `setForm((prev) => ({ ...prev, [name]: value }))`
  - Parsing utility: `parseCriteria()` for multi-line to array conversion

#### API Integration Pattern
- **File**: [frontend/src/api.js](frontend/src/api.js)
  - Smart base URL resolution: `VITE_API_BASE_URL` with localhost fallback
  - Detects cross-origin scenarios (production hosted frontend with localhost backend)
  - Consistent error handling: `if (!response.ok)` checks
  - JSON request/response pattern

#### Polling Pattern for Async Operations
- **File**: [frontend/src/App.jsx](frontend/src/App.jsx) (Lines 36-59)
  - `useEffect` with polling timer
  - Conditional execution: `if (screen !== "running" || !testId) return`
  - Cleanup function: `return () => clearTimeout(timerId)`
  - Terminal state detection: `isFinished` to stop polling
  - 3-second polling interval: `setTimeout(poll, 3000)`

#### Build Configuration
- **File**: [frontend/package.json](frontend/package.json)
  - Vite as build tool (modern ES modules)
  - React 18.3.1 with ReactDOM
  - Minimal dependencies philosophy (only React + ReactDOM)

---

## 2. ARCHITECTURE

### System Design: Microservices-Inspired Monolith

This is a **modular monolith** with service-oriented design, not true microservices:

#### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (React/Vite)                       │
│                    - Test creation form                          │
│                    - Call status polling                         │
│                    - Result display with transcripts            │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP REST + JSON
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ API Routes Layer (api/routes/)                             │ │
│  │  - POST /api/tests → create_test (test_repository)        │ │
│  │  - GET /api/tests/{id} → get_test_result                  │ │
│  │  - POST /api/webhooks/twilio/status → status callback     │ │
│  │  - WebSocket /api/webhooks/twilio/media-stream            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                             │                                    │
│  ┌──────────────────────────┴─────────────────────────────────┐ │
│  │ Service Layer (services/)                                  │ │
│  │  ├─ CallOrchestrator: Coordinates test lifecycle            │ │
│  │  ├─ TwilioService: Outbound call injection                  │ │
│  │  ├─ ConversationManager: Simulated conversation flow        │ │
│  │  ├─ OpenAIRealtimeService: Prompt gen, transcript sim       │ │
│  │  ├─ RealtimeBridgeService: Twilio media ↔ OpenAI Realtime  │ │
│  │  ├─ TranscriptService: Transcript persistence              │ │
│  │  ├─ AnalysisEngine: LLM-based evaluation                    │ │
│  │  └─ ReportGenerator: Normalizes analysis output             │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
│                             │                                    │
│  ┌──────────────────────────┴─────────────────────────────────┐ │
│  │ Data Layer (db/)                                           │ │
│  │  ├─ Database: SQLAlchemy engine + session management        │ │
│  │  ├─ Models: TestCase, CallSession, TranscriptUtterance,    │ │
│  │  │           AnalysisReport (SQLAlchemy ORM)               │ │
│  │  ├─ Schemas: Pydantic request/response models              │ │
│  │  └─ TestRepository: Query patterns                         │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Infrastructure Layer (core/)                               │ │
│  │  ├─ Config: Environment-based with Pydantic Settings       │ │
│  │  └─ Logging: Configured per log_level                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
        │                                    │
        │ HTTP REST                          │ HTTP Webhooks & WebSocket
        ▼                                    ▼
┌─────────────────────┐         ┌──────────────────────────────┐
│   Twilio API        │         │  Twilio Media Stream         │
│  (Make Call)        │         │  (WebSocket Bridge)          │
└─────────────────────┘         └──────────────────┬───────────┘
                                                   │
                                                   ▼
                                        ┌──────────────────────────┐
                                        │  OpenAI Realtime API     │
                                        │  (gpt-realtime-2025...)  │
                                        │  (WebSocket)             │
                                        └──────────────────────────┘
```

#### Main Services & Responsibilities

**File**: [backend/app/services/call_orchestrator.py](backend/app/services/call_orchestrator.py)
- **Orchestrates** entire test lifecycle
- Initiates outbound call via TwilioService
- For simulated mode: executes conversation + analysis
- For realtime mode: waits for webhook completion
- Polls Twilio for call status if no status callback configured
- Handles exceptions and error tracking

**File**: [backend/app/services/realtime_bridge_service.py](backend/app/services/realtime_bridge_service.py)
- **Two-way audio bridge**: Twilio ↔ OpenAI Realtime
- WebSocket server accepts Twilio media stream
- WebSocket client connects to OpenAI Realtime API
- Converts Twilio audio format → OpenAI format (bidirectional)
- Captures audio deltas and transcript from OpenAI
- Triggers analysis when call ends

**File**: [backend/app/services/analysis_engine.py](backend/app/services/analysis_engine.py)
- **Analyzes** conversation transcripts via LLM
- Sends prompt with success criteria to OpenAI
- Parses JSON response following strict schema
- Fallback heuristic if LLM unavailable
- Stores confidence scores and raw LLM output

#### Frontend-Backend Communication

1. **Test Creation Flow**:
   - Frontend `POST /api/tests` with `CreateTestRequest` payload
   - Backend returns `CreateTestResponse` with test_id (HTTP 202 Accepted)
   - Queues async job via `BackgroundTasks.add_task(_run_test_job, test_id)`
   - Frontend immediately starts polling

2. **Status Polling**:
   - Frontend `GET /api/tests/{test_id}` every 3 seconds
   - Returns `TestResultResponse` with call status, transcript, analysis
   - Stops when status reaches terminal state

3. **Real-time Media Bridge**:
   - Twilio streams audio to `/api/webhooks/twilio/media-stream` (WebSocket)
   - Backend opens parallel WebSocket to OpenAI Realtime
   - Bidirectional audio relay with transcript capture
   - Twilio Status Callback (`/api/webhooks/twilio/status`) updates call_session.status

#### Database Schema

**File**: [backend/app/db/models.py](backend/app/db/models.py)

- **TestCase**: Test definition (scenario, criteria, phone number, instructions)
- **CallSession**: Call instance (Twilio SID, status, duration, error message)
- **TranscriptUtterance**: Individual speech turns with timestamps and speaker
- **AnalysisReport**: Complete LLM analysis with score, criteria evaluation, issues, suggestions

#### Code Organization

```
backend/app/
├── main.py                    # FastAPI app initialization, startup hook
├── api/
│   └── routes/
│       ├── tests.py          # Test creation, result retrieval, call termination
│       └── webhooks.py       # Twilio status callback, media stream bridge, answer generation
├── services/
│   ├── call_orchestrator.py       # Tests lifecycle orchestration
│   ├── twilio_service.py          # Twilio API client wrapper
│   ├── conversation_manager.py    # Conversation execution
│   ├── openai_realtime_service.py # Transcript generation & realtime setup
│   ├── realtime_bridge_service.py # Twilio ↔ OpenAI audio bridge
│   ├── analysis_engine.py         # LLM-based analysis
│   ├── report_generator.py        # Report normalization
│   └── transcript_service.py      # Transcript persistence
├── repositories/
│   └── test_repository.py         # Data access patterns
├── db/
│   ├── models.py           # SQLAlchemy ORM models
│   ├── schemas.py          # Pydantic request/response models
│   └── database.py         # SQLAlchemy engine & session factory
└── core/
    ├── config.py           # Pydantic Settings
    └── logging.py          # Logging configuration
```

---

## 3. BUILD & TEST

### Backend Build

**Docker Setup**:
- **File**: [backend/Dockerfile](backend/Dockerfile)
  ```dockerfile
  FROM python:3.14-slim
  # Minimal dependencies: only gcc for compilation
  # Copies requirements.txt → pip install
  # Exposes port 8000
  # Runs: uvicorn app.main:app --host 0.0.0.0 --port 8000
  ```

**Dependencies**:
- **File**: [backend/requirements.txt](backend/requirements.txt)
  - `fastapi>=0.111.0`: Web framework
  - `uvicorn[standard]>=0.30.1`: ASGI server
  - `sqlalchemy>=2.0.30`: ORM
  - `pydantic>=2.7.4`, `pydantic-settings>=2.3.3`: Validation & config
  - `python-dotenv>=1.0.1`: `.env` file support
  - `twilio>=9.2.3`: Twilio SDK
  - `openai>=1.35.7`: OpenAI SDK
  - `websockets>=12.0`: WebSocket support
  - `httpx>=0.27.0`: HTTP client
  - `python-multipart>=0.0.9`: Form data parsing

**Local Development**:
```bash
# Install dependencies
pip install -r backend/requirements.txt

# Run dev server with auto-reload
uvicorn app.main:app --reload

# Access API at http://localhost:8000
# Docs at http://localhost:8000/docs (Swagger UI)
```

### Frontend Build

**Build Tool**: Vite (modern ES modules)
- **File**: [frontend/package.json](frontend/package.json)
  - `npm run dev`: Start Vite dev server (http://localhost:5173)
  - `npm run build`: Production build to `dist/`
  - `npm run preview`: Preview production build locally

**Dockerfile**:
- **File**: [frontend/Dockerfile](frontend/Dockerfile)
  - Multi-stage build: Build stage (node:20) → serve stage
  - `COPY frontend/package.json` and `npm install`
  - `npm run build` generates optimized bundle
  - Runs `serve -s dist -l 5173` to serve static files

**Dependencies**:
- **File**: [frontend/package.json](frontend/package.json)
  - Production: `react@18.3.1`, `react-dom@18.3.1`
  - Dev: `vite@5.4.0` only (minimal)
  - No state management library (useState only)
  - No component libraries (vanilla CSS)

### Docker Compose Orchestration

**File**: [docker-compose.yml](docker-compose.yml)

```yaml
version: "3.9"

services:
  backend:
    build: { context: ., dockerfile: backend/Dockerfile }
    container_name: voice-bot-backend
    ports: ["8000:8000"]
    env_file: .env
    environment:
      APP_ENV: production
      DATABASE_URL: sqlite:///./voice_test.db
      # All Twilio, OpenAI vars from .env
    volumes:
      - ./backend/voice_test.db:/app/voice_test.db  # Persist SQLite
    restart: unless-stopped
    networks: [voice-bot-net]

  frontend:
    build: { context: ., dockerfile: frontend/Dockerfile }
    container_name: voice-bot-frontend
    ports: ["5173:5173"]
    depends_on: [backend]
    restart: unless-stopped
    networks: [voice-bot-net]

networks:
  voice-bot-net:
```

**Deployment**:
```bash
# Local with docker-compose
docker-compose up --build

# Access frontend: http://localhost:5173
# Backend API: http://localhost:8000
```

### Environment Configuration

**File**: [backend/.env.example](backend/.env.example)

```env
# App
APP_ENV=development
APP_HOST=0.0.0.0
APP_PORT=8000
APP_PUBLIC_BASE_URL=            # ngrok URL for webhooks (required for live calls)
LOG_LEVEL=INFO

# Database
DATABASE_URL=sqlite:///./voice_test.db

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_API_KEY_SID=             # Recommended over auth token
TWILIO_API_KEY_SECRET=
TWILIO_FROM_NUMBER=
TWILIO_STATUS_CALLBACK_URL=     # Optional webhook URL
TWILIO_ANSWER_URL=              # Optional TwiML endpoint
TWILIO_INLINE_HOLD_SECONDS=45

# OpenAI
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
OPENAI_REALTIME_MODEL=gpt-realtime-2025-08-28
OPENAI_REALTIME_VOICE=alloy
```

### Testing Structure

**Observation**: No dedicated test suite files for CI/CD visible in workspace. However, pattern exists:
- **File**: [backend/app/api/routes/tests.py](backend/app/api/routes/tests.py) (Test API routes, NOT unit tests)
- **File**: [backend/app/repositories/test_repository.py](backend/app/repositories/test_repository.py)

**Manual Testing Approach**: 
- Frontend provides manual test creation UI
- Backend has simulated mode (no Twilio needed)
- Health check endpoint at `GET /health` for monitoring

---

## 4. KEY INTEGRATION POINTS

### External Service: Twilio

**Integration Layer**:
- **File**: [backend/app/services/twilio_service.py](backend/app/services/twilio_service.py)

**Operations**:
1. **Outbound Call Initiation** (`start_outbound_call`):
   - Checks for credentials: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, or `TWILIO_API_KEY_SID` + `TWILIO_API_KEY_SECRET`
   - Returns simulated call if credentials missing
   - Resolves `TwiML answer URL` from `TWILIO_ANSWER_URL` or `APP_PUBLIC_BASE_URL`
   - Creates call with Twilio SDK: `client.calls.create(to=..., from_=..., url=...)`
   - Fallback: Inline TwiML if public URL unavailable (hold mode)

2. **Status Callback Webhook** (`/api/webhooks/twilio/status`):
   - File: [backend/app/api/routes/webhooks.py](backend/app/api/routes/webhooks.py) (Lines 20-45)
   - Receives: `CallSid`, `CallStatus`, `CallDuration`
   - Updates: `CallSession.status`, `completion_time`, `duration_seconds`
   - Triggers analysis finalization when status is terminal

3. **Answer URL Callback** (`/api/webhooks/twilio/answer`):
   - File: [backend/app/api/routes/webhooks.py](backend/app/api/routes/webhooks.py) (Lines 48-69)
   - Returns TwiML XML to connect call to media stream
   - Sets up WebSocket bridge: `Stream url="wss://...` with custom parameter (test_id)

4. **Media Stream Bridge** (WebSocket):
   - File: [backend/app/api/routes/webhooks.py](backend/app/api/routes/webhooks.py) (Lines 72-74)
   - Endpoint: `/api/webhooks/twilio/media-stream`
   - Delegates to `RealtimeBridgeService.bridge_twilio_media(websocket)`

### External Service: OpenAI

**Integration Points**:

1. **LLM-based Transcript Analysis**:
   - **File**: [backend/app/services/analysis_engine.py](backend/app/services/analysis_engine.py)
   - Uses: `openai.OpenAI` client
   - Model: `settings.openai_model` (default: `gpt-4.1-mini`)
   - Prompt: Includes success criteria + transcript + schema requirements
   - Response format: Strict JSON only
   - Input: `client.responses.create(model=..., input=prompt, temperature=0.1)`

2. **Realtime Audio Bridge**:
   - **File**: [backend/app/services/realtime_bridge_service.py](backend/app/services/realtime_bridge_service.py)
   - Uses: `openai.OpenAI` client + WebSocket (via `websockets` library)
   - Model: `settings.openai_realtime_model` (default: `gpt-realtime-2025-08-28`)
   - Voice: `settings.openai_realtime_voice` (default: `alloy`)
   - Connection: `wss://api.openai.com/v1/realtime`
   - Headers: Authorization with Bearer token

3. **Simulated Transcript Generation**:
   - **File**: [backend/app/services/openai_realtime_service.py](backend/app/services/openai_realtime_service.py)
   - Uses: `openai.OpenAI` client
   - Purpose: Generate realistic test conversation (when Twilio not available)
   - Input: Scenario, expected flow, success criteria, instructions
   - Output: JSON with `{"transcript": [{"speaker": "...", "text": "..."}]}`

### Database Connection

**SQLite by Default**:
- **File**: [backend/app/db/database.py](backend/app/db/database.py)
- Config: [backend/app/core/config.py](backend/app/core/config.py)
- Default: `DATABASE_URL=sqlite:///./voice_test.db`
- Supports PostgreSQL, MySQL by changing `DATABASE_URL`
- Session management: `SessionLocal = sessionmaker(..., bind=engine)`
- Dependency injection: `def get_db()` yields session

### Environment-Based Configuration

**Pattern**: All external credentials via environment variables (12-factor app)
- **File**: [backend/app/core/config.py](backend/app/core/config.py)
- Pydantic Settings loads from `.env`
- LRU cache ensures singleton instance
- Validation: All settings accessible as typed properties

---

## 5. DATABASE PATTERNS

### Schema Design

**File**: [backend/app/db/models.py](backend/app/db/models.py)

#### TestCase Table
```python
class TestCase(Base):
    id: String(36), primary_key, UUID default
    name: String(255), required
    phone_number: String(32), required
    scenario: Text, required
    expected_flow: Text | None
    success_criteria: JSON (list[str])
    additional_instructions: Text | None
    test_data: Text | None               # Customer-specific data
    persona_instructions: Text | None    # Caller behavior instructions
    enable_recording: Boolean, default=False
    created_at: DateTime, default=utcnow
```

**Relationships**:
- One-to-One: TestCase → CallSession (foreign key)
- One-to-Many: TestCase → TranscriptUtterance (foreign key)
- One-to-One: TestCase → AnalysisReport (foreign key, unique)

#### CallSession Table
```python
class CallSession(Base):
    id: String(36), primary_key, UUID default
    test_id: String(36), foreign_key→TestCase, unique, required
    provider_call_sid: String(64) | None    # Twilio SID
    status: String(32), default="queued"    # queued|running|completed|failed|busy|no-answer|canceled
    started_at: DateTime, default=utcnow
    completed_at: DateTime | None
    duration_seconds: Integer | None
    metadata_json: JSON, default={}         # Arbitrary metadata (simulated, conversation_mode, etc.)
    error_message: Text | None
```

**Status Flow**:
- `queued` → `running` → `completed`|`failed`|`busy`|`no-answer`|`canceled`

#### TranscriptUtterance Table
```python
class TranscriptUtterance(Base):
    id: Integer, primary_key, auto_increment
    test_id: String(36), foreign_key→TestCase, required
    speaker: String(32), required          # "AI Tester" | "Target Voice Bot"
    text: Text, required
    timestamp: DateTime, default=utcnow
```

#### AnalysisReport Table
```python
class AnalysisReport(Base):
    id: String(36), primary_key, UUID default
    test_id: String(36), foreign_key→TestCase, unique, required
    overall_result: String(32)             # "Pass" | "Partial Pass" | "Fail"
    score: Integer                          # 0-100
    summary: Text
    criteria_evaluation: JSON               # [{criterion, status, notes}]
    quality_assessment: JSON                # {intent_recognition, response_relevance, ...}
    issues: JSON                           # [{category, description, severity}]
    suggestions: JSON                      # [string]
    confidence: Float                      # 0-1
    raw_response: Text | None              # LLM output
```

### Pydantic Schemas

**File**: [backend/app/db/schemas.py](backend/app/db/schemas.py)

#### Request Validation
```python
class CreateTestRequest(BaseModel):
    phone_number: str = Field(min_length=8, max_length=32)
    test_name: str = Field(min_length=2, max_length=255)
    test_scenario: str = Field(min_length=3)
    expected_conversation_flow: str | None = None
    success_criteria: list[str] = Field(min_length=1)
    additional_instructions: str | None = None
    test_data: str | None = None
    persona_instructions: str | None = None
    enable_recording: bool = False
```

#### Response Serialization
```python
class TestResultResponse(BaseModel):
    id: str
    test_name: str
    phone_number: str
    scenario: str
    created_at: datetime
    call: CallInfoResponse | None
    transcript: list[TranscriptUtteranceResponse]
    analysis: AnalysisResult | None
```

**Pattern**: `CallInfoResponse` and `TranscriptUtteranceResponse` use `model_config = {"from_attributes": True}` for ORM-to-Pydantic mapping.

### Data Access Patterns

**File**: [backend/app/repositories/test_repository.py](backend/app/repositories/test_repository.py)

**Static Repository Methods**:
```python
@staticmethod
def create_test(db: Session, name: str, ...) -> TestCase:
    # Creates TestCase + CallSession in transaction
    test_case = TestCase(...)
    db.add(test_case)
    db.flush()  # Get ID before commit
    call_session = CallSession(test_id=test_case.id, ...)
    db.add(call_session)
    db.commit()
    return test_case

@staticmethod
def get_test(db: Session, test_id: str) -> TestCase | None:
    return db.get(TestCase, test_id)  # Query by primary key

@staticmethod
def get_call_session(db: Session, test_id: str) -> CallSession | None:
    stmt = select(CallSession).where(CallSession.test_id == test_id)
    return db.scalar(stmt)  # Single result or None

@staticmethod
def get_analysis_report(db: Session, test_id: str) -> AnalysisReport | None:
    stmt = select(AnalysisReport).where(AnalysisReport.test_id == test_id)
    return db.scalar(stmt)
```

### Schema Migrations Strategy

**Observation**: No dedicated migration tool (Alembic) used.

**Current Approach** (Manual):
- Database created on app startup via `Base.metadata.create_all(bind=engine)`
- Schema changes handled in `_add_missing_columns()` helper
- Alters tables manually for new columns: `ALTER TABLE test_cases ADD COLUMN ...`
- Example: `test_data`, `persona_instructions`, `enable_recording` added this way

**Limitation**: Downgrades not supported; only additive changes work well.

---

## 6. SECURITY CONSIDERATIONS

### Authentication & Authorization
**Current Status**: **No authentication implemented**
- **Files**: No auth middleware, no JWT, no API key validation
- **Implication**: All endpoints are publicly accessible
- **Recommendation**: Should add API key headers or OAuth for production

### Environment Variable Management

**Best Practice Implemented**:
- **File**: [backend/app/core/config.py](backend/app/core/config.py)
- Secrets loaded from `.env` only (not in code)
- File: [backend/.env.example](backend/.env.example) shows template
- Settings loaded via Pydantic with typed validation
- No hardcoded credentials

**Sensitive Variables**:
```
TWILIO_ACCOUNT_SID           # Never hardcoded
TWILIO_AUTH_TOKEN            # Never hardcoded
TWILIO_API_KEY_SID          # Recommended over auth token
TWILIO_API_KEY_SECRET       # Private key
OPENAI_API_KEY              # Private key
```

### API Key Handling Patterns

**Twilio Integration**:
- **File**: [backend/app/services/twilio_service.py](backend/app/services/twilio_service.py) (Lines 21-36)
- Supports two auth methods: Basic + API Key (latter recommended)
- Validates credential format: checks for "AC" prefix (account SID), "SK" prefix (API key)
- Gracefully degrades to simulated mode if credentials missing

**OpenAI Integration**:
- **File**: [backend/app/services/analysis_engine.py](backend/app/services/analysis_engine.py) (Lines 14-16)
- Only instantiates client if `settings.openai_api_key` provided
- Falls back to heuristic analysis if client unavailable
- API key passed as Bearer token in WebSocket headers

### CORS Configuration

**File**: [backend/app/main.py](backend/app/main.py) (Lines 17-23)

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # ⚠️ INSECURE: Allow all origins
    allow_credentials=True,         # ⚠️ Credentials with * is problematic
    allow_methods=["*"],           # ⚠️ Allow all methods
    allow_headers=["*"],           # ⚠️ Allow all headers
)
```

**Security Issue**: Very permissive CORS. Should restrict in production:
```python
allow_origins=[
    "http://localhost:5173",
    "http://localhost:3000",
    "https://yourdomain.com"
],
```

### Data Sensitivity

**Personal Information**:
- Phone numbers stored in `TestCase.phone_number` (cleartext)
- Test data may contain: DOB, account numbers, customer info (as text)
- No encryption at rest for SQLite

**Recommendation**:
- Encrypt `test_data` field
- Use PostgreSQL with SSL in production
- Restrict database access

### Secure Operations

**Protected Actions**:
- Webhook URLs require `test_id` parameter (weak token)
- Media stream WebSocket accepts `test_id` from Twilio custom parameter
- No signature verification on Twilio webhooks (should verify X-Twilio-Signature)

**Example**: Twilio Status Callback (File: [backend/app/api/routes/webhooks.py](backend/app/api/routes/webhooks.py), Lines 20-45)
```python
@router.post("/twilio/status")
def twilio_status_callback(
    call_sid: str = Form(alias="CallSid"),
    call_status: str = Form(alias="CallStatus"),
    test_id: str | None = Query(default=None),  # ⚠️ Unauthenticated
    db: Session = Depends(get_db),
) -> dict:
    # ❌ No signature verification
    # ❌ No rate limiting
    # ✓ Finds call_session by call_sid or test_id
```

**Recommendation**: Verify webhook signature using Twilio SDK:
```python
from twilio.request_validator import RequestValidator
validator = RequestValidator(settings.twilio_auth_token)
if not validator.validate(request.url, request.body, request.headers.get('X-Twilio-Signature')):
    raise HTTPException(status_code=403)
```

### Rate Limiting
**Current Status**: **Not implemented**
- No rate limiting on endpoints
- WebSocket bridge can be abused (denial of service risk)
- Polling endpoint (`GET /api/tests/{id}`) has no rate limit

**Recommendation**: Add middleware with `slowapi` or `limits` package

### Logs & Monitoring

**Logging**: Basic but functional
- **File**: [backend/app/core/logging.py](backend/app/core/logging.py)
- Logs include: Service messages, exceptions, Twilio events
- Issue: Error messages stored in database (SQL injection risk if using old SQLite)

**Recommendation**: Ensure parameterized queries (SQLAlchemy handles this)

---

## Summary: Key Patterns for AI Agent

| Area | Key Pattern | Files |
|------|------------|-------|
| **Framework** | FastAPI + Pydantic V2 | main.py, schemas.py |
| **Architecture** | Service-oriented monolith | services/*.py |
| **State Management** | useState + polling | App.jsx |
| **ORM** | SQLAlchemy 2.0+ Mapped types | models.py |
| **Config** | Pydantic Settings + .env | config.py |
| **API Integration** | Dependency injection services | twilio_service.py, analysis_engine.py |
| **Error Handling** | Fallback methods + logging | analysis_engine.py |
| **Database** | SQLite (no migrations) | database.py, models.py |
| **WebSocket** | Twilio ↔ OpenAI realtime bridge | realtime_bridge_service.py |
| **Frontend Build** | Vite (ES modules) | package.json, Dockerfile |
| **Deployment** | Docker Compose | docker-compose.yml |
| **Security Gap** | No authentication, permissive CORS | main.py |

---

**Generated**: July 15, 2026  
**Analyzed By**: AI Code Assistant
