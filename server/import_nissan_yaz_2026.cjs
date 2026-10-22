const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { execSync } = require('child_process');
require('dotenv').config({ path: __dirname + '/.env' });

let XLSX;
try {
    XLSX = require('xlsx');
} catch (e) {
    console.log('xlsx module not found, installing if needed...');
}

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'vog_db',
    password: process.env.DB_PASSWORD || '150609',
    port: process.env.DB_PORT || 5432,
});

function runSqlcmd(sqlQuery) {
    const tmpSql = path.join(__dirname, `tmp_nissan_yaz_${Date.now()}_${Math.floor(Math.random() * 10000)}.sql`);
    fs.writeFileSync(tmpSql, sqlQuery, 'utf8');
    const cmd = `sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -f 65001 -w 65535 -y 0 -i "${tmpSql}"`;
    try {
        const out = execSync(cmd, { encoding: 'utf8', windowsHide: true });
        try { fs.unlinkSync(tmpSql); } catch (_) {}
        return out;
    } catch (err) {
        try { fs.unlinkSync(tmpSql); } catch (_) {}
        throw err;
    }
}

function esc(val, maxLen) {
    if (val === null || val === undefined) return 'NULL';
    let s = String(val).replace(/'/g, "''").trim();
    if (maxLen && s.length > maxLen) s = s.substring(0, maxLen);
    return `N'${s}'`;
}

const rawData = [
    // 1. Servis Danışmanı Tshirt - Erkek
    { barcode: "901020100101", brand: "Nissan", name: "Servis Danışmanı Tshirt - Erkek-XS", code: "KIYAFETYAZ-TSHIRT-SRVDAN-XS" },
    { barcode: "901020100102", brand: "Nissan", name: "Servis Danışmanı Tshirt - Erkek-S", code: "KIYAFETYAZ-TSHIRT-SRVDAN-S" },
    { barcode: "901020100103", brand: "Nissan", name: "Servis Danışmanı Tshirt - Erkek-M", code: "KIYAFETYAZ-TSHIRT-SRVDAN-M" },
    { barcode: "901020100104", brand: "Nissan", name: "Servis Danışmanı Tshirt - Erkek-L", code: "KIYAFETYAZ-TSHIRT-SRVDAN-L" },
    { barcode: "901020100105", brand: "Nissan", name: "Servis Danışmanı Tshirt - Erkek-XL", code: "KIYAFETYAZ-TSHIRT-SRVDAN-XL" },
    { barcode: "901020100106", brand: "Nissan", name: "Servis Danışmanı Tshirt - Erkek-2XL", code: "KIYAFETYAZ-TSHIRT-SRVDAN-2XL" },
    { barcode: "901020100107", brand: "Nissan", name: "Servis Danışmanı Tshirt - Erkek-3XL", code: "KIYAFETYAZ-TSHIRT-SRVDAN-3XL" },
    { barcode: "901020100108", brand: "Nissan", name: "Servis Danışmanı Tshirt - Erkek-4XL", code: "KIYAFETYAZ-TSHIRT-SRVDAN-4XL" },

    // 2. Servis Danışmanı Tshirt - Kadın
    { barcode: "901120100101", brand: "Nissan", name: "Servis Danışmanı Tshirt - Kadın-XS", code: "KIYAFETYAZ-TSHIRT-SRVDANBYN-XS" },
    { barcode: "901120100102", brand: "Nissan", name: "Servis Danışmanı Tshirt - Kadın-S", code: "KIYAFETYAZ-TSHIRT-SRVDANBYN-S" },
    { barcode: "901120100103", brand: "Nissan", name: "Servis Danışmanı Tshirt - Kadın-M", code: "KIYAFETYAZ-TSHIRT-SRVDANBYN-M" },
    { barcode: "901120100104", brand: "Nissan", name: "Servis Danışmanı Tshirt - Kadın-L", code: "KIYAFETYAZ-TSHIRT-SRVDANBYN-L" },
    { barcode: "901120100105", brand: "Nissan", name: "Servis Danışmanı Tshirt - Kadın-XL", code: "KIYAFETYAZ-TSHIRT-SRVDANBYN-XL" },
    { barcode: "901120100106", brand: "Nissan", name: "Servis Danışmanı Tshirt - Kadın-2XL", code: "KIYAFETYAZ-TSHIRT-SRVDANBYN-2XL" },
    { barcode: "901120100107", brand: "Nissan", name: "Servis Danışmanı Tshirt - Kadın-3XL", code: "KIYAFETYAZ-TSHIRT-SRVDANBYN-3XL" },
    { barcode: "901120100108", brand: "Nissan", name: "Servis Danışmanı Tshirt - Kadın-4XL", code: "KIYAFETYAZ-TSHIRT-SRVDANBYN-4XL" },

    // 3. Yedek Parça Tshirt
    { barcode: "901220100101", brand: "Nissan", name: "Yedek Parça Tshirt-XS", code: "KIYAFETYAZ-TSHIRT-YP-XS" },
    { barcode: "901220100102", brand: "Nissan", name: "Yedek Parça Tshirt-S", code: "KIYAFETYAZ-TSHIRT-YP-S" },
    { barcode: "901220100103", brand: "Nissan", name: "Yedek Parça Tshirt-M", code: "KIYAFETYAZ-TSHIRT-YP-M" },
    { barcode: "901220100104", brand: "Nissan", name: "Yedek Parça Tshirt-L", code: "KIYAFETYAZ-TSHIRT-YP-L" },
    { barcode: "901220100105", brand: "Nissan", name: "Yedek Parça Tshirt-XL", code: "KIYAFETYAZ-TSHIRT-YP-XL" },
    { barcode: "901220100106", brand: "Nissan", name: "Yedek Parça Tshirt-2XL", code: "KIYAFETYAZ-TSHIRT-YP-2XL" },
    { barcode: "901220100107", brand: "Nissan", name: "Yedek Parça Tshirt-3XL", code: "KIYAFETYAZ-TSHIRT-YP-3XL" },
    { barcode: "901220100108", brand: "Nissan", name: "Yedek Parça Tshirt-4XL", code: "KIYAFETYAZ-TSHIRT-YP-4XL" },

    // 4. Yıkamacı Tshirt
    { barcode: "901320100101", brand: "Nissan", name: "Yıkamacı Tshirt-XS", code: "KIYAFETYAZ-TSHIRT-YKMC-XS" },
    { barcode: "901320100102", brand: "Nissan", name: "Yıkamacı Tshirt-S", code: "KIYAFETYAZ-TSHIRT-YKMC-S" },
    { barcode: "901320100103", brand: "Nissan", name: "Yıkamacı Tshirt-M", code: "KIYAFETYAZ-TSHIRT-YKMC-M" },
    { barcode: "901320100104", brand: "Nissan", name: "Yıkamacı Tshirt-L", code: "KIYAFETYAZ-TSHIRT-YKMC-L" },
    { barcode: "901320100105", brand: "Nissan", name: "Yıkamacı Tshirt-XL", code: "KIYAFETYAZ-TSHIRT-YKMC-XL" },
    { barcode: "901320100106", brand: "Nissan", name: "Yıkamacı Tshirt-2XL", code: "KIYAFETYAZ-TSHIRT-YKMC-2XL" },
    { barcode: "901320100107", brand: "Nissan", name: "Yıkamacı Tshirt-3XL", code: "KIYAFETYAZ-TSHIRT-YKMC-3XL" },
    { barcode: "901320100108", brand: "Nissan", name: "Yıkamacı Tshirt-4XL", code: "KIYAFETYAZ-TSHIRT-YKMC-4XL" },

    // 5. Master Teknisyen Tshirt
    { barcode: "901420100101", brand: "Nissan", name: "Master Teknisyen Tshirt-XS", code: "KIYAFETYAZ-TSHIRT-MASTER-XS" },
    { barcode: "901420100102", brand: "Nissan", name: "Master Teknisyen Tshirt-S", code: "KIYAFETYAZ-TSHIRT-MASTER-S" },
    { barcode: "901420100103", brand: "Nissan", name: "Master Teknisyen Tshirt-M", code: "KIYAFETYAZ-TSHIRT-MASTER-M" },
    { barcode: "901420100104", brand: "Nissan", name: "Master Teknisyen Tshirt-L", code: "KIYAFETYAZ-TSHIRT-MASTER-L" },
    { barcode: "901420100105", brand: "Nissan", name: "Master Teknisyen Tshirt-XL", code: "KIYAFETYAZ-TSHIRT-MASTER-XL" },
    { barcode: "901420100106", brand: "Nissan", name: "Master Teknisyen Tshirt-2XL", code: "KIYAFETYAZ-TSHIRT-MASTER-2XL" },
    { barcode: "901420100107", brand: "Nissan", name: "Master Teknisyen Tshirt-3XL", code: "KIYAFETYAZ-TSHIRT-MASTER-3XL" },
    { barcode: "901420100108", brand: "Nissan", name: "Master Teknisyen Tshirt-4XL", code: "KIYAFETYAZ-TSHIRT-MASTER-4XL" },

    // 6. Teknisyen Tshirt
    { barcode: "901520100101", brand: "Nissan", name: "Teknisyen Tshirt-XS", code: "KIYAFETYAZ-TSHIRT-TEKNISYEN-XS" },
    { barcode: "901520100102", brand: "Nissan", name: "Teknisyen Tshirt-S", code: "KIYAFETYAZ-TSHIRT-TEKNISYEN-S" },
    { barcode: "901520100103", brand: "Nissan", name: "Teknisyen Tshirt-M", code: "KIYAFETYAZ-TSHIRT-TEKNISYEN-M" },
    { barcode: "901520100104", brand: "Nissan", name: "Teknisyen Tshirt-L", code: "KIYAFETYAZ-TSHIRT-TEKNISYEN-L" },
    { barcode: "901520100105", brand: "Nissan", name: "Teknisyen Tshirt-XL", code: "KIYAFETYAZ-TSHIRT-TEKNISYEN-XL" },
    { barcode: "901520100106", brand: "Nissan", name: "Teknisyen Tshirt-2XL", code: "KIYAFETYAZ-TSHIRT-TEKNISYEN-2XL" },
    { barcode: "901520100107", brand: "Nissan", name: "Teknisyen Tshirt-3XL", code: "KIYAFETYAZ-TSHIRT-TEKNISYEN-3XL" },
    { barcode: "901520100108", brand: "Nissan", name: "Teknisyen Tshirt-4XL", code: "KIYAFETYAZ-TSHIRT-TEKNISYEN-4XL" },

    // 7. Formen Tshirt
    { barcode: "901620100101", brand: "Nissan", name: "Formen Tshirt-XS", code: "KIYAFETYAZ-TSHIRT-FORMEN-XS" },
    { barcode: "901620100102", brand: "Nissan", name: "Formen Tshirt-S", code: "KIYAFETYAZ-TSHIRT-FORMEN-S" },
    { barcode: "901620100103", brand: "Nissan", name: "Formen Tshirt-M", code: "KIYAFETYAZ-TSHIRT-FORMEN-M" },
    { barcode: "901620100104", brand: "Nissan", name: "Formen Tshirt-L", code: "KIYAFETYAZ-TSHIRT-FORMEN-L" },
    { barcode: "901620100105", brand: "Nissan", name: "Formen Tshirt-XL", code: "KIYAFETYAZ-TSHIRT-FORMEN-XL" },
    { barcode: "901620100106", brand: "Nissan", name: "Formen Tshirt-2XL", code: "KIYAFETYAZ-TSHIRT-FORMEN-2XL" },
    { barcode: "901620100107", brand: "Nissan", name: "Formen Tshirt-3XL", code: "KIYAFETYAZ-TSHIRT-FORMEN-3XL" },
    { barcode: "901620100108", brand: "Nissan", name: "Formen Tshirt-4XL", code: "KIYAFETYAZ-TSHIRT-FORMEN-4XL" },

    // 8. Vale Tshirt
    { barcode: "901720100101", brand: "Nissan", name: "Vale Tshirt-XS", code: "KIYAFETYAZ-TSHIRT-VALE-XS" },
    { barcode: "901720100102", brand: "Nissan", name: "Vale Tshirt-S", code: "KIYAFETYAZ-TSHIRT-VALE-S" },
    { barcode: "901720100103", brand: "Nissan", name: "Vale Tshirt-M", code: "KIYAFETYAZ-TSHIRT-VALE-M" },
    { barcode: "901720100104", brand: "Nissan", name: "Vale Tshirt-L", code: "KIYAFETYAZ-TSHIRT-VALE-L" },
    { barcode: "901720100105", brand: "Nissan", name: "Vale Tshirt-XL", code: "KIYAFETYAZ-TSHIRT-VALE-XL" },
    { barcode: "901720100106", brand: "Nissan", name: "Vale Tshirt-2XL", code: "KIYAFETYAZ-TSHIRT-VALE-2XL" },
    { barcode: "901720100107", brand: "Nissan", name: "Vale Tshirt-3XL", code: "KIYAFETYAZ-TSHIRT-VALE-3XL" },
    { barcode: "901720100108", brand: "Nissan", name: "Vale Tshirt-4XL", code: "KIYAFETYAZ-TSHIRT-VALE-4XL" },

    // 9. Pantolon (Master - Teknisyen - Formen)
    { barcode: "903020100101", brand: "Nissan", name: "Pantolon(Master - Teknisyen - Formen)-XS", code: "KIYAFETYAZ-PANTOLON-XS" },
    { barcode: "903020100102", brand: "Nissan", name: "Pantolon(Master - Teknisyen - Formen)-S", code: "KIYAFETYAZ-PANTOLON-S" },
    { barcode: "903020100103", brand: "Nissan", name: "Pantolon(Master - Teknisyen - Formen)-M", code: "KIYAFETYAZ-PANTOLON-M" },
    { barcode: "903020100104", brand: "Nissan", name: "Pantolon(Master - Teknisyen - Formen)-L", code: "KIYAFETYAZ-PANTOLON-L" },
    { barcode: "903020100105", brand: "Nissan", name: "Pantolon(Master - Teknisyen - Formen)-XL", code: "KIYAFETYAZ-PANTOLON-XL" },
    { barcode: "903020100106", brand: "Nissan", name: "Pantolon(Master - Teknisyen - Formen)-2XL", code: "KIYAFETYAZ-PANTOLON-2XL" },
    { barcode: "903020100107", brand: "Nissan", name: "Pantolon(Master - Teknisyen - Formen)-3XL", code: "KIYAFETYAZ-PANTOLON-3XL" },
    { barcode: "903020100108", brand: "Nissan", name: "Pantolon(Master - Teknisyen - Formen)-4XL", code: "KIYAFETYAZ-PANTOLON-4XL" }
];

function deriveMetadata(item) {
    const code = item.code;
    const name = item.name;

    const szMatch = code.match(/-(XS|S|M|L|XL|2XL|3XL|4XL|5XL|6XL|7XL|8XL|9XL)$/i);
    const size = szMatch ? szMatch[1].toUpperCase() : 'STANDART';

    let gender = 'UNISEX';
    if (name.includes('Kadın') || code.includes('BYN')) gender = 'KADIN';
    else if (name.includes('Erkek')) gender = 'ERKEK';

    // Calculate EAN-13 check digit if barcode is 12 digits
    let barcode13 = String(item.barcode).trim();
    if (/^\d{12}$/.test(barcode13)) {
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            const digit = parseInt(barcode13[i], 10);
            sum += (i % 2 === 0) ? digit : digit * 3;
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        barcode13 = `${barcode13}${checkDigit}`;
    }

    return {
        sku: barcode13,
        product_name: name,
        color: 'STANDART',
        size: size,
        clean_size: size,
        ean13: barcode13,
        barcode: barcode13,
        code39: item.code,
        brand: 'NISSAN',
        gender: gender,
        price: 500.00
    };
}

async function runImport() {
    console.log('🚀 Starting Nissan Yaz 2026 Excel creation and PostgreSQL master_products import...\n');

    // Add missing columns if needed
    try {
        await pool.query('ALTER TABLE master_products ADD COLUMN IF NOT EXISTS grup VARCHAR(100)');
        await pool.query('ALTER TABLE master_products ADD COLUMN IF NOT EXISTS brand VARCHAR(100)');
        await pool.query('ALTER TABLE master_products ADD COLUMN IF NOT EXISTS gender VARCHAR(50)');
        await pool.query('ALTER TABLE master_products ADD COLUMN IF NOT EXISTS code39 TEXT');
    } catch (e) {}

    // 1. Create Excel file
    if (XLSX) {
        const excelRows = rawData.map(r => ({
            'BARKOD NUMARASI': r.barcode,
            '1- Firma Adı': r.brand,
            '2- Ürün Adı': r.name,
            '3- Ürün Kodu': r.code,
            'FORMATI': 'EAN 13'
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelRows);
        XLSX.utils.book_append_sheet(wb, ws, 'NISSAN YAZ 2026');

        const excelPath = path.join(__dirname, '..', 'NISSAN 2026 YAZ PARÇA KODLARI.xlsx');
        XLSX.writeFile(wb, excelPath);
        console.log(`✅ Excel file generated: ${excelPath}`);
    }

    // 2. Import into PostgreSQL master_products
    let insertedCount = 0;
    let updatedCount = 0;

    for (const item of rawData) {
        const meta = deriveMetadata(item);

        try {
            const check = await pool.query('SELECT id FROM master_products WHERE sku = $1', [meta.sku]);
            if (check.rows.length > 0) {
                await pool.query(`
                    UPDATE master_products SET
                        product_name = $2,
                        color = $3,
                        size = $4,
                        clean_size = $5,
                        ean13 = $6,
                        barcode = $7,
                        code39 = $8,
                        brand = $9,
                        gender = $10,
                        price = $11,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE sku = $1;
                `, [
                    meta.sku, meta.product_name, meta.color, meta.size, meta.clean_size,
                    meta.ean13, meta.barcode, meta.code39, meta.brand, meta.gender, meta.price
                ]);
                updatedCount++;
            } else {
                await pool.query(`
                    INSERT INTO master_products (
                        sku, product_name, color, size, clean_size, ean13, barcode, code39, brand, gender, price, created_at, updated_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                    );
                `, [
                    meta.sku, meta.product_name, meta.color, meta.size, meta.clean_size,
                    meta.ean13, meta.barcode, meta.code39, meta.brand, meta.gender, meta.price
                ]);
                insertedCount++;
            }
        } catch (err) {
            console.error(`❌ Error importing SKU ${meta.sku}:`, err.message);
        }
    }

    console.log(`\n🎉 Successfully processed 72 items into PostgreSQL master_products!`);
    console.log(`   ➕ New Inserts: ${insertedCount}`);
    console.log(`   🔄 Updated Records: ${updatedCount}`);

    // 3. Ingest into MSSQL [SIPARIS].[dbo].[MasterUrunler]
    console.log('\n📦 3. Ingesting into MSSQL [SIPARIS].[dbo].[MasterUrunler]...');
    try {
        let mssqlSql = `
        USE [SIPARIS];
        SET NOCOUNT ON;
        `;

        for (const item of rawData) {
            const meta = deriveMetadata(item);
            mssqlSql += `
            IF EXISTS (SELECT 1 FROM [MasterUrunler] WHERE [ParcaNo] = ${esc(meta.sku, 100)})
                UPDATE [MasterUrunler] SET
                    [UrunAdi] = ${esc(meta.product_name, 255)},
                    [Renk] = ${esc(meta.color, 100)},
                    [Beden] = ${esc(meta.size, 50)},
                    [CleanBeden] = ${esc(meta.clean_size, 50)},
                    [Barkod] = ${esc(meta.barcode, 100)},
                    [Ean13] = ${esc(meta.ean13, 50)},
                    [Code39] = ${esc(meta.code39, 100)},
                    [Marka] = N'NISSAN',
                    [Grup] = N'YAZ',
                    [Cinsiyet] = ${esc(meta.gender, 50)},
                    [Fiyat] = ${meta.price},
                    [UpdatedAt] = GETDATE()
                WHERE [ParcaNo] = ${esc(meta.sku, 100)};
            ELSE
                INSERT INTO [MasterUrunler] (
                    [ParcaNo], [UrunAdi], [Renk], [Beden], [CleanBeden],
                    [Barkod], [Ean13], [Code39], [Marka], [Grup], [Cinsiyet], [Fiyat],
                    [CreatedAt], [UpdatedAt]
                ) VALUES (
                    ${esc(meta.sku, 100)}, ${esc(meta.product_name, 255)}, ${esc(meta.color, 100)},
                    ${esc(meta.size, 50)}, ${esc(meta.clean_size, 50)}, ${esc(meta.barcode, 100)},
                    ${esc(meta.ean13, 50)}, ${esc(meta.code39, 100)}, N'NISSAN', N'YAZ',
                    ${esc(meta.gender, 50)}, ${meta.price}, GETDATE(), GETDATE()
                );
            `;
        }
        runSqlcmd(mssqlSql);
        console.log(`   ✅ MSSQL MasterUrunler synchronized with 72 items.`);
    } catch (err) {
        console.error('❌ MSSQL sync error:', err.message);
    }

    await pool.end();
}

runImport();

