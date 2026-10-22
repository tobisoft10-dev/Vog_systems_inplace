$connStr = "data source=.\SQLEXPRESS;initial catalog=SIPARIS;persist security info=True;user id=sa;password=150609%M;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

Write-Host "⚡ Inspecting NISSAN orders in Siparisler table (Detay5)..." -ForegroundColor Cyan

$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT TOP 15 s.Id, s.Model, s.Detay5 FROM Siparisler s LEFT JOIN Musteriler m ON s.MusteriId = m.Id WHERE m.Adi LIKE '%NISSAN%' OR s.Model LIKE '%NISSAN%' ORDER BY s.Id DESC"
$adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
$dt = New-Object System.Data.DataTable
$adapter.Fill($dt) | Out-Null

$dt | Format-Table -AutoSize

$conn.Close()
