const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'vog_db',
    password: process.env.DB_PASSWORD || '150609',
    port: process.env.DB_PORT || 5432,
});

async function verifyAndUpdateNissanCode39() {
    console.log('🔄 Executing PostgreSQL master_products table code39 verification & update...\n');

    try {
        // 1. Set code39 = barcode strictly for brand = NISSAN
        const nissanRes = await pool.query(
            "UPDATE master_products SET code39 = barcode WHERE UPPER(brand) = 'NISSAN'"
        );
        console.log(`✅ Success! Updated code39 = barcode for ${nissanRes.rowCount} NISSAN records.`);

        // 2. Set code39 = sku for non-NISSAN records
        const otherRes = await pool.query(
            "UPDATE master_products SET code39 = sku WHERE UPPER(brand) != 'NISSAN' OR brand IS NULL"
        );
        console.log(`✅ Success! Verified code39 = sku for ${otherRes.rowCount} Non-NISSAN records.`);

        // 3. Inspect sample NISSAN records
        const sampleNissan = await pool.query(
            "SELECT sku, barcode, code39, product_name, brand FROM master_products WHERE UPPER(brand) = 'NISSAN' LIMIT 5"
        );
        console.log('\n📌 Sample NISSAN records (code39 === barcode):', sampleNissan.rows);

        // 4. Inspect sample Non-NISSAN records
        const sampleOther = await pool.query(
            "SELECT sku, barcode, code39, product_name, brand FROM master_products WHERE UPPER(brand) != 'NISSAN' LIMIT 5"
        );
        console.log('\n📌 Sample Non-NISSAN records (code39 === sku):', sampleOther.rows);

    } catch (err) {
        console.error('❌ Error executing update:', err.message);
    } finally {
        await pool.end();
    }
}

verifyAndUpdateNissanCode39();
