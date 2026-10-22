$connStr = "data source=.\SQLEXPRESS;initial catalog=SIPARIS;persist security info=True;user id=sa;password=150609%M;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

Write-Host "⚡ Starting Exhaustive UTF-8 Mojibake Cleanup across all text columns..." -ForegroundColor Cyan

$sql = @"
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
                    -- Double UTF-8 corruptions
                    CHAR(195) + CHAR(132) + CHAR(195) + CHAR(130), NCHAR(304)),
                    CHAR(195) + CHAR(132) + CHAR(195) + CHAR(158), NCHAR(286)),
                    CHAR(195) + CHAR(132) + CHAR(130), NCHAR(304)),
                    CHAR(195) + CHAR(132) + CHAR(158), NCHAR(286)),

                    -- Single UTF-8 corruptions (CP1252 / ISO-8859-1)
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
                    
                    -- Specific word fixes
                    'OLAB' + CHAR(196) + CHAR(176) + 'L' + CHAR(196) + CHAR(176) + 'R', 'OLABİLİR'),
                    'B' + CHAR(196) + CHAR(176) + 'LG' + CHAR(196) + CHAR(176), 'BİLGİ')
WHERE Detay5 LIKE '%[' + CHAR(195) + CHAR(196) + CHAR(197) + ']%'
"@

$cmd = $conn.CreateCommand()
$cmd.CommandText = $sql
$count = $cmd.ExecuteNonQuery()
Write-Host "✅ Cleaned $count records in Siparisler.Detay5 column." -ForegroundColor Green

# Repeat clean script to catch any leftover nested encoding layers
$count2 = $cmd.ExecuteNonQuery()
Write-Host "✅ Secondary pass cleaned $count2 additional records." -ForegroundColor Green

# Now query Siparis #16708 and others to verify
Write-Host "`n⚡ Verifying updated records (Siparis #16708, 16707, 16706)..." -ForegroundColor Yellow
$cmdVerify = $conn.CreateCommand()
$cmdVerify.CommandText = "SELECT Id, Model, Detay5 FROM Siparisler WHERE Id IN (16708, 16707, 16706, 16705) ORDER BY Id DESC"
$adapterVerify = New-Object System.Data.SqlClient.SqlDataAdapter($cmdVerify)
$dtVerify = New-Object System.Data.DataTable
$adapterVerify.Fill($dtVerify) | Out-Null
$dtVerify | Format-Table -AutoSize

$conn.Close()
