@echo off
chcp 65001 >nul
title VOG SISTEMI - STEP 1 GERI YUKLEME (RESTORE)
color 0A

echo ================================================================
echo  🔄 VOG TUNNEL & KIOSK SISTEMI - STEP 1 NOKTASINA GERI DONULUYOR
echo ================================================================
echo.

set BACKUP_DIR=C:\vog_system\backups\STEP1_STABLE_MILESTONE

if not exist "%BACKUP_DIR%" (
    echo [HATA] Step 1 yedek klasoru bulunamadi: %BACKUP_DIR%
    pause
    exit /b 1
)

echo [1/5] Server app.js geri yukleniyor...
copy /Y "%BACKUP_DIR%\app.js" "C:\vog_system\server\app.js"

echo [2/5] C# Driver ve binary dosyalari geri yukleniyor...
copy /Y "%BACKUP_DIR%\VogTunnelDriver.cs" "C:\vog_system\server\VogTunnelDriver.cs"
copy /Y "%BACKUP_DIR%\VogTunnelDriver.exe" "C:\vog_system\dist\VogTunnelDriver.exe"
copy /Y "%BACKUP_DIR%\VogTunnelDriver.exe" "C:\vog_system\public\VogTunnelDriver.exe"
copy /Y "%BACKUP_DIR%\VogTunnelBridge.xml" "C:\vog_system\dist\VogTunnelBridge.xml"

echo [3/5] Kiosk Frontend geri yukleniyor...
copy /Y "%BACKUP_DIR%\TunnelKioskPage.jsx" "C:\vog_system\src\pages\TunnelKioskPage.jsx"

echo [4/5] Frontend derleniyor ve servisler yeniden baslatiliyor...
cd /d C:\vog_system
call npm run build
call pm2 restart vog-api

echo [5/5] Yerel Windows Servisi guncelleniyor...
powershell -Command "Stop-Service -Name VogTunnelBridge -ErrorAction SilentlyContinue; Copy-Item 'C:\vog_system\dist\VogTunnelDriver.exe' 'C:\vog_system\VogTunnelDriver.exe' -Force; Start-Service -Name VogTunnelBridge -ErrorAction SilentlyContinue"

echo.
echo ================================================================
echo  ✅ STEP 1 BASARIYLA GERI YUKLENDI! SISTEM KARARLI HALE GETIRILDI.
echo ================================================================
pause
