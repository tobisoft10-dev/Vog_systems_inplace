const { execSync } = require('child_process');
const fs = require('fs');

function q(sql) {
  const tmp = 'server/tmp_all_skoda_list.json';
  const cleanSql = sql.replace(/\r?\n/g, ' ');
  execSync(`sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -d SIPARIS -f 65001 -w 65535 -y 0 -o "${tmp}" -Q "SET NOCOUNT ON; ${cleanSql} FOR JSON PATH"`, { stdio: 'pipe' });
  const raw = fs.readFileSync(tmp, 'utf8').trim();
  fs.unlinkSync(tmp);
  const sanitized = raw.replace(/[\u0000-\u001F]+/g, (m) => (m === '\r' || m === '\n' || m === '\t') ? ' ' : '');
  return JSON.parse(sanitized);
}

const orders = q(`
  SELECT s.Id, s.Model, s.ParcaNo, s.Detay5, s.[Not], s.Detay1
  FROM Siparisler s
  WHERE s.Model LIKE '%SKODA%' 
     OR s.ParcaNo LIKE '%SKD%' 
     OR s.ParcaNo LIKE '%SKODA%'
     OR s.Detay5 LIKE '%SKD%'
     OR s.Detay5 LIKE '%SKODA%'
     OR s.[Not] LIKE '%PSKD%'
     OR s.[Not] LIKE '%PSKODA%'
  ORDER BY s.Id DESC
`);

console.log(`Bulunan Toplam Skoda Siparişi: ${orders.length}`);
orders.slice(0, 60).forEach(o => {
  console.log(`[${o.Id}] Mevcut ParcaNo: "${o.ParcaNo}" | Model: "${o.Model}" | Not: "${o.Not ? o.Not.replace(/\r?\n/g, ' ') : ''}"`);
});
