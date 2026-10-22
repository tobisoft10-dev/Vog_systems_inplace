const { execSync } = require('child_process');
const fs = require('fs');

function q(sql) {
  const tmp = 'server/tmp_q3.json';
  const cleanSql = sql.replace(/\r?\n/g, ' ');
  execSync(`sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -d SIPARIS -f 65001 -w 65535 -y 0 -o "${tmp}" -Q "SET NOCOUNT ON; ${cleanSql} FOR JSON PATH"`, { stdio: 'pipe' });
  const raw = fs.readFileSync(tmp, 'utf8').trim();
  fs.unlinkSync(tmp);
  return JSON.parse(raw);
}

const res = q(`
  SELECT s.Id, s.Model, s.ParcaNo, i.Adi as IslemAdi, s.IslemId
  FROM Siparisler s
  LEFT JOIN Islemler i ON s.IslemId = i.Id
  WHERE s.Id IN (16695, 16694, 16693, 16692, 16691, 16690, 16689, 16688, 16687, 16686, 15882, 15881, 15880, 15879, 15878, 15877, 13959, 13929, 13734, 13733, 13732, 13731, 13730, 13729)
  ORDER BY s.Id DESC
`);

console.table(res);
