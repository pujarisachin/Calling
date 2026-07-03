# AI Voice Bot Testing Platform

Automated AI Voice Bot testing platform using Twilio and OpenAI Realtime API.

## Features

- ✅ Outbound call automation via Twilio
- ✅ AI-powered voice bot conversation scenarios
- ✅ Transcript capture & storage
- ✅ LLM-driven conversation analysis
- ✅ Detailed test reports with pass/fail evaluation
- ✅ Works without public tunnel (no ngrok required)
- ✅ Docker-ready for cloud deployment

## Quick Start (Local)

### Prerequisites
- Python 3.12+
- Node.js 20+
- Twilio account with API credentials
- OpenAI API key

### Setup

1. Clone repository:
```bash
git clone https://github.com/yourusername/cognigy-calling.git
cd cognigy-calling
```

2. Backend setup:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Twilio & OpenAI credentials
```

3. Frontend setup:
```bash
cd ../frontend
npm install
cp .env.example .env
```

4. Start services:

**Terminal 1 (Backend):**
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

5. Access application:
- Frontend: http://127.0.0.1:5173
- Backend API: http://127.0.0.1:8000
- Health check: http://127.0.0.1:8000/health

## Deployment

### Docker (POC on EC2)

See [EC2_POC_DEPLOYMENT.md](EC2_POC_DEPLOYMENT.md) for step-by-step guide.

Quick start:
```bash
docker-compose up -d
```

### AWS Production

See [DEPLOYMENT_ANALYSIS.md](DEPLOYMENT_ANALYSIS.md) for AppRunner + RDS + CloudFront setup.

## Architecture

### Backend (FastAPI)
- `app/api/routes/` - HTTP endpoints
- `app/services/` - Business logic (Twilio, OpenAI, analysis)
- `app/db/` - Database models and schemas
- `app/core/` - Configuration and logging

### Frontend (React + Vite)
- `src/App.jsx` - Main application component
- `src/api.js` - API client
- `src/styles.css` - Styling

### Database (SQLite/PostgreSQL)
- Test definitions
- Call sessions & metadata
- Conversation transcripts
- Analysis reports

## API Endpoints

- `POST /api/tests` - Create and start test
- `GET /api/tests/{test_id}` - Fetch test result
- `POST /api/webhooks/twilio/status` - Twilio status callback
- `POST /api/webhooks/twilio/answer` - Twilio answer callback
- `GET /health` - Health check

## Configuration

### Environment Variables

Backend (`.env`):
```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
OPENAI_API_KEY=
TWILIO_INLINE_HOLD_SECONDS=45
```

Frontend (`.env`):
```
VITE_API_BASE_URL=http://localhost:8000
```

## Limitations & Notes

- **No public tunnel mode:** Inline TwiML fallback keeps call alive but does not run live two-way voice without media stream bridge.
- **Twilio trial:** Mandatory announcement and DTMF key press required on trial accounts.
- **OpenAI Realtime:** Full media stream integration not yet implemented. Uses Responses API for transcript generation & analysis.

## Testing

Create a test:
1. Go to http://127.0.0.1:5173
2. Enter phone number, scenario, success criteria
3. Click "Start Test"
4. Monitor call progress and results

## Troubleshooting

**Backend won't start:**
```bash
pip install -r requirements.txt
```

**Frontend blank page:**
- Check browser console for errors
- Verify `VITE_API_BASE_URL` in frontend/.env
- Ensure backend is running

**Twilio call fails:**
- Verify credentials in backend/.env
- Check backend logs for error messages
- Ensure phone number format is correct (+1XXXXXXXXXX)

## Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m "Add your feature"`)
4. Push to branch (`git push origin feature/your-feature`)
5. Open pull request

## License

MIT

## Support

For issues, questions, or feature requests, open an issue on GitHub.
