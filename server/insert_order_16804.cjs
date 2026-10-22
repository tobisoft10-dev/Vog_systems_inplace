const { Pool } = require('pg');
const crypto = require('crypto');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function run() {
    const order_id = 16804;
    const quantity = 350;
    const total_quantity = 350;
    const product_name = 'KISA KOL POLO YAKA TSHIRT - SİYAH / BEYAZ 2026';
    const sub_customer_name = 'DOĞUŞ OTOMOTİV SERVİS VE TİCARET A.Ş.';
    const staff_name = 'SALİH';
    const brand = 'DOĞUŞ OTOMOTİV';
    const size = 'BEDEN (XXS-9XL)';
    const location = 'Ana Depo Tesellüm';
    const status = 'TAMAMLANDI';
    const sku = 'VOG-POLO-16804';
    const barcode = '8690011680401';
    const ean13 = '8690011680401';
    const price = 250;
    const grup = 'POLO TSHIRT';

    try {
        console.log(`🚀 Sipariş #${order_id} için Sales ve Orders tablolarına kayıt işleniyor...`);

        // 1. Sales tablosu kaydı
        const sRes = await pool.query(
            `INSERT INTO sales (
                order_id, quantity, price, product_name, staff_name, sku, brand, location, barcode, ean13, grup, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *`,
            [
                order_id, quantity, price, product_name, staff_name, sku, brand, location, barcode, ean13, grup
            ]
        );
        console.log('✅ SALES TABLOSUNA KAYIT EKLENDİ:', sRes.rows[0].id);

        // 2. Orders tablosu kaydı (Upsert)
        const orderCheck = await pool.query('SELECT * FROM orders WHERE order_number = $1', [order_id]);
        if (orderCheck.rows.length > 0) {
            await pool.query(
                `UPDATE orders 
                 SET status = $1, quantity = $2, staff_name = $3, sub_customer_name = $4, sku = $5, barcode = $6, ean13 = $7, product_name = $8, brand = $9, grup = $10, size = $11, updated_at = CURRENT_TIMESTAMP
                 WHERE order_number = $12`,
                [status, total_quantity, staff_name, sub_customer_name, sku, barcode, ean13, product_name, brand, grup, size, order_id]
            );
            console.log('✅ ORDERS TABLOSU GÜNCELLENDİ (Order Number:', order_id, ')');
        } else {
            const uuid = crypto.randomUUID();
            const oRes = await pool.query(
                `INSERT INTO orders (
                    id, order_number, quantity, status, brand, grup, size, sub_customer_name, ean13, staff_name, sku, product_name, barcode, notes, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING *`,
                [
                    uuid, order_id, total_quantity, status, brand, grup, size,
                    sub_customer_name, ean13, staff_name, sku, product_name, barcode, 'Etiket Basıldı (350/350)'
                ]
            );
            console.log('✅ ORDERS TABLOSUNA YENİ KAYIT EKLENDİ:', oRes.rows[0].id);
        }

        console.log(`✨ Sipariş #${order_id} için Sales ve Orders tablolarına başarım ile kaydedildi!`);
    } catch (e) {
        console.error('❌ Hata:', e);
    } finally {
        await pool.end();
    }
}

run();
