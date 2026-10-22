const xlsx = require('xlsx');
const { Pool } = require('pg');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'vog_db',
    password: process.env.DB_PASSWORD || '150609',
    port: process.env.DB_PORT || 5432,
});

function runSqlcmd(sqlQuery) {
    const tmpSql = path.join(__dirname, `tmp_update_nissan_${Date.now()}_${Math.floor(Math.random() * 10000)}.sql`);
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

function calculateEan13(bc) {
    let s = String(bc).trim();
    if (/^\d{12}$/.test(s)) {
        let sum = 0;
        for (let i = 0; i < 12; i++) sum += parseInt(s[i], 10) * (i % 2 === 0 ? 1 : 3);
        const cd = (10 - (sum % 10)) % 10;
        return `${s}${cd}`;
    }
    return s;
}

async function updateNissanExcelPartCodes() {
    console.log('🔄 Loading Nissan Excel files...');
    const items = [];

    // 1. KIŞ
    const wbKis = xlsx.readFile('C:/vog_system/NISSAN 2026 KIŞ PARÇA KODLARI.xlsx');
    const rowsKis = xlsx.utils.sheet_to_json(wbKis.Sheets[wbKis.SheetNames[0]]);
    for (const r of rowsKis) {
        const rawBc = String(r['BARKOD NUMARASI'] || '').trim();
        const bc13 = calculateEan13(rawBc);
        const code = String(r['3- Ürün Kodu'] || '').trim();
        const name = String(r['2- Ürün Adı'] || '').trim();
        if (code && bc13) {
            items.push({
                rawBarcode: rawBc,
                barcode13: bc13,
                code: code,
                name: name,
                season: 'KIŞ'
            });
        }
    }

    // 2. YAZ
    const wbYaz = xlsx.readFile('C:/vog_system/NISSAN 2026 YAZ PARÇA KODLARI.xlsx');
    const rowsYaz = xlsx.utils.sheet_to_json(wbYaz.Sheets[wbYaz.SheetNames[0]]);
    for (const r of rowsYaz) {
        const rawBc = String(r['BARKOD NUMARASI'] || '').trim();
        const bc13 = calculateEan13(rawBc);
        const code = String(r['3- Ürün Kodu'] || '').trim();
        const name = String(r['2- Ürün Adı'] || '').trim();
        if (code && bc13) {
            items.push({
                rawBarcode: rawBc,
                barcode13: bc13,
                code: code,
                name: name,
                season: 'YAZ'
            });
        }
    }

    console.log(`✅ Loaded ${items.length} Nissan items from Excel files.\n`);

    // 1. Update PostgreSQL master_products
    console.log('📦 Updating PostgreSQL master_products (setting code39 to Excel code)...');
    let pgUpdated = 0;
    for (const it of items) {
        const res = await pool.query(`
            UPDATE master_products SET
                code39 = $1,
                barcode = $2,
                ean13 = $2,
                product_name = COALESCE(NULLIF($3, ''), product_name),
                updated_at = CURRENT_TIMESTAMP
            WHERE UPPER(brand) = 'NISSAN'
              AND (
                TRIM(barcode) = $2 OR TRIM(ean13) = $2 OR TRIM(barcode) = $4 OR TRIM(ean13) = $4
                OR TRIM(sku) = $2 OR TRIM(sku) = $4
              )
        `, [it.code, it.barcode13, it.name, it.rawBarcode]);
        pgUpdated += res.rowCount;
    }
    console.log(`✅ PostgreSQL master_products: Updated ${pgUpdated} records with exact Excel code39.\n`);

    // 2. Update MSSQL [SIPARIS].[dbo].[MasterUrunler]
    console.log('📦 Updating MSSQL [SIPARIS].[dbo].[MasterUrunler]...');
    let mssqlSql = `USE [SIPARIS]; SET NOCOUNT ON;\n`;
    let chunk = 0;
    for (const it of items) {
        mssqlSql += `
            UPDATE [MasterUrunler] SET
                [Code39] = ${esc(it.code, 100)},
                [Barkod] = ${esc(it.barcode13, 100)},
                [Ean13] = ${esc(it.barcode13, 50)},
                [UrunAdi] = COALESCE(NULLIF(${esc(it.name, 255)}, N''), [UrunAdi]),
                [UpdatedAt] = GETDATE()
            WHERE [Marka] = N'NISSAN'
              AND (
                TRIM([Barkod]) = ${esc(it.barcode13, 100)} OR TRIM([Ean13]) = ${esc(it.barcode13, 50)}
                OR TRIM([Barkod]) = ${esc(it.rawBarcode, 100)} OR TRIM([Ean13]) = ${esc(it.rawBarcode, 50)}
                OR TRIM([ParcaNo]) = ${esc(it.barcode13, 100)} OR TRIM([ParcaNo]) = ${esc(it.rawBarcode, 100)}
              );
        `;
        chunk++;
        if (chunk >= 50) {
            runSqlcmd(mssqlSql);
            mssqlSql = `USE [SIPARIS]; SET NOCOUNT ON;\n`;
            chunk = 0;
        }
    }
    if (chunk > 0) {
        runSqlcmd(mssqlSql);
    }
    console.log(`✅ MSSQL MasterUrunler updated with exact Excel Code39.\n`);

    // 3. Verification
    const pgCheck = await pool.query(`
        SELECT COUNT(*) as cnt FROM master_products
        WHERE brand = 'NISSAN' AND code39 LIKE 'KIYAFET%'
    `);
    console.log(`📊 PG master_products Nissan items with KIYAFET code39: ${pgCheck.rows[0].cnt}`);

    const mssqlCheck = runSqlcmd(`
        USE [SIPARIS];
        SET NOCOUNT ON;
        SELECT COUNT(*) FROM [MasterUrunler] WHERE [Marka] = 'NISSAN' AND [Code39] LIKE 'KIYAFET%';
    `);
    console.log(`📊 MSSQL MasterUrunler Nissan items with KIYAFET Code39: ${mssqlCheck.trim()}`);

    await pool.end();
}

updateNissanExcelPartCodes().catch(console.error);
