Add-Type -AssemblyName System.Windows.Forms

# 1. Fetch PostgreSQL master_products
$pgScript = @"
const { Client } = require('pg');
const fs = require('fs');

async function main() {
    const client = new Client({ host: 'localhost', port: 5432, user: 'postgres', password: '1', database: 'vog_db' });
    await client.connect();
    const res = await client.query("SELECT id, sku, brand, product_name, size, barcode, code39 FROM master_products WHERE brand ILIKE '%NISSAN%' ORDER BY product_name, size");
    fs.writeFileSync('c:/vog_system/server/pg_master_nissan.json', JSON.stringify(res.rows, null, 2), 'utf8');
    await client.end();
}
main();
"@
Set-Content -Path "c:\vog_system\server\export_pg_master.cjs" -Value $pgScript -Encoding UTF8
node "c:\vog_system\server\export_pg_master.cjs"

# 2. Query MS SQL Siparisler
$connStr = "data source=.\SQLEXPRESS;initial catalog=SIPARIS;persist security info=True;user id=sa;password=150609%M;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT s.Id, s.Model, s.Detay1, s.Detay5, m.Adi as MusteriAdi FROM Siparisler s LEFT JOIN Musteriler m ON s.MusteriId = m.Id WHERE m.Adi LIKE '%NISSAN%' OR s.Model LIKE '%NISSAN%' ORDER BY s.Id DESC"
$adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
$dt = New-Object System.Data.DataTable
$adapter.Fill($dt) | Out-Null
$conn.Close()

# Save MS SQL result as JSON
$sipList = @()
foreach ($row in $dt.Rows) {
    $sipList += @{
        Id = $row["Id"]
        Model = $row["Model"]
        Detay1 = $row["Detay1"]
        Detay5 = $row["Detay5"]
        Musteri = $row["MusteriAdi"]
    }
}
$sipList | ConvertTo-Json -Depth 3 | Set-Content -Path "c:\vog_system\server\mssql_siparis_nissan.json" -Encoding UTF8

Write-Host "⚡ Analyzing cross-references between PostgreSQL master_products and MS SQL Siparisler..." -ForegroundColor Cyan

# 3. Analyze and compare
$pgMaster = Get-Content -Path "c:\vog_system\server\pg_master_nissan.json" | ConvertFrom-Json
$mssqlSip = Get-Content -Path "c:\vog_system\server\mssql_siparis_nissan.json" | ConvertFrom-Json

Write-Host "`n=== PostgreSQL NISSAN Master Product Categories & Barcode Ranges (${($pgMaster.Count)} items) ===" -ForegroundColor Yellow

$grouped = $pgMaster | Group-Object -Property product_name
foreach ($g in $grouped) {
    $sizes = ($g.Group | ForEach-Object { "$($_.size): $($_.code39)" }) -join " | "
    Write-Host "• $($g.Name) ($($g.Count) sizes): $sizes"
}

Write-Host "`n=== Sample MS SQL NISSAN Orders & Matching Barcode Analysis (Total Orders: ${($mssqlSip.Count)}) ===" -ForegroundColor Yellow

$results = @()
foreach ($sip in $mssqlSip) {
    $d5 = if ($sip.Detay5) { $sip.Detay5.Trim() } else { "" }
    $matchedProds = $pgMaster | Where-Object { $d5.Contains($_.code39) -or $d5.Contains($_.barcode) }
    
    $results += [PSCustomObject]@{
        Id = $sip.Id
        Model = $sip.Model
        Detay5 = if ($d5.Length -gt 35) { $d5.Substring(0,35) + "..." } else { $d5 }
        MatchCount = $matchedProds.Count
        MatchedProductAndBarcode = ($matchedProds | ForEach-Object { "$($_.product_name) [$($_.code39)]" }) -join "; "
    }
}

$results | Select-Object -First 25 | Format-Table -AutoSize
