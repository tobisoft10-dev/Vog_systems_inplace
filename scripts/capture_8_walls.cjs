const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1650, height: 1100 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('vog_user', JSON.stringify({ username: 'admin', role: 'admin', brand: 'VOLKSWAGEN', name: 'VOG Admin' }));
    localStorage.setItem('vog_theme_mode', 'light');
  });

  // 1. Visit Personnel Tab 2 (Mini-Sorter)
  console.log('Navigating to http://localhost:3000/admin/personnel ...');
  await page.goto('http://localhost:3000/admin/personnel', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  // Switch to Tab 2
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const sorterTab = btns.find(b => b.textContent && b.textContent.includes('Mini-Sorter 60 Göz'));
    if (sorterTab) sorterTab.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Scroll to 8 Walls Section
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h3'));
    const wallHeading = headings.find(h => h.textContent && h.textContent.includes('8 Fiziksel Sorter Duvarı'));
    if (wallHeading) wallHeading.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 1000));

  const shot1 = path.join(__dirname, '..', 'eight_walls_personnel_sorter_matrix.png');
  await page.screenshot({ path: shot1 });
  console.log('Screenshot 1 captured:', shot1);

  // 2. Visit Hardware Dashboard (/admin/iot)
  console.log('Navigating to http://localhost:3000/admin/iot ...');
  await page.goto('http://localhost:3000/admin/iot', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));

  const shot2 = path.join(__dirname, '..', 'eight_walls_hardware_dashboard.png');
  await page.screenshot({ path: shot2 });
  console.log('Screenshot 2 captured:', shot2);

  await browser.close();
  console.log('All 8-wall screenshots captured successfully!');
})().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
