const { Pool } = require('pg');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

function generateEan13FromSku(sku, idx) {
    const digitsOnly = sku.replace(/\D/g, '');
    const seed = (digitsOnly + String(idx || 1) + '8690011223344').substring(0, 9);
    const rawEan12 = `869${seed.padEnd(9, '0')}`;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        const digit = parseInt(rawEan12[i], 10);
        sum += (i % 2 === 0) ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return `${rawEan12}${checkDigit}`;
}

async function importDownloadsMasterProducts() {
    console.log('🚀 Starting Import of Master Products from Downloads folder...');

    const downloadsDir = 'C:\\Users\\ctopuz\\Downloads';
    const files = [
        'VW 2025 KIŞ Parça Kodları.xlsx',
        'VW 2026 YAZ PARÇA KODLARI & VERİLECEK ADETLER.XLSX'
    ];

    const masterMap = new Map();
    let counter = 1000;

    files.forEach(fileName => {
        const filePath = path.join(downloadsDir, fileName);
        if (!fs.existsSync(filePath)) return;

        const workbook = xlsx.readFile(filePath);
        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

            rows.forEach(row => {
                if (!row || row.length === 0) return;

                let sku = null;
                let pName = null;
                let size = null;

                row.forEach((cell) => {
                    if (!cell) return;
                    const str = String(cell).trim();
                    if (/^PVW[A-Z0-9]+$/i.test(str)) {
                        sku = str.toUpperCase();
                    }
                });

                if (sku && !masterMap.has(sku)) {
                    counter++;
                    row.forEach((cell) => {
                        if (!cell) return;
                        const str = String(cell).trim();
                        if (str !== sku && isNaN(str)) {
                            if (str.toLowerCase().includes('beden') || ['XS','S','M','L','XL','XXL','3XL','4XL','5XL','6XL','7XL','8XL','9XL','XXXL','XXXXL','XXXXXL','XXXXXXL','XXXXXXXL','XXXXXXXXL'].includes(str.toUpperCase())) {
                                if (!size) size = str;
                            } else if (str.length > 3 && !str.startsWith('PVW')) {
                                if (!pName) pName = str;
                            }
                        }
                    });

                    if (!pName) pName = `VW Parça ${sku}`;
                    if (!size) {
                        const m = sku.match(/(XS|S|M|L|XL|XXL|3XL|4XL|5XL|6XL|7XL|8XL|9XL|XXXL|XXXXL|XXXXXL|XXXXXXL|XXXXXXXL|XXXXXXXXL)$/i);
                        size = m ? m[1].toUpperCase() : 'STANDART';
                    }

                    // Clean size string
                    size = size.replace(/beden/gi, '').trim();

                    let gender = 'UNISEX';
                    const pUpper = pName.toUpperCase();
                    if (pUpper.includes('ERKEK') || pUpper.includes('BAY ')) gender = 'ERKEK';
                    else if (pUpper.includes('KADIN') || pUpper.includes('BAYAN')) gender = 'KADIN';

                    let color = 'STANDART';
                    if (pUpper.includes('SİYAH')) color = 'SİYAH';
                    else if (pUpper.includes('BEYAZ')) color = 'BEYAZ';
                    else if (pUpper.includes('GRİ')) color = 'GRİ';
                    else if (pUpper.includes('LACİVERT')) color = 'LACİVERT';
                    else if (pUpper.includes('FÜME')) color = 'FÜME';
                    else if (pUpper.includes('KIRMIZI')) color = 'KIRMIZI';
                    else if (pUpper.includes('MAVİ')) color = 'MAVİ';

                    const ean13 = generateEan13FromSku(sku, counter);
                    const barcode = sku;
                    const code39 = sku;

                    masterMap.set(sku, {
                        sku,
                        product_name: pName,
                        size,
                        gender,
                        color,
                        brand: 'VW',
                        barcode,
                        ean13,
                        code39,
                        price: 500.00
                    });
                }
            });
        });
    });

    console.log(`📌 Filtered & Deduplicated Master Items Count: ${masterMap.size}`);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Drop strict UNIQUE constraints on barcode/ean13 that block master updates
        await client.query('ALTER TABLE master_products DROP CONSTRAINT IF EXISTS master_products_ean13_key');
        await client.query('ALTER TABLE master_products DROP CONSTRAINT IF EXISTS master_products_barcode_key');

        // Clean duplicates in master_products table if any exist
        await client.query(`
            DELETE FROM master_products a 
            USING master_products b 
            WHERE a.ctid < b.ctid AND a.sku = b.sku AND a.sku IS NOT NULL;
        `);

        // Ensure unique index exists on sku column
        await client.query('CREATE UNIQUE INDEX IF NOT EXISTS master_products_sku_idx ON master_products (sku)');

        let inserted = 0;
        let updated = 0;

        for (const item of masterMap.values()) {
            const check = await client.query('SELECT id FROM master_products WHERE sku = $1', [item.sku]);
            if (check.rows.length > 0) {
                await client.query(
                    `UPDATE master_products 
                     SET product_name = $1, size = $2, gender = $3, color = $4, brand = $5, barcode = $6, ean13 = $7, code39 = $8, price = $9
                     WHERE sku = $10`,
                    [item.product_name, item.size, item.gender, item.color, item.brand, item.barcode, item.ean13, item.code39, item.price, item.sku]
                );
                updated++;
            } else {
                await client.query(
                    `INSERT INTO master_products (sku, barcode, ean13, code39, product_name, size, gender, color, brand, price)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                    [item.sku, item.barcode, item.ean13, item.code39, item.product_name, item.size, item.gender, item.color, item.brand, item.price]
                );
                inserted++;
            }
        }

        console.log(`✅ Master Products DB Upsert Completed: ${inserted} Inserted, ${updated} Updated.`);

        // Sync metadata across orders, vouchers, and sales
        console.log('🔄 Syncing SKU metadata across orders, vouchers, and sales tables...');
        const syncOrders = await client.query(`
            UPDATE orders o 
            SET ean13 = mp.ean13,
                barcode = mp.barcode,
                code39 = mp.code39,
                product_name = COALESCE(NULLIF(o.product_name, ''), mp.product_name),
                brand = COALESCE(NULLIF(o.brand, ''), mp.brand)
            FROM master_products mp 
            WHERE o.sku = mp.sku
        `);
        console.log(`✅ Orders synced: ${syncOrders.rowCount} rows updated.`);

        const syncVouchers = await client.query(`
            UPDATE vouchers v 
            SET ean13 = mp.ean13,
                barcode = mp.barcode,
                code39 = mp.code39,
                product_name = COALESCE(NULLIF(v.product_name, ''), mp.product_name),
                brand = COALESCE(NULLIF(v.brand, ''), mp.brand)
            FROM master_products mp 
            WHERE v.sku = mp.sku
        `);
        console.log(`✅ Vouchers synced: ${syncVouchers.rowCount} rows updated.`);

        const syncSales = await client.query(`
            UPDATE sales s 
            SET ean13 = mp.ean13,
                barcode = mp.barcode,
                code39 = mp.code39,
                product_name = COALESCE(NULLIF(s.product_name, ''), mp.product_name),
                brand = COALESCE(NULLIF(s.brand, ''), mp.brand)
            FROM master_products mp 
            WHERE s.sku = mp.sku
        `);
        console.log(`✅ Sales synced: ${syncSales.rowCount} rows updated.`);

        await client.query('COMMIT');
        console.log('🎉 ALL DB Updates and Master Products Synchronizations Completed Successfully!');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Error during import:', e.message);
    } finally {
        client.release();
        await pool.end();
    }
}

importDownloadsMasterProducts();
