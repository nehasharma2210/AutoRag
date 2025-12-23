# AUTORAG

 
 # Self-Healing RAG KNOWLEDGE ENGINE AWS IMPACTXCHALLENGE 

An improved Retrieval Augmented Generation (RAG) system with automatic self-healing capabilities that enhances answers by searching external sources when the base knowledge base has low confidence.

## Features

- **Self-Healing**: Automatically searches Wikipedia and the web when trust scores are low
- **Improved Text Cleaning**: Enhanced noise removal and text processing
- **Better Answer Quality**: Smarter sentence extraction and deduplication
- **FastAPI API**: RESTful API for easy integration
- **Intelligent Hybrid Retrieval**: Combines base knowledge with external sources
- **Caching**: LRU cache for frequently queried topics
- **Comprehensive Logging**: Detailed logging for debugging and monitoring

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Option 1: Run as FastAPI Server (Recommended)

```bash
python self_healing_rag.py
```

Or using uvicorn directly:
```bash
uvicorn self_healing_rag:app --reload --host 0.0.0.0 --port 8000
```

Then visit:
- **API Documentation**: http://localhost:8000/docs (Interactive Swagger UI)
- **Alternative Docs**: http://localhost:8000/redoc
- **Root**: http://localhost:8000/

### Option 2: Run Demo Script

```bash
python run_rag.py
```

This will initialize the system and run some example queries.

## API Endpoints

### POST /query
Query the RAG system.

**Request Body:**
```json
{
  "query": "What is quantum computing?",
  "threshold": 0.5,
  "max_results": 5,
  "use_healing": true
}
```

**Response:**
```json
{
  "query": "What is quantum computing?",
  "answer": "...",
  "before_answer": "...",
  "trust_score_before": 0.26,
  "trust_score_after": 0.81,
  "healing_triggered": true,
  "healing_successful": true,
  "sources_used": ["Base Knowledge Base", "Wikipedia: Quantum_computing"],
  "timestamp": "2025-01-XX..."
}
```

### POST /query/demo
Same as `/query` but returns formatted output for easy viewing.

### GET /health
Health check endpoint.

### GET /
API information.

## Improvements Made

1. **Better Text Cleaning**:
   - Enhanced noise pattern removal
   - Better HTML/JavaScript filtering
   - Improved sentence extraction
   - Deduplication of similar sentences

2. **Improved Self-Healing Logic**:
   - Prioritizes Wikipedia API for cleaner results
   - Better web scraping with content area detection
   - Smarter hybrid retrieval (weighted combination)
   - Improved trust score thresholds

3. **Better Answer Quality**:
   - Removes markdown and HTML artifacts
   - Better sentence boundary detection
   - Minimum length filtering for quality
   - Duplicate removal

4. **Performance & Reliability**:
   - LRU caching for queries
   - Better error handling
   - Comprehensive logging
   - Timeout handling for web requests

5. **API Features**:
   - FastAPI with automatic documentation
   - Request validation with Pydantic
   - Detailed response models
   - Demo endpoint with formatted output

## Example Queries

Try these queries to see the self-healing in action:

- "What is quantum computing?"
- "What are the latest AI regulations in Europe?"
- "How does OAuth authentication work?"
- "Explain machine learning algorithms"
- "What is blockchain technology?"

## Configuration

You can adjust the following parameters:

- `threshold`: Trust score below which healing is triggered (default: 0.5)
- `max_results`: Maximum number of results to return (default: 5)
- `use_healing`: Enable/disable self-healing (default: true)

## Requirements

See `requirements.txt` for all dependencies. Main dependencies:

- FastAPI
- sentence-transformers
- faiss-cpu
- datasets
- duckduckgo-search
- beautifulsoup4
- requests

## Notes

- First run will download the sentence transformer model (~80MB)
- First run will download the Wikitext dataset (~500MB)
- Initialization takes a few minutes to create embeddings
- Web scraping may take a few seconds per query

