@echo off
title Lemon ^& Stain Dashboard Launcher
cd /d "%~dp0"

echo ==========================================================
echo   Starting Lemon ^& Stain locally (no Docker)
echo ==========================================================
echo.
echo Two windows will open: the API and the website. Keep them open
echo while you use the dashboard; close them to stop it.
echo.

start "Lemon & Stain - API" /d "%~dp0backend" cmd /k run-dev.bat
start "Lemon & Stain - Website" /d "%~dp0frontend" cmd /k run-dev.bat

echo Waiting for the API to finish starting (the first run installs packages)...
set /a tries=0
:wait
timeout /t 3 /nobreak >nul
curl -s -o nul http://127.0.0.1:8000/api/health
if not errorlevel 1 goto :ready
set /a tries+=1
if %tries% lss 100 goto :wait
echo The API didn't start. Check the "Lemon & Stain - API" window for an error.
pause
exit /b 1

:ready
timeout /t 3 /nobreak >nul
echo.
echo Ready! Opening http://localhost:5173
echo Sign in with:  admin  /  lemon-and-stain
start http://localhost:5173
timeout /t 8 >nul
