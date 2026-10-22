$connStr = "data source=.\SQLEXPRESS;initial catalog=SIPARIS;persist security info=True;user id=sa;password=150609%M;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

Write-Host "⚡ Inspecting FULL Detay5 text for Siparis #16708, #16707, #16706..." -ForegroundColor Cyan

$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT Id, Detay5 FROM Siparisler WHERE Id IN (16708, 16707, 16706, 16705) ORDER BY Id DESC"
$adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
$dt = New-Object System.Data.DataTable
$adapter.Fill($dt) | Out-Null

foreach ($row in $dt.Rows) {
    Write-Host "Siparis ID $($row['Id']) :" -ForegroundColor Yellow
    Write-Host "  Detay5: $($row['Detay5'])`n" -ForegroundColor Green
}

$conn.Close()
