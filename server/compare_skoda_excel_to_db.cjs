const XLSX = require('xlsx');
const { Pool } = require('pg');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: 'postgres',
  password: '150609%M',
  host: 'localhost',
  port: 5432,
  database: 'vog_db'
});

function queryMssqlJson(queryText) {
  const tmpFile = path.join(__dirname, `tmp_sk_${Date.now()}.json`);
  const cleanQuery = queryText.replace(/\r?\n/g, ' ');
  const cmd = `sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -f 65001 -w 65535 -y 0 -o "${tmpFile}" -Q "SET NOCOUNT ON; ${cleanQuery} FOR JSON PATH"`;
  try {
    execSync(cmd, { stdio: 'pipe', windowsHide: true, maxBuffer: 50 * 1024 * 1024 });
    if (fs.existsSync(tmpFile)) {
      const raw = fs.readFileSync(tmpFile, 'utf8');
      try { fs.unlinkSync(tmpFile); } catch (e) { }
      const jsonStr = raw.split(/\r?\n/).map(l => l.trim()).join('');
      if (jsonStr) return JSON.parse(jsonStr);
    }
  } catch (err) {
    console.error('MSSQL JSON Query Error:', err.message);
  }
  return [];
}

function parseExcelItems(filePath, yearType) {
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const items = [];
  const seenCodes = new Set();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const desc = String(r[0] || '').trim();
    const beden = String(r[4] || '').trim();
    const parcaKodu = String(r[5] || '').trim();
    const adet = parseInt(String(r[6] || '0').trim(), 10) || 0;

    if (!parcaKodu || parcaKodu.includes('Parça Kodu') || seenCodes.has(parcaKodu)) continue;
    seenCodes.add(parcaKodu);

    items.push({
      yearType,
      row: i + 1,
      desc,
      beden,
      parcaKodu,
      adet
    });
  }
  return items;
}

async function run() {
  const yazItems = parseExcelItems('C:\\Users\\ctopuz\\Downloads\\Skoda Barkodlar 2026 YAZ.XLSX', '2026 YAZ');
  const kisItems = parseExcelItems('C:\\Users\\ctopuz\\Downloads\\Skoda Barkodlar 2025 KIŞ.XLSX', '2025 KIŞ');

  console.log(`2026 YAZ Distinct Items: ${yazItems.length}`);
  console.log(`2025 KIŞ Distinct Items: ${kisItems.length}`);
  const allExcelItems = [...yazItems, ...kisItems];
  console.log(`Total Excel Unique Codes: ${allExcelItems.length}`);

  // Check how many of these exist in MSSQL MasterUrunler and PG master_products
  const mssqlMp = queryMssqlJson("SELECT ParcaNo, Barkod, Ean13, CleanBeden, Beden, UrunAdi FROM [SIPARIS].[dbo].[MasterUrunler] WHERE ParcaNo LIKE 'PSKD%'");
  const pgMp = await pool.query("SELECT sku, barcode, ean13, clean_size, size, product_name FROM master_products WHERE sku LIKE 'PSKD%'");

  const mssqlMap = new Map(mssqlMp.map(p => [p.ParcaNo.trim().toUpperCase(), p]));
  const pgMap = new Map(pgMp.rows.map(p => [p.sku.trim().toUpperCase(), p]));

  let missingInMssql = 0;
  let missingInPg = 0;

  for (const item of allExcelItems) {
    const code = item.parcaKodu.toUpperCase();
    if (!mssqlMap.has(code)) {
      missingInMssql++;
      console.log(`[MSSQL MISSING] ${item.yearType} | Row ${item.row} | ${item.parcaKodu} | ${item.beden} | ${item.desc}`);
    }
    if (!pgMap.has(code)) {
      missingInPg++;
      console.log(`[PG MISSING] ${item.yearType} | Row ${item.row} | ${item.parcaKodu} | ${item.beden} | ${item.desc}`);
    }
  }

  console.log(`\nMissing in MSSQL MasterUrunler: ${missingInMssql}`);
  console.log(`Missing in PG master_products: ${missingInPg}`);

  await pool.end();
}

run().catch(console.error);
