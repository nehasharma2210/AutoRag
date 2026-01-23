"""
Self-Healing RAG (Retrieval Augmented Generation) System
FastAPI Application with Improved Self-Healing Capabilities
"""

import warnings
# Suppress duckduckgo_search deprecation warning more aggressively
warnings.filterwarnings("ignore")
warnings.filterwarnings("ignore", message=".*duckduckgo_search.*")
warnings.filterwarnings("ignore", message=".*has been renamed.*")
warnings.filterwarnings("ignore", category=RuntimeWarning, module="__main__")

import numpy as np
import faiss
import requests
import re
import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from urllib.parse import quote, unquote
import os
import pickle
from pathlib import Path

# Removed datasets import - causing PyArrow issues
# from datasets import load_dataset
from sentence_transformers import SentenceTransformer
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Self-Healing RAG API",
    description="A self-healing RAG system that automatically improves answers by searching external sources",
    version="1.0.0"
)

# Configuration
HEADERS = {
    "User-Agent": "AutoRAG-Demo/1.0 (contact: demo@example.com)"
}

BAD_PATTERNS = [
    r"accept all cookies",
    r"manage preferences",
    r"privacy policy",
    r"cookie",
    r"we value your privacy",
    r"essential cookies",
    r"skip to main",
    r"skip to content",
    r"menu",
    r"navigation",
    r"subscribe",
    r"newsletter",
    r"sign up",
    r"log in",
    r"register",
    r"follow us",
    r"share on",
    r"tweet",
    r"facebook",
    r"instagram",
    r"linkedin",
    r"twitter",
    r"copyright.*?copyright",
    r"all rights reserved",
    r"related articles",
    r"you may also like",
    r"read more",
    r"click here",
    r"advertisement",
    r"ad",
]

# Global variables (initialized on startup)
embedder = None
base_index = None
base_chunks = None


def _is_truthy_env(value: Optional[str]) -> bool:
    if value is None:
        return False
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


def _cache_paths() -> Tuple[Path, Path]:
    cache_dir = os.getenv("AUTORAG_CACHE_DIR")
    if cache_dir:
        base_dir = Path(cache_dir)
    else:
        base_dir = Path(__file__).resolve().parent / ".cache"
    return base_dir / "base_index.faiss", base_dir / "base_chunks.pkl"


def load_or_build_base_index(embedder: SentenceTransformer) -> Tuple[faiss.Index, List[str]]:
    index_path, chunks_path = _cache_paths()
    rebuild = _is_truthy_env(os.getenv("AUTORAG_REBUILD_CACHE")) or _is_truthy_env(os.getenv("AUTORAG_FORCE_REBUILD"))

    if index_path.exists() and chunks_path.exists() and not rebuild:
        logger.info("Loading cached base index and chunks...")
        loaded_index = faiss.read_index(str(index_path))
        with open(chunks_path, "rb") as f:
            loaded_chunks = pickle.load(f)
        logger.info(f"Loaded cached base index with {loaded_index.ntotal} vectors")
        return loaded_index, loaded_chunks

    logger.info("Building base index and chunks from scratch...")
    # Removed dataset loading - using simple text data instead
    # dataset = load_dataset("wikitext", "wikitext-103-v1", split="train")
    
    # Simple fallback data for demo
    sample_texts = [
        "AutoRAG is an automated retrieval augmented generation system.",
        "Machine learning helps in building intelligent applications.",
        "Natural language processing enables computers to understand human language.",
        "FastAPI is a modern web framework for building APIs with Python.",
        "Vector databases store and retrieve high-dimensional vectors efficiently."
    ]

    texts = []
    # Use sample texts instead of dataset
    for text in sample_texts:
        if text:
            texts.append(text)

    logger.info(f"Loaded {len(texts)} texts from sample data")

    built_chunks: List[str] = []
    for t in texts:
        built_chunks.extend(chunk_text(t))

    logger.info(f"Created {len(built_chunks)} base chunks")

    logger.info("Creating embeddings and FAISS index...")
    base_embeddings = embedder.encode(
        built_chunks,
        batch_size=32,
        show_progress_bar=True
    )
    base_embeddings = np.array(base_embeddings).astype("float32")
    faiss.normalize_L2(base_embeddings)

    built_index = faiss.IndexFlatIP(base_embeddings.shape[1])
    built_index.add(base_embeddings)

    index_path.parent.mkdir(parents=True, exist_ok=True)
    faiss.write_index(built_index, str(index_path))
    with open(chunks_path, "wb") as f:
        pickle.dump(built_chunks, f)

    logger.info(f"Saved base index cache to {index_path}")
    return built_index, built_chunks


