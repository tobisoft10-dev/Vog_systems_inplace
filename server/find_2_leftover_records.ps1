$connStr = "data source=.\SQLEXPRESS;initial catalog=SIPARIS;persist security info=True;user id=sa;password=150609%M;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

Write-Host "⚡ Inspecting the 2 leftover records with corrupted characters..." -ForegroundColor Cyan

$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT Id, Model, Detay5 FROM Siparisler WHERE Detay5 LIKE '%[' + CHAR(195) + CHAR(196) + CHAR(197) + ']%'"
$adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
$dt = New-Object System.Data.DataTable
$adapter.Fill($dt) | Out-Null

foreach ($row in $dt.Rows) {
    Write-Host "ID $($row['Id']) | Model: $($row['Model'])" -ForegroundColor Yellow
    Write-Host "  Detay5: $($row['Detay5'])" -ForegroundColor Red
    $bytes = [System.Text.Encoding]::Unicode.GetBytes($row['Detay5'])
    $hex = ($bytes | ForEach-Object { $_.ToString("X2") }) -join " "
    Write-Host "  Hex   : $hex`n" -ForegroundColor Gray
}

$conn.Close()
