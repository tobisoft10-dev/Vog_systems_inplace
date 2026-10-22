const { Pool } = require('pg');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'vog_db',
  password: process.env.DB_PASSWORD || '!719356Qse!',
  port: parseInt(process.env.DB_PORT || '5432')
});

function removeGenderFromProductName(pName) {
    if (!pName || typeof pName !== 'string') return '';
    let cleaned = pName.trim();

    cleaned = cleaned.replace(/[\s\-_/]*(?:BAY\s*[\/&\-]\s*BAYAN|BAY\s+BAYAN|BAYAN\s*[\/&\-]\s*BAY|ERKEK\s*[\/&\-]\s*KADIN|ERKEK\s+VE\s+BAYAN|ERKEK\s+VE\s+KADIN|ERKEK\s+KADIN|KADIN\s*[\/&\-]\s*ERKEK|ERKEK\s*[\/&\-]\s*BAYAN|ERKEK\s+BAYAN|BAY\s*[\/&\-]\s*BAY)[\s\-_/]*/gi, ' ');
    cleaned = cleaned.replace(/\s*\(\s*(?:BAY\s*[\/&\-]\s*BAYAN|BAYAN|BAY|ERKEK\s*MODEL[İIıi]?|BAY\s*MODEL[İIıi]?|BAYAN\s*MODEL[İIıi]?|ERKEK|KADIN|UNISEX)\s*\)\s*/gi, ' ');
    cleaned = cleaned.replace(/\b(?:ERKEK|BAYAN|BAY|KADIN)\s*MODEL[İIıiA-Za-z]*\b/gi, ' ');
    cleaned = cleaned.replace(/\b(?:ERKEKLER|KADINLAR|BAYANLAR|BAYANDA|ERKEKTE|KADINDA)\b/gi, ' ');
    cleaned = cleaned.replace(/\b(?:BAYAN|BAY(?![iİıIeErR])|ERKEK|KADIN)\b/gi, ' ');
    cleaned = cleaned.replace(/(?<=[A-ZÇĞİÖŞÜ])(?:BAYAN|BAY(?![iİıIeErR])|ERKEK|KADIN)\b/gi, '');
    cleaned = cleaned.replace(/\b(?:BAYAN|BAY(?![iİıIeErR])|ERKEK|KADIN)(?=[A-ZÇĞİÖŞÜ])/gi, '');

    cleaned = cleaned
        .replace(/\s+/g, ' ')
        .replace(/[\s\-_/\*]+$/g, '')
        .replace(/^[\s\-_/\*]+/g, '')
        .trim();

    return cleaned || pName.trim();
}

