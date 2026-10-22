const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', password: '150609%M', host: 'localhost', port: 5432, database: 'vog_db' });

async function run() {
  const res = await pool.query(`
    SELECT sku, barcode, size, clean_size 
    FROM master_products 
    WHERE sku IN ('PSKD100025', 'PSKD100026', 'PSKD100041', 'PSKD100042', 'PSKD100052', 'PSKD100053', 'PSKD100019', 'PSKD100056', 'PSKD100028', 'PSKD100036', 'PSKD100055', 'PSKD100054', 'PSKD100050', 'PSKD100051', 'PSKD200010', 'PSKD200032', 'PSKD200033', 'PSKD200034', 'PSKD200035', 'PSKD200019', 'PSKD200036', 'PSKD200038', 'PSKD200039', 'PSKD200040')
    ORDER BY sku
  `);
  console.table(res.rows);
  await pool.end();
}
run();
