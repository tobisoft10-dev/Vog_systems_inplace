$connStr = "data source=.\SQLEXPRESS;initial catalog=SIPARIS;persist security info=True;user id=sa;password=150609%M;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

Write-Host "⚡ Running Final T-SQL Unicode Cleanup & PARÇA NO Formatting..." -ForegroundColor Cyan

# 1. Clean all versions of DAĞITIMI
$sql1 = @"
UPDATE Siparisler
SET Detay5 = REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(Detay5, 
                    'DA' + CHAR(195) + CHAR(132) + CHAR(194) + CHAR(158) + 'ITIMI', 'DA' + NCHAR(286) + 'ITIMI'),
                    'DA' + CHAR(195) + CHAR(132) + CHAR(158) + 'ITIMI', 'DA' + NCHAR(286) + 'ITIMI'),
                    'DA' + CHAR(195) + CHAR(132) + 'ITIMI', 'DA' + NCHAR(286) + 'ITIMI'),
                    'DA' + CHAR(196) + CHAR(158) + 'ITIMI', 'DA' + NCHAR(286) + 'ITIMI'),
                    'DAGITIMI', 'DA' + NCHAR(286) + 'ITIMI')
WHERE Detay5 LIKE '%DA%ITIMI%'
"@

$cmd1 = $conn.CreateCommand()
$cmd1.CommandText = $sql1
$r1 = $cmd1.ExecuteNonQuery()
Write-Host "✅ Fixed DAĞITIMI in $r1 records." -ForegroundColor Green

# 2. Add 'PARÇA NO: ' prefix to NISSAN barcodes (starting with 90) if missing
$sql2 = @"
UPDATE Siparisler
SET Detay5 = REPLACE(Detay5, ' 901', ' PAR' + NCHAR(199) + 'A NO: 901')
WHERE Detay5 LIKE '% 901%' 
  AND Detay5 NOT LIKE '%PAR%'
"@

$cmd2 = $conn.CreateCommand()
$cmd2.CommandText = $sql2
$r2 = $cmd2.ExecuteNonQuery()
Write-Host "✅ Added PARÇA NO: prefix to $r2 barcode records." -ForegroundColor Green

# 3. Print verification for Siparis #13977, #14979, #16119, #16708, #16707, #16706
Write-Host "`n⚡ Verifying Full Detay5 Sentences for NISSAN Orders:" -ForegroundColor Yellow
$cmdV = $conn.CreateCommand()
$cmdV.CommandText = "SELECT Id, Detay5 FROM Siparisler WHERE Id IN (13977, 14979, 16119, 16708, 16707, 16706) ORDER BY Id DESC"
$adapterV = New-Object System.Data.SqlClient.SqlDataAdapter($cmdV)
$dtV = New-Object System.Data.DataTable
$adapterV.Fill($dtV) | Out-Null

foreach ($row in $dtV.Rows) {
    Write-Host "ID $($row['Id']) :" -ForegroundColor Cyan
    Write-Host "  Detay5: $($row['Detay5'])`n" -ForegroundColor Green
}

$conn.Close()
