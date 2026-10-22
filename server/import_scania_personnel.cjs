const xlsx = require('xlsx');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: 'c:/vog_system/server/.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'vog_system'
});

async function main() {
  const yazPath = 'C:\\Users\\ctopuz\\Downloads\\Scania 2026 Yaz Kişi Listesi.xlsx';
  const kisPath = 'C:\\Users\\ctopuz\\Downloads\\SCANIA KIŞ 2025 KİŞİ LİSTESİ.xlsx';

  console.log('--- Connecting to DB and checking columns ---');
  await pool.query('ALTER TABLE personnel ADD COLUMN IF NOT EXISTS bundle_items JSONB;');

  // Fetch all master_products for Scania
  const mpRes = await pool.query("SELECT sku, ean13, barcode, product_name, size FROM master_products WHERE brand ILIKE '%SCANIA%'");
  const mpMap = new Map();
  mpRes.rows.forEach(r => {
    if (r.sku) mpMap.set(r.sku.toUpperCase().trim(), r);
  });
  console.log(`Loaded ${mpMap.size} Scania products from master_products.`);

  const staffToInsert = [];
  let boxSequence = 1;

  // ----------------------------------------------------
  // PARSE YAZ 2026
  // ----------------------------------------------------
  const wbYaz = xlsx.readFile(yazPath);

  // 1. Yaz - Danışman
  const dYazRows = xlsx.utils.sheet_to_json(wbYaz.Sheets['Danışman'], { header: 1, defval: '' });
  for (let r = 3; r < dYazRows.length; r++) {
    const row = dYazRows[r];
    const ys = String(row[1] || '').trim();
    const name = String(row[2] || '').trim();
    const role = String(row[3] || 'Servis Danışmanı').trim();
    const gender = String(row[4] || 'Erkek').trim();
    const bottom = String(row[5] || '').trim();
    const top = String(row[6] || '').trim();
    if (!name || !ys) continue;

    const rawItems = [
      { name: 'Danışman Pantolon', qty: parseInt(row[7], 10) || 0, sku: String(row[8] || '').trim(), size: bottom },
      { name: 'Danışman Kısa Kollu Gömlek', qty: parseInt(row[9], 10) || 0, sku: String(row[10] || '').trim(), size: top },
      { name: 'Danışman Polo Yaka Tişört', qty: parseInt(row[11], 10) || 0, sku: String(row[12] || '').trim(), size: top }
    ];

    const bundle = rawItems.filter(it => it.qty > 0 && it.sku).map((it, idx) => {
      const mp = mpMap.get(it.sku.toUpperCase());
      return {
        id: `yaz_d_${idx + 1}`,
        name: mp?.product_name || it.name,
        short_name: it.name,
        sku: it.sku,
        part_no: it.sku,
        size: mp?.size || it.size || top,
        quantity: it.qty,
        qty: it.qty,
        target: it.qty,
        barcode: mp?.ean13 || mp?.barcode || '8692577798149',
        ean13: mp?.ean13 || mp?.barcode || '8692577798149'
      };
    });

    const boxNo = boxSequence++;
    staffToInsert.push({
      id: uuidv4(),
      name,
      service_center: ys,
      department: 'Danışman (Yaz)',
      role,
      gender,
      top_size: top,
      bottom_size: bottom,
      shoe_size: null,
      brand: 'SCANIA',
      mont_preference: 'YAZ',
      box_no: boxNo,
      box_barcode: `KOLI-SC-${String(boxNo).padStart(4, '0')}`,
      packing_status: 'PENDING',
      last_step: 'PLANLAMA',
      voucher_status: 'BEKLİYOR',
      bundle_items: JSON.stringify(bundle)
    });
  }

  // 2. Yaz - Yedek Parça
  const ypYazRows = xlsx.utils.sheet_to_json(wbYaz.Sheets['Yedek Parça'], { header: 1, defval: '' });
  for (let r = 2; r < ypYazRows.length; r++) {
    const row = ypYazRows[r];
    const ys = String(row[1] || '').trim();
    const name = String(row[2] || '').trim();
    const role = String(row[3] || 'Yedek Parça').trim();
    const gender = String(row[4] || 'Erkek').trim();
    const bottom = String(row[5] || '').trim();
    const top = String(row[6] || '').trim();
    if (!name || !ys) continue;

    const rawItems = [
      { name: 'Yedek Parça Pantolon', qty: parseInt(row[7], 10) || 0, sku: String(row[8] || '').trim(), size: bottom },
      { name: 'Yedek Parça Tişört', qty: parseInt(row[9], 10) || 0, sku: String(row[10] || '').trim(), size: top },
      { name: 'Yedek Parça Polo Yaka Tişört', qty: parseInt(row[11], 10) || 0, sku: String(row[12] || '').trim(), size: top }
    ];

    const bundle = rawItems.filter(it => it.qty > 0 && it.sku).map((it, idx) => {
      const mp = mpMap.get(it.sku.toUpperCase());
      return {
        id: `yaz_yp_${idx + 1}`,
        name: mp?.product_name || it.name,
        short_name: it.name,
        sku: it.sku,
        part_no: it.sku,
        size: mp?.size || it.size || top,
        quantity: it.qty,
        qty: it.qty,
        target: it.qty,
        barcode: mp?.ean13 || mp?.barcode || '8692577798149',
        ean13: mp?.ean13 || mp?.barcode || '8692577798149'
      };
    });

    const boxNo = boxSequence++;
    staffToInsert.push({
      id: uuidv4(),
      name,
      service_center: ys,
      department: 'Yedek Parça (Yaz)',
      role,
      gender,
      top_size: top,
      bottom_size: bottom,
      shoe_size: null,
      brand: 'SCANIA',
      mont_preference: 'YAZ',
      box_no: boxNo,
      box_barcode: `KOLI-SC-${String(boxNo).padStart(4, '0')}`,
      packing_status: 'PENDING',
      last_step: 'PLANLAMA',
      voucher_status: 'BEKLİYOR',
      bundle_items: JSON.stringify(bundle)
    });
  }

  // 3. Yaz - Teknisyen - Master
  const tYazRows = xlsx.utils.sheet_to_json(wbYaz.Sheets['Teknisyen - Master'], { header: 1, defval: '' });
  for (let r = 2; r < tYazRows.length; r++) {
    const row = tYazRows[r];
    const ys = String(row[1] || '').trim();
    const name = String(row[2] || '').trim();
    const role = String(row[3] || 'Teknisyen').trim();
    const gender = String(row[4] || 'Erkek').trim();
    const bottom = String(row[5] || '').trim();
    const top = String(row[6] || '').trim();
    if (!name || !ys) continue;

    const rawItems = [
      { name: 'Teknisyen Pantolon', qty: parseInt(row[7], 10) || 0, sku: String(row[8] || '').trim(), size: bottom },
      { name: 'Teknisyen Polo Yaka Tişört', qty: parseInt(row[9], 10) || 0, sku: String(row[10] || '').trim(), size: top },
      { name: 'Master Teknisyen Polo Yaka Tişört', qty: parseInt(row[11], 10) || 0, sku: String(row[12] || '').trim(), size: top },
      { name: 'Teknisyen Tişört', qty: parseInt(row[13], 10) || 0, sku: String(row[14] || '').trim(), size: top },
      { name: 'Master Teknisyen Tişört', qty: parseInt(row[15], 10) || 0, sku: String(row[16] || '').trim(), size: top }
    ];

    const bundle = rawItems.filter(it => it.qty > 0 && it.sku).map((it, idx) => {
      const mp = mpMap.get(it.sku.toUpperCase());
      return {
        id: `yaz_t_${idx + 1}`,
        name: mp?.product_name || it.name,
        short_name: it.name,
        sku: it.sku,
        part_no: it.sku,
        size: mp?.size || it.size || top,
        quantity: it.qty,
        qty: it.qty,
        target: it.qty,
        barcode: mp?.ean13 || mp?.barcode || '8692577798149',
        ean13: mp?.ean13 || mp?.barcode || '8692577798149'
      };
    });

    const boxNo = boxSequence++;
    staffToInsert.push({
      id: uuidv4(),
      name,
      service_center: ys,
      department: 'Teknisyen (Yaz)',
      role,
      gender,
      top_size: top,
      bottom_size: bottom,
      shoe_size: null,
      brand: 'SCANIA',
      mont_preference: 'YAZ',
      box_no: boxNo,
      box_barcode: `KOLI-SC-${String(boxNo).padStart(4, '0')}`,
      packing_status: 'PENDING',
      last_step: 'PLANLAMA',
      voucher_status: 'BEKLİYOR',
      bundle_items: JSON.stringify(bundle)
    });
  }

  // ----------------------------------------------------
  // PARSE KIŞ 2025
  // ----------------------------------------------------
  const wbKis = xlsx.readFile(kisPath);

  // 4. Kış - Danışman
  const dKisRows = xlsx.utils.sheet_to_json(wbKis.Sheets['Danışman'], { header: 1, defval: '' });
  for (let r = 2; r < dKisRows.length; r++) {
    const row = dKisRows[r];
    const ys = String(row[1] || '').trim();
    const name = String(row[2] || '').trim();
    const role = String(row[3] || 'Servis Danışmanı').trim();
    const gender = String(row[4] || 'Erkek').trim();
    const bottom = String(row[5] || '').trim();
    const top = String(row[6] || '').trim();
    if (!name || !ys) continue;

    const rawItems = [
      { name: 'Danışman Pantolon', qty: parseInt(row[7], 10) || 0, sku: String(row[8] || '').trim(), size: bottom },
      { name: 'Danışman Uzun Kollu Gömlek', qty: parseInt(row[9], 10) || 0, sku: String(row[10] || '').trim(), size: top },
      { name: 'Sweatshirt (Gri) - Danışman', qty: parseInt(row[11], 10) || 0, sku: String(row[12] || '').trim(), size: top },
      { name: 'Scania Kolsuz Yelek', qty: parseInt(row[13], 10) || 0, sku: String(row[14] || '').trim(), size: top },
      { name: 'Bere', qty: parseInt(row[15], 10) || 0, sku: String(row[16] || '').trim(), size: 'STANDART' }
    ];

    const bundle = rawItems.filter(it => it.qty > 0 && it.sku).map((it, idx) => {
      const mp = mpMap.get(it.sku.toUpperCase());
      return {
        id: `kis_d_${idx + 1}`,
        name: mp?.product_name || it.name,
        short_name: it.name,
        sku: it.sku,
        part_no: it.sku,
        size: mp?.size || it.size || top,
        quantity: it.qty,
        qty: it.qty,
        target: it.qty,
        barcode: mp?.ean13 || mp?.barcode || '8692577798149',
        ean13: mp?.ean13 || mp?.barcode || '8692577798149'
      };
    });

    const boxNo = boxSequence++;
    staffToInsert.push({
      id: uuidv4(),
      name,
      service_center: ys,
      department: 'Danışman (Kış)',
      role,
      gender,
      top_size: top,
      bottom_size: bottom,
      shoe_size: null,
      brand: 'SCANIA',
      mont_preference: 'KIŞ',
      box_no: boxNo,
      box_barcode: `KOLI-SC-${String(boxNo).padStart(4, '0')}`,
      packing_status: 'PENDING',
      last_step: 'PLANLAMA',
      voucher_status: 'BEKLİYOR',
      bundle_items: JSON.stringify(bundle)
    });
  }

  // 5. Kış - Yedek Parça
  const ypKisRows = xlsx.utils.sheet_to_json(wbKis.Sheets['Yedek Parça'], { header: 1, defval: '' });
  for (let r = 2; r < ypKisRows.length; r++) {
    const row = ypKisRows[r];
    const ys = String(row[1] || '').trim();
    const name = String(row[2] || '').trim();
    const role = String(row[3] || 'Yedek Parça').trim();
    const gender = String(row[4] || 'Erkek').trim();
    const bottom = String(row[5] || '').trim();
    const top = String(row[6] || '').trim();
    if (!name || !ys) continue;

    const rawItems = [
      { name: 'Yedek Parça Pantolon', qty: parseInt(row[7], 10) || 0, sku: String(row[8] || '').trim(), size: bottom },
      { name: 'Sweatshirt (Gri) - Yedek Parça', qty: parseInt(row[9], 10) || 0, sku: String(row[10] || '').trim(), size: top },
      { name: 'Scania Kolsuz Yelek', qty: parseInt(row[11], 10) || 0, sku: String(row[12] || '').trim(), size: top },
      { name: 'Bere', qty: parseInt(row[13], 10) || 0, sku: String(row[14] || '').trim(), size: 'STANDART' }
    ];

    const bundle = rawItems.filter(it => it.qty > 0 && it.sku).map((it, idx) => {
      const mp = mpMap.get(it.sku.toUpperCase());
      return {
        id: `kis_yp_${idx + 1}`,
        name: mp?.product_name || it.name,
        short_name: it.name,
        sku: it.sku,
        part_no: it.sku,
        size: mp?.size || it.size || top,
        quantity: it.qty,
        qty: it.qty,
        target: it.qty,
        barcode: mp?.ean13 || mp?.barcode || '8692577798149',
        ean13: mp?.ean13 || mp?.barcode || '8692577798149'
      };
    });

    const boxNo = boxSequence++;
    staffToInsert.push({
      id: uuidv4(),
      name,
      service_center: ys,
      department: 'Yedek Parça (Kış)',
      role,
      gender,
      top_size: top,
      bottom_size: bottom,
      shoe_size: null,
      brand: 'SCANIA',
      mont_preference: 'KIŞ',
      box_no: boxNo,
      box_barcode: `KOLI-SC-${String(boxNo).padStart(4, '0')}`,
      packing_status: 'PENDING',
      last_step: 'PLANLAMA',
      voucher_status: 'BEKLİYOR',
      bundle_items: JSON.stringify(bundle)
    });
  }

  // 6. Kış - Teknisyen - Master
  const tKisRows = xlsx.utils.sheet_to_json(wbKis.Sheets['Teknisyen - Master'], { header: 1, defval: '' });
  for (let r = 2; r < tKisRows.length; r++) {
    const row = tKisRows[r];
    const ys = String(row[1] || '').trim();
    const name = String(row[2] || '').trim();
    const role = String(row[3] || 'Teknisyen').trim();
    const gender = String(row[4] || 'Erkek').trim();
    const bottom = String(row[5] || '').trim();
    const top = String(row[6] || '').trim();
    if (!name || !ys) continue;

    const rawItems = [
      { name: 'Teknisyen Pantolon', qty: parseInt(row[7], 10) || 0, sku: String(row[8] || '').trim(), size: bottom },
      { name: 'Sweatshirt (Mavi) - Teknisyen', qty: parseInt(row[9], 10) || 0, sku: String(row[10] || '').trim(), size: top },
      { name: 'Master Teknisyen Sweatshirt', qty: parseInt(row[11], 10) || 0, sku: String(row[12] || '').trim(), size: top },
      { name: 'Scania Kolsuz Yelek', qty: parseInt(row[13], 10) || 0, sku: String(row[14] || '').trim(), size: top },
      { name: 'Bere', qty: parseInt(row[15], 10) || 0, sku: String(row[16] || '').trim(), size: 'STANDART' }
    ];

    const bundle = rawItems.filter(it => it.qty > 0 && it.sku).map((it, idx) => {
      const mp = mpMap.get(it.sku.toUpperCase());
      return {
        id: `kis_t_${idx + 1}`,
        name: mp?.product_name || it.name,
        short_name: it.name,
        sku: it.sku,
        part_no: it.sku,
        size: mp?.size || it.size || top,
        quantity: it.qty,
        qty: it.qty,
        target: it.qty,
        barcode: mp?.ean13 || mp?.barcode || '8692577798149',
        ean13: mp?.ean13 || mp?.barcode || '8692577798149'
      };
    });

    const boxNo = boxSequence++;
    staffToInsert.push({
      id: uuidv4(),
      name,
      service_center: ys,
      department: 'Teknisyen (Kış)',
      role,
      gender,
      top_size: top,
      bottom_size: bottom,
      shoe_size: null,
      brand: 'SCANIA',
      mont_preference: 'KIŞ',
      box_no: boxNo,
      box_barcode: `KOLI-SC-${String(boxNo).padStart(4, '0')}`,
      packing_status: 'PENDING',
      last_step: 'PLANLAMA',
      voucher_status: 'BEKLİYOR',
      bundle_items: JSON.stringify(bundle)
    });
  }

  console.log(`Total Scania staff prepared for import: ${staffToInsert.length}`);

  // Summary by department
  const deptCounts = {};
  staffToInsert.forEach(s => {
    deptCounts[s.department] = (deptCounts[s.department] || 0) + 1;
  });
  console.log('Department breakdown:');
  console.table(deptCounts);

  // Now perform actual database transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Clear old Scania personnel if any
    const delRes = await client.query("DELETE FROM personnel WHERE UPPER(brand) = 'SCANIA'");
    console.log(`Deleted existing Scania personnel count: ${delRes.rowCount}`);

    const insertQuery = `
      INSERT INTO personnel (
        id, name, service_center, department, role, gender, 
        top_size, bottom_size, shoe_size, brand, mont_preference, 
        box_no, box_barcode, packing_status, last_step, voucher_status, 
        label_print_count, voucher_print_count, bundle_items, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 
        $7, $8, $9, $10, $11, 
        $12, $13, $14, $15, $16, 
        0, 0, $17::jsonb, NOW()
      )
    `;

    for (const s of staffToInsert) {
      await client.query(insertQuery, [
        s.id, s.name, s.service_center, s.department, s.role, s.gender,
        s.top_size, s.bottom_size, s.shoe_size, s.brand, s.mont_preference,
        s.box_no, s.box_barcode, s.packing_status, s.last_step, s.voucher_status,
        s.bundle_items
      ]);
    }

    await client.query('COMMIT');
    console.log(`Successfully committed ${staffToInsert.length} Scania personnel into database!`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Import failed, rolled back:', err);
    throw err;
  } finally {
    client.release();
  }

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
