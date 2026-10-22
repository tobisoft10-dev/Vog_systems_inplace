const { Pool } = require('pg');
const xlsx = require('xlsx');
require('dotenv').config({ path: 'c:/vog_system/server/.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'vog_system'
});

async function main() {
  console.log('--- PREPARING SCANIA MASTER_PRODUCTS UPDATE ---');

  // Load official Excel definitions
  const yazFile = 'C:\\Users\\ctopuz\\Downloads\\Scania 2026 Yaz Kişi Listesi.xlsx';
  const kisFile = 'C:\\Users\\ctopuz\\Downloads\\SCANIA KIŞ 2025 KİŞİ LİSTESİ.xlsx';

  const wbYaz = xlsx.readFile(yazFile);
  const sheetYazDef = wbYaz.Sheets['Yazlık Kıyafet-Parça Tanımları'];
  const yazRows = xlsx.utils.sheet_to_json(sheetYazDef);

  const wbKis = xlsx.readFile(kisFile);
  const sheetKisDef = wbKis.Sheets['Kodlar'];
  const kisRows = xlsx.utils.sheet_to_json(sheetKisDef);

  const officialItems = new Map();

  function ingest(r) {
    const code = (r['Parça Kodu'] || '').toString().trim().toUpperCase();
    const name = (r['Ürün Adı'] || '').toString().trim();
    const size = (r['Beden'] || '').toString().trim().toUpperCase();
    if (code && code.startsWith('SCKY')) {
      if (!officialItems.has(code)) {
        officialItems.set(code, { code, name, size });
      }
    }
  }

  yazRows.forEach(ingest);
  kisRows.forEach(ingest);

  console.log(`Loaded ${officialItems.size} official Scania catalog items from Excel.`);

  // 1. Update/Upsert official items in master_products
  let updatedCount = 0;
  let insertedCount = 0;

  for (const [code, item] of officialItems.entries()) {
    const existing = await pool.query("SELECT id FROM master_products WHERE sku = $1", [code]);
    if (existing.rows.length > 0) {
      await pool.query(`
        UPDATE master_products
        SET 
          sku = $1,
          code39 = $1,
          barcode = $1,
          ean13 = $1,
          product_name = $2,
          size = $3::character varying,
          clean_size = $4::character varying,
          brand = 'SCANIA',
          updated_at = NOW()
        WHERE id = $5
      `, [code, item.name, item.size, item.size, existing.rows[0].id]);
      updatedCount++;
    } else {
      await pool.query(`
        INSERT INTO master_products (id, sku, code39, barcode, ean13, product_name, size, clean_size, brand, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $1, $1, $1, $2, $3::character varying, $4::character varying, 'SCANIA', NOW(), NOW())
      `, [code, item.name, item.size, item.size]);
      insertedCount++;
    }
  }

  console.log(`✓ master_products: ${updatedCount} updated, ${insertedCount} inserted.`);

  // 2. Remove accidental prefix products (e.g. 'SCKY205', 'SCKY210') that have length <= 8
  const deleteRes = await pool.query(`
    DELETE FROM master_products 
    WHERE sku LIKE 'SCKY%' AND length(sku) < 9
  `);
  console.log(`✓ Deleted ${deleteRes.rowCount} incomplete prefix-only rows (e.g. SCKY205).`);

  // 3. For any remaining brand = 'SCANIA' products, set code39 = sku and barcode = sku
  const allScaniaRes = await pool.query(`
    UPDATE master_products
    SET 
      code39 = sku,
      barcode = sku,
      ean13 = sku,
      updated_at = NOW()
    WHERE UPPER(brand) = 'SCANIA' AND (barcode != sku OR code39 != sku)
  `);
  console.log(`✓ Synchronized code39 and barcode = sku for ${allScaniaRes.rowCount} other SCANIA rows in master_products.`);

  // 4. Update personnel.bundle_items JSONB for all SCANIA personnel
  const scaniaStaffRes = await pool.query("SELECT id, bundle_items FROM personnel WHERE UPPER(brand) = 'SCANIA'");
  console.log(`Updating bundle_items for ${scaniaStaffRes.rows.length} Scania staff...`);

  let staffUpdated = 0;
  for (const staff of scaniaStaffRes.rows) {
    let bundle = staff.bundle_items;
    if (typeof bundle === 'string') {
      try { bundle = JSON.parse(bundle); } catch(e) { bundle = []; }
    }
    if (Array.isArray(bundle) && bundle.length > 0) {
      let modified = false;
      const newBundle = bundle.map(it => {
        const sku = (it.sku || it.part_no || '').trim().toUpperCase();
        // If official item exists, get official name
        const off = officialItems.get(sku);
        const newBarcode = sku;
        if (it.barcode !== newBarcode || it.ean13 !== newBarcode || (off && it.name !== off.name)) {
          modified = true;
          return {
            ...it,
            name: off ? off.name : it.name,
            part_no: sku,
            sku: sku,
            barcode: newBarcode,
            ean13: newBarcode
          };
        }
        return it;
      });

      if (modified) {
        await pool.query("UPDATE personnel SET bundle_items = $1, updated_at = NOW() WHERE id = $2", [JSON.stringify(newBundle), staff.id]);
        staffUpdated++;
      }
    }
  }
  console.log(`✓ Updated bundle_items in personnel for ${staffUpdated} Scania staff.`);

  // 5. Update rfid_tags table for Scania
  const rfidRes = await pool.query(`
    UPDATE rfid_tags
    SET barcode = sku
    WHERE UPPER(brand) = 'SCANIA' AND barcode != sku
  `);
  console.log(`✓ Updated ${rfidRes.rowCount} Scania tags in rfid_tags so barcode = sku.`);

  console.log('\n--- SCANIA SKU / CODE39 / BARCODE UPDATE COMPLETE ---');
  await pool.end();
}

main().catch(err => {
  console.error('Update failed:', err);
  process.exit(1);
});
