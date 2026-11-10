@echo off
chcp 65001 > nul
title VERSLOMATIKA VALDYMO PULTAS
cd /d "%~dp0"
start "" pythonw.exe "verslomatika_gui.py"
exit
