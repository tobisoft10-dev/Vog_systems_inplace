const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', password: '150609%M', host: 'localhost', port: 5432, database: 'vog_db' });

async function run() {
  const res = await pool.query(`SELECT id, sku, barcode, size, clean_size FROM master_products WHERE sku LIKE 'PSKD100026%' ORDER BY sku`);
  console.table(res.rows);
  await pool.end();
}
run();
