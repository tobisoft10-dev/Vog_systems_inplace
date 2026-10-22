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
    const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'master_products'");
    console.log(cols.rows);

    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    for (const sz of sizes) {
        const sku = `PVWB260013${sz}`;
        await pool.query(`
            INSERT INTO master_products (sku, code39, ean13, barcode, size, clean_size, product_name, brand)
            VALUES ($1, $2, '8684072311659', '8684072311659', $3, $4, $5, 'VOLKSWAGEN')
            ON CONFLICT (sku) DO UPDATE SET 
                code39 = EXCLUDED.code39,
                size = EXCLUDED.size,
                clean_size = EXCLUDED.clean_size;
        `, [sku, sku, sz, sz, `RPT 2026 YAZ VW MÜŞTERİ DANIŞMANI GÖMLEK (${sz})`]);
    }
    console.log('✅ PVWB260013 variants added to master_products.');
    await pool.end();
}
main().catch(console.error);
