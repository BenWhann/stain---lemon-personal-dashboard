@echo off
title Lemon ^& Stain - Website
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 goto :nonode

if not exist node_modules (
  echo Installing website packages, first run takes a minute...
  call npm install --no-audit --no-fund
  if errorlevel 1 goto :failed
)

call npm run dev
goto :eof

:nonode
echo Node.js was not found. Install the LTS version from https://nodejs.org/
echo then run start-local.bat again.
pause
goto :eof

:failed
echo.
echo Setup failed. Scroll up for the error message.
pause
