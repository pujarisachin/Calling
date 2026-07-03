# EC2 POC Deployment Guide

## Quick Start: Deploy on AWS EC2 with Docker

This guide deploys the entire application (backend + frontend) on a single small EC2 instance using Docker Compose.

### Prerequisites

- AWS account with EC2 access
- Twilio account with credentials
- OpenAI API key
- PuTTY or SSH client for EC2 access

### Step 1: Launch EC2 Instance

1. Go to AWS Console → EC2 → Instances → Launch instances
2. Select **Ubuntu 24.04 LTS** (free tier eligible, t2.micro)
3. Instance details:
   - Instance type: `t2.micro` (1 vCPU, 1 GB RAM) - free tier
   - Storage: 20 GB gp3 root volume
4. Security group: Create new or use existing
   - Inbound rules:
     - SSH (22): Your IP only
     - HTTP (80): 0.0.0.0/0
     - HTTPS (443): 0.0.0.0/0 (optional, add later with Let's Encrypt)
5. Key pair: Download `.pem` file
6. Launch instance
7. Wait for state "running", note public IP address

### Step 2: Connect to Instance

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

### Step 3: Install Docker & Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add ubuntu user to docker group (no sudo needed for docker commands)
sudo usermod -aG docker ubuntu
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

### Step 4: Clone Repository

```bash
cd /home/ubuntu
git clone <YOUR_REPO_URL> cognigy-calling
cd cognigy-calling
```

Or upload your project files via SFTP/SCP.

### Step 5: Create .env File

```bash
cat > .env << EOF
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=+1234567890
TWILIO_STATUS_CALLBACK_URL=
TWILIO_ANSWER_URL=
TWILIO_INLINE_HOLD_SECONDS=45
OPENAI_API_KEY=sk-proj-yourkey
EOF
```

### Step 6: Build & Start Containers

```bash
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

Expected output:
```
NAME                   IMAGE                STATUS           PORTS
voice-bot-backend      cognigy-backend     Up 2 minutes     0.0.0.0:8000->8000/tcp
voice-bot-frontend     cognigy-frontend    Up 2 minutes     0.0.0.0:5173->5173/tcp
```

### Step 7: Verify Deployment

- Backend health: `http://<EC2_PUBLIC_IP>:8000/health`
- Frontend: `http://<EC2_PUBLIC_IP>:5173`

Should return `{"status":"ok","service":"ai-voice-bot-testing-backend"}`

### Step 8: Configure Twilio Webhooks (Optional)

If you set up public webhook URLs in `.env`:
```
TWILIO_STATUS_CALLBACK_URL=http://<EC2_PUBLIC_IP>:8000/api/webhooks/twilio/status
TWILIO_ANSWER_URL=http://<EC2_PUBLIC_IP>:8000/api/webhooks/twilio/answer
```

Then update Twilio webhook settings to these URLs.

### Step 9: Update DNS (Optional)

If you have a domain, point it to the EC2 public IP:

1. Go to Route 53 or your DNS provider
2. Create A record: `yourdomain.com` → `<EC2_PUBLIC_IP>`
3. Update environment variables to use domain names instead of IP

### Common Docker Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart containers
docker-compose restart

# Stop containers
docker-compose down

# Rebuild images after code changes
docker-compose up -d --build

# Clean up (WARNING: deletes data!)
docker-compose down -v
```

### Database Persistence

- SQLite database is persisted to `./backend/voice_test.db` on the host
- Data survives container restarts
- To back up: `cp backend/voice_test.db voice_test.db.backup`

### Upgrading to PostgreSQL (Optional for Production)

If you want a separate database container, update `docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:15
    container_name: voice-bot-db
    environment:
      POSTGRES_DB: voice_test
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - db-data:/var/lib/postgresql/data
    networks:
      - voice-bot-net

  backend:
    # ... existing config ...
    environment:
      DATABASE_URL: postgresql://app:${DB_PASSWORD}@db:5432/voice_test
    depends_on:
      - db

volumes:
  db-data:

networks:
  voice-bot-net:
```

Then update `.env`:
```
DB_PASSWORD=your-secure-password
```

And rebuild:
```bash
docker-compose up -d --build
```

### SSH Tunnel for Local Development (Optional)

To access backend API on your local machine while it runs on EC2:

```bash
ssh -i your-key.pem -L 8000:localhost:8000 ubuntu@<EC2_PUBLIC_IP>
# Then access locally: http://localhost:8000
```

### Cost Estimate

- **EC2 t2.micro**: Free first 12 months (750 hrs/month)
- **Data transfer**: First 1 GB/month free, then $0.12/GB
- **Storage**: 20 GB @ $0.10/GB/month = $2/month (after free tier)
- **Total**: ~$0-2/month on free tier, $5-10/month after

### Troubleshooting

**Container fails to start:**
```bash
docker-compose logs backend
docker-compose logs frontend
```

**Port already in use:**
Change ports in docker-compose.yml:
```yaml
ports:
  - "8001:8000"  # Backend on 8001
  - "5174:5173"  # Frontend on 5174
```

**Out of disk space:**
```bash
docker system prune -a
```

**Database locked error:**
```bash
docker-compose restart backend
```

### Next Steps

1. Test end-to-end: Create test from UI → Make call → Check results
2. Set up monitoring: CloudWatch agent (optional)
3. Configure SSL/TLS: Use Let's Encrypt with certbot + Nginx reverse proxy (advanced)
4. Scale up: Migrate to RDS + AppRunner if outgrowing single instance

### Cleanup (Stop All)

```bash
docker-compose down
```

To keep the instance but free resources, or:

```bash
aws ec2 terminate-instances --instance-ids i-xxxxx --region us-east-1
```

To destroy the entire EC2 instance.