const turkishColorPatterns = [
    { regex: /(?:[fF][üÜuU][mM][eE])\s*[-/]\s*(?:[sS][iİıI][yY][aA][hH])|(?:[fF][üÜuU][mM][eE])\s+(?:[sS][iİıI][yY][aA][hH])/gi, canonical: 'FÜME / SİYAH' },
    { regex: /(?:[sS][iİıI][yY][aA][hH])\s*[-/]\s*(?:[kK][ıIİi][rR][mM][ıIİi][zZ][ıIİi])|(?:[sS][iİıI][yY][aA][hH])\s+(?:[kK][ıIİi][rR][mM][ıIİi][zZ][ıIİi])/gi, canonical: 'SİYAH / KIRMIZI' },
    { regex: /(?:[fF][üÜuU][mM][eE])\s*[-/]\s*(?:[kK][ıIİi][rR][mM][ıIİi][zZ][ıIİi])|(?:[fF][üÜuU][mM][eE])\s+(?:[kK][ıIİi][rR][mM][ıIİi][zZ][ıIİi])/gi, canonical: 'FÜME / KIRMIZI' },
    { regex: /(?:[kK][ıIİi][rR][mM][ıIİi][zZ][ıIİi])\s*[-/]\s*(?:[bB][eE][yY][aA][zZ])|(?:[kK][ıIİi][rR][mM][ıIİi][zZ][ıIİi])\s+(?:[bB][eE][yY][aA][zZ])/gi, canonical: 'KIRMIZI / BEYAZ' },
    { regex: /(?:[lL][aA][cC][iİıI][vV][eE][rR][tT])\s*[-/]\s*(?:[mM][aA][vV][iİıI])|(?:[lL][aA][cC][iİıI][vV][eE][rR][tT])\s+(?:[mM][aA][vV][iİıI])/gi, canonical: 'LACİVERT / MAVİ' },
    { regex: /(?:[sS][iİıI][yY][aA][hH])\s*[-/]\s*(?:[gG][rR][iİıI])|(?:[sS][iİıI][yY][aA][hH])\s+(?:[gG][rR][iİıI])/gi, canonical: 'SİYAH / GRİ' },
    { regex: /(?:[gG][rR][iİıI])\s*[-/]\s*(?:[sS][iİıI][yY][aA][hH])|(?:[gG][rR][iİıI])\s+(?:[sS][iİıI][yY][aA][hH])/gi, canonical: 'GRİ / SİYAH' },
    { regex: /(?:[sS][aA][rR][ıIİi])\s+[fF][oO][sS][oO]?[fF]?[rR][lL][uUüÜ]|[fF][oO][sS][oO]?[fF]?[rR][lL][uUüÜ]\s+(?:[sS][aA][rR][ıIİi])/gi, canonical: 'SARI FOSFORLU' },
    { regex: /(?:[tT][uUüÜ][rR][uUüÜ][nN][cC][uUüÜ])\s+[fF][oO][sS][oO]?[fF]?[rR][lL][uUüÜ]/gi, canonical: 'TURUNCU FOSFORLU' },
    { regex: /[gG][eE][cC][eE]\s+[mM][aA][vV][iİıI][sS]?[iİıI]?/gi, canonical: 'GECE MAVİSİ' },
    { regex: /[pP][eE][tT][rR][oO][lL](\s+[yY][eE][şŞsS][iİıI][lL][iİıI]|\s+[mM][aA][vV][iİıI][sS][iİıI])?/gi, canonical: 'PETROL' },
    { regex: /[kK][oO][yY][uU]\s+[lL][aA][cC][iİıI][vV][eE][rR][tT]/gi, canonical: 'KOYU LACİVERT' },
    { regex: /[aA][çÇcC][ıIİi][kK]\s+[gG][rR][iİıI]/gi, canonical: 'AÇIK GRİ' },
    { regex: /[kK][oO][yY][uU]\s+[gG][rR][iİıI]/gi, canonical: 'KOYU GRİ' },
    { regex: /[aA][çÇcC][ıIİi][kK]\s+[mM][aA][vV][iİıI]/gi, canonical: 'AÇIK MAVİ' },
    { regex: /[kK][oO][yY][uU]\s+[mM][aA][vV][iİıI]/gi, canonical: 'KOYU MAVİ' },
    { regex: /\b[sS][iİıI][yY][aA][hH]\b/gi, canonical: 'SİYAH' },
    { regex: /\b[bB][eE][yY][aA][zZ]\b/gi, canonical: 'BEYAZ' },
    { regex: /\b[lL][aA][cC][iİıI][vV][eE][rR][tT]\b/gi, canonical: 'LACİVERT' },
    { regex: /\b[fF][üÜuU][mM][eE]\b/gi, canonical: 'FÜME' },
    { regex: /\b[aA][nN][tT][rR][aA][sS][iİıI][tT]\b/gi, canonical: 'ANTRASİT' },
    { regex: /\b[gG][rR][iİıI]\b/gi, canonical: 'GRİ' },
    { regex: /\b[kK][ıIİi][rR][mM][ıIİi][zZ][ıIİi]?\b/gi, canonical: 'KIRMIZI' },
    { regex: /\b[mM][aA][vV][iİıI]\b/gi, canonical: 'MAVİ' },
    { regex: /\b[yY][eE][şŞsS][iİıI][lL]\b/gi, canonical: 'YEŞİL' },
    { regex: /\b[sS][aA][rR][ıIİi]\b/gi, canonical: 'SARI' },
    { regex: /\b[tT][uUüÜ][rR][uUüÜ][nN][cC][uUüÜ]\b/gi, canonical: 'TURUNCU' },
    { regex: /\b[bB][oO][rR][dD][oO]\b/gi, canonical: 'BORDO' },
    { regex: /\b[hH][aA][kK][iİıI]\b/gi, canonical: 'HAKİ' },
    { regex: /\b[kK][aA][hH][vV][eE]([rR][eE][nN][gG][iİıI])?\b/gi, canonical: 'KAHVERENGİ' },
    { regex: /\b[bB][eE][jJ]\b/gi, canonical: 'BEJ' },
    { regex: /\b[eE][kK][rR][uU]\b/gi, canonical: 'EKRU' },
    { regex: /\b[tT][aA][bB][aA]\b/gi, canonical: 'TABA' },
    { regex: /\b[lL][iİıI][lL][aA]\b/gi, canonical: 'LİLA' },
    { regex: /\b[pP][eE][mM][bB][eE]\b/gi, canonical: 'PEMBE' }
];

