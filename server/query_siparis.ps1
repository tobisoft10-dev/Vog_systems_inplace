$connStr = "data source=.\SQLEXPRESS;initial catalog=SIPARIS;persist security info=True;user id=sa;password=150609%M;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

Write-Host "⚡ Inspecting Detay5 column for IDs 16708, 16119, 14979, 13977..." -ForegroundColor Cyan

$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT Id, Model, Detay5 FROM Siparisler WHERE Id IN (16708, 16119, 14979, 13977)"
$adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
$dt = New-Object System.Data.DataTable
$adapter.Fill($dt) | Out-Null
$dt | Format-Table -AutoSize

Write-Host "`n⚡ Inspecting ALL records where Detay5 IS NOT NULL or NOT EMPTY..." -ForegroundColor Cyan

$cmd2 = $conn.CreateCommand()
$cmd2.CommandText = "SELECT Id, Model, Detay5 FROM Siparisler WHERE Detay5 IS NOT NULL AND Detay5 <> ''"
$adapter2 = New-Object System.Data.SqlClient.SqlDataAdapter($cmd2)
$dt2 = New-Object System.Data.DataTable
$adapter2.Fill($dt2) | Out-Null
$dt2 | Format-Table -AutoSize

$conn.Close()
