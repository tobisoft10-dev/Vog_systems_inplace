@echo off
chcp 65001 >nul
title VOG YAZICI SERVISI KALDIRMA
color 0C

echo ================================================================
echo  🗑️ VOG RFID & KOLI YAZICI SERVISI KALDIRILIYOR
echo ================================================================
echo.

taskkill /f /im VogPrinterBridge.exe >nul 2>&1
schtasks /delete /tn "VogPrinterBridge" /f >nul 2>&1

echo.
echo ✅ VOG Yazici servisi basariyla kaldirildi.
echo.
pause
