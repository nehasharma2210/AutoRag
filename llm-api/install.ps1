Write-Host "Upgrading pip, setuptools, and wheel..." -ForegroundColor Green
python -m pip install --upgrade pip setuptools wheel

Write-Host "`nInstalling requirements..." -ForegroundColor Green
python -m pip install -r requirements.txt

Write-Host "`nInstallation complete!" -ForegroundColor Green

