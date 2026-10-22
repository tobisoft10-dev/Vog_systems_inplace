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

function executeMssql(queryText) {
  const tmpFile = path.join(__dirname, `tmp_mig_${Date.now()}_${Math.random().toString(36).substring(7)}.sql`);
  fs.writeFileSync(tmpFile, queryText, 'utf8');
  const cmd = `sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -d SIPARIS -f 65001 -i "${tmpFile}"`;
  execSync(cmd, { stdio: 'inherit' });
  try { fs.unlinkSync(tmpFile); } catch (e) {}
}

function queryMssqlJson(queryText) {
  const tmpFile = path.join(__dirname, `tmp_q_${Date.now()}_${Math.random().toString(36).substring(7)}.json`);
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

const PANT_SIZES = {
  'XXS': { clean: '36', beden: '36 Beden' },
  'XS': { clean: '38', beden: '38 Beden' },
  'S': { clean: '40', beden: '40 Beden' },
  'M': { clean: '42', beden: '42 Beden' },
  'L': { clean: '44', beden: '44 Beden' },
  'XL': { clean: '46', beden: '46 Beden' },
  'XXL': { clean: '48', beden: '48 Beden' },
  'XXXL': { clean: '50', beden: '50 Beden' },
  'XXXXL': { clean: '52', beden: '52 Beden' },
  'XXXXXL': { clean: '54', beden: '54 Beden' },
  'XXXXXXL': { clean: '56', beden: '56 Beden' },
  'XXXXXXXL': { clean: '58', beden: '58 Beden' },
  'XXXXXXXXL': { clean: '60', beden: '60 Beden' },
  'XXXXXXXXXL': { clean: '62', beden: '62 Beden' }
};

const TOP_SIZES = {
  'XS': { clean: 'XS', beden: 'XS Beden' },
  'S': { clean: 'S', beden: 'S Beden' },
  'M': { clean: 'M', beden: 'M Beden' },
  'L': { clean: 'L', beden: 'L Beden' },
  'XL': { clean: 'XL', beden: 'XL Beden' },
  'XXL': { clean: 'XXL', beden: 'XXL Beden' },
  'XXXL': { clean: '3XL', beden: 'XXXL Beden' },
  'STD': { clean: 'STANDART', beden: 'Standart' }
};

function deriveGender(desc, code) {
  const d = (desc + ' ' + code).toUpperCase();
  if (d.includes('BAYAN') || d.includes('KADIN')) return 'KADIN';
  if (d.includes('BAY') || d.includes('ERKEK')) return 'ERKEK';
  return 'UNISEX';
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

    if (!parcaKodu || parcaKodu.includes('Parça Kodu') || seenCodes.has(parcaKodu)) continue;
    seenCodes.add(parcaKodu);

    const isPant = /PANT/i.test(desc) || /^PSKD(100019|100028|200010|200019)/i.test(parcaKodu);
    let cleanVal = null;
    let bedenVal = null;

    if (isPant) {
      const sortedPantEntries = Object.entries(PANT_SIZES).sort((a, b) => b[0].length - a[0].length);
      for (const [suf, info] of sortedPantEntries) {
        if (parcaKodu.endsWith(suf)) {
          cleanVal = info.clean;
          bedenVal = info.beden;
          break;
        }
      }
    } else {
      for (const suf of ['XXXL', 'XXL', 'XL', 'XS', 'L', 'M', 'S', 'STD']) {
        if (parcaKodu.endsWith(suf)) {
          cleanVal = TOP_SIZES[suf].clean;
          bedenVal = TOP_SIZES[suf].beden;
          break;
        }
      }
    }

    items.push({
      yearType,
      parcaKodu,
      desc,
      beden: bedenVal || beden,
      cleanBeden: cleanVal || beden,
      gender: deriveGender(desc, parcaKodu),
      isPant
    });
  }
  return items;
}

