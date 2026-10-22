$connStr = "data source=.\SQLEXPRESS;initial catalog=SIPARIS;persist security info=True;user id=sa;password=150609%M;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

Write-Host "⚡ Connecting to MS SQL Server..." -ForegroundColor Cyan

# Fetch all Detay5 records
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT Id, Detay5 FROM Siparisler WHERE Detay5 IS NOT NULL AND Detay5 <> ''"
$adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
$dt = New-Object System.Data.DataTable
$adapter.Fill($dt) | Out-Null

Write-Host "Scanning $($dt.Rows.Count) records..." -ForegroundColor Yellow

$updatedCount = 0

foreach ($row in $dt.Rows) {
    $id = $row["Id"]
    $orig = $row["Detay5"]

    $d5 = $orig

    # Fix corrupted words using Unicode NCHAR replacement
    $d5 = $d5 -replace "DAÃ„ÂžITIMI", "DAĞITIMI"
    $d5 = $d5 -replace "DAÄžITIMI", "DAĞITIMI"
    $d5 = $d5 -replace "BAYÃ„Â°", "BAYİ"
    $d5 = $d5 -replace "BAYÄ°", "BAYİ"
    $d5 = $d5 -replace "OLABÄ°LÄ°R", "OLABİLİR"
    $d5 = $d5 -replace "BÄ°LGÄ°", "BİLGİ"
    $d5 = $d5 -replace "PARÃ‡A", "PARÇA"

    # Add PARÇA NO: prefix to 12-digit NISSAN barcodes (90xxxxxxxxxx) if missing
    if ($d5 -match "(90\d{10})") {
        $code = $Matches[1]
        if (-not ($d5.Contains("PARÇA NO: $code") -or $d5.Contains("PARÇA NO:$code"))) {
            $d5 = $d5 -replace $code, "PARÇA NO: $code"
        }
    }

    if ($d5 -ne $orig) {
        Write-Host "ID $id :" -ForegroundColor Gray
        Write-Host "  BEFORE: $orig" -ForegroundColor Red
        Write-Host "  AFTER : $d5" -ForegroundColor Green

        $updateCmd = $conn.CreateCommand()
        $updateCmd.CommandText = "UPDATE Siparisler SET Detay5 = @d5 WHERE Id = @id"
        $updateCmd.Parameters.AddWithValue("@d5", $d5) | Out-Null
        $updateCmd.Parameters.AddWithValue("@id", $id) | Out-Null
        $updateCmd.ExecuteNonQuery() | Out-Null
        $updatedCount++
    }
}

Write-Host "`n🎉 SUCCESS! Fixed encoding and formatting in $updatedCount records." -ForegroundColor Green

$conn.Close()
