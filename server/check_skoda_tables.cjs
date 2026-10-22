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
  console.log('=== MSSQL Siparisler (SKODA 16686-16695 & 15877-15882) ===');
  const mOrders = queryMssqlJson(`
    SELECT s.Id, s.Model, s.ParcaNo, s.Detay5, (
      SELECT SUM(ISNULL(B01,0)+ISNULL(B02,0)+ISNULL(B03,0)+ISNULL(B04,0)+ISNULL(B05,0)+ISNULL(B06,0)+ISNULL(B07,0)+ISNULL(B08,0)+ISNULL(B09,0)+ISNULL(B10,0)+ISNULL(B11,0)+ISNULL(B12,0)+ISNULL(B13,0)+ISNULL(B14,0))
      FROM [SIPARIS].[dbo].[SiparisIslemleri]
      WHERE SiparisId = s.Id
    ) AS ToplamAdet
    FROM [SIPARIS].[dbo].[Siparisler] s
    WHERE s.Id BETWEEN 16686 AND 16695 OR s.Id BETWEEN 15877 AND 15882
    ORDER BY s.Id DESC
  `);
  console.table(mOrders);

  console.log('\n=== PG orders (SKODA 16686-16695 & 15877-15882) ===');
  const pgOrders = await pool.query("SELECT order_number, brand, product_name, sku, code39, barcode FROM orders WHERE order_number::int BETWEEN 16686 AND 16695 OR order_number::int BETWEEN 15877 AND 15882 ORDER BY order_number::int DESC");
  console.table(pgOrders.rows);

  console.log('\n=== Master Products Count ===');
  const pgMpCount = await pool.query("SELECT COUNT(*) FROM master_products WHERE brand = 'SKODA' OR sku LIKE 'PSKD%'");
  console.log('PG master_products Skoda sayısı:', pgMpCount.rows[0].count);

  const mssqlMpCount = queryMssqlJson("SELECT COUNT(*) as cnt FROM [SIPARIS].[dbo].[MasterUrunler] WHERE Marka = 'SKODA' OR ParcaNo LIKE 'PSKD%'");
  console.log('MSSQL MasterUrunler Skoda sayısı:', mssqlMpCount[0] ? mssqlMpCount[0].cnt : 0);

  // Sample MasterUrunler
  const sampleMp = queryMssqlJson("SELECT TOP 10 Id, ParcaNo, Barkod, UrunAdi, Beden, CleanBeden, Code39 FROM [SIPARIS].[dbo].[MasterUrunler] WHERE ParcaNo LIKE 'PSKD%' ORDER BY Id");
  console.log('\nMSSQL MasterUrunler Örnekleri:');
  console.table(sampleMp);

  await pool.end();
}

run().catch(console.error);
