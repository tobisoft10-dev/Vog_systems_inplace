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
  const allExcelItems = [...yazItems, ...kisItems];

  const mssqlMp = queryMssqlJson("SELECT Id, ParcaNo, Barkod, Ean13, CleanBeden, Beden, UrunAdi, Marka, Grup, Cinsiyet FROM [SIPARIS].[dbo].[MasterUrunler] WHERE ParcaNo LIKE 'PSKD%'");
  const pgMp = await pool.query("SELECT id, sku, barcode, ean13, clean_size, size, product_name, brand, grup, gender FROM master_products WHERE sku LIKE 'PSKD%'");

  const mssqlMap = new Map(mssqlMp.map(p => [p.ParcaNo.trim().toUpperCase(), p]));
  const pgMap = new Map(pgMp.rows.map(p => [p.sku.trim().toUpperCase(), p]));

  console.log('=== Excel vs DB Comparison for 158 Variants ===');
  let diffNameCount = 0;
  let diffBedenCount = 0;

  for (const item of allExcelItems) {
    const code = item.parcaKodu.toUpperCase();
    const m = mssqlMap.get(code);
    const p = pgMap.get(code);

    if (m) {
      if (m.UrunAdi !== item.desc) {
        diffNameCount++;
        if (diffNameCount <= 10) {
          console.log(`[NAME DIFF] ${code}: Excel="${item.desc}" vs MSSQL="${m.UrunAdi}"`);
        }
      }
      if (m.Beden !== item.beden) {
        diffBedenCount++;
        if (diffBedenCount <= 10) {
          console.log(`[BEDEN DIFF] ${code}: Excel="${item.beden}" vs MSSQL="${m.Beden}" (CleanBeden="${m.CleanBeden}")`);
        }
      }
    }
  }

  console.log(`Total Name Differences: ${diffNameCount} / ${allExcelItems.length}`);
  console.log(`Total Beden Differences: ${diffBedenCount} / ${allExcelItems.length}`);

  await pool.end();
}

run().catch(console.error);
