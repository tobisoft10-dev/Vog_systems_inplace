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
    try {
        console.log('🔍 Checking 16806 in vouchers...');
        const vRes = await pool.query("SELECT * FROM vouchers WHERE order_id = 16806 ORDER BY created_at DESC LIMIT 1");
        
        let voucherData = {
            order_id: 16806,
            quantity: 130,
            status: 'KISMI BASILDI',
            brand: 'VOG',
            grup: 'MONT',
            size: 'BEDEN (XXS-9XL)',
            sub_customer_name: 'BORUSAN',
            ean13: '8691680616807',
            barcode: '8691680616807',
            sku: 'SKU-VOG-16806',
            staff_name: 'SALİH',
            product_name: 'JLR TEKNİSYEN MONT LACİVERT'
        };

        if (vRes.rows.length > 0) {
            const v = vRes.rows[0];
            voucherData = {
                order_id: 16806,
                quantity: v.total_quantity || 130,
                status: v.status || 'KISMI BASILDI',
                brand: v.brand || 'VOG',
                grup: v.grup || 'MONT',
                size: v.size || 'BEDEN (XXS-9XL)',
                sub_customer_name: v.sub_customer_name || 'BORUSAN',
                ean13: v.ean13 || '8691680616807',
                barcode: v.barcode || '8691680616807',
                sku: v.sku || 'SKU-VOG-16806',
                staff_name: v.staff_name || 'SALİH',
                product_name: v.product_name || 'JLR TEKNİSYEN MONT LACİVERT'
            };
        }

        // Insert into orders table
        const oCheck = await pool.query("SELECT * FROM orders WHERE order_number = 16806");
        if (oCheck.rows.length === 0) {
            const insRes = await pool.query(
                `INSERT INTO orders (
                    id, order_number, quantity, status, brand, grup, size, sub_customer_name, ean13, staff_name, sku, product_name, barcode, notes, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`,
                [
                    crypto.randomUUID(), 16806, voucherData.quantity, voucherData.status, voucherData.brand, voucherData.grup, voucherData.size,
                    voucherData.sub_customer_name, voucherData.ean13, voucherData.staff_name, voucherData.sku, voucherData.product_name, voucherData.barcode,
                    'Etiket Basıldı'
                ]
            );
            console.log('✅ 16806 numaralı sipariş PostgreSQL ORDERS tablosuna eklendi!');
            console.log(insRes.rows[0]);
        } else {
            console.log('ℹ️ 16806 zaten orders tablosunda mevcut.');
        }

    } catch (e) {
        console.error('❌ Hata:', e.message);
    } finally {
        await pool.end();
    }
}

run();
