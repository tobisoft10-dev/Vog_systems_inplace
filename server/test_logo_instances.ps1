$instances = @(
    "192.168.1.250",
    "192.168.1.250\LOGO",
    "192.168.1.250\TIGER",
    "192.168.1.250\TIGERWINGS",
    "192.168.1.250\SQLEXPRESS",
    "192.168.1.250\LOGOERP",
    "192.168.1.250\LOGODB"
)

$passwords = @("150609%M", "!719356Qse!", "LOGO", "logo", "123456", "Logo123", "Logo2020", "Logo2022", "Logo2026", "Tiger", "TigerWings")

foreach ($inst in $instances) {
    foreach ($pwd in $passwords) {
        $connStr = "Server=$inst;User ID=sa;Password=$pwd;TrustServerCertificate=True;Connection Timeout=2"
        $conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
        try {
            $conn.Open()
            Write-Host "=================================================="
            Write-Host "SUCCESS! SQL Server Connected: '$inst' | Password: '$pwd'"
            Write-Host "=================================================="
            $cmd = $conn.CreateCommand()
            $cmd.CommandText = "SELECT name FROM sys.databases"
            $reader = $cmd.ExecuteReader()
            while($reader.Read()){ Write-Host " - " $reader["name"] }
            $reader.Close()
            $conn.Close()
            return
        } catch {}
    }
}

Write-Host "Instance test complete."
