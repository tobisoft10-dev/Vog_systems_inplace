const { Pool } = require('pg');
const path = require('path');

// Load env
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

async function runUpdate() {
    console.log('🚀 Connecting to database to update NULL order_ids in sales table...');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Update sales barcode 1956000808353 -> order_id 1001
        const r1 = await client.query(`
            UPDATE sales 
            SET order_id = 1001 
            WHERE barcode = '1956000808353' AND order_id IS NULL
        `);
        console.log(`Updated barcode 1956000808353 rows: ${r1.rowCount}`);

        // Update sales barcode 1956000805653 -> order_id 1002
        const r2 = await client.query(`
            UPDATE sales 
            SET order_id = 1002 
            WHERE barcode = '1956000805653' AND order_id IS NULL
        `);
        console.log(`Updated barcode 1956000805653 rows: ${r2.rowCount}`);

        await client.query('COMMIT');
        console.log('✅ Sales table updated successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error during update:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

runUpdate();
