const { Pool } = require('pg');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: 'postgres',
  password: '150609%M',
  host: 'localhost',
  port: 5432,
  database: 'vog_db'
});

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

async function run() {
  const baseCodes = [
    'PSKD100025', 'PSKD100026', 'PSKD100041', 'PSKD100042', 'PSKD100052', 'PSKD100053',
    'PSKD100019', 'PSKD100056', 'PSKD100028', 'PSKD100036', 'PSKD100055', 'PSKD100054',
    'PSKD100050', 'PSKD100051',
    'PSKD200010', 'PSKD200032', 'PSKD200033', 'PSKD200034', 'PSKD200035', 'PSKD200019', 'PSKD200036',
    'PSKD200038', 'PSKD200039', 'PSKD200040'
  ];

  console.log('--- Checking Base Codes in MasterUrunler & master_products ---');
  for (const base of baseCodes) {
    const m = queryMssqlJson(`SELECT Id, ParcaNo, Barkod, UrunAdi, Beden, CleanBeden FROM [SIPARIS].[dbo].[MasterUrunler] WHERE ParcaNo = '${base}'`);
    const p = await pool.query(`SELECT id, sku, barcode, product_name, size, clean_size FROM master_products WHERE sku = $1`, [base]);
    console.log(`${base}: MSSQL=${m.length > 0 ? 'VAR (' + m[0].Barkod + ')' : 'YOK'}, PG=${p.rows.length > 0 ? 'VAR (' + p.rows[0].barcode + ')' : 'YOK'}`);
  }

  await pool.end();
}

run().catch(console.error);
