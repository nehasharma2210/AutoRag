#!/bin/bash

echo "🚀 Render Build Script for AutoRAG"
echo "=================================="

# Update system packages
echo "Updating system packages..."
apt-get update

# Install system dependencies
echo "Installing system dependencies..."
apt-get install -y python3-dev python3-pip build-essential

# Upgrade pip and install build tools
echo "Upgrading pip and installing build tools..."
pip3 install --upgrade pip setuptools wheel

# Install backend dependencies
echo "Installing Node.js backend dependencies..."
cd backend
npm install --production
cd ..

# Install Python dependencies with proper flags
echo "Installing Python LLM API dependencies..."
cd llm-api
pip3 install --upgrade pip setuptools wheel
pip3 install --no-cache-dir --upgrade -r requirements.txt
cd ..

echo "✅ Build completed successfully!"