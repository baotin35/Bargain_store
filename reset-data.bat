@echo off
title Mom and Pop - Reset Data
cd /d "%~dp0"
set NODE="%~dp0node-runtime\node.exe"

echo WARNING: This will DELETE all current data and restore sample data.
echo.
set /p CONFIRM=Type YES to continue:
if /i not "%CONFIRM%"=="YES" (
  echo Cancelled.
  pause
  exit
)

echo.
echo Resetting database...
%NODE% utils\seed.js
echo.
echo Done! Sample data restored.
echo Run start.bat to launch the app.
pause
