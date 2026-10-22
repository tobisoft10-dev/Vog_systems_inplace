const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'vog_db',
    password: process.env.DB_PASSWORD || '150609',
    port: process.env.DB_PORT || 5432,
});

async function updateAllCode39ToBarcode() {
    console.log('🔄 Updating master_products table: code39 = barcode for ALL records...\n');

    try {
        const res = await pool.query(
            "UPDATE master_products SET code39 = barcode WHERE barcode IS NOT NULL AND barcode != ''"
        );
        console.log(`✅ Success! Updated ${res.rowCount} rows in master_products table.`);

        const totalRes = await pool.query('SELECT COUNT(*) FROM master_products');
        console.log(`📦 Total rows in master_products: ${totalRes.rows[0].count}`);

        const sampleRes = await pool.query('SELECT sku, barcode, code39, product_name, brand FROM master_products LIMIT 10');
        console.log('\n📌 Sample updated master_products records:', sampleRes.rows);

    } catch (err) {
        console.error('❌ Error updating code39 in master_products:', err.message);
    } finally {
        await pool.end();
    }
}

updateAllCode39ToBarcode();
