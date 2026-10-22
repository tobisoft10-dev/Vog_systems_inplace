const { Pool } = require('pg');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  user: 'postgres',
  password: '150609%M',
  host: 'localhost',
  port: 5432,
  database: 'vog_db'
});

function queryMssqlJson(queryText) {
  const tmpFile = path.join(__dirname, `tmp_q_${Date.now()}_${Math.random().toString(36).substring(7)}.json`);
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
  const orders = queryMssqlJson(`
    SELECT 
      s.Id,
      s.Model,
      s.ParcaNo,
      s.Detay5,
      m.Adi AS Musteri,
      ISNULL(si.ToplamAdet, 0) AS ToplamAdet
    FROM [SIPARIS].[dbo].[Siparisler] s
    LEFT JOIN [SIPARIS].[dbo].[Musteriler] m ON s.MusteriId = m.Id
    LEFT JOIN (
      SELECT SiparisId, SUM(ISNULL(B01,0)+ISNULL(B02,0)+ISNULL(B03,0)+ISNULL(B04,0)+ISNULL(B05,0)+ISNULL(B06,0)+ISNULL(B07,0)+ISNULL(B08,0)+ISNULL(B09,0)+ISNULL(B10,0)+ISNULL(B11,0)+ISNULL(B12,0)+ISNULL(B13,0)+ISNULL(B14,0)) AS ToplamAdet
      FROM [SIPARIS].[dbo].[SiparisIslemleri]
      GROUP BY SiparisId
    ) si ON s.Id = si.SiparisId
    WHERE s.Id BETWEEN 16575 AND 16588
    ORDER BY s.Id
  `);
  console.log(`MSSQL Orders Count: ${orders.length}`);

  for (const o of orders) {
    const orderNo = String(o.Id);
    const model = o.Model || '';
    const parcaNo = o.ParcaNo || '';
    const notes = o.Detay5 || '';
    const qty = parseInt(o.ToplamAdet || 0, 10);
    const musteri = o.Musteri || 'NISSAN';
    const brand = orderNo === '16582' ? 'FORD' : 'NISSAN';

    const sampleBc = parcaNo.startsWith('ERKEK:') ? parcaNo.split(' - ')[0].replace('ERKEK: ', '').trim() : parcaNo;

    const existing = await pool.query('SELECT id FROM orders WHERE order_number = $1', [orderNo]);
    if (existing.rows.length > 0) {
      await pool.query(`
        UPDATE orders
        SET product_name = $1, sku = $2, code39 = $2, barcode = $3, ean13 = $3, notes = $4, quantity = $5, brand = $6, grup = $6, updated_at = NOW()
        WHERE order_number = $7
      `, [model, parcaNo, sampleBc, notes, qty, brand, orderNo]);
      console.log(`PG orders: Sipariş #${orderNo} güncellendi.`);
    } else {
      await pool.query(`
        INSERT INTO orders (
          order_number, product_name, sku, code39, barcode, ean13, brand, grup,
          quantity, processed_quantity, remaining_quantity, status, notes, dealer, sub_customer_name,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $3, $4, $4, $5, $5,
          $6, 0, $6, 'BEKLEMEDE', $7, $8, $8,
          NOW(), NOW()
        )
      `, [orderNo, model, parcaNo, sampleBc, brand, qty, notes, musteri]);
      console.log(`PG orders: Sipariş #${orderNo} eklendi.`);
    }
  }

  const pgRows = await pool.query(`
    SELECT order_number, brand, product_name, sku, quantity 
    FROM orders 
    WHERE order_number >= '16575' AND order_number <= '16588'
    ORDER BY order_number
  `);
  console.log(`\nPG Orders Verified: ${pgRows.rows.length}`);
  pgRows.rows.forEach(r => console.log(`${r.order_number} | ${r.sku} | ${r.quantity} | ${r.product_name}`));

  await pool.end();
}

run().catch(console.error);
