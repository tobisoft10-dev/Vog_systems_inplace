const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', password: '150609%M', host: 'localhost', port: 5432, database: 'vog_db' });

async function check() {
  const res = await pool.query("SELECT sku, barcode, ean13, size, clean_size, product_name FROM master_products WHERE sku IN ('PSKD100050XS', 'PSKD100051XS', 'PSKD200037XS')");
  console.log('Found:', res.rows);
  await pool.end();
}



check().catch(console.error);
