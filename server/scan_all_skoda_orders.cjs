const { execSync } = require('child_process');
const fs = require('fs');

function q(sql) {
  const tmp = 'server/tmp_all_skoda_scan.json';
  const cleanSql = sql.replace(/\r?\n/g, ' ');
  execSync(`sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -d SIPARIS -f 65001 -w 65535 -y 0 -o "${tmp}" -Q "SET NOCOUNT ON; ${cleanSql} FOR JSON PATH"`, { stdio: 'pipe' });
  const raw = fs.readFileSync(tmp, 'utf8').trim();
  fs.unlinkSync(tmp);
  const sanitized = raw.replace(/[\u0000-\u001F]+/g, (m) => (m === '\r' || m === '\n' || m === '\t') ? ' ' : '');
  return JSON.parse(sanitized);
}

const allOrders = q(`
  SELECT s.Id, s.Model, s.ParcaNo, s.Detay5, s.[Not], m.Adi as Musteri, s.Zaman
  FROM Siparisler s
  LEFT JOIN Musteriler m ON s.MusteriId = m.Id
  WHERE s.Model LIKE '%SKODA%' 
     OR s.ParcaNo LIKE '%SKD%' 
     OR s.ParcaNo LIKE '%SKODA%'
     OR s.Detay5 LIKE '%SKD%'
     OR s.Detay5 LIKE '%SKODA%'
     OR s.[Not] LIKE '%PSKD%'
     OR s.[Not] LIKE '%PSKODA%'
  ORDER BY s.Id DESC
`);

console.log(`Total Skoda orders in MSSQL: ${allOrders.length}`);
allOrders.forEach(o => {
  console.log(`ID: ${o.Id} | Model: ${o.Model} | ParcaNo: ${o.ParcaNo} | Detay5: ${o.Detay5} | Not: ${o.Not ? o.Not.replace(/\n/g, ' ') : ''}`);
});
