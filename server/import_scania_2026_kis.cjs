/**
 * VOG Premium - SCANIA 2026 KIŞ KİŞİ LİSTESİ İçe Aktarma & Etiket Hazırlama Servisi
 * 
 * Kaynak Dosya: C:\Users\ctopuz\Downloads\SCANIA 2026 KIŞ KİŞİ LİSTESİ .xlsx
 * Kapsam:
 *   1. Teknisyen (298 Kişi)
 *   2. Master Teknisyen (26 Kişi)
 *   3. Servis Danışmanı (82 Kişi)
 *   4. Yedek Parça (32 Kişi)
 *   Toplam: 438 Personel, 4.879 Parça Kıyafet
 * 
 * Hedef:
 *   - Mevcut 2025 Kış verilerini temizleyip yerine resmi 2026 Kış listesini aktarır.
 *   - 2026 Yaz personellerini (459 Kişi) %100 korur (Sıfır Regresyon).
 *   - Her personelin bundle_items JSONB yapısını master_products resmi SKU, barkod ve bedenleriyle donatır.
 *   - Fatih Semiz (5XL) için formül eksikliğini Kodlar tablosundan (SCKY20509, SCKY20409, SCKY20209) tamamlar.
 *   - Tüm Scania kolilerini alfabetik (Bayi/YS -> Personel Adı) olarak 1..N koli numarası ve barkodu ile numaralandırır.
 */

const xlsx = require('xlsx');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { renumberPersonnelCartons } = require('./services/personnel_numbering_service.cjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '!719356Qse!',
  database: process.env.DB_NAME || 'vog_db'
});

