Write-Host "Scanning local network 192.168.1.x for SQL Server (Port 1433)..."

1..254 | ForEach-Object {
    $ip = "192.168.1.$_"
    $t = New-Object System.Net.Sockets.TcpClient
    $async = $t.BeginConnect($ip, 1433, $null, $null)
    $wait = $async.AsyncWaitHandle.WaitOne(80, $false)
    if ($wait) {
        try {
            $t.EndConnect($async)
            Write-Host "SQL SERVER FOUND ON IP: $ip (Port 1433 Open!)"
        } catch {}
    }
    $t.Close()
}
Write-Host "Scan completed."
