const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'vog_db',
    password: process.env.DB_PASSWORD || '150609',
    port: process.env.DB_PORT || 5432,
});

async function cleanupPersonnelSkus() {
    console.log('🧹 [CLEANUP] Deleting personnel names and dealer headers from master_products table...\n');

    try {
        // Delete rows where SKU does not contain digits or matches non-SKU word pattern
        const deleteRes = await pool.query(`
            DELETE FROM master_products 
            WHERE sku LIKE '% %'
               OR sku !~ '\\d'
               OR sku IN ('DIAGNOZ', 'FORMEN', 'AUNDE', 'TANPLAZA', 'MEKA', 'ERKUR', 'OTONAM', 'SOYSAL', 'VOSKAR', 'ORKA', 'METAL', 'AHLATCI', 'ALVIN', 'GENERAL', 'OTOKUR', 'AKKAR', 'ACARLAR', 'EREL', 'REKOR', 'BAHADIR', 'SARDUR', 'ALTUR')
        `);

        console.log(`✅ Deleted ${deleteRes.rowCount} invalid personnel/dealer entries from master_products.`);

        // Verify remaining rows count
        const totalRes = await pool.query(`SELECT COUNT(*) FROM master_products`);
        console.log(`📊 Total clean master products in database: ${totalRes.rows[0].count}`);

    } catch (err) {
        console.error('Cleanup error:', err);
    } finally {
        await pool.end();
    }
}

cleanupPersonnelSkus();
