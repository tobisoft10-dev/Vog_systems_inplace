const { Pool } = require('pg');
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'vog_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123456'
});

async function run() {
    try {
        await pool.query(`
            ALTER TABLE personnel 
            ADD COLUMN IF NOT EXISTS last_step VARCHAR(50) DEFAULT 'PLANLAMA',
            ADD COLUMN IF NOT EXISTS voucher_status VARCHAR(50) DEFAULT 'BEKLİYOR',
            ADD COLUMN IF NOT EXISTS label_print_count INT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS voucher_print_count INT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS last_printed_at TIMESTAMP;
        `);
        console.log('✅ Columns added to personnel table successfully.');
    } catch (e) {
        console.error('Migration error:', e);
    } finally {
        await pool.end();
    }
}

run();
