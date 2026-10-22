const { Pool } = require('pg');
const pool = new Pool({ database: 'vog_db', user: 'postgres', password: '!719356Qse!' });

(async () => {
  try {
    const res = await pool.query(`
      SELECT 
        count(*) as total,
        count(*) filter (where barcode ~ '^[0-9]{12,14}$') as valid_numeric_barcode,
        count(*) filter (where barcode LIKE 'AUTO-%') as auto_barcode
      FROM master_products
      WHERE brand = 'NISSAN'
    `);
    console.table(res.rows);

    const sample = await pool.query(`
      SELECT product_name, sku, barcode, code39, ean13 
      FROM master_products 
      WHERE brand = 'NISSAN' AND barcode ~ '^[0-9]{12,14}$'
      LIMIT 10
    `);
    console.table(sample.rows);

    await pool.end();
  } catch (e) {
    console.error(e);
  }
})();
