#!/usr/bin/env python3
"""
Smart dependency installer for AutoRAG LLM API
Tries full requirements first, falls back to minimal if needed
"""

import subprocess
import sys
import os

def run_command(cmd):
    """Run a command and return success status"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def install_requirements(requirements_file):
    """Install requirements from a file"""
    print(f"📦 Installing dependencies from {requirements_file}...")
    
    cmd = f"pip install --no-cache-dir -r {requirements_file}"
    success, stdout, stderr = run_command(cmd)
    
    if success:
        print(f"✅ Successfully installed dependencies from {requirements_file}")
        return True
    else:
        print(f"❌ Failed to install dependencies from {requirements_file}")
        print(f"Error: {stderr}")
        return False

def check_critical_imports():
    """Check if critical imports work"""
    try:
        import fastapi
        import uvicorn
        import requests
        print("✅ Critical imports working")
        return True
    except ImportError as e:
        print(f"❌ Critical import failed: {e}")
        return False

def main():
    print("🚀 AutoRAG Dependency Installer")
    print("=" * 40)
    
    # Try full requirements first
    if os.path.exists("requirements.txt"):
        if install_requirements("requirements.txt"):
            # Test if everything works
            try:
                import numpy
                import faiss
                from sentence_transformers import SentenceTransformer
                print("✅ Full installation successful!")
                return
            except ImportError as e:
                print(f"⚠️ Full installation incomplete: {e}")
    
    # Fall back to minimal requirements
    print("\n🔄 Trying minimal installation...")
    if os.path.exists("requirements-minimal.txt"):
        if install_requirements("requirements-minimal.txt"):
            if check_critical_imports():
                print("✅ Minimal installation successful!")
                print("⚠️ Note: Some advanced features may not work")
                return
    
    print("❌ Installation failed!")
    sys.exit(1)

if __name__ == "__main__":
    main()