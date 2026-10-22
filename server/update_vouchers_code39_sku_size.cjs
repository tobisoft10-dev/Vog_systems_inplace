const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

function formatCode39(sku, size) {
    if (!sku) return '';
    const cleanSize = (size || '').replace(/beden/gi, '').trim();
    if (!cleanSize || cleanSize.includes('XXS-9XL')) {
        return sku;
    }
    const upperSku = sku.toUpperCase();
    const upperSize = cleanSize.toUpperCase();
    if (upperSku.endsWith('-' + upperSize) || upperSku.endsWith(upperSize)) {
        return sku;
    }
    return `${sku}-${cleanSize}`;
}

async function updateVouchersCode39() {
    console.log('🚀 Updating vouchers table code39 field to sku + size combination...');

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const vouchersRes = await client.query('SELECT id, sku, size, code39 FROM vouchers');
        console.log(`📌 Found ${vouchersRes.rows.length} rows in vouchers table.`);

        let updatedCount = 0;
        for (const row of vouchersRes.rows) {
            const newCode39 = formatCode39(row.sku, row.size);
            if (newCode39 && newCode39 !== row.code39) {
                await client.query('UPDATE vouchers SET code39 = $1 WHERE id = $2', [newCode39, row.id]);
                console.log(`Updated ID ${row.id}: SKU "${row.sku}" + Size "${row.size}" -> code39 "${newCode39}"`);
                updatedCount++;
            }
        }

        await client.query('COMMIT');
        console.log(`✅ vouchers table updated successfully: ${updatedCount} rows updated.`);

        // Inspect updated rows
        const sample = await client.query('SELECT id, order_id, sku, size, code39 FROM vouchers ORDER BY id DESC LIMIT 15');
        console.log('\n📋 Sample updated vouchers rows:');
        console.log(sample.rows);
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Error updating vouchers code39:', e.message);
    } finally {
        client.release();
        await pool.end();
    }
}

updateVouchersCode39();
