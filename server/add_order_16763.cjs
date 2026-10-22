const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function addOrder16763() {
    console.log('🚀 Adding / Ensuring Order #16763 in PostgreSQL database...');

    try {
        const check = await pool.query('SELECT id FROM orders WHERE order_number = 16763 OR id::text = \'16763\'');
        if (check.rows.length === 0) {
            const res = await pool.query(`
                INSERT INTO orders (
                    order_number, sku, product_name, quantity, processed_quantity, remaining_quantity,
                    status, brand, sub_customer_name, staff_name, size, barcode, ean13, code39, grup, created_at, updated_at
                ) VALUES (
                    16763, 'PVWK200074M', '2026 YAZ VW TEKNİSYEN İŞ PANTOLONU ERKEK - GRİ / FÜME', 420, 0, 420,
                    'İşlem Bekliyor', 'VW', 'DOĞUŞ OTOMOTİV SERVİS VE TİCARET A.Ş.', 'SALİH', 'BEDEN (XXS-9XL)',
                    'PVWK200074M', '8691676300019', 'PVWK200074M', 'PANTOLON', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                ) RETURNING *
            `);
            console.log('✅ Order #16763 inserted into orders table:', res.rows[0]);
        } else {
            console.log('ℹ️ Order #16763 already exists in orders table.');
        }
    } catch (e) {
        console.error('❌ Error adding order 16763:', e.message);
    } finally {
        await pool.end();
    }
}

addOrder16763();
