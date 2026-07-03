# AWS Deployment Analysis

## Overview
Deploying the AI Voice Bot Testing Platform to AWS requires changes on both code and infrastructure sides. Below is a complete breakdown.

---

## Code Changes Required

### 1. Database Migration (SQLite → RDS)

**Current State:**
- Backend uses SQLite with `DATABASE_URL=sqlite:///./voice_test.db`

**Required Changes:**
- Switch to PostgreSQL (managed RDS) for production
- Update `DATABASE_URL` to connection string format: `postgresql://user:password@host:5432/dbname`
- Apply Alembic/SQLAlchemy migrations on deployment
- Add connection pooling (SQLAlchemy pool_size, pool_recycle)

**Code files to update:**
- `backend/app/db/database.py`: Add SSL verification and pool config for RDS
- `backend/requirements.txt`: Add `psycopg2-binary` (PostgreSQL driver)

### 2. Containerization

**Required:**
- `backend/Dockerfile` for API service
- `frontend/Dockerfile` for React static build or dev server
- `docker-compose.yml` (optional, for local testing before AWS deploy)

**Backend Dockerfile template:**
```dockerfile
FROM python:3.14-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend Dockerfile template:**
```dockerfile
FROM node:20-slim AS build
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
COPY --from=build /app/dist ./dist
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "5173"]
```

### 3. Configuration Management

**Current State:**
- Uses Pydantic `Settings` with `.env` file

**Required Changes:**
- Add AWS Secrets Manager integration for sensitive values (Twilio keys, OpenAI API key)
- Environment-aware config (dev, staging, production)
- Replace hardcoded defaults where needed

**Additions to `backend/app/core/config.py`:**
```python
class Settings(BaseSettings):
    # ... existing fields ...
    aws_region: str = Field(default="us-east-1", alias="AWS_REGION")
    use_aws_secrets: bool = Field(default=False, alias="USE_AWS_SECRETS")
    
    # If USE_AWS_SECRETS=true, fetch Twilio/OpenAI keys from AWS Secrets Manager
