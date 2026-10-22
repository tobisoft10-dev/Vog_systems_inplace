const { Pool } = require('pg');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

async function runMigration() {
    console.log('🚀 Connecting to remote database to update vouchers schema...');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        console.log('🗑️ Dropping old garment-specific columns from vouchers table...');
        await client.query(`
            ALTER TABLE vouchers DROP COLUMN IF EXISTS fabric_composition CASCADE;
            ALTER TABLE vouchers DROP COLUMN IF EXISTS origin CASCADE;
            ALTER TABLE vouchers DROP COLUMN IF EXISTS season CASCADE;
            ALTER TABLE vouchers DROP COLUMN IF EXISTS care_instructions CASCADE;
            ALTER TABLE vouchers DROP COLUMN IF EXISTS hs_code CASCADE;
        `);

        console.log('📦 Altering vouchers table to add box/shipment columns...');
        await client.query(`
            ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS product_name TEXT;
            ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS color TEXT;
            ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS size TEXT;
            ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS brand TEXT;
            ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS sku TEXT;
            ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2);
            ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS gender TEXT;
            
            ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS box_no INTEGER DEFAULT 1;
            ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS total_boxes INTEGER DEFAULT 1;
            ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS gross_weight DECIMAL(10, 2) DEFAULT 12.50;
            ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS package_type TEXT DEFAULT 'Koli';
            ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS sub_customer_name TEXT;
            ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS recipient_address TEXT;
            ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS carrier TEXT;
            ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS tracking_number TEXT;
        `);
        console.log('✅ Columns checked/added.');

        console.log('🔄 Backfilling product data from master_products...');
        const r1 = await client.query(`
            UPDATE vouchers v
            SET 
                product_name = m.product_name,
                color = m.color,
                size = m.size,
                brand = m.brand,
                sku = m.sku,
                price = m.price,
                gender = m.gender
            FROM master_products m
            WHERE v.barcode = m.barcode AND v.product_name IS NULL
        `);
        console.log(`Updated from master barcodes: ${r1.rowCount} rows.`);

        const r2 = await client.query(`
            UPDATE vouchers v
            SET 
                product_name = m.product_name,
                color = m.color,
                size = m.size,
                brand = m.brand,
                sku = m.sku,
                price = m.price,
                gender = m.gender
            FROM master_products m
            WHERE v.ean13 = m.ean13 AND v.product_name IS NULL
        `);
        console.log(`Updated from master EAN13s: ${r2.rowCount} rows.`);

        console.log('🔄 Backfilling specific non-master barcodes...');
        const r3 = await client.query(`
            UPDATE vouchers 
            SET product_name = 'Premium Polo Shirt', color = 'Lacivert', size = 'M', brand = 'SEAT', sku = 'VOG-POLO-01', price = 450.00, gender = 'Unisex' 
            WHERE barcode = '1956000808353' AND product_name IS NULL
        `);
        const r4 = await client.query(`
            UPDATE vouchers 
            SET product_name = 'Premium Polo Shirt', color = 'Lacivert', size = 'L', brand = 'SEAT', sku = 'VOG-POLO-01', price = 450.00, gender = 'Unisex' 
            WHERE barcode = '1956000805653' AND product_name IS NULL
        `);
        console.log(`Updated manual barcode rows: ${r3.rowCount + r4.rowCount}`);

        console.log('🔄 Backfilling box-specific columns from orders, sub_customers, and shipments...');
        await client.query(`
            UPDATE vouchers v
            SET sub_customer_name = o.sub_customer_name
            FROM orders o
            WHERE v.order_id = o.order_number AND v.sub_customer_name IS NULL;

            UPDATE vouchers v
            SET recipient_address = sc.location
            FROM orders o
            JOIN sub_customers sc ON o.sub_customer_id = sc.id
            WHERE v.order_id = o.order_number AND v.recipient_address IS NULL;

            UPDATE vouchers v
            SET 
                carrier = s.carrier,
                tracking_number = s.tracking_number
            FROM shipments s
            WHERE v.order_id = s.order_id AND (v.carrier IS NULL OR v.tracking_number IS NULL);
        `);

        console.log('🧹 Formatting remaining NULL values for defaults...');
        await client.query(`
            UPDATE vouchers SET box_no = 1 WHERE box_no IS NULL;
            UPDATE vouchers SET total_boxes = 1 WHERE total_boxes IS NULL;
            UPDATE vouchers SET gross_weight = 12.50 WHERE gross_weight IS NULL;
            UPDATE vouchers SET package_type = 'Koli' WHERE package_type IS NULL;
            UPDATE vouchers SET sub_customer_name = COALESCE(sub_customer_name, 'B2B Müşterisi') WHERE sub_customer_name IS NULL;
            UPDATE vouchers SET recipient_address = COALESCE(recipient_address, location, 'Depo Teslim') WHERE recipient_address IS NULL;
            UPDATE vouchers SET carrier = COALESCE(carrier, 'Alıcı Ödemeli') WHERE carrier IS NULL;
            UPDATE vouchers SET tracking_number = COALESCE(tracking_number, 'N/A') WHERE tracking_number IS NULL;
        `);

        await client.query('COMMIT');
        console.log('✅ Vouchers database schema update finished successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error during database schema update:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
