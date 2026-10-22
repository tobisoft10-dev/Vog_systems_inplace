$servers = @("192.168.1.250", ".\SQLEXPRESS", "192.168.1.250\SQLEXPRESS", "192.168.1.250,1433")
$users = @("sa", "LOGO", "logo", "tiger", "TIGER")
$passwords = @("", "sa", "logo", "LOGO", "123456", "!719356Qse!", "Logo123", "Logo2020", "Logo2022", "Logo2026", "Sql2020", "Tiger", "TigerWings", "1", "1234", "12345678", "Vog2020", "Vog2022", "Vog2026")

foreach ($srv in $servers) {
    foreach ($usr in $users) {
        foreach ($pwd in $passwords) {
            $connStr = "Server=$srv;User ID=$usr;Password=$pwd;TrustServerCertificate=True;Connection Timeout=2"
            $conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
            try {
                $conn.Open()
                Write-Host "=================================================="
                Write-Host "🎉 SUCCESS! Connected to SQL Server [$srv] with User: '$usr' and Password: '$pwd'"
                Write-Host "=================================================="
                
                $cmd = $conn.CreateCommand()
                $cmd.CommandText = "SELECT name FROM sys.databases"
                $reader = $cmd.ExecuteReader()
                $dbs = @()
                while($reader.Read()){ $dbs += $reader["name"] }
                $reader.Close()
                Write-Host "Databases: $($dbs -join ', ')"

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
                        } catch {}
                    }
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

Write-Host "Scan completed."
