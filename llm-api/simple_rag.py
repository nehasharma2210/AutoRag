"""
Simple RAG API without heavy ML dependencies
Mock responses for demo purposes
"""

import json
import random
from typing import Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup

# Initialize FastAPI app
app = FastAPI(
    title="Simple RAG API",
    description="A lightweight RAG system for demo purposes",
    version="1.0.0"
)

class QueryRequest(BaseModel):
    query: str
    threshold: float = 0.7
    max_results: int = 5
    use_healing: bool = True

# Mock knowledge base
MOCK_KNOWLEDGE = [
    "AutoRAG is an automated retrieval augmented generation system that helps process documents intelligently.",
    "Machine learning enables computers to learn and make decisions from data without explicit programming.",
    "Natural language processing (NLP) helps computers understand and process human language.",
    "FastAPI is a modern, fast web framework for building APIs with Python based on standard Python type hints.",
    "Vector databases are specialized databases designed to store and query high-dimensional vectors efficiently.",
    "Retrieval Augmented Generation (RAG) combines information retrieval with text generation for better responses.",
    "AI and machine learning are transforming how businesses process and understand documents.",
    "Document intelligence involves extracting meaningful information from various document formats.",
    "New Delhi is the capital of India, located in the northern part of the country.",
    "India is a diverse country with 28 states and 8 union territories.",
    "Python is a popular programming language used for AI and machine learning applications.",
    "Mumbai is the financial capital of India and the most populous city in the country.",
    "Artificial Intelligence is revolutionizing various industries including healthcare, finance, and education.",
    "Cloud computing provides on-demand access to computing resources over the internet."
]

def simple_search(query: str, max_results: int = 3) -> list:
    """Simple keyword-based search in mock knowledge base"""
    query_lower = query.lower()
    results = []
    
    for knowledge in MOCK_KNOWLEDGE:
        # Simple keyword matching
        if any(word in knowledge.lower() for word in query_lower.split()):
            results.append(knowledge)
    
    return results[:max_results]

def web_search(query: str, max_results: int = 2) -> list:
    """Simple web search using DuckDuckGo"""
    try:
        from duckduckgo_search import DDGS
        results = []
        ddgs = DDGS()
        search_results = ddgs.text(query, max_results=max_results)
        for result in search_results:
            results.append(f"From web: {result.get('body', '')[:200]}...")
        return results
    except Exception as e:
        # Return empty list instead of error message for cleaner responses
        return []

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Simple RAG API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "POST /query": "Query the RAG system",
            "GET /health": "Health check",
            "GET /": "This endpoint"
        }
    }

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Simple RAG API",
        "version": "1.0.0"
    }

@app.post("/query")
async def query_rag(request: QueryRequest):
    """
    Query the simple RAG system.
    Returns mock responses based on simple keyword matching.
    """
    try:
        query = request.query.strip()
        if not query:
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        # Simple knowledge base search
        kb_results = simple_search(query, max_results=3)
        
        # Web search if enabled
        web_results = []
        if request.use_healing:
            web_results = web_search(query, max_results=2)
        
        # Combine results
        all_results = kb_results + web_results
        
        # Generate simple response
        if all_results:
            response_text = f"Based on the available information about '{query}', here's what I found:\n\n"
            for i, result in enumerate(all_results[:request.max_results], 1):
                response_text += f"{i}. {result}\n\n"
            
            response_text += "This response was generated using a simple RAG system for demonstration purposes."
        else:
            response_text = f"I couldn't find specific information about '{query}' in the knowledge base. This is a demo system with limited knowledge."
        
        return {
            "query": query,
            "response": response_text,
            "sources": all_results[:request.max_results],
            "metadata": {
                "total_sources": len(all_results),
                "kb_sources": len(kb_results),
                "web_sources": len(web_results),
                "threshold": request.threshold,
                "healing_enabled": request.use_healing
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query processing failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)