function extractColorAndCleanProductName(pName, existingColor) {
    if (!pName || typeof pName !== 'string') {
        return { cleanProductName: pName || '', color: existingColor || 'STANDART' };
    }
    let detectedColor = null;
    let cleaned = pName;

    for (const pat of turkishColorPatterns) {
        if (pat.regex.test(cleaned)) {
            if (!detectedColor) detectedColor = pat.canonical;
            cleaned = cleaned.replace(pat.regex, ' ');
        }
    }
    cleaned = removeGenderFromProductName(cleaned);
    if (!cleaned) cleaned = pName.trim();
    return {
        cleanProductName: cleaned,
        color: detectedColor || (existingColor && existingColor !== 'STANDART' ? existingColor : 'STANDART')
    };
}

function resolveBrandAndGrup(skuCandidate, fallbackBrand = 'VOLKSWAGEN') {
    const s = (skuCandidate || '').toUpperCase();
    if (/^P*AUDI/i.test(s) || /^SSHAUDI/i.test(s)) return { brand: 'AUDI', grup: 'AUDI' };
    if (/^P*PORSCHE/i.test(s) || /^SSHPORSCHE/i.test(s)) return { brand: 'PORSCHE', grup: 'PORSCHE' };
    if (/^P*CUPRA/i.test(s)) return { brand: 'CUPRA', grup: 'CUPRA' };
    if (/^P*SEAT/i.test(s)) return { brand: 'SEAT', grup: 'SEAT' };
    if (/^P*(SKODA|SKD)/i.test(s)) return { brand: 'SKODA', grup: 'SKODA' };
    if (/^P*SCANIA/i.test(s)) return { brand: 'SCANIA', grup: 'SCANIA' };
    if (/^P*(VWK|VWT|VWB|VW|VOLKSWAGEN)/i.test(s)) return { brand: 'VOLKSWAGEN', grup: 'VOLKSWAGEN' };
    if (/^P*MAN/i.test(s)) return { brand: 'MAN', grup: 'MAN' };
    if (/^P*FORD/i.test(s)) return { brand: 'FORD', grup: 'FORD' };
    if (/^P*NISSAN/i.test(s)) return { brand: 'NISSAN', grup: 'NISSAN' };

    const m = s.match(/^P([A-Z]+?)(?=\d)/i);
    if (m && m[1]) {
        const raw = m[1].toUpperCase();
        return { brand: raw, grup: raw };
    }
    return { brand: fallbackBrand, grup: fallbackBrand };
}

