@echo off
chcp 65001 >nul
if "%~1"=="" (
    python "%~dp0query_nemotron.py" "Merhaba! Nvidia Nemotron 3.5 olarak VOG Tekstil sistem mimarisine hos geldin. Antigravity ile nasil birlikte calisacagini kisaca ozetle."
) else (
    python "%~dp0query_nemotron.py" %*
)