async function main() {
  console.log('===============================================================');
  console.log('🚀 SCANIA 2026 KIŞ KİŞİ LİSTESİ AKTARIM VE ETİKET ENTEGRASYONU');
  console.log('===============================================================\n');

  const excelPath = 'C:\\Users\\ctopuz\\Downloads\\SCANIA 2026 KIŞ KİŞİ LİSTESİ .xlsx';
  const wb = xlsx.readFile(excelPath);

  // 1. Master Products Yükle
  const mpRes = await pool.query("SELECT sku, ean13, barcode, product_name, size FROM master_products WHERE brand ILIKE '%SCANIA%'");
  const mpMap = new Map();
  mpRes.rows.forEach(r => {
    if (r.sku) mpMap.set(r.sku.toUpperCase().trim(), r);
  });
  console.log(`✓ Master Products tablosundan ${mpMap.size} Scania ürünü yüklendi.`);

  // 2. Kodlar Sayfasını Yükle (Yedek Referans)
  const kodlarMap = new Map();
  if (wb.Sheets['Kodlar']) {
    const kRows = xlsx.utils.sheet_to_json(wb.Sheets['Kodlar'], { header: 1, defval: '' });
    for (let r = 1; r < kRows.length; r++) {
      const code = String(kRows[r][0] || '').trim();
      const name = String(kRows[r][1] || '').trim();
      const size = String(kRows[r][2] || '').trim();
      if (code) {
        kodlarMap.set(code.toUpperCase(), { code, name, size });
      }
    }
  }
  console.log(`✓ Kodlar sayfasından ${kodlarMap.size} katalog kodu yüklendi.`);

  // Fallback kod çözümleyici (5XL vb. özel durumlar için)
  const resolveFallbackCode = (itemName, size, gender) => {
    const is5XL = size === '5XL' || size === 'XXXXXL';
    if (is5XL) {
      if (itemName.includes('Teknisyen Pantolon')) return 'SCKY20509';
      if (itemName.includes('Sweatshirt (Mavi)')) return 'SCKY20409';
      if (itemName.includes('Scania Kolsuz Yelek')) return 'SCKY20209';
    }
    return null;
  };

  const staffToInsert = [];
  let currentBoxSeq = 1000; // Geçici koli no, işlem sonunda renumberPersonnelCartons ile netleşecek

  const parseSheet = (sheetName, deptName, roleName, itemDefs) => {
    const ws = wb.Sheets[sheetName];
    if (!ws) {
      console.warn(`⚠️ Sayfa bulunamadı: ${sheetName}`);
      return;
    }
    const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });

    let sheetStaffCount = 0;
    let sheetGarmentsCount = 0;

    for (let r = 2; r < rows.length; r++) {
      const row = rows[r];
      const name = String(row[2] || '').trim();
      if (!name) continue;

      const ys = String(row[1] || '').trim();
      const role = String(row[3] || roleName).trim();
      const gender = String(row[4] || 'Erkek').trim();
      const bottom = String(row[5] || '').trim();
      const top = String(row[6] || '').trim();

      const rawItems = itemDefs.map((def, idx) => {
        let code = String(row[def.codeCol] || '').trim();
        const qty = parseInt(row[def.qtyCol], 10) || 0;
        const itemSize = def.isBottom ? bottom : (def.isStandard ? 'STANDART' : top);

        if (qty > 0 && !code) {
          code = resolveFallbackCode(def.name, itemSize, gender) || '';
        }

        return {
          name: def.name,
          qty,
          sku: code,
          size: itemSize
        };
      });

      const bundle = rawItems.filter(it => it.qty > 0 && it.sku).map((it, idx) => {
        const mp = mpMap.get(it.sku.toUpperCase());
        const kRow = kodlarMap.get(it.sku.toUpperCase());
        const finalName = mp?.product_name || kRow?.name || it.name;
        const finalSize = mp?.size || kRow?.size || it.size;
        const finalBarcode = mp?.ean13 || mp?.barcode || it.sku;

        sheetGarmentsCount += it.qty;

        return {
          id: `kis_2026_${idx + 1}`,
          name: finalName,
          short_name: it.name,
          sku: it.sku,
          part_no: it.sku,
          size: finalSize,
          quantity: it.qty,
          qty: it.qty,
          target: it.qty,
          barcode: finalBarcode,
          ean13: finalBarcode
        };
      });

      const tempBoxNo = currentBoxSeq++;
      staffToInsert.push({
        id: uuidv4(),
        name,
        service_center: ys,
        department: deptName,
        role,
        gender,
        top_size: top,
        bottom_size: bottom,
        shoe_size: null,
        brand: 'SCANIA',
        mont_preference: 'KIŞ',
        box_no: tempBoxNo,
        box_barcode: `KOLI-SC-${String(tempBoxNo).padStart(4, '0')}`,
        packing_status: 'PENDING',
        last_step: 'PLANLAMA',
        voucher_status: 'BEKLİYOR',
        bundle_items: JSON.stringify(bundle)
      });

      sheetStaffCount++;
    }

    console.log(`✓ [${sheetName}] -> Departman: "${deptName}", Personel: ${sheetStaffCount}, Giysi Adedi: ${sheetGarmentsCount}`);
  };

  // 1. Teknisyen
  parseSheet('Teknisyen', 'Teknisyen (Kış)', 'Teknisyen', [
    { name: 'Teknisyen Pantolon', qtyCol: 7, codeCol: 8, isBottom: true },
    { name: 'Sweatshirt (Mavi) - Teknisyen', qtyCol: 9, codeCol: 10, isBottom: false },
    { name: 'Scania Kolsuz Yelek', qtyCol: 11, codeCol: 12, isBottom: false },
    { name: 'Bere', qtyCol: 13, codeCol: 14, isStandard: true }
  ]);

  // 2. Master Teknisyen
  parseSheet('Master Teknisyen', 'Teknisyen (Kış)', 'Master Teknisyen', [
    { name: 'Teknisyen Pantolon', qtyCol: 7, codeCol: 8, isBottom: true },
    { name: 'Master Teknisyen Sweatshirt', qtyCol: 9, codeCol: 10, isBottom: false },
    { name: 'Scania Kolsuz Yelek', qtyCol: 11, codeCol: 12, isBottom: false },
    { name: 'Bere', qtyCol: 13, codeCol: 14, isStandard: true }
  ]);

  // 3. Servis Danışmanı
  parseSheet('Servis Danışmanı', 'Danışman (Kış)', 'Servis Danışmanı', [
    { name: 'Danışman Pantolon', qtyCol: 7, codeCol: 8, isBottom: true },
    { name: 'Danışman Uzun Kollu Gömlek', qtyCol: 9, codeCol: 10, isBottom: false },
    { name: 'Sweatshirt (Gri) - Danışman', qtyCol: 11, codeCol: 12, isBottom: false },
    { name: 'Scania Kolsuz Yelek', qtyCol: 13, codeCol: 14, isBottom: false },
    { name: 'Bere', qtyCol: 15, codeCol: 16, isStandard: true }
  ]);

  // 4. Yedek Parça
  parseSheet('Yedek Parça', 'Yedek Parça (Kış)', 'Yedek Parça', [
    { name: 'Yedek Parça Pantolon', qtyCol: 7, codeCol: 8, isBottom: true },
    { name: 'Sweatshirt (Gri) - Yedek Parça', qtyCol: 9, codeCol: 10, isBottom: false },
    { name: 'Scania Kolsuz Yelek', qtyCol: 11, codeCol: 12, isBottom: false },
    { name: 'Bere', qtyCol: 13, codeCol: 14, isStandard: true }
  ]);

  console.log(`\nToplam İçe Aktarılacak 2026 Kış Personel Sayısı: ${staffToInsert.length}`);

  // Veritabanı İşlemleri
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Eski 2025 Scania Kış personellerini temizle (Yaz 2026 personellerine dokunulmaz!)
    const delRes = await client.query(`
      DELETE FROM personnel 
      WHERE UPPER(brand) = 'SCANIA' 
        AND (department LIKE '%Kış%' OR mont_preference = 'KIŞ')
    `);
    console.log(`✓ Eski Scania Kış kayıtları temizlendi (${delRes.rowCount} kayıt).`);

    // 2. Yeni 2026 Kış personellerini ekle
    const insertSql = `
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
      await client.query(insertSql, [
        s.id, s.name, s.service_center, s.department, s.role, s.gender,
        s.top_size, s.bottom_size, s.shoe_size, s.brand, s.mont_preference,
        s.box_no, s.box_barcode, s.packing_status, s.last_step, s.voucher_status,
        s.bundle_items
      ]);
    }
    console.log(`✓ ${staffToInsert.length} adet 2026 Kış personeli veritabanına başarıyla eklendi.`);

    await client.query('COMMIT');
    console.log('✓ Veritabanı transaction başarıyla commit edildi.');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Hata oluştu, işlem geri alındı (ROLLBACK):', err);
    throw err;
  } finally {
    client.release();
  }

  // 3. Tüm Scania Kolilerini Alfabetik Olarak Sırala ve Numaralandır
  console.log('\n--- Koli Sıralama ve Numaralandırma Başlatılıyor ---');
  const renumResult = await renumberPersonnelCartons(pool, 'SCANIA', 1);
  console.log(`✓ Koli Numaralandırma Tamamlandı: Toplam ${renumResult.total_count} koli (Koli No: ${renumResult.start_box_no} .. ${renumResult.end_box_no}).`);

  // 4. Doğrulama ve Raporlama
  console.log('\n===============================================================');
  console.log('📊 AKTARIM SONRASI DOĞRULAMA VE ENVENTAR DURUMU');
  console.log('===============================================================');

  const checkRes = await pool.query(`
    SELECT department, role, count(*) as count 
    FROM personnel 
    WHERE brand = 'SCANIA' 
    GROUP BY department, role 
    ORDER BY department, role
  `);
  console.table(checkRes.rows);

  const totalStaffRes = await pool.query("SELECT count(*) as total FROM personnel WHERE brand = 'SCANIA'");
  console.log(`Scania Toplam Personel Sayısı: ${totalStaffRes.rows[0].total} (459 Yaz + 438 Kış = 897)`);

  await pool.end();
  console.log('\n🎉 SCANIA 2026 KIŞ KİŞİ LİSTESİ BAŞARIYLA AKTARILDI VE ETİKET BASIMINA HAZIR HALE GETİRİLDİ!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
