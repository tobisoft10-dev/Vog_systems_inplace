const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', password: '150609%M', host: 'localhost', port: 5432, database: 'vog_db' });

async function run() {
  const res = await pool.query(`
    SELECT sku, barcode, ean13, product_name, size, clean_size 
    FROM master_products 
    WHERE sku LIKE 'PSKD100042%' OR sku LIKE 'PSKD100053%' OR sku LIKE 'PSKD100051%' OR sku LIKE 'PSKD200033%'
    ORDER BY sku
  `);
  console.table(res.rows);
  await pool.end();
}

run().catch(console.error);
