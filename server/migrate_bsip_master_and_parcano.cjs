const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const xlsx = require('xlsx');
require('dotenv').config({ path: __dirname + '/.env' });

const pgPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'vog_db',
    password: process.env.DB_PASSWORD || '!719356Qse!',
    port: process.env.DB_PORT || 5432
});

function runSqlcmd(sqlScript) {
    const tmpSql = path.join(__dirname, `tmp_mig_${Date.now()}_${Math.random().toString(36).substring(7)}.sql`);
    fs.writeFileSync(tmpSql, '\uFEFF' + sqlScript, 'utf8'); // UTF-8 BOM for Turkish chars
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

function cleanParca(val) {
    if (!val) return null;
    let s = String(val).trim();
    s = s.replace(/[\r\n\t]/g, ' ').replace(/\s{2,}/g, ' ');

    // Extract PAUDI..., PVWK..., PSEAT..., PCUPRA..., PSKD..., PPORSCHE..., PFOR..., PSCANIA...
    const pMatch = s.match(/\b(P[A-Z0-9_-]{5,30})\b/i);
    if (pMatch) return pMatch[1].trim();

    // Extract Nissan 12-14 digit barcode
    const nissanMatch = s.match(/\b(8520147\d{6}|90[0-9]{10,11})\b/);
    if (nissanMatch) return nissanMatch[1].trim();

    // Extract PARÇA NO: xxx
    const parcaMatch = s.match(/PAR[CÇ]A\s*NO\s*:\s*([A-Za-z0-9_-]+)/i);
    if (parcaMatch && parcaMatch[1] && !/^(YOK|BEKLIYOR|YEDEK)$/i.test(parcaMatch[1])) {
        return parcaMatch[1].trim();
    }

    // Extract K-OG... or KIYAFET...
    const kMatch = s.match(/\b(K-[A-Z0-9_-]+|KIYAFET[A-Z0-9_-]+)\b/i);
    if (kMatch) return kMatch[1].trim();

    return null;
}

async function main() {
    console.log('🚀 BSİP MS SQL MasterUrunler & Siparisler.ParcaNo Göçü Başlatılıyor...\n');

    // 1. Fetch from PostgreSQL master_products
    console.log('📦 1. PostgreSQL master_products tablosundan ürünler çekiliyor...');
    const pgRes = await pgPool.query(`
        SELECT sku, product_name, color, size, clean_size, barcode, ean13, code39, brand, grup, gender, price
        FROM master_products
        WHERE sku IS NOT NULL AND TRIM(sku) != ''
    `);
    console.log(`   ✅ ${pgRes.rows.length} kayıt PostgreSQL master_products'tan çekildi.`);

    // 2. Read Desktop / Project Excels for latest catalog entries
    const excelProducts = [];

    // VW 2026 Kış
    const vwExcelPath = 'C:\\Users\\ctopuz\\Desktop\\VW 2026 KIŞ Parça Kodları (1).xlsx';
    if (fs.existsSync(vwExcelPath)) {
        try {
            const wb = xlsx.readFile(vwExcelPath);
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
            for (const r of data) {
                if (r && r[0] && r[4] && typeof r[4] === 'string' && /^PVW/i.test(r[4].trim())) {
                    excelProducts.push({
                        sku: r[4].trim(),
                        product_name: String(r[0]).trim(),
                        color: 'FÜME / SİYAH',
                        size: r[3] ? String(r[3]).replace(/Beden/i, '').trim() : 'STD',
                        clean_size: r[3] ? String(r[3]).replace(/Beden/i, '').trim() : 'STD',
                        barcode: null,
                        ean13: null,
                        code39: r[4].trim(),
                        brand: 'VOLKSWAGEN',
                        grup: 'ATÖLYE PERSONELİ',
                        gender: 'ERKEK',
                        price: 500.00
                    });
                }
            }
            console.log(`   ✅ VW 2026 Kış Excel'inden ${excelProducts.length} ürün eklendi.`);
        } catch (e) {
            console.warn('   ⚠️ VW Excel okuma hatası:', e.message);
        }
    }

    // Nissan 2026 Kış
    const nissanExcelPath = 'C:\\Users\\ctopuz\\Desktop\\NISSAN 2026 KIŞ.xlsx';
    if (fs.existsSync(nissanExcelPath)) {
        try {
            const wb = xlsx.readFile(nissanExcelPath);
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
            let nissanCnt = 0;
            for (let i = 1; i < data.length; i++) {
                const r = data[i];
                if (r && r[3] && /^\d{12,14}$/.test(String(r[3]).trim())) {
                    const bc = String(r[3]).trim();
                    excelProducts.push({
                        sku: bc,
                        product_name: r[1] ? String(r[1]).trim() : 'NISSAN KIŞLIK',
                        color: 'STANDART',
                        size: r[2] ? String(r[2]).trim() : 'STD',
                        clean_size: r[2] ? String(r[2]).trim() : 'STD',
                        barcode: bc,
                        ean13: bc,
                        code39: bc,
                        brand: 'NISSAN',
                        grup: r[0] ? String(r[0]).trim() : 'NISSAN',
                        gender: 'UNISEX',
                        price: 500.00
                    });
                    nissanCnt++;
                }
            }
            console.log(`   ✅ Nissan 2026 Kış Excel'inden ${nissanCnt} ürün eklendi.`);
        } catch (e) {
            console.warn('   ⚠️ Nissan Excel okuma hatası:', e.message);
        }
    }

    // Combine all products
    const allProducts = [...pgRes.rows, ...excelProducts];
    console.log(`\n📌 Toplam işlenecek Master Ürün sayısı: ${allProducts.length}`);

    // Clean existing MasterUrunler in MSSQL to ensure pure sync
    console.log('🧹 MSSQL [SIPARIS].[dbo].[MasterUrunler] temizleniyor...');
    runSqlcmd('TRUNCATE TABLE [SIPARIS].[dbo].[MasterUrunler];');

    // 3. Bulk Insert into [SIPARIS].[dbo].[MasterUrunler]
    console.log('⚡ MSSQL [SIPARIS].[dbo].[MasterUrunler] tablosuna toplu veri aktarılıyor...');
    const BATCH_SIZE = 500;
    let insertedMaster = 0;

    for (let i = 0; i < allProducts.length; i += BATCH_SIZE) {
        const chunk = allProducts.slice(i, i + BATCH_SIZE);
        const valuesArr = chunk.map(p => {
            const parcaNo = esc(p.sku, 100);
            const urunAdi = esc(p.product_name || 'Tekstil Ürünü', 250);
            const renk = esc(p.color || 'STANDART', 100);
            const beden = esc(p.size || 'STD', 50);
            const cleanBeden = esc(p.clean_size || p.size || 'STD', 50);
            const barkod = esc(p.barcode || p.ean13 || p.sku, 50);
            const ean13 = esc(p.ean13 || p.barcode, 50);
            const code39 = esc(p.code39 || p.sku, 100);
            const marka = esc(p.brand || 'GENEL', 100);
            const grup = esc(p.grup || p.brand || 'GENEL', 100);
            const cinsiyet = esc(p.gender || 'UNISEX', 50);
            const fiyat = parseFloat(p.price) || 500.00;

            return `(${parcaNo}, ${urunAdi}, ${renk}, ${beden}, ${cleanBeden}, ${barkod}, ${ean13}, ${code39}, ${marka}, ${grup}, ${cinsiyet}, ${fiyat}, GETDATE(), GETDATE())`;
        });

        const insertSql = `
            INSERT INTO [SIPARIS].[dbo].[MasterUrunler] 
            (ParcaNo, UrunAdi, Renk, Beden, CleanBeden, Barkod, Ean13, Code39, Marka, Grup, Cinsiyet, Fiyat, CreatedAt, UpdatedAt)
            VALUES ${valuesArr.join(',\n')};
        `;

        runSqlcmd(insertSql);
        insertedMaster += chunk.length;
        if (insertedMaster % 5000 === 0 || insertedMaster === allProducts.length) {
            console.log(`   ✨ ${insertedMaster} / ${allProducts.length} master ürün aktarıldı.`);
        }
    }
    console.log(`✅ [SIPARIS].[dbo].[MasterUrunler] tablosuna toplam ${insertedMaster} ürün kaydedildi.\n`);

    // 4. Fetch orders from PostgreSQL (order_number -> sku mapping)
    console.log('🔄 2. PostgreSQL orders tablosundaki mevcut sipariş eşleşmeleri alınıyor...');
    const pgOrdersRes = await pgPool.query(`
        SELECT order_number, sku, brand 
        FROM orders 
        WHERE sku IS NOT NULL AND TRIM(sku) != '' AND sku NOT LIKE 'PVOG%'
    `);
    const pgOrderSkuMap = new Map();
    for (const r of pgOrdersRes.rows) {
        pgOrderSkuMap.set(parseInt(r.order_number), r.sku.trim());
    }
    console.log(`   ✅ ${pgOrderSkuMap.size} adet doğrulanmış sipariş-SKU eşleşmesi hafızaya alındı.`);

    // 5. Fetch all MSSQL orders to populate ParcaNo
    console.log('🔍 3. MSSQL Siparisler tablosu taranıyor ve ParcaNo dolduruluyor...');
    const tmpOrdersJson = path.join(__dirname, `tmp_orders_${Date.now()}.json`);
    const qOrders = `SELECT s.Id, s.Model, s.Detay5, s.Detay1, s.Detay2, s.[Not] FROM [SIPARIS].[dbo].[Siparisler] s ORDER BY s.Id ASC FOR JSON PATH`;
    execSync(`sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -f 65001 -w 65535 -y 0 -o "${tmpOrdersJson}" -Q "SET NOCOUNT ON; ${qOrders}"`, { windowsHide: true });
    
    let mssqlOrders = [];
    if (fs.existsSync(tmpOrdersJson)) {
        const raw = fs.readFileSync(tmpOrdersJson, 'utf8');
        try { fs.unlinkSync(tmpOrdersJson); } catch (_) {}
        const clean = raw.split(/\r?\n/).map(l => l.trim()).join('');
        if (clean) mssqlOrders = JSON.parse(clean);
    }

    console.log(`   📌 MSSQL'de ${mssqlOrders.length} sipariş bulundu.`);

    // Prepare update batches
    const updateStatements = [];
    let matchedCount = 0;

    for (const ord of mssqlOrders) {
        const orderId = ord.Id;
        let parcaNo = null;

        // Method 1: Check PostgreSQL verified order sku
        if (pgOrderSkuMap.has(orderId)) {
            parcaNo = pgOrderSkuMap.get(orderId);
        }

        // Method 2: Extract from Detay5
        if (!parcaNo && ord.Detay5) {
            parcaNo = cleanParca(ord.Detay5);
        }

        // Method 3: Extract from Detay1 or Not
        if (!parcaNo && ord.Detay1) {
            parcaNo = cleanParca(ord.Detay1);
        }
        if (!parcaNo && ord.Not) {
            parcaNo = cleanParca(ord.Not);
        }

        // Method 4: If still null, generate clean base SKU
        if (!parcaNo) {
            let brand = 'VOG';
            const fullStr = `${ord.Model || ''} ${ord.Detay1 || ''} ${ord.Not || ''}`.toUpperCase();
            if (fullStr.includes('VOLKSWAGEN') || fullStr.includes('VW')) brand = 'VW';
            else if (fullStr.includes('AUDI')) brand = 'AUDI';
            else if (fullStr.includes('SEAT')) brand = 'SEAT';
            else if (fullStr.includes('CUPRA')) brand = 'CUPRA';
            else if (fullStr.includes('NISSAN')) brand = 'NISSAN';
            else if (fullStr.includes('SKODA')) brand = 'SKODA';
            else if (fullStr.includes('PORSCHE')) brand = 'PORSCHE';
            else if (fullStr.includes('FORD')) brand = 'FORD';

            parcaNo = `P${brand}${orderId}`;
        }

        if (parcaNo) {
            const escapedParca = parcaNo.replace(/'/g, "''").trim().substring(0, 100);
            updateStatements.push(`UPDATE [SIPARIS].[dbo].[Siparisler] SET ParcaNo = N'${escapedParca}' WHERE Id = ${orderId};`);
            matchedCount++;
        }
    }

    console.log(`   🎯 ${matchedCount} / ${mssqlOrders.length} sipariş için ParcaNo üretildi. MSSQL'e uygulanıyor...`);

    const UPDATE_BATCH = 500;
    for (let i = 0; i < updateStatements.length; i += UPDATE_BATCH) {
        const batch = updateStatements.slice(i, i + UPDATE_BATCH);
        runSqlcmd(batch.join('\n'));
        if ((i + batch.length) % 2500 === 0 || (i + batch.length) === updateStatements.length) {
            console.log(`   ✨ ${i + batch.length} / ${updateStatements.length} sipariş ParcaNo güncellendi.`);
        }
    }

    console.log('\n🎉 GÖÇ TAMAMLANDI! Sonuçlar doğrulanıyor...');

    // Verification queries
    const verifyOut = runSqlcmd(`
        SET NOCOUNT ON;
        SELECT 'MasterUrunler Toplam' as Tablo, COUNT(1) as Adet FROM [SIPARIS].[dbo].[MasterUrunler]
        UNION ALL
        SELECT 'Siparisler Toplam', COUNT(1) FROM [SIPARIS].[dbo].[Siparisler]
        UNION ALL
        SELECT 'Siparisler ParcaNo Dolu', COUNT(1) FROM [SIPARIS].[dbo].[Siparisler] WHERE ParcaNo IS NOT NULL AND LEN(ParcaNo) > 0;
    `);
    console.log(verifyOut);

    const sampleOut = runSqlcmd(`
        SET NOCOUNT ON;
        SELECT TOP 10 s.Id, s.ParcaNo, s.Model, s.Detay5
        FROM [SIPARIS].[dbo].[Siparisler] s
        ORDER BY s.Id DESC;
    `);
    console.log('📌 Son 10 Siparişin ParcaNo Değerleri:');
    console.log(sampleOut);

    await pgPool.end();
}

main().catch(err => {
    console.error('❌ Hata oluştu:', err);
    process.exit(1);
});
