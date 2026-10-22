$connStr = "Server=.\SQLEXPRESS;Database=master;User ID=sa;Password=150609%M;TrustServerCertificate=True"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
try {
    $conn.Open()
    Write-Host "✅ Connected to SQL Server .\SQLEXPRESS!"
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT name FROM sys.databases"
    $reader = $cmd.ExecuteReader()
    $dbs = @()
    while($reader.Read()){ $dbs += $reader["name"] }
    $reader.Close()

    foreach ($db in $dbs) {
        $cmd2 = $conn.CreateCommand()
        $cmd2.CommandText = "SELECT TABLE_NAME FROM [$db].INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE 'LG_%' ORDER BY TABLE_NAME"
        try {
            $r2 = $cmd2.ExecuteReader()
            $lgTables = @()
            while($r2.Read()){ $lgTables += $r2['TABLE_NAME'] }
            $r2.Close()
            if ($lgTables.Count -gt 0) {
                Write-Host "🎯 LOGO TIGER ERP TABLES FOUND IN DATABASE [$db] ($($lgTables.Count) tables):"
                Write-Host "   $($lgTables[0..20] -join ', ')"
            }
        } catch {}
    }

} catch {
    Write-Host "Error:" $_.Exception.Message
} finally {
    $conn.Close()
}
