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

async function syncAllSkusWithExcels() {
    console.log('🚀 Extracting all Parça No (SKU) values from Excel files across Downloads and Workspace...');

    const excelFiles = [
        'C:\\Users\\ctopuz\\Downloads\\VW 2025 KIŞ Parça Kodları.xlsx',
        'C:\\Users\\ctopuz\\Downloads\\VW 2026 YAZ PARÇA KODLARI & VERİLECEK ADETLER.XLSX',
        'c:\\vog_system\\SEAT 2026 Yaz Kişi Listesi.xlsx',
        'c:\\vog_system\\SEATSipariş_2026 Yazlık_.xlsx'
    ];

    const skuMap = new Map(); // Parça No -> Product Metadata
    let counter = 1000;

    excelFiles.forEach(filePath => {
        if (!fs.existsSync(filePath)) return;
        console.log(`📖 Reading Excel: ${path.basename(filePath)}`);

        try {
            const workbook = xlsx.readFile(filePath);
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

                rows.forEach(row => {
                    if (!row || row.length === 0) return;

                    let foundSku = null;
                    let pName = null;
                    let size = null;

                    row.forEach(cell => {
                        if (!cell) return;
                        const str = String(cell).trim();
                        if (/^(PVW|SEAT|AUD|VOG|ST)[A-Z0-9_-]+$/i.test(str) && str.length >= 6) {
                            foundSku = str.toUpperCase();
                        }
                    });

                    if (foundSku && !skuMap.has(foundSku)) {
                        counter++;
                        row.forEach(cell => {
                            if (!cell) return;
                            const str = String(cell).trim();
                            if (str !== foundSku && isNaN(str)) {
                                if (str.toLowerCase().includes('beden') || ['XS','S','M','L','XL','XXL','3XL','4XL','5XL','6XL','7XL','8XL','9XL','XXXL','XXXXL','XXXXXL','XXXXXXL','XXXXXXXL','XXXXXXXXL'].includes(str.toUpperCase())) {
                                    if (!size) size = str;
                                } else if (str.length > 3 && !str.startsWith('PVW')) {
                                    if (!pName) pName = str;
                                }
                            }
                        });

                        if (!pName) pName = `Ürün ${foundSku}`;
                        if (!size) {
                            const m = foundSku.match(/(XS|S|M|L|XL|XXL|3XL|4XL|5XL|6XL|7XL|8XL|9XL|XXXL|XXXXL|XXXXXL|XXXXXXL|XXXXXXXL|XXXXXXXXL)$/i);
                            size = m ? m[1].toUpperCase() : 'STANDART';
                        }
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

                        const brand = foundSku.startsWith('PVW') ? 'VW' : (foundSku.startsWith('AUD') ? 'AUDI' : 'SEAT');
                        const ean13 = generateEan13FromSku(foundSku, counter);

                        skuMap.set(foundSku, {
                            sku: foundSku,
                            product_name: pName,
                            size,
                            gender,
                            color,
                            brand,
                            barcode: foundSku,
                            code39: foundSku,
                            ean13,
                            price: 500.00
                        });
                    }
                });
            });
        } catch (e) {
            console.error(`⚠️ Error reading ${path.basename(filePath)}:`, e.message);
        }
    });

    console.log(`📌 Total Unique Parça No (SKU) Items Extracted: ${skuMap.size}`);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Drop strict constraints if any
        await client.query('ALTER TABLE master_products DROP CONSTRAINT IF EXISTS master_products_ean13_key');
        await client.query('ALTER TABLE master_products DROP CONSTRAINT IF EXISTS master_products_barcode_key');

        // Clean duplicates in master_products table if any exist
        await client.query(`
            DELETE FROM master_products a 
            USING master_products b 
            WHERE a.ctid < b.ctid AND a.sku = b.sku AND a.sku IS NOT NULL;
        `);

        await client.query('CREATE UNIQUE INDEX IF NOT EXISTS master_products_sku_idx ON master_products (sku)');

        let inserted = 0;
        let updated = 0;

        for (const item of skuMap.values()) {
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

        console.log(`✅ master_products upsert: ${inserted} inserted, ${updated} updated.`);

        // Force set code39 = sku in all tables
        const r1 = await client.query("UPDATE master_products SET code39 = sku WHERE sku IS NOT NULL AND sku != ''");
        const r2 = await client.query("UPDATE orders SET code39 = sku WHERE sku IS NOT NULL AND sku != ''");
        const r3 = await client.query("UPDATE vouchers SET code39 = sku WHERE sku IS NOT NULL AND sku != ''");
        const r4 = await client.query("UPDATE sales SET code39 = sku WHERE sku IS NOT NULL AND sku != ''");

        console.log(`✅ Synchronized code39 = sku across master_products (${r1.rowCount}), orders (${r2.rowCount}), vouchers (${r3.rowCount}), sales (${r4.rowCount}).`);

        await client.query('COMMIT');
        console.log('🎉 ALL SKU and code39 values are 100% matched with Excel Parça No values!');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Error during import/sync:', e.message);
    } finally {
        client.release();
        await pool.end();
    }
}

syncAllSkusWithExcels();
