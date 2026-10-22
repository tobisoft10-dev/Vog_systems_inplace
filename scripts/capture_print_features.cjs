const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1600, height: 1000 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Set logged in user in localStorage
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('vog_user', JSON.stringify({
      username: 'admin',
      role: 'admin',
      brand: 'VOLKSWAGEN',
      name: 'VOG Admin'
    }));
    localStorage.setItem('vog_theme_mode', 'light');
  });

  // 1. Visit Personnel Page
  console.log('Navigating to http://localhost:3000/admin/personnel ...');
  await page.goto('http://localhost:3000/admin/personnel', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // Scroll down to the table
  await page.evaluate(() => {
    const tbl = document.querySelector('table');
    if (tbl) tbl.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 1000));

  // Screenshot 1: Tab 1 Table with new columns & 3 buttons
  const shot1 = path.join(__dirname, '..', 'personnel_print_tab1_table_view.png');
  await page.screenshot({ path: shot1, fullPage: false });
  console.log('Screenshot 1 captured:', shot1);

  // 2. Switch to Tab 2: Mini-Sorter
  console.log('Switching to Tab 2 (Mini-Sorter)...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const sorterTab = btns.find(b => b.textContent && b.textContent.includes('Mini-Sorter 60 Göz'));
    if (sorterTab) sorterTab.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Scroll to Tab 2 matching table
  await page.evaluate(() => {
    const tbl = document.querySelector('table');
    if (tbl) tbl.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 1000));

  // Screenshot 2: Tab 2 Sorter matching table
  const shot2 = path.join(__dirname, '..', 'personnel_print_tab2_matching_table_view.png');
  await page.screenshot({ path: shot2, fullPage: false });
  console.log('Screenshot 2 captured:', shot2);

  await browser.close();
  console.log('Done capturing views!');
})().catch(err => {
  console.error('Puppeteer error:', err);
  process.exit(1);
});
