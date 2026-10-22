const { Pool } = require('pg');
const pool = new Pool({ database: 'vog_db', user: 'postgres', password: '!719356Qse!' });

(async () => {
  try {
    const res = await pool.query(`
      SELECT sku, barcode, code39, ean13, product_name, brand, grup 
      FROM master_products 
      WHERE brand = 'NISSAN' 
      ORDER BY id DESC 
      LIMIT 10
    `);
    console.table(res.rows);
    await pool.end();
  } catch (e) {
    console.error(e);
  }
})();
