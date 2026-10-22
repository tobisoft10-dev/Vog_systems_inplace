const XLSX = require('xlsx');
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
  const skodaOrders = queryMssqlJson(`
    SELECT 
      s.Id,
      s.Model,
      s.ParcaNo,
      s.Detay5,
      (
        SELECT SUM(ISNULL(B01,0)+ISNULL(B02,0)+ISNULL(B03,0)+ISNULL(B04,0)+ISNULL(B05,0)+ISNULL(B06,0)+ISNULL(B07,0)+ISNULL(B08,0)+ISNULL(B09,0)+ISNULL(B10,0)+ISNULL(B11,0)+ISNULL(B12,0)+ISNULL(B13,0)+ISNULL(B14,0))
        FROM [SIPARIS].[dbo].[SiparisIslemleri]
        WHERE SiparisId = s.Id
      ) AS ToplamAdet
    FROM [SIPARIS].[dbo].[Siparisler] s
    WHERE s.Id BETWEEN 16686 AND 16695 OR s.Id BETWEEN 15877 AND 15882 OR s.Id BETWEEN 16226 AND 16229
    ORDER BY s.Id DESC
  `);

  console.log('--- Current MSSQL Skoda Orders ---');
  for (const o of skodaOrders) {
    console.log(`Order #${o.Id} | Adet: ${o.ToplamAdet}`);
    console.log(`  Model  : ${o.Model}`);
    console.log(`  ParcaNo: ${o.ParcaNo}`);
    console.log(`  Detay5 : ${o.Detay5}`);
  }

  console.log('\n--- Current PG Skoda Orders ---');
  const pgOrders = await pool.query(`
    SELECT order_number, product_name, sku, code39, barcode, notes, quantity
    FROM orders
    WHERE order_number::int BETWEEN 16686 AND 16695 OR order_number::int BETWEEN 15877 AND 15882 OR order_number::int BETWEEN 16226 AND 16229
    ORDER BY order_number::int DESC
  `);
  for (const o of pgOrders.rows) {
    console.log(`Order #${o.order_number} | Adet: ${o.quantity}`);
    console.log(`  Model  : ${o.product_name}`);
    console.log(`  SKU    : ${o.sku}`);
    console.log(`  Code39 : ${o.code39}`);
    console.log(`  Barcode: ${o.barcode}`);
  }

  await pool.end();
}

run().catch(console.error);
