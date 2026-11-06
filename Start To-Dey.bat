@echo off
cd /d "%~dp0"
where npm >nul 2>&1
if errorlevel 1 (
  echo Install Node.js first, then run this again.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing To-Dey...
  call npm install
)
echo Opening the development server...
start "" cmd /c "ping -n 3 127.0.0.1 >nul & start http://localhost:5173"
npm run dev
