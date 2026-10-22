@echo off
chcp 65001 >nul
title VOG WINDOWS SERVISI KURULUMU
color 0A

echo ================================================================
echo   VOG NATIVE RFID VE KOLI YAZICI WINDOWS SERVIS KURUCU
echo ================================================================
echo.

echo [1/4] Varsa eski calisan surucu ve servis kapatiliyor...
taskkill /f /im VogPrinterBridge.exe >nul 2>&1
sc.exe stop VogPrinterBridge >nul 2>&1
timeout /t 2 >nul
sc.exe delete VogPrinterBridge >nul 2>&1
schtasks /delete /tn "VogPrinterBridge" /f >nul 2>&1

echo [2/4] C:\vog_system klasoru hazirlaniyor...
if not exist "C:\vog_system" mkdir "C:\vog_system"

echo [3/4] Guncel servis dosyasi indiriliyor (http://192.168.1.251:3001)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri 'http://192.168.1.251:3001/VogPrinterBridge.exe' -OutFile 'C:\vog_system\VogPrinterBridge.exe'"

echo [4/4] Resmi Windows Servisi Olarak Kaydediliyor (services.msc)...
sc.exe create VogPrinterBridge binPath= "C:\vog_system\VogPrinterBridge.exe" start= auto DisplayName= "VOG RFID ve Koli Yazici Servisi"
sc.exe description VogPrinterBridge "SATO CL4NX Plus RFID ve Godex G530 Koli Etiket Yazici Otomasyon Servisi"
sc.exe failure VogPrinterBridge reset= 60 actions= restart/5000/restart/5000/restart/5000

echo.
echo Servis baslatiliyor...
sc.exe start VogPrinterBridge

echo.
echo ================================================================
echo   VOG YAZICI WINDOWS SERVISI BASARIYLA KURULDU!
echo   - services.msc icinde 'VOG RFID ve Koli Yazici Servisi' olarak calisir.
echo   - Hicbir konsol penceresi acilmaz, arka planda otomatik baslar.
echo ================================================================
echo.
pause
