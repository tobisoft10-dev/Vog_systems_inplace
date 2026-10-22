const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'vog_db',
    password: process.env.DB_PASSWORD || '150609',
    port: process.env.DB_PORT || 5432,
});

async function updateNissanCode39() {
    console.log('🔄 Updating master_products table: code39 = barcode for brand = NISSAN...\n');

    try {
        const res = await pool.query(
            "UPDATE master_products SET code39 = barcode WHERE UPPER(brand) = 'NISSAN'"
        );
        console.log(`✅ Success! Updated ${res.rowCount} rows in master_products for brand = NISSAN.`);

        const sample = await pool.query(
            "SELECT sku, barcode, code39, product_name FROM master_products WHERE UPPER(brand) = 'NISSAN' LIMIT 5"
        );
        console.log('\n📌 Sample updated Nissan rows:', sample.rows);

    } catch (err) {
        console.error('❌ Error updating Nissan code39:', err.message);
    } finally {
        await pool.end();
    }
}

updateNissanCode39();
