const xlsx = require('xlsx');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const excelPath = 'C:/Users/ctopuz/Documents/SKODA 2026 Kış Personel Listesi.xlsx';
const wb = xlsx.readFile(excelPath);

const PANT_SIZES = {
  '36': 'XXS', '38': 'XS', '40': 'S', '42': 'M', '44': 'L',
  '46': 'XL', '48': 'XXL', '50': 'XXXL', '52': 'XXXXL', '54': 'XXXXXL',
  '56': 'XXXXXXL', '58': 'XXXXXXXL', '60': 'XXXXXXXXL', '62': 'XXXXXXXXXL'
};

const DEPT_CODE_MAP = {
  'Danışman': 'DAN',
  'Formen': 'FRM',
  'Hasar Garanti': 'HAS',
  'MİS': 'MIS',
  'Teknisyen': 'TEK',
  'Yedek Parça': 'YDP'
};

async function main() {
  console.log('🚀 [SKODA IMPORT] Başlıyor...');
  console.log('Dosya:', excelPath);

  // Load master_products for Skoda fast barcode/sku lookup
  const mpRes = await pool.query("SELECT sku, barcode, ean13, product_name, size, clean_size, color FROM master_products WHERE brand ILIKE '%skoda%'");
  const mpMap = new Map();
  mpRes.rows.forEach(r => {
    if (r.sku) mpMap.set(r.sku.toUpperCase().trim(), r);
  });
  console.log(`Master Products yüklendi: ${mpMap.size} adet Skoda ürünü.`);

  function getProduct(skuPrefix, sizeSuffix, fallbackName, fallbackCategory, fallbackColor) {
    const fullSku = `${skuPrefix}${sizeSuffix || ''}`;
    const mp = mpMap.get(fullSku.toUpperCase()) || mpMap.get(skuPrefix.toUpperCase());
    return {
      sku: fullSku,
      name: mp?.product_name || fallbackName,
      barcode: mp?.barcode || mp?.ean13 || `868${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      size: mp?.size || sizeSuffix || 'STD',
      color: mp?.color || fallbackColor || 'STANDART',
      category: fallbackCategory
    };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Delete old Skoda personnel
    const delRes = await client.query("DELETE FROM personnel WHERE UPPER(brand) = 'SKODA'");
    console.log(`Eski Skoda personelleri silindi: ${delRes.rowCount} kayıt.`);

    let totalImported = 0;

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(ws, { defval: '' });
      const deptCode = DEPT_CODE_MAP[sheetName] || 'SK';
      console.log(`\n📄 İşleniyor: [${sheetName}] (Satır sayısı: ${rows.length})`);

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const boxNo = parseInt(r['NO'], 10) || (i + 1);
        const serviceCenter = String(r['Yetkili Servis'] || '').trim();
        const staffName = String(r['Personel Ünvanı'] || '').trim();
        const role = String(r['GÖREV'] || sheetName).trim();
        const rawGender = String(r['Cinsiyet'] || '').trim();
        const isFemale = rawGender.toLowerCase().includes('kadın') || rawGender.toLowerCase().includes('kadin') || rawGender.toLowerCase().includes('bayan');
        const gender = isFemale ? 'Kadın' : 'Erkek';
        const topSize = String(r['Üst \r\nBeden'] || r['Üst \nBeden'] || r['Üst Beden'] || 'L').trim().toUpperCase();
        const rawBottom = String(r['Alt \r\nBeden'] || r['Alt \nBeden'] || r['Alt Beden'] || '').trim();
        const bottomSize = rawBottom || (sheetName === 'MİS' ? '' : '44');
        const pantSuffix = PANT_SIZES[bottomSize] || 'L';

        const boxBarcode = `KOLI-SK-${deptCode}-${String(boxNo).padStart(4, '0')}`;

        // 2. Generate Bundle Items per Department
        const bundle = [];

        if (sheetName === 'Danışman' || sheetName === 'Hasar Garanti') {
          // Gömlek (2 Adet - Resmi Kota)
          const gPrefix = isFemale ? 'PSKD100026' : 'PSKD100025';
          const gProd = getProduct(gPrefix, topSize, `${sheetName} Kışlık Gömlek ${gender === 'Kadın' ? 'Bayan' : 'Bay'}`, 'GÖMLEK', 'BEYAZ');
          bundle.push({
            id: 'item_1',
            sku: gProd.sku,
            part_no: gProd.sku,
            name: gProd.name,
            short_name: 'Kışlık Gömlek',
            size: topSize,
            qty: 2,
            quantity: 2,
            target: 2,
            barcode: gProd.barcode,
            ean13: gProd.barcode,
            color: 'BEYAZ',
            category: 'GÖMLEK'
          });

          // Pantolon (2 Adet)
          if (bottomSize) {
            const pProd = getProduct('PSKD100019', pantSuffix, `${sheetName} Kışlık Pantolon Bay`, 'PANTOLON', 'FÜME');
            bundle.push({
              id: 'item_2',
              sku: pProd.sku,
              part_no: pProd.sku,
              name: pProd.name,
              short_name: 'Kışlık Pantolon',
              size: bottomSize,
              qty: 2,
              quantity: 2,
              target: 2,
              barcode: pProd.barcode,
              ean13: pProd.barcode,
              color: 'FÜME',
              category: 'PANTOLON'
            });
          }

          // Siyah Polar (1 Adet)
          const polPrefix = isFemale ? 'PSKD100042' : 'PSKD100041';
          const polProd = getProduct(polPrefix, topSize, `Siyah Polar ${gender === 'Kadın' ? 'Bayan' : 'Bay'}`, 'YELEK', 'SİYAH');
          bundle.push({
            id: 'item_3',
            sku: polProd.sku,
            part_no: polProd.sku,
            name: polProd.name,
            short_name: 'Siyah Polar',
            size: topSize,
            qty: 1,
            quantity: 1,
            target: 1,
            barcode: polProd.barcode,
            ean13: polProd.barcode,
            color: 'SİYAH',
            category: 'YELEK'
          });

          // Yelek (1 Adet)
          const yelPrefix = isFemale ? 'PSKD100053' : 'PSKD100052';
          const yelProd = getProduct(yelPrefix, topSize, `${sheetName} Yelek ${gender === 'Kadın' ? 'Bayan' : 'Bay'}`, 'YELEK', 'SİYAH');
          bundle.push({
            id: 'item_4',
            sku: yelProd.sku,
            part_no: yelProd.sku,
            name: yelProd.name,
            short_name: 'Yelek',
            size: topSize,
            qty: 1,
            quantity: 1,
            target: 1,
            barcode: yelProd.barcode,
            ean13: yelProd.barcode,
            color: 'SİYAH',
            category: 'YELEK'
          });

        } else if (sheetName === 'MİS') {
          // MİS: 2 Gömlek + 1 Siyah Polar (Toplam 3 Parça - Resmi Kota)
          const gPrefix = isFemale ? 'PSKD100026' : 'PSKD100025';
          const gProd = getProduct(gPrefix, topSize, `MİS Kışlık Gömlek ${gender === 'Kadın' ? 'Bayan' : 'Bay'}`, 'GÖMLEK', 'BEYAZ');
          bundle.push({
            id: 'item_1',
            sku: gProd.sku,
            part_no: gProd.sku,
            name: gProd.name,
            short_name: 'MİS Kışlık Gömlek',
            size: topSize,
            qty: 2,
            quantity: 2,
            target: 2,
            barcode: gProd.barcode,
            ean13: gProd.barcode,
            color: 'BEYAZ',
            category: 'GÖMLEK'
          });

          const polPrefix = isFemale ? 'PSKD100042' : 'PSKD100041';
          const polProd = getProduct(polPrefix, topSize, `Siyah Polar ${gender === 'Kadın' ? 'Bayan' : 'Bay'}`, 'YELEK', 'SİYAH');
          bundle.push({
            id: 'item_2',
            sku: polProd.sku,
            part_no: polProd.sku,
            name: polProd.name,
            short_name: 'Siyah Polar',
            size: topSize,
            qty: 1,
            quantity: 1,
            target: 1,
            barcode: polProd.barcode,
            ean13: polProd.barcode,
            color: 'SİYAH',
            category: 'YELEK'
          });

        } else if (sheetName === 'Teknisyen') {
          // Teknisyen: 3 Yeşil Sweatshirt + 2 Teknisyen Pantolon + 1 Yelek + 1 Polar (Toplam 7 Parça)
          const swProd = getProduct('PSKD100056', topSize, 'Yeni Yeşil Teknisyen Sweatshirt', 'SWEATSHIRT', 'YEŞİL');
          bundle.push({
            id: 'item_1',
            sku: swProd.sku,
            part_no: swProd.sku,
            name: swProd.name,
            short_name: 'Teknisyen Sweatshirt',
            size: topSize,
            qty: 3,
            quantity: 3,
            target: 3,
            barcode: swProd.barcode,
            ean13: swProd.barcode,
            color: 'YEŞİL',
            category: 'SWEATSHIRT'
          });

          const pProd = getProduct('PSKD100028', pantSuffix, 'Teknisyen Pantolon Kışlık Bay', 'PANTOLON', 'FÜME');
          bundle.push({
            id: 'item_2',
            sku: pProd.sku,
            part_no: pProd.sku,
            name: pProd.name,
            short_name: 'Teknisyen Pantolon',
            size: bottomSize,
            qty: 2,
            quantity: 2,
            target: 2,
            barcode: pProd.barcode,
            ean13: pProd.barcode,
            color: 'FÜME',
            category: 'PANTOLON'
          });

          const yelProd = getProduct('PSKD100036', topSize, 'Teknisyen, Formen ve Yedek Parça Yelek', 'YELEK', 'SİYAH');
          bundle.push({
            id: 'item_3',
            sku: yelProd.sku,
            part_no: yelProd.sku,
            name: yelProd.name,
            short_name: 'Teknisyen Yelek',
            size: topSize,
            qty: 1,
            quantity: 1,
            target: 1,
            barcode: yelProd.barcode,
            ean13: yelProd.barcode,
            color: 'SİYAH',
            category: 'YELEK'
          });

          const polProd = getProduct('PSKD100041', topSize, 'Siyah Polar Bay', 'YELEK', 'SİYAH');
          bundle.push({
            id: 'item_4',
            sku: polProd.sku,
            part_no: polProd.sku,
            name: polProd.name,
            short_name: 'Siyah Polar',
            size: topSize,
            qty: 1,
            quantity: 1,
            target: 1,
            barcode: polProd.barcode,
            ean13: polProd.barcode,
            color: 'SİYAH',
            category: 'YELEK'
          });

        } else if (sheetName === 'Formen') {
          // Formen: 3 Siyah Formen Sweatshirt + 2 Pantolon + 1 Yelek + 1 Polar (Toplam 7 Parça)
          const swProd = getProduct('PSKD100055', topSize, 'Yeni Siyah Formen Sweatshirt', 'SWEATSHIRT', 'SİYAH');
          bundle.push({
            id: 'item_1',
            sku: swProd.sku,
            part_no: swProd.sku,
            name: swProd.name,
            short_name: 'Formen Sweatshirt',
            size: topSize,
            qty: 3,
            quantity: 3,
            target: 3,
            barcode: swProd.barcode,
            ean13: swProd.barcode,
            color: 'YEŞİL',
            category: 'SWEATSHIRT'
          });

          const pProd = getProduct('PSKD100019', pantSuffix, 'Servis Danışman Kışlık Pantolon Bay', 'PANTOLON', 'FÜME');
          bundle.push({
            id: 'item_2',
            sku: pProd.sku,
            part_no: pProd.sku,
            name: pProd.name,
            short_name: 'Formen Pantolon',
            size: bottomSize,
            qty: 2,
            quantity: 2,
            target: 2,
            barcode: pProd.barcode,
            ean13: pProd.barcode,
            color: 'FÜME',
            category: 'PANTOLON'
          });

          const yelProd = getProduct('PSKD100036', topSize, 'Teknisyen, Formen ve Yedek Parça Yelek', 'YELEK', 'SİYAH');
          bundle.push({
            id: 'item_3',
            sku: yelProd.sku,
            part_no: yelProd.sku,
            name: yelProd.name,
            short_name: 'Formen Yelek',
            size: topSize,
            qty: 1,
            quantity: 1,
            target: 1,
            barcode: yelProd.barcode,
            ean13: yelProd.barcode,
            color: 'SİYAH',
            category: 'YELEK'
          });

          const polProd = getProduct('PSKD100041', topSize, 'Siyah Polar Bay', 'YELEK', 'SİYAH');
          bundle.push({
            id: 'item_4',
            sku: polProd.sku,
            part_no: polProd.sku,
            name: polProd.name,
            short_name: 'Siyah Polar',
            size: topSize,
            qty: 1,
            quantity: 1,
            target: 1,
            barcode: polProd.barcode,
            ean13: polProd.barcode,
            color: 'SİYAH',
            category: 'YELEK'
          });

        } else if (sheetName === 'Yedek Parça') {
          // Yedek Parça: 3 Siyah Sweatshirt + 2 Pantolon + 1 Yelek + 1 Polar (Toplam 7 Parça)
          const swProd = getProduct('PSKD100054', topSize, 'Yeni Siyah Yedek Parça Sweatshirt', 'SWEATSHIRT', 'SİYAH');
          bundle.push({
            id: 'item_1',
            sku: swProd.sku,
            part_no: swProd.sku,
            name: swProd.name,
            short_name: 'Yedek Parça Sweatshirt',
            size: topSize,
            qty: 3,
            quantity: 3,
            target: 3,
            barcode: swProd.barcode,
            ean13: swProd.barcode,
            color: 'SİYAH',
            category: 'SWEATSHIRT'
          });

          const pProd = getProduct('PSKD100019', pantSuffix, 'Servis Danışman Kışlık Pantolon Bay', 'PANTOLON', 'FÜME');
          bundle.push({
            id: 'item_2',
            sku: pProd.sku,
            part_no: pProd.sku,
            name: pProd.name,
            short_name: 'Yedek Parça Pantolon',
            size: bottomSize,
            qty: 2,
            quantity: 2,
            target: 2,
            barcode: pProd.barcode,
            ean13: pProd.barcode,
            color: 'FÜME',
            category: 'PANTOLON'
          });

          const yelProd = getProduct('PSKD100036', topSize, 'Teknisyen, Formen ve Yedek Parça Yelek', 'YELEK', 'SİYAH');
          bundle.push({
            id: 'item_3',
            sku: yelProd.sku,
            part_no: yelProd.sku,
            name: yelProd.name,
            short_name: 'Yedek Parça Yelek',
            size: topSize,
            qty: 1,
            quantity: 1,
            target: 1,
            barcode: yelProd.barcode,
            ean13: yelProd.barcode,
            color: 'SİYAH',
            category: 'YELEK'
          });

          const polProd = getProduct('PSKD100041', topSize, 'Siyah Polar Bay', 'YELEK', 'SİYAH');
          bundle.push({
            id: 'item_4',
            sku: polProd.sku,
            part_no: polProd.sku,
            name: polProd.name,
            short_name: 'Siyah Polar',
            size: topSize,
            qty: 1,
            quantity: 1,
            target: 1,
            barcode: polProd.barcode,
            ean13: polProd.barcode,
            color: 'SİYAH',
            category: 'YELEK'
          });
        }

        const personId = uuidv4();
        await client.query(`
          INSERT INTO personnel (
            id, name, service_center, department, role, gender, brand,
            top_size, bottom_size, box_no, box_barcode,
            packing_status, last_step, bundle_items, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, 'SKODA',
            $7, $8, $9, $10,
            'PENDING', 'HAZIR', $11, CURRENT_TIMESTAMP
          )
        `, [
          personId, staffName, serviceCenter, sheetName, role, gender,
          topSize, bottomSize, boxNo, boxBarcode,
          JSON.stringify(bundle)
        ]);

        totalImported++;
      }
      console.log(`✅ [${sheetName}] tamamlandı (${rows.length} personel).`);
    }

    await client.query('COMMIT');
    console.log(`\n🎉 TOPLAM ${totalImported} SKODA PERSONELİ BAŞARIYLA AKTARILDI!`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ [SKODA IMPORT ERROR]:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
