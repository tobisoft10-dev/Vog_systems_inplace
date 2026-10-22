$connStr = "data source=.\SQLEXPRESS;initial catalog=SIPARIS;persist security info=True;user id=sa;password=150609%M;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

Write-Host "⚡ Inspecting SiparisDetaylari table columns..." -ForegroundColor Cyan
$cmdCols = $conn.CreateCommand()
$cmdCols.CommandText = "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'SiparisDetaylari'"
$adapterCols = New-Object System.Data.SqlClient.SqlDataAdapter($cmdCols)
$dtCols = New-Object System.Data.DataTable
$adapterCols.Fill($dtCols) | Out-Null
$dtCols | Format-Table -AutoSize

Write-Host "`n⚡ Querying SiparisDetaylari for Siparis IDs 16708, 16119, 14979, 13977..." -ForegroundColor Cyan
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT TOP 20 * FROM SiparisDetaylari WHERE SiparisId IN (16708, 16119, 14979, 13977)"
$adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
$dt = New-Object System.Data.DataTable
$adapter.Fill($dt) | Out-Null
$dt | Format-Table -AutoSize

$conn.Close()
