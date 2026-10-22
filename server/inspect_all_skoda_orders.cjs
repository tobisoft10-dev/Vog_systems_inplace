const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function queryMssql(q) {
  const tmp = path.join(__dirname, `tmp_${Date.now()}.json`);
  execSync(`sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -d SIPARIS -f 65001 -w 65535 -y 0 -o "${tmp}" -Q "SET NOCOUNT ON; ${q.replace(/\r?\n/g, ' ')} FOR JSON PATH"`, { stdio: 'pipe' });
  let data = [];
  if (fs.existsSync(tmp)) {
    const raw = fs.readFileSync(tmp, 'utf8').trim();
    fs.unlinkSync(tmp);
    if (raw) {
      // sanitize unescaped newlines/tabs in string literals
      const sanitized = raw.replace(/[\u0000-\u001F]+/g, (match) => {
        if (match === '\r' || match === '\n' || match === '\t') return ' ';
        return '';
      });
      data = JSON.parse(sanitized);
    }
  }
  return data;
}

async function main() {
  const mssqlOrders = queryMssql(`
    SELECT s.Id, s.Model, s.ParcaNo, s.Detay5, m.Adi as Musteri, s.Zaman
    FROM Siparisler s
    LEFT JOIN Musteriler m ON s.MusteriId = m.Id
    WHERE s.Id IN (13959, 13929, 13734, 13733, 13732, 13731, 13730, 13729, 13550, 13493, 15877, 15878, 15879, 15880, 15881, 15882, 16686, 16687, 16688, 16689, 16690, 16691, 16692, 16693, 16694, 16695)
    ORDER BY s.Id DESC
  `);

  console.log('MSSQL Total Skoda matching orders:', mssqlOrders.length);
  mssqlOrders.forEach(o => {
    console.log(`[MSSQL] ID: ${o.Id} | Model: ${o.Model} | ParcaNo: ${o.ParcaNo} | Detay5: ${o.Detay5} | Musteri: ${o.Musteri} | Adet: ${o.ToplamAdet}`);
  });
}

main().catch(console.error);
