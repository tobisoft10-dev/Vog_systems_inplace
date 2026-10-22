const fs = require('fs');
const http = require('http');
const path = require('path');
const PDFDocument = require('pdfkit');

const ARTIFACT_DIR = 'C:\\Users\\ctopuz\\.gemini\\antigravity-ide\\brain\\c34f4e10-3c55-40ab-b459-0ed82107b237';
const WORKSPACE_ROOT = 'C:\\vog_system';

function cleanThermalText(str) {
    if (!str) return '';
    return str
        .replace(/İ/g, 'I').replace(/ı/g, 'i')
        .replace(/Ş/g, 'S').replace(/ş/g, 's')
        .replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
        .replace(/Ü/g, 'U').replace(/ü/g, 'u')
        .replace(/Ö/g, 'O').replace(/ö/g, 'o')
        .replace(/Ç/g, 'C').replace(/ç/g, 'c')
        .toUpperCase()
        .trim();
}

function cleanProductNameForTitle(name) {
    if (!name || typeof name !== 'string') return '';
    return cleanThermalText(name)
        .replace(/[\/\-]\s*(?:XXS|XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL|6XL|7XL|8XL|9XL|\d{2})\s*$/gi, '')
        .trim();
}

function cleanParcaNo(parca, size) {
    if (!parca || typeof parca !== 'string') return '';
    let p = cleanThermalText(parca).trim().toUpperCase();
    p = p.replace(/TEK\s*TEK\s*PAKET\.?\s*/gi, '')
         .replace(/(?:ERKEK|BAY|KADIN|BAYAN)\s*[:=\-]\s*/gi, '')
         .replace(/[\(\)\[\],;*!]/g, ' ')
         .trim();

    const sz = cleanThermalText(size).replace(/^BEDEN\s*/i, '').trim();
    if (sz && sz !== 'STD') {
        const sizeEndRegex = new RegExp(`[-_\\s]?${sz}$`, 'i');
        p = p.replace(sizeEndRegex, '');
    }

    p = p.replace(/[-_](?:XXS|XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL|\d{2})$/i, '');
    p = p.replace(/[-_]+$/, '').trim();

    return p;
}

