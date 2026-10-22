$servers = @("192.168.1.100", "192.168.1.250")
$users = @("sa", "LOGO", "logo", "tiger", "TIGER")
$passwords = @(
    "150609%M", "!719356Qse!", "LOGO", "logo", "Logo", "Logo123", "Logo2020", "Logo2021", "Logo2022", "Logo2023", "Logo2024", "Logo2025", "Logo2026",
    "Logo123!", "Logo2020!", "Logo2022!", "Logo2026!", "Logo.123", "Logo.2020", "Logo.2022", "Logo.2026", "Logo_123", "Logo_2020", "Logo_2022",
    "Tiger", "TigerWings", "Tiger123", "Tiger2020", "Tiger2022", "Tiger2026",
    "Vog123", "Vog2020", "Vog2022", "Vog2026", "VogTekstil", "Vog.2020", "Vog.2022", "Vog.2026",
    "sa", "123456", "1234", "12345678", "Sql2020", "Sql2022", "Sql2026"
)

foreach ($srv in $servers) {
    foreach ($usr in $users) {
        foreach ($pwd in $passwords) {
            $connStr = "Server=$srv;User ID=$usr;Password=$pwd;TrustServerCertificate=True;Connection Timeout=1"
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
                Write-Host "Databases on [$srv]: $($dbs -join ', ')"

                foreach ($db in $dbs) {
                    $cmd2 = $conn.CreateCommand()
                    $cmd2.CommandText = "SELECT TABLE_NAME FROM [$db].INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE 'LG_%' OR TABLE_NAME LIKE '%STFICHE%' OR TABLE_NAME LIKE '%INVOICE%' OR TABLE_NAME LIKE '%IRSALIYE%' ORDER BY TABLE_NAME"
                    try {
                        $reader2 = $cmd2.ExecuteReader()
                        $tables = @()
                        while($reader2.Read()){ $tables += $reader2["TABLE_NAME"] }
                        $reader2.Close()
                        if ($tables.Count -gt 0) {
                            Write-Host "   -> LOGO Tables in [$db] ($($tables.Count) tables found):"
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

Write-Host "Password scan completed."
