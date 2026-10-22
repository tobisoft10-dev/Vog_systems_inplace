$connStr = "Server=.\SQLEXPRESS;Database=master;Integrated Security=True;TrustServerCertificate=True"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
try {
    $conn.Open()
    Write-Host "Connected to SQL Server SQLEXPRESS!"
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT name FROM sys.databases WHERE name NOT IN ('master','tempdb','model','msdb')"
    $reader = $cmd.ExecuteReader()
    Write-Host "DATABASES FOUND:"
    while($reader.Read()){
        $dbName = $reader["name"]
        Write-Host "DB: $dbName"
    }
    $reader.Close()
} catch {
    Write-Host "Error connecting to SQL Server:"
    Write-Host $_.Exception.Message
} finally {
    $conn.Close()
}
