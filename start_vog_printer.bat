@echo off
title VOG Tekstil - Hardware Print Bridge & RFID Encoder
color 0A
echo ======================================================================
echo    VOG TEKSTIL PREMIUM - HARDWARE PRINT BRIDGE & RFID ENCODER
echo ======================================================================
echo.
echo Bu servis Godex (EZPL) ve Zebra (ZPL II) endüstriyel termal yazıcıları
echo ve RFID UHF Gen2 çip yazıcılarını arka planda otomatik yönetir.
echo.
echo Hedef Port: TCP 9100 / Windows Spooler
echo Lutfen bu pencereyi KAPATMAYINIZ (Simge durumuna kucultebilirsiniz).
echo.

node "%~dp0vog_client_printer.cjs"

pause