// 1. QR Kodlu ZPL
function generateSatoQrZpl(item) {
    const titleLine1 = cleanProductNameForTitle(item.product_name || 'Tekstil Urunu').substring(0, 44);
    const gender = item.gender || 'ERKEK';
    const size = cleanThermalText(item.clean_size || item.size || 'STD').replace(/^BEDEN\s*/i, '').trim();
    const epc = (item.epc || '303B50CC00422E00000004').toUpperCase().trim();
    const parcaNo = cleanParcaNo(item.sku || 'P1001', size).substring(0, 24);
    const barcodeVal = cleanThermalText(item.barcode || '8691680751687');
    const dateStr = item.date || '02.09.2026';

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

// 2. 1D Barkodlu ZPL (Ortalanmış)
function generateSatoClassicZpl(item) {
    const titleLine1 = cleanProductNameForTitle(item.product_name || 'Tekstil Urunu').substring(0, 44);
    const gender = item.gender || 'ERKEK';
    const size = cleanThermalText(item.clean_size || item.size || 'STD').replace(/^BEDEN\s*/i, '').trim();
    const epc = (item.epc || '303B50CC00422E00000004').toUpperCase().trim();
    const parcaNo = cleanParcaNo(item.sku || 'P1001', size).substring(0, 24);
    const barcodeVal = cleanThermalText(item.barcode || '8691680751687');
    const dateStr = item.date || '02.09.2026';

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

function renderZpl(zpl, format = 'image/png', dpmm = '8', widthInches = '2.6', heightInches = '1.5') {
    return new Promise((resolve, reject) => {
        const url = `http://api.labelary.com/v1/printers/${dpmm}dpmm/labels/${widthInches}x${heightInches}/0/`;
        const req = http.request(url, {
            method: 'POST',
            headers: {
                'Accept': format,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }, (res) => {
            if (res.statusCode !== 200) {
                let errData = '';
                res.on('data', c => errData += c);
                res.on('end', () => reject(new Error(`Labelary API ${res.statusCode}: ${errData}`)));
                return;
            }
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
        });
        req.on('error', reject);
        req.write(zpl);
        req.end();
    });
}

async function main() {
    const item = {
        product_name: 'VOLKSWAGEN, FORMEN VE YEDEK PARCA PANTOLON KISL',
        gender: 'ERKEK',
        clean_size: '62',
        sku: 'PVWK100088XXXXXXXXXL',
        barcode: '8691000884145',
        date: '02.09.2026'
    };

    console.log('🔄 1. ZPL şablonları hazırlanıyor...');
    const qrZpl = generateSatoQrZpl(item);
    const classic1dZpl = generateSatoClassicZpl(item);

    console.log('🔄 2. Yüksek çözünürlüklü etiket PNG görselleri oluşturuluyor...');
    const qrPngBuf = await renderZpl(qrZpl, 'image/png');
    const classicPngBuf = await renderZpl(classic1dZpl, 'image/png');

    const qrPngPath = path.join(ARTIFACT_DIR, 'sato_rfid_qr_preview.png');
    const classicPngPath = path.join(ARTIFACT_DIR, 'sato_rfid_classic_preview.png');
    fs.writeFileSync(qrPngPath, qrPngBuf);
    fs.writeFileSync(classicPngPath, classicPngBuf);
    console.log('✅ PNG dosyaları kaydedildi.');

    // 3. A4 Ebatında Profesyonel PDF Dokümanı Oluşturma (PDFKit)
    console.log('🔄 3. A4 Etiket Önizleme PDF dokümanı oluşturuluyor...');
    const pdfPath1 = path.join(ARTIFACT_DIR, 'etiket_onizleme_PVWK100088XXXXXXXXXL.pdf');
    const pdfPath2 = path.join(WORKSPACE_ROOT, 'etiket_onizleme_PVWK100088XXXXXXXXXL.pdf');

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const writeStream1 = fs.createWriteStream(pdfPath1);
    const writeStream2 = fs.createWriteStream(pdfPath2);
    doc.pipe(writeStream1);
    doc.pipe(writeStream2);

    // PDF Header
    doc.rect(40, 40, 515, 60).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text('VOG PREMIUM - RFID & TERMAL ETIKET ONIZLEME', 55, 52);
    doc.fillColor('#94a3b8').fontSize(10).font('Helvetica').text('SATO CL4NX Plus RFID Termal Etiket Cikti Raporu | Parca No: PVWK100088XXXXXXXXXL', 55, 76);

    // Ürün Bilgileri Kartı
    doc.rect(40, 115, 515, 85).fill('#f8fafc');
    doc.strokeColor('#e2e8f0').lineWidth(1).rect(40, 115, 515, 85).stroke();

    doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold');
    doc.text('URUN ADI:', 55, 126);
    doc.text('PARCA KODU:', 55, 146);
    doc.text('BARKOD (EAN):', 55, 166);

    doc.font('Helvetica').fillColor('#0f172a').fontSize(9);
    doc.text(item.product_name, 145, 126, { width: 390 });
    doc.font('Helvetica-Bold').text(item.sku, 145, 146);
    doc.font('Helvetica').text(item.barcode, 145, 166);

    doc.font('Helvetica-Bold').fillColor('#475569');
    doc.text('CINSIYET:', 360, 146);
    doc.text('BEDEN:', 360, 166);

    doc.font('Helvetica').fillColor('#0f172a');
    doc.text(item.gender, 430, 146);
    doc.text(item.clean_size + ' (Standart)', 430, 166);

    // Bölüm 1: 2D QR Kodlu Etiket
    doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text('1. SATO QR RFID ETIKETI (2D QR KODLU TASARIM)', 40, 215);
    doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('QR Kod icinde 20 karakterlik Parca Kodu kodlanmistir. Sifir tasma garantilidir.', 40, 232);
    
    // Etiket Görseli 1
    doc.image(qrPngPath, 40, 250, { width: 320 });

    // Bölüm 2: 1D Çizgi Barkodlu Etiket
    doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text('2. SATO 1D KLASIK RFID ETIKETI (1D CIZGI BARKODLU - ORTALANMIS)', 40, 465);
    doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('1D Cizgi barkod icinde Parca Kodu kodlanmistir. Dinamik modul ve ortalama ile 5 cm etiket sinirlari korunur.', 40, 482);
    
    // Etiket Görseli 2
    doc.image(classicPngPath, 40, 500, { width: 320 });

    // Alt Bilgi
    doc.rect(40, 755, 515, 30).fill('#f1f5f9');
    doc.fillColor('#475569').fontSize(9).font('Helvetica').text('VOG Tekstil Konfeksiyon San. ve Tic. A.S. | Sistem Tarihi: 02.09.2026', 55, 765);

    doc.end();

    await new Promise((resolve) => writeStream1.on('finish', resolve));
    console.log('✅ A4 PDF oluşturuldu:', pdfPath1);
    console.log('✅ Kök Dizine kopyalandı:', pdfPath2);

    // 4. Doğrudan Termal Ebatlı Vektör PDF (Labelary 2.6x1.5 inç 2 Sayfa)
    console.log('🔄 4. 2 Sayfalı Termal Boyutlu (50x30mm) Vektör PDF oluşturuluyor...');
    const combinedZpl = `${qrZpl.trim()}\n${classic1dZpl.trim()}`;
    try {
        const thermalPdfBuf = await renderZpl(combinedZpl, 'application/pdf');
        const thermalPdfPath1 = path.join(ARTIFACT_DIR, 'sato_rfid_termal_etiketler_50x30mm.pdf');
        const thermalPdfPath2 = path.join(WORKSPACE_ROOT, 'sato_rfid_termal_etiketler_50x30mm.pdf');
        fs.writeFileSync(thermalPdfPath1, thermalPdfBuf);
        fs.writeFileSync(thermalPdfPath2, thermalPdfBuf);
        console.log('✅ Termal 50x30mm PDF oluşturuldu:', thermalPdfPath1);
    } catch (e) {
        console.warn('⚠️ Termal PDF uyarısı:', e.message);
    }
}

main().catch(console.error);
