$servers = @("192.168.1.234", "logodbsrv", "192.168.1.234\LOGO", "192.168.1.234\TIGER", "192.168.1.234\SQLEXPRESS")
$users = @("sa", "LOGO", "logo", "tiger")
$passwords = @("150609%M", "!719356Qse!", "LOGO", "logo", "123456", "Logo123", "Logo2020", "Logo2022", "Logo2026", "Tiger", "TigerWings", "1", "1234")

foreach ($srv in $servers) {
    Write-Host "Checking Server: $srv"
    foreach ($usr in $users) {
        foreach ($pwd in $passwords) {
            $connStr = "Server=$srv;User ID=$usr;Password=$pwd;TrustServerCertificate=True;Connection Timeout=2"
            $conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
            try {
                $conn.Open()
                Write-Host "=================================================="
                Write-Host "🎉 SUCCESS! Connected to LOGO SQL Server [$srv] with User: '$usr' and Password: '$pwd'"
                Write-Host "=================================================="
                
                $cmd = $conn.CreateCommand()
                $cmd.CommandText = "SELECT name FROM sys.databases"
                $reader = $cmd.ExecuteReader()
                $dbs = @()
                while($reader.Read()){ $dbs += $reader["name"] }
                $reader.Close()
                Write-Host "Databases: $($dbs -join ', ')"

                foreach ($db in $dbs) {
                    $cmd2 = $conn.CreateCommand()
                    $cmd2.CommandText = "SELECT TABLE_NAME FROM [$db].INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE 'LG_%' ORDER BY TABLE_NAME"
                    try {
                        $reader2 = $cmd2.ExecuteReader()
                        $tables = @()
                        while($reader2.Read()){ $tables += $reader2["TABLE_NAME"] }
                        $reader2.Close()
                        if ($tables.Count -gt 0) {
                            Write-Host "   -> LOGO Tiger Tables in [$db] ($($tables.Count) tables found):"
                            Write-Host "      $($tables[0..20] -join ', ')"
                        }
                    } catch {}
                }
                $conn.Close()
                return
            } catch {
                # quiet failure
            } finally {
                $conn.Close()
            }
        }
    }
}

# Try Windows Authentication on 192.168.1.234
foreach ($srv in $servers) {
    $connStr = "Server=$srv;Integrated Security=True;TrustServerCertificate=True;Connection Timeout=2"
    $conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
    try {
        $conn.Open()
        Write-Host "=================================================="
        Write-Host "🎉 SUCCESS! Connected via Windows Auth to LOGO Server [$srv]!"
        Write-Host "=================================================="
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "SELECT name FROM sys.databases"
        $reader = $cmd.ExecuteReader()
        $dbs = @()
        while($reader.Read()){ $dbs += $reader["name"] }
        $reader.Close()
        Write-Host "Databases: $($dbs -join ', ')"
        $conn.Close()
        return
    } catch {}
}

Write-Host "Scan completed."
