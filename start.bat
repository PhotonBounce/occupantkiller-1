@echo off
chcp 65001 >nul
title Occupant Killer - Local Test Server
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║       OCCUPANT KILLER - Local Test Server                ║
echo  ║       Hybrid Voxel Warfare • 20 Stages                   ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
echo  Opening browser at http://localhost:3000 ...
echo  Press Ctrl+C to stop the server
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  ERROR: Node.js is not installed or not in PATH.
    echo  Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Start the server in the background
start /B node server.js > server.log 2>&1

:: Wait for server to start
echo  Starting server...
timeout /t 2 /nobreak >nul

:: Open browser
echo  Launching Chrome...
start chrome http://127.0.0.1:3000 --new-window --disable-cache --disk-cache-size=0

:: Keep the window open
echo.
echo  Server is running at http://127.0.0.1:3000
echo  Logs written to server.log
echo.
echo  Press any key to stop the server...
pause >nul

:: Stop the server
echo.
echo  Stopping server...
taskkill /F /IM node.exe >nul 2>nul
echo  Server stopped.
timeout /t 1 /nobreak >nul
