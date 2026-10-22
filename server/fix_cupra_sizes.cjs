const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'vog_db',
    password: process.env.DB_PASSWORD || '150609',
    port: process.env.DB_PORT || 5432,
});

async function fixCupraSizes() {
    console.log('🛠️ [REPAIR] Fixing size column for CUPRA and all long-text size rows in master_products...\n');

    try {
        const res = await pool.query(`
            SELECT id, sku, product_name, size 
            FROM master_products 
            WHERE length(size) > 10 OR size ILIKE '%CUPRA%' OR size ILIKE '%PANTOLON%' OR size ILIKE '%GÖMLEK%'
        `);

        console.log(`🔎 Found ${res.rows.length} rows with polluted long size values.`);

        const sizeList = ['XXXXXL', 'XXXXL', 'XXXL', 'XXL', 'XXS', '3XL', '2XL', '4XL', '5XL', '6XL', 'XL', 'XS', 'S', 'M', 'L'];
        const numSizes = ['32', '34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56', '58', '60', '62', '64'];

        let updatedCount = 0;

        for (const r of res.rows) {
            let trueSize = '';

            // 1. Try extracting size from SKU suffix (e.g. PCUPRA10002742 -> 42, PCUPRA100009S -> S, PCUPRA100019XXXXL -> XXXXL)
            for (const s of sizeList) {
                if (r.sku.toUpperCase().endsWith(s)) {
                    trueSize = s;
                    break;
                }
            }

            if (!trueSize) {
                for (const num of numSizes) {
                    if (r.sku.endsWith(num)) {
                        trueSize = num;
                        break;
                    }
                }
            }

            // 2. Try extracting size from size text or product_name
            if (!trueSize) {
                const matchNum = r.size.match(/\b(3[0-9]|4[0-9]|5[0-9]|6[0-0])\b/);
                if (matchNum) {
                    trueSize = matchNum[1];
                }
            }

            if (!trueSize) {
                for (const s of sizeList) {
                    const regex = new RegExp(`\\b${s}\\b`, 'i');
                    if (regex.test(r.size) || regex.test(r.product_name)) {
                        trueSize = s;
                        break;
                    }
                }
            }

            // Normalize XXXXL -> 4XL if needed or keep XXXXL / 4XL clean
            if (trueSize === 'XXXXL') trueSize = '4XL';
            if (trueSize === 'XXXL') trueSize = '3XL';

            if (!trueSize) trueSize = 'STANDART';

            // Clean product_name if it has " BEDEN" or size Pollution
            let cleanedName = r.product_name
                .replace(/\s*-\s*\d+\s*BEDEN/gi, '')
                .replace(/\s+\d+\s*BEDEN/gi, '')
                .replace(/\s+(XS|S|M|L|XL|XXL|XXXL|XXXXL)\s*BEDEN/gi, '')
                .trim();

            await pool.query(`
                UPDATE master_products 
                SET size = $1, product_name = $2 
                WHERE id = $3
            `, [trueSize, cleanedName, r.id]);

            updatedCount++;
            console.log(`   - Fixed ID ${r.id}: SKU "${r.sku}" -> New Size: "${trueSize}" | Product Name: "${cleanedName}"`);
        }

        console.log(`\n✅ Successfully repaired ${updatedCount} rows in master_products.`);

    } catch (err) {
        console.error('Repair error:', err);
    } finally {
        await pool.end();
    }
}

fixCupraSizes();
