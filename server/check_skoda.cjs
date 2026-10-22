const { Pool } = require('pg');
require('dotenv').config({ path: 'c:/vog_system/server/.env' });
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

async function check() {
    try {
        const res = await pool.query(`
            SELECT id, order_number, brand, product_name, sku, size, gender, quantity, sub_customer_name 
            FROM orders 
            WHERE product_name ILIKE '%SKODA%POLAR%' OR sku ILIKE '%PSKD%'
            ORDER BY id DESC LIMIT 20
        `);
        console.log('Orders found:', res.rows.length);
        console.log(res.rows);

        // Also check vouchers
        const vRes = await pool.query(`
            SELECT id, order_id, brand, product_name, sku, size, gender, barcode, ean13 
            FROM vouchers 
            WHERE product_name ILIKE '%SKODA%POLAR%' OR sku ILIKE '%PSKD%'
            ORDER BY id DESC LIMIT 20
        `);
        console.log('Vouchers found:', vRes.rows.length);
        console.log(vRes.rows);

        // Also check master_products
        const mRes = await pool.query(`
            SELECT id, brand, product_name, sku, size, gender, barcode, ean13 
            FROM master_products 
            WHERE product_name ILIKE '%SKODA%POLAR%' OR sku ILIKE '%PSKD10004%'
            ORDER BY id DESC LIMIT 20
        `);
        console.log('Master products found:', mRes.rows.length);
        console.log(mRes.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
check();