function cleanParcaNo(rawCandidate, bedenStr = '') {
    if (!rawCandidate || typeof rawCandidate !== 'string') return '';
    let c = rawCandidate.trim();

    c = c.replace(/^(?:PARÇA\s*NO|PARCA\s*NO|KODU?|MODEL|ÜRÜN|URUN)\s*[:=\-]\s*/gi, '');
    c = c.replace(/\s*(?:İHRACAT\s*KOLİSİ|OLACAK|DEĞİŞECEK|TALEP|BASKI|ETİKET).*$/gi, '');

    const pMatch = c.match(/\b(P[A-Z0-9]+)\b/i);
    if (pMatch && pMatch[1]) {
        c = pMatch[1];
    } else {
        const anyAlphaNum = c.match(/\b([A-Z0-9]{5,25})\b/i);
        if (anyAlphaNum && anyAlphaNum[1]) c = anyAlphaNum[1];
    }

    if (bedenStr) {
        const cleanSz = bedenStr.replace(/BEDEN/gi, '').trim().toUpperCase();
        if (cleanSz && c.toUpperCase().endsWith(cleanSz) && c.length > cleanSz.length + 4) {
            c = c.substring(0, c.length - cleanSz.length).replace(/[\-_]$/, '');
        }
    }

    return c.toUpperCase().trim();
}

function queryMssql(queryText) {
    try {
        const tmpFile = path.join(__dirname, `tmp_verify_${Date.now()}.json`);
        const cleanQuery = queryText.replace(/\r?\n/g, ' ');
        const cmd = `sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -f 65001 -w 65535 -y 0 -o "${tmpFile}" -Q "SET NOCOUNT ON; ${cleanQuery} FOR JSON PATH"`;
        execSync(cmd, { stdio: 'ignore' });
        if (fs.existsSync(tmpFile)) {
            const raw = fs.readFileSync(tmpFile, 'utf8');
            try { fs.unlinkSync(tmpFile); } catch (e) {}
            const jsonStr = raw.split(/\r?\n/).map(l => l.trim()).join('');
            if (jsonStr) return JSON.parse(jsonStr);
        }
    } catch (err) {
        console.error('sqlcmd error:', err.message);
    }
    return [];
}

