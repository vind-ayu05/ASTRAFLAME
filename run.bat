@echo off
title ASTRAFLAME Launcher
set "PATH=%USERPROFILE%\.gemini\antigravity\bin;%PATH%"
cd /d "%~dp0"
echo ========================================================
echo               STARTING ASTRAFLAME
echo ========================================================
call npm start
pause

