const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { execSync } = require('child_process');
const { Pool } = require('pg');

const pgPool = new Pool({
    connectionString: 'postgresql://postgres:150609@localhost:5432/vog_db'
});

function runSqlcmd(sqlQuery) {
    const tmpSql = path.join(__dirname, `tmp_nissan_${Date.now()}_${Math.floor(Math.random() * 10000)}.sql`);
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

function cleanTitle(str) {
    if (!str) return 'Nissan Kıyafet';
    return str
        .replace(/\b(4XL|3XL|2XL|XL|L|M|S|XS|36|38|40|42|44|46|48)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function deriveColor(str) {
    const s = String(str || '').toUpperCase();
    if (s.includes('BEYAZ')) return 'BEYAZ';
    if (s.includes('KIRMIZI') && s.includes('SİYAH')) return 'SİYAH / KIRMIZI';
    if (s.includes('KIRMIZI') && s.includes('FÜME')) return 'FÜME / KIRMIZI';
    if (s.includes('FÜME') && s.includes('SİYAH')) return 'FÜME / SİYAH';
    if (s.includes('FÜME')) return 'FÜME';
    if (s.includes('SİYAH')) return 'SİYAH';
    if (s.includes('GRİ')) return 'GRİ';
    if (s.includes('LACİVERT')) return 'LACİVERT';
    return 'STANDART';
}

async function main() {
    console.log('🚀 NISSAN 2026 KIŞ MASTER ÜRÜN & PARÇA NO GÖÇÜ');
    console.log('==================================================\n');

    // 1. Locate files
    const file1 = 'C:\\Users\\ctopuz\\Desktop\\NISSAN 2026 KIŞ.xlsx';
    const file2 = 'C:\\Users\\ctopuz\\Desktop\\nissan Kışlık Kıyafet Sipariş Formu BARKOD (1).xlsx';

    if (!fs.existsSync(file1)) {
        throw new Error(`Dosya bulunamadı: ${file1}`);
    }

    console.log('📖 1. NISSAN 2026 KIŞ.xlsx dosyası okunuyor...');
    const wb1 = xlsx.readFile(file1);
    const ws1 = wb1.Sheets['Sheet1'] || wb1.Sheets[wb1.SheetNames[0]];
    const data1 = xlsx.utils.sheet_to_json(ws1, { header: 1 });

    // Optional cross-reference for Yedek Parça Kodları (KIYAFETKIS-...)
    const yedekMap = new Map();
    if (fs.existsSync(file2)) {
        const wb2 = xlsx.readFile(file2);
        const ws2 = wb2.Sheets['Sayfa1'] || wb2.Sheets[wb2.SheetNames[0]];
        if (ws2) {
            const data2 = xlsx.utils.sheet_to_json(ws2, { header: 1 });
            for (let i = 1; i < data2.length; i++) {
                const [d1, d2, yedekKod, yedekAdi, beden, stokAdi, barkod] = data2[i];
                if (barkod && yedekKod) {
                    yedekMap.set(String(barkod).trim(), {
                        yedekKod: String(yedekKod).trim(),
                        yedekAdi: String(yedekAdi || '').trim()
                    });
                }
            }
        }
    }
    console.log(`   ✅ ${yedekMap.size} adet yedek parça kodu çapraz eşleşmesi hazır.`);

    // Extract products
    const nissanProducts = [];
    const seenBarcodes = new Set();

    for (let i = 1; i < data1.length; i++) {
        const [dept, stokAdi, beden, barkod] = data1[i];
        if (!barkod) continue;
        const bcodeStr = String(barkod).trim();
        if (!/^\d{12,14}$/.test(bcodeStr) || seenBarcodes.has(bcodeStr)) continue;
        seenBarcodes.add(bcodeStr);

        const deptStr = String(dept || 'NISSAN').trim().toUpperCase();
        const rawName = String(stokAdi || '').trim();
        const cleanName = cleanTitle(rawName);
        const sizeStr = String(beden || 'STD').trim().toUpperCase();
        const colorStr = deriveColor(rawName);
        
        let gender = 'UNISEX';
        const fullUpper = `${deptStr} ${rawName}`.toUpperCase();
        if (fullUpper.includes('BAYAN') || fullUpper.includes('KADIN')) {
            gender = 'KADIN';
        } else if (fullUpper.includes('ERKEK') || fullUpper.includes('BAY')) {
            gender = 'ERKEK';
        }

        const item = {
            sku: bcodeStr, // 13-digit barcode is the primary SKU for Nissan!
            product_name: cleanName || rawName,
            color: colorStr,
            size: sizeStr,
            clean_size: sizeStr,
            barcode: bcodeStr,
            ean13: bcodeStr,
            code39: bcodeStr,
            brand: 'NISSAN',
            grup: deptStr,
            gender,
            price: 500.00
        };

        nissanProducts.push(item);

        // If also has a yedek parça kodu (e.g. KIYAFETKIS-MONT-4XL), also add alias
        if (yedekMap.has(bcodeStr)) {
            const ym = yedekMap.get(bcodeStr);
            nissanProducts.push({
                sku: ym.yedekKod,
                product_name: ym.yedekAdi || cleanName,
                color: colorStr,
                size: sizeStr,
                clean_size: sizeStr,
                barcode: bcodeStr,
                ean13: bcodeStr,
                code39: bcodeStr,
                brand: 'NISSAN',
                grup: deptStr,
                gender,
                price: 500.00
            });
        }
    }

    console.log(`📌 Toplam ${nissanProducts.length} adet Nissan 2026 Kış varyant/parça kaydı hazırlandı.`);

    // 2. Upsert into PostgreSQL master_products
    console.log('\n📦 2. PostgreSQL master_products tablosu senkronize ediliyor...');
    const existingSkuRes = await pgPool.query('SELECT sku FROM master_products');
    const existingSkuSet = new Set(existingSkuRes.rows.map(r => String(r.sku).trim().toUpperCase()));

    let pgUpdated = 0;
    const pgToInsert = [];

    for (const p of nissanProducts) {
        if (existingSkuSet.has(p.sku.toUpperCase())) {
            await pgPool.query(`
                UPDATE master_products SET
                    product_name = $2,
                    color = CASE WHEN color IS NULL OR color = 'STANDART' THEN $3 ELSE color END,
                    size = $4,
                    clean_size = $5,
                    barcode = $6,
                    ean13 = $7,
                    code39 = $8,
                    brand = 'NISSAN',
                    grup = $9,
                    gender = $10,
                    price = $11,
                    updated_at = NOW()
                WHERE UPPER(sku) = UPPER($1)
            `, [
                p.sku, p.product_name, p.color, p.size, p.clean_size,
                p.barcode, p.ean13, p.code39, p.grup, p.gender, p.price
            ]);
            pgUpdated++;
        } else {
            pgToInsert.push(p);
            existingSkuSet.add(p.sku.toUpperCase());
        }
    }

    if (pgToInsert.length > 0) {
        const BATCH = 100;
        for (let i = 0; i < pgToInsert.length; i += BATCH) {
            const chunk = pgToInsert.slice(i, i + BATCH);
            const valStrings = [];
            const flatParams = [];
            let pIdx = 1;
            chunk.forEach(p => {
                valStrings.push(`($${pIdx}, $${pIdx+1}, $${pIdx+2}, $${pIdx+3}, $${pIdx+4}, $${pIdx+5}, $${pIdx+6}, $${pIdx+7}, $${pIdx+8}, $${pIdx+9}, $${pIdx+10}, $${pIdx+11}, NOW(), NOW())`);
                flatParams.push(p.sku, p.product_name, p.color, p.size, p.clean_size, p.barcode, p.ean13, p.code39, p.brand, p.grup, p.gender, p.price);
                pIdx += 12;
            });
            await pgPool.query(`
                INSERT INTO master_products (sku, product_name, color, size, clean_size, barcode, ean13, code39, brand, grup, gender, price, created_at, updated_at)
                VALUES ${valStrings.join(',\n')}
            `, flatParams);
        }
    }
    console.log(`   ✅ PostgreSQL master_products: ${pgToInsert.length} yeni eklendi, ${pgUpdated} güncellendi.`);

    // 3. Upsert into MSSQL [SIPARIS].[dbo].[MasterUrunler]
    console.log('\n⚡ 3. MSSQL [SIPARIS].[dbo].[MasterUrunler] tablosu senkronize ediliyor...');
    const valuesArr = nissanProducts.map(p => {
        const parcaNo = esc(p.sku, 100);
        const urunAdi = esc(p.product_name, 250);
        const renk = esc(p.color, 100);
        const beden = esc(p.size, 50);
        const cleanBeden = esc(p.clean_size, 50);
        const barkod = esc(p.barcode, 50);
        const ean13 = esc(p.ean13, 50);
        const code39 = esc(p.code39, 100);
        const marka = esc(p.brand, 100);
        const grup = esc(p.grup, 100);
        const cinsiyet = esc(p.gender, 50);
        const fiyat = parseFloat(p.price) || 500.00;

        return `(${parcaNo}, ${urunAdi}, ${renk}, ${beden}, ${cleanBeden}, ${barkod}, ${ean13}, ${code39}, ${marka}, ${grup}, ${cinsiyet}, ${fiyat}, GETDATE(), GETDATE())`;
    });

    const BATCH_SQL = 200;
    let mssqlCount = 0;
    for (let i = 0; i < valuesArr.length; i += BATCH_SQL) {
        const chunk = valuesArr.slice(i, i + BATCH_SQL);
        const insertSql = `
            MERGE [SIPARIS].[dbo].[MasterUrunler] AS Target
            USING (VALUES ${chunk.join(',\n')}) 
            AS Source (ParcaNo, UrunAdi, Renk, Beden, CleanBeden, Barkod, Ean13, Code39, Marka, Grup, Cinsiyet, Fiyat, CreatedAt, UpdatedAt)
            ON Target.ParcaNo = Source.ParcaNo
            WHEN MATCHED THEN
                UPDATE SET 
                    Target.UrunAdi = Source.UrunAdi,
                    Target.Renk = Source.Renk,
                    Target.Beden = Source.Beden,
                    Target.CleanBeden = Source.CleanBeden,
                    Target.Barkod = Source.Barkod,
                    Target.Ean13 = Source.Ean13,
                    Target.Code39 = Source.Code39,
                    Target.Marka = Source.Marka,
                    Target.Grup = Source.Grup,
                    Target.Cinsiyet = Source.Cinsiyet,
                    Target.UpdatedAt = GETDATE()
            WHEN NOT MATCHED THEN
                INSERT (ParcaNo, UrunAdi, Renk, Beden, CleanBeden, Barkod, Ean13, Code39, Marka, Grup, Cinsiyet, Fiyat, CreatedAt, UpdatedAt)
                VALUES (Source.ParcaNo, Source.UrunAdi, Source.Renk, Source.Beden, Source.CleanBeden, Source.Barkod, Source.Ean13, Source.Code39, Source.Marka, Source.Grup, Source.Cinsiyet, Source.Fiyat, Source.CreatedAt, Source.UpdatedAt);
        `;
        runSqlcmd(insertSql);
        mssqlCount += chunk.length;
    }
    console.log(`   ✅ MSSQL [SIPARIS].[dbo].[MasterUrunler]: ${mssqlCount} kayıt başarıyla senkronize edildi.`);

    // 4. Match & update all Nissan orders in MSSQL [SIPARIS].[dbo].[Siparisler]
    console.log('\n🔍 4. MSSQL Siparisler tablosundaki Nissan siparişleri taranıyor ve 13 haneli ParcaNo bağlanıyor...');
    const nissanOrdersOut = runSqlcmd(`
        SET NOCOUNT ON;
        SELECT s.Id, s.Model, s.ParcaNo, s.Detay1, s.Detay5, s.[Not]
        FROM [SIPARIS].[dbo].[Siparisler] s
        WHERE s.Model LIKE '%NISSAN%' OR s.Detay1 LIKE '%NISSAN%' OR s.Detay5 LIKE '%NISSAN%' OR s.[Not] LIKE '%NISSAN%' OR s.ParcaNo LIKE '%8520147%'
        ORDER BY s.Id ASC
        FOR JSON PATH;
    `);

    let nissanOrders = [];
    try {
        const clean = nissanOrdersOut.split(/\r?\n/).map(l => l.trim()).join('');
        if (clean) nissanOrders = JSON.parse(clean);
    } catch (e) {
        console.warn('JSON parse warning:', e.message);
    }

    console.log(`   📌 MSSQL'de ${nissanOrders.length} adet Nissan siparişi tespit edildi.`);

    // Match mapping between Nissan 2026 Kış models and base 13-digit barcodes
    const nissanModelBarcodeMap = [
        { pattern: /BEYAZ\s*G[OÖ]MLEK/i, barcode: '6001258147022' },
        { pattern: /MASTER.*POLAR/i, barcode: '8520147033409' },
        { pattern: /POLAR/i, barcode: '8520147033324' },
        { pattern: /VALE.*PANTOLON/i, barcode: '8520147033041' },
        { pattern: /PANTOLON/i, barcode: '8520147032723' },
        { pattern: /TEKN[İI]SYEN.*SWEAT/i, barcode: '8520147033485' },
        { pattern: /FORMEN.*SWEAT/i, barcode: '8520147033560' },
        { pattern: /SWEAT/i, barcode: '8520147033485' },
        { pattern: /MASTER.*G[OÖ]MLEK\s*YAKA/i, barcode: '901420100105' },
        { pattern: /VALE.*G[OÖ]MLEK\s*YAKA/i, barcode: '901720100105' },
        { pattern: /YEDEK\s*PAR[CÇ]A.*G[OÖ]MLEK\s*YAKA/i, barcode: '901220100105' },
        { pattern: /MASTER.*YELEK/i, barcode: '8520147034529' },
        { pattern: /YELEK/i, barcode: '8520147034123' },
        { pattern: /VALE.*MONT/i, barcode: '8520147032648' },
        { pattern: /MONT/i, barcode: '8520147032006' }
    ];

    let updatedOrdersCount = 0;
    const orderUpdateSqls = [];

    for (const ord of nissanOrders) {
        const fullText = `${ord.Detay5 || ''} ${ord.Detay1 || ''} ${ord.Not || ''} ${ord.Model || ''}`;
        let matchedBarcode = null;

        // Check if fullText has a 12-14 digit barcode
        const bMatch = fullText.match(/\b(8520147\d{6}|6001258\d{6}|90[0-9]{10,11})\b/);
        if (bMatch && bMatch[1]) {
            matchedBarcode = bMatch[1];
        }

        // If not explicit barcode, match by model pattern
        if (!matchedBarcode) {
            for (const item of nissanModelBarcodeMap) {
                if (item.pattern.test(ord.Model || '')) {
                    matchedBarcode = item.barcode;
                    break;
                }
            }
        }

        if (!matchedBarcode) {
            matchedBarcode = ord.ParcaNo || `PNISSAN${ord.Id}`;
        }

        if (matchedBarcode) {
            orderUpdateSqls.push(`UPDATE [SIPARIS].[dbo].[Siparisler] SET ParcaNo = N'${matchedBarcode}' WHERE Id = ${ord.Id};`);
            
            // Also sync to PostgreSQL orders
            await pgPool.query(`UPDATE orders SET sku = $1, code39 = $1, barcode = $1, ean13 = $1, brand = 'NISSAN', updated_at = NOW() WHERE order_number = $2`, [matchedBarcode, ord.Id]);
            updatedOrdersCount++;
        }
    }

    if (orderUpdateSqls.length > 0) {
        runSqlcmd(orderUpdateSqls.join('\n'));
    }

    console.log(`   ✨ ${updatedOrdersCount} adet Nissan siparişi 13 haneli parça kodu ile güncellendi.`);

    // 5. Verification
    const verifySql = `
        SET NOCOUNT ON;
        SELECT 'MasterUrunler NISSAN Toplam' as Tablo, COUNT(1) as Adet FROM [SIPARIS].[dbo].[MasterUrunler] WHERE Marka = 'NISSAN'
        UNION ALL
        SELECT 'Siparisler NISSAN 13 Hane ParcaNo', COUNT(1) FROM [SIPARIS].[dbo].[Siparisler] WHERE (Model LIKE '%NISSAN%' OR Detay1 LIKE '%NISSAN%') AND LEN(ParcaNo) >= 12;
    `;
    const verifyOut = runSqlcmd(verifySql);
    console.log('\n📊 Doğrulama Sonuçları:');
    console.log(verifyOut);

    const sampleOrders = runSqlcmd(`
        SET NOCOUNT ON;
        SELECT TOP 10 s.Id, s.ParcaNo, s.Model
        FROM [SIPARIS].[dbo].[Siparisler] s
        WHERE s.Model LIKE '%NISSAN%' OR s.Detay1 LIKE '%NISSAN%'
        ORDER BY s.Id DESC;
    `);
    console.log('📌 Güncellenen Nissan Siparişleri Örnekleri:');
    console.log(sampleOrders);

    await pgPool.end();
}

main().catch(err => {
    console.error('❌ Hata oluştu:', err);
    process.exit(1);
});