class QueryRequest(BaseModel):
    query: str
    threshold: float = 0.5
    max_results: int = 5
    use_healing: bool = True


class QueryResponse(BaseModel):
    query: str
    answer: str
    before_answer: Optional[str] = None
    trust_score_before: float
    trust_score_after: float
    healing_triggered: bool
    healing_successful: bool
    sources_used: List[str]
    timestamp: str


def chunk_text(text: str, size: int = 500, overlap: int = 50) -> List[str]:
    """Split text into overlapping chunks."""
    chunks = []
    i = 0
    while i < len(text):
        chunks.append(text[i:i+size])
        i += size - overlap
    return chunks


def clean_text(text: str) -> str:
    """Enhanced text cleaning with better noise removal."""
    if not isinstance(text, str):
        return ""
    
    # Remove excessive whitespace and newlines first
    text = re.sub(r'\n+', ' ', text)
    text = re.sub(r'\r+', ' ', text)
    text = re.sub(r'\t+', ' ', text)
    
    # Remove URLs
    text = re.sub(r'http[s]?://\S+', '', text)
    text = re.sub(r'www\.\S+', '', text)
    
    # Remove email addresses
    text = re.sub(r'\S+@\S+', '', text)
    
    # Remove common web noise patterns (case-insensitive)
    for pattern in BAD_PATTERNS:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE)
    
    # Remove markdown headers and separators
    text = re.sub(r'^=+\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^#+\s*', '', text, flags=re.MULTILINE)
    
    # Remove excessive special characters but keep basic punctuation
    text = re.sub(r'[^\w\s\.\,\!\?\;\:\-\(\)\'\"\&\%\$\#]', ' ', text)
    
    # Remove multiple spaces
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    
    # Remove very short words that are likely noise (but keep common short words)
    words = text.split()
    common_short = ['ai', 'it', 'we', 'is', 'an', 'a', 'of', 'to', 'in', 'on', 'at', 'be', 'as', 'or', 'if']
    words = [w for w in words if len(w) > 2 or w.lower() in common_short]
    text = ' '.join(words)
    
    # Keep only substantial text (lower threshold - 50 chars minimum)
    if len(text) < 50:
        return ""
    
    return text


def clean_answer(text: str, max_sentences: int = 5, min_sentence_length: int = 30) -> str:
    """Enhanced answer cleaning with better sentence extraction."""
    if not text:
        return ""
    
    # Split into sentences (better than splitting on periods)
    sentences = re.split(r'(?<=[.!?])\s+', text)
    sentences = [
        s.strip() 
        for s in sentences 
        if len(s.strip()) > min_sentence_length 
        and not s.strip().startswith('=')  # Remove headers
        and not s.strip().startswith('#')  # Remove markdown headers
    ]
    
    # Remove duplicate sentences (simple deduplication)
    seen = set()
    unique_sentences = []
    for s in sentences:
        s_lower = s.lower()[:50]  # Compare first 50 chars
        if s_lower not in seen:
            seen.add(s_lower)
            unique_sentences.append(s)
    
    # Take first few meaningful sentences
    result = ". ".join(unique_sentences[:max_sentences])
    
    # Clean up any remaining artifacts
    result = re.sub(r'\s+', ' ', result)
    result = re.sub(r'\.{2,}', '.', result)  # Remove multiple periods
    result = result.strip()
    
    # Ensure it ends with punctuation
    if result and result[-1] not in '.!?':
        result += "."
    
    # Final cleanup - remove any remaining markdown or HTML artifacts
    result = re.sub(r'\[.*?\]', '', result)  # Remove markdown links
    result = re.sub(r'<.*?>', '', result)  # Remove HTML tags
    result = re.sub(r'\s+', ' ', result).strip()
    
    return result


