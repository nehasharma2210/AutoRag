#!/bin/bash

echo "🚀 Starting AutoRAG services..."

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "Port $port is already in use"
        return 1
    fi
    return 0
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo "Waiting for $service_name to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if curl -f $url >/dev/null 2>&1; then
            echo "✅ $service_name is ready!"
            return 0
        fi
        echo "Attempt $attempt/$max_attempts - $service_name not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ $service_name failed to start after $max_attempts attempts"
    return 1
}

# Start LLM API in background
echo "Starting LLM API on port 8000..."
cd /app/llm-api

# Check if the Python script exists
if [ ! -f "self_healing_rag.py" ]; then
    echo "❌ self_healing_rag.py not found in llm-api directory"
    exit 1
fi

# Run health check first
echo "🔍 Running pre-flight health check..."
if [ -f "health_check.py" ]; then
    python3 health_check.py
    if [ $? -ne 0 ]; then
        echo "⚠️ Health check failed, but continuing with startup..."
    fi
fi

# Start LLM API with better error handling
echo "🚀 Starting LLM API server..."
python3 -m uvicorn self_healing_rag:app --host 0.0.0.0 --port 8000 --log-level info &
LLM_PID=$!

# Wait for LLM API to be ready
sleep 5

# Start backend server
echo "Starting backend server on port 3001..."
cd /app/backend

# Check if server.js exists
if [ ! -f "server.js" ]; then
    echo "❌ server.js not found in backend directory"
    kill $LLM_PID 2>/dev/null
    exit 1
fi

# Start backend
node server.js &
BACKEND_PID=$!

# Wait for both services to be ready
echo "Checking services..."
sleep 10

# Check if both services are running
if ps -p $LLM_PID > /dev/null && ps -p $BACKEND_PID > /dev/null; then
    echo "✅ Both services are running!"
    echo "🌐 Frontend: http://localhost:3001"
    echo "🔧 Backend API: http://localhost:3001/api"
    echo "🤖 LLM API: http://localhost:8000"
    
    # Keep the container running
    wait
else
    echo "❌ One or more services failed to start"
    kill $LLM_PID $BACKEND_PID 2>/dev/null
    exit 1
fi