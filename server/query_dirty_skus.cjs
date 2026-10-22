const { Pool } = require('pg');
require('dotenv').config(); 
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

async function run() {
    try {
        const { rows } = await pool.query(`
            SELECT order_number, sku, code39, barcode, product_name, notes 
            FROM orders 
            WHERE sku LIKE '%OLACAK%' OR sku LIKE '%BAYILERE%' OR sku LIKE '%TARAFIMDAN%' OR sku LIKE '%PVWK200075%'
            LIMIT 10
        `);
        console.log(rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();
