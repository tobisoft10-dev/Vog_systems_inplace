const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function run() {
  try {
    const query = `
      INSERT INTO orders (brand, staff_name, sub_customer_name, product_name, sku, quantity, status, notes, grup, size, order_number)
      VALUES ('SEAT', 'EMRE TAŞ', 'DEMOTO AFYON', 'Test Polo Shirt', 'SEAT-TEST-POLO-M', 1, 'İşlem Bekliyor', 'Görev: Formen', 'Formen', 'M', 3049);
    `;
    await pool.query(query);
    console.log("Mock order inserted successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
