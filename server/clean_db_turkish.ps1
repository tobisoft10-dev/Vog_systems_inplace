$connStr = "data source=.\SQLEXPRESS;initial catalog=SIPARIS;persist security info=True;user id=sa;password=150609%M;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

Write-Host "⚡ Connected to MS SQL Server SIPARIS database!" -ForegroundColor Green
Write-Host "⚡ Cleaning broken Turkish characters in Siparisler table (Detay5 and Detay1)...`n" -ForegroundColor Cyan

# 1. Update Detay5
$sqlDetay5 = @"
UPDATE Siparisler
SET Detay5 = REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(Detay5, 
                    'PARÃ‡A', 'PARÇA'),
                    'DAÃ„ÂžITIMI', 'DAĞITIMI'),
                    'DAÄžITIMI', 'DAĞITIMI'),
                    'BAYÃ„Â°', 'BAYİ'),
                    'BAYÄ°', 'BAYİ'),
                    'BÃ–LGE', 'BÖLGE'),
                    'Ã‡', 'Ç'),
                    'Ã§', 'ç'),
                    'Äž', 'Ğ'),
                    'ÄŸ', 'ğ'),
                    'Ä°', 'İ'),
                    'Ä±', 'ı'),
                    'Ã–', 'Ö'),
                    'Åž', 'Ş'),
                    'Ãœ', 'Ü')
WHERE Detay5 LIKE '%Ã%' OR Detay5 LIKE '%Ä%' OR Detay5 LIKE '%Å%'
"@

$cmd1 = $conn.CreateCommand()
$cmd1.CommandText = $sqlDetay5
$rowsDetay5 = $cmd1.ExecuteNonQuery()
Write-Host "✅ Updated $rowsDetay5 records in Detay5 column." -ForegroundColor Green

# 2. Update Detay1
$sqlDetay1 = @"
UPDATE Siparisler
SET Detay1 = REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(Detay1, 
                    'PARÃ‡A', 'PARÇA'),
                    'DAÃ„ÂžITIMI', 'DAĞITIMI'),
                    'DAÄžITIMI', 'DAĞITIMI'),
                    'BAYÃ„Â°', 'BAYİ'),
                    'BAYÄ°', 'BAYİ'),
                    'BÃ–LGE', 'BÖLGE'),
                    'Ã‡', 'Ç'),
                    'Ã§', 'ç'),
                    'Äž', 'Ğ'),
                    'ÄŸ', 'ğ'),
                    'Ä°', 'İ'),
                    'Ä±', 'ı'),
                    'Ã–', 'Ö'),
                    'Åž', 'Ş'),
                    'Ãœ', 'Ü')
WHERE Detay1 LIKE '%Ã%' OR Detay1 LIKE '%Ä%' OR Detay1 LIKE '%Å%'
"@

$cmd2 = $conn.CreateCommand()
$cmd2.CommandText = $sqlDetay1
$rowsDetay1 = $cmd2.ExecuteNonQuery()
Write-Host "✅ Updated $rowsDetay1 records in Detay1 column." -ForegroundColor Green

# 3. Print sample updated Detay5 records
Write-Host "`n⚡ Sample Updated Detay5 Records:" -ForegroundColor Yellow
$cmdSample = $conn.CreateCommand()
$cmdSample.CommandText = "SELECT TOP 10 Id, Model, Detay5 FROM Siparisler WHERE Detay5 LIKE '%PARÇA NO%' ORDER BY Id DESC"
$adapterSample = New-Object System.Data.SqlClient.SqlDataAdapter($cmdSample)
$dtSample = New-Object System.Data.DataTable
$adapterSample.Fill($dtSample) | Out-Null
$dtSample | Format-Table -AutoSize

$conn.Close()
