"""
Simple RAG API with Wikipedia integration
Real information from Wikipedia + mock knowledge base
"""

import json
import random
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
import wikipedia

# Initialize FastAPI app
app = FastAPI(
    title="AutoRAG API with Wikipedia",
    description="A RAG system with Wikipedia integration",
    version="1.0.0"
)

class QueryRequest(BaseModel):
    query: str
    threshold: float = 0.7
    max_results: int = 5
    use_healing: bool = True

# Mock knowledge base (fallback)
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

def search_wikipedia(query: str, max_results: int = 3) -> List[str]:
    """Search Wikipedia for relevant information"""
    try:
        # Set language to English
        wikipedia.set_lang("en")
        
        # Search for pages
        search_results = wikipedia.search(query, results=max_results)
        
        if not search_results:
            return []
        
        wiki_info = []
        for title in search_results[:max_results]:
            try:
                # Get page summary
                summary = wikipedia.summary(title, sentences=2)
                wiki_info.append(f"From Wikipedia ({title}): {summary}")
            except wikipedia.exceptions.DisambiguationError as e:
                # Handle disambiguation by taking the first option
                try:
                    summary = wikipedia.summary(e.options[0], sentences=2)
                    wiki_info.append(f"From Wikipedia ({e.options[0]}): {summary}")
                except:
                    continue
            except wikipedia.exceptions.PageError:
                # Page doesn't exist, skip
                continue
            except Exception as e:
                # Other errors, skip this result
                continue
                
        return wiki_info
        
    except Exception as e:
        print(f"Wikipedia search error: {e}")
        return []

def simple_search(query: str, max_results: int = 3) -> List[str]:
    """Simple keyword-based search in mock knowledge base"""
    query_lower = query.lower()
    results = []
    
    for knowledge in MOCK_KNOWLEDGE:
        # Simple keyword matching
        if any(word in knowledge.lower() for word in query_lower.split()):
            results.append(knowledge)
    
    return results[:max_results]

def web_search(query: str, max_results: int = 2) -> List[str]:
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
        "message": "AutoRAG API with Wikipedia",
        "version": "1.0.0",
        "status": "running",
        "features": ["Wikipedia search", "Knowledge base", "Web search"],
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
        "service": "AutoRAG API with Wikipedia",
        "version": "1.0.0",
        "wikipedia": "enabled"
    }

@app.post("/query")
async def query_rag(request: QueryRequest):
    """
    Query the RAG system with Wikipedia integration.
    Returns real information from Wikipedia + knowledge base.
    """
    try:
        query = request.query.strip()
        if not query:
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        print(f"Processing query: {query}")
        
        # Search Wikipedia first (primary source)
        wiki_results = search_wikipedia(query, max_results=2)
        print(f"Wikipedia results: {len(wiki_results)}")
        
        # Search knowledge base (secondary)
        kb_results = simple_search(query, max_results=2)
        print(f"Knowledge base results: {len(kb_results)}")
        
        # Web search if enabled and needed
        web_results = []
        if request.use_healing and len(wiki_results) == 0:
            web_results = web_search(query, max_results=1)
            print(f"Web search results: {len(web_results)}")
        
        # Combine results (prioritize Wikipedia)
        all_results = wiki_results + kb_results + web_results
        
        # Generate response
        if all_results:
            response_text = f"Here's what I found about '{query}':\n\n"
            
            for i, result in enumerate(all_results[:request.max_results], 1):
                response_text += f"{i}. {result}\n\n"
            
            if wiki_results:
                response_text += "✅ Information sourced from Wikipedia and knowledge base."
            else:
                response_text += "ℹ️ Information from knowledge base and web search."
        else:
            response_text = f"I couldn't find specific information about '{query}'. Try rephrasing your question or asking about a different topic."
        
        return {
            "response": response_text,
            "query": query,
            "sources": all_results[:request.max_results],
            "metadata": {
                "total_sources": len(all_results),
                "wikipedia_sources": len(wiki_results),
                "kb_sources": len(kb_results),
                "web_sources": len(web_results),
                "threshold": request.threshold,
                "healing_enabled": request.use_healing
            }
        }
        
    except Exception as e:
        print(f"Query processing error: {e}")
        raise HTTPException(status_code=500, detail=f"Query processing failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)