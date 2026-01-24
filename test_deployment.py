#!/usr/bin/env python3
"""
Simple deployment test script
"""

import requests
import time
import sys

def test_backend(base_url="http://localhost:3001"):
    """Test backend health"""
    try:
        response = requests.get(f"{base_url}/api/health", timeout=10)
        if response.status_code == 200:
            print("✅ Backend is healthy")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend connection failed: {e}")
        return False

def test_llm_api(base_url="http://localhost:8000"):
    """Test LLM API health"""
    try:
        response = requests.get(f"{base_url}/health", timeout=10)
        if response.status_code == 200:
            print("✅ LLM API is healthy")
            return True
        else:
            print(f"❌ LLM API health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ LLM API connection failed: {e}")
        return False

def test_query(base_url="http://localhost:8000"):
    """Test a simple query"""
    try:
        payload = {
            "query": "What is machine learning?",
            "threshold": 0.5,
            "max_results": 3,
            "use_healing": True
        }
        response = requests.post(f"{base_url}/query", json=payload, timeout=30)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Query test successful: {data.get('answer', 'No answer')[:100]}...")
            return True
        else:
            print(f"❌ Query test failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Query test failed: {e}")
        return False

def main():
    print("🧪 AutoRAG Deployment Test")
    print("=" * 40)
    
    # Wait a bit for services to start
    print("⏳ Waiting for services to start...")
    time.sleep(10)
    
    # Test backend
    backend_ok = test_backend()
    
    # Test LLM API
    llm_ok = test_llm_api()
    
    if backend_ok and llm_ok:
        print("\n🎯 Testing query functionality...")
        query_ok = test_query()
        
        if query_ok:
            print("\n🎉 All tests passed! Deployment is successful.")
        else:
            print("\n⚠️ Basic services are running but query functionality has issues.")
    else:
        print("\n❌ Some services are not responding properly.")
        sys.exit(1)

if __name__ == "__main__":
    main()