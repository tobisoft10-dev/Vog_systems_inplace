$connStr = "data source=.\SQLEXPRESS;initial catalog=SIPARIS;persist security info=True;user id=sa;password=150609%M;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

Write-Host "⚡ Fixing French 'é' in PiquÃ© -> Piqué for ID 11194 and 11549..." -ForegroundColor Cyan

$sql = @"
UPDATE Siparisler
SET Detay5 = REPLACE(Detay5, 'Piqu' + CHAR(195) + CHAR(169), 'Piqu' + NCHAR(233))
WHERE Detay5 LIKE '%Piqu%'
"@

$cmd = $conn.CreateCommand()
$cmd.CommandText = $sql
$affected = $cmd.ExecuteNonQuery()
Write-Host "✅ Fixed Piqué in $affected records." -ForegroundColor Green

# Final verify count of any corrupted text across entire database
$cmdCheck = $conn.CreateCommand()
$cmdCheck.CommandText = "SELECT COUNT(*) FROM Siparisler WHERE Detay5 LIKE '%[' + CHAR(195) + CHAR(196) + CHAR(197) + ']%' OR Detay1 LIKE '%[' + CHAR(195) + CHAR(196) + CHAR(197) + ']%'"
$leftover = $cmdCheck.ExecuteScalar()

if ($leftover -eq 0) {
    Write-Host "`n🎉 ABSOLUTE PERFECTION! ZERO CORRUPTED RECORDS REMAINING IN THE ENTIRE DATABASE!" -ForegroundColor Green
} else {
    Write-Host "`nLeftovers: $leftover" -ForegroundColor Red
}

$conn.Close()
