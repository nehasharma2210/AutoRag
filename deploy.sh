#!/bin/bash

echo "🚀 AutoRAG Deployment Script"
echo "=============================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  .env file not found in backend directory"
    echo "Please copy .env.example to backend/.env and configure it"
    exit 1
fi

echo "📦 Building Docker image..."
docker build -t autorag .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully"
    
    echo "🏃 Starting containers..."
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        echo "✅ AutoRAG is now running!"
        echo "🌐 Frontend: http://localhost:3001"
        echo "🔧 Backend API: http://localhost:3001/api"
        echo "🤖 LLM API: http://localhost:8000"
        echo ""
        echo "📊 Check status: docker-compose ps"
        echo "📝 View logs: docker-compose logs -f"
        echo "🛑 Stop: docker-compose down"
    else
        echo "❌ Failed to start containers"
        exit 1
    fi
else
    echo "❌ Failed to build Docker image"
    exit 1
fi