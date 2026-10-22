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
  const mssqlSkoda = queryMssqlJson(`
    SELECT ParcaNo, Barkod, Ean13, Code39, UrunAdi, Beden, CleanBeden, Cinsiyet, Marka, Grup
    FROM [SIPARIS].[dbo].[MasterUrunler]
    WHERE ParcaNo LIKE 'PSKD%' OR Marka = 'SKODA'
    ORDER BY ParcaNo
  `);
  console.log(`MSSQL Skoda Total Items: ${mssqlSkoda.length}`);

  const pgSkoda = await pool.query(`
    SELECT sku, barcode, ean13, code39, product_name, size, clean_size, gender, brand, grup
    FROM master_products
    WHERE sku LIKE 'PSKD%' OR brand = 'SKODA'
    ORDER BY sku
  `);
  console.log(`PG Skoda Total Items: ${pgSkoda.rows.length}`);

  // Distinct prefixes in MSSQL MasterUrunler
  const prefixes = {};
  mssqlSkoda.forEach(p => {
    const prefix = p.ParcaNo.replace(/[0-9]+[A-Z]+$/, '').replace(/[A-Z]+$/, '');
    const cleanPrefix = p.ParcaNo.match(/^PSKD\d{6}/) ? p.ParcaNo.match(/^PSKD\d{6}/)[0] : p.ParcaNo;
    prefixes[cleanPrefix] = (prefixes[cleanPrefix] || 0) + 1;
  });
  console.log('MSSQL Prefix Counts:', prefixes);

  // Check any null or empty or NaN
  const badMssql = mssqlSkoda.filter(p => !p.ParcaNo || !p.Barkod || p.Barkod.includes('NaN') || !p.CleanBeden);
  console.log('MSSQL Bad records count:', badMssql.length);
  if (badMssql.length > 0) console.log('Sample bad MSSQL:', badMssql.slice(0, 5));

  const badPg = pgSkoda.rows.filter(p => !p.sku || !p.barcode || p.barcode.includes('NaN') || !p.clean_size);
  console.log('PG Bad records count:', badPg.length);
  if (badPg.length > 0) console.log('Sample bad PG:', badPg.slice(0, 5));

  const v = await pool.query("SELECT COUNT(*) FROM vouchers WHERE brand = 'SKODA' OR sku LIKE 'PSKD%'");
  console.log('Vouchers Skoda count:', v.rows[0].count);
  const s = await pool.query("SELECT COUNT(*) FROM sales WHERE brand = 'SKODA' OR sku LIKE 'PSKD%'");
  console.log('Sales Skoda count:', s.rows[0].count);
  const r = await pool.query("SELECT COUNT(*) FROM rfid_tags WHERE brand = 'SKODA' OR sku LIKE 'PSKD%'");
  console.log('RFID tags Skoda count:', r.rows[0].count);

  await pool.end();
}

run().catch(console.error);
