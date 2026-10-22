const { Pool } = require('pg');
const pool = new Pool({
    user: 'VOG',
    host: 'localhost',
    database: 'vog_db',
    password: 'Vog2026!Premium',
    port: 5432,
});

async function migrate() {
    try {
        console.log('Migrating orders table...');
        await pool.query(`
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS sub_customer_id UUID;
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS sub_customer_name TEXT;
        `);
        console.log('Migration successful.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
