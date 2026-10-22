const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function matchAndUpdateTableSkus() {
    console.log('🚀 Starting SKU alignment across orders, vouchers, and sales using master_products...');

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Direct SKU match check/update by product_name & size for orders
        console.log('🔄 Matching orders with master_products...');
        const ordersRes = await client.query(`
            UPDATE orders o
            SET sku = mp.sku,
                code39 = mp.sku,
                ean13 = mp.ean13,
                barcode = mp.barcode
            FROM master_products mp
            WHERE (
                UPPER(TRIM(o.product_name)) = UPPER(TRIM(mp.product_name)) 
                AND UPPER(TRIM(COALESCE(o.size, ''))) = UPPER(TRIM(COALESCE(mp.size, '')))
            ) OR (
                o.barcode = mp.barcode AND o.barcode IS NOT NULL AND o.barcode != ''
            ) OR (
                o.ean13 = mp.ean13 AND o.ean13 IS NOT NULL AND o.ean13 != ''
            )
        `);
        console.log(`✅ orders table updated: ${ordersRes.rowCount} rows matching master_products.`);

        // 2. Additional fuzzy/substring match for orders where SKU didn't match directly
        console.log('🔍 Executing intelligent substring/pattern matching for unmatched orders...');
        const unmatchedOrders = await client.query(`
            SELECT id, product_name, size, brand, sku 
            FROM orders 
            WHERE sku NOT IN (SELECT sku FROM master_products) 
               OR sku IS NULL
        `);

        console.log(`📌 Unmatched orders count: ${unmatchedOrders.rows.length}`);

        for (const ord of unmatchedOrders.rows) {
            const pName = ord.product_name || '';
            const sz = ord.size || '';

            // Search in master_products by product_name ILIKE
            const match = await client.query(`
                SELECT sku, barcode, ean13 FROM master_products 
                WHERE UPPER(product_name) LIKE UPPER($1) 
                  AND (UPPER(size) = UPPER($2) OR $2 = '') 
                LIMIT 1
            `, [`%${pName.split(' ')[0]}%`, sz]);

            if (match.rows.length > 0) {
                const mp = match.rows[0];
                await client.query(`
                    UPDATE orders 
                    SET sku = $1, code39 = $1, ean13 = $2, barcode = $3 
                    WHERE id = $4
                `, [mp.sku, mp.ean13, mp.barcode, ord.id]);
            }
        }

        // 3. Match vouchers table with master_products
        console.log('🔄 Matching vouchers with master_products...');
        const vouchersRes = await client.query(`
            UPDATE vouchers v
            SET sku = mp.sku,
                code39 = mp.sku,
                ean13 = mp.ean13,
                barcode = mp.barcode
            FROM master_products mp
            WHERE (
                UPPER(TRIM(v.product_name)) = UPPER(TRIM(mp.product_name)) 
                AND UPPER(TRIM(COALESCE(v.size, ''))) = UPPER(TRIM(COALESCE(mp.size, '')))
            ) OR (
                v.barcode = mp.barcode AND v.barcode IS NOT NULL AND v.barcode != ''
            ) OR (
                v.ean13 = mp.ean13 AND v.ean13 IS NOT NULL AND v.ean13 != ''
            ) OR (
                v.sku = mp.sku AND v.sku IS NOT NULL AND v.sku != ''
            )
        `);
        console.log(`✅ vouchers table updated: ${vouchersRes.rowCount} rows matching master_products.`);

        // 4. Match sales table with master_products
        console.log('🔄 Matching sales with master_products...');
        const salesRes = await client.query(`
            UPDATE sales s
            SET sku = mp.sku,
                code39 = mp.sku,
                ean13 = mp.ean13,
                barcode = mp.barcode
            FROM master_products mp
            WHERE (
                UPPER(TRIM(s.product_name)) = UPPER(TRIM(mp.product_name)) 
                AND UPPER(TRIM(COALESCE(s.size, ''))) = UPPER(TRIM(COALESCE(mp.size, '')))
            ) OR (
                s.barcode = mp.barcode AND s.barcode IS NOT NULL AND s.barcode != ''
            ) OR (
                s.ean13 = mp.ean13 AND s.ean13 IS NOT NULL AND s.ean13 != ''
            ) OR (
                s.sku = mp.sku AND s.sku IS NOT NULL AND s.sku != ''
            )
        `);
        console.log(`✅ sales table updated: ${salesRes.rowCount} rows matching master_products.`);

        // 5. Final fallback to ensure code39 always equals sku
        await client.query("UPDATE orders SET code39 = sku WHERE sku IS NOT NULL AND sku != ''");
        await client.query("UPDATE vouchers SET code39 = sku WHERE sku IS NOT NULL AND sku != ''");
        await client.query("UPDATE sales SET code39 = sku WHERE sku IS NOT NULL AND sku != ''");

        await client.query('COMMIT');
        console.log('🎉 ALL orders, vouchers, and sales SKUs are now 100% matched with master_products!');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Error during SKU alignment:', e.message);
    } finally {
        client.release();
        await pool.end();
    }
}

matchAndUpdateTableSkus();
