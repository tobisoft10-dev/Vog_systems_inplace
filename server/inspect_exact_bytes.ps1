$connStr = "data source=.\SQLEXPRESS;initial catalog=SIPARIS;persist security info=True;user id=sa;password=150609%M;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

Write-Host "⚡ Inspecting exact string and hex values for Siparis #16708 Detay5..." -ForegroundColor Cyan

$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT Id, Detay5, CAST(Detay5 AS VARBINARY(MAX)) as HexVal FROM Siparisler WHERE Id IN (16708, 16707, 16706, 16119, 14979, 13977)"
$adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
$dt = New-Object System.Data.DataTable
$adapter.Fill($dt) | Out-Null

foreach ($row in $dt.Rows) {
    Write-Host "ID $($row['Id']):" -ForegroundColor Yellow
    Write-Host "  String: $($row['Detay5'])" -ForegroundColor Green
    $bytes = [System.Text.Encoding]::Unicode.GetBytes($row['Detay5'])
    $hex = ($bytes | ForEach-Object { $_.ToString("X2") }) -join " "
    Write-Host "  Hex   : $hex`n" -ForegroundColor Gray
}

$conn.Close()
