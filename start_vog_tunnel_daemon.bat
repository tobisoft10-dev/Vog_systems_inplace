@echo off
chcp 65001 >nul
title VOG Native Tünel & RFID Okuyucu Sürücüsü (Otonom)
color 0A

echo ==============================================================================
echo  🚀 VOG TEKSTIL - 100%% YERLI OTONOM TÜNEL & IMPINJ DONANIM SÜRÜCÜSÜ
echo ==============================================================================
echo.
echo [1/3] Donanım Köprüsü ve Impinj Okuyucuya bağlanılıyor (192.168.0.13)...
echo [2/3] 4 Adet RFID Anteni maksimum güçle devreye alınıyor...
echo [3/3] Canlı VOG Kiosk Sunucusuna veri akışı açılıyor (192.168.1.251:3001)...
echo.
echo ------------------------------------------------------------------------------
echo  🟢 SISTEM AKTIF - U-Shops'a veya üçüncü parti programa gerek yoktur!
echo  Tünelden geçen her koli anında VOG ekranınızdaki sayacı artıracaktır.
echo ------------------------------------------------------------------------------
echo.

set BRIDGE_WS_URL=ws://127.0.0.1:8025/ws
set VOG_BACKEND_URL=http://192.168.1.251:3001
set IMPINJ_IP=192.168.0.13

node "%~dp0server\vog_tunnel_autonomous.cjs"

if errorlevel 1 (
    echo.
    echo ⚠️ Sürücü kapandı, 5 saniye içinde yeniden başlatılıyor...
    timeout /t 5 >nul
    goto :start
)

pause
