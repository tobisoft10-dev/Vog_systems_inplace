const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function run() {
    try {
        await pool.query("ALTER TABLE box_labels ADD COLUMN IF NOT EXISTS department text;");
        await pool.query("ALTER TABLE box_labels ADD COLUMN IF NOT EXISTS barcode text;");
        await pool.query("ALTER TABLE box_labels ADD COLUMN IF NOT EXISTS total_quantity integer;");
        console.log('Columns added to box_labels successfully!');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

run();
