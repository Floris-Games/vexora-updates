@echo off
cd /d "%~dp0"
call npm.cmd ci
if errorlevel 1 goto fail
call npm.cmd run portable
if errorlevel 1 goto fail
echo.
echo SUCCESS! Open dist\win-unpacked\Vexora.exe
pause
exit /b 0
:fail
echo BUILD FAILED. Send a screenshot of the error.
pause
exit /b 1