```

### 4. Logging & Observability

**Required:**
- Replace file logging with CloudWatch Logs
- Add structured logging (JSON format) for parsing in CloudWatch
- Add X-Ray tracing integration (optional but recommended)

**Update `backend/app/core/logging.py`:**
- Add CloudWatch handler
- Log to stdout for container logs

### 5. Static Frontend Distribution

**Option A: S3 + CloudFront (Recommended for React SPA)**
- Build React app to `dist/` directory
- Upload to S3 bucket
- Serve through CloudFront CDN
- No code changes needed, just build artifacts

**Option B: AppRunner/ECS for Frontend**
- Serve via `serve` package or Nginx
- Same docker approach as backend

### 6. CORS Configuration

**Required Change:**
- Update `backend/app/main.py` FastAPI CORS to accept deployed frontend domain
- Replace `allow_origins=["*"]` with specific frontend URL

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 7. Health Checks & Readiness

**Current:** Basic `/health` endpoint exists

**Recommended Additions:**
- Database connectivity check in `/health`
- External dependency checks (OpenAI API, Twilio)
- Separate `/ready` endpoint for load balancer health checks

---

## AWS Infrastructure Required

### 1. Database (Amazon RDS)

**Service:** RDS for PostgreSQL

**Configuration:**
- Engine: PostgreSQL 15+
- Instance class: `db.t3.micro` (free tier eligible, ~$12/month)
- Storage: 20 GB SSD (free tier)
- Multi-AZ: No (for dev/testing)
- Publicly accessible: No (only from VPC/security group)
- Backup retention: 7 days
- Parameter group: default (can add custom later)

**Cost Estimate:** $12-30/month (free tier first year)

### 2. Container Registry (Amazon ECR)

**Service:** Elastic Container Registry

**Configuration:**
- One repo for backend image
- One repo for frontend image (optional if using S3)
- Image lifecycle policy: Keep last 10 images

**Cost Estimate:** $0.10 per GB stored, ~$1-5/month for this project

### 3. Backend API Hosting

**Option A: AWS AppRunner (Recommended for simplicity)**
- Fully managed container service
- Auto-deploys from ECR
- Handles networking, scaling, health checks out-of-box
- Auto HTTPS with AWS certificates
- Pay per vCPU-hour + requests

**Configuration:**
- 1 vCPU, 2 GB memory instance
- Auto-scaling: 1-2 instances
- Health check: GET /health every 5s
- Connect to RDS security group
- Environment variables stored in AppRunner config

**Cost Estimate:** ~$40-80/month (depending on usage)

**Option B: ECS on Fargate**
- More control, slightly more complex setup
- Similar pricing to AppRunner
- Recommended if you want VPC-specific config

**Option C: Lambda**
- Only recommended if adapting to serverless framework
- Not straightforward for this FastAPI app as-is
- Would need adaptation to Lambda handler

### 4. Frontend Hosting

**Option A: S3 + CloudFront (Recommended)**
- Bucket: `my-app-frontend-bucket`
- Enable versioning for easy rollback
- Block public access (behind CloudFront)
- CloudFront distribution:
  - Origin: S3 bucket
  - Certificate: AWS Certificate Manager (free)
  - Cache behavior: Aggressive caching for assets, no-cache for index.html
  - Custom domain: Optional (via Route 53)

**Cost Estimate:** ~$5-50/month (depends on traffic)

**Option B: AppRunner + React development server**
- Same container approach as backend
- Less efficient than S3+CDN but simpler

### 5. Networking & Security

**VPC Configuration:**
- Default VPC is usually fine for testing
- Create security group for RDS:
  - Inbound: PostgreSQL (5432) from backend app security group
  - Outbound: Allow all (for package downloads, external APIs)

- Create security group for backend app:
  - Inbound: HTTP (80), HTTPS (443) from internet
  - Outbound: Allow all (for Twilio, OpenAI APIs, RDS)

**Cost Estimate:** $0 (included in EC2/AppRunner)

### 6. Secrets Management (AWS Secrets Manager)

**Secrets to store:**
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_FROM_NUMBER
- OPENAI_API_KEY
- DATABASE_PASSWORD (for RDS)

**Configuration:**
- Create secret: format as JSON or plain
- Rotation policy: Optional (not needed for API keys)
- IAM policy: Allow AppRunner role to read specific secrets

**Cost Estimate:** ~$0.40/secret/month = ~$2.40/month for 6 secrets

### 7. Domain & DNS (Optional)

**Service:** Route 53

**Configuration:**
- Hosted zone for your domain
- A record pointing to CloudFront (for frontend)
- A record pointing to AppRunner/ALB (for backend API)
- SSL/TLS via AWS Certificate Manager (free)

**Cost Estimate:** $0.50/month for hosted zone + $0.40/query

### 8. Monitoring & Logging

**Service:** CloudWatch

**Configuration:**
- Application logs: AppRunner automatically sends to CloudWatch
- Custom metrics: Add calls to CloudWatch SDK in backend
- Alarms: Database space, error rates, API latency
- Dashboard: Overview of health metrics

**Cost Estimate:** $0-5/month (lower with free tier logs)

### 9. CI/CD Pipeline (Optional but Recommended)

**Service:** AWS CodePipeline + CodeBuild

**Pipeline stages:**
1. Source: GitHub/CodeCommit
2. Build: CodeBuild runs tests and builds Docker images
3. Push: Images pushed to ECR
4. Deploy: AppRunner auto-deploys new image

**Cost Estimate:** ~$5-15/month

---

## Deployment Architecture Diagram

```
User Browser
    ↓
Route 53 (DNS)
    ↓
CloudFront CDN
    ↓
S3 (React SPA) ← Frontend static assets

API Requests
    ↓
Route 53 (DNS)
    ↓
AppRunner ← Backend API + FastAPI
    ↓
RDS PostgreSQL ← Persistent data
    ↓
AWS Secrets Manager ← Twilio/OpenAI keys

External APIs
    ↓
    Twilio (outbound calls)
    OpenAI (analysis/transcripts)