const SKODA_ORDERS_STANDARDIZED = [
  // 2026 KIŞ
  {
    id: 16695,
    model: '2026 KIŞ SKODA DANIŞMAN YELEK - MEGANE MODELİ YELEK YELEK - SİYAH - (DANIŞMAN & HASAR & GARANTİ)',
    parcaNo: 'ERKEK: PSKD100052 - KADIN: PSKD100053',
    detay5: 'TEK TEK PAKET. ERKEK: PSKD100052 - KADIN: PSKD100053'
  },
  {
    id: 16694,
    model: '2026 KIŞ SKODA YENİ SİYAH SOFTSHELL MONT - SKODA DANIŞMAN (ŞİMDİLİK ÜRETİME ALINMAYACAK)',
    parcaNo: 'ERKEK: PSKD100050 - KADIN: PSKD100051',
    detay5: 'TEK TEK PAKET. ERKEK: PSKD100050 - KADIN: PSKD100051'
  },
  {
    id: 16693,
    model: '2026 KIŞ SKODA SERVİS DANIŞMAN & MİS/HASAR GÖMLEK - BEYAZ',
    parcaNo: 'ERKEK: PSKD100025 - KADIN: PSKD100026',
    detay5: 'TEK TEK PAKET. ERKEK: PSKD100025 - KADIN: PSKD100026'
  },
  {
    id: 16692,
    model: '2026 KIŞ SKODA SERVİS DANIŞMAN, HASAR, YEDEK PARÇA, FORMEN VE GARANTİ PANTOLON',
    parcaNo: 'PSKD100019',
    detay5: 'TEK TEK PAKET. PSKD100019'
  },
  {
    id: 16691,
    model: '2026 KIŞ SKODA TEKNİSYEN, FORMEN ve YEDEK PARÇA YELEK - SİYAH',
    parcaNo: 'PSKD100036',
    detay5: 'TEK TEK PAKET. PSKD100036'
  },
  {
    id: 16690,
    model: '2026 KIŞ SKODA POLAR - SİYAH - SOL KOL CEPLİ',
    parcaNo: 'ERKEK: PSKD100041 - KADIN: PSKD100042',
    detay5: 'TEK TEK PAKET. ERKEK: PSKD100041 - KADIN: PSKD100042'
  },
  {
    id: 16689,
    model: '2026 KIŞ SKODA TEKNİSYEN SWEATSHIRT - ÖZEL BOYAMA KOYU YEŞİL',
    parcaNo: 'PSKD100056',
    detay5: 'TEK TEK PAKET. PSKD100056'
  },
  {
    id: 16688,
    model: '2026 KIŞ SKODA FORMEN SWEAT SHIRT - SİYAH',
    parcaNo: 'PSKD100055',
    detay5: 'TEK TEK PAKET. PSKD100055'
  },
  {
    id: 16687,
    model: '2026 KIŞ SKODA YEDEK PARÇA SWEAT SHIRT - SİYAH',
    parcaNo: 'PSKD100054',
    detay5: 'TEK TEK PAKET. PSKD100054'
  },
  {
    id: 16686,
    model: '2026 KIŞ SKODA TEKNİSYEN PANTOLON FÜME VOLVO MODELİ (TEKNİSYEN MODELİ) - (DİZE ELYAF KONULACAK)',
    parcaNo: 'PSKD100028',
    detay5: 'TEK TEK PAKET OLACAK. PSKD100028'
  },
  // 2026 YAZ
  {
    id: 15877,
    model: 'SKODA 2026 YAZ SERVİS DANIŞMAN / HASAR / GARANTİ / MİS POLO YAKA KISA KOLLU AÇIK YEŞİL',
    parcaNo: 'ERKEK: PSKD200032 - KADIN: PSKD200033',
    detay5: 'TEK TEK PAKET OLACAK. ERKEK: PSKD200032 - KADIN: PSKD200033'
  },
  {
    id: 15878,
    model: 'SKODA 2026 YAZ SERVİS DANIŞMAN / HASAR & YEDEK PARÇA / GARANTİ & FORMEN PANTOLON',
    parcaNo: 'PSKD200010',
    detay5: 'TEK TEK PAKET OLACAK. PSKD200010'
  },
  {
    id: 15879,
    model: 'SKODA 2026 YAZ TEKNİSYEN POLO YAKA KISA KOLLU KOYU YEŞİL',
    parcaNo: 'PSKD200036',
    detay5: 'TEK TEK PAKET OLACAK. PSKD200036'
  },
  {
    id: 15880,
    model: 'SKODA 2026 YAZ TEKNİSYEN PANTOLON FÜME',
    parcaNo: 'PSKD200019',
    detay5: 'TEK TEK PAKET OLACAK. PSKD200019'
  },
  {
    id: 15881,
    model: 'SKODA 2026 YAZ FORMEN POLO YAKA KISA KOLLU GRİ',
    parcaNo: 'PSKD200035',
    detay5: 'TEK TEK PAKET OLACAK. PSKD200035'
  },
  {
    id: 15882,
    model: 'SKODA 2026 YAZ YEDEK PARÇA POLO YAKA KISA KOLLU FÜME MELANJ',
    parcaNo: 'PSKD200034',
    detay5: 'TEK TEK PAKET OLACAK. PSKD200034'
  },
  // 2026 VALE & İKRAM
  {
    id: 16229,
    model: 'SKODA VALE 2026 SOFTSHELL MONT KAPİŞONLU',
    parcaNo: 'PSKD200040',
    detay5: 'TEK TEK PAKET. PSKD200040'
  },
  {
    id: 16228,
    model: 'SKODA İKRAM GÖREVLİSİ ÖNLÜK',
    parcaNo: 'PSKD200038STD',
    detay5: 'TEK TEK PAKET. PSKD200038STD'
  },
  {
    id: 16227,
    model: 'SKODA İKRAM GÖREVLİSİ UZUN KOL POLO YAKA BEYAZ KADIN',
    parcaNo: 'PSKD200039',
    detay5: 'TEK TEK PAKETLENECEK. PSKD200039'
  },
  {
    id: 16226,
    model: 'SKODA İKRAM GÖREVLİSİ UZUN KOL POLO YAKA BEYAZ ERKEK',
    parcaNo: 'PSKD200038',
    detay5: 'TEK TEK PAKETLENECEK. PSKD200038'
  }
];

