@echo off
chcp 65001 > nul
title KUBILU PARDAVIMU AGENTAI (EUROPA)
echo ======================================================================
echo    PALEIDZIAMI AI AGENTAI KUBILU PARDAVIMAMS EUROPOJE
echo ======================================================================
echo.

cd /d "%~dp0"

python run_kubilai_agents.py --business kubilai_europa --agent all

echo.
echo ======================================================================
echo    DARBAS BAIGTAS! Visi duomenys issaugoti "data" aplanke.
echo ======================================================================
pause
