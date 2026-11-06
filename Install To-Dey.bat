@echo off
cd /d "%~dp0"
where npm >nul 2>&1
if errorlevel 1 (
  echo Install Node.js from https://nodejs.org and then run this again.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing To-Dey...
  call npm install
)
echo Building To-Dey...
call npm run build
if errorlevel 1 (
  echo The build did not finish.
  pause
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-shortcut.ps1" -Root "%~dp0"
if errorlevel 1 (
  echo The desktop shortcut could not be created.
  pause
  exit /b 1
)
echo.
echo To-Dey is on your desktop and in the Start menu.
echo Open it from there. Your notes stay on this computer.
pause
