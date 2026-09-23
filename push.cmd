@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

where git >nul 2>&1
if errorlevel 1 (
  echo Git is not installed. Get it from https://git-scm.com/download/win
  exit /b 1
)

if not exist ".git" (
  echo Initialising repository...
  git init -b main || exit /b 1
  git remote add origin https://github.com/kvyta/Augeometry.git || exit /b 1
)

git add -A

set "MSG=%*"
if "%MSG%"=="" set "MSG=Update Augeometry"

git diff --cached --quiet
if errorlevel 1 (
  git commit -m "!MSG!" || exit /b 1
) else (
  echo Nothing new to commit.
)

git push -u origin main || exit /b 1
echo.
echo Done: https://github.com/kvyta/Augeometry
