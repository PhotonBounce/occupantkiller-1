@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title OccupantKiller - Local Test Launcher
echo ==================================================
echo   OccupantKiller - Local Test Launcher
echo   Serves THIS folder to your browser and opens it.
echo   Keep the server window open while you play.
echo ==================================================
echo.

REM --- Prefer Python (built-in static server, zero setup) ---
where py >nul 2>&1
if !errorlevel!==0 (
  set "URL=http://localhost:8000/"
  echo Starting Python server on port 8000 ...
  start "OccupantKiller Server" cmd /k py -m http.server 8000
  goto open
)

where python >nul 2>&1
if !errorlevel!==0 (
  set "URL=http://localhost:8000/"
  echo Starting Python server on port 8000 ...
  start "OccupantKiller Server" cmd /k python -m http.server 8000
  goto open
)

REM --- Node's built-in static server via the bundled server.js (port 3000) ---
if exist server.js (
  where node >nul 2>&1
  if !errorlevel!==0 (
    set "URL=http://localhost:3000/"
    echo Starting Node server.js on port 3000 ...
    start "OccupantKiller Server" cmd /k node server.js
    goto open
  )
)

REM --- Node without server.js: use npx http-server ---
where node >nul 2>&1
if !errorlevel!==0 (
  set "URL=http://localhost:8000/"
  echo Starting Node http-server on port 8000 ...
  start "OccupantKiller Server" cmd /k npx --yes http-server -p 8000 -c-1
  goto open
)

REM --- PHP fallback ---
where php >nul 2>&1
if !errorlevel!==0 (
  set "URL=http://localhost:8000/"
  echo Starting PHP server on port 8000 ...
  start "OccupantKiller Server" cmd /k php -S localhost:8000
  goto open
)

echo.
echo ERROR: No local web server found. You need ONE of: Python, Node.js, or PHP.
echo Easiest fix: install Python from https://www.python.org/downloads/
echo and TICK "Add Python to PATH" during setup, then double-click this file again.
echo.
pause
exit /b 1

:open
echo Waiting a moment for the server to start ...
timeout /t 3 /nobreak >nul
start "" "!URL!"
echo.
echo Opened !URL! in your browser.
echo If it shows a blank page, wait a few seconds and refresh (Ctrl+F5).
echo To stop the game, close the "OccupantKiller Server" window.
echo.
pause
