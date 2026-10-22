const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'vog_db',
    password: process.env.DB_PASSWORD || '150609',
    port: process.env.DB_PORT || 5432,
});

async function cleanupMasterProductsSku() {
    console.log('🧹 [CLEANUP] Cleaning non-product personnel names from master_products table...\n');

    try {
        // Find all rows where SKU contains spaces or doesn't match standard product code patterns
        const query = `
            SELECT id, sku, product_name, brand 
            FROM master_products 
            WHERE sku LIKE '% %' 
               OR sku !~ '^P[A-Z0-9]+'
        `;
        const res = await pool.query(query);

        console.log(`🔎 Found ${res.rows.length} invalid non-product SKU entries in master_products:`);
        res.rows.slice(0, 20).forEach(r => console.log(`   - ID: ${r.id} | SKU (Name): "${r.sku}" | Product: "${r.product_name}"`));

        if (res.rows.length > 0) {
            const delRes = await pool.query(`
                DELETE FROM master_products 
                WHERE sku LIKE '% %' 
                   OR sku !~ '^P[A-Z0-9]+'
            `);
            console.log(`\n✅ Deleted ${delRes.rowCount} invalid personnel entries from master_products.`);
        } else {
            console.log('\n✅ No invalid entries found.');
        }

        const remaining = await pool.query('SELECT COUNT(*) as count FROM master_products');
        console.log(`\n📊 Remaining valid master products count: ${remaining.rows[0].count}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

cleanupMasterProductsSku();
