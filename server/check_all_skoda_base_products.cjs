const { Pool } = require('pg');
const { execSync } = require('child_process');
const fs = require('fs');

const pool = new Pool({
  user: 'postgres',
  password: '150609%M',
  host: 'localhost',
  port: 5432,
  database: 'vog_db'
});

function q(sql) {
  const tmp = 'server/tmp_chk_mp.json';
  const cleanSql = sql.replace(/\r?\n/g, ' ');
  execSync(`sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -d SIPARIS -f 65001 -w 65535 -y 0 -o "${tmp}" -Q "SET NOCOUNT ON; ${cleanSql} FOR JSON PATH"`, { stdio: 'pipe' });
  const raw = fs.readFileSync(tmp, 'utf8').trim();
  fs.unlinkSync(tmp);
  const sanitized = raw.replace(/[\u0000-\u001F]+/g, (m) => (m === '\r' || m === '\n' || m === '\t') ? ' ' : '');
  return JSON.parse(sanitized);
}

async function run() {
  const mssqlRes = q(`
    SELECT ParcaNo, UrunAdi, Beden, Barkod
    FROM MasterUrunler
    WHERE ParcaNo LIKE 'PSKD%'
      AND (Beden = 'STD' OR Beden = 'Standart' OR Beden IS NULL)
    ORDER BY ParcaNo
  `);
  console.log(`MSSQL Base Products count: ${mssqlRes.length}`);
  mssqlRes.forEach(r => console.log(`  [MSSQL] ${r.ParcaNo} -> ${r.UrunAdi}`));

  const pgRes = await pool.query(`
    SELECT sku, product_name, size, clean_size, barcode
    FROM master_products
    WHERE sku LIKE 'PSKD%'
      AND (clean_size = 'STD' OR size = 'Standart')
    ORDER BY sku
  `);
  console.log(`\nPG Base Products count: ${pgRes.rows.length}`);
  pgRes.rows.forEach(r => console.log(`  [PG] ${r.sku} -> ${r.product_name}`));

  await pool.end();
}

run().catch(console.error);
