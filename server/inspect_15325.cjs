const { Pool } = require('pg');
require('dotenv').config({ path: 'c:/vog_system/server/.env' });
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

async function inspect15325() {
    try {
        const res = await pool.query(`SELECT * FROM orders WHERE order_number = 15325`);
        console.log('Order 15325 lines:', res.rows.length);
        console.log(res.rows);

        // Check if there are vouchers for 15325
        const vRes = await pool.query(`SELECT id, size, gender, barcode, ean13, sku FROM vouchers WHERE order_id = 15325`);
        console.log('Vouchers for 15325:', vRes.rows.length);
        if (vRes.rows.length > 0) {
            console.log(vRes.rows.slice(0, 10));
        }

        // Check rfid_tags for 15325
        const tRes = await pool.query(`SELECT size, gender, COUNT(*) FROM rfid_tags WHERE order_id = '15325' GROUP BY size, gender`);
        console.log('RFID tags printed for 15325:', tRes.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
inspect15325();
