@echo off
setlocal
echo ===================================================
echo   Lemon ^& Stain Dashboard - Push to GitHub Helper
echo ===================================================
echo.
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Git command-line tool was not found in your system PATH.
    echo.
    echo You can push your updates using either:
    echo.
    echo 1. GitHub Desktop:
    echo    - Open GitHub Desktop
    echo    - File -^> Add Local Repository -^> Choose: "%~dp0"
    echo    - Commit and click "Push origin"
    echo.
    echo 2. Web Browser Upload (Easiest for GitHub Pages):
    echo    - Go to your repository on github.com
    echo    - Click "Add file" -^> "Upload files"
    echo    - Drag and drop index.html into the browser
    echo    - Click "Commit changes"
    echo.
    pause
    exit /b 1
)

cd /d "%~dp0"

if not exist ".git" (
    echo [1/4] Initializing local Git repository...
    git init
    git branch -M main
    set /p REPO_URL="Enter your GitHub repository URL (e.g. https://github.com/username/repo.git): "
    if not "%REPO_URL%"=="" (
        git remote add origin %REPO_URL%
    )
)

echo [2/4] Staging updated files...
git add .

echo [3/4] Creating commit...
git commit -m "Update Lemon & Stain dashboard: dual theme, audio chime, sprint velocity, full-stack VPS ready"

echo [4/4] Pushing to GitHub...
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [!] Push encountered an issue. Check your repository URL or permissions.
) else (
    echo.
    echo [✓] Successfully pushed updates to GitHub!
)

echo.
pause
