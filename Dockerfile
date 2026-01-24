# Use Ubuntu base for better compatibility
FROM ubuntu:22.04

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    python3 \
    python3-pip \
    python3-venv \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy and install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy and install LLM API dependencies with fallback
COPY llm-api/requirements*.txt ./llm-api/
COPY llm-api/install_deps.py ./llm-api/
RUN cd llm-api && python3 install_deps.py

# Copy all source code
COPY backend/ ./backend/
COPY llm-api/ ./llm-api/
COPY AutoRag-website/ ./AutoRag-website/

# Copy start script
COPY start.sh ./
RUN chmod +x start.sh

# Create a health check endpoint script
RUN echo '#!/bin/bash\ncurl -f http://localhost:3001 || exit 1' > /app/healthcheck.sh && chmod +x /app/healthcheck.sh

# Expose ports
EXPOSE 3001 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /app/healthcheck.sh

# Start command
CMD ["./start.sh"]