@echo off
title Lemon & Stain Dashboard (Docker)
cd /d "%~dp0"

echo ===================================================
echo   Starting Lemon ^& Stain Dashboard with Docker...
echo ===================================================
echo.

if not exist .env (
    echo Creating .env from .env.example...
    copy .env.example .env
)

docker compose up --build

pause
