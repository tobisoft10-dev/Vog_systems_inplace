const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function verify() {
    await pool.query("UPDATE vouchers SET location = 'Ana Depo Teslimat'");
    const res = await pool.query('SELECT order_id, location, barcode, product_name, color, size, brand, sku FROM vouchers ORDER BY order_id DESC');
    console.log('📌 Vouchers in PostgreSQL table:');
    console.table(res.rows);
    await pool.end();
}

verify();