```

---

## Step-by-Step Deployment Checklist

### Phase 1: Preparation
- [ ] Create AWS account (or use existing)
- [ ] Set up IAM user with `AdministratorAccess` for simplicity (or granular policies)
- [ ] Install AWS CLI and configure credentials
- [ ] Install Docker locally

### Phase 2: Infrastructure Setup
- [ ] Create RDS PostgreSQL instance
- [ ] Create security groups (RDS + AppRunner)
- [ ] Create ECR repositories (backend + frontend)
- [ ] Create AWS Secrets Manager secrets
- [ ] (Optional) Create S3 bucket + CloudFront distribution for frontend

### Phase 3: Code Updates
- [ ] Add PostgreSQL driver to requirements.txt
- [ ] Create Dockerfile for backend and frontend
- [ ] Update `backend/app/db/database.py` for RDS connection
- [ ] Update `backend/app/core/config.py` for AWS Secrets Manager integration
- [ ] Update CORS in `backend/app/main.py`
- [ ] Add `docker-entrypoint.sh` with database migration logic

### Phase 4: Build & Push
- [ ] Build backend Docker image locally
- [ ] Push to ECR
- [ ] Build frontend Docker image locally (or just build artifacts for S3)
- [ ] Push to ECR (if containerized) or upload to S3

### Phase 5: Deploy
- [ ] Create AppRunner service for backend
- [ ] Connect to RDS, Secrets Manager, and security groups
- [ ] Deploy frontend (S3 + CloudFront or AppRunner)
- [ ] Configure custom domain (Route 53 + ACM)
- [ ] Test API health endpoint: `https://api.yourdomain.com/health`
- [ ] Test frontend: `https://yourdomain.com`

### Phase 6: Post-Deployment
- [ ] Monitor CloudWatch logs for errors
- [ ] Run end-to-end test: Create test from UI → Call Twilio → Verify results
- [ ] Set up CloudWatch alarms
- [ ] Document deployment steps in runbook

---

## Cost Summary (Monthly, Rough Estimate)

| Service | Cost |
|---------|------|
| RDS (PostgreSQL t3.micro) | $12-30 |
| AppRunner (backend) | $40-80 |
| CloudFront + S3 (frontend) | $5-50 |
| ECR (image storage) | $1-5 |
| Secrets Manager | $2-3 |
| CloudWatch Logs | $0-5 |
| Route 53 (optional) | $1 |
| **Total** | **~$60-175/month** |

*Note: AWS Free Tier eligibility (first 12 months) can reduce costs significantly.*

---

## Alternative: Simpler Approach (No Code Changes)

If you want minimal code changes, use AWS Elastic Beanstalk:
- Beanstalk auto-manages EC2 + RDS + load balancing
- Still requires Docker
- Single command deploy: `eb deploy`
- Similar pricing to AppRunner (~$40-60/month for t3.micro)
- Less granular control but easier for beginners

---

## Key Advantages of This Setup

✅ **Scalability:** Auto-scaling can handle traffic spikes
✅ **Reliability:** Managed services (no patching, backups automatic)
✅ **Security:** Secrets Manager, VPC, security groups, SSL/TLS included
✅ **Monitoring:** CloudWatch provides visibility into app health
✅ **Cost-effective:** Free tier + reasonable paid pricing
✅ **No ngrok needed:** Public HTTPS URL out-of-box (fixes company policy issue)

---

## Important Notes

1. **Twilio Webhooks:** Once deployed with public AppRunner URL, update Twilio webhook settings to point to `https://your-api-domain.com/api/webhooks/...`

2. **OpenAI Realtime:** This deployment still uses the Responses API for analysis, not full Realtime voice streaming. Full media stream bridging would require additional work (Twilio Media Streams + WebSocket handling).

3. **Database Backups:** RDS automatic backups enabled by default (7-day retention). Can increase to 35 days if needed.

4. **Secrets Rotation:** API keys (Twilio, OpenAI) should be rotated periodically. Update in Secrets Manager and restart AppRunner service.

5. **Cost Control:** Set AWS billing alerts to prevent surprise charges. Monitor CloudWatch metrics regularly.
