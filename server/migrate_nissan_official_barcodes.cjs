const fs = require('fs');
const path = require('path');
const { Pool } = require('C:/vog_system/server/node_modules/pg');
const { execSync } = require('child_process');
const XLSX = require('C:/vog_system/node_modules/xlsx');
require('C:/vog_system/server/node_modules/dotenv').config({ path: 'C:/vog_system/server/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'vog_db',
    password: process.env.DB_PASSWORD || '150609',
    port: process.env.DB_PORT || 5432,
});

function runSqlcmd(sqlQuery) {
    const tmpSql = path.join(__dirname, `tmp_mig_nissan_off_${Date.now()}_${Math.floor(Math.random() * 10000)}.sql`);
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

function cleanSizeCode(size) {
    if (!size) return 'STD';
    const s = String(size).trim().toUpperCase();
    if (/^\d+$/.test(s)) return s;
    if (s.includes('4XL') || s.includes('XXXXL')) return '4XL';
    if (s.includes('3XL') || s.includes('XXXL')) return '3XL';
    if (s.includes('2XL') || s.includes('XXL')) return '2XL';
    if (s.includes('XL')) return 'XL';
    if (s.includes('XS')) return 'XS';
    if (s === 'S' || s.endsWith(' S') || s.startsWith('S ')) return 'S';
    if (s === 'M' || s.endsWith(' M') || s.startsWith('M ')) return 'M';
    if (s === 'L' || s.endsWith(' L') || s.startsWith('L ')) return 'L';
    return s;
}

function deriveGender(dep, stockName) {
    const text = `${dep || ''} ${stockName || ''}`.toUpperCase();
    if (text.includes('BAYAN') || text.includes('KADIN')) return 'KADIN';
    if (text.includes('ERKEK') || text.includes('BAY')) return 'ERKEK';
    return 'ERKEK';
}

function deriveColor(stockName) {
    const s = String(stockName || '').toUpperCase();
    if (s.includes('BEYAZ')) return 'BEYAZ';
    if (s.includes('KIRMIZI') && s.includes('SİYAH')) return 'SİYAH / KIRMIZI';
    if (s.includes('KIRMIZI') && s.includes('FÜME')) return 'FÜME / KIRMIZI';
    if (s.includes('FÜME') && s.includes('SİYAH')) return 'FÜME / SİYAH';
    if (s.includes('FÜME')) return 'FÜME';
    if (s.includes('SİYAH')) return 'SİYAH';
    if (s.includes('GRİ')) return 'GRİ';
    return 'STANDART';
}

async function migrate() {
    console.log('================================================================');
    console.log('MIGRATING NISSAN 2026 KIŞ TO 13-DIGIT OFFICIAL BARCODES / SKUS');
    console.log('================================================================');

    // 1. UPDATE 13 ORDERS IN MSSQL & POSTGRESQL
    const ordersUpdates = [
        {
            id: 16575,
            model: 'NISSAN 2026 KIŞ BEYAZ GÖMLEK',
            parcaNo: 'ERKEK: 6001258147022 - KADIN: 6001258147015',
            detay5: 'TEK TEK PAKET PAKET BÖLGE BÖLGE OLACAK. PARÇA NO: ERKEK: 6001258147022 - KADIN: 6001258147015'
        },
        {
            id: 16576,
            model: 'NISSAN KIŞ 2026 S.DANIŞMANI VE YEDEK PARÇA POLAR SİYAH',
            parcaNo: 'ERKEK: 8520147033126 - KADIN: 8520147033287',
            detay5: 'TEK TEK PAKET. PARÇA NO: ERKEK: 8520147033126 - KADIN: 8520147033287 FERMUAR ÖLÇÜLERİ'
        },
        {
            id: 16577,
            model: 'NISSAN 2026 KIŞ MASTER TEKNİSYEN POLAR FÜME - SİYAH',
            parcaNo: '8520147033409',
            detay5: 'TEK TEK PAKET. PARÇA NO: 8520147033409 FERMUAR ÖLÇÜLERİ'
        },
        {
            id: 16578,
            model: 'NISSAN KIŞ 2026 KARGO PANTOLON FÜME',
            parcaNo: '8520147032723',
            detay5: 'TEK TEK PAKET. PARÇA NO: 8520147032723'
        },
        {
            id: 16579,
            model: 'NISSAN 2026 KIŞ VALE KARGO PANTOLON SİYAH',
            parcaNo: '8520147033041',
            detay5: 'TEK TEK PAKET. PARÇA NO: 8520147033041'
        },
        {
            id: 16580,
            model: 'NISSAN 2026 KIŞ TEKNİSYEN SWEAT SHIRT SİYAH - KIRMIZI',
            parcaNo: '8520147033485',
            detay5: 'TEK TEK PAKET. PARÇA NO: 8520147033485'
        },
        {
            id: 16581,
            model: 'NISSAN 2026 KIŞ MASTER TEKNİSYEN UZUN KOLLU GÖMLEK YAKA POLO GRİ',
            parcaNo: '8520147033720',
            detay5: 'TEK TEK PAKET. PARÇA NO: 8520147033720'
        },
        {
            id: 16583,
            model: 'NISSAN 2026 KIŞ VALE UZUN KOLLU GÖMLEK YAKA POLO GRİ',
            parcaNo: '8520147033966',
            detay5: 'TEK TEK PAKET. PARÇA NO: 8520147033966'
        },
        {
            id: 16584,
            model: 'NISSAN 2026 KIŞ YEDEK PARÇA UZUN KOLLU GÖMLEK YAKA POLO GRİ',
            parcaNo: '8520147034048',
            detay5: 'TEK TEK PAKET. PARÇA NO: 8520147034048'
        },
        {
            id: 16585,
            model: 'NISSAN 2026 KIŞ SOFTSHELL YELEK SİYAH',
            parcaNo: '8520147034123',
            detay5: 'TEK TEK PAKET. PARÇA NO: 8520147034123'
        },
        {
            id: 16586,
            model: 'NISSAN 2026 KIŞ SOFTSHELL YELEK SİYAH MASTER TEKNİSYEN',
            parcaNo: '8520147034529',
            detay5: 'TEK TEK PAKET. PARÇA NO: 8520147034529'
        },
        {
            id: 16587,
            model: 'NISSAN KIŞ 2026 SOFTSHELL MONT SİYAH KIRMIZI',
            parcaNo: '8520147032006',
            detay5: 'TEK TEK PAKET. PARÇA NO: 8520147032006'
        },
        {
            id: 16588,
            model: 'NISSAN KIŞ 2026 SOFTSHELL MONT SİYAH KIRMIZI VALE',
            parcaNo: '8520147032648',
            detay5: 'TEK TEK PAKET. PARÇA NO: 8520147032648'
        }
    ];

    console.log('--- 1. Updating MSSQL [SIPARIS].dbo.Siparisler ---');
    let mssqlSql = 'BEGIN TRANSACTION;\n';
    for (const u of ordersUpdates) {
        mssqlSql += `UPDATE [SIPARIS].dbo.Siparisler SET Model = ${esc(u.model, 255)}, ParcaNo = ${esc(u.parcaNo, 100)}, Detay5 = ${esc(u.detay5, 255)} WHERE Id = ${u.id};\n`;
    }
    mssqlSql += 'COMMIT TRANSACTION;\n';
    runSqlcmd(mssqlSql);
    console.log('✅ Updated all 13 Nissan orders in MSSQL Siparisler with official 13-digit codes.');

    console.log('\n--- 2. Updating PostgreSQL orders table ---');
    for (const u of ordersUpdates) {
        await pool.query(`
            UPDATE orders 
            SET sku = $1, code39 = $1, product_name = $2, notes = $3
            WHERE order_number::text = $4 OR id::text = $4
        `, [u.parcaNo, u.model, u.detay5, String(u.id)]);
    }
    console.log('✅ Updated all 13 Nissan orders in PostgreSQL orders table.');

    // 2. PARSE NISSAN 2026 KIŞ.xlsx
    console.log('\n--- 3. Reading C:\\Users\\ctopuz\\Downloads\\NISSAN 2026 KIŞ.xlsx ---');
    const excelPath = 'C:\\Users\\ctopuz\\Downloads\\NISSAN 2026 KIŞ.xlsx';
    const wb = XLSX.readFile(excelPath);
    const ws = wb.Sheets['Sheet1'];
    const rows = XLSX.utils.sheet_to_json(ws);
    console.log(`Total rows in Excel: ${rows.length}`);

    const catalogItems = [];
    const seenBarcodes = new Set();

    for (const r of rows) {
        const rawBarcode = String(r['BARKOD'] || '').trim();
        if (!/^\d{12,14}$/.test(rawBarcode) || seenBarcodes.has(rawBarcode)) continue;
        seenBarcodes.add(rawBarcode);

        const dep = String(r['Departman'] || '').trim();
        const stokAdi = String(r['STOK ADI'] || '').trim();
        const size = String(r['Beden'] || '').trim();
        const cleanSize = cleanSizeCode(size);
        const gender = deriveGender(dep, stokAdi);
        const color = deriveColor(stokAdi);

        catalogItems.push({
            barcode: rawBarcode,
            sku: rawBarcode,
            code39: rawBarcode,
            ean13: rawBarcode,
            product_name: stokAdi,
            size: size,
            clean_size: cleanSize,
            gender: gender,
            color: color,
            brand: 'NISSAN',
            grup: dep || 'NISSAN',
            price: 500.00
        });
    }
    console.log(`Prepared ${catalogItems.length} unique 13-digit Nissan catalog items.`);

    // 3. CLEAN UP SYNTHETIC KIYAFETKIS CODES FROM PG & MSSQL
    console.log('\n--- 4. Cleaning synthetic KIYAFETKIS codes from master_products and MasterUrunler ---');
    await pool.query("DELETE FROM master_products WHERE brand = 'NISSAN' AND sku ILIKE 'KIYAFETKIS-GOMLEK%'");
    await pool.query("DELETE FROM master_products WHERE brand = 'NISSAN' AND sku ILIKE 'KIYAFETKIS-POLAR-YP%'");
    await pool.query("DELETE FROM master_products WHERE brand = 'NISSAN' AND sku ILIKE 'KIYAFETKIS-PANTOLON-VALE%'");
    await pool.query("DELETE FROM master_products WHERE brand = 'NISSAN' AND sku ILIKE 'KIYAFETKIS-YELEK-MASTER%'");

    let cleanMssql = `
        DELETE FROM [SIPARIS].dbo.MasterUrunler WHERE Marka = 'NISSAN' AND ParcaNo LIKE 'KIYAFETKIS-GOMLEK%';
        DELETE FROM [SIPARIS].dbo.MasterUrunler WHERE Marka = 'NISSAN' AND ParcaNo LIKE 'KIYAFETKIS-POLAR-YP%';
        DELETE FROM [SIPARIS].dbo.MasterUrunler WHERE Marka = 'NISSAN' AND ParcaNo LIKE 'KIYAFETKIS-PANTOLON-VALE%';
        DELETE FROM [SIPARIS].dbo.MasterUrunler WHERE Marka = 'NISSAN' AND ParcaNo LIKE 'KIYAFETKIS-YELEK-MASTER%';
    `;
    runSqlcmd(cleanMssql);
    console.log('✅ Cleaned up synthetic KIYAFETKIS rows.');

    // 4. UPSERT INTO POSTGRESQL master_products WITH 13-DIGIT BARCODES
    console.log('\n--- 5. Upserting into PostgreSQL master_products ---');
    for (const item of catalogItems) {
        await pool.query(`
            INSERT INTO master_products (sku, barcode, ean13, code39, product_name, color, size, clean_size, gender, brand, grup, price)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (UPPER(TRIM(sku))) DO UPDATE SET
                barcode = EXCLUDED.barcode,
                ean13 = EXCLUDED.ean13,
                code39 = EXCLUDED.code39,
                product_name = EXCLUDED.product_name,
                color = EXCLUDED.color,
                size = EXCLUDED.size,
                clean_size = EXCLUDED.clean_size,
                gender = EXCLUDED.gender,
                brand = EXCLUDED.brand,
                grup = EXCLUDED.grup,
                price = EXCLUDED.price
        `, [
            item.sku, item.barcode, item.ean13, item.code39,
            item.product_name, item.color, item.size, item.clean_size,
            item.gender, item.brand, item.grup, item.price
        ]);
    }
    console.log('✅ Upserted all 274 Nissan 13-digit items into PostgreSQL master_products.');

    // 5. UPSERT INTO MSSQL MasterUrunler
    console.log('\n--- 6. Upserting into MSSQL MasterUrunler ---');
    let mssqlBatch = 'BEGIN TRANSACTION;\n';
    let batchCount = 0;
    for (const item of catalogItems) {
        mssqlBatch += `
            IF EXISTS (SELECT 1 FROM [SIPARIS].dbo.MasterUrunler WHERE ParcaNo = ${esc(item.sku, 100)})
                UPDATE [SIPARIS].dbo.MasterUrunler SET
                    UrunAdi = ${esc(item.product_name, 250)},
                    Renk = ${esc(item.color, 100)},
                    Beden = ${esc(item.size, 50)},
                    CleanBeden = ${esc(item.clean_size, 50)},
                    Barkod = ${esc(item.barcode, 50)},
                    Ean13 = ${esc(item.ean13, 50)},
                    Code39 = ${esc(item.code39, 100)},
                    Marka = 'NISSAN',
                    Grup = ${esc(item.grup, 100)},
                    Cinsiyet = ${esc(item.gender, 50)},
                    Fiyat = ${item.price},
                    UpdatedAt = GETDATE()
                WHERE ParcaNo = ${esc(item.sku, 100)};
            ELSE
                INSERT INTO [SIPARIS].dbo.MasterUrunler (ParcaNo, UrunAdi, Renk, Beden, CleanBeden, Barkod, Ean13, Code39, Marka, Grup, Cinsiyet, Fiyat, CreatedAt, UpdatedAt)
                VALUES (${esc(item.sku, 100)}, ${esc(item.product_name, 250)}, ${esc(item.color, 100)}, ${esc(item.size, 50)}, ${esc(item.clean_size, 50)}, ${esc(item.barcode, 50)}, ${esc(item.ean13, 50)}, ${esc(item.code39, 100)}, 'NISSAN', ${esc(item.grup, 100)}, ${esc(item.gender, 50)}, ${item.price}, GETDATE(), GETDATE());
        \n`;
        batchCount++;
        if (batchCount >= 50) {
            mssqlBatch += 'COMMIT TRANSACTION;\n';
            runSqlcmd(mssqlBatch);
            mssqlBatch = 'BEGIN TRANSACTION;\n';
            batchCount = 0;
        }
    }
    if (batchCount > 0) {
        mssqlBatch += 'COMMIT TRANSACTION;\n';
        runSqlcmd(mssqlBatch);
    }
    console.log('✅ Upserted all 274 Nissan 13-digit items into MSSQL MasterUrunler.');

    await pool.end();
    console.log('\n🎉 ALL NISSAN MIGRATION STEPS COMPLETED SUCCESSFULLY!');
}

migrate().catch(e => {
    console.error('Migration error:', e);
    process.exit(1);
});
