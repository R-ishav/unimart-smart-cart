@echo off
echo ========================================
echo   UniMart Public Hosting Setup
echo ========================================
echo.
echo Starting Backend Server on port 3000...
start "Backend Server" cmd /k "cd /d %~dp0 && node server.js"
timeout /t 3 /nobreak > nul

echo Starting Frontend Server on port 5173...
start "Frontend Server" cmd /k "cd /d %~dp0 && npm run dev"
timeout /t 5 /nobreak > nul

echo.
echo ========================================
echo   Starting ngrok tunnels...
echo ========================================
echo.
echo After ngrok starts, you will see PUBLIC URLs.
echo Use the HTTPS URL for the frontend (port 5173) in your QR codes.
echo.
echo IMPORTANT: Update the ESP32 code with the backend ngrok URL!
echo.
pause
ngrok http 5173
