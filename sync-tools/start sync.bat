@echo off
chcp 65001 >nul
title Git Sync — BetterX
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sync.ps1"
echo.
echo ============================================
echo Скрипт завершён. Нажми любую клавишу...
pause >nul