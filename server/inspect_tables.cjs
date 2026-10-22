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
        const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'personnel'");
        console.log('Columns in personnel:', cols.rows.map(r => r.column_name));

        const r = await pool.query("SELECT * FROM personnel WHERE brand = 'VOLKSWAGEN' LIMIT 5");
        console.log('Sample VW rows:', JSON.stringify(r.rows, null, 2));

        // Check master_products for VW items to see what product codes exist for Mont, Yelek, Gömlek, Pantolon, Ayakkabı
        const mpVW = await pool.query("SELECT DISTINCT brand, grup, product_name, sku FROM master_products WHERE brand ILIKE '%VOLKSWAGEN%' OR brand ILIKE '%VW%' LIMIT 20");
        console.log('VW Master products sample:', mpVW.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

run();
