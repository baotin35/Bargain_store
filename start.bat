@echo off
title Mom and Pop - Store Management System
cd /d "%~dp0"

:: Use bundled Node.js runtime
set NODE="%~dp0node-runtime\node.exe"

:: First-time setup: install dependencies if missing
if not exist "%~dp0node_modules\express" (
  echo First time setup - installing dependencies...
  "%~dp0node-runtime\npm.cmd" install
  echo.
)

:: First-time setup: seed database if no data
if not exist "%~dp0data\transactions.xlsx" (
  echo Initializing database with sample data...
  %NODE% utils\seed.js
  echo.
)

echo ============================================
echo   Mom and Pop - Store Management System
echo ============================================
echo.
echo  Server starting at http://localhost:3000
echo  Login: admin / admin123
echo.
echo  DO NOT CLOSE THIS WINDOW.
echo  Closing this window will stop the server.
echo ============================================
echo.

:: Wait a moment then open the browser
timeout /t 2 /nobreak > nul
start "" "http://localhost:3000"

:: Start server (blocking - keeps window alive)
%NODE% server.js

echo.
echo Server stopped. Press any key to exit.
pause > nul
