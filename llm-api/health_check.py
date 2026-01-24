#!/usr/bin/env python3
"""
Simple health check script to test if the LLM API can start
"""

import sys
import traceback

def check_imports():
    """Check if all required imports are available"""
    print("🔍 Checking Python imports...")
    
    try:
        import fastapi
        print(f"✅ FastAPI: {fastapi.__version__}")
    except ImportError as e:
        print(f"❌ FastAPI: {e}")
        return False
    
    try:
        import uvicorn
        print(f"✅ Uvicorn: {uvicorn.__version__}")
    except ImportError as e:
        print(f"❌ Uvicorn: {e}")
        return False
    
    try:
        import numpy as np
        print(f"✅ NumPy: {np.__version__}")
    except ImportError as e:
        print(f"❌ NumPy: {e}")
        return False
    
    try:
        import faiss
        print(f"✅ FAISS: Available")
    except ImportError as e:
        print(f"❌ FAISS: {e}")
        return False
    
    try:
        from sentence_transformers import SentenceTransformer
        print(f"✅ SentenceTransformers: Available")
    except ImportError as e:
        print(f"❌ SentenceTransformers: {e}")
        return False
    
    try:
        import requests
        print(f"✅ Requests: {requests.__version__}")
    except ImportError as e:
        print(f"❌ Requests: {e}")
        return False
    
    try:
        from bs4 import BeautifulSoup
        print(f"✅ BeautifulSoup: Available")
    except ImportError as e:
        print(f"❌ BeautifulSoup: {e}")
        return False
    
    return True

def test_model_loading():
    """Test if we can load the sentence transformer model"""
    print("\n🤖 Testing model loading...")
    
    try:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer("all-MiniLM-L6-v2")
        print("✅ Model loaded successfully")
        
        # Test encoding
        test_text = "This is a test sentence."
        embedding = model.encode([test_text])
        print(f"✅ Encoding test successful: {embedding.shape}")
        return True
    except Exception as e:
        print(f"❌ Model loading failed: {e}")
        traceback.print_exc()
        return False

def main():
    print("🚀 AutoRAG LLM API Health Check")
    print("=" * 40)
    
    # Check imports
    imports_ok = check_imports()
    
    if not imports_ok:
        print("\n❌ Some required packages are missing!")
        print("Please install them with: pip install -r requirements.txt")
        sys.exit(1)
    
    # Test model loading
    model_ok = test_model_loading()
    
    if not model_ok:
        print("\n❌ Model loading failed!")
        print("This might be due to insufficient memory or network issues.")
        sys.exit(1)
    
    print("\n✅ All checks passed! The LLM API should work correctly.")
    print("You can now start the server with: uvicorn self_healing_rag:app --host 0.0.0.0 --port 8000")

if __name__ == "__main__":
    main()