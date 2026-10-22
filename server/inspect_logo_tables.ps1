$servers = @(".\SQLEXPRESS", "192.168.1.250", "localhost", "127.0.0.1")

foreach ($srv in $servers) {
    Write-Host "=========================================="
    Write-Host "Testing SQL Server: $srv"
    Write-Host "=========================================="
    $connStr = "Server=$srv;Database=master;Integrated Security=True;TrustServerCertificate=True;Connection Timeout=3"
    $conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
    try {
        $conn.Open()
        Write-Host "Connected to $srv !"
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "SELECT name FROM sys.databases"
        $reader = $cmd.ExecuteReader()
        $dbs = @()
        while($reader.Read()){ $dbs += $reader["name"] }
        $reader.Close()
        Write-Host "Databases on $srv : $($dbs -join ', ')"

        foreach ($db in $dbs) {
            if ($db -notin @('master','tempdb','model','msdb')) {
                $cmd2 = $conn.CreateCommand()
                $cmd2.CommandText = "SELECT TABLE_NAME FROM [$db].INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE 'LG_%' OR TABLE_NAME LIKE '%STFICHE%' OR TABLE_NAME LIKE '%INVOICE%' OR TABLE_NAME LIKE '%IRSALIYE%' ORDER BY TABLE_NAME"
                try {
                    $reader2 = $cmd2.ExecuteReader()
                    $tables = @()
                    while($reader2.Read()){ $tables += $reader2["TABLE_NAME"] }
                    $reader2.Close()
                    if ($tables.Count -gt 0) {
                        Write-Host "   -> LOGO Tables in [$db] ($($tables.Count) tables found):"
                        Write-Host "      $($tables[0..15] -join ', ')"
                    }
                } catch {
                    # Ignore db read error
                }
            }
        }

    } catch {
        Write-Host "Could not connect to $srv : $($_.Exception.Message)"
    } finally {
        $conn.Close()
    }
}
