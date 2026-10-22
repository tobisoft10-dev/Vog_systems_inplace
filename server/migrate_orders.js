require('dotenv').config({ path: __dirname + '/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function runMigration() {
    console.log('🔄 Migration başlatılıyor...');
    try {
        // Vouchers tablosuna eksik siparişleri ekle
        const vouchersResult = await pool.query(`
            INSERT INTO vouchers (order_id, location, barcode, ean13, quantity, product_name, color, size, brand)
            SELECT 
                o.order_number, 
                COALESCE(o.service_center, 'Merkez Depo'), 
                COALESCE(o.ean13, o.sku, 'BARCODE-' || o.order_number), 
                o.ean13, 
                COALESCE(o.quantity, 0), 
                o.product_name, 
                'Standart', 
                'Standart', 
                COALESCE(o.brand, 'VOG Tekstil')
            FROM orders o
            LEFT JOIN vouchers v ON v.order_id = o.order_number
            WHERE v.id IS NULL
            RETURNING id;
        `);
        console.log(`✅ ${vouchersResult.rowCount} adet yeni sipariş 'vouchers' (kupon/irsaliye) tablosuna eklendi.`);

        // Sales tablosuna eksik siparişleri ekle
        const salesResult = await pool.query(`
            INSERT INTO sales (order_id, location, barcode, ean13, quantity)
            SELECT 
                o.order_number, 
                COALESCE(o.service_center, 'Merkez Depo'), 
                COALESCE(o.ean13, o.sku, 'BARCODE-' || o.order_number), 
                o.ean13, 
                COALESCE(o.quantity, 0)
            FROM orders o
            LEFT JOIN sales s ON s.order_id = o.order_number
            WHERE s.id IS NULL
            RETURNING id;
        `);
        console.log(`✅ ${salesResult.rowCount} adet yeni sipariş 'sales' (satış/sevk) tablosuna eklendi.`);

        console.log('🎉 Migration başarıyla tamamlandı!');
    } catch (err) {
        console.error('❌ Migration sırasında hata oluştu:', err);
    } finally {
        await pool.end();
    }
}

runMigration();
