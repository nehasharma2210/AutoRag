@echo off
echo Upgrading pip, setuptools, and wheel...
python -m pip install --upgrade pip setuptools wheel

echo.
echo Installing requirements...
python -m pip install -r requirements.txt

echo.
echo Installation complete!
pause

