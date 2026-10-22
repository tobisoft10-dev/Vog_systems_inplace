@echo off
title VOG Tekstil - Sessiz Otomatik Koli Etiketi Baski Modu
echo =========================================================
echo   VOG TEKSTIL OTOMATIK KOLI ETIKETI BASKI MODU (KIOSK)
echo =========================================================
echo.
echo Chrome sessiz yazdirma moduyla baslatiliyor...
echo Onizleme penceresi cikmadan dogrudan Godex G530'a basacaktir.
echo.

start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --user-data-dir="C:\vog_system\chrome_kiosk_profile" --kiosk-printing "http://localhost:3000/admin/box-labels/auto"

if errorlevel 1 (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --user-data-dir="C:\vog_system\chrome_kiosk_profile" --kiosk-printing "http://localhost:3000/admin/box-labels/auto"
)

exit
