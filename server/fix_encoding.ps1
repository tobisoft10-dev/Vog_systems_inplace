$connStr = "data source=.\SQLEXPRESS;initial catalog=SIPARIS;persist security info=True;user id=sa;password=150609%M;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

Write-Host "⚡ Fetching Siparisler records with corrupted Turkish characters..." -ForegroundColor Cyan

$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT Id, Detay5 FROM Siparisler WHERE Detay5 LIKE '%Ã%' OR Detay5 LIKE '%Ä%' OR Detay5 LIKE '%Å%'"
$adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
$dt = New-Object System.Data.DataTable
$adapter.Fill($dt) | Out-Null

Write-Host "Found $($dt.Rows.Count) records in Detay5." -ForegroundColor Yellow

$updatedCount = 0

foreach ($row in $dt.Rows) {
    $id = $row["Id"]
    $orig = $row["Detay5"]

    $fixed = $orig
    $fixed = $fixed -replace "PARÃ‡A", "PARÇA"
    $fixed = $fixed -replace "PARÃ\u0087A", "PARÇA"
    $fixed = $fixed -replace "DAÃ„ÂžITIMI", "DAĞITIMI"
    $fixed = $fixed -replace "DAÄžITIMI", "DAĞITIMI"
    $fixed = $fixed -replace "BAYÃ„Â°", "BAYİ"
    $fixed = $fixed -replace "BAYÄ°", "BAYİ"
    $fixed = $fixed -replace "BÃ–LGE", "BÖLGE"
    $fixed = $fixed -replace "Ã‡", "Ç"
    $fixed = $fixed -replace "Ã§", "ç"
    $fixed = $fixed -replace "Äž", "Ğ"
    $fixed = $fixed -replace "ÄŸ", "ğ"
    $fixed = $fixed -replace "Ä°", "İ"
    $fixed = $fixed -replace "Ä±", "ı"
    $fixed = $fixed -replace "Ã–", "Ö"
    $fixed = $fixed -replace "Ã¶", "ö"
    $fixed = $fixed -replace "Åž", "Ş"
    $fixed = $fixed -replace "ÅŸ", "ş"
    $fixed = $fixed -replace "Ãœ", "Ü"
    $fixed = $fixed -replace "Ã¼", "ü"

    if ($fixed -ne $orig) {
        Write-Host "ID $id :" -ForegroundColor Gray
        Write-Host "  BEFORE: $orig" -ForegroundColor Red
        Write-Host "  AFTER : $fixed" -ForegroundColor Green

        $updateCmd = $conn.CreateCommand()
        $updateCmd.CommandText = "UPDATE Siparisler SET Detay5 = @d5 WHERE Id = @id"
        $updateCmd.Parameters.AddWithValue("@d5", $fixed) | Out-Null
        $updateCmd.Parameters.AddWithValue("@id", $id) | Out-Null
        $updateCmd.ExecuteNonQuery() | Out-Null
        $updatedCount++
    }
}

Write-Host "`n🎉 SUCCESS! Updated $updatedCount records in MS SQL Siparisler Detay5 column with clean Turkish characters." -ForegroundColor Green

$conn.Close()
