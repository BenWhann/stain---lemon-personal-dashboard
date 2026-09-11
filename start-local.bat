@echo off
title Lemon & Stain Dashboard Launcher
cd /d "%~dp0"

echo ==========================================================
echo   Starting Lemon ^& Stain Dashboard Locally (No Docker)
echo ==========================================================
echo.

:: 1. Launch Backend API
echo [1/2] Preparing Backend API (FastAPI + SQLite)...
start "Lemon & Stain - Backend API" cmd /k "cd /d "%~dp0backend" && if not exist venv (python -m venv venv && call venv\Scripts\activate && pip install -r requirements.txt) else (call venv\Scripts\activate) && uvicorn main:app --reload --port 8000"

:: 2. Launch Frontend Dev Server
echo [2/2] Preparing Frontend (Vite + React)...
start "Lemon & Stain - Frontend UI" cmd /k "cd /d "%~dp0frontend" && if not exist node_modules (npm install) && npm run dev"

echo.
echo Both servers are launching in separate command prompt windows!
echo - Frontend: http://localhost:5173
echo - Backend API Docs: http://localhost:8000/docs
echo.
echo Opening dashboard in your browser in 5 seconds...
timeout /t 5 /nobreak >nul
start http://localhost:5173
