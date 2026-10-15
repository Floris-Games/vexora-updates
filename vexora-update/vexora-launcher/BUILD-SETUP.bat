@echo off
cd /d "%~dp0"
call npm.cmd ci
if errorlevel 1 goto fail
call npm.cmd run dist
if errorlevel 1 goto fail
echo SUCCESS! Find VexoraSetup-1.2.1.exe (local unsigned test build; see LAUNCHER-UPDATES.md) in dist
pause
exit /b 0
:fail
echo BUILD FAILED. Send a screenshot of the error.
pause
exit /b 1
