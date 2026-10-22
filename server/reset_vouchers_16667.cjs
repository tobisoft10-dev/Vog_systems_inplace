const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function resetAndTest() {
    try {
        console.log('📌 Resetting vouchers for Order #16667...');
        await pool.query('DELETE FROM vouchers WHERE order_id = 16667');
        await pool.query('DELETE FROM sales WHERE order_id = 16667');
        console.log('✅ Vouchers & Sales cleared for Order #16667');
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await pool.end();
    }
}

resetAndTest();
