const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function queryMssqlJson(queryText) {
  const tmpFile = path.join(__dirname, `tmp_sk_${Date.now()}.json`);
  const cleanQuery = queryText.replace(/\r?\n/g, ' ');
  const cmd = `sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -f 65001 -w 65535 -y 0 -o "${tmpFile}" -Q "SET NOCOUNT ON; ${cleanQuery} FOR JSON PATH"`;
  try {
    execSync(cmd, { stdio: 'pipe', windowsHide: true, maxBuffer: 50 * 1024 * 1024 });
    if (fs.existsSync(tmpFile)) {
      const raw = fs.readFileSync(tmpFile, 'utf8');
      try { fs.unlinkSync(tmpFile); } catch (e) { }
      const jsonStr = raw.split(/\r?\n/).map(l => l.trim()).join('');
      if (jsonStr) return JSON.parse(jsonStr);
    }
  } catch (err) {
    console.error('MSSQL JSON Query Error:', err.message);
  }
  return [];
}

const allSkodaOrders = queryMssqlJson(`
  SELECT 
    s.Id,
    s.Zaman,
    s.Model,
    s.ParcaNo,
    s.Detay5,
    m.Adi AS Musteri,
    (
      SELECT SUM(ISNULL(B01,0)+ISNULL(B02,0)+ISNULL(B03,0)+ISNULL(B04,0)+ISNULL(B05,0)+ISNULL(B06,0)+ISNULL(B07,0)+ISNULL(B08,0)+ISNULL(B09,0)+ISNULL(B10,0)+ISNULL(B11,0)+ISNULL(B12,0)+ISNULL(B13,0)+ISNULL(B14,0))
      FROM [SIPARIS].[dbo].[SiparisIslemleri]
      WHERE SiparisId = s.Id
    ) AS ToplamAdet
  FROM [SIPARIS].[dbo].[Siparisler] s
  LEFT JOIN [SIPARIS].[dbo].[Musteriler] m ON s.MusteriId = m.Id
  WHERE s.Model LIKE '%SKODA%' OR s.ParcaNo LIKE '%PSKD%' OR s.ParcaNo LIKE '%PSKODA%' OR m.Adi LIKE '%SKODA%'
  ORDER BY s.Id DESC
`);

console.log(`Total Skoda Orders Found: ${allSkodaOrders.length}`);
console.log('Recent 30 Skoda Orders:');
console.table(allSkodaOrders.slice(0, 30));
