const { Pool } = require('pg');
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
        console.log('🔍 Order 16804 için Vouchers tablosundaki en güncel barcode/ean13/sku alınıyor...');
        const vRes = await pool.query(
            "SELECT barcode, ean13, sku FROM vouchers WHERE order_id = 16804 ORDER BY created_at DESC LIMIT 1"
        );

        if (vRes.rows.length === 0) {
            console.log('⚠️ Vouchers tablosunda 16804 için kayıt bulunamadı.');
            return;
        }

        const { barcode, ean13, sku } = vRes.rows[0];
        console.log(`📌 Bulunan Değerler - EAN13: ${ean13}, Barcode: ${barcode}, SKU: ${sku}`);

        // Update Sales
        const sRes = await pool.query(
            "UPDATE sales SET barcode = $1, ean13 = $2, sku = $3 WHERE order_id = 16804",
            [barcode, ean13, sku]
        );
        console.log(`✅ SALES Tablosunda ${sRes.rowCount} satır güncellendi!`);

        // Update Orders
        const oRes = await pool.query(
            "UPDATE orders SET barcode = $1, ean13 = $2, sku = $3 WHERE order_number = 16804",
            [barcode, ean13, sku]
        );
        console.log(`✅ ORDERS Tablosunda ${oRes.rowCount} satır güncellendi!`);

        console.log('✨ 16804 numaralı siparişin EAN13 ve Barcode kodları tüm tablolarda 100% eşitlendi!');
    } catch (e) {
        console.error('❌ Hata:', e.message);
    } finally {
        await pool.end();
    }
}

run();
