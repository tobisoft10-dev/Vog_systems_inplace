const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'vog_db',
    password: process.env.DB_PASSWORD || '150609',
    port: process.env.DB_PORT || 5432,
});

async function cleanupDemoSeeds() {
    console.log('🧹 [CLEANUP] Deleting initial mock demo seed items (AUD-*, ST-*, FR-*, ZARA-*)...');

    try {
        const delMp = await pool.query(`
            DELETE FROM master_products 
            WHERE sku LIKE 'AUD-%' 
               OR sku LIKE 'ST-%' 
               OR sku LIKE 'FR-%' 
               OR sku LIKE 'ZARA-%'
        `);
        console.log(`✅ Deleted ${delMp.rowCount} demo seed items from master_products.`);

        const delCs = await pool.query(`
            DELETE FROM customer_stocks 
            WHERE sku LIKE 'AUD-%' 
               OR sku LIKE 'ST-%' 
               OR sku LIKE 'FR-%' 
               OR sku LIKE 'ZARA-%'
        `);
        console.log(`✅ Deleted ${delCs.rowCount} demo seed items from customer_stocks.`);

        const remaining = await pool.query('SELECT COUNT(*) as count FROM master_products');
        console.log(`\n📊 Total remaining production master products: ${remaining.rows[0].count}`);

    } catch (err) {
        console.error('Cleanup error:', err);
    } finally {
        await pool.end();
    }
}

cleanupDemoSeeds();