def retrieve_from(index: faiss.Index, chunks: List[str], query: str, k: int = 3) -> Tuple[List[str], float]:
    """Retrieve relevant chunks from the index."""
    if index is None or len(chunks) == 0:
        return [], 0.0
    
    try:
        q = embedder.encode([query]).astype("float32")
        faiss.normalize_L2(q)

        num_results = min(k, len(chunks))
        scores, idxs = index.search(q, num_results)
        
        if len(idxs[0]) == 0:
            return [], 0.0
        
        # Filter by minimum score threshold and get docs
        docs = []
        valid_scores = []
        for i, idx in enumerate(idxs[0]):
            if scores[0][i] > 0.15:  # Slightly higher threshold for better quality
                docs.append(chunks[idx])
                valid_scores.append(scores[0][i])
        
        # Return average of valid scores
        avg_score = float(np.mean(valid_scores)) if valid_scores else 0.0
        return docs, avg_score
    except Exception as e:
        logger.error(f"Error in retrieve_from: {e}")
        return [], 0.0


def self_heal(query: str) -> Tuple[List[str], List[str]]:
    """
    Enhanced self-healing with better source prioritization and cleaning.
    Returns: (chunks, sources)
    """
    texts = []
    sources = []
    
    # Try Wikipedia API first (more reliable and clean)
    try:
        # Try multiple title formats (Wikipedia titles are case-sensitive and capitalized)
        title_variants = [
            query.replace(" ", "_"),  # Original: "quantum computing" -> "quantum_computing"
            query.title().replace(" ", "_"),  # Title case: "Quantum Computing" -> "Quantum_Computing"
            query.capitalize().replace(" ", "_"),  # First word capitalized: "Quantum_computing"
        ]
        
        wiki_found = False
        for title_encoded in title_variants:
            api_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{quote(title_encoded, safe='')}"
            logger.debug(f"Trying Wikipedia: {title_encoded}")
            resp = requests.get(api_url, headers=HEADERS, timeout=10)
            
            if resp.status_code == 200:
                data = resp.json()
                extract = data.get("extract", "")
                if extract and len(extract) > 50:
                    cleaned = clean_text(extract)
                    if cleaned and len(cleaned) > 50:
                        texts.append(cleaned)
                        sources.append(f"Wikipedia: {title_encoded}")
                        logger.info(f" Found Wikipedia summary for: {title_encoded} ({len(cleaned)} chars)")
                        wiki_found = True
                        break
        
        if not wiki_found:
            logger.info("Wikipedia direct lookup failed, trying Wikipedia search API...")
            # Try Wikipedia's search API directly (more reliable than DuckDuckGo)
            try:
                # Use Wikipedia's search API
                search_api_url = "https://en.wikipedia.org/w/api.php"
                search_params = {
                    "action": "query",
                    "format": "json",
                    "list": "search",
                    "srsearch": query,
                    "srlimit": 3
                }
                search_resp = requests.get(search_api_url, params=search_params, headers=HEADERS, timeout=10)
                
                if search_resp.status_code == 200:
                    search_data = search_resp.json()
                    search_results = search_data.get("query", {}).get("search", [])
                    logger.info(f"Found {len(search_results)} Wikipedia search results via API")
                    
                    for result in search_results:
                        page_title = result.get("title", "")
                        if page_title:
                            # Get summary for this page
                            page_title_encoded = quote(page_title, safe='')
                            summary_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{page_title_encoded}"
                            summary_resp = requests.get(summary_url, headers=HEADERS, timeout=10)
                            if summary_resp.status_code == 200:
                                summary_data = summary_resp.json()
                                extract = summary_data.get("extract", "")
                                if extract and len(extract) > 50:
                                    cleaned = clean_text(extract)
                                    if cleaned and len(cleaned) > 50:
                                        texts.append(cleaned)
                                        sources.append(f"Wikipedia: {page_title}")
                                        logger.info(f" Found Wikipedia page via search: {page_title} ({len(cleaned)} chars)")
                                        break  # Use first good result
                            else:
                                logger.debug(f"Wikipedia API failed for {page_title_encoded}: {summary_resp.status_code}")
                
                # Fallback: Try DuckDuckGo if Wikipedia search API fails
                if not texts:
                    logger.info("Wikipedia API search failed, trying DuckDuckGo...")
                    with DDGS() as ddgs:
                        wiki_results = list(ddgs.text(f"{query} site:wikipedia.org", max_results=3))
                        logger.info(f"Found {len(wiki_results)} Wikipedia results via DuckDuckGo")
                        for result in wiki_results:
                            url = result.get("href", "")
                            if "wikipedia.org/wiki/" in url:
                                # Extract page title from URL and decode it
                                page_title = url.split("/wiki/")[-1].split("#")[0].split("?")[0]
                                page_title = unquote(page_title)
                                # Get summary for this page
                                page_title_encoded = quote(page_title, safe='')
                                summary_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{page_title_encoded}"
                                summary_resp = requests.get(summary_url, headers=HEADERS, timeout=10)
                                if summary_resp.status_code == 200:
                                    summary_data = summary_resp.json()
                                    extract = summary_data.get("extract", "")
                                    if extract and len(extract) > 50:
                                        cleaned = clean_text(extract)
                                        if cleaned and len(cleaned) > 50:
                                            texts.append(cleaned)
                                            sources.append(f"Wikipedia: {page_title}")
                                            logger.info(f" Found Wikipedia page via DuckDuckGo: {page_title} ({len(cleaned)} chars)")
                                            break
            except Exception as e:
                logger.warning(f"Wikipedia search failed: {e}")
                pass
    except Exception as e:
        logger.warning(f"Wikipedia API failed: {e}")
        pass
    
    # Web scraping as fallback (but with better cleaning and selection)
    # Try web if we have less than 2 good sources
    if len(texts) < 2:
        try:
            with DDGS() as ddgs:
                # Better search query - more specific to avoid irrelevant results
                # Remove common question words and focus on key terms
                query_words = [w for w in query.lower().split() if w not in ['what', 'is', 'are', 'how', 'does', 'the', 'a', 'an']]
                search_query = " ".join(query_words[:5])  # Take first 5 meaningful words
                if not search_query:
                    search_query = query
                
                # Add context terms to improve relevance
                search_query = f"{search_query} definition explanation what is"
                logger.info(f"Web search query: {search_query}")
                web_results = list(ddgs.text(search_query, max_results=5))
                logger.info(f"Found {len(web_results)} web search results")
                
                for idx, r in enumerate(web_results, 1):
                    url = r.get("href", "")
                    title = r.get("title", "")[:50]
                    logger.info(f"  [{idx}/{len(web_results)}] Processing: {url[:80]} (title: {title})")
                    
                    # Skip Wikipedia URLs as we already tried those
                    if "wikipedia.org" in url:
                        logger.debug(f"    Skipping Wikipedia URL")
                        continue
                        
                    try:
                        logger.info(f"    Fetching URL...")
                        resp = requests.get(url, headers=HEADERS, timeout=10, allow_redirects=True)
                        logger.info(f"    Status: {resp.status_code}, Content-Type: {resp.headers.get('content-type', 'unknown')}")
                        
                        if resp.status_code == 200 and resp.headers.get('content-type', '').startswith('text/html'):
                            logger.info(f"    Parsing HTML ({len(resp.text)} chars)...")
                            soup = BeautifulSoup(resp.text, "html.parser")
                            
                            # Remove script and style elements
                            for script in soup(["script", "style", "meta", "link", "nav", "header", "footer", "aside"]):
                                script.decompose()
                            
                            # Try to get main content areas with better selection
                            main_content = None
                            
                            # Strategy 1: Look for main/article tags
                            main_articles = soup.find_all(['main', 'article'])
                            logger.info(f"    Strategy 1: Found {len(main_articles)} main/article tags")
                            for tag in main_articles:
                                text = tag.get_text(separator=' ', strip=True)
                                logger.info(f"    Main/article text length (raw): {len(text)}")
                                if text and len(text) > 150:  # Lower threshold
                                    cleaned = clean_text(text)
                                    logger.info(f"    After cleaning: {len(cleaned)} chars")
                                    if cleaned and len(cleaned) > 150:
                                        main_content = cleaned
                                        logger.info(f"     Strategy 1 SUCCESS: Found {len(main_content)} chars in main/article")
                                        break
                            
                            # Strategy 2: Try divs with content-related classes
                            if not main_content:
                                content_divs = soup.find_all('div', class_=re.compile(r'content|main|article|post|entry|text|body|description|paragraph', re.I))
                                logger.info(f"    Strategy 2: Found {len(content_divs)} content divs")
                                for tag in content_divs:
                                    text = tag.get_text(separator=' ', strip=True)
                                    if text and len(text) > 150:
                                        cleaned = clean_text(text)
                                        if cleaned and len(cleaned) > 150:
                                            main_content = cleaned
                                            logger.info(f"     Strategy 2 SUCCESS: Found {len(main_content)} chars in content div")
                                            break
                            
                            # Strategy 3: Try paragraphs - collect substantial paragraphs
                            if not main_content:
                                all_paragraphs = soup.find_all('p')
                                logger.info(f"    Strategy 3: Found {len(all_paragraphs)} paragraph tags")
                                paragraphs = []
                                for p in all_paragraphs:
                                    text = p.get_text(separator=' ', strip=True)
                                    cleaned = clean_text(text)
                                    if cleaned and len(cleaned) > 50:  # Individual paragraph threshold
                                        paragraphs.append(cleaned)
                                logger.info(f"    Valid paragraphs after cleaning: {len(paragraphs)}")
                                if paragraphs:
                                    # Combine paragraphs
                                    combined = ' '.join(paragraphs[:10])  # Limit to first 10 paragraphs
                                    logger.info(f"    Combined paragraphs length: {len(combined)}")
                                    if len(combined) > 200:
                                        main_content = combined
                                        logger.info(f"     Strategy 3 SUCCESS: Found {len(main_content)} chars from paragraphs")
                            
                            # Strategy 4: Fallback to body text with noise removal
                            if not main_content:
                                body = soup.find('body')
                                if body:
                                    logger.info(f"    Strategy 4: Trying body text extraction...")
                                    # Remove navigation and other noise
                                    for noise in body.find_all(['nav', 'header', 'footer', 'script', 'style', 'aside']):
                                        noise.decompose()
                                    text = body.get_text(separator=' ', strip=True)
                                    logger.info(f"    Body text length (raw): {len(text)}")
                                    if text and len(text) > 200:
                                        cleaned = clean_text(text)
                                        logger.info(f"    Body text length (cleaned): {len(cleaned)}")
                                        if cleaned and len(cleaned) > 150:  # More lenient for body text
                                            main_content = cleaned
                                            logger.info(f"     Strategy 4 SUCCESS: Found {len(main_content)} chars in body")
                                else:
                                    logger.info(f"    No body tag found")
                            
                            if main_content:
                                texts.append(main_content)
                                sources.append(f"Web: {url[:60]}...")
                                logger.info(f" Extracted {len(main_content)} chars from: {url[:60]}")
                            else:
                                # Last resort: Try minimal cleaning - just get paragraphs with minimal filtering
                                logger.info(f"    All strategies failed, trying minimal cleaning fallback...")
                                paragraphs = []
                                for p in soup.find_all('p'):
                                    raw_text = p.get_text(separator=' ', strip=True)
                                    # Minimal cleaning - just remove excessive whitespace
                                    raw_text = re.sub(r'\s+', ' ', raw_text).strip()
                                    if raw_text and len(raw_text) > 50 and not raw_text.isupper():  # Skip ALL CAPS noise
                                        paragraphs.append(raw_text)
                                
                                logger.info(f"    Minimal cleaning found {len(paragraphs)} valid paragraphs")
                                if paragraphs:
                                    combined = ' '.join(paragraphs[:5])  # Take first 5 paragraphs
                                    logger.info(f"    Combined (before final cleaning): {len(combined)} chars")
                                    if len(combined) > 100:
                                        # Apply minimal cleaning
                                        combined = re.sub(r'http[s]?://\S+', '', combined)
                                        combined = re.sub(r'\s+', ' ', combined).strip()
                                        logger.info(f"    Combined (after final cleaning): {len(combined)} chars")
                                        if len(combined) > 100:
                                            texts.append(combined)
                                            sources.append(f"Web: {url[:60]}...")
                                            logger.info(f"     Fallback SUCCESS: Extracted {len(combined)} chars (minimal cleaning)")
                                else:
                                    logger.warning(f"    ❌ FAILED: Could not extract any content. Checked {len(soup.find_all('p'))} paragraphs but none met criteria.")
                        else:
                            logger.warning(f"    Skipping - Status: {resp.status_code}, Content-Type: {resp.headers.get('content-type', 'unknown')}")
                            continue
                    except Exception as e:
                        logger.warning(f"    ❌ Error processing URL {url[:60]}: {str(e)[:100]}")
                        continue
                    
                    if len(texts) >= 3:  # Limit to avoid too much noise
                        break
        except Exception as e:
            logger.warning(f"Web search failed: {e}")
            pass

    heal_chunks = []
    for i, t in enumerate(texts):
        if t and len(t.strip()) > 50:  # Lower threshold to get more content
            chunks = chunk_text(t)
            heal_chunks.extend(chunks)
            logger.debug(f"Source {i+1}: {len(chunks)} chunks from {len(t)} chars")

    if heal_chunks:
        logger.info(f" Self-healing collected {len(heal_chunks)} chunks from {len(sources)} sources")
        logger.info(f"   Sources: {', '.join(sources)}")
    else:
        logger.warning(f"⚠️ Self-healing found {len(texts)} texts but no valid chunks after processing")
        if texts:
            logger.warning(f"   Text lengths: {[len(t) for t in texts]}")
            logger.warning(f"   After cleaning lengths: {[len(clean_text(t)) for t in texts]}")
    
    if not texts and not heal_chunks:
        logger.error("❌ Self-healing failed - no content found from any source")
    
    return heal_chunks, sources


