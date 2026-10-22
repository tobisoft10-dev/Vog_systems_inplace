const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function main() {
    console.log('--- YELEK ---');
    const yelek = await pool.query("SELECT sku, code39, size, clean_size FROM master_products WHERE sku ILIKE 'PVWK100104%' OR sku ILIKE 'PVWK100105%'");
    console.log(yelek.rows);

    console.log('--- PANTOLON ---');
    const pant = await pool.query("SELECT sku, code39, size, clean_size FROM master_products WHERE sku ILIKE 'PVWB260017%' OR sku ILIKE 'PVWB250007%'");
    console.log(pant.rows);

    console.log('--- SHOES ---');
    const shoes = await pool.query("SELECT sku, code39, size, clean_size FROM master_products WHERE sku ILIKE 'PVWB260019%' OR sku ILIKE 'PVWB260018%' OR sku ILIKE 'PVWB250006%'");
    console.log(shoes.rows);

    await pool.end();
}
main().catch(console.error);
