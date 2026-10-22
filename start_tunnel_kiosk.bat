@echo off
title VOG Tekstil - RFID Tunnel Kiosk Launcher
echo ======================================================================
echo           VOG TEKSTIL PREMIUM - RFID TOUCH TUNNEL KIOSK
echo ======================================================================
echo.
echo Tünel Kiosk Arayüzü Başlatılıyor...
echo URL: http://localhost:3000/kiosk
echo.

:: Chrome Kiosk Başlatma (Dokunmatik ekran için tam ekran modu)
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --start-fullscreen --disable-pinch --overscroll-history-navigation=0 http://localhost:3000/kiosk
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --kiosk --start-fullscreen --disable-pinch --overscroll-history-navigation=0 http://localhost:3000/kiosk
) else (
    start "" "msedge.exe" --kiosk --start-fullscreen http://localhost:3000/kiosk
)

echo Kiosk Başlatıldı!
