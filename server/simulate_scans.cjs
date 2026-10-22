const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function run() {
    try {
        console.log("Locating pending orders for HÜSEYİN EGEMEN EKER, EMRE ÇIRAKMAN, MEHMET ABAZA...");
        
        // Query matching with LIKE
        const queryStr = `
            SELECT * FROM orders 
            WHERE (
                UPPER(staff_name) LIKE 'HÜSEYİN%' 
                OR UPPER(staff_name) LIKE 'EMRE%' 
                OR UPPER(staff_name) LIKE 'MEHMET%'
            )
            AND brand = 'SEAT'
        `;
        const res = await pool.query(queryStr);
        
        console.log(`Found ${res.rows.length} orders.`);
        
        for (const order of res.rows) {
            console.log(`Processing Order #${order.order_number} for ${order.staff_name} (${order.product_name}) - Qty: ${order.quantity}`);
            
            // Check existing scan count
            const scanCheck = await pool.query(
                "SELECT COUNT(*) as count FROM tunnel_scans WHERE order_id = $1",
                [order.order_number]
            );
            const currentScans = parseInt(scanCheck.rows[0].count);
            const needed = order.quantity - currentScans;
            
            if (needed <= 0) {
                console.log(`Already fully scanned (${currentScans}/${order.quantity}).`);
                continue;
            }
            
            console.log(`Scanning ${needed} mock tags...`);
            for (let i = 0; i < needed; i++) {
                const dummyTag = `EPC-SEAT-${order.order_number}-${Math.random().toString(36).substring(7).toUpperCase()}`;
                const barcode = order.sku || 'VOG868001';
                
                await pool.query(
                    "INSERT INTO tunnel_scans (order_id, rfid_tag, barcode, ean13, status) VALUES ($1, $2, $3, $4, 'Approved') ON CONFLICT (rfid_tag) DO NOTHING",
                    [order.order_number, dummyTag, barcode, order.ean13 || null]
                );
            }
            console.log(`Successfully scanned remaining items for ${order.staff_name}.`);
        }
        
    } catch (err) {
        console.error("Error executing simulation:", err);
    } finally {
        await pool.end();
    }
}

run();
