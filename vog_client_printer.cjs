/**
 * VOG TEKSTİL - İSTEMCİ YAZICI SERVİSİ (CLIENT PRINTER SERVICE)
 * 
 * Bu uygulama Godex G530 etiket yazıcısının takılı olduğu bilgisayarda arka planda çalışır.
 * Tünelden geçen ve status = 'waiting' olan kolileri anında algılayıp önizlemesiz, 
 * tarayıcı açmadan doğrudan Godex G530 yazıcısına basar ve durumu 'printed' yapar.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const puppeteer = require('puppeteer');

// SERVER CONFIGURATION
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';
const PRINTER_NAME = process.env.PRINTER_NAME || 'Godex G530 (redirected 2)';
const POLL_INTERVAL_MS = 2000; // Check every 2 seconds

let isProcessing = false;

console.log("======================================================");
console.log("🚀 VOG TEKSTİL İSTEMCİ ETİKET YAZICI SERVİSİ BAŞLATILDI");
console.log(`🌐 Sunucu Adresi : ${SERVER_URL}`);
console.log(`🖨️ Hedef Yazıcı  : ${PRINTER_NAME}`);
console.log(`⏱️ Tarama Sıklığı : ${POLL_INTERVAL_MS / 1000} Saniye`);
console.log("======================================================\n");

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

function fetchText(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function postRequest(url) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const options = {
            hostname: u.hostname,
            port: u.port,
            path: u.pathname + u.search,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.end();
    });
}

async function processPendingLabels() {
    if (isProcessing) return;
    isProcessing = true;

    try {
        const pendingData = await fetchJson(`${SERVER_URL}/api/box-labels/pending`);
        if (pendingData && pendingData.success && Array.isArray(pendingData.data) && pendingData.data.length > 0) {
            const nextOrder = pendingData.data[pendingData.data.length - 1]; // Pick oldest first
            const orderId = nextOrder.order_id || nextOrder.id;

            console.log(`\n🔔 [YENİ ETİKET ALGILANDI] Sipariş #${orderId} (${nextOrder.waiting_count || 1} Adet Ürün)`);
            console.log(`📥 Etiket şablonu sunucudan indiriliyor...`);

            // 1. Get Brand Label HTML from Server
            const htmlContent = await fetchText(`${SERVER_URL}/api/print-label/${orderId}?noprint=true`);
            const tempPdfPath = path.join(__dirname, `temp_client_label_${orderId}_${Date.now()}.pdf`);

            // 2. Render to 100mm x 80mm PDF
            const browser = await puppeteer.launch({ headless: 'new' });
            const page = await browser.newPage();
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
            await page.pdf({
                path: tempPdfPath,
                width: '100mm',
                height: '80mm',
                printBackground: true,
                margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
            });
            await browser.close();

            // 3. Print directly to local printer via Edge Headless or PowerShell
            console.log(`🖨️ '${PRINTER_NAME}' etiket yazıcısına doğrudan önizlemesiz basılıyor...`);
            const printCmd = `& "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" --headless --no-pdf-header-footer --print-to="${PRINTER_NAME}" "${tempPdfPath}"`;

            exec(printCmd, async (err) => {
                if (err) {
                    // Fallback to default Windows printer if specified printer name fails
                    const fallbackCmd = `& "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" --headless --no-pdf-header-footer --print "${tempPdfPath}"`;
                    exec(fallbackCmd);
                }
                console.log(`🎉 [BAŞARILI] Sipariş #${orderId} etiketi yazıcıya gönderildi!`);

                // 4. Mark as printed on Server
                try {
                    await postRequest(`${SERVER_URL}/api/box-labels/mark-printed/${orderId}`);
                    console.log(`✅ [DURUM GÜNCELLENDİ] Sipariş #${orderId} 'printed' olarak kaydedildi.`);
                } catch (markErr) {
                    console.error('Mark printed error:', markErr.message);
                }

                // Clean up temp PDF
                setTimeout(() => {
                    if (fs.existsSync(tempPdfPath)) {
                        try { fs.unlinkSync(tempPdfPath); } catch (e) {}
                    }
                }, 4000);
            });
        }
    } catch (err) {
        // Silent loop error catch
    } finally {
        isProcessing = false;
    }
}

// Start infinite polling loop
setInterval(processPendingLabels, POLL_INTERVAL_MS);
