const { Pool } = require('pg');
const pool = new Pool({ database: 'vog_db', user: 'postgres', password: '!719356Qse!' });

(async () => {
  try {
    const res = await pool.query(`
      SELECT order_id, product_name, sku, barcode, code39, ean13, size, brand 
      FROM vouchers 
      WHERE brand = 'NISSAN' 
      ORDER BY id DESC 
      LIMIT 30
    `);
    console.log(`Total Nissan vouchers: ${res.rows.length}`);
    console.table(res.rows);

    const ordersRes = await pool.query(`
      SELECT id, brand, product_name, sku, barcode, code39, ean13 
      FROM orders 
      WHERE brand = 'NISSAN' 
      LIMIT 10
    `);
    console.log(`Nissan orders:`);
    console.table(ordersRes.rows);

    const mpRes = await pool.query(`
      SELECT product_name, sku, barcode, code39, ean13, clean_size, brand 
      FROM master_products 
      WHERE brand = 'NISSAN' AND length(barcode) = 13 
      LIMIT 10
    `);
    console.log(`Nissan master_products sample with 13-char barcode:`);
    console.table(mpRes.rows);

    await pool.end();
  } catch (e) {
    console.error(e);
  }
})();
