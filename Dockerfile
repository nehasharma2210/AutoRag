# Multi-stage build for AutoRAG
FROM node:18-alpine as backend-builder

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# Copy backend source
COPY backend/ ./backend/

# Python stage for LLM API
FROM python:3.9-slim as llm-builder

WORKDIR /app

# Copy LLM API requirements
COPY llm-api/requirements.txt ./llm-api/
RUN cd llm-api && pip install --no-cache-dir -r requirements.txt

# Copy LLM API source
COPY llm-api/ ./llm-api/

# Final stage
FROM node:18-alpine

# Install Python for LLM API
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

# Copy backend from builder
COPY --from=backend-builder /app/backend ./backend

# Copy LLM API from builder
COPY --from=llm-builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=llm-builder /app/llm-api ./llm-api

# Copy frontend
COPY AutoRag-website/ ./AutoRag-website/

# Copy start script
COPY start.sh ./
RUN chmod +x start.sh

# Expose ports
EXPOSE 3001 8000

# Start command
CMD ["./start.sh"]