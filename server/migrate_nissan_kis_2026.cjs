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
    const tmpSql = path.join(__dirname, `tmp_mig_nissan_${Date.now()}_${Math.floor(Math.random() * 10000)}.sql`);
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

function getCleanSku(dep, stockName, size, barcode, seenSkus) {
    const s = stockName.toUpperCase();
    const d = dep.toUpperCase();
    const sz = size.toUpperCase().trim();

    let sku = '';
    // Gömlek
    if (s.includes('GOMLEK BEYAZ KADIN')) sku = `KIYAFETKIS-GOMLEK-SRVDANBYN-${sz}`;
    else if (s.includes('GOMLEK BEYAZ ERKEK')) sku = `KIYAFETKIS-GOMLEK-SRVDAN-${sz}`;

    // Mont
    else if (d.includes('VALE') && s.includes('MONT')) sku = `KIYAFETKIS-MONT-VALE-${sz}`;
    else if (d.includes('BAYAN') && s.includes('MONT')) sku = `KIYAFETKIS-MONT-SRVDANBYN-${sz}`;
    else if (d.includes('SERVİS DANISMANI') && s.includes('MONT')) sku = `KIYAFETKIS-MONT-SRVDAN-${sz}`;
    else if (d.includes('MASTER') && s.includes('MONT')) sku = `KIYAFETKIS-MONT-MASTER-${sz}`;
    else if (d.includes('FORMEN') && s.includes('MONT')) sku = `KIYAFETKIS-MONT-FORMEN-${sz}`;
    else if (d.includes('YIKAMACI') && s.includes('MONT')) sku = `KIYAFETKIS-MONT-YKMC-${sz}`;
    else if (d.includes('YEDEK PARCA') && s.includes('MONT')) sku = `KIYAFETKIS-MONT-YP-${sz}`;
    else if (s.includes('MONT')) sku = `KIYAFETKIS-MONT-TEKNISYEN-${sz}`;

    // Pantolon
    else if (d.includes('VALE') && s.includes('PANTOLON')) sku = `KIYAFETKIS-PANTOLON-VALE-${sz}`;
    else if (d.includes('YIKAMACI') && s.includes('PANTOLON')) sku = `KIYAFETKIS-PANTOLON-YKMC-${sz}`;
    else if (d.includes('MASTER') && s.includes('PANTOLON')) sku = `KIYAFETKIS-PANTOLON-MASTER-${sz}`;
    else if (d.includes('FORMEN') && s.includes('PANTOLON')) sku = `KIYAFETKIS-PANTOLON-FORMEN-${sz}`;
    else if (s.includes('PANTOLON')) sku = `KIYAFETKIS-PANTOLON-${sz}`;

    // Polar
    else if (d.includes('YEDEK PARCA') && (d.includes('BAYAN') || s.includes('BAYAN')) && s.includes('POLAR')) sku = `KIYAFETKIS-POLAR-YPBYN-${sz}`;
    else if ((d.includes('BAYAN') || s.includes('BAYAN')) && s.includes('POLAR')) sku = `KIYAFETKIS-POLAR-SRVDANBYN-${sz}`;
    else if (d.includes('MASTER') && s.includes('POLAR')) sku = `KIYAFETKIS-POLAR-MASTER-${sz}`;
    else if (d.includes('YEDEK PARCA') && s.includes('POLAR')) sku = `KIYAFETKIS-POLAR-YP-${sz}`;
    else if (s.includes('POLAR')) sku = `KIYAFETKIS-POLAR-${sz}`;

    // Sweat
    else if ((d.includes('BAYAN') || s.includes('BAYAN')) && s.includes('SWEAT')) sku = `KIYAFETKIS-SWEAT-SRVDANBYN-${sz}`;
    else if (d.includes('SERVİS') && s.includes('SWEAT')) sku = `KIYAFETKIS-SWEAT-SRVDAN-${sz}`;
    else if (d.includes('VALE') && s.includes('SWEAT')) sku = `KIYAFETKIS-SWEAT-VALE-${sz}`;
    else if (d.includes('YEDEK PARCA') && s.includes('SWEAT')) sku = `KIYAFETKIS-SWEAT-YP-${sz}`;
    else if (d.includes('MASTER') && s.includes('SWEAT')) sku = `KIYAFETKIS-SWEAT-MASTER-${sz}`;
    else if (d.includes('FORMEN') && s.includes('SWEAT')) sku = `KIYAFETKIS-SWEAT-FORMEN-${sz}`;
    else if (d.includes('YIKAMACI') && s.includes('SWEAT')) sku = `KIYAFETKIS-SWEAT-YKMC-${sz}`;
    else if (s.includes('SWEAT')) sku = `KIYAFETKIS-SWEAT-TEKNISYEN-${sz}`;

    // Yelek
    else if ((d.includes('BAYAN') || s.includes('BAYAN')) && s.includes('YELEK')) sku = `KIYAFETKIS-YELEK-BYN-${sz}`;
    else if (d.includes('SERVİS') && s.includes('YELEK')) sku = `KIYAFETKIS-YELEK-SRVDAN-${sz}`;
    else if (d.includes('MASTER') && s.includes('YELEK')) sku = `KIYAFETKIS-YELEK-MASTER-${sz}`;
    else if (d.includes('FORMEN') && s.includes('YELEK')) sku = `KIYAFETKIS-YELEK-FORMEN-${sz}`;
    else if (d.includes('YEDEK PARCA') && s.includes('YELEK')) sku = `KIYAFETKIS-YELEK-YP-${sz}`;
    else if (s.includes('YELEK')) sku = `KIYAFETKIS-YELEK-${sz}`;
    else sku = `KIYAFETKIS-OTHER-${sz}`;

    if (seenSkus && seenSkus.has(sku)) {
        sku = `${sku}-${barcode.slice(-4)}`;
    }
    if (seenSkus) seenSkus.add(sku);
    return sku;
}

async function migrate() {
    console.log('================================================================');
    console.log('STARTING NISSAN 2026 KIŞ MIGRATION');
    console.log('================================================================');

    // 1. UPDATE MSSQL SIPARISLER (16575 - 16588)
    console.log('\n--- 1. Updating MSSQL [SIPARIS].dbo.Siparisler ---');
    const ordersUpdates = [
        {
            id: 16575,
            model: 'NISSAN 2026 KIŞ BEYAZ GÖMLEK',
            parcaNo: 'ERKEK: KIYAFETKIS-GOMLEK-SRVDAN - KADIN: KIYAFETKIS-GOMLEK-SRVDANBYN',
            detay5: 'TEK TEK PAKET PAKET BÖLGE BÖLGE OLACAK. PARÇA NO: ERKEK: KIYAFETKIS-GOMLEK-SRVDAN - KADIN: KIYAFETKIS-GOMLEK-SRVDANBYN'
        },
        {
            id: 16576,
            model: 'NISSAN KIŞ 2026 S.DANIŞMANI VE YEDEK PARÇA POLAR SİYAH',
            parcaNo: 'ERKEK: KIYAFETKIS-POLAR-YP - KADIN: KIYAFETKIS-POLAR-YPBYN',
            detay5: 'TEK TEK PAKET PARÇA NO: ERKEK: KIYAFETKIS-POLAR-YP - KADIN: KIYAFETKIS-POLAR-YPBYN FERMUAR ÖLÇÜLERİ'
        },
        {
            id: 16577,
            model: 'NISSAN 2026 KIŞ MASTER TEKNİSYEN POLAR FÜME - SİYAH',
            parcaNo: 'KIYAFETKIS-POLAR-MASTER',
            detay5: 'TEK TEK PAKET PARÇA NO: KIYAFETKIS-POLAR-MASTER FERMUAR ÖLÇÜLERİ'
        },
        {
            id: 16578,
            model: 'NISSAN KIŞ 2026 KARGO PANTOLON FÜME',
            parcaNo: 'KIYAFETKIS-PANTOLON',
            detay5: 'TEK TEK PAKET PARÇA NO: KIYAFETKIS-PANTOLON'
        },
        {
            id: 16579,
            model: 'NISSAN 2026 KIŞ VALE KARGO PANTOLON SİYAH',
            parcaNo: 'KIYAFETKIS-PANTOLON-VALE',
            detay5: 'TEK TEK PAKET PARÇA NO: KIYAFETKIS-PANTOLON-VALE'
        },
        {
            id: 16580,
            model: 'NISSAN 2026 KIŞ TEKNİSYEN SWEAT SHIRT SİYAH - KIRMIZI',
            parcaNo: 'KIYAFETKIS-SWEAT-TEKNISYEN',
            detay5: 'TEK TEK PAKET PARÇA NO: KIYAFETKIS-SWEAT-TEKNISYEN'
        },
        {
            id: 16581,
            model: 'NISSAN 2026 KIŞ MASTER TEKNİSYEN UZUN KOLLU GÖMLEK YAKA POLO GRİ',
            parcaNo: 'KIYAFETKIS-SWEAT-MASTER',
            detay5: 'TEK TEK PAKET OLACAK. PARÇA NO: KIYAFETKIS-SWEAT-MASTER'
        },
        {
            id: 16583,
            model: 'NISSAN 2026 KIŞ VALE UZUN KOLLU GÖMLEK YAKA POLO GRİ',
            parcaNo: 'KIYAFETKIS-SWEAT-VALE',
            detay5: 'TEK TEK PAKET OLACAK. PARÇA NO: KIYAFETKIS-SWEAT-VALE'
        },
        {
            id: 16584,
            model: 'NISSAN 2026 KIŞ YEDEK PARÇA UZUN KOLLU GÖMLEK YAKA POLO GRİ',
            parcaNo: 'KIYAFETKIS-SWEAT-YP',
            detay5: 'TEK TEK PAKET OLACAK. PARÇA NO: KIYAFETKIS-SWEAT-YP'
        },
        {
            id: 16585,
            model: 'NISSAN 2026 KIŞ SOFTSHELL YELEK SİYAH',
            parcaNo: 'KIYAFETKIS-YELEK',
            detay5: 'TEK TEK PAKET PARÇA NO: KIYAFETKIS-YELEK'
        },
        {
            id: 16586,
            model: 'NISSAN 2026 KIŞ SOFTSHELL YELEK SİYAH MASTER TEKNİSYEN',
            parcaNo: 'KIYAFETKIS-YELEK-MASTER',
            detay5: 'TEK TEK PAKET PARÇA NO: KIYAFETKIS-YELEK-MASTER'
        },
        {
            id: 16587,
            model: 'NISSAN KIŞ 2026 SOFTSHELL MONT SİYAH KIRMIZI',
            parcaNo: 'KIYAFETKIS-MONT',
            detay5: 'TEK TEK PAKET. PARÇA NO: KIYAFETKIS-MONT'
        },
        {
            id: 16588,
            model: 'NISSAN KIŞ 2026 SOFTSHELL MONT SİYAH KIRMIZI VALE',
            parcaNo: 'KIYAFETKIS-MONT-VALE',
            detay5: 'TEK TEK PAKET. PARÇA NO: KIYAFETKIS-MONT-VALE'
        }
    ];

    let mssqlSql = 'BEGIN TRANSACTION;\n';
    for (const u of ordersUpdates) {
        mssqlSql += `UPDATE [SIPARIS].dbo.Siparisler SET Model = ${esc(u.model, 255)}, ParcaNo = ${esc(u.parcaNo, 100)}, Detay5 = ${esc(u.detay5, 255)} WHERE Id = ${u.id};\n`;
    }
    mssqlSql += 'COMMIT TRANSACTION;\n';
    console.log(runSqlcmd(mssqlSql));
    console.log('✅ Updated all 13 Nissan 2026 Kış orders in MSSQL [SIPARIS].dbo.Siparisler.');

    // 2. UPDATE POSTGRESQL orders TABLE (if rows exist)
    console.log('\n--- 2. Checking & Updating PostgreSQL orders ---');
    for (const u of ordersUpdates) {
        const pgUp = await pool.query(`
            UPDATE orders 
            SET sku = $1, code39 = $1, product_name = $2, notes = $3
            WHERE order_number::text = $4 OR id::text = $4
        `, [u.parcaNo, u.model, u.detay5, String(u.id)]);
        if (pgUp.rowCount > 0) {
            console.log(`Updated PG order ${u.id}`);
        }
    }

    // 3. READ NISSAN 2026 KIŞ.xlsx FOR MASTER PRODUCTS
    console.log('\n--- 3. Reading NISSAN 2026 KIŞ.xlsx for Master Products ---');
    const excelPath = 'C:\\Users\\ctopuz\\Downloads\\NISSAN 2026 KIŞ.xlsx';
    const wb = XLSX.readFile(excelPath);
    const ws = wb.Sheets['Sheet1'];
    const excelRows = XLSX.utils.sheet_to_json(ws);

    const items = [];
    const seenSkus = new Set();
    excelRows.forEach(r => {
        const dep = String(r['Departman'] || r['DEPARTMAN'] || '').trim();
        const stockName = String(r['STOK ADI'] || r['Stok Adi'] || '').trim();
        const size = String(r['Beden'] || r['BEDEN'] || '').trim();
        const barcode = String(r['BARKOD'] || r['Barkod'] || '').trim();
        if (!stockName || !barcode) return;

        const sku = getCleanSku(dep, stockName, size, barcode, seenSkus);
        const isFemale = dep.includes('BAYAN') || stockName.includes('BAYAN') || stockName.includes('KADIN');
        const gender = isFemale ? 'KADIN' : 'ERKEK';

        items.push({ dep, stockName, size, barcode, sku, gender });
    });
    // Generate convenient aliases for common variants so both shorthands and full codes match
    const aliasItems = [];
    items.forEach(it => {
        if (it.sku.startsWith('KIYAFETKIS-MONT-TEKNISYEN-')) {
            aliasItems.push({
                ...it,
                sku: it.sku.replace('KIYAFETKIS-MONT-TEKNISYEN-', 'KIYAFETKIS-MONT-')
            });
        } else if (it.sku.startsWith('KIYAFETKIS-POLAR-YPBYN-')) {
            aliasItems.push({
                ...it,
                sku: it.sku.replace('KIYAFETKIS-POLAR-YPBYN-', 'KIYAFETKIS-POLAR-BYN-')
            });
        } else if (it.sku.startsWith('KIYAFETKIS-PANTOLON-') && !it.sku.includes('-FORMEN-') && !it.sku.includes('-VALE-') && !it.sku.includes('-MASTER-') && !it.sku.includes('-YKMC-')) {
            aliasItems.push({
                ...it,
                sku: it.sku.replace('KIYAFETKIS-PANTOLON-', 'KIYAFETKIS-PANTOLON-TEK-')
            });
        }
    });
    console.log(`Generated ${aliasItems.length} alias items.`);
    const allProductsToInsert = [...items, ...aliasItems];

    // 4. CLEAN MSSQL MasterUrunler (Delete corrupted NaN rows, ensure clean rows)
    console.log('\n--- 4. Cleaning MSSQL MasterUrunler ---');
    let mssqlCleanSql = `
        BEGIN TRANSACTION;
        -- Delete corrupted NaN rows
        DELETE FROM [SIPARIS].dbo.MasterUrunler 
        WHERE (Marka LIKE '%NISSAN%' OR UrunAdi LIKE '%NISSAN%' OR ParcaNo LIKE '%NISSAN%')
          AND (Barkod LIKE '%NaN%' OR Ean13 LIKE '%NaN%');
    `;
    // Insert or update all items
    for (const item of allProductsToInsert) {
        mssqlCleanSql += `
            IF EXISTS (SELECT 1 FROM [SIPARIS].dbo.MasterUrunler WHERE ParcaNo = ${esc(item.sku, 100)})
            BEGIN
                UPDATE [SIPARIS].dbo.MasterUrunler 
                SET UrunAdi = ${esc(item.stockName, 255)}, 
                    Barkod = ${esc(item.barcode, 50)}, 
                    Ean13 = ${esc(item.barcode, 50)}, 
                    Beden = ${esc(item.size, 50)}, 
                    Cinsiyet = ${esc(item.gender, 20)}, 
                    Marka = N'NISSAN'
                WHERE ParcaNo = ${esc(item.sku, 100)};
            END
            ELSE
            BEGIN
                INSERT INTO [SIPARIS].dbo.MasterUrunler (UrunAdi, ParcaNo, Barkod, Ean13, Beden, Cinsiyet, Renk, Marka)
                VALUES (${esc(item.stockName, 255)}, ${esc(item.sku, 100)}, ${esc(item.barcode, 50)}, ${esc(item.barcode, 50)}, ${esc(item.size, 50)}, ${esc(item.gender, 20)}, N'STANDART', N'NISSAN');
            END
        `;
    }
    mssqlCleanSql += 'COMMIT TRANSACTION;\n';
    console.log(runSqlcmd(mssqlCleanSql));
    console.log('✅ Cleaned and synchronized MSSQL MasterUrunler.');

    // 5. NORMALIZE POSTGRESQL master_products
    console.log('\n--- 5. Normalizing PostgreSQL master_products ---');
    const allBarcodes = allProductsToInsert.map(x => x.barcode);

    // Delete existing rows for these barcodes or KIYAFETKIS so there is zero duplicate / constraint collision
    const delRes = await pool.query(`
        DELETE FROM master_products
        WHERE barcode = ANY($1) 
           OR ean13 = ANY($1)
           OR sku ILIKE 'KIYAFETKIS%'
    `, [allBarcodes]);
    console.log(`Cleared ${delRes.rowCount} old/duplicate Nissan rows from PG master_products.`);

    for (const item of allProductsToInsert) {
        await pool.query(`
            INSERT INTO master_products (brand, grup, product_name, sku, code39, size, clean_size, gender, barcode, ean13, color)
            VALUES ('NISSAN', 'NISSAN', $1, $2, $3, $4, $5, $6, $7, $8, 'STANDART')
        `, [item.stockName, item.sku, item.sku, item.size, item.size, item.gender, item.barcode, item.barcode]);
    }
    console.log(`✅ PostgreSQL master_products 100% normalized for all ${allProductsToInsert.length} Nissan items.`);

    await pool.end();
    console.log('\n================================================================');
    console.log('NISSAN 2026 KIŞ MIGRATION COMPLETED SUCCESSFULLY');
    console.log('================================================================');
}

migrate().catch(e => {
    console.error('Migration error:', e);
    process.exit(1);
});
