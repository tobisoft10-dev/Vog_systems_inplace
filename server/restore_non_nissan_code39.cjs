const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'vog_db',
    password: process.env.DB_PASSWORD || '150609',
    port: process.env.DB_PORT || 5432,
});

async function restoreNonNissanCode39() {
    console.log('🔄 Restoring code39 = sku for non-Nissan products and ensuring code39 = barcode for NISSAN...\n');

    try {
        // 1. For non-Nissan products, set code39 = sku
        const resNonNissan = await pool.query(
            "UPDATE master_products SET code39 = sku WHERE UPPER(brand) != 'NISSAN' OR brand IS NULL"
        );
        console.log(`✅ Restored code39 = sku for ${resNonNissan.rowCount} non-Nissan products.`);

        // 2. For Nissan products, ensure code39 = barcode
        const resNissan = await pool.query(
            "UPDATE master_products SET code39 = barcode WHERE UPPER(brand) = 'NISSAN'"
        );
        console.log(`✅ Ensured code39 = barcode for ${resNissan.rowCount} Nissan products.`);

        // 3. Inspect sample rows for both Nissan and Non-Nissan
        const sampleNissan = await pool.query(
            "SELECT sku, barcode, code39, product_name, brand FROM master_products WHERE UPPER(brand) = 'NISSAN' LIMIT 3"
        );
        console.log('\n📌 Sample NISSAN items (code39 = barcode):', sampleNissan.rows);

        const sampleOther = await pool.query(
            "SELECT sku, barcode, code39, product_name, brand FROM master_products WHERE UPPER(brand) != 'NISSAN' LIMIT 3"
        );
        console.log('\n📌 Sample Other Brand items (code39 = sku):', sampleOther.rows);

    } catch (err) {
        console.error('❌ Error in restore script:', err.message);
    } finally {
        await pool.end();
    }
}

restoreNonNissanCode39();
