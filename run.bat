@echo off
title ASTRAFLAME Launcher
set "PATH=C:\Users\pkolh\.gemini\antigravity\bin;%PATH%"
cd /d "%~dp0"
echo ========================================================
echo               STARTING ASTRAFLAME
echo ========================================================
call npm start
pause

