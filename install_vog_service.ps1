# VOG Webhook Proxy Service Installer (PowerShell)
# Installs vog_webhook_bridge.ps1 as a Windows Service (services.msc) using WinSW.

$ScriptPath = Join-Path $PSScriptRoot "server\vog_webhook_bridge.ps1"
if (-not (Test-Path $ScriptPath)) {
    $ScriptPath = Join-Path $PSScriptRoot "vog_webhook_bridge.ps1"
}

if (-not (Test-Path $ScriptPath)) {
    Write-Host "[ERROR] vog_webhook_bridge.ps1 not found!" -ForegroundColor Red
    Exit
}

# Parameters
$ListenPort = 3881
$TargetUrl = "http://192.168.1.251:3001/api/tunnel/kiosk/scan-tag"
$ServiceName = "VogTunnelBridge"
$ServiceDisplayName = "VOG Webhook Proxy Bridge"
$ServiceDescription = "VOG Textile RFID Tunnel Webhook Proxy Bridge Service (Port $ListenPort)."

$ExePath = Join-Path $PSScriptRoot "$ServiceName.exe"
$XmlPath = Join-Path $PSScriptRoot "$ServiceName.xml"

# Step 1: Download WinSW-x64.exe
if (-not (Test-Path $ExePath)) {
    Write-Host "[DOWNLOAD] Downloading WinSW service wrapper..." -ForegroundColor Yellow
    $WinSwUrl = "https://github.com/winsw/winsw/releases/download/v2.12.0/WinSW-x64.exe"
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $WinSwUrl -OutFile $ExePath -UseBasicParsing
        Write-Host "[SUCCESS] Download completed!" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Failed to download WinSW wrapper: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Ensure the machine has internet access or download WinSW-x64.exe manually and rename it to $ServiceName.exe in this directory." -ForegroundColor Yellow
        Exit
    }
}

# Step 2: Generate XML Config File
Write-Host "[CONFIG] Writing service configuration XML..." -ForegroundColor Yellow
$XmlContent = "<service>`n" +
"  <id>$ServiceName</id>`n" +
"  <name>$ServiceDisplayName</name>`n" +
"  <description>$ServiceDescription</description>`n" +
"  <executable>powershell.exe</executable>`n" +
"  <arguments>-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`" -ListenPort $ListenPort -TargetUrl `"$TargetUrl`"</arguments>`n" +
"  <log mode=`"roll`"/>`n" +
"  <onfailure action=`"restart`" delay=`"10 sec`"/>`n" +
"</service>"

$XmlContent | Out-File -FilePath $XmlPath -Encoding UTF8 -Force
Write-Host "[SUCCESS] XML configuration written." -ForegroundColor Green

# Step 3: Install & Start Service
try {
    Write-Host "[INSTALL] Installing Windows Service..." -ForegroundColor Yellow
    Start-Process -FilePath $ExePath -ArgumentList "install" -Wait -NoNewWindow
    
    Write-Host "[START] Starting Windows Service..." -ForegroundColor Yellow
    Start-Process -FilePath $ExePath -ArgumentList "start" -Wait -NoNewWindow
    
    Write-Host "[SUCCESS] Windows Service '$ServiceDisplayName' has been successfully installed and started!" -ForegroundColor Green
    Write-Host "You can now find it in 'services.msc' (Windows Hizmetler) list." -ForegroundColor Cyan
} catch {
    Write-Host "[ERROR] Service installation failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please ensure you ran the script as ADMINISTRATOR!" -ForegroundColor Yellow
}
