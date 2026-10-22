const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function fixNullPrices() {
    console.log('Veritabanındaki "null" fiyatlar düzeltiliyor...');
    try {
        const vouchersResult = await pool.query(`
            UPDATE vouchers v
            SET price = mp.price
            FROM master_products mp
            WHERE v.sku = mp.sku
              AND v.price IS NULL
            RETURNING v.id;
        `);
        console.log(`✅ Vouchers tablosunda ${vouchersResult.rowCount} kaydın fiyatı güncellendi.`);

        const salesResult = await pool.query(`
            UPDATE sales s
            SET price = mp.price
            FROM master_products mp
            WHERE s.sku = mp.sku
              AND s.price IS NULL
            RETURNING s.id;
        `);
        console.log(`✅ Sales tablosunda ${salesResult.rowCount} kaydın fiyatı güncellendi.`);
        
    } catch (err) {
        console.error('❌ Hata:', err.message);
    } finally {
        await pool.end();
        console.log('İşlem tamamlandı.');
    }
}

fixNullPrices();
