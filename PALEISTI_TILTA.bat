@echo off
chcp 65001 > nul
title ANTIGRAVITY - CODEX DUAL AGENT BRIDGE
echo ======================================================================
echo 🌉 PALEIDŽIAMAS ANTIGRAVITY ↔ CODEX DUAL-AGENT TILTAS...
echo ======================================================================
echo.
echo Jungiama Antigravity sesija: 0a0926f2-a607-4b37-bd5d-d7985138151c
echo Jungiama Codex gija:         codex://threads/01a133bf-6c35-7783-8dd9-f02e73ee59b2
echo.
echo Paleidžiamas vietinis tiltas adresu: http://localhost:5050
echo.

start "" "http://localhost:5050"
python "%~dp0bridge\bridge_server.py"

pause
