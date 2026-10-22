const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function initSorterItemsTable() {
    console.log('🚀 Initializing sorter_chute_items table in PostgreSQL...');
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sorter_chute_items (
                id SERIAL PRIMARY KEY,
                chute_no INTEGER NOT NULL,
                barcode VARCHAR(255) NOT NULL,
                sku VARCHAR(255),
                product_name VARCHAR(255),
                size VARCHAR(50),
                brand VARCHAR(100),
                order_number VARCHAR(100),
                status VARCHAR(50) DEFAULT 'DROPPED',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_sorter_chute_items_chute_no ON sorter_chute_items(chute_no);
            CREATE INDEX IF NOT EXISTS idx_sorter_chute_items_barcode ON sorter_chute_items(barcode);
        `);

        // Check if there are sample items or previous rfid reads to seed if empty
        const countRes = await pool.query('SELECT COUNT(*) FROM sorter_chute_items');
        console.log(`✅ sorter_chute_items table ready. Current row count: ${countRes.rows[0].count}`);
    } catch (err) {
        console.error('❌ Error creating sorter_chute_items table:', err);
    } finally {
        await pool.end();
    }
}

initSorterItemsTable();
