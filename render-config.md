# 🚀 Render Deployment Configuration

## Service 1: Backend (Node.js)

**Build Command:**
```bash
cd backend && npm install --production
```

**Start Command:**
```bash
cd backend && node server.js
```

**Environment Variables (Add manually in Render dashboard):**
```
NODE_ENV=production
DATABASE_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-backend-url.onrender.com/api/auth/google/callback
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_app_password
SMTP_FROM=Your App <your_email>
LLM_API_BASE_URL=https://your-llm-api-url.onrender.com
PUBLIC_BASE_URL=https://your-backend-url.onrender.com
```

## Service 2: LLM API (Python)

**Build Command:**
```bash
pip install --upgrade pip setuptools wheel && cd llm-api && pip install --no-cache-dir -r requirements.txt
```

**Start Command:**
```bash
cd llm-api && python -m uvicorn self_healing_rag:app --host 0.0.0.0 --port $PORT
```

**Health Check Paths:**
- Backend: `/api/health`
- LLM API: `/health`