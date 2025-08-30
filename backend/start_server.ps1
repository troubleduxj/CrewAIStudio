# CrewAI Studio Backend Startup Script
Write-Host "=== CrewAI Studio Backend Startup ===" -ForegroundColor Green
Write-Host ""

# Check if virtual environment exists
if (-not (Test-Path ".venv\Scripts\Activate.ps1")) {
    Write-Host "Virtual environment not found. Please run setup_env.py first." -ForegroundColor Red
    exit 1
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".venv\Scripts\Activate.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to activate virtual environment." -ForegroundColor Red
    exit 1
}

# Check Python version
Write-Host "Checking Python version..." -ForegroundColor Yellow
python check_python_version.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "Python version check failed." -ForegroundColor Red
    exit 1
}

# Start the server
Write-Host "Starting CrewAI Studio Backend..." -ForegroundColor Green
Write-Host "Server will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Documentation: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

python main.py