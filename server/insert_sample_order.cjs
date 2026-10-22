
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function insertSampleOrder() {
    const client = await pool.connect();
    try {
        console.log('🔍 Master data tablosundan bir ürün seçiliyor...');
        const productRes = await client.query('SELECT * FROM master_products LIMIT 1');
        
        if (productRes.rows.length === 0) {
            console.error('❌ Master data tablosu boş! Lütfen önce verileri içe aktarın.');
            return;
        }

        const product = productRes.rows[0];
        console.log(`✅ Ürün seçildi: ${product.product_name} (${product.barcode})`);

        console.log('📦 Sipariş oluşturuluyor...');
        const orderRes = await client.query(`
            INSERT INTO orders (
                brand, 
                product_name, 
                sku, 
                quantity, 
                service_center, 
                status, 
                estimated_delivery_date, 
                notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
        `, [
            product.brand,
            product.product_name,
            product.barcode, // SKU olarak barkodu kullanıyoruz
            10, // Örnek miktar
            'Maslak Servis Merkezi',
            'İşlem Bekliyor',
            '2026-06-01',
            'Otomatik oluşturulan örnek sipariş.'
        ]);

        console.log(`🚀 Sipariş başarıyla oluşturuldu! ID: ${orderRes.rows[0].id}`);
        console.log(`📊 Durum: İşlem Bekliyor`);

    } catch (err) {
        console.error('❌ Hata:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

insertSampleOrder();
