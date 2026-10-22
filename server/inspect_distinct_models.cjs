const { execSync } = require('child_process');
const fs = require('fs');

function q(sql) {
  const tmp = 'server/tmp_inspect_categories.json';
  const cleanSql = sql.replace(/\r?\n/g, ' ');
  execSync(`sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -d SIPARIS -f 65001 -w 65535 -y 0 -o "${tmp}" -Q "SET NOCOUNT ON; ${cleanSql} FOR JSON PATH"`, { stdio: 'pipe' });
  const raw = fs.readFileSync(tmp, 'utf8').trim();
  fs.unlinkSync(tmp);
  const sanitized = raw.replace(/[\u0000-\u001F]+/g, (m) => (m === '\r' || m === '\n' || m === '\t') ? ' ' : '');
  return JSON.parse(sanitized);
}

const orders = q(`
  SELECT s.Id, s.Model, s.ParcaNo, s.Detay5, s.[Not]
  FROM Siparisler s
  WHERE (
      s.Model LIKE '%SKODA%' 
      OR s.ParcaNo LIKE '%SKD%' 
      OR s.ParcaNo LIKE '%SKODA%'
      OR s.Detay5 LIKE '%SKD%'
      OR s.Detay5 LIKE '%SKODA%'
      OR s.[Not] LIKE '%PSKD%'
      OR s.[Not] LIKE '%PSKODA%'
    )
  ORDER BY s.Id DESC
`);

// Group by model pattern
const map = new Map();
orders.forEach(o => {
  const cleanM = (o.Model || '').trim();
  if (!map.has(cleanM)) {
    map.set(cleanM, { count: 0, sampleIds: [], sampleParcaNo: o.ParcaNo, sampleNot: o.Not });
  }
  const entry = map.get(cleanM);
  entry.count++;
  if (entry.sampleIds.length < 5) entry.sampleIds.push(o.Id);
});

console.log(`Farklı Model Sayısı: ${map.size}`);
for (const [model, info] of map.entries()) {
  console.log(`[${info.count} adet] "${model}" | Örnek ID'ler: ${info.sampleIds.join(', ')} | ParcaNo: "${info.sampleParcaNo}"`);
}
