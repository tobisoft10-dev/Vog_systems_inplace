$connStr = "data source=.\SQLEXPRESS;initial catalog=SIPARIS;persist security info=True;user id=sa;password=150609%M;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

Write-Host "⚡ AUDIT & CLEANUP: Order-Related Tables in MS SQL SIPARIS Database`n" -ForegroundColor Cyan

$tables = @("Siparisler", "SiparisDetaylari", "SiparisIslemleri", "SiparisDepartmanlari", "SiparisIslemPlanlari", "Teklifler", "TeklifDetaylari")

foreach ($tb in $tables) {
    # Get all nvarchar/varchar columns for this table
    $cmdCols = $conn.CreateCommand()
    $cmdCols.CommandText = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '$tb' AND DATA_TYPE IN ('nvarchar', 'varchar', 'text', 'ntext')"
    $adapterCols = New-Object System.Data.SqlClient.SqlDataAdapter($cmdCols)
    $dtCols = New-Object System.Data.DataTable
    $adapterCols.Fill($dtCols) | Out-Null

    Write-Host "Table [$tb] ($($dtCols.Rows.Count) text columns):" -ForegroundColor Yellow

    foreach ($rCol in $dtCols.Rows) {
        $col = $rCol["COLUMN_NAME"]

        $sqlClean = @"
UPDATE [$tb]
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
WHERE [$col] LIKE '%[' + CHAR(195) + CHAR(196) + CHAR(197) + ']%'
"@

        try {
            $cmdClean = $conn.CreateCommand()
            $cmdClean.CommandText = $sqlClean
            $rows = $cmdClean.ExecuteNonQuery()
            if ($rows -gt 0) {
                Write-Host "  ✅ Column [$col]: Cleaned $rows records!" -ForegroundColor Green
            } else {
                Write-Host "  • Column [$col]: Clean (0 corrupt records)" -ForegroundColor DarkGray
            }
        } catch {
            Write-Host "  ⚠️ Column [$col]: Query skipped ($($_.Exception.Message))" -ForegroundColor Red
        }
    }
    Write-Host ""
}

Write-Host "🎉 ORDER TABLES AUDIT COMPLETE!" -ForegroundColor Green
$conn.Close()
