$passwords = @("!719356Qse!", "Logo2020", "Logo2022", "Logo2026", "sa", "123456", "Logo123", "Sql2020", "Tiger", "TigerWings", "1", "1234")

foreach ($p in $passwords) {
    $connStr = "Server=.\SQLEXPRESS;User ID=sa;Password=$p;TrustServerCertificate=True;Connection Timeout=2"
    $conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
    try {
        $conn.Open()
        Write-Host "SUCCESS! SQL Server SA Password is: '$p'"
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "SELECT name FROM sys.databases"
        $reader = $cmd.ExecuteReader()
        while($reader.Read()){ Write-Host " - " $reader["name"] }
        $reader.Close()
        $conn.Close()
        break
    } catch {
        # quiet
    }
}
