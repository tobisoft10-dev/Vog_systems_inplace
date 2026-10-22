const puppeteer = require('puppeteer');

(async () => {
    try {
        const resp = await fetch('http://localhost:3001/api/print-label/16903?noprint=true');
        const html = await resp.text();

        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        await page.setViewport({ width: 600, height: 480 });
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.screenshot({ path: 'c:\\vog_system\\public\\order_16903_live_preview.png' });
        await browser.close();
        console.log('✅ Sipariş #16903 canlı etiket önizleme ekran görüntüsü oluşturuldu!');
    } catch (e) {
        console.error('Screenshot error:', e.message);
    }
})();
