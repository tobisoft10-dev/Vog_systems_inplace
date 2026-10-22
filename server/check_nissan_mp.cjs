const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:150609@localhost:5432/vog_db' });

async function main() {
    const res = await pool.query(`
        SELECT 
            COUNT(1) as total_nissan,
            COUNT(CASE WHEN sku ~ '^[0-9]{13}$' THEN 1 END) as numeric_13_digits,
            COUNT(CASE WHEN sku LIKE '8520147%' THEN 1 END) as code_8520147,
            COUNT(CASE WHEN sku LIKE '6001258%' THEN 1 END) as code_6001258,
            COUNT(CASE WHEN sku LIKE 'KIYAFET%' THEN 1 END) as code_kiyafet
        FROM master_products
        WHERE brand = 'NISSAN';
    `);
    console.log('PostgreSQL master_products NISSAN:', res.rows[0]);

    const sample = await pool.query(`
        SELECT sku, product_name, barcode, ean13, size, brand 
        FROM master_products 
        WHERE brand = 'NISSAN' 
        ORDER BY id DESC 
        LIMIT 5;
    `);
    console.log('Sample PG records:', sample.rows);

    await pool.end();
}

main();
