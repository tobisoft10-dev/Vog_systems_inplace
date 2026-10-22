const { execSync } = require('child_process');
const fs = require('fs');

function q(sql) {
  const tmp = 'server/tmp_inspect_exact.json';
  const cleanSql = sql.replace(/\r?\n/g, ' ');
  execSync(`sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -d SIPARIS -f 65001 -w 65535 -y 0 -o "${tmp}" -Q "SET NOCOUNT ON; ${cleanSql} FOR JSON PATH"`, { stdio: 'pipe' });
  const raw = fs.readFileSync(tmp, 'utf8').trim();
  fs.unlinkSync(tmp);
  // remove unescaped newlines/tabs inside strings
  const sanitized = raw.replace(/[\u0000-\u001F]+/g, (m) => (m === '\r' || m === '\n' || m === '\t') ? ' ' : '');
  return JSON.parse(sanitized);
}

const targetIds = [13959, 13929, 13734, 13733, 13732, 13731, 13730, 13729, 13550, 13493];
const orders = q(`
  SELECT s.Id, s.Model, s.ParcaNo, s.Detay1, s.Detay2, s.Detay5, s.[Not], m.Adi as Musteri, s.Zaman
  FROM Siparisler s
  LEFT JOIN Musteriler m ON s.MusteriId = m.Id
  WHERE s.Id IN (${targetIds.join(',')})
  ORDER BY s.Id DESC
`);

console.log('Exact orders in user screenshot:');
orders.forEach(o => {
  console.log(`ID: ${o.Id}`);
  console.log(`  Model:   ${o.Model}`);
  console.log(`  ParcaNo: ${o.ParcaNo}`);
  console.log(`  Detay5:  ${o.Detay5}`);
  console.log(`  Detay1:  ${o.Detay1}`);
  console.log(`  Detay2:  ${o.Detay2}`);
  console.log(`  Not:     ${o.Not}`);
  console.log('----------------------------------------------------');
});
