const { Pool } = require('pg');
const pool = new Pool({ database: 'vog_db', user: 'postgres', password: '!719356Qse!' });

(async () => {
  try {
    const res = await pool.query(`
      SELECT sku, barcode, code39, ean13, length(sku) as len_sku, length(barcode) as len_barcode, length(code39) as len_code39, length(ean13) as len_ean13 
      FROM master_products 
      WHERE brand = 'NISSAN' 
      LIMIT 10
    `);
    console.table(res.rows);

    const count13 = await pool.query(`
      SELECT 
        count(*) filter (where length(sku) = 13) as sku_13,
        count(*) filter (where length(barcode) = 13) as barcode_13,
        count(*) filter (where length(code39) = 13) as code39_13,
        count(*) filter (where length(ean13) = 13) as ean13_13,
        count(*) as total
      FROM master_products
      WHERE brand = 'NISSAN'
    `);
    console.table(count13.rows);

    await pool.end();
  } catch (e) {
    console.error(e);
  }
})();
