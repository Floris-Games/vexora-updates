@echo off
cd /d "%~dp0"
py -3 publish-game.py "%~1" "%~2"
pause
