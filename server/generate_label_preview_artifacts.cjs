const fs = require('fs');
const path = require('path');
const http = require('http');
require('dotenv').config({ path: __dirname + '/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

// Artifacts directory
const ARTIFACT_DIR = 'C:\\Users\\ctopuz\\.gemini\\antigravity-ide\\brain\\c34f4e10-3c55-40ab-b459-0ed82107b237';

function renderZplToPng(zpl, dpmm, widthInches, heightInches, outputPath) {
    return new Promise((resolve, reject) => {
        const url = `http://api.labelary.com/v1/printers/${dpmm}dpmm/labels/${widthInches}x${heightInches}/0/`;
        const req = http.request(url, {
            method: 'POST',
            headers: {
                'Accept': 'image/png',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }, (res) => {
            if (res.statusCode !== 200) {
                let errData = '';
                res.on('data', c => errData += c);
                res.on('end', () => reject(new Error(`Labelary API returned ${res.statusCode}: ${errData}`)));
                return;
            }
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                fs.writeFileSync(outputPath, buffer);
                resolve(outputPath);
            });
        });
        req.on('error', reject);
        req.write(zpl);
        req.end();
    });
}

// Helpers from app.js
function mapGenderToTurkish(gender) {
    if (!gender) return 'ERKEK';
    const g = String(gender).trim().toUpperCase();
    if (g.includes('BAYAN') || g.includes('KADIN') || g.includes('FEMALE') || g.includes('WOMEN') || g === 'KDN') {
        return 'KADIN';
    }
    if (g.includes('BAY') || g.includes('ERKEK') || g.includes('MALE') || g.includes('MEN') || g === 'ERK') {
        return 'ERKEK';
    }
    if (g.includes('UNISEX')) {
        return 'UNISEX';
    }
    return 'ERKEK';
}

function cleanThermalText(str) {
    if (!str) return '';
    return str
        .replace(/İ/g, 'I')
        .replace(/ı/g, 'i')
        .replace(/Ş/g, 'S')
        .replace(/ş/g, 's')
        .replace(/Ğ/g, 'G')
        .replace(/ğ/g, 'g')
        .replace(/Ü/g, 'U')
        .replace(/ü/g, 'u')
        .replace(/Ö/g, 'O')
        .replace(/ö/g, 'o')
        .replace(/Ç/g, 'C')
        .replace(/ç/g, 'c')
        .toUpperCase()
        .trim();
}

function cleanSizeCode(size) {
    if (!size) return 'STD';
    const raw = String(size).trim().toUpperCase();
    if (raw === 'BEDENSİZ' || raw === 'BEDENSIZ' || raw === 'STANDART' || raw === 'STD' || raw.includes('BEDENSİZ') || raw.includes('BEDENSIZ')) {
        return 'STD';
    }
    let sz = raw.replace(/^BEDEN\s*/i, '').replace(/[\(\)]/g, '').trim();
    if (sz === 'SİZ' || sz === 'SIZ' || !sz) {
        return 'STD';
    }
    return sz;
}

function extractParcaNo(text) {
    if (!text || typeof text !== 'string') return '';
    const cleanStr = text.replace(/TEK\s*TEK\s*PAKET\.?\s*/gi, '')
                         .replace(/DİKİLDİKTEN\s*SONRA\s*YIKAMAYA\s*GİDECEK\.?\s*/gi, '')
                         .replace(/LÜTFEN\s*GÜRAY\s*BEYE\s*HABER\s*VERELİM\.?\s*/gi, '')
                         .replace(/ENGİN\s*BEY\.?\s*/gi, '')
                         .replace(/SAKIN\s*YOLLMAYIN\.?\s*/gi, '')
                         .replace(/DOĞUŞA\.?\s*/gi, '')
                         .replace(/[\(\)\[\],;*!]/g, ' ')
                         .replace(/\s+/g, ' ')
                         .trim();

    const labelMatch = cleanStr.match(/PAR[CÇ]A\s*NO\s*[:=\-]?\s*([A-Z0-9\-]+)/i);
    if (labelMatch && !/^(?:PAKET|PANTOLON|PERSONEL|POLO|POLAR|PARCA|PAMUK|POSET)/i.test(labelMatch[1])) {
        return labelMatch[1].toUpperCase();
    }

    const patternMatch = cleanStr.match(/\b(PVOG\d{3,6}|PAUDI\d{2,8}[A-Z0-9]*|PVW[A-Z0-9]{2,10}|PPORSCHE\d{2,10}[A-Z0-9]*|PSEAT\d{2,10}[A-Z0-9]*|PSKODA\d{2,10}[A-Z0-9]*|PCUPRA\d{2,10}[A-Z0-9]*|K-OG\d{3,6}|P[A-Z]{2,6}\d{2,10}[A-Z0-9]*)\b/i);
    if (patternMatch && !/^(?:PAKET|PANTOLON|PERSONEL|POLO|POLAR|PARCA|PAMUK|POSET)/i.test(patternMatch[1])) {
        return patternMatch[1].toUpperCase();
    }

    return '';
}

function cleanParcaNo(parca, size) {
    if (!parca || typeof parca !== 'string') return '';
    let p = cleanThermalText(parca).trim().toUpperCase();
    p = p.replace(/TEK\s*TEK\s*PAKET\.?\s*/gi, '')
         .replace(/(?:ERKEK|BAY|KADIN|BAYAN)\s*[:=\-]\s*/gi, '')
         .replace(/[\(\)\[\],;*!]/g, ' ')
         .trim();

    const sz = cleanSizeCode(size);
    if (sz && sz !== 'STD') {
        const sizeEndRegex = new RegExp(`[-_\\s]?${sz}$`, 'i');
        p = p.replace(sizeEndRegex, '');
    }

    p = p.replace(/[-_](?:XXS|XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL|\d{2})$/i, '');
    p = p.replace(/[-_]+$/, '').trim();

    return p;
}

function formatParcaNoWithSize(parca, size) {
    return cleanParcaNo(parca, size);
}

const YERLI_URETIM_GFA = '^GFA,00288,00288,00008,:Z64:eJzt0TsKgDAURNHxJ+6gu9BEy/3vw0JEQbBKY7gwnAvn8uQfC43820p1H1yHox4U9fHQg2r1G507d+7cuXNf0V1d2Xf1q4O9l637q8f69Vv0X13nF86dO3fu3N939w4mU2Ym:B9E9';
const RFID_LOGO_GFA = '^GFA,00288,00288,00008,:Z64:eJzt0TsOgCAMBVC4i/cxuDEuXMz970NFY0B/oXwN79J2pC8g31v8t1V1bKfjWB23bYwz9dZ5z62/4Ny5c+fOnfvH7r0f545z78/0uR+0O+/d/bvnzp07d+7cT3Yf9l1m4g==:87F2';

// Helper to remove Bay / Bayan / Bay-Bayan / Bay/Bayan words from product names so only Erkek / Kadın / Unisex standard is used
function cleanBayBayanText(str) {
    if (!str) return '';
    return str
        .replace(/\bBAY\s*\/\s*BAYAN\b/gi, '')
        .replace(/\bBAYAN\s*\/\s*BAY\b/gi, '')
        .replace(/\bBAY\s*-\s*BAYAN\b/gi, '')
        .replace(/\bBAYAN\s*-\s*BAY\b/gi, '')
        .replace(/\bBAY\b/gi, '')
        .replace(/\bBAYAN\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .replace(/\s*-\s*$/, '')
        .replace(/^\s*-\s*/, '')
        .trim();
}

// Helper to detect garment type (Pantolon, Gömlek, Tshirt, Sweatshirt, Mont, Yelek, Polar vb.)
function detectProductType(text) {
    if (!text || typeof text !== 'string') return '';
    const t = text.toUpperCase();
    if (t.includes('PANTOLON')) return 'PANTOLON';
    if (t.includes('GOMLEK') || t.includes('GÖMLEK')) return 'GOMLEK';
    if (t.includes('SWEAT') || t.includes('SWEATSHIRT')) return 'SWEATSHIRT';
    if (t.includes('TSHIRT') || t.includes('T-SHIRT') || t.includes('TİSÖRT') || t.includes('TISORT') || t.includes('POLO')) return 'TSHIRT';
    if (t.includes('MONT') || t.includes('SOFTSHELL') || t.includes('KABAN')) return 'MONT';
    if (t.includes('YELEK')) return 'YELEK';
    if (t.includes('POLAR')) return 'POLAR';
    if (t.includes('TULUM')) return 'TULUM';
    if (t.includes('ONLUK') || t.includes('ÖNLÜK')) return 'ONLUK';
    if (t.includes('BERE')) return 'BERE';
    if (t.includes('SAPKA') || t.includes('ŞAPKA')) return 'SAPKA';
    if (t.includes('CANTA') || t.includes('ÇANTA')) return 'CANTA';
    return '';
}

// Helper to clean product name for label top line (strips sizes and trailing gender)
function cleanProductNameForTitle(name) {
    if (!name || typeof name !== 'string') return '';
    let clean = cleanThermalText(name)
        // 1. Remove embedded sizes: /XL/, /42/, (M Beden), etc.
        .replace(/\/\s*(?:XXS|XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL|6XL|7XL|8XL|9XL|\d{2})\s*\//gi, ' / ')
        .replace(/\s*\(\s*(?:BEDEN\s*)?(?:XXS|XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL|6XL|7XL|8XL|9XL|\d{2})\s*(?:BEDEN)?\s*\)/gi, '')
        .replace(/\b(?:BEDEN|Beden)\s*[:=\-]?\s*(?:XXS|XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL|6XL|7XL|8XL|9XL|\d{2})\b/gi, '')
        .replace(/[\/\-]\s*(?:XXS|XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL|6XL|7XL|8XL|9XL|\d{2})\s*$/gi, '')
        
        // 2. Remove embedded gender keywords so line 1 is only the garment title
        .replace(/[\/\-]\s*(?:BAYAN|KADIN|BAY|ERKEK|UNISEX)\s*$/gi, '')
        .replace(/\/\s*(?:BAYAN|KADIN|BAY|ERKEK|UNISEX)\s*\//gi, ' / ')
        .replace(/\b(?:BAY\s*\/\s*BAYAN|BAYAN\s*\/\s*BAY|BAY\s*-\s*BAYAN|BAYAN\s*-\s*BAY|BAYAN|BAY)\b/gi, '')
        
        // 3. Clean slashes, dashes, extra spaces
        .replace(/\/\s*\//g, '/')
        .replace(/\s*\/\s*$/, '')
        .replace(/^\s*\/\s*/, '')
        .replace(/\s*-\s*$/, '')
        .replace(/^\s*-\s*/, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

    return clean;
}

function generateSatoRfidZplQr(item) {
    const titleLine1 = cleanProductNameForTitle(item.product_name || 'Tekstil Urunu').substring(0, 44);
    const gender = mapGenderToTurkish(item.gender);
    const size = cleanThermalText(item.clean_size || item.size || 'STD').replace(/^BEDEN\s*/i, '').replace(/[\(\)]/g, '').trim() || 'STD';
    const epc = (item.epc || '303B50CC00422E00000004').toUpperCase().trim();
    const parcaNo = cleanParcaNo(item.sku || 'P1001', size).substring(0, 24);
    const barcodeVal = cleanThermalText(item.barcode || item.sku || '8691680751687');
    let dateStr = item.date || new Date().toLocaleDateString('tr-TR');
    dateStr = dateStr.replace(/[<>]/g, '').trim();

    const fontZpl = titleLine1.length > 30 ? '^A0N,22,16' : '^A0N,25,19';
    const parcaFont = parcaNo.length > 13 ? '^A0N,22,18' : '^A0N,24,20';

    return `^XA
^PW520
^LL310
^PON
^LH15,8
^RS8,,,1^FS
^RFW,H^FD${epc}^FS
^FO20,10${fontZpl}^FD${titleLine1}^FS
^FO20,36^A0N,24,20^FD${gender}^FS
^FO20,64^GB485,2,2^FS
^FO22,76^BQN,2,3^FDMA,${parcaNo}^FS
^FO112,78^A0N,20,16^FDPARCA NO:^FS
^FO205,76${parcaFont}^FD${parcaNo}^FS
^FO112,108^A0N,20,16^FDBARKOD:^FS
^FO205,106^A0N,22,19^FD${barcodeVal}^FS
^FO112,138^A0N,20,16^FDBEDEN:^FS
^FO205,136^A0N,26,23^FD${size}^FS
^FO20,172^GB485,2,2^FS
^FO20,192^A0N,22,20^FDTARIH: ${dateStr}^FS
^FO20,225^A0N,18,16^FDVOG TEKSTIL SAN. VE TIC. A.S.^FS
^FO260,225^A0N,18,16^FDTurkiye'de uretilmistir.^FS
^XZ\n`;
}

function generateSatoRfidZplClassic(item) {
    const titleLine1 = cleanProductNameForTitle(item.product_name || 'Tekstil Urunu').substring(0, 44);
    const gender = mapGenderToTurkish(item.gender);
    const size = cleanThermalText(item.clean_size || item.size || 'STD').replace(/^BEDEN\s*/i, '').replace(/[\(\)]/g, '').trim() || 'STD';
    const epc = (item.epc || '303B50CC00422E00000004').toUpperCase().trim();
    const parcaNo = cleanParcaNo(item.sku || 'P1001', size).substring(0, 24);
    const barcodeVal = cleanThermalText(item.barcode || item.sku || '8691680751687');
    let dateStr = item.date || new Date().toLocaleDateString('tr-TR');
    dateStr = dateStr.replace(/[<>]/g, '').trim();

    const fontZpl = titleLine1.length > 30 ? '^A0N,22,16' : '^A0N,25,19';
    const parcaFont = parcaNo.length > 15 ? '^A0N,22,18' : '^A0N,24,22';

    const byWidth = parcaNo.length > 13 ? 1 : 2;
    const barcodeWidth = (parcaNo.length + 5) * 11 * byWidth;
    const labelWidth = 485;
    const startX = Math.max(20, Math.round(20 + (labelWidth - barcodeWidth) / 2));
    const barcodeZpl = `^FO${startX},72^BY${byWidth},2,36^BCN,36,N,N,N^FD${parcaNo}^FS`;

    return `^XA
^PW520
^LL310
^PON
^LH15,8
^RS8,,,1^FS
^RFW,H^FD${epc}^FS
^FO20,10${fontZpl}^FD${titleLine1}^FS
^FO20,36^A0N,24,20^FD${gender}^FS
^FO20,64^GB485,2,2^FS
${barcodeZpl}
^FO20,116^A0N,20,18^FDPARCA NO:^FS
^FO135,114${parcaFont}^FD${parcaNo}^FS
^FO20,140^A0N,20,18^FDBARKOD:^FS
^FO135,140^A0N,22,20^FD${barcodeVal}^FS
^FO20,164^A0N,20,18^FDBEDEN:^FS
^FO135,162^A0N,24,22^FD${size}^FS
^FO20,188^GB485,2,2^FS
^FO20,204^A0N,22,20^FDTARIH: ${dateStr}^FS
^FO20,230^A0N,18,16^FDVOG TEKSTIL SAN. VE TIC. A.S.^FS
^FO260,230^A0N,18,16^FDTurkiye'de uretilmistir.^FS
^XZ\n`;
}

function generateGodexBoxZpl(boxData) {
    const brand = cleanThermalText(boxData.brand || 'DOGUS OTOMOTIV');
    const dealerName = cleanThermalText(boxData.dealer_name || boxData.customer_name || boxData.sub_customer_name || 'DOGUS OTO ESENYURT').substring(0, 42);
    const boxNo = parseInt(boxData.box_no, 10) || 1;
    const totalBoxes = parseInt(boxData.total_boxes, 10) || 1;
    const orderNo = (boxData.order_id || boxData.order_number || '16903').toString().trim();
    const barcodeStr = (boxData.barcode || (orderNo ? `BOX-${orderNo}-${boxNo}` : '16903-PASS-TR')).toString().trim();
    const productName = cleanThermalText(boxData.product_name || 'Tekstil Urunu').substring(0, 46);
    const currentDate = new Date().toLocaleDateString('tr-TR');

    const items = boxData.items && Array.isArray(boxData.items) && boxData.items.length > 0
        ? boxData.items
        : [
            { part_no: 'PVWK100037XL', clean_size: 'XL', product_name: 'Teknisyen Sweatshirt - Erkek', quantity: 25 },
            { part_no: 'PVWK100037L', clean_size: 'L', product_name: 'Teknisyen Sweatshirt - Erkek', quantity: 40 },
            { part_no: 'PVWK100037M', clean_size: 'M', product_name: 'Teknisyen Sweatshirt - Erkek', quantity: 35 }
        ];

    let totalQty = boxData.total_quantity || items.reduce((sum, it) => sum + (parseInt(it.quantity, 10) || 0), 0);
    const orderTotalQty = boxData.order_total_quantity || totalQty || 100;

    let rowsZpl = '';
    const startY = 290;
    const rowH = 54;
    const maxRows = 7;
    const displayItems = items.slice(0, maxRows);

    displayItems.forEach((it, idx) => {
        const y = startY + (idx * rowH);
        const partNoTxt = cleanThermalText(it.part_no || it.sku || 'STD').substring(0, 16);
        const prodTxt = cleanThermalText(it.product_name || productName).substring(0, 34);
        const pureSize = cleanThermalText(it.clean_size || it.size || 'STD').replace(/^BEDEN\s*/i, '').trim();
        const sizeTxt = pureSize.substring(0, 8);
        const qtyTxt = String(it.quantity || 1);

        rowsZpl += `
^FO25,${y}^GB1130,${rowH},1^FS
^FO40,${y + 14}^A0N,28,24^FD${partNoTxt}^FS
^FO305,${y}^GB1,${rowH},1^FS
^FO320,${y + 14}^A0N,28,24^FD${prodTxt}^FS
^FO860,${y}^GB1,${rowH},1^FS
^FO880,${y + 12}^A0N,32,28^FD${sizeTxt}^FS
^FO1000,${y}^GB1,${rowH},1^FS
^FO1035,${y + 11}^A0N,34,30^FD${qtyTxt}^FS`;
    });

    for (let i = displayItems.length; i < maxRows; i++) {
        const y = startY + (i * rowH);
        rowsZpl += `
^FO25,${y}^GB1130,${rowH},1^FS
^FO305,${y}^GB1,${rowH},1^FS
^FO860,${y}^GB1,${rowH},1^FS
^FO1000,${y}^GB1,${rowH},1^FS`;
    }

    const tableEndY = startY + (maxRows * rowH);
    const summaryBoxY = tableEndY + 12;
    const bottomCardY = summaryBoxY + 148;
    const bottomCardH = 230;
    const outerHeight = bottomCardY + bottomCardH + 10 - 15;

    return `^XA
^PW1180
^LL1180
^PON
^LH0,0

^FX === OUTER FRAME ===
^FO20,15^GB1140,${outerHeight},3^FS

^FX === HEADER BANNER (SOLID INVERTED) WITH KOLI NO ===
^FO20,15^GB1140,75,75^FS
^FO35,26^A0N,44,38^FR^FD${brand.toUpperCase()}^FS
^FO340,33^A0N,28,24^FR^FD|  SEVKIYAT KOLISI^FS
^FO830,26^A0N,38,34^FR^FDKOLI: ${boxNo} / ${totalBoxes}^FS

^FX === SIPARIS & MUSTERI BILGI KARTI ===
^FO20,90^GB1140,105,2^FS

^FO40,100^A0N,20,18^FDSIPARIS NUMARASI^FS
^FO40,124^A0N,38,32^FD#${orderNo}^FS

^FO400,90^GB2,105,2^FS
^FO420,100^A0N,20,18^FDMUSTERI / CARI UNVANI^FS
^FO420,124^A0N,32,28^FD${dealerName}^FS

^FX === MODEL TANIMI ===
^FO20,195^GB1140,48,2^FS
^FO40,208^A0N,22,20^FDURUN / MODEL:^FS
^FO200,206^A0N,30,26^FD${productName}^FS

^FX === TABLO BASLIKLARI (PARCA NO DAHIL 4 KOLON) ===
^FO25,243^GB1130,47,47^FS
^FO40,254^A0N,26,22^FR^FDParca No^FS
^FO320,254^A0N,26,22^FR^FDUrun Aciklamasi^FS
^FO880,254^A0N,26,22^FR^FDBeden^FS
^FO1035,254^A0N,26,22^FR^FDAdet^FS

${rowsZpl}

^FX === ALT TOPLAM KUTUSU ===
^FO25,${summaryBoxY}^GB1130,135,3^FS
^FO45,${summaryBoxY + 16}^A0N,22,18^FDKOLI VE SIPARIS TOPLAM ADEDI^FS
^FO45,${summaryBoxY + 44}^A0N,48,42^FD${totalQty}  /  ${orderTotalQty} ADET^FS
^FO45,${summaryBoxY + 100}^A0N,22,18^FDUretici: VOG TEKSTIL SAN. VE TIC. A.S.^FS

^FO650,${summaryBoxY + 22}^A0N,24,20^FDDurum: SEVKIYATA HAZIR^FS
^FO650,${summaryBoxY + 54}^A0N,24,20^FDKayit: KAGIT IRSALIYE^FS
^FO650,${summaryBoxY + 86}^A0N,22,18^FDIrsaliye: OTOMATIK (LOGO ERP)^FS

^FX === ALT DIGITAL QR & BARKOD KUTUSU ===
^FO25,${bottomCardY}^GB1130,${bottomCardH},2^FS
^FO45,${bottomCardY + 20}^BQN,2,6^FDMA,${barcodeStr}^FS
^BY2,3,75
^FO230,${bottomCardY + 20}^BCN,75,N,N,N^FD${barcodeStr}^FS
^FO230,${bottomCardY + 105}^A0N,28,24^FD${barcodeStr}^FS
^FO230,${bottomCardY + 140}^A0N,22,18^FDDIGITAL KOLI QR & EPC SGTIN-96 DOGRULANDI^FS
^FO230,${bottomCardY + 168}^A0N,20,16^FDTarih: ${currentDate} | VOG RFID TUNNEL SYSTEM OK^FS
^FO230,${bottomCardY + 194}^A0N,18,15^FDSevkiyat No: ${orderNo} | Standart Sevkiyat Kolisi^FS

^PQ1
^XZ\n`;
}

async function main() {
    console.log('🔍 Gerçek master_products veritabanından örnek ürünler çekiliyor...');
    
    // Fetch 1 male sample (e.g. PVWK100037XL) and 1 female sample (e.g. PAUDI25001142)
    const maleRes = await pool.query("SELECT sku, product_name, clean_size, gender, barcode, brand FROM master_products WHERE sku = 'PVWK100037XL' OR (clean_size = 'XL' AND gender = 'ERKEK') LIMIT 1");
    const femaleRes = await pool.query("SELECT sku, product_name, clean_size, gender, barcode, brand FROM master_products WHERE sku = 'PAUDI25001142' OR (clean_size = '42' AND gender = 'KADIN') LIMIT 1");

    const maleItem = maleRes.rows[0] || {
        sku: 'PVWK100037XL',
        product_name: 'Teknisyen Sweatshirt - Erkek',
        clean_size: 'XL',
        gender: 'ERKEK',
        barcode: '8691000373458',
        brand: 'VOLKSWAGEN',
        epc: '303B50CC00422E00000004'
    };

    const femaleItem = femaleRes.rows[0] || {
        sku: 'PAUDI25001142',
        product_name: 'Pantolon Servis Danışmanı',
        clean_size: '42',
        gender: 'KADIN',
        barcode: '8692500114213',
        brand: 'AUDI',
        epc: '303B50CC00422E00000005'
    };

    console.log('📌 Seçilen Örnek Erkek Ürün:', maleItem);
    console.log('📌 Seçilen Örnek Kadın Ürün:', femaleItem);

    // 1. Generate QR ZPL for Male Product (SATO CL4NX Plus RFID)
    const qrZpl = generateSatoRfidZplQr(maleItem);
    const qrPngPath = path.join(ARTIFACT_DIR, 'sato_rfid_qr_preview.png');
    console.log('🖼️ SATO QR RFID Etiket Önizlemesi üretiliyor (8 dpmm, 2.6x1.5 inç)...');
    try {
        await renderZplToPng(qrZpl, '8', '2.6', '1.5', qrPngPath);
        console.log(`✅ Kaydedildi: ${qrPngPath}`);
    } catch (e) {
        console.error('Labelary hatası (QR):', e.message);
    }

    // 2. Generate Classic 1D ZPL for Female Product (SATO CL4NX Plus RFID)
    const classicZpl = generateSatoRfidZplClassic(femaleItem);
    const classicPngPath = path.join(ARTIFACT_DIR, 'sato_rfid_classic_preview.png');
    console.log('🖼️ SATO 1D Klasik RFID Etiket Önizlemesi üretiliyor (8 dpmm, 2.6x1.5 inç)...');
    try {
        await renderZplToPng(classicZpl, '8', '2.6', '1.5', classicPngPath);
        console.log(`✅ Kaydedildi: ${classicPngPath}`);
    } catch (e) {
        console.error('Labelary hatası (Klasik):', e.message);
    }

    // 3. Generate Godex G530 Box Label (100x100mm = 4x4 inç @ 300 DPI / 12 dpmm)
    const boxData = {
        brand: 'VOLKSWAGEN',
        dealer_name: 'DOĞUŞ OTO ESENYURT',
        order_id: '16903',
        box_no: 1,
        total_boxes: 3,
        product_name: 'Teknisyen Sweatshirt - Erkek',
        total_quantity: 100,
        order_total_quantity: 100,
        items: [
            { clean_size: 'M', product_name: 'Teknisyen Sweatshirt - Erkek', quantity: 35 },
            { clean_size: 'L', product_name: 'Teknisyen Sweatshirt - Erkek', quantity: 40 },
            { clean_size: 'XL', product_name: 'Teknisyen Sweatshirt - Erkek', quantity: 25 }
        ]
    };
    const boxZpl = generateGodexBoxZpl(boxData);
    const boxPngPath = path.join(ARTIFACT_DIR, 'godex_box_label_preview.png');
    console.log('🖼️ Godex G530 Koli Etiket Önizlemesi üretiliyor (12 dpmm, 4x4 inç)...');
    try {
        await renderZplToPng(boxZpl, '12', '4', '4', boxPngPath);
        console.log(`✅ Kaydedildi: ${boxPngPath}`);
    } catch (e) {
        console.error('Labelary hatası (Koli):', e.message);
    }

    await pool.end();
}

main().catch(console.error);
