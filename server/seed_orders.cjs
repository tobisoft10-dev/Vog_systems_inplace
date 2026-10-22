
const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function seedOrders() {
    try {
        console.log('Seeding sample orders...');
        await pool.query(`
            INSERT INTO orders (brand, product_name, sku, quantity, service_center, status, estimated_delivery_date, notes) VALUES 
            ('SEAT', 'Premium Polo Shirt', 'VOG-POLO-01', 500, 'Barcelona Logistics', 'Sipariş Tamamlandı', '2026-06-15', 'Martineza Logistics Tunnel Entry'),
            ('SEAT', 'Premium Polo Shirt', 'VOG-POLO-01', 250, 'Madrid Hub', 'İşlem Bekliyor', '2026-06-20', 'Urgent repeat order'),
            ('FORD', 'Technical Softshell', 'VOG-JACK-05', 120, 'Detroit Export', 'Kısmi Tamamlandı', '2026-07-01', 'Winter collection batch'),
            ('ZARA', 'ZARA Basic Tee', 'ZARA-TSH-01', 1200, 'Istanbul Distribution', 'Sipariş Tamamlandı', '2026-05-30', 'Summer flash sale stock')
        `);
        console.log('✅ Successfully added 4 sample orders.');
    } catch (err) {
        console.error('❌ Error seeding orders:', err.message);
    } finally {
        await pool.end();
    }
}

seedOrders();
