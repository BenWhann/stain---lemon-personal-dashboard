@echo off
title Lemon ^& Stain - Website
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 goto :nonode

rem Vite needs Node 20 or newer; older versions fail with "getRandomValues is not a function"
for /f "tokens=1 delims=." %%v in ('node -v') do set NODE_MAJOR=%%v
set NODE_MAJOR=%NODE_MAJOR:v=%
if %NODE_MAJOR% LSS 20 goto :oldnode

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

:oldnode
echo This computer has Node.js %NODE_MAJOR%, but the website needs Node.js 20 or newer.
echo Install the LTS version from https://nodejs.org/ then run start-local.bat again.
pause
goto :eof

:failed
echo.
echo Setup failed. Scroll up for the error message.
pause
