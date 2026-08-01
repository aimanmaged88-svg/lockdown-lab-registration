@echo off
REM ============================================================
REM  UNC Thoughts HQ - one-click launcher (Windows)
REM  Double-click this file to set up (first run) and open the app.
REM ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo   UNC THOUGHTS HQ
echo   Starting up...
echo.

REM --- Check Node is installed ---
where node >nul 2>nul
if errorlevel 1 (
  echo   [!] Node.js is not installed.
  echo       Install the LTS version from https://nodejs.org then run this again.
  echo.
  pause
  exit /b 1
)

REM --- First run: install dependencies ---
if not exist "node_modules" (
  echo   Installing dependencies ^(first run only, this can take a few minutes^)...
  call npm install
  if errorlevel 1 ( echo   [!] npm install failed. & pause & exit /b 1 )
)

REM --- Ensure .env exists ---
if not exist ".env" (
  echo   Creating .env from .env.example...
  copy ".env.example" ".env" >nul
)

REM --- First run: set up the database + seed ---
if not exist "prisma\dev.db" (
  echo   Setting up the database...
  call npx prisma migrate deploy
  call npx prisma generate
  echo   Loading starter data ^(research library, lessons, sample plan^)...
  call npx tsx prisma/seed.ts
)

REM --- Build if there is no production build yet ---
if not exist ".next\BUILD_ID" (
  echo   Building the app ^(first run only^)...
  call npm run build
  if errorlevel 1 ( echo   [!] Build failed. & pause & exit /b 1 )
)

REM --- Open the browser, then start the server ---
echo.
echo   Opening UNC Thoughts HQ at http://localhost:3000
echo   ^(Leave this window open while you use the app. Close it to stop.^)
echo.
start "" "http://localhost:3000"
call npm run start

pause