def build_heal_index(heal_chunks: List[str]) -> Tuple[Optional[faiss.Index], List[str]]:
    """Build FAISS index from healing chunks."""
    if not heal_chunks:
        return None, []

    try:
        emb = embedder.encode(heal_chunks, batch_size=32, show_progress_bar=False).astype("float32")
        faiss.normalize_L2(emb)

        index = faiss.IndexFlatIP(emb.shape[1])
        index.add(emb)

        return index, heal_chunks
    except Exception as e:
        logger.error(f"Error building heal index: {e}")
        return None, []


def autorag_with_diff(query: str, threshold: float = 0.5, k: int = 5, use_healing: bool = True) -> Dict:
    """
    Enhanced AutoRAG with improved self-healing logic.
    Returns a dictionary with all results.
    """
    # BEFORE: base knowledge only
    before_docs, score_before = retrieve_from(
        base_index, base_chunks, query, k=k
    )

    after_docs = before_docs.copy() if before_docs else []
    score_after = score_before
    healing_triggered = False
    healing_successful = False
    sources_used = ["Base Knowledge Base"]

    # Heal ONLY if needed and enabled
    if use_healing and score_before < threshold:
        healing_triggered = True
        logger.info(f"⚠️ Self-healing triggered (score: {score_before:.3f} < {threshold})")
        
        heal_chunks, heal_sources = self_heal(query)
        
        if heal_chunks:
            heal_index, heal_chunks_list = build_heal_index(heal_chunks)

            if heal_index and heal_chunks_list:
                heal_docs, score_heal = retrieve_from(
                    heal_index, heal_chunks_list, query, k=k
                )
                
                sources_used.extend(heal_sources)
                
                logger.info(f"Healed results: score={score_heal:.3f}, docs={len(heal_docs)}")
                
                # Improved hybrid approach: combine base and healed results intelligently
                if score_heal > score_before * 1.15:  # Healed is significantly better (15% improvement)
                    # Use healed results if they're significantly better
                    after_docs = heal_docs
                    score_after = score_heal
                    healing_successful = True
                    logger.info(f" Using healed results (score improvement: {score_before:.3f} -> {score_heal:.3f})")
                elif score_before < 0.3:  # Base is very poor
                    # Use healed results if base is very poor (even if only slightly better)
                    if score_heal > score_before:
                        after_docs = heal_docs
                        score_after = score_heal
                        healing_successful = True
                        logger.info(f" Using healed results (base too poor: {score_before:.3f} -> {score_heal:.3f})")
                    else:
                        logger.info(f"⚠️ Healed score ({score_heal:.3f}) not better than base ({score_before:.3f}), keeping base")
                elif score_heal > score_before * 0.9:  # Healed is at least 90% as good
                    # Combine both if healed is decent
                    combined_docs = (before_docs[:2] + heal_docs[:2] + before_docs[2:] + heal_docs[2:])[:k*2]
                    # Deduplicate while preserving order
                    seen = set()
                    unique_docs = []
                    for doc in combined_docs:
                        doc_key = doc[:100].lower()
                        if doc_key not in seen:
                            seen.add(doc_key)
                            unique_docs.append(doc)
                    after_docs = unique_docs[:k]
                    score_after = (score_before * 0.3 + score_heal * 0.7)  # Weight healed more
                    healing_successful = True
                    logger.info(f" Combined base + healed results (weighted score: {score_after:.3f})")
                elif score_heal > score_before:
                    # Even small improvement - prefer healed
                    after_docs = heal_docs
                    score_after = score_heal
                    healing_successful = True
                    logger.info(f" Using healed results (slight improvement: {score_before:.3f} -> {score_heal:.3f})")
                else:
                    # Base is better, keep it
                    logger.info(f"ℹ️ Base results better, keeping original (base: {score_before:.3f} vs healed: {score_heal:.3f})")
        else:
            logger.warning("⚠️ Self-healing failed - no additional content found")

    before_text = clean_answer(" ".join(before_docs)) if before_docs else "No relevant information found in the knowledge base."
    after_text = clean_answer(" ".join(after_docs)) if after_docs else "No relevant information found."

    return {
        "before_answer": before_text,
        "after_answer": after_text,
        "score_before": score_before,
        "score_after": score_after,
        "healing_triggered": healing_triggered,
        "healing_successful": healing_successful,
        "sources_used": sources_used
    }


