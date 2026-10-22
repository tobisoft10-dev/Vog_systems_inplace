Write-Host "--- SEARCHING REGISTRY FOR LOGO / TIGER ---"
Get-ChildItem -Path "HKLM:\SOFTWARE\LOGO" -ErrorAction SilentlyContinue | Format-List *
Get-ChildItem -Path "HKLM:\SOFTWARE\WOW6432Node\LOGO" -ErrorAction SilentlyContinue | Format-List *
Get-ItemProperty -Path "HKLM:\SOFTWARE\WOW6432Node\LOGO\TIGER*" -ErrorAction SilentlyContinue

Write-Host "--- SEARCHING LgConfig.xml or LOGO XMLs in C:\TIGERWINGS ---"
Get-ChildItem -Path "C:\TIGERWINGS" -Recurse -Include "*.xml","*.ini","*.cfg" -ErrorAction SilentlyContinue | Select-String -Pattern "Server=", "Data Source=", "Initial Catalog=", "Provider=", "User Id=", "Password=", "database=" -List | Select-Object Path
