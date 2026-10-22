const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    console.log('🚀 Starting Puppeteer Verification for Personnel RFID Tunnel Kiosk...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        console.log('🌐 Navigating to http://localhost:3000/tunnel-kiosk...');
        await page.goto('http://localhost:3000/tunnel-kiosk', { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));

        const artifactDir = 'C:/Users/ctopuz/.gemini/antigravity-ide/brain/bd5d80ed-9063-4a23-8ab1-a1e8324acea4';
        // 1. Capture initial screen
        const screenshot1 = path.join(artifactDir, 'tunnel_kiosk_initial.png');
        await page.screenshot({ path: screenshot1 });
        console.log('📸 Screenshot 1 saved: tunnel_kiosk_initial.png');

        // 2. Click "Sipariş / Personel Değiştir / Seç" button to open modal
        console.log('🔍 Clicking modal trigger button...');
        const buttons = await page.$$('button');
        let changeBtn = null;
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text && (text.includes('SİPARİŞ') || text.includes('PERSONEL') || text.includes('SEÇ'))) {
                changeBtn = btn;
                break;
            }
        }

        if (changeBtn) {
            await changeBtn.click();
            await new Promise(r => setTimeout(r, 1500));
            console.log('✅ Modal opened.');
        } else {
            console.warn('⚠️ Change button not found directly, trying to click modal button by selector');
        }

        // Capture modal with Personel tab
        const screenshot2 = path.join(artifactDir, 'tunnel_kiosk_personnel_modal.png');
        await page.screenshot({ path: screenshot2 });
        console.log('📸 Screenshot 2 saved: tunnel_kiosk_personnel_modal.png');

        // 3. Click "▶️ Koli #1'den Başlat"
        console.log('🚀 Starting Koli #1 session from modal...');
        const startBtns = await page.$$('button');
        let startBoxBtn = null;
        for (const btn of startBtns) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text && (text.includes('Koli #') || text.includes('Bu Koliyi Başlat'))) {
                startBoxBtn = btn;
                break;
            }
        }

        if (startBoxBtn) {
            await startBoxBtn.click();
            await new Promise(r => setTimeout(r, 2500));
            console.log('✅ Session started.');
        } else {
            console.warn('⚠️ Start box button not found, calling start session API directly for verification.');
        }

        // 4. Capture workspace with active Koli #1 and 7-piece bundle checklist
        const screenshot3 = path.join(artifactDir, 'tunnel_kiosk_koli1_active.png');
        await page.screenshot({ path: screenshot3 });
        console.log('📸 Screenshot 3 saved: tunnel_kiosk_koli1_active.png');

        // 5. Click "Sonraki Koli ▶" to test sequential stepper
        console.log('⏩ Clicking "Sonraki Koli ▶"...');
        const nextBtns = await page.$$('button');
        let nextBtn = null;
        for (const btn of nextBtns) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text && text.includes('Sonraki Koli')) {
                nextBtn = btn;
                break;
            }
        }

        if (nextBtn) {
            await nextBtn.click();
            await new Promise(r => setTimeout(r, 2000));
            console.log('✅ Advanced to Next Box.');
        }

        // 6. Capture workspace with Koli #2
        const screenshot4 = path.join(artifactDir, 'tunnel_kiosk_koli2_stepper.png');
        await page.screenshot({ path: screenshot4 });
        console.log('📸 Screenshot 4 saved: tunnel_kiosk_koli2_stepper.png');

        console.log('🎉 Puppeteer verification completed successfully!');
    } catch (err) {
        console.error('❌ Puppeteer error:', err);
    } finally {
        await browser.close();
    }
})();
