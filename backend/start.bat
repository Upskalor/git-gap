@echo off
REM Quick start script for DualLoop backend on Windows

echo.
echo ╔══════════════════════════════════════╗
echo ║  🚀 DualLoop Backend Quick Start     ║
echo ╚══════════════════════════════════════╝
echo.

REM Check if Docker is running
docker ps >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running or not installed
    pause
    exit /b 1
)

echo ✅ Docker found
echo.

echo 🚀 Starting services with docker-compose...
docker-compose up -d

echo.
echo ⏳ Waiting for services to be ready...
timeout /t 5 /nobreak

echo.
echo ✅ Services started!
echo.
echo 🔗 Access URLs:
echo    API: http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo    Flower (Celery): http://localhost:5555
echo.
echo 📝 Useful commands:
echo    View logs: docker-compose logs -f backend
echo    Stop services: docker-compose down
echo    Rebuild: docker-compose build --no-cache
echo.
pause
