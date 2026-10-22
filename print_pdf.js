import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createOfficialPDF(htmlFile, pdfFile) {
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: '/Users/mumimacbookpro/Documents/Cem/vog-tekstil-premium/chrome/mac_arm-147.0.7727.50/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
  });
  const page = await browser.newPage();
  const filePath = 'file://' + path.join(__dirname, htmlFile);
  
  await page.goto(filePath, { waitUntil: 'networkidle0' });

  // Native Header and Footer Templates
  const headerTemplate = `
    <div style="font-family: 'Inter', sans-serif; font-size: 10px; width: 100%; padding: 20px 60px; display: flex; justify-content: space-between; border-bottom: 1px solid #eee; margin-bottom: 20px;">
      <div style="font-weight: 800; color: #E60000;">VOG ENTERPRISE</div>
      <div style="color: #666;">PROJE ID: <b>VOG-RFID-2026</b> | TARİH: 04.05.2026</div>
    </div>
  `;

  const footerTemplate = `
    <div style="font-family: 'Inter', sans-serif; font-size: 9px; width: 100%; padding: 10px 60px; display: flex; justify-content: space-between; border-top: 1px solid #eee;">
      <div style="color: #999;">© 2026 VOG Enterprise Bilgi Teknolojileri</div>
      <div style="color: #444; font-weight: bold;">SAYFA: <span class="pageNumber"></span> / <span class="totalPages"></span></div>
    </div>
  `;

  await page.pdf({
    path: pdfFile,
    format: 'A4',
    displayHeaderFooter: true,
    headerTemplate: headerTemplate,
    footerTemplate: footerTemplate,
    printBackground: true,
    margin: { 
        top: '100px', 
        bottom: '80px', 
        right: '0px', 
        left: '0px' 
    }
  });

  await browser.close();
  console.log(`Created Official PDF: ${pdfFile}`);
}

async function createSimplePDF(htmlFile, pdfFile) {
    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: '/Users/mumimacbookpro/Documents/Cem/vog-tekstil-premium/chrome/mac_arm-147.0.7727.50/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
    });
    const page = await browser.newPage();
    const filePath = 'file://' + path.join(__dirname, htmlFile);
    await page.goto(filePath, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: pdfFile,
      format: 'A4',
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });
    await browser.close();
    console.log(`Created ${pdfFile}`);
}

(async () => {
  try {
    await createSimplePDF('Vog_Tekstil_Kapsam_Belgesi.html', 'Vog_Tekstil_Kapsam_Belgesi.pdf');
    await createSimplePDF('Vog_Tekstil_Fiyatlandirma_Teklifi.html', 'Vog_Tekstil_Fiyatlandirma_Teklifi.pdf');
    await createOfficialPDF('RFID_ENTEGRASYON_TEKNIK_SARTNAME.html', 'RFID_ENTEGRASYON_TEKNIK_SARTNAME.pdf');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
