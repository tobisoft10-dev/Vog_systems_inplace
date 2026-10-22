const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: '150609%M',
  host: 'localhost',
  port: 5432,
  database: 'vog_db'
});

async function run() {
  const res = await pool.query(`
    SELECT id, order_number, product_name, sku, notes
    FROM orders
    WHERE product_name ILIKE '%skoda%'
       OR sku ILIKE '%skd%'
       OR sku ILIKE '%skoda%'
    ORDER BY id DESC
  `);

  console.log(`PG orders tablosunda bulunan Skoda siparişleri: ${res.rows.length}`);
  res.rows.forEach(r => {
    console.log(`[PG ID: ${r.id}] OrderNo: ${r.order_number} | Product: "${r.product_name}" | SKU: "${r.sku}"`);
  });
  await pool.end();
}

run().catch(console.error);
