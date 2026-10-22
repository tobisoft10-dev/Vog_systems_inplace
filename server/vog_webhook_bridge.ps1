# ==============================================================================
# 🚀 VOG NATIVE WEBHOOK PROXY (POWERSHELL / ZERO DEPENDENCY)
# ==============================================================================
param(
    [int]$ListenPort = 3881,
    [string]$TargetUrl = "http://192.168.1.251:3001/api/tunnel/kiosk/scan-tag"
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "VOG WEBHOOK PROXY BRIDGE"

$LISTEN_PORT = $ListenPort
$TARGET_URL = $TargetUrl

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host " 🚀 VOG NATIVE WEBHOOK PROXY (Listening on Port $LISTEN_PORT)" -ForegroundColor Green
Write-Host " 🏢 TARGET VOG SERVER: $TARGET_URL" -ForegroundColor Yellow
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

# Create HTTP Listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://*:$LISTEN_PORT/")

try {
    $listener.Start()
    Write-Host "🟢 Webhook Proxy active! Listening on port $LISTEN_PORT..." -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to start listener: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure no other service is using port $LISTEN_PORT (like U-Shops or IIS)." -ForegroundColor Yellow
    Exit
}

$recentTags = @{}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # Read POST body
        $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
        $body = $reader.ReadToEnd()
        $reader.Close()

        # Send 200 OK immediately to reader
        $buffer = [System.Text.Encoding]::UTF8.GetBytes("OK")
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        $response.OutputStream.Close()

        # Process tag data
        if ($body) {
            try {
                $obj = $body | ConvertFrom-Json
                $tags = @()

                if ($obj.tags) {
                    $tags = $obj.tags
                } elseif ($obj.tagReads) {
                    $tags = $obj.tagReads
                } elseif ($obj.data) {
                    $tags = $obj.data
                } elseif ($obj.epc) {
                    $tags = @($obj)
                }

                foreach ($t in $tags) {
                    $epc = if ($t.epc) { $t.epc } else { $t }
                    if ($epc -and $epc.Length -ge 8) {
                        $now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                        if (-not $recentTags.ContainsKey($epc) -or ($now - $recentTags[$epc]) -gt 1500) {
                            $recentTags[$epc] = $now
                            
                            # Extract RSSI
                            $rssi = $null
                            if ($t.rssi) { $rssi = $t.rssi } elseif ($t.peakRssi) { $rssi = $t.peakRssi }
                            
                            Write-Host "🏷️ [TAG DETECTED] EPC: $epc (RSSI: $rssi) - Forwarding to VOG..." -ForegroundColor Cyan
                            
                            # Forward to VOG main server
                            $forwardBody = @{ rfid_tag = $epc; source = "R700_WEBHOOK_PROXY"; rssi = $rssi } | ConvertTo-Json
                            Invoke-RestMethod -Uri $TARGET_URL -Method Post -Body $forwardBody -ContentType "application/json" -TimeoutSec 2 | Out-Null
                        }
                    }
                }
            } catch {
                Write-Host "⚠️ Error parsing webhook JSON: $_" -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host "⚠️ Error handling request: $($_.Exception.Message)" -ForegroundColor DarkYellow
    }
}
