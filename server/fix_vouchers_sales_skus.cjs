const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'vog_db',
    password: process.env.DB_PASSWORD || '150609',
    port: process.env.DB_PORT || 5432,
});

async function fixExistingSkus() {
    console.log('🔧 Updating existing vouchers and sales records to strictly match master_products SKUs...\n');

    try {
        // Fetch all vouchers
        const vouchers = await pool.query('SELECT id, order_id, product_name, size, brand, sku, code39 FROM vouchers');
        console.log(`📑 Found ${vouchers.rows.length} voucher records to check...`);

        let fixedVouchers = 0;
        for (const v of vouchers.rows) {
            const cleanSz = (v.size || '').replace(/beden/gi, '').trim().toUpperCase();
            
            // Search master_products
            let mpMatch = null;
            
            // By exact product name
            if (v.product_name) {
                const res = await pool.query('SELECT * FROM master_products WHERE UPPER(product_name) = UPPER($1) LIMIT 1', [v.product_name]);
                if (res.rows.length > 0) mpMatch = res.rows[0];
            }

            // By brand match
            if (!mpMatch && (v.brand || v.product_name)) {
                let searchBrand = v.brand;
                const pName = (v.product_name || '').toUpperCase();
                if (pName.includes('CUPRA')) searchBrand = 'CUPRA';
                else if (pName.includes('AUDI')) searchBrand = 'AUDI';
                else if (pName.includes('PORSCHE')) searchBrand = 'PORSCHE';
                else if (pName.includes('VW') || pName.includes('VOLKSWAGEN')) searchBrand = 'VW';
                else if (pName.includes('SEAT')) searchBrand = 'SEAT';
                else if (pName.includes('SKODA')) searchBrand = 'SKODA';
                else if (pName.includes('SCANIA')) searchBrand = 'SCANIA';

                if (searchBrand && searchBrand !== 'VOG') {
                    const res = await pool.query('SELECT * FROM master_products WHERE brand ILIKE $1 ORDER BY id ASC LIMIT 1', [`%${searchBrand}%`]);
                    if (res.rows.length > 0) mpMatch = res.rows[0];
                }
            }

            if (mpMatch) {
                const targetSku = mpMatch.sku;
                const targetCode39 = mpMatch.code39 || mpMatch.sku;

                await pool.query(
                    'UPDATE vouchers SET sku = $1, code39 = $2 WHERE id = $3',
                    [targetSku, targetCode39, v.id]
                );
                fixedVouchers++;
            } else if (v.sku && v.sku.startsWith('SKU-VOG-')) {
                // Generate clean catalog SKU
                const brandPrefix = (v.brand || 'VOG').toUpperCase().replace(/[^A-Z0-9]/g, '');
                const cleanSkuBase = `P${brandPrefix}${v.order_id || '1000'}`;
                const cleanSku = cleanSz ? `${cleanSkuBase}-${cleanSz}` : cleanSkuBase;

                await pool.query(
                    'UPDATE vouchers SET sku = $1, code39 = $2 WHERE id = $3',
                    [cleanSku, cleanSku, v.id]
                );
                fixedVouchers++;
            }
        }
        console.log(`✅ Fixed ${fixedVouchers} voucher records.`);

        // Fetch all sales
        const sales = await pool.query('SELECT id, order_id, product_name, size, brand, sku, code39 FROM sales');
        console.log(`\n🛒 Found ${sales.rows.length} sales records to check...`);

        let fixedSales = 0;
        for (const s of sales.rows) {
            const cleanSz = (s.size || '').replace(/beden/gi, '').trim().toUpperCase();
            let mpMatch = null;

            if (s.product_name) {
                const res = await pool.query('SELECT * FROM master_products WHERE UPPER(product_name) = UPPER($1) LIMIT 1', [s.product_name]);
                if (res.rows.length > 0) mpMatch = res.rows[0];
            }

            if (!mpMatch && (s.brand || s.product_name)) {
                let searchBrand = s.brand;
                const pName = (s.product_name || '').toUpperCase();
                if (pName.includes('CUPRA')) searchBrand = 'CUPRA';
                else if (pName.includes('AUDI')) searchBrand = 'AUDI';
                else if (pName.includes('PORSCHE')) searchBrand = 'PORSCHE';
                else if (pName.includes('VW') || pName.includes('VOLKSWAGEN')) searchBrand = 'VW';
                else if (pName.includes('SEAT')) searchBrand = 'SEAT';
                else if (pName.includes('SKODA')) searchBrand = 'SKODA';
                else if (pName.includes('SCANIA')) searchBrand = 'SCANIA';

                if (searchBrand && searchBrand !== 'VOG') {
                    const res = await pool.query('SELECT * FROM master_products WHERE brand ILIKE $1 ORDER BY id ASC LIMIT 1', [`%${searchBrand}%`]);
                    if (res.rows.length > 0) mpMatch = res.rows[0];
                }
            }

            if (mpMatch) {
                const targetSku = mpMatch.sku;
                const targetCode39 = mpMatch.code39 || mpMatch.sku;

                await pool.query(
                    'UPDATE sales SET sku = $1, code39 = $2 WHERE id = $3',
                    [targetSku, targetCode39, s.id]
                );
                fixedSales++;
            } else if (s.sku && s.sku.startsWith('SKU-VOG-')) {
                const brandPrefix = (s.brand || 'VOG').toUpperCase().replace(/[^A-Z0-9]/g, '');
                const cleanSkuBase = `P${brandPrefix}${s.order_id || '1000'}`;
                const cleanSku = cleanSz ? `${cleanSkuBase}-${cleanSz}` : cleanSkuBase;

                await pool.query(
                    'UPDATE sales SET sku = $1, code39 = $2 WHERE id = $3',
                    [cleanSku, cleanSku, s.id]
                );
                fixedSales++;
            }
        }
        console.log(`✅ Fixed ${fixedSales} sales records.`);

    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await pool.end();
    }
}

fixExistingSkus();
