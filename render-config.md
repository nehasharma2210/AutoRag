# 🚀 Render Deployment Configuration

## Service 1: LLM API (Python) - Deploy First

**Service Name:** `autorag-llm-api`
**Environment:** Python 3
**Region:** Oregon (US West)

**Build Command:**
```bash
pip install --upgrade pip setuptools wheel && cd llm-api && pip install --no-cache-dir -r requirements.txt
```

**Start Command:**
```bash
cd llm-api && python -m uvicorn self_healing_rag:app --host 0.0.0.0 --port $PORT
```

**Health Check Path:** `/health`

---

## Service 2: Backend (Node.js) - Deploy Second

**Service Name:** `autorag-backend`
**Environment:** Node.js 18
**Region:** Oregon (US West)

**Build Command:**
```bash
cd backend && npm install --production --silent
```

**Start Command:**
```bash
cd backend && node server.js
```

**Health Check Path:** `/api/health`

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
LLM_API_BASE_URL=https://autorag-llm-api.onrender.com
PUBLIC_BASE_URL=https://autorag-backend.onrender.com
EMAILJS_SERVICE_ID=your_service_id
EMAILJS_TEMPLATE_ID=your_template_id
EMAILJS_PUBLIC_KEY=your_public_key
```

---

## 🚨 Important Notes:

1. **Deploy LLM API FIRST** - Get its URL
2. **Then deploy Backend** - Use LLM API URL in environment variables
3. **Node.js Version**: Ensure Render uses Node.js 18+
4. **Separate Services**: Don't try to run both in one container