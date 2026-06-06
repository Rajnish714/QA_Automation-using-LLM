@echo off
REM 🚀 Reelspect with Local AI (Ollama) - Windows Startup

echo.
echo 🤖 Reelspect - Game Testing with FREE Local AI
echo ================================================
echo.

REM Check if Ollama is running
curl -s http://localhost:11434/api/tags > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ollama is not running!
    echo.
    echo 📍 Start Ollama first:
    echo    1. Open Command Prompt
    echo    2. Run: ollama serve
    echo    3. Then come back and run this script
    echo.
    pause
    exit /b 1
)

echo ✅ Ollama is running on http://localhost:11434
echo.

REM Check if mistral model exists
curl -s http://localhost:11434/api/tags | findstr /C:"mistral" > nul
if %ERRORLEVEL% NEQ 0 (
    echo ⏳ Downloading Mistral model (5-10 minutes)...
    echo.
    call ollama pull mistral
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to download Mistral
        pause
        exit /b 1
    )
)

echo ✅ Mistral model is ready!
echo.

REM Start the API with Ollama enabled
cd /d/aqtest/apps/api
echo 🚀 Starting API with Local AI enabled...
echo.

set PLAYWRIGHT_HEADFUL=true
set USE_LOCAL_LLM=true
set OLLAMA_URL=http://localhost:11434

npx ts-node-dev --respawn src/index.ts

pause
