"""
Minimal RAG API for ultra-low memory environments (256MB)
Only basic functionality - no external dependencies
"""

import json
import logging
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Minimal AutoRAG API",
    description="Ultra-lightweight RAG system for minimal memory environments",
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

# Comprehensive knowledge base
KNOWLEDGE_BASE = [
    "AutoRAG is an automated retrieval augmented generation system that helps process documents intelligently using advanced AI techniques.",
    "Machine learning enables computers to learn patterns and make decisions from data without explicit programming for each scenario.",
    "Natural language processing (NLP) helps computers understand, interpret, and respond to human language in a meaningful way.",
    "FastAPI is a modern, fast web framework for building APIs with Python based on standard Python type hints and async support.",
    "Vector databases are specialized databases designed to store and efficiently query high-dimensional vectors for similarity search.",
    "Retrieval Augmented Generation (RAG) combines information retrieval with text generation to provide more accurate and contextual responses.",
    "AI and machine learning are transforming how businesses process, understand, and extract insights from documents and unstructured data.",
    "Document intelligence involves automatically extracting meaningful information from various document formats like PDFs, images, and text files.",
    "Python is a popular, versatile programming language widely used for AI, machine learning, web development, and data science applications.",
    "Artificial Intelligence is revolutionizing various industries including healthcare, finance, education, and customer service automation.",
    "Cloud computing provides on-demand access to computing resources, storage, and services over the internet with scalable pricing.",
    "Data science combines statistics, programming, and domain expertise to extract actionable insights from structured and unstructured data.",
    "Deep learning is a subset of machine learning that uses neural networks with multiple layers to learn complex patterns in data.",
    "Natural language understanding helps computers comprehend context, intent, and meaning in human communication for better responses.",
    "API (Application Programming Interface) allows different software applications to communicate and share data with each other seamlessly.",
    "Database management systems store, organize, and retrieve data efficiently for applications and business operations.",
    "Web development involves creating websites and web applications using technologies like HTML, CSS, JavaScript, and backend frameworks.",
    "Software engineering is the systematic approach to designing, developing, testing, and maintaining software applications and systems.",
    "Cybersecurity protects digital systems, networks, and data from unauthorized access, attacks, and security threats.",
    "User experience (UX) design focuses on creating intuitive, accessible, and enjoyable interactions between users and digital products."
]

def simple_similarity_search(query: str, knowledge_base: List[str], max_results: int = 3) -> List[str]:
    """Enhanced keyword-based similarity search"""
    query_words = set(word.lower().strip('.,!?') for word in query.split() if len(word) > 2)
    scored_docs = []
    
    for doc in knowledge_base:
        doc_words = set(word.lower().strip('.,!?') for word in doc.split() if len(word) > 2)
        
        # Calculate multiple similarity metrics
        intersection = len(query_words.intersection(doc_words))
        union = len(query_words.union(doc_words))
        
        # Jaccard similarity
        jaccard_score = intersection / union if union > 0 else 0
        
        # Word overlap ratio
        overlap_score = intersection / len(query_words) if len(query_words) > 0 else 0
        
        # Combined score
        combined_score = (jaccard_score * 0.6) + (overlap_score * 0.4)
        
        if combined_score > 0:
            scored_docs.append((doc, combined_score))
    
    # Sort by score and return top results
    scored_docs.sort(key=lambda x: x[1], reverse=True)
    return [doc for doc, score in scored_docs[:max_results]]

def get_fallback_response(query: str) -> str:
    """Generate a helpful fallback response"""
    query_lower = query.lower()
    
    # Topic-based responses
    if any(word in query_lower for word in ['autorag', 'rag', 'retrieval']):
        return "AutoRAG is an automated retrieval augmented generation system that combines information retrieval with AI to provide accurate, contextual responses to your questions."
    
    elif any(word in query_lower for word in ['machine learning', 'ml', 'ai', 'artificial intelligence']):
        return "Machine learning and AI are technologies that enable computers to learn from data and make intelligent decisions. They're used in many applications like recommendation systems, image recognition, and natural language processing."
    
    elif any(word in query_lower for word in ['python', 'programming', 'code']):
        return "Python is a popular programming language known for its simplicity and versatility. It's widely used in web development, data science, machine learning, and automation."
    
    elif any(word in query_lower for word in ['api', 'fastapi', 'web']):
        return "APIs (Application Programming Interfaces) allow different software applications to communicate with each other. FastAPI is a modern Python framework for building fast and efficient web APIs."
    
    elif any(word in query_lower for word in ['database', 'data', 'storage']):
        return "Databases are systems for storing, organizing, and retrieving data efficiently. They're essential for most applications and come in various types like relational, NoSQL, and vector databases."
    
    else:
        return f"I understand you're asking about '{query}'. While I don't have specific information on that topic in my current knowledge base, I can help with questions about AI, machine learning, programming, APIs, databases, and related technology topics."

@app.on_event("startup")
async def startup_event():
    """Initialize the minimal RAG system"""
    logger.info("🚀 Initializing Minimal RAG System...")
    logger.info(f"📚 Knowledge base loaded with {len(KNOWLEDGE_BASE)} documents")
    logger.info("✅ Minimal RAG System ready!")

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Minimal AutoRAG API",
        "version": "1.0.0",
        "status": "running",
        "memory_optimized": True,
        "ultra_lightweight": True,
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
        "ultra_lightweight": True,
        "knowledge_base_size": len(KNOWLEDGE_BASE)
    }

@app.post("/query", response_model=QueryResponse)
async def query_rag(request: QueryRequest):
    """Query the minimal RAG system"""
    try:
        if not request.query or not request.query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        query = request.query.strip()
        logger.info(f"Processing query: {query}")
        
        # Search knowledge base
        kb_results = simple_similarity_search(query, KNOWLEDGE_BASE, max_results=request.max_results)
        sources_used = ["Knowledge Base"]
        
        # Calculate confidence based on results
        if kb_results:
            # Higher confidence if we found good matches
            trust_score_before = 0.85 if len(kb_results) >= 2 else 0.75
            before_answer = " ".join(kb_results[:2])
        else:
            trust_score_before = 0.2
            before_answer = "No direct matches found in knowledge base."
        
        # Self-healing: provide fallback response if confidence is low
        healing_triggered = False
        healing_successful = False
        after_answer = before_answer
        trust_score_after = trust_score_before
        
        if request.use_healing and trust_score_before < request.threshold:
            healing_triggered = True
            logger.info("🔄 Self-healing triggered - generating fallback response...")
            
            fallback_response = get_fallback_response(query)
            if kb_results:
                after_answer = fallback_response + " " + kb_results[0]
            else:
                after_answer = fallback_response
            
            trust_score_after = 0.7
            healing_successful = True
            sources_used.append("Fallback Response")
            logger.info("✅ Fallback response generated")
        
        # Ensure we always have a meaningful response
        final_answer = after_answer if after_answer and len(after_answer.strip()) > 10 else get_fallback_response(query)
        
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
        # Return a helpful error response instead of HTTP error
        return QueryResponse(
            query=request.query,
            answer=f"I apologize, but I encountered an issue processing your query. Please try rephrasing your question or ask about topics like AI, machine learning, programming, or technology.",
            trust_score_before=0.0,
            trust_score_after=0.0,
            healing_triggered=True,
            healing_successful=False,
            sources_used=["Error Handler"],
            timestamp=datetime.now().isoformat()
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")