const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

async function run() {
    try {
        console.log('🔄 Checking and synchronizing orders & master_products table barcodes...');
        const mpUpdateRes = await pool.query(`
            UPDATE master_products 
            SET barcode = ean13 
            WHERE (barcode IS NULL OR barcode LIKE 'AUTO-%' OR barcode = '') 
              AND ean13 IS NOT NULL 
              AND ean13 ~ '^86[0-9]{11}'
        `);
        console.log(`✅ Updated ${mpUpdateRes.rowCount} master_products rows to use their true EAN-13 (869/868...) barcode.`);

        const updateRes = await pool.query(`
            UPDATE orders 
            SET barcode = ean13 
            WHERE (barcode IS NULL OR barcode LIKE 'AUTO-%' OR barcode = '') 
              AND ean13 IS NOT NULL 
              AND ean13 ~ '^86[0-9]{11}'
        `);
        console.log(`✅ Updated ${updateRes.rowCount} orders rows to use their true EAN-13 (869/868...) barcode.`);

        const statsMp = await pool.query(`
            SELECT 
                count(*) as total,
                count(CASE WHEN barcode ~ '^86[0-9]{11}' THEN 1 END) as real_barcode_cnt,
                count(CASE WHEN ean13 ~ '^86[0-9]{11}' THEN 1 END) as real_ean13_cnt
            FROM master_products
        `);
        console.log('📊 master_products barcode status:', statsMp.rows[0]);

        const statsOrders = await pool.query(`
            SELECT 
                count(*) as total,
                count(CASE WHEN barcode ~ '^86[0-9]{11}' THEN 1 END) as real_barcode_cnt,
                count(CASE WHEN ean13 ~ '^86[0-9]{11}' THEN 1 END) as real_ean13_cnt
            FROM orders
        `);
        console.log('📊 orders barcode status:', statsOrders.rows[0]);
    } catch (e) {
        console.error('❌ Error during barcode sync:', e);
    } finally {
        await pool.end();
    }
}

run();
