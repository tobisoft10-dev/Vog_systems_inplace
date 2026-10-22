$connStr = "data source=.\SQLEXPRESS;initial catalog=SIPARIS;persist security info=True;user id=sa;password=150609%M;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

Write-Host "⚡ CAREFUL AUDIT: Checking ALL order package details (Detay5 & Detay1) across ALL barcodes..." -ForegroundColor Cyan

# Fetch all records from Siparisler where Detay5 or Detay1 is not null
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT Id, Model, Detay5, Detay1 FROM Siparisler WHERE Detay5 IS NOT NULL AND Detay5 <> ''"
$adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
$dt = New-Object System.Data.DataTable
$adapter.Fill($dt) | Out-Null

Write-Host "Analyzing $($dt.Rows.Count) total order records in database...`n" -ForegroundColor Yellow

# T-SQL query to clean ONLY character encoding artifacts across Detay5 and Detay1 safely
$sqlCleanDetay5 = @"
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
                REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(Detay5,
                    CHAR(195) + CHAR(132) + CHAR(194) + CHAR(158), NCHAR(286)), -- DAÃ„ÂžITIMI -> DAĞITIMI
                    CHAR(195) + CHAR(132) + CHAR(195) + CHAR(158), NCHAR(286)),
                    CHAR(195) + CHAR(132) + CHAR(130), NCHAR(304)),
                    CHAR(195) + CHAR(132) + CHAR(158), NCHAR(286)),

                    CHAR(196) + CHAR(176), NCHAR(304)), -- Ä° -> İ
                    CHAR(196) + CHAR(177), NCHAR(305)), -- Ä± -> ı
                    CHAR(196) + CHAR(158), NCHAR(286)), -- Äž -> Ğ
                    CHAR(196) + CHAR(159), NCHAR(287)), -- ÄŸ -> ğ
                    CHAR(197) + CHAR(158), NCHAR(350)), -- Åž -> Ş
                    CHAR(197) + CHAR(159), NCHAR(351)), -- ÅŸ -> ş
                    CHAR(195) + CHAR(135), NCHAR(199)), -- Ã‡ -> Ç
                    CHAR(195) + CHAR(167), NCHAR(231)), -- Ã§ -> ç
                    CHAR(195) + CHAR(150), NCHAR(214)), -- Ã– -> Ö
                    CHAR(195) + CHAR(182), NCHAR(246)), -- Ã¶ -> ö
                    CHAR(195) + CHAR(156), NCHAR(220)), -- Ãœ -> Ü
                    CHAR(195) + CHAR(188), NCHAR(252)), -- Ã¼ -> ü
                    
                    'OLAB' + CHAR(196) + CHAR(176) + 'L' + CHAR(196) + CHAR(176) + 'R', 'OLABİLİR'),
                    'B' + CHAR(196) + CHAR(176) + 'LG' + CHAR(196) + CHAR(176), 'BİLGİ')
WHERE Detay5 LIKE '%[' + CHAR(195) + CHAR(196) + CHAR(197) + ']%'
"@

$cmd5 = $conn.CreateCommand()
$cmd5.CommandText = $sqlCleanDetay5
$r5 = $cmd5.ExecuteNonQuery()

# Also clean Detay1
$sqlCleanDetay1 = @"
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
                REPLACE(
                REPLACE(
                REPLACE(
                REPLACE(Detay1,
                    CHAR(195) + CHAR(132) + CHAR(194) + CHAR(158), NCHAR(286)),
                    CHAR(195) + CHAR(132) + CHAR(195) + CHAR(158), NCHAR(286)),
                    CHAR(195) + CHAR(132) + CHAR(130), NCHAR(304)),
                    CHAR(195) + CHAR(132) + CHAR(158), NCHAR(286)),

                    CHAR(196) + CHAR(176), NCHAR(304)),
                    CHAR(196) + CHAR(177), NCHAR(305)),
                    CHAR(196) + CHAR(158), NCHAR(286)),
                    CHAR(196) + CHAR(159), NCHAR(287)),
                    CHAR(197) + CHAR(158), NCHAR(350)),
                    CHAR(197) + CHAR(159), NCHAR(351)),
                    CHAR(195) + CHAR(135), NCHAR(199)),
                    CHAR(195) + CHAR(167), NCHAR(231)),
                    CHAR(195) + CHAR(150), NCHAR(214)),
                    CHAR(195) + CHAR(182), NCHAR(246)),
                    CHAR(195) + CHAR(156), NCHAR(220)),
                    CHAR(195) + CHAR(188), NCHAR(252)),
                    
                    'OLAB' + CHAR(196) + CHAR(176) + 'L' + CHAR(196) + CHAR(176) + 'R', 'OLABİLİR'),
                    'B' + CHAR(196) + CHAR(176) + 'LG' + CHAR(196) + CHAR(176), 'BİLGİ')
WHERE Detay1 LIKE '%[' + CHAR(195) + CHAR(196) + CHAR(197) + ']%'
"@

$cmd1 = $conn.CreateCommand()
$cmd1.CommandText = $sqlCleanDetay1
$r1 = $cmd1.ExecuteNonQuery()

Write-Host "✅ Detay5 Column: Cleaned encoding in $r5 records." -ForegroundColor Green
Write-Host "✅ Detay1 Column: Cleaned encoding in $r1 records." -ForegroundColor Green

# Query leftover check for ANY table row having broken characters
$cmdCheckLeftover = $conn.CreateCommand()
$cmdCheckLeftover.CommandText = "SELECT COUNT(*) FROM Siparisler WHERE Detay5 LIKE '%[' + CHAR(195) + CHAR(196) + CHAR(197) + ']%' OR Detay1 LIKE '%[' + CHAR(195) + CHAR(196) + CHAR(197) + ']%'"
$leftoverCount = $cmdCheckLeftover.ExecuteScalar()

if ($leftoverCount -eq 0) {
    Write-Host "`n🎉 ZERO CORRUPTED RECORDS REMAINING! All order details and barcodes are 100% clean and intact!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️ Leftover corrupted records count: $leftoverCount" -ForegroundColor Red
}

# Print sample records across different brands (AUDI, SEAT, SKODA, PORSCHE, NISSAN, BMW, VW, MERCEDES)
Write-Host "`n⚡ Sample Verification Across Various Brands and Barcodes:" -ForegroundColor Yellow
$cmdSamples = $conn.CreateCommand()
$cmdSamples.CommandText = @"
SELECT TOP 20 s.Id, m.Adi as Musteri, s.Model, s.Detay5 
FROM Siparisler s 
LEFT JOIN Musteriler m ON s.MusteriId = m.Id 
WHERE s.Detay5 LIKE '%PARÇA NO%' 
ORDER BY s.Id DESC
"@
$adapterSamples = New-Object System.Data.SqlClient.SqlDataAdapter($cmdSamples)
$dtSamples = New-Object System.Data.DataTable
$adapterSamples.Fill($dtSamples) | Out-Null
$dtSamples | Format-Table -AutoSize

$conn.Close()
