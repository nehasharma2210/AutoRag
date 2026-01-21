#!/bin/bash

echo "🚀 AutoRAG Docker Deployment Script"
echo "===================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  .env file not found in backend directory"
    echo "Please copy .env.example to backend/.env and configure it"
    exit 1
fi

echo "🧹 Cleaning up previous containers..."
docker-compose down --remove-orphans

echo "📦 Building Docker image..."
docker-compose build --no-cache

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully"
    
    echo "🏃 Starting containers..."
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        echo "✅ AutoRAG is now running!"
        echo ""
        echo "🌐 Frontend: http://localhost:3001"
        echo "🔧 Backend API: http://localhost:3001/api"
        echo "🤖 LLM API: http://localhost:8000"
        echo "💚 Health Check: http://localhost:3001/api/health"
        echo ""
        echo "📊 Check status: docker-compose ps"
        echo "📝 View logs: docker-compose logs -f"
        echo "🛑 Stop: docker-compose down"
        echo ""
        echo "⏳ Waiting for services to be ready..."
        sleep 10
        
        # Check if services are responding
        echo "🔍 Checking service health..."
        if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
            echo "✅ Backend is healthy!"
        else
            echo "⚠️  Backend might still be starting up..."
        fi
        
        if curl -f http://localhost:8000/health >/dev/null 2>&1; then
            echo "✅ LLM API is healthy!"
        else
            echo "⚠️  LLM API might still be starting up..."
        fi
        
    else
        echo "❌ Failed to start containers"
        echo "📝 Check logs: docker-compose logs"
        exit 1
    fi
else
    echo "❌ Failed to build Docker image"
    echo "📝 Check logs: docker-compose logs"
    exit 1
fi