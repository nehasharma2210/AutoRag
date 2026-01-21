# AutoRAG Deployment Guide

## Project Architecture
- **Frontend**: HTML/CSS/JS website (AutoRag-website)
- **Backend**: Node.js/Express API server (port 3001)
- **LLM API**: Python FastAPI server (port 8000)

## Prerequisites
1. Docker installed
2. Git repository set up
3. AWS CLI (for cloud deployment)

## Local Development

### Quick Start:
```bash
# 1. Copy environment file
cp .env.example backend/.env

# 2. Edit backend/.env with your configuration
# 3. Run with Docker
chmod +x deploy.sh
./deploy.sh
```

### Manual Setup:
```bash
# Backend
cd backend
npm install
npm start

# LLM API (separate terminal)
cd llm-api
pip install -r requirements.txt
python -m uvicorn self_healing_rag:app --host 0.0.0.0 --port 8000

# Frontend served by backend at http://localhost:3001
```

## Cloud Deployment Options

### Option 1: AWS App Runner (Recommended - Easiest)

**Steps:**
1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy via AWS Console:**
   - Go to AWS App Runner
   - Create service → Source: Repository
   - Connect your GitHub repo
   - Use the `apprunner.yaml` configuration file
   - Add environment variables from your `.env` file

3. **Required Environment Variables:**
   - `MONGODB_URI` (use MongoDB Atlas)
   - `JWT_SECRET`
   - `SMTP_*` or `EMAILJS_*` credentials
   - `PUBLIC_BASE_URL` (your app runner URL)
   - `LLM_API_BASE_URL=http://localhost:8000`

## Option 2: AWS ECS with Fargate

### Steps:
1. **Create ECR Repository:**
   ```bash
   aws ecr create-repository --repository-name autorag
   ```

2. **Build and Push Docker Image:**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
   docker build -t autorag .
   docker tag autorag:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/autorag:latest
   docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/autorag:latest
   ```

3. **Deploy using CDK:**
   ```bash
   npm install aws-cdk-lib constructs
   npx cdk init app -