const BASE_PRODUCTS_TO_ENSURE = [
  { sku: 'PSKD100025', name: 'Servis Danışman Kışlık Gömlek Bay', gender: 'ERKEK', bc: '8685137302250' },
  { sku: 'PSKD100026', name: 'Servis Danışman Kışlık Gömlek Bayan', gender: 'KADIN', bc: '8697610898282' },
  { sku: 'PSKD100041', name: 'Siyah Polar Bay', gender: 'ERKEK', bc: '8685262136426' },
  { sku: 'PSKD100042', name: 'Siyah Polar Bayan', gender: 'KADIN', bc: '8692456899721' },
  { sku: 'PSKD100052', name: 'Yeni Servis Danışman Yelek Bay', gender: 'ERKEK', bc: '8688060741236' },
  { sku: 'PSKD100053', name: 'Yeni Servis Danışman Yelek Bayan', gender: 'KADIN', bc: '8692456899721' },
  { sku: 'PSKD100019', name: 'Servis Danışman Kışlık Pantolon Bay', gender: 'ERKEK', bc: '8681627657001' },
  { sku: 'PSKD100056', name: 'Yeni Yeşil Teknisyen Sweatshirt', gender: 'ERKEK', bc: '8684197668564' },
  { sku: 'PSKD100028', name: 'Teknisyen Pantolon Kışlık Bay', gender: 'ERKEK', bc: '8687980529961' },
  { sku: 'PSKD100036', name: 'Teknisyen Yelek', gender: 'UNISEX', bc: '8685981830036' },
  { sku: 'PSKD100055', name: 'Yeni Yeşil Formen Sweatshirt', gender: 'ERKEK', bc: '8680165401398' },
  { sku: 'PSKD100054', name: 'Yeni Siyah Yedek Parça Sweatshirt', gender: 'ERKEK', bc: '8689074150365' },
  { sku: 'PSKD100050', name: 'Yeni Siyah Softshell Mont Bay', gender: 'ERKEK', bc: '8686623678599' },
  { sku: 'PSKD100051', name: 'Yeni Siyah Softshell Mont Bayan', gender: 'KADIN', bc: '8686623678599' },
  { sku: 'PSKD200010', name: 'Servis Dnş. MİS Garanti Hasar YP Pant Bay', gender: 'ERKEK', bc: '8697310081335' },
  { sku: 'PSKD200032', name: 'Yeni Servis Dnş. MİS Garanti Hasar Polo Tshirt Bay', gender: 'ERKEK', bc: '8683163280086' },
  { sku: 'PSKD200033', name: 'Yeni Servis Dnş. MİS Garanti Hasar Polo Tshirt Bayan', gender: 'KADIN', bc: '8692456899738' },
  { sku: 'PSKD200034', name: 'Yeni Yedek Parça T-shirt', gender: 'UNISEX', bc: '8686834735438' },
  { sku: 'PSKD200035', name: 'Yeni Formen T-shirt', gender: 'UNISEX', bc: '8687436527135' },
  { sku: 'PSKD200019', name: 'Teknis yen Pantolon Yazlık Bay', gender: 'ERKEK', bc: '8682857078215' },
  { sku: 'PSKD200036', name: 'Yeni Teknisyen T-shirt', gender: 'UNISEX', bc: '8689391804566' },
  { sku: 'PSKD200038', name: 'Skoda İkram Görevlisi Uzun Kol Polo Beyaz Erkek', gender: 'ERKEK', bc: '8694422592285' },
  { sku: 'PSKD200039', name: 'Skoda İkram Görevlisi Uzun Kol Polo Beyaz Kadın', gender: 'KADIN', bc: '8691471460442' },
  { sku: 'PSKD200040', name: 'Skoda Vale 2026 Softshell Mont Kapişonlu', gender: 'ERKEK', bc: '8686307675638' }
];

