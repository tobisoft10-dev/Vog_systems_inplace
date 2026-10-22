const http = require('http');
const puppeteer = require('puppeteer');
const path = require('path');

function req(options, body) {
  return new Promise((resolve, reject) => {
    const r = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

(async () => {
  console.log('1. Getting staff...');
  const staffRes = await req({ hostname: 'localhost', port: 3001, path: '/api/personnel-orders/staff-list?brand=VOLKSWAGEN', method: 'GET' });
  const staffIds = staffRes.staff.slice(0, 10).map(s => s.id);

  console.log('2. Allocating 8 staff to chutes...');
  const allocRes = await req(
    { hostname: 'localhost', port: 3001, path: '/api/personnel-orders/allocate-sorter', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { staff_ids: staffIds.slice(0, 8), start_chute: 1, end_chute: 60, brand: 'VOLKSWAGEN' }
  );
  console.log('Allocated response:', allocRes);

  console.log('3. Capturing Tab 2 screenshot with Puppeteer...');
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1600, height: 1000 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('vog_user', JSON.stringify({ username: 'admin', role: 'admin', brand: 'VOLKSWAGEN', name: 'VOG Admin' }));
    localStorage.setItem('vog_theme_mode', 'light');
  });

  await page.goto('http://localhost:3000/admin/personnel', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  // Switch to Tab 2
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const sorterTab = btns.find(b => b.textContent && b.textContent.includes('Mini-Sorter 60 Göz'));
    if (sorterTab) sorterTab.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Scroll to matching table
  await page.evaluate(() => {
    const tbl = document.querySelector('table');
    if (tbl) tbl.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 1000));

  const shot = path.join(__dirname, '..', 'personnel_tab2_live_matching_populated.png');
  await page.screenshot({ path: shot });
  console.log('Saved:', shot);

  await browser.close();
})().catch(console.error);
