$connStr = "Server=.\SQLEXPRESS;Database=SIPARIS;Integrated Security=True;TrustServerCertificate=True"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
try {
    $conn.Open()
    Write-Host "Connected to [SIPARIS] database on .\SQLEXPRESS!"
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES ORDER BY TABLE_NAME"
    $reader = $cmd.ExecuteReader()
    $tables = @()
    while($reader.Read()){ $tables += $reader["TABLE_NAME"] }
    $reader.Close()
    Write-Host "Tables in [SIPARIS] database:"
    foreach ($t in $tables) {
        Write-Host " - $t"
    }

    foreach ($t in $tables) {
        if ($t -like "*IRSALIYE*" -or $t -like "*SIPARIS*" -or $t -like "*AKTAR*" -or $t -like "*LOGO*") {
            Write-Host "Table Schema: $t"
            $cmd2 = $conn.CreateCommand()
            $cmd2.CommandText = "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '$t'"
            $r2 = $cmd2.ExecuteReader()
            while($r2.Read()){
                $colName = $r2['COLUMN_NAME']
                $dataType = $r2['DATA_TYPE']
                Write-Host "   $colName ($dataType)"
            }
            $r2.Close()
        }
    }

} catch {
    Write-Host "Error:"
    Write-Host $_.Exception.Message
} finally {
    $conn.Close()
}