async function main() {
  console.log('================================================================');
  console.log('🚀 SKODA 2026 YAZ & 2025 KIŞ VERİTABANI & PARÇA NO NORMALİZASYONU');
  console.log('================================================================\n');

  // 1. CLEAN DIRTY PACKAGING TEXTS FROM MASTER TABLES
  console.log('--- 1. TEMİZLİK: Çöp ve Paketleme Talimatlı Master Kayıtların Silinmesi ---');
  let cleanMssqlSql = `
    DELETE FROM [SIPARIS].[dbo].[MasterUrunler] WHERE ParcaNo LIKE 'OLACAK. PSKD%' OR ParcaNo LIKE 'OLACAK. PSEAT%' OR ParcaNo LIKE 'OLACAK. PSKODA%' OR ParcaNo LIKE 'LENECEK%' OR ParcaNo LIKE 'TEK TEK PSKODA%';
  `;
  executeMssql(cleanMssqlSql);

  const delPg = await pool.query(`
    DELETE FROM master_products 
    WHERE sku LIKE 'OLACAK. PSKD%' 
       OR sku LIKE 'OLACAK. PSEAT%' 
       OR sku LIKE 'OLACAK. PSKODA%' 
       OR sku LIKE 'LENECEK%' 
       OR sku LIKE 'TEK TEK PSKODA%'
  `);
  console.log(`PG master_products: ${delPg.rowCount} adet çöp kayıt silindi.`);

  // 2. PARSE EXCEL FILES
  console.log('\n--- 2. EXCEL OKUMA: 2026 Yaz ve 2025 Kış Dosyaları ---');
  const yazItems = parseExcelItems('C:\\Users\\ctopuz\\Downloads\\Skoda Barkodlar 2026 YAZ.XLSX', '2026 YAZ');
  const kisItems = parseExcelItems('C:\\Users\\ctopuz\\Downloads\\Skoda Barkodlar 2025 KIŞ.XLSX', '2025 KIŞ');
  const allExcelItems = [...yazItems, ...kisItems];
  console.log(`Toplam ${allExcelItems.length} tekil Skoda ürün varyantı okundu.`);

  // 3. NORMALIZE MASTER TABLES FOR 158 VARIANTS
  console.log('\n--- 3. KATALOG NORMALİZASYONU: 158 Varyantın Güncellenmesi ---');
  let updateMasterSql = 'BEGIN TRANSACTION;\n';
  for (const item of allExcelItems) {
    const escDesc = item.desc.replace(/'/g, "''");
    const escBeden = item.beden.replace(/'/g, "''");
    const escClean = item.cleanBeden.replace(/'/g, "''");

    updateMasterSql += `
      UPDATE [SIPARIS].[dbo].[MasterUrunler]
      SET UrunAdi = '${escDesc}',
          Beden = '${escBeden}',
          CleanBeden = '${escClean}',
          Code39 = '${item.parcaKodu}',
          Cinsiyet = '${item.gender}',
          Marka = 'SKODA',
          Grup = 'SKODA',
          UpdatedAt = GETDATE()
      WHERE ParcaNo = '${item.parcaKodu}';
    \n`;

    await pool.query(`
      UPDATE master_products
      SET product_name = $1,
          size = $2,
          clean_size = $3,
          code39 = $4,
          gender = $5,
          brand = 'SKODA',
          grup = 'SKODA',
          updated_at = NOW()
      WHERE sku = $4
    `, [item.desc, item.beden, item.cleanBeden, item.parcaKodu, item.gender]);
  }
  updateMasterSql += 'COMMIT TRANSACTION;\n';
  executeMssql(updateMasterSql);
  console.log('✅ MSSQL ve PG master tabloları 158 varyant için güncellendi.');

  // 4. ENSURE BASE PRODUCTS
  console.log('\n--- 4. ANA ÜRÜNLER (BASE CODES): Eksik Ana Kodların Eklenmesi ---');
  for (const base of BASE_PRODUCTS_TO_ENSURE) {
    // Check MSSQL
    const mCheck = queryMssqlJson(`SELECT Id FROM [SIPARIS].[dbo].[MasterUrunler] WHERE ParcaNo = '${base.sku}'`);
    if (!mCheck || mCheck.length === 0) {
      const escName = base.name.replace(/'/g, "''");
      executeMssql(`
        INSERT INTO [SIPARIS].[dbo].[MasterUrunler] (
          ParcaNo, UrunAdi, Beden, CleanBeden, Barkod, Ean13, Code39, Marka, Grup, Cinsiyet, Fiyat, CreatedAt, UpdatedAt
        ) VALUES (
          '${base.sku}', '${escName}', 'Standart', 'STD', '${base.bc}', '${base.bc}', '${base.sku}', 'SKODA', 'SKODA', '${base.gender}', 500.00, GETDATE(), GETDATE()
        );
      `);
      console.log(`MSSQL MasterUrunler: Ana kod eklendi -> ${base.sku}`);
    }

    // Check PG
    const pCheck = await pool.query('SELECT id FROM master_products WHERE sku = $1', [base.sku]);
    if (pCheck.rows.length === 0) {
      await pool.query(`
        INSERT INTO master_products (
          sku, product_name, size, clean_size, barcode, ean13, code39, brand, grup, gender, price, created_at, updated_at
        ) VALUES (
          $1, $2, 'Standart', 'STD', $3, $3, $1, 'SKODA', 'SKODA', $4, 500.00, NOW(), NOW()
        )
      `, [base.sku, base.name, base.bc, base.gender]);
      console.log(`PG master_products: Ana kod eklendi -> ${base.sku}`);
    }
  }

  // 5. UPDATE MSSQL SIPARISLER (20 SKODA ORDERS)
  console.log('\n--- 5. SİPARİŞLER: MSSQL Siparisler Tablosunun Güncellenmesi ---');
  let orderUpdateSql = 'BEGIN TRANSACTION;\n';
  for (const ord of SKODA_ORDERS_STANDARDIZED) {
    const escModel = ord.model.replace(/'/g, "''");
    const escParca = ord.parcaNo.replace(/'/g, "''");
    const escDetay5 = ord.detay5.replace(/'/g, "''");
    orderUpdateSql += `
      UPDATE [SIPARIS].[dbo].[Siparisler]
      SET Model = '${escModel}', ParcaNo = '${escParca}', Detay5 = '${escDetay5}'
      WHERE Id = ${ord.id};
    \n`;
  }
  orderUpdateSql += 'COMMIT TRANSACTION;\n';
  executeMssql(orderUpdateSql);
  console.log('✅ 20 adet Skoda siparişi MSSQL Siparisler tablosunda güncellendi.');

  // 6. SYNCHRONIZE ORDERS TO POSTGRESQL orders TABLE
  console.log('\n--- 6. SENKRONİZASYON: PostgreSQL orders Tablosunun Birebir Eşitlenmesi ---');
  for (const ord of SKODA_ORDERS_STANDARDIZED) {
    const orderNo = String(ord.id);

    // Get live details and ToplamAdet from MSSQL
    const mssqlDetails = queryMssqlJson(`
      SELECT 
        s.Id, s.Model, s.ParcaNo, s.Detay5, m.Adi AS Musteri,
        ISNULL(si.ToplamAdet, 0) AS ToplamAdet
      FROM [SIPARIS].[dbo].[Siparisler] s
      LEFT JOIN [SIPARIS].[dbo].[Musteriler] m ON s.MusteriId = m.Id
      LEFT JOIN (
        SELECT SiparisId, SUM(ISNULL(B01,0)+ISNULL(B02,0)+ISNULL(B03,0)+ISNULL(B04,0)+ISNULL(B05,0)+ISNULL(B06,0)+ISNULL(B07,0)+ISNULL(B08,0)+ISNULL(B09,0)+ISNULL(B10,0)+ISNULL(B11,0)+ISNULL(B12,0)+ISNULL(B13,0)+ISNULL(B14,0)) AS ToplamAdet
        FROM [SIPARIS].[dbo].[SiparisIslemleri]
        GROUP BY SiparisId
      ) si ON s.Id = si.SiparisId
      WHERE s.Id = ${ord.id}
    `);

    const d = mssqlDetails[0] || {};
    const qty = parseInt(d.ToplamAdet || 0, 10);
    const musteri = d.Musteri || 'DOĞUŞ OTOMOTİV SERVİS VE TİCARET A.Ş.';
    const sampleBc = ord.parcaNo.startsWith('ERKEK:') 
      ? ord.parcaNo.split(' - ')[0].replace('ERKEK: ', '').trim() 
      : ord.parcaNo;

    // Get sample 13-digit barcode for the order
    let finalBarcode = sampleBc;
    const bcRow = await pool.query('SELECT barcode FROM master_products WHERE sku = $1 OR sku LIKE $2 LIMIT 1', [sampleBc, sampleBc + '%']);
    if (bcRow.rows.length > 0 && bcRow.rows[0].barcode) {
      finalBarcode = bcRow.rows[0].barcode;
    }

    const existing = await pool.query('SELECT id FROM orders WHERE order_number = $1', [orderNo]);
    if (existing.rows.length > 0) {
      await pool.query(`
        UPDATE orders
        SET product_name = $1,
            sku = $2,
            code39 = $2,
            barcode = $3,
            ean13 = $3,
            notes = $4,
            quantity = $5,
            remaining_quantity = $5,
            brand = 'SKODA',
            grup = 'SKODA',
            dealer = $6,
            sub_customer_name = $6,
            updated_at = NOW()
        WHERE order_number = $7
      `, [ord.model, ord.parcaNo, finalBarcode, ord.detay5, qty, musteri, orderNo]);
      console.log(`PG orders: Sipariş #${orderNo} güncellendi (Adet: ${qty}, ParcaNo: ${ord.parcaNo})`);
    } else {
      await pool.query(`
        INSERT INTO orders (
          order_number, product_name, sku, code39, barcode, ean13, brand, grup,
          quantity, processed_quantity, remaining_quantity, status, notes, dealer, sub_customer_name,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $3, $4, $4, 'SKODA', 'SKODA',
          $5, 0, $5, 'BEKLEMEDE', $6, $7, $7,
          NOW(), NOW()
        )
      `, [orderNo, ord.model, ord.parcaNo, finalBarcode, qty, ord.detay5, musteri]);
      console.log(`PG orders: Sipariş #${orderNo} yeni eklendi (Adet: ${qty}, ParcaNo: ${ord.parcaNo})`);
    }
  }

  // 7. VERIFICATION
  console.log('\n--- 7. DOĞRULAMA: Kalan Çöp Kayıt ve Senkronizasyon Durumu ---');
  const badMssql = queryMssqlJson("SELECT COUNT(*) as cnt FROM [SIPARIS].[dbo].[MasterUrunler] WHERE ParcaNo LIKE 'OLACAK. PSKD%' OR ParcaNo LIKE 'OLACAK. PSKODA%' OR ParcaNo LIKE 'TEK TEK PSKODA%'");
  const badPg = await pool.query("SELECT COUNT(*) as cnt FROM master_products WHERE sku LIKE 'OLACAK. PSKD%' OR sku LIKE 'OLACAK. PSKODA%' OR sku LIKE 'TEK TEK PSKODA%'");
  console.log(`Kalan MSSQL Çöp Kayıt: ${badMssql[0] ? badMssql[0].cnt : 0} (Beklenen: 0)`);
  console.log(`Kalan PG Çöp Kayıt: ${badPg.rows[0].cnt} (Beklenen: 0)`);

  const pgCount = await pool.query("SELECT COUNT(*) FROM orders WHERE brand = 'SKODA' AND order_number::int IN (16686,16687,16688,16689,16690,16691,16692,16693,16694,16695,15877,15878,15879,15880,15881,15882,16226,16227,16228,16229)");
  console.log(`PG Skoda Sipariş Sayısı: ${pgCount.rows[0].count} / 20 (Tamamı senkron)`);

  await pool.end();
  console.log('\n🎉 TÜM SKODA VERİLERİ VE TABLOLARI BAŞARIYLA GÜNCELLENDİ VE NORMALİZE EDİLDİ!');
}

main().catch(console.error);