@app.on_event("startup")
async def startup_event():
    """Initialize the RAG system on startup."""
    global embedder, base_index, base_chunks
    
    logger.info("Initializing Self-Healing RAG System...")
    
    # Load embedder
    logger.info("Loading sentence transformer model...")
    embedder = SentenceTransformer("all-MiniLM-L6-v2")

    base_index, base_chunks = load_or_build_base_index(embedder)

    logger.info(f" RAG System initialized successfully! Base index contains {base_index.ntotal} vectors")


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Self-Healing RAG API",
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
        "base_index_size": base_index.ntotal if base_index else 0,
        "base_chunks_count": len(base_chunks) if base_chunks else 0
    }


@app.post("/query", response_model=QueryResponse)
async def query_rag(request: QueryRequest):
    """
    Query the self-healing RAG system.
    
    - **query**: The question to answer
    - **threshold**: Trust score threshold below which healing is triggered (default: 0.5)
    - **max_results**: Maximum number of results to return (default: 5)
    - **use_healing**: Whether to enable self-healing (default: True)
    """
    try:
        if not request.query or not request.query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        result = autorag_with_diff(
            query=request.query,
            threshold=request.threshold,
            k=request.max_results,
            use_healing=request.use_healing
        )
        
        return QueryResponse(
            query=request.query,
            answer=result["after_answer"],
            before_answer=result["before_answer"],
            trust_score_before=round(result["score_before"], 3),
            trust_score_after=round(result["score_after"], 3),
            healing_triggered=result["healing_triggered"],
            healing_successful=result["healing_successful"],
            sources_used=result["sources_used"],
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        logger.error(f"Error processing query: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/query/demo")
async def query_demo(request: QueryRequest):
    """
    Demo endpoint that returns formatted output for easy viewing.
    """
    try:
        if not request.query or not request.query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        result = autorag_with_diff(
            query=request.query,
            threshold=request.threshold,
            k=request.max_results,
            use_healing=request.use_healing
        )
        
        # Format output similar to notebook
        output = f"""
╔════════════════════════════════════════════════════════════════╗
║                    Self-Healing RAG Query                      ║
╚════════════════════════════════════════════════════════════════╝

Query: {request.query}
Trust Score (before): {result['score_before']:.3f}
Trust Score (after): {result['score_after']:.3f}
Healing Triggered: {'Yes ' if result['healing_triggered'] else 'No'}
Healing Successful: {'Yes ' if result['healing_successful'] else 'No'}

Sources Used:
{chr(10).join(f'  • {source}' for source in result['sources_used'])}

{'─' * 60}
BEFORE (Base Knowledge Only):
{'─' * 60}
{result['before_answer']}

{'─' * 60}
AFTER (With Self-Healing):
{'─' * 60}
{result['after_answer']}
"""
        
        return JSONResponse(content={"formatted_output": output, "data": result})
    except Exception as e:
        logger.error(f"Error processing demo query: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")