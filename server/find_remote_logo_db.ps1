$servers = @("192.168.1.250", "192.168.1.234", "192.168.1.100", "logodbsrv")
$users = @("sa", "LOGO", "logo", "tiger", "TIGER", "LBS", "lbs")
$passwords = @("150609%M", "!719356Qse!", "LOGO", "logo", "123456", "Logo123", "Logo2020", "Logo2022", "Logo2026", "Logo2024", "Tiger", "TigerWings", "1", "1234", "Sql2020")

foreach ($srv in $servers) {
    Write-Host "=========================================="
    Write-Host "Testing SQL Server Host: $srv"
    Write-Host "=========================================="
    
    # 1. Try Windows Auth
    $connStrWin = "Server=$srv;Integrated Security=True;TrustServerCertificate=True;Connection Timeout=2"
    $connWin = New-Object System.Data.SqlClient.SqlConnection($connStrWin)
    try {
        $connWin.Open()
        Write-Host "🎉 SUCCESS! Connected to [$srv] via Windows Auth!"
        $cmd = $connWin.CreateCommand()
        $cmd.CommandText = "SELECT name FROM sys.databases"
        $r = $cmd.ExecuteReader()
        $dbs = @()
        while($r.Read()){ $dbs += $r["name"] }
        $r.Close()
        Write-Host "Databases on [$srv]: $($dbs -join ', ')"
        $connWin.Close()
        continue
    } catch {}

    # 2. Try SQL Auth
    foreach ($usr in $users) {
        foreach ($pwd in $passwords) {
            $connStr = "Server=$srv;User ID=$usr;Password=$pwd;TrustServerCertificate=True;Connection Timeout=1"
            $conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
            try {
                $conn.Open()
                Write-Host "🎉 SUCCESS! Connected to [$srv] with User: '$usr' Password: '$pwd'"
                $cmd = $conn.CreateCommand()
                $cmd.CommandText = "SELECT name FROM sys.databases"
                $r = $cmd.ExecuteReader()
                $dbs = @()
                while($r.Read()){ $dbs += $r["name"] }
                $r.Close()
                Write-Host "Databases on [$srv]: $($dbs -join ', ')"
                $conn.Close()
                break
            } catch {}
        }
    }
}

Write-Host "Server scan completed."
