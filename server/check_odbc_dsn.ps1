Write-Host "--- SYSTEM ODBC DATA SOURCES (ODBC.INI) ---"
Get-ItemProperty -Path "HKLM:\SOFTWARE\ODBC\ODBC.INI\*" -ErrorAction SilentlyContinue | Select-Object PSChildName, Server, Database, Driver, LastUser

Write-Host "--- 64-bit SYSTEM ODBC DATA SOURCES ---"
Get-ItemProperty -Path "HKLM:\SOFTWARE\WOW6432Node\ODBC\ODBC.INI\*" -ErrorAction SilentlyContinue | Select-Object PSChildName, Server, Database, Driver, LastUser

Write-Host "--- CURRENT USER ODBC DATA SOURCES ---"
Get-ItemProperty -Path "HKCU:\SOFTWARE\ODBC\ODBC.INI\*" -ErrorAction SilentlyContinue | Select-Object PSChildName, Server, Database, Driver, LastUser
