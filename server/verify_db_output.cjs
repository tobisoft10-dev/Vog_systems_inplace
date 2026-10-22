const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: '!719356Qse!',
  database: 'vog_db',
  port: 5432
});

async function verify() {
  const tagRes = await pool.query("SELECT * FROM rfid_tags WHERE epc = '303B50CC00412100000014'");
  console.log('RFID Tag:', tagRes.rows[0]);
  const vRes = await pool.query("SELECT id, order_id, sku, code39, barcode, ean13, product_name, size, gender, brand FROM vouchers WHERE order_id = 16673 ORDER BY id DESC LIMIT 1");
  console.log('Voucher:', vRes.rows[0]);
  const sRes = await pool.query("SELECT id, order_id, sku, code39, barcode, ean13, product_name, size, gender, brand FROM sales WHERE order_id = 16673 ORDER BY id DESC LIMIT 1");
  console.log('Sales:', sRes.rows[0]);
  await pool.end();
}

verify().catch(console.error);
