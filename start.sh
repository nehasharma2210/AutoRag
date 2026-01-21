#!/bin/bash

echo "🚀 Starting AutoRAG services..."

# Start LLM API in background
echo "Starting LLM API on port 8000..."
cd /app/llm-api
python3 -m uvicorn self_healing_rag:app --host 0.0.0.0 --port 8000 &

# Wait a moment for LLM API to start
sleep 5

# Start backend server
echo "Starting backend server on port 3001..."
cd /app/backend
npm start