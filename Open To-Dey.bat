@echo off
cd /d "%~dp0"
title To-Dey
where npm >nul 2>&1
if errorlevel 1 (
  echo Install Node.js from https://nodejs.org and then run Install To-Dey.bat again.
  pause
  exit /b 1
)
if not exist node_modules call npm install
if not exist dist (
  echo Preparing To-Dey...
  call npm run build
  if errorlevel 1 (
    echo To-Dey could not be prepared.
    pause
    exit /b 1
  )
)
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if errorlevel 1 (
  start "To-Dey" /min cmd /c "npm start"
  ping -n 4 127.0.0.1 >nul
)
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE%" (
  start "" "%EDGE%" --app=http://localhost:5173
) else (
  start "" http://localhost:5173
)
