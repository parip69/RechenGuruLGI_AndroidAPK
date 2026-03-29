@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sync_web_assets.ps1" %*
endlocal & exit /b %ERRORLEVEL%
