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
        console.log('📌 Updating Order #16667 in PostgreSQL database with 509 KESIM total quantity...');

        await pool.query("DELETE FROM orders WHERE order_number = 16667 OR id::text = '16667000-0000-4000-8000-000000016667'");

        await pool.query(`
            INSERT INTO orders (
                id, order_number, service_center, department, staff_name, sku, product_name, 
                quantity, status, brand, created_at, ean13, barcode, 
                grup, sub_customer_name, size, estimated_delivery_date
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
            )
        `, [
            '16667000-0000-4000-8000-000000016667',
            16667,
            'DOĞUŞ OTOMOTİV',
            'Formen Binek',
            'ERDİ',
            'VW-FORMEN-SW-GRİ',
            '2026 KİŞ VW YENİ FORMEN BİNEK SWEATSHIRT BAY - GRİ',
            509,
            'KESİM',
            'VW',
            '2026-07-01 22:58:00',
            '8691666716667',
            '8691666716667',
            'Formen',
            'DOĞUŞ OTOMOTİV SERVİS VE TİCARET A.Ş.',
            'XXS-9XL',
            '2026-10-01 00:00:00'
        ]);
        console.log('✅ Order #16667 successfully updated in PostgreSQL with 509 KESIM total quantity!');

    } catch (e) {
        console.error('❌ Error updating order #16667:', e.message);
    } finally {
        await pool.end();
    }
}

run();
