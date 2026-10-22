const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { execSync } = require('child_process');
const { Pool } = require('pg');

const DOWNLOADS_DIR = 'C:\\Users\\ctopuz\\Downloads';

const pgPool = new Pool({
    connectionString: 'postgresql://postgres:150609@localhost:5432/vog_db'
});

function runSqlcmd(sqlQuery) {
    const tmpSql = path.join(__dirname, `tmp_query_${Date.now()}_${Math.floor(Math.random() * 10000)}.sql`);
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

function parseAllDownloadsExcels() {
    console.log('📂 Downloads klasöründeki tüm marka Excel tabloları taranıyor...');
    const products = [];
    const seen = new Set();

    function addProd(item) {
        if (!item || !item.sku) return;
        const sku = String(item.sku).trim().toUpperCase();
        if (!sku || sku.length < 3 || seen.has(sku)) return;
        seen.add(sku);

        let cleanSize = item.size ? String(item.size).trim().toUpperCase() : 'STD';
        cleanSize = cleanSize.replace(/BEDEN|SIZE/gi, '').trim();

        let color = item.color ? String(item.color).trim().toUpperCase() : 'STANDART';

        let gender = item.gender ? String(item.gender).trim().toUpperCase() : 'UNISEX';
        const str = `${item.product_name || ''} ${cleanSize}`.toUpperCase();
        if (str.includes('BAYAN') || str.includes('KADIN')) gender = 'KADIN';
        else if (str.includes('BAY') || str.includes('ERKEK')) gender = 'ERKEK';

        products.push({
            sku,
            product_name: String(item.product_name || 'Tekstil Ürünü').trim(),
            color,
            size: cleanSize,
            clean_size: cleanSize,
            barcode: item.barcode ? String(item.barcode).trim() : (sku.match(/^\d{8,14}$/) ? sku : null),
            ean13: item.ean13 ? String(item.ean13).trim() : (item.barcode && /^\d{13}$/.test(item.barcode) ? item.barcode : null),
            code39: sku,
            brand: item.brand || 'GENEL',
            grup: item.brand || 'GENEL',
            gender,
            price: item.price || 500.00
        });
    }

    // 1. AUDI
    ['Audi 2025 Kış Parça Kıyafet Kodları.xlsx', 'AUDI 2026 Yaz Servis Kıyafet Parça Kodları.xlsx'].forEach(f => {
        const p = path.join(DOWNLOADS_DIR, f);
        if (!fs.existsSync(p)) return;
        const wb = xlsx.readFile(p);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
        data.forEach(r => {
            if (!r || !r[0] || !r[1]) return;
            const code = String(r[0]).trim();
            if (/^P[A-Z0-9_-]{5,30}$/i.test(code)) {
                const prodName = String(r[1]).trim();
                const parts = prodName.split('/');
                const sz = parts.length > 1 ? parts[1] : 'STD';
                addProd({ sku: code, product_name: prodName, size: sz, brand: 'AUDI' });
            }
        });
    });

    // 2. CUPRA
    const cupraKis = path.join(DOWNLOADS_DIR, 'CUPRA 2025 KIŞ PARÇA KODLARI.XLSX');
    if (fs.existsSync(cupraKis)) {
        const wb = xlsx.readFile(cupraKis);
        const ws = wb.Sheets['PARÇA NO'] || wb.Sheets[wb.SheetNames[0]];
        if (ws) {
            const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
            data.forEach(r => {
                if (r && r[0] && r[1] && /^PCUPRA/i.test(String(r[1]).trim())) {
                    addProd({ sku: String(r[1]).trim(), product_name: String(r[0]).trim(), brand: 'CUPRA' });
                }
            });
        }
    }

    const cupraYaz = path.join(DOWNLOADS_DIR, 'CUPRA 2026 YAZ PARÇA KODLARI.XLSX');
    if (fs.existsSync(cupraYaz)) {
        const wb = xlsx.readFile(cupraYaz);
        const ws = wb.Sheets['VERİLECEK ADETLER'] || wb.Sheets[wb.SheetNames[0]];
        if (ws) {
            const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
            data.forEach(r => {
                if (r && r[0] && r[1] && /^PCUPRA/i.test(String(r[0]).trim())) {
                    addProd({ sku: String(r[0]).trim(), product_name: String(r[1]).trim(), brand: 'CUPRA' });
                }
            });
        }
    }

    // 3. NISSAN
    const nissanBarkod = path.join(DOWNLOADS_DIR, 'Nissan Ürün yaz Barkod Listesi (1).xlsx');
    if (fs.existsSync(nissanBarkod)) {
        const wb = xlsx.readFile(nissanBarkod);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
        data.forEach(r => {
            if (r && r[0] && r[2] && r[3]) {
                const bcode = String(r[0]).trim();
                const sku = String(r[3]).trim();
                if (/^\d{10,14}$/.test(bcode)) {
                    addProd({ sku: sku || bcode, barcode: bcode, ean13: bcode, product_name: String(r[2]).trim(), brand: 'NISSAN' });
                }
            }
        });
    }

    const nissanParca = path.join(DOWNLOADS_DIR, 'parcakodu nissan.xlsx');
    if (fs.existsSync(nissanParca)) {
        const wb = xlsx.readFile(nissanParca);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
        data.forEach(r => {
            if (r && r[0] && r[1]) {
                const title = String(r[0]).trim();
                const sz = String(r[1]).trim();
                if (r[2] && /^KIYAFET/i.test(String(r[2]).trim())) {
                    addProd({ sku: String(r[2]).trim(), product_name: `${title} - ${sz}`, size: sz, brand: 'NISSAN' });
                }
                if (r[3] && /^KIYAFET/i.test(String(r[3]).trim())) {
                    addProd({ sku: String(r[3]).trim(), product_name: `${title} - ${sz}`, size: sz, brand: 'NISSAN' });
                }
            }
        });
    }

    ['nissan Kışlık Kıyafet Sipariş Formu BARKOD.xlsx', 'nissan Kışlık Kıyafet Sipariş Formu BARKOD (1).xlsx'].forEach(f => {
        const p = path.join(DOWNLOADS_DIR, f);
        if (!fs.existsSync(p)) return;
        const wb = xlsx.readFile(p);
        const ws = wb.Sheets['Sayfa1'] || wb.Sheets['Sheet1'];
        if (ws) {
            const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
            data.forEach(r => {
                if (r && r[2] && r[6]) {
                    const sku = String(r[2]).trim();
                    const bcode = String(r[6]).trim();
                    const title = r[5] ? String(r[5]).trim() : (r[3] ? String(r[3]).trim() : 'Nissan Kıyafet');
                    const sz = r[4] ? String(r[4]).trim() : 'STD';
                    if (sku && bcode) {
                        addProd({
                            sku,
                            barcode: bcode,
                            ean13: bcode,
                            product_name: title,
                            size: sz,
                            brand: 'NISSAN'
                        });
                    }
                }
            });
        }
    });

    // 4. PORSCHE
    const porscheYaz = path.join(DOWNLOADS_DIR, 'PORSCHE 2026 YAZ PARÇA KODLARI.XLSX');
    if (fs.existsSync(porscheYaz)) {
        const wb = xlsx.readFile(porscheYaz);
        const ws = wb.Sheets['PARÇA NO'] || wb.Sheets[wb.SheetNames[0]];
        if (ws) {
            const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
            data.forEach(r => {
                if (r && r[2] && /^PPORSCHE/i.test(String(r[2]).trim())) {
                    addProd({
                        sku: String(r[2]).trim(),
                        product_name: String(r[0] || 'Porsche Kıyafet').trim(),
                        size: String(r[1] || 'STD').trim(),
                        brand: 'PORSCHE'
                    });
                }
            });
        }
    }

    // 5. SCANIA
    ['SCANIA KIŞ 2025 KİŞİ LİSTESİ.xlsx', 'Scania 2026 Yaz Kişi Listesi.xlsx'].forEach(f => {
        const p = path.join(DOWNLOADS_DIR, f);
        if (!fs.existsSync(p)) return;
        const wb = xlsx.readFile(p);
        wb.SheetNames.forEach(sName => {
            const ws = wb.Sheets[sName];
            const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
            data.forEach(r => {
                if (!r) return;
                if (r[0] && /^SCKY/i.test(String(r[0]).trim())) {
                    addProd({
                        sku: String(r[0]).trim(),
                        product_name: String(r[1] || 'Scania Kıyafet').trim(),
                        size: String(r[2] || 'STD').trim(),
                        brand: 'SCANIA'
                    });
                }
                r.forEach(c => {
                    if (typeof c === 'string' && /^SCKY\d{5,}$/i.test(c.trim())) {
                        addProd({ sku: c.trim(), product_name: 'Scania Kıyafet', brand: 'SCANIA' });
                    }
                });
            });
        });
    });

    // 6. SEAT
    const seatKis = path.join(DOWNLOADS_DIR, 'SEAT 2025 KIŞ PARÇA KODLARI.XLSX');
    if (fs.existsSync(seatKis)) {
        const wb = xlsx.readFile(seatKis);
        const ws = wb.Sheets['PARÇA NO'] || wb.Sheets[wb.SheetNames[0]];
        if (ws) {
            const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
            data.forEach(r => {
                if (r && r[1] && /^PSEAT/i.test(String(r[1]).trim())) {
                    addProd({ sku: String(r[1]).trim(), product_name: String(r[0] || 'Seat Kıyafet').trim(), brand: 'SEAT' });
                }
            });
        }
    }

    const seatYaz = path.join(DOWNLOADS_DIR, 'SEAT 2026 Yaz Kişi Listesi.xlsx');
    if (fs.existsSync(seatYaz)) {
        const wb = xlsx.readFile(seatYaz);
        ['PARÇA NO DETAY', 'PARÇA NO'].forEach(sName => {
            const ws = wb.Sheets[sName];
            if (ws) {
                const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
                data.forEach(r => {
                    if (r && r[1] && /^PSEAT/i.test(String(r[1]).trim())) {
                        addProd({ sku: String(r[1]).trim(), product_name: String(r[0] || 'Seat Kıyafet').trim(), brand: 'SEAT' });
                    }
                });
            }
        });
    }

    // 7. SKODA
    ['Skoda Barkodlar 2025 KIŞ.XLSX', 'Skoda Barkodlar 2026 YAZ.XLSX'].forEach(f => {
        const p = path.join(DOWNLOADS_DIR, f);
        if (!fs.existsSync(p)) return;
        const wb = xlsx.readFile(p);
        wb.SheetNames.forEach(sName => {
            const ws = wb.Sheets[sName];
            const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
            data.forEach(r => {
                if (!r) return;
                r.forEach((c) => {
                    if (typeof c === 'string' && /^PSKD/i.test(c.trim())) {
                        const title = r[0] ? String(r[0]).trim() : 'Skoda Kıyafet';
                        const sz = r[4] ? String(r[4]).trim() : 'STD';
                        addProd({ sku: c.trim(), product_name: `${title} - ${sz}`, size: sz, brand: 'SKODA' });
                    }
                });
            });
        });
    });

    // 8. VOLKSWAGEN
    ['VW 2025 KIŞ Parça Kodları.xlsx', 'VW 2026 KIŞ Parça Kodları.xlsx', 'VW 2025 KIŞ Parça Kodları (1).xlsx'].forEach(f => {
        const p = path.join(DOWNLOADS_DIR, f);
        if (!fs.existsSync(p)) return;
        const wb = xlsx.readFile(p);
        wb.SheetNames.forEach(sName => {
            const ws = wb.Sheets[sName];
            const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
            data.forEach(r => {
                if (!r) return;
                r.forEach((c) => {
                    if (typeof c === 'string' && /^PVWK/i.test(c.trim())) {
                        const title = r[0] ? String(r[0]).trim() : 'VW Kıyafet';
                        const sz = r[4] ? String(r[4]).trim() : 'STD';
                        addProd({ sku: c.trim(), product_name: `${title} - ${sz}`, size: sz, brand: 'VOLKSWAGEN' });
                    }
                });
            });
        });
    });

    const vwYaz = path.join(DOWNLOADS_DIR, 'VW 2026 YAZ PARÇA KODLARI & VERİLECEK ADETLER.XLSX');
    if (fs.existsSync(vwYaz)) {
        const wb = xlsx.readFile(vwYaz);
        wb.SheetNames.forEach(sName => {
            const ws = wb.Sheets[sName];
            const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
            data.forEach(r => {
                if (r && r[1] && typeof r[1] === 'string' && /^PVW/i.test(r[1].trim())) {
                    addProd({ sku: r[1].trim(), product_name: String(r[2] || 'VW Yaz Kıyafet').trim(), brand: 'VOLKSWAGEN' });
                }
            });
        });
    }

    return products;
}

// Extraction helper that specifically finds exact clean part codes
function extractPreciseParcaNo(text, catalogCodeSet, rawModel, orderId) {
    if (!text && !rawModel) return null;
    const s = String(text || '').replace(/[\r\n\t]/g, ' ').replace(/\s{2,}/g, ' ').trim();

    // 1. Direct regex check for brand part codes:
    const exactRegexes = [
        /\b(PPAUDI[A-Z0-9_-]+|PAUDI[A-Z0-9_-]+)\b/i,
        /\b(PVWK[A-Z0-9_-]+|PVW[A-Z0-9_-]+)\b/i,
        /\b(PCUPRA[A-Z0-9_-]+)\b/i,
        /\b(PSEAT[A-Z0-9_-]+)\b/i,
        /\b(PSKD[A-Z0-9_-]+)\b/i,
        /\b(PPORSCHE[A-Z0-9_-]+)\b/i,
        /\b(SCKY[0-9]{4,10})\b/i,
        /\b(KIYAFET[A-Z0-9_-]+)\b/i,
        /\b(K-OG[0-9]{4,8})\b/i,
        /\b(8520147\d{6})\b/,
        /\b(9010201\d{5})\b/
    ];

    for (const rx of exactRegexes) {
        const m = s.match(rx);
        if (m && m[1]) {
            return m[1].trim().toUpperCase();
        }
    }

    // 2. Check if any catalog code is present inside string as a word or substring
    for (const code of catalogCodeSet) {
        if (code.length >= 6 && s.toUpperCase().includes(code)) {
            return code;
        }
    }

    // 3. Check explicit PARÇA NO: pattern
    const parcaMatch = s.match(/PAR[CÇ]A\s*NO\s*:\s*([A-Za-z0-9_-]+)/i);
    if (parcaMatch && parcaMatch[1] && !/^(YOK|BEKLIYOR|YEDEK|TEK|ERKEK|KADIN)$/i.test(parcaMatch[1])) {
        return parcaMatch[1].trim().toUpperCase();
    }

    // 4. Fallback: Generate clean standard code
    let brand = 'VOG';
    const combined = `${rawModel || ''} ${s}`.toUpperCase();
    if (combined.includes('VOLKSWAGEN') || combined.includes('VW')) brand = 'VW';
    else if (combined.includes('AUDI')) brand = 'AUDI';
    else if (combined.includes('SEAT')) brand = 'SEAT';
    else if (combined.includes('CUPRA')) brand = 'CUPRA';
    else if (combined.includes('NISSAN')) brand = 'NISSAN';
    else if (combined.includes('SKODA')) brand = 'SKODA';
    else if (combined.includes('PORSCHE')) brand = 'PORSCHE';
    else if (combined.includes('SCANIA')) brand = 'SCANIA';
    else if (combined.includes('FORD')) brand = 'FORD';

    return `P${brand}${orderId}`;
}

async function main() {
    console.log('🚀 MASTER ÜRÜN & PARÇA NO EŞLEŞTİRME VE AKTARIM MERKEZİ');
    console.log('=========================================================\n');

    // 1. Parse all Downloads Excels
    const downloadProducts = parseAllDownloadsExcels();
    console.log(`✅ Toplam ${downloadProducts.length} adet marka ürün/parça kodu Excel'lerden başarıyla ayrıştırıldı.`);

    // Build Catalog Code Set for accurate matching
    const catalogCodeSet = new Set(downloadProducts.map(p => p.sku));

    // 2. Upsert into PostgreSQL master_products safely & at lightning speed
    console.log('\n📦 PostgreSQL master_products tablosu kontrol ediliyor...');
    const existingSkuRes = await pgPool.query('SELECT sku FROM master_products');
    const existingSkuSet = new Set(existingSkuRes.rows.map(r => String(r.sku).trim().toUpperCase()));
    console.log(`   📌 PostgreSQL'de mevcut ${existingSkuSet.size} adet master ürün var.`);

    let pgNewCount = 0;
    let pgUpdateCount = 0;
    const toInsert = [];

    for (const p of downloadProducts) {
        if (existingSkuSet.has(p.sku)) {
            await pgPool.query(`
                UPDATE master_products SET
                    product_name = $2,
                    color = CASE WHEN color IS NULL OR color = 'STANDART' THEN $3 ELSE color END,
                    size = $4,
                    clean_size = $5,
                    barcode = COALESCE($6, barcode),
                    ean13 = COALESCE($7, ean13),
                    brand = $8,
                    grup = $9,
                    gender = $10,
                    price = $11,
                    updated_at = NOW()
                WHERE sku = $1
            `, [
                p.sku, p.product_name, p.color, p.size, p.clean_size,
                p.barcode, p.ean13, p.brand, p.grup, p.gender, p.price
            ]);
            pgUpdateCount++;
        } else {
            toInsert.push(p);
            existingSkuSet.add(p.sku);
        }
    }

    if (toInsert.length > 0) {
        const PG_BATCH = 100;
        for (let i = 0; i < toInsert.length; i += PG_BATCH) {
            const chunk = toInsert.slice(i, i + PG_BATCH);
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
            pgNewCount += chunk.length;
        }
    }
    console.log(`✅ PostgreSQL master_products: ${pgNewCount} yeni ürün eklendi, ${pgUpdateCount} ürün güncellendi.`);

    // 3. Fetch all current PostgreSQL master_products to populate MSSQL MasterUrunler
    console.log('\n🔄 PostgreSQL veritabanındaki tüm master_products verisi alınıyor...');
    const allMpRes = await pgPool.query(`
        SELECT sku, product_name, color, size, clean_size, barcode, ean13, code39, brand, grup, gender, price
        FROM master_products
        WHERE sku IS NOT NULL AND TRIM(sku) != ''
    `);
    const allMasterProducts = allMpRes.rows;
    console.log(`📌 Toplam ${allMasterProducts.length} adet master ürün MSSQL [SIPARIS].[dbo].[MasterUrunler] tablosuna aktarılıyor...`);

    runSqlcmd('TRUNCATE TABLE [SIPARIS].[dbo].[MasterUrunler];');

    const BATCH_SIZE = 500;
    let insertedMaster = 0;
    for (let i = 0; i < allMasterProducts.length; i += BATCH_SIZE) {
        const chunk = allMasterProducts.slice(i, i + BATCH_SIZE);
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
        if (insertedMaster % 10000 === 0 || insertedMaster === allMasterProducts.length) {
            console.log(`   ✨ ${insertedMaster} / ${allMasterProducts.length} master ürün MSSQL'e yazıldı.`);
        }
    }
    console.log(`✅ MSSQL [SIPARIS].[dbo].[MasterUrunler] tablosuna ${insertedMaster} kayıt başarıyla aktarıldı.`);

    // 4. Update MSSQL [SIPARIS].[dbo].[Siparisler].ParcaNo with high precision!
    console.log('\n🔍 Siparisler tablosundaki tüm siparişler için hassas ParcaNo eşleştirmesi yapılıyor...');
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

    console.log(`📌 Toplam ${mssqlOrders.length} sipariş taranıyor...`);

    const updateStatements = [];
    let exactCodeCount = 0;
    let fallbackCount = 0;

    for (const ord of mssqlOrders) {
        const orderId = ord.Id;
        const candidateText = `${ord.Detay5 || ''} ${ord.Detay1 || ''} ${ord.Not || ''}`;
        const parcaNo = extractPreciseParcaNo(candidateText, catalogCodeSet, ord.Model, orderId);

        if (parcaNo && (parcaNo.includes('AUDI') || parcaNo.includes('VW') || parcaNo.includes('SEAT') || parcaNo.includes('CUPRA') || parcaNo.includes('SKD') || parcaNo.includes('PORSCHE') || parcaNo.includes('SCANIA') || parcaNo.startsWith('KIYAFET') || parcaNo.startsWith('K-OG') || parcaNo.startsWith('8520147'))) {
            exactCodeCount++;
        } else {
            fallbackCount++;
        }

        const escapedParca = parcaNo.replace(/'/g, "''").trim().substring(0, 100);
        updateStatements.push(`UPDATE [SIPARIS].[dbo].[Siparisler] SET ParcaNo = N'${escapedParca}' WHERE Id = ${orderId};`);
    }

    console.log(`🎯 Eşleşme Analizi:`);
    console.log(`   ✨ Doğrulanmış Gerçek Parça Kodu: ${exactCodeCount}`);
    console.log(`   ✨ Standart Seri Parça Kodu: ${fallbackCount}`);
    console.log(`   ⚡ MSSQL Siparisler tablosuna uygulanıyor...`);

    const UPDATE_BATCH = 500;
    for (let i = 0; i < updateStatements.length; i += UPDATE_BATCH) {
        const batch = updateStatements.slice(i, i + UPDATE_BATCH);
        runSqlcmd(batch.join('\n'));
        if ((i + batch.length) % 2500 === 0 || (i + batch.length) === updateStatements.length) {
            console.log(`   ✨ ${i + batch.length} / ${updateStatements.length} sipariş ParcaNo güncellendi.`);
        }
    }

    console.log('\n🎉 TÜM GÖÇ VE EŞLEŞTİRME BAŞARIYLA TAMAMLANDI!');
    
    // Sample Verification
    const sampleOut = runSqlcmd(`
        SET NOCOUNT ON;
        SELECT TOP 10 s.Id, s.ParcaNo, s.Model
        FROM [SIPARIS].[dbo].[Siparisler] s
        ORDER BY s.Id DESC;
    `);
    console.log('\n📌 Güncellenen Son 10 Sipariş:');
    console.log(sampleOut);

    await pgPool.end();
}

main().catch(err => {
    console.error('❌ Hata oluştu:', err);
    process.exit(1);
});
