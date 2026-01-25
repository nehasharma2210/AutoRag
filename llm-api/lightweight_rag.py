"""
Lightweight RAG API for low-memory environments (512MB)
Optimized for Render free tier
"""

import json
import logging
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Lightweight AutoRAG API",
    description="Memory-optimized RAG system for low-resource environments",
    version="1.0.0"
)

class QueryRequest(BaseModel):
    query: str
    threshold: float = 0.7
    max_results: int = 5
    use_healing: bool = True

class QueryResponse(BaseModel):
    query: str
    answer: str
    trust_score_before: float
    trust_score_after: float
    healing_triggered: bool
    healing_successful: bool
    sources_used: List[str]
    timestamp: str

# Lightweight knowledge base
KNOWLEDGE_BASE = [
    "AutoRAG is an automated retrieval augmented generation system that helps process documents intelligently.",
    "Machine learning enables computers to learn and make decisions from data without explicit programming.",
    "Natural language processing (NLP) helps computers understand and process human language effectively.",
    "FastAPI is a modern, fast web framework for building APIs with Python based on standard Python type hints.",
    "Vector databases are specialized databases designed to store and query high-dimensional vectors efficiently.",
    "Retrieval Augmented Generation (RAG) combines information retrieval with text generation for better responses.",
    "AI and machine learning are transforming how businesses process and understand documents and data.",
    "Document intelligence involves extracting meaningful information from various document formats automatically.",
    "Python is a popular programming language used for AI, machine learning, and web development applications.",
    "Artificial Intelligence is revolutionizing various industries including healthcare, finance, and education.",
    "Cloud computing provides on-demand access to computing resources over the internet efficiently.",
    "Data science combines statistics, programming, and domain expertise to extract insights from data.",
    "Deep learning is a subset of machine learning that uses neural networks with multiple layers.",
    "Natural language understanding helps computers comprehend and respond to human language naturally."
]

def simple_similarity_search(query: str, knowledge_base: List[str], max_results: int = 3) -> List[str]:
    """Simple keyword-based similarity search"""
    query_words = set(query.lower().split())
    scored_docs = []
    
    for doc in knowledge_base:
        doc_words = set(doc.lower().split())
        # Simple Jaccard similarity
        intersection = len(query_words.intersection(doc_words))
        union = len(query_words.union(doc_words))
        score = intersection / union if union > 0 else 0
        
        if score > 0:
            scored_docs.append((doc, score))
    
    # Sort by score and return top results
    scored_docs.sort(key=lambda x: x[1], reverse=True)
    return [doc for doc, score in scored_docs[:max_results]]

def search_wikipedia_simple(query: str, max_results: int = 2) -> List[str]:
    """Simple Wikipedia search using API"""
    try:
        # Wikipedia API search
        search_url = "https://en.wikipedia.org/w/api.php"
        search_params = {
            "action": "query",
            "format": "json",
            "list": "search",
            "srsearch": query,
            "srlimit": max_results
        }
        
        response = requests.get(search_url, params=search_params, timeout=10)
        if response.status_code != 200:
            return []
        
        data = response.json()
        search_results = data.get("query", {}).get("search", [])
        
        wiki_info = []
        for result in search_results:
            title = result.get("title", "")
            snippet = result.get("snippet", "")
            if title and snippet:
                # Clean HTML tags from snippet
                clean_snippet = BeautifulSoup(snippet, "html.parser").get_text()
                wiki_info.append(f"From Wikipedia ({title}): {clean_snippet}")
        
        return wiki_info
        
    except Exception as e:
        logger.warning(f"Wikipedia search failed: {e}")
        return []

def web_search_simple(query: str, max_results: int = 1) -> List[str]:
    """Simple web search fallback"""
    try:
        # Try DuckDuckGo search if available
        from duckduckgo_search import DDGS
        results = []
        ddgs = DDGS()
        search_results = ddgs.text(query, max_results=max_results)
        for result in search_results:
            body = result.get('body', '')[:200]
            if body:
                results.append(f"From web: {body}...")
        return results
    except ImportError:
        logger.info("DuckDuckGo search not available")
        return []
    except Exception as e:
        logger.warning(f"Web search failed: {e}")
        return []

