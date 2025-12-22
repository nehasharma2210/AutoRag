FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=3001 \
    LLM_API_PORT=8000 \
    LLM_API_BIND_HOST=0.0.0.0 \
    LLM_API_PYTHON=python3

WORKDIR /app

COPY package.json ./package.json
COPY backend/package.json backend/package.json
COPY backend/package-lock.json backend/package-lock.json

RUN npm --prefix backend ci --omit=dev

COPY llm-api/requirements.txt llm-api/requirements.txt
RUN python3 -m pip install --upgrade pip \
  && python3 -m pip install -r llm-api/requirements.txt

COPY backend backend
COPY AutoRag-website AutoRag-website
COPY llm-api llm-api

# Create a start script
RUN echo '#!/bin/bash\ncd /app/llm-api && python3 -m uvicorn self_healing_rag:app --host 0.0.0.0 --port 8000 &\ncd /app && node backend/server.js' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 3001
EXPOSE 8000

CMD ["/app/start.sh"]
