$connStr = "data source=.\SQLEXPRESS;initial catalog=SIPARIS;persist security info=True;user id=sa;password=150609%M;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

Write-Host "⚡ Scanning ALL tables in MS SQL SIPARIS database for Turkish encoding issues..." -ForegroundColor Cyan

# Find all varchar and nvarchar columns in all tables
$cmdCols = $conn.CreateCommand()
$cmdCols.CommandText = @"
SELECT TABLE_NAME, COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE DATA_TYPE IN ('nvarchar', 'varchar', 'text', 'ntext')
  AND TABLE_SCHEMA = 'dbo'
"@

$adapterCols = New-Object System.Data.SqlClient.SqlDataAdapter($cmdCols)
$dtCols = New-Object System.Data.DataTable
$adapterCols.Fill($dtCols) | Out-Null

Write-Host "Found $($dtCols.Rows.Count) text columns across tables.`n" -ForegroundColor Yellow

$totalUpdatedTables = 0
$totalUpdatedRows = 0

foreach ($row in $dtCols.Rows) {
    $table = $row["TABLE_NAME"]
    $col = $row["COLUMN_NAME"]

    # Build T-SQL update to replace all known Mojibake characters
    $sqlFix = @"
UPDATE [$table]
SET [$col] = REPLACE(
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
                REPLACE([$col],
                    CHAR(195) + CHAR(132) + CHAR(195) + CHAR(130), NCHAR(304)),
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
WHERE [$col] LIKE '%[' + CHAR(195) + CHAR(196) + CHAR(197) + ']%'
"@

    try {
        $cmdUpdate = $conn.CreateCommand()
        $cmdUpdate.CommandText = $sqlFix
        $affected = $cmdUpdate.ExecuteNonQuery()
        if ($affected -gt 0) {
            Write-Host "✅ Table [$table], Column [$col]: Cleaned $affected records." -ForegroundColor Green
            $totalUpdatedRows += $affected
            $totalUpdatedTables++
        }
    } catch {
        # Ignore non-updatable views or columns if any
    }
}

Write-Host "`n🎉 MS SQL CLEANUP SUMMARY: Fixed $totalUpdatedRows records across $totalUpdatedTables table columns!" -ForegroundColor Green

$conn.Close()
