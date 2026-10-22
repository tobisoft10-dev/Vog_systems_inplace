const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function run() {
    try {
        console.log('📌 Updating quantity = 509 for Order 16667 in PG orders...');
        const res = await pool.query(`
            UPDATE orders 
            SET quantity = 509, status = 'KESİM'
            WHERE order_number = 16667 OR product_name LIKE '%FORMEN%'
        `);
        console.log('Updated rows count:', res.rowCount);

        const check = await pool.query("SELECT id, order_number, quantity, product_name FROM orders WHERE order_number = 16667");
        console.log('Updated PG Order 16667:', check.rows);

    } catch (e) {
        console.error('❌ Error updating PG:', e.message);
    } finally {
        await pool.end();
    }
}

run();
