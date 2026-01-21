#!/bin/bash

echo "🧪 Testing Docker Setup"
echo "======================="

# Test if Docker is working
echo "Testing Docker..."
docker --version

# Test if docker-compose is working
echo "Testing Docker Compose..."
docker-compose --version

# Check if required files exist
echo "Checking required files..."
files=("Dockerfile" "docker-compose.yml" "start.sh" "backend/.env" "backend/server.js" "llm-api/self_healing_rag.py")

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "🚀 Ready to run: ./deploy.sh"