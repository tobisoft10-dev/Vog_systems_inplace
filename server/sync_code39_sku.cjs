const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function syncCode39WithSku() {
    console.log('🚀 Synchronizing code39 values to match SKU values across all database tables...');

    try {
        const res1 = await pool.query("UPDATE master_products SET code39 = sku WHERE sku IS NOT NULL AND sku != ''");
        console.log(`✅ master_products code39 updated: ${res1.rowCount} rows.`);

        const res2 = await pool.query("UPDATE orders SET code39 = sku WHERE sku IS NOT NULL AND sku != ''");
        console.log(`✅ orders code39 updated: ${res2.rowCount} rows.`);

        const res3 = await pool.query("UPDATE vouchers SET code39 = sku WHERE sku IS NOT NULL AND sku != ''");
        console.log(`✅ vouchers code39 updated: ${res3.rowCount} rows.`);

        const res4 = await pool.query("UPDATE sales SET code39 = sku WHERE sku IS NOT NULL AND sku != ''");
        console.log(`✅ sales code39 updated: ${res4.rowCount} rows.`);

        console.log('🎉 ALL tables code39 values are now 100% synced with SKU values!');
    } catch (e) {
        console.error('❌ Error syncing code39:', e.message);
    } finally {
        await pool.end();
    }
}

syncCode39WithSku();
