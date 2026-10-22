# ==============================================================================
# 🚀 VOG NATIVE TUNNEL CONTROLLER (OCTANE / BRIDGE WEBSOCKET MOTORU)
# ==============================================================================
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "VOG NATIVE TUNNEL CONTROLLER (OCTANE MOTORU)"

$VOG_SERVER = "http://192.168.1.251:3001"
$WS_URL = "ws://127.0.0.1:8025/ws"

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host " 🚀 VOG NATIVE TUNNEL CONTROLLER (OCTANE / BRIDGE ENTEGRASYONU)" -ForegroundColor Green
Write-Host " 🏢 VOG SUNUCU HEDEFI: $VOG_SERVER" -ForegroundColor Yellow
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

function Post-TagToVog($epc) {
    try {
        $body = @{ rfid_tag = $epc; reader_id = "VOG_OCTANE_013" } | ConvertTo-Json
        $resp = Invoke-RestMethod -Uri "$VOG_SERVER/api/tunnel/kiosk/scan-tag" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 2
        Write-Host "✨ [VOG KIOSK SAYAC +1] EPC: $epc VOG Sistemine Islendi!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ VOG Sunucusuna gonderilemedi ($epc): $($_.Exception.Message)" -ForegroundColor Red
    }
}

while ($true) {
    try {
        Write-Host "🔌 [KOPRU] Takipsan Bridge Donanim Soketine Baglaniliyor ($WS_URL)..." -ForegroundColor Yellow
        $ws = New-Object System.Net.WebSockets.ClientWebSocket
        $cts = New-Object System.Threading.CancellationTokenSource
        $connectTask = $ws.ConnectAsync([System.Uri]$WS_URL, $cts.Token)
        $connectTask.Wait(5000)

        Write-Host "✅ [KOPRU BAGLANDI] Donanim Koprusu ile WebSocket oturumu acildi!" -ForegroundColor Green

        # 1. CREATE READER
        $createMsg = @{
            type = "createreader"
            body = @{
                id = "1"
                param = @{
                    id = 1
                    readerType = "Impinj"
                    connectionType = "Ethernet"
                    address = "192.168.0.13"
                }
            }
        } | ConvertTo-Json -Depth 5 -Compress

        $bytes = [System.Text.Encoding]::UTF8.GetBytes($createMsg)
        $segment = New-Object System.ArraySegment[byte]($bytes, 0, $bytes.Length)
        $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()
        Write-Host "📤 [1/3] Impinj Okuyucu Nesnesi Olusturuldu (192.168.0.13)." -ForegroundColor Cyan
        Start-Sleep -Milliseconds 600

        # 2. CONNECT READER & CONFIGURE 4 ANTENNAS
        $connectMsg = @{
            type = "connectreader"
            body = @{
                id = "1"
                param = @{
                    id = 1
                    settings = @{
                        readPower = 30.0
                        writePower = 30.0
                        antennas = @(
                            @{ portNumber = 1; enabled = $true; readPower = 30.0 },
                            @{ portNumber = 2; enabled = $true; readPower = 30.0 },
                            @{ portNumber = 3; enabled = $true; readPower = 30.0 },
                            @{ portNumber = 4; enabled = $true; readPower = 30.0 }
                        )
                    }
                }
            }
        } | ConvertTo-Json -Depth 5 -Compress

        $bytes = [System.Text.Encoding]::UTF8.GetBytes($connectMsg)
        $segment = New-Object System.ArraySegment[byte]($bytes, 0, $bytes.Length)
        $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()
        Write-Host "📤 [2/3] Impinj Baglantisi ve 4 Anten Konfigurasyonu gonderildi." -ForegroundColor Cyan
        Start-Sleep -Milliseconds 800

        # 3. START READER
        $startMsg = @{
            type = "startreader"
            body = @{
                id = "1"
                param = @{ id = 1 }
            }
        } | ConvertTo-Json -Depth 5 -Compress

        $bytes = [System.Text.Encoding]::UTF8.GetBytes($startMsg)
        $segment = New-Object System.ArraySegment[byte]($bytes, 0, $bytes.Length)
        $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()
        Write-Host "⚡ [3/3] [IMPINJ 4 ANTEN ATESLENDI] Canli tarama aktif! Kolileri tunelden gecirebilirsiniz.`n" -ForegroundColor Green

        $recvBuffer = New-Object byte[] 65536
        $recentTags = @{}

        while ($ws.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
            $recvSegment = New-Object System.ArraySegment[byte]($recvBuffer, 0, $recvBuffer.Length)
            $recvTask = $ws.ReceiveAsync($recvSegment, $cts.Token)
            $recvTask.Wait()
            $result = $recvTask.Result

            if ($result.MessageType -eq [System.Net.WebSockets.WebSocketMessageType]::Close) {
                break
            }

            $jsonStr = [System.Text.Encoding]::UTF8.GetString($recvBuffer, 0, $result.Count)
            
            try {
                $obj = $jsonStr | ConvertFrom-Json
                Write-Host "📥 [GELEN VERI]: $jsonStr" -ForegroundColor DarkGray

                # EPC Listesi
                if ($obj.tags) {
                    foreach ($t in $obj.tags) {
                        $epc = if ($t.epc) { $t.epc } else { $t }
                        if ($epc -and $epc.Length -ge 8) {
                            $now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                            if (-not $recentTags.ContainsKey($epc) -or ($now - $recentTags[$epc]) -gt 1200) {
                                $recentTags[$epc] = $now
                                Write-Host "🏷️ [ETIKET YAKALANDI] EPC: $epc" -ForegroundColor Cyan
                                Post-TagToVog $epc
                            }
                        }
                    }
                } elseif ($obj.body -and $obj.body.tags) {
                    foreach ($t in $obj.body.tags) {
                        $epc = if ($t.epc) { $t.epc } else { $t }
                        if ($epc -and $epc.Length -ge 8) {
                            $now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                            if (-not $recentTags.ContainsKey($epc) -or ($now - $recentTags[$epc]) -gt 1200) {
                                $recentTags[$epc] = $now
                                Write-Host "🏷️ [ETIKET YAKALANDI] EPC: $epc" -ForegroundColor Cyan
                                Post-TagToVog $epc
                            }
                        }
                    }
                } elseif ($obj.epc) {
                    $epc = $obj.epc
                    $now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                    if (-not $recentTags.ContainsKey($epc) -or ($now - $recentTags[$epc]) -gt 1200) {
                        $recentTags[$epc] = $now
                        Write-Host "🏷️ [ETIKET YAKALANDI] EPC: $epc" -ForegroundColor Cyan
                        Post-TagToVog $epc
                    }
                }
            } catch {
                # JSON olmayan format
            }
        }
    } catch {
        Write-Host "⚠️ [HATA]: $($_.Exception.Message)" -ForegroundColor DarkYellow
    } finally {
        if ($ws) { $ws.Dispose() }
    }

    Write-Host "⏳ 3 saniye sonra tekrar denenecek...`n" -ForegroundColor Gray
    Start-Sleep -Seconds 3
}
