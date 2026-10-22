require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    user: process.env.DB_USER || process.env.PG_USER || 'postgres',
    host: process.env.DB_HOST || process.env.PG_HOST || 'localhost',
    database: process.env.DB_NAME || process.env.PG_DATABASE || 'vog_premium',
    password: process.env.DB_PASS || process.env.PG_PASSWORD || '123456',
    port: process.env.DB_PORT || process.env.PG_PORT || 5432,
});

async function runSeed() {
    console.log("Starting DB Seed for SEAT data...");
    try {
        await pool.query("DELETE FROM personnel WHERE brand = 'SEAT'");
        await pool.query("DELETE FROM orders WHERE brand = 'SEAT'");
        console.log("Cleared old SEAT dummy data.");

        const filePath = path.join(__dirname, 'data', 'seat_shipments.json');
        if (!fs.existsSync(filePath)) {
            console.error("Error: seat_shipments.json not found!");
            process.exit(1);
        }

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`Found ${data.length} records in seat_shipments.json. Inserting...`);

        await pool.query('BEGIN');
        let count = 0;
        for (const person of data) {
            // Insert into personnel
            await pool.query(
                `INSERT INTO personnel (name, service_center, role, top_size, bottom_size, brand)
                 VALUES ($1, $2, $3, $4, $5, 'SEAT')`,
                [person.name, person.dealer, person.role, person.upper_size, person.lower_size]
            );
            
            // Insert items into orders
            for (const item of person.items) {
                const qty = parseInt(item.quantity) || 1;
                const sku = 'SEAT-' + item.product_name.replace(/\s+/g, '-').substring(0, 10).toUpperCase();
                await pool.query(
                    `INSERT INTO orders (service_center, staff_name, product_name, sku, quantity, status, brand)
                     VALUES ($1, $2, $3, $4, $5, $6, 'SEAT')`,
                    [person.dealer, person.name, item.product_name, sku, qty, person.status || 'Pending']
                );
            }
            count++;
        }
        await pool.query('COMMIT');
        console.log(`✅ Successfully seeded ${count} personnel and their orders into PostgreSQL!`);
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error("❌ Seeding failed:", err);
    } finally {
        pool.end();
    }
}

runSeed();
