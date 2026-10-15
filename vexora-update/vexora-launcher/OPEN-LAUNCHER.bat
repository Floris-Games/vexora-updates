@echo off
cd /d "%~dp0"
if not exist node_modules\electron (call npm.cmd install || goto fail)
call npm.cmd start
exit /b
:fail
echo Installation failed.
pause
