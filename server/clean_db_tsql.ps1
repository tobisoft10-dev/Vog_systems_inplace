$connStr = "data source=.\SQLEXPRESS;initial catalog=SIPARIS;persist security info=True;user id=sa;password=150609%M;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

Write-Host "⚡ Running T-SQL Unicode Encoding Cleanup..." -ForegroundColor Cyan

# 1. Update PARÃ‡A NO and all variations of PARCA NO in Detay5
$sql1 = @"
UPDATE Siparisler
SET Detay5 = REPLACE(REPLACE(REPLACE(REPLACE(Detay5, 
                'PAR' + CHAR(195) + CHAR(135) + 'A', 'PAR' + NCHAR(199) + 'A'),
                'PAR' + CHAR(195) + CHAR(167) + 'A', 'PAR' + NCHAR(199) + 'A'),
                'PAR' + CHAR(195) + 'A', 'PAR' + NCHAR(199) + 'A'),
                'PAR' + CHAR(195) + CHAR(135), 'PAR' + NCHAR(199))
WHERE Detay5 LIKE '%PAR%'
"@

$cmd1 = $conn.CreateCommand()
$cmd1.CommandText = $sql1
$r1 = $cmd1.ExecuteNonQuery()
Write-Host "✅ Updated PARÇA NO in $r1 records." -ForegroundColor Green

# 2. Update DAĞITIMI in Detay5
$sql2 = @"
UPDATE Siparisler
SET Detay5 = REPLACE(REPLACE(REPLACE(Detay5,
                'DA' + CHAR(195) + CHAR(132) + CHAR(195) + CHAR(158) + 'ITIMI', 'DA' + NCHAR(286) + 'ITIMI'),
                'DA' + CHAR(195) + CHAR(132) + 'ITIMI', 'DA' + NCHAR(286) + 'ITIMI'),
                'DA' + CHAR(196) + CHAR(158) + 'ITIMI', 'DA' + NCHAR(286) + 'ITIMI')
WHERE Detay5 LIKE '%DA%'
"@

$cmd2 = $conn.CreateCommand()
$cmd2.CommandText = $sql2
$r2 = $cmd2.ExecuteNonQuery()
Write-Host "✅ Updated DAĞITIMI in $r2 records." -ForegroundColor Green

# 3. Update BAYİ in Detay5
$sql3 = @"
UPDATE Siparisler
SET Detay5 = REPLACE(REPLACE(REPLACE(Detay5,
                'BAY' + CHAR(195) + CHAR(132) + CHAR(195) + CHAR(130), 'BAY' + NCHAR(304)),
                'BAY' + CHAR(195) + CHAR(132), 'BAY' + NCHAR(304)),
                'BAY' + CHAR(196) + CHAR(176), 'BAY' + NCHAR(304))
WHERE Detay5 LIKE '%BAY%'
"@

$cmd3 = $conn.CreateCommand()
$cmd3.CommandText = $sql3
$r3 = $cmd3.ExecuteNonQuery()
Write-Host "✅ Updated BAYİ in $r3 records." -ForegroundColor Green

# 4. Print sample updated Detay5 records
Write-Host "`n⚡ Sample Cleaned Detay5 Records:" -ForegroundColor Yellow
$cmdSample = $conn.CreateCommand()
$cmdSample.CommandText = "SELECT TOP 15 Id, Model, Detay5 FROM Siparisler WHERE Detay5 LIKE '%PAR%' OR Detay5 LIKE '%BAY%' ORDER BY Id DESC"
$adapterSample = New-Object System.Data.SqlClient.SqlDataAdapter($cmdSample)
$dtSample = New-Object System.Data.DataTable
$adapterSample.Fill($dtSample) | Out-Null
$dtSample | Format-Table -AutoSize

$conn.Close()
