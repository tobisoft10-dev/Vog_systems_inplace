const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'vog_db',
    password: process.env.DB_PASSWORD || '150609',
    port: process.env.DB_PORT || 5432,
});

async function cleanupTestOrderVouchers() {
    try {
        await pool.query("DELETE FROM vouchers WHERE sub_customer_name = 'TEST BAYİ'");
        console.log('🧹 Cleaned test voucher records.');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

cleanupTestOrderVouchers();
