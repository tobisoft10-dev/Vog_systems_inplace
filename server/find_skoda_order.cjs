const { Pool } = require('pg');
require('dotenv').config({ path: 'c:/vog_system/server/.env' });
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

async function findOrder() {
    try {
        const res = await pool.query(`
            SELECT id, order_number, brand, product_name, sku, gender, quantity, size 
            FROM orders 
            WHERE brand = 'SKODA' AND (product_name ILIKE '%POLAR%' OR sku ILIKE '%PSKD10004%')
            ORDER BY id DESC LIMIT 30
        `);
        console.log('Orders found:', res.rows.length);
        console.log(res.rows);

        // Group by order_number
        const res2 = await pool.query(`
            SELECT order_number, brand, product_name, gender, SUM(quantity) as total_qty, COUNT(*) as line_count 
            FROM orders 
            WHERE brand = 'SKODA'
            GROUP BY order_number, brand, product_name, gender
            ORDER BY order_number DESC LIMIT 30
        `);
        console.log('Grouped orders:', res2.rows);

        // Check sum = 1776
        const res3 = await pool.query(`
            SELECT order_number, brand, product_name, SUM(quantity) as total_qty
            FROM orders 
            GROUP BY order_number, brand, product_name
            HAVING SUM(quantity) = 1776
        `);
        console.log('Orders with 1776 qty:', res3.rows);

        // Check vouchers for 1776 qty
        const res4 = await pool.query(`
            SELECT order_id, brand, product_name, COUNT(*) as cnt
            FROM vouchers 
            GROUP BY order_id, brand, product_name
            HAVING COUNT(*) = 1776
        `);
        console.log('Vouchers with 1776 qty:', res4.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
findOrder();