@app.on_event("startup")
async def startup_event():
    """Initialize the lightweight RAG system"""
    logger.info("🚀 Initializing Lightweight RAG System...")
    logger.info(f"📚 Knowledge base loaded with {len(KNOWLEDGE_BASE)} documents")
    logger.info("✅ Lightweight RAG System ready!")

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Lightweight AutoRAG API",
        "version": "1.0.0",
        "status": "running",
        "memory_optimized": True,
        "endpoints": {
            "POST /query": "Query the RAG system",
            "GET /health": "Health check",
            "GET /": "This endpoint"
        }
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "memory_optimized": True,
        "knowledge_base_size": len(KNOWLEDGE_BASE)
    }

@app.post("/query", response_model=QueryResponse)
async def query_rag(request: QueryRequest):
    """Query the lightweight RAG system"""
    try:
        if not request.query or not request.query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        query = request.query.strip()
        logger.info(f"Processing query: {query}")
        
        # Search knowledge base
        kb_results = simple_similarity_search(query, KNOWLEDGE_BASE, max_results=3)
        sources_used = ["Knowledge Base"]
        
        # Initial response from knowledge base
        if kb_results:
            before_answer = " ".join(kb_results[:2])
            trust_score_before = 0.8  # High confidence for knowledge base
        else:
            before_answer = "No relevant information found in knowledge base."
            trust_score_before = 0.1
        
        # Self-healing: search external sources if confidence is low
        healing_triggered = False
        healing_successful = False
        after_answer = before_answer
        trust_score_after = trust_score_before
        
        if request.use_healing and trust_score_before < request.threshold:
            healing_triggered = True
            logger.info("🔄 Self-healing triggered - searching external sources...")
            
            # Try Wikipedia first
            wiki_results = search_wikipedia_simple(query, max_results=2)
            if wiki_results:
                sources_used.append("Wikipedia")
                after_answer = " ".join(wiki_results + kb_results[:1])
                trust_score_after = 0.9
                healing_successful = True
                logger.info("✅ Wikipedia search successful")
            else:
                # Fallback to web search
                web_results = web_search_simple(query, max_results=1)
                if web_results:
                    sources_used.append("Web Search")
                    after_answer = " ".join(web_results + kb_results[:1])
                    trust_score_after = 0.7
                    healing_successful = True
                    logger.info("✅ Web search successful")
        
        # Final answer
        final_answer = after_answer if after_answer else f"I couldn't find specific information about '{query}'. Try rephrasing your question or asking about a different topic."
        
        return QueryResponse(
            query=query,
            answer=final_answer,
            trust_score_before=round(trust_score_before, 3),
            trust_score_after=round(trust_score_after, 3),
            healing_triggered=healing_triggered,
            healing_successful=healing_successful,
            sources_used=sources_used,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error processing query: {e}")
        raise HTTPException(status_code=500, detail=f"Query processing failed: {str(e)}")

@app.post("/query/demo")
async def query_demo(request: QueryRequest):
    """Demo endpoint with formatted output"""
    try:
        result = await query_rag(request)
        
        output = f"""
╔════════════════════════════════════════════════════════════════╗
║                    Lightweight AutoRAG Query                   ║
╚════════════════════════════════════════════════════════════════╝

Query: {request.query}
Trust Score (before): {result.trust_score_before}
Trust Score (after): {result.trust_score_after}
Healing Triggered: {'Yes' if result.healing_triggered else 'No'}
Healing Successful: {'Yes' if result.healing_successful else 'No'}

Sources Used:
{chr(10).join(f'  • {source}' for source in result.sources_used)}

{'─' * 60}
ANSWER:
{'─' * 60}
{result.answer}
"""
        
        return JSONResponse(content={"formatted_output": output, "data": result.dict()})
        
    except Exception as e:
        logger.error(f"Error in demo query: {e}")
        raise HTTPException(status_code=500, detail=f"Demo query failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")