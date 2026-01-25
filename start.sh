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

# Check memory and decide which model to use
MEMORY_LIMIT=${MEMORY_LIMIT:-512}
if [ "$MEMORY_LIMIT" -lt 1024 ]; then
    echo "🔧 Low memory detected (${MEMORY_LIMIT}MB), using lightweight model..."
    PYTHON_FILE="lightweight_rag.py"
    REQUIREMENTS_FILE="requirements-light.txt"
else
    echo "🚀 Sufficient memory detected, using full model..."
    PYTHON_FILE="self_healing_rag.py"
    REQUIREMENTS_FILE="requirements.txt"
fi

# Check if the Python script exists
if [ ! -f "$PYTHON_FILE" ]; then
    echo "❌ $PYTHON_FILE not found in llm-api directory"
    exit 1
fi

# Install appropriate requirements if needed
if [ -f "$REQUIREMENTS_FILE" ] && [ ! -f ".deps_installed" ]; then
    echo "📦 Installing dependencies from $REQUIREMENTS_FILE..."
    pip3 install -r "$REQUIREMENTS_FILE" && touch .deps_installed
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
echo "🚀 Starting LLM API server with $PYTHON_FILE..."
MODULE_NAME=$(basename "$PYTHON_FILE" .py)
python3 -m uvicorn ${MODULE_NAME}:app --host 0.0.0.0 --port 8000 --log-level info &
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