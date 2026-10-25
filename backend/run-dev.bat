@echo off
title Lemon ^& Stain - API
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 goto :nopython
python -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)"
if errorlevel 1 goto :nopython

if not exist venv\Scripts\python.exe (
  echo Creating a Python virtual environment, first run only...
  python -m venv venv
  if errorlevel 1 goto :failed
)

echo Installing or checking Python packages...
venv\Scripts\python.exe -m pip install --disable-pip-version-check -q -r requirements.txt
if errorlevel 1 goto :failed

echo.
echo API starting on http://localhost:8000  (development sign-in: admin / lemon-and-stain)
set APP_ENV=development
venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
goto :eof

:nopython
echo Python 3.10 or newer was not found. Install Python 3.12 or newer from https://www.python.org/downloads/
echo and tick "Add python.exe to PATH" during setup, then run start-local.bat again.
pause
goto :eof

:failed
echo.
echo Setup failed. Scroll up for the error message.
pause