async function runMigration() {
    console.log('--- 1. MASTER PRODUCTS CLEANUP ---');
    const mpAll = await pool.query('SELECT id, sku, code39, product_name, color FROM master_products');
    for (const r of mpAll.rows) {
        const cleanSku = (r.sku || '').trim();
        const cleanCode39 = cleanSku;
        const cleanPName = removeGenderFromProductName(r.product_name || '');
        await pool.query(
            'UPDATE master_products SET sku = $1, code39 = $2, product_name = $3 WHERE id = $4',
            [cleanSku, cleanCode39, cleanPName, r.id]
        );
    }
    console.log(`✅ ${mpAll.rows.length} master_products kayıtları güncellendi.`);

    console.log('--- 2. VOUCHERS & SALES CLEANUP ---');
    const vAll = await pool.query('SELECT id, sku, code39, product_name FROM vouchers');
    for (const r of vAll.rows) {
        const cleanSku = (r.sku || '').trim();
        const cleanCode39 = cleanSku;
        const cleanPName = removeGenderFromProductName(r.product_name || '');
        await pool.query(
            'UPDATE vouchers SET sku = $1, code39 = $2, product_name = $3 WHERE id = $4',
            [cleanSku, cleanCode39, cleanPName, r.id]
        );
    }
    console.log(`✅ ${vAll.rows.length} vouchers kayıtları güncellendi.`);

    const sAll = await pool.query('SELECT id, sku, code39, product_name FROM sales');
    for (const r of sAll.rows) {
        const cleanSku = (r.sku || '').trim();
        const cleanCode39 = cleanSku;
        const cleanPName = removeGenderFromProductName(r.product_name || '');
        await pool.query(
            'UPDATE sales SET sku = $1, code39 = $2, product_name = $3 WHERE id = $4',
            [cleanSku, cleanCode39, cleanPName, r.id]
        );
    }
    console.log(`✅ ${sAll.rows.length} sales kayıtları güncellendi.`);

    console.log('--- 3. BSİP MSSQL -> POSTGRES ORDERS FULL SYNC ---');
    const mssqlOrders = queryMssql(`
        SELECT 
            s.Id AS order_number,
            s.Model AS model,
            s.[Not] AS notes,
            s.Detay1, s.Detay2, s.Detay3, s.Detay4, s.Detay5,
            m.Adi AS musteri_adi,
            p.Adi AS personel_adi,
            ISNULL(b.Adi, 'BEDEN (XXS-9XL)') AS beden_adi,
            si.ToplamAdet
        FROM [SIPARIS].[dbo].[Siparisler] s
        LEFT JOIN [SIPARIS].[dbo].[Musteriler] m ON s.MusteriId = m.Id
        LEFT JOIN [SIPARIS].[dbo].[Personeller] p ON s.PersonelId = p.Id
        LEFT JOIN [SIPARIS].[dbo].[Bedenler] b ON s.BedenId = b.Id
        LEFT JOIN (
            SELECT SiparisId, MAX(ISNULL(B01,0)+ISNULL(B02,0)+ISNULL(B03,0)+ISNULL(B04,0)+ISNULL(B05,0)+ISNULL(B06,0)+ISNULL(B07,0)+ISNULL(B08,0)+ISNULL(B09,0)+ISNULL(B10,0)+ISNULL(B11,0)+ISNULL(B12,0)+ISNULL(B13,0)+ISNULL(B14,0)) AS ToplamAdet
            FROM [SIPARIS].[dbo].[SiparisIslemleri]
            GROUP BY SiparisId
        ) si ON s.Id = si.SiparisId
        ORDER BY s.Id DESC
    `);
    console.log(`📦 BSİP'ten toplam ${mssqlOrders.length} sipariş okundu.`);

    const mpRes = await pool.query('SELECT sku, code39, barcode, ean13, product_name, color, brand, grup, gender FROM master_products');
    const mpByEan = new Map();
    const mpBySku = new Map();
    for (const row of mpRes.rows) {
        if (row.ean13) mpByEan.set(String(row.ean13).trim(), row);
        if (row.barcode) mpByEan.set(String(row.barcode).trim(), row);
        if (row.sku) mpBySku.set(String(row.sku).trim().toUpperCase(), row);
    }

    let syncedCount = 0;
    for (const o of mssqlOrders) {
        const orderNum = parseInt(o.order_number);
        if (!orderNum) continue;

        let brand = 'GENEL';
        const fullText = `${o.model || ''} ${o.musteri_adi || ''} ${o.notes || ''} ${o.Detay1 || ''}`.toUpperCase();
        if (fullText.includes('VOLKSWAGEN') || fullText.includes('VW')) brand = 'VOLKSWAGEN';
        else if (fullText.includes('AUDI')) brand = 'AUDI';
        else if (fullText.includes('SKODA')) brand = 'SKODA';
        else if (fullText.includes('SEAT')) brand = 'SEAT';
        else if (fullText.includes('CUPRA')) brand = 'CUPRA';
        else if (fullText.includes('NISSAN')) brand = 'NISSAN';
        else if (fullText.includes('PORSCHE')) brand = 'PORSCHE';
        else if (fullText.includes('FORD')) brand = 'FORD';
        else if (fullText.includes('ACIBADEM')) brand = 'ACIBADEM';
        else if (fullText.includes('REDCELL')) brand = 'REDCELL';

        const qty = (o.ToplamAdet && o.ToplamAdet > 0) ? o.ToplamAdet : 1;
        const rawCandidate = o.Detay5 || o.Detay1 || o.notes || '';
        const cleanParca = cleanParcaNo(rawCandidate, o.beden_adi);

        const colorInfo = extractColorAndCleanProductName(o.model || 'Tekstil Ürünü');
        let finalProductName = colorInfo.cleanProductName;
        let finalColor = colorInfo.color || 'STANDART';
        let finalSku = cleanParca || `${brand}-${orderNum}`;
        let finalBarcode = (o.Detay2 && /^\d{8,14}$/.test(String(o.Detay2).trim())) ? String(o.Detay2).trim() : '';
        let finalEan13 = finalBarcode;
        let finalBrand = brand;
        let finalGrup = brand;
        let finalGender = 'UNISEX';

        let matchedMp = null;
        if (finalBarcode && mpByEan.has(finalBarcode)) {
            matchedMp = mpByEan.get(finalBarcode);
        } else if (cleanParca && mpBySku.has(cleanParca.toUpperCase())) {
            matchedMp = mpBySku.get(cleanParca.toUpperCase());
        }

        if (matchedMp) {
            finalSku = matchedMp.sku;
            finalBarcode = matchedMp.barcode || matchedMp.ean13 || finalBarcode;
            finalEan13 = matchedMp.ean13 || matchedMp.barcode || finalEan13;
            finalBrand = matchedMp.brand || finalBrand;
            finalGrup = matchedMp.grup || finalBrand;
            finalColor = matchedMp.color || finalColor;
            finalGender = matchedMp.gender || finalGender;
            if (matchedMp.product_name) {
                finalProductName = removeGenderFromProductName(matchedMp.product_name);
            }
        } else {
            const bgInfo = resolveBrandAndGrup(finalSku, finalBrand);
            finalBrand = bgInfo.brand;
            finalGrup = bgInfo.grup;
        }

        const finalCode39 = finalSku; // code39 = sku

        await pool.query(`
            INSERT INTO orders (
                order_number, brand, grup, product_name, color, size, gender, sku, code39,
                barcode, ean13, sub_customer_name, staff_name, quantity, remaining_quantity,
                status, notes, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
            ON CONFLICT (order_number) DO UPDATE SET 
                product_name = EXCLUDED.product_name,
                sku = EXCLUDED.sku,
                code39 = EXCLUDED.code39,
                color = EXCLUDED.color,
                brand = EXCLUDED.brand,
                grup = EXCLUDED.grup,
                gender = EXCLUDED.gender,
                barcode = EXCLUDED.barcode,
                ean13 = EXCLUDED.ean13,
                updated_at = NOW()
        `, [
            orderNum,
            finalBrand,
            finalGrup,
            finalProductName,
            finalColor,
            o.beden_adi || 'BEDEN (XXS-9XL)',
            finalGender,
            finalSku,
            finalCode39,
            finalBarcode,
            finalEan13,
            o.musteri_adi || 'VOG Tekstil',
            o.personel_adi || '',
            qty,
            qty,
            'BEKLEMEDE',
            o.notes || ''
        ]);
        syncedCount++;
    }

    console.log(`✅ ${syncedCount} sipariş PostgreSQL 'orders' tablosuna başarıyla aktarıldı/güncellendi.`);

    console.log('\n=================== KURAL DOĞRULAMA RAPORU ===================');
    const vDiff = await pool.query("SELECT COUNT(*) FROM vouchers WHERE sku IS DISTINCT FROM code39");
    const oDiff = await pool.query("SELECT COUNT(*) FROM orders WHERE sku IS DISTINCT FROM code39");
    const sDiff = await pool.query("SELECT COUNT(*) FROM sales WHERE sku IS DISTINCT FROM code39");
    const mDiff = await pool.query("SELECT COUNT(*) FROM master_products WHERE sku IS DISTINCT FROM code39");

    console.log(`📌 code39 != sku olan kayıt sayısı:
    - Vouchers: ${vDiff.rows[0].count} (Beklenen: 0)
    - Orders: ${oDiff.rows[0].count} (Beklenen: 0)
    - Sales: ${sDiff.rows[0].count} (Beklenen: 0)
    - Master Products: ${mDiff.rows[0].count} (Beklenen: 0)
    `);

    const sample = await pool.query('SELECT order_number, product_name, color, sku, code39, barcode, ean13, gender FROM orders WHERE order_number = 16673 LIMIT 1');
    console.log('📌 Sipariş #16673 Orders Kaydı:\n', sample.rows[0]);

    const sampleV = await pool.query('SELECT order_id, product_name, color, sku, code39, barcode, ean13, gender FROM vouchers WHERE order_id = 16673 LIMIT 1');
    console.log('📌 Sipariş #16673 Vouchers Kaydı:\n', sampleV.rows[0]);

    await pool.end();
}

runMigration().catch(console.error);
