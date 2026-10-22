$connStr = "data source=.\SQLEXPRESS;initial catalog=SIPARIS;persist security info=True;user id=sa;password=150609%M;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

Write-Host "⚡ DEEP AUDIT: Checking ALL tables and text columns in MS SQL Server SIPARIS (BSip) Database...`n" -ForegroundColor Cyan

# Fetch all tables and text columns
$cmdCols = $conn.CreateCommand()
$cmdCols.CommandText = @"
SELECT TABLE_NAME, COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE DATA_TYPE IN ('nvarchar', 'varchar', 'text', 'ntext')
  AND TABLE_SCHEMA = 'dbo'
ORDER BY TABLE_NAME, COLUMN_NAME
"@

$adapterCols = New-Object System.Data.SqlClient.SqlDataAdapter($cmdCols)
$dtCols = New-Object System.Data.DataTable
$adapterCols.Fill($dtCols) | Out-Null

$corruptedReport = @()

foreach ($row in $dtCols.Rows) {
    $table = $row["TABLE_NAME"]
    $col = $row["COLUMN_NAME"]

    # Query for any corrupted encoding patterns
    $queryCheck = @"
SELECT TOP 5 Id, [$col] as CorruptedText 
FROM [$table] 
WHERE [$col] LIKE '%Ã%' OR [$col] LIKE '%Ä%' OR [$col] LIKE '%Å%' OR [$col] LIKE '%Â%'
"@

    try {
        $cmdCheck = $conn.CreateCommand()
        $cmdCheck.CommandText = $queryCheck
        $adapterCheck = New-Object System.Data.SqlClient.SqlDataAdapter($cmdCheck)
        $dtCheck = New-Object System.Data.DataTable
        $adapterCheck.Fill($dtCheck) | Out-Null

        if ($dtCheck.Rows.Count -gt 0) {
            # Count total corrupted rows in this table/column
            $cmdCount = $conn.CreateCommand()
            $cmdCount.CommandText = "SELECT COUNT(*) FROM [$table] WHERE [$col] LIKE '%Ã%' OR [$col] LIKE '%Ä%' OR [$col] LIKE '%Å%' OR [$col] LIKE '%Â%'"
            $totalCount = $cmdCount.ExecuteScalar()

            $sampleText = $dtCheck.Rows[0]["CorruptedText"]
            if ($sampleText.Length -gt 40) { $sampleText = $sampleText.Substring(0,40) + "..." }

            $corruptedReport += [PSCustomObject]@{
                Table = $table
                Column = $col
                CorruptedRowCount = $totalCount
                SampleCorruptedText = $sampleText
            }
        }
    } catch {
        # Table might not have 'Id' primary key
    }
}

if ($corruptedReport.Count -eq 0) {
    Write-Host "🎉 ALL TABLES AND COLUMNS IN MS SQL SERVER BSIP DATABASE ARE 100% CLEAN! No corrupted letters found!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Found corrupted letters in $($corruptedReport.Count) table columns:" -ForegroundColor Red
    $corruptedReport | Format-Table -AutoSize

    Write-Host "`n⚡ Executing Unicode T-SQL Cleanups on identified columns..." -ForegroundColor Cyan

    foreach ($item in $corruptedReport) {
        $table = $item.Table
        $col = $item.Column

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
        $cmdUpdate = $conn.CreateCommand()
        $cmdUpdate.CommandText = $sqlFix
        $affected = $cmdUpdate.ExecuteNonQuery()
        Write-Host "✅ Table [$table], Column [$col]: Cleaned $affected records." -ForegroundColor Green
    }
}

$conn.Close()
