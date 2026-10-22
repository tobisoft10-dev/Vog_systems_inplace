@echo off
chcp 65001 >nul
title VOG Webhook Proxy Service Uninstaller
color 0C

echo ================================================================
echo  ⚠️ VOG NATIVE WEBHOOK PROXY - BACKGROUND SERVICE UNINSTALLER
echo ================================================================
echo.
echo [IMPORTANT] Please run this batch file as ADMINISTRATOR!
echo.
echo Press any key to uninstall the background service...
pause >nul

if exist "%~dp0VogTunnelBridge.exe" (
    echo ⚙️ Stopping service...
    "%~dp0VogTunnelBridge.exe" stop
    echo ⚙️ Uninstalling service...
    "%~dp0VogTunnelBridge.exe" uninstall
    echo ✅ Service uninstalled successfully!
) else (
    echo ❌ VogTunnelBridge.exe not found! Attempting native task fallback...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Stop-ScheduledTask -TaskName 'VogTunnelBridge' -ErrorAction SilentlyContinue; Unregister-ScheduledTask -TaskName 'VogTunnelBridge' -Confirm:$false; Write-Host '✅ Task fallback uninstalled!' -ForegroundColor Green"
)

echo.
echo Press any key to exit...
pause >nul
