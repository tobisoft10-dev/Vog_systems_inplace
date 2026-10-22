const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { generateCode128Svg } = require('./services/barcode_service.cjs');

// Large, full-height crisp SVG barcodes
const bc1Svg = generateCode128Svg('16903-PASS-TR', { height: 46, barWidth: 2.1, fontSize: 11 });
const bc2Svg = generateCode128Svg('16903-KOLI-1', { height: 46, barWidth: 2.1, fontSize: 11 });

// 1. Personel Bazlı Koli Etiketi
const personelLabelHtml = `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Personel Bazlı Koli Etiketi (Önizleme)</title>
    <style>
        @page { size: 100mm 80mm; margin: 0; }
        body {
            margin: 0; padding: 2.5mm; width: 100mm; height: 80mm;
            font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #000; box-sizing: border-box;
        }
        .label-box {
            width: 95mm; height: 75mm; border: 2.5px solid #000; border-radius: 4px;
            padding: 2mm 2.5mm; box-sizing: border-box; display: flex; flex-direction: row; position: relative;
        }
        .main-content { width: 75mm; display: flex; flex-direction: column; padding-right: 2mm; box-sizing: border-box; }
        .barcode-side {
            width: 17mm; border-left: 2px dashed #000; display: flex; align-items: center; justify-content: center;
            box-sizing: border-box; position: relative;
        }
        .rotated-bc {
            transform: rotate(-90deg); transform-origin: center center; white-space: nowrap;
            display: flex; align-items: center; justify-content: center;
            width: 65mm; height: 16mm;
        }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 1mm; margin-bottom: 1.5mm; }
        .logo-title { font-size: 11pt; font-weight: 900; letter-spacing: 0.5px; }
        .badge { font-size: 7pt; font-weight: bold; background: #000; color: #fff; padding: 1px 4px; border-radius: 2px; }
        .dealer-row { margin-bottom: 1.5mm; }
        .field-lbl { font-size: 5.5pt; color: #555; text-transform: uppercase; font-weight: bold; }
        .field-val { font-size: 9.5pt; font-weight: bold; }
        .grid-info {
            display: grid; grid-template-columns: 1.4fr 1fr 0.8fr 0.8fr; gap: 1mm;
            border: 1.5px solid #000; border-radius: 3px; padding: 1.5mm; margin-bottom: 1.5mm; background: #fdfdfd;
        }
        table.items-tbl { width: 100%; border-collapse: collapse; font-size: 6.8pt; flex-grow: 1; }
        table.items-tbl th, table.items-tbl td { border: 1px solid #000; padding: 1mm 1.5mm; text-align: left; }
        table.items-tbl th { background: #f0f0f0; font-weight: bold; }
        .qty-col { text-align: center !important; font-weight: bold; width: 30px; }
    </style>
</head>
<body>
    <div class="label-box">
        <div class="main-content">
            <div class="header">
                <span class="logo-title">VOG TEKSTİL - FORD</span>
                <span class="badge">PERSONEL KOLİSİ</span>
            </div>
            <div class="dealer-row">
                <div class="field-lbl">BAYİ / SERVİS ADI</div>
                <div class="field-val">DOĞUŞ OTO PAZARLAMA VE TİCARET A.Ş.</div>
            </div>
            <div class="grid-info">
                <div><div class="field-lbl">PERSONEL İSMİ</div><div class="field-val" style="color:#d9534f;">CEM YILMAZ</div></div>
                <div><div class="field-lbl">BÖLÜM / GÖREV</div><div class="field-val">Servis Danışmanı</div></div>
                <div><div class="field-lbl">CİNSİYET</div><div class="field-val">Erkek</div></div>
                <div><div class="field-lbl">BEDEN</div><div class="field-val">L</div></div>
            </div>
            <table class="items-tbl">
                <thead><tr><th>Parça / SKU</th><th>Ürün Adı</th><th class="qty-col">Adet</th></tr></thead>
                <tbody>
                    <tr><td>153.01.0001</td><td>2026 Kışlık Ford Softshell Mont</td><td class="qty-col">1</td></tr>
                    <tr><td>153.01.0002</td><td>2026 Kışlık Ford Pantolon</td><td class="qty-col">1</td></tr>
                </tbody>
                <tfoot>
                    <tr style="background:#f9f9f9;"><td colspan="2" style="text-align:right; font-weight:bold;">Toplam:</td><td class="qty-col">2</td></tr>
                </tfoot>
            </table>
        </div>
        <div class="barcode-side">
            <div class="rotated-bc">${bc1Svg}</div>
        </div>
    </div>
</body>
</html>
`;

// 2. Sipariş / Toplu Koli Bazlı Etiket
const siparisLabelHtml = `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Sipariş Bazlı Toplu Koli Etiketi (Önizleme)</title>
    <style>
        @page { size: 100mm 80mm; margin: 0; }
        body {
            margin: 0; padding: 2.5mm; width: 100mm; height: 80mm;
            font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #000; box-sizing: border-box;
        }
        .label-box {
            width: 95mm; height: 75mm; border: 2.5px solid #000; border-radius: 4px;
            padding: 2mm 2.5mm; box-sizing: border-box; display: flex; flex-direction: row; position: relative;
        }
        .main-content { width: 75mm; display: flex; flex-direction: column; padding-right: 2mm; box-sizing: border-box; }
        .barcode-side {
            width: 17mm; border-left: 2px dashed #000; display: flex; align-items: center; justify-content: center;
            box-sizing: border-box; position: relative;
        }
        .rotated-bc {
            transform: rotate(-90deg); transform-origin: center center; white-space: nowrap;
            display: flex; align-items: center; justify-content: center;
            width: 65mm; height: 16mm;
        }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 1mm; margin-bottom: 1.5mm; }
        .logo-title { font-size: 11pt; font-weight: 900; letter-spacing: 0.5px; }
        .badge-bulk { font-size: 7pt; font-weight: bold; background: #0275d8; color: #fff; padding: 1px 4px; border-radius: 2px; }
        .field-lbl { font-size: 5.5pt; color: #555; text-transform: uppercase; font-weight: bold; }
        .field-val { font-size: 9.5pt; font-weight: bold; }
        .order-meta-grid {
            display: grid; grid-template-columns: 1.2fr 1.8fr 1fr; gap: 1mm;
            border: 1.5px solid #000; border-radius: 3px; padding: 1.5mm; margin-bottom: 1.5mm; background: #fdfdfd;
        }
        .box-highlight { background: #000; color: #fff; text-align: center; border-radius: 2px; padding: 1px 0; }
        .box-highlight .field-lbl { color: #ccc; }
        .box-highlight .field-val { color: #fff; font-size: 11pt; }
        table.items-tbl { width: 100%; border-collapse: collapse; font-size: 6.8pt; flex-grow: 1; }
        table.items-tbl th, table.items-tbl td { border: 1px solid #000; padding: 1mm 1.5mm; text-align: left; }
        table.items-tbl th { background: #f0f0f0; font-weight: bold; }
        .qty-col { text-align: center !important; font-weight: bold; width: 32px; }
    </style>
</head>
<body>
    <div class="label-box">
        <div class="main-content">
            <div class="header">
                <span class="logo-title">VOG TEKSTİL - FORD</span>
                <span class="badge-bulk">SEVKİYAT KOLİSİ</span>
            </div>
            
            <div class="order-meta-grid">
                <div><div class="field-lbl">SİPARİŞ NO</div><div class="field-val" style="color:#0275d8; font-size:11pt;">#16903</div></div>
                <div><div class="field-lbl">MÜŞTERİ / CARİ</div><div class="field-val">DOĞUŞ OTO PAZ.</div></div>
                <div class="box-highlight">
                    <div class="field-lbl">KOLİ NO</div>
                    <div class="field-val">1 / 1</div>
                </div>
            </div>

            <div style="margin-bottom: 1mm;">
                <div class="field-lbl">ÜRÜN / MODEL TANIMI</div>
                <div class="field-val" style="font-size:8.5pt;">2026 KIŞLIK FORD SOFTSHELL MONT (24ST)</div>
            </div>

            <table class="items-tbl">
                <thead>
                    <tr>
                        <th style="width: 25%;">Beden</th>
                        <th>Stok / SKU Kodu</th>
                        <th class="qty-col">Koli İçi</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td><b>L</b> Beden</td><td>153.01.0001</td><td class="qty-col">2 Adet</td></tr>
                </tbody>
                <tfoot>
                    <tr style="background:#eef7ff;">
                        <td colspan="2" style="text-align:right; font-weight:bold;">Koli Toplamı / Sipariş Toplamı:</td>
                        <td class="qty-col" style="font-size:8pt; color:#0275d8;">2 / 2</td>
                    </tr>
                </tfoot>
            </table>
        </div>
        <div class="barcode-side">
            <div class="rotated-bc">${bc2Svg}</div>
        </div>
    </div>
</body>
</html>
`;

fs.writeFileSync('c:\\vog_system\\public\\preview_personel_label.html', personelLabelHtml, 'utf8');
fs.writeFileSync('c:\\vog_system\\public\\preview_siparis_label.html', siparisLabelHtml, 'utf8');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        
        // Render Personel Label
        const page1 = await browser.newPage();
        await page1.setViewport({ width: 640, height: 500, deviceScaleFactor: 2 });
        await page1.setContent(personelLabelHtml, { waitUntil: 'networkidle0' });
        await page1.screenshot({ path: 'c:\\vog_system\\public\\preview_personel_label.png' });
        
        // Render Siparis Label
        const page2 = await browser.newPage();
        await page2.setViewport({ width: 640, height: 500, deviceScaleFactor: 2 });
        await page2.setContent(siparisLabelHtml, { waitUntil: 'networkidle0' });
        await page2.screenshot({ path: 'c:\\vog_system\\public\\preview_siparis_label.png' });

        await browser.close();
        console.log('✅ Yenilenmiş büyük barkodlu etiket önizlemeleri üretildi!');
    } catch (e) {
        console.error('Puppeteer error:', e.message);
    }
})();
