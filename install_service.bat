@echo off
chcp 65001 >nul
title VOG Webhook Proxy Service Installer
color 0A

echo ================================================================
echo  ⚙️ VOG NATIVE WEBHOOK PROXY - BACKGROUND SERVICE INSTALLER
echo ================================================================
echo.
echo This script will install the Webhook Proxy Bridge as a native Windows
echo background service that starts automatically on system boot.
echo.
echo [IMPORTANT] Please run this batch file as ADMINISTRATOR!
echo.
echo Press any key to start installation...
pause >nul

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install_vog_service.ps1"

echo.
echo Press any key to exit...
pause >nul
