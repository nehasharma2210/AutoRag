@echo off
echo ========================================
echo Step-by-Step Installation for Python 3.13
echo ========================================
echo.

echo Step 1: Upgrading pip, setuptools, and wheel...
python -m pip install --upgrade pip setuptools wheel
if errorlevel 1 (
    echo ERROR: Failed to upgrade pip/setuptools
    pause
    exit /b 1
)

echo.
echo Step 2: Installing core dependencies first...
python -m pip install fastapi uvicorn[standard] pydantic
if errorlevel 1 (
    echo ERROR: Failed to install FastAPI dependencies
    pause
    exit /b 1
)

echo.
echo Step 3: Installing numpy and basic packages...
python -m pip install numpy>=1.26.0 requests beautifulsoup4 duckduckgo-search
if errorlevel 1 (
    echo ERROR: Failed to install basic packages
    pause
    exit /b 1
)

echo.
echo Step 4: Installing PyTorch (this may take a while)...
python -m pip install torch
if errorlevel 1 (
    echo ERROR: Failed to install PyTorch
    pause
    exit /b 1
)

echo.
echo Step 5: Installing transformers and sentence-transformers...
python -m pip install transformers sentence-transformers
if errorlevel 1 (
    echo ERROR: Failed to install transformers
    pause
    exit /b 1
)

echo.
echo Step 6: Installing datasets...
python -m pip install datasets
if errorlevel 1 (
    echo ERROR: Failed to install datasets
    pause
    exit /b 1
)

echo.
echo Step 7: Installing FAISS (this may take a while)...
python -m pip install faiss-cpu
if errorlevel 1 (
    echo WARNING: FAISS installation failed. This might work without it for testing.
    echo You can try installing it later with: pip install faiss-cpu
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo You can now run the application with:
echo   python self_healing_rag.py
echo.
pause

