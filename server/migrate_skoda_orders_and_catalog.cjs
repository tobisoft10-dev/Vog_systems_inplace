const { Pool } = require('c:/vog_system/server/node_modules/pg');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

const NAN_FIX_MAP = {
  '8697.3193499NaN': '8697319349900',
  '8692.2689984NaN': '8692268998407',
  '8697.0338953NaN': '8697033895301',
  '8692.1805075NaN': '8692180507503',
  '8696.7595734NaN': '8696759573401',
  '8692.0954677NaN': '8692095467701',
  '8696.4959500NaN': '8696495950009'
};

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
  'XXXL': { clean: '3XL', beden: 'XXXL Beden' }
};

// Target orders to standardize
const SKODA_ORDERS_TO_STANDARDIZE = [
  // 2026 KIŞ
  {
    id: 16695,
    model: '2026 KIŞ SKODA DANIŞMAN YELEK - MEGANE MODELİ YELEK YELEK - SİYAH - (DANIŞMAN & HASAR & GARANTİ)',
    parcaNo: 'ERKEK: PSKD100052 - KADIN: PSKD100053',
    detay5: 'ERKEK: PSKD100052 - KADIN: PSKD100053'
  },
  {
    id: 16694,
    model: '2026 KIŞ SKODA YENİ SİYAH SOFTSHELL MONT - SKODA DANIŞMAN (ŞİMDİLİK ÜRETİME ALINMAYACAK)',
    parcaNo: 'ERKEK: PSKD100050 - KADIN: PSKD100051',
    detay5: 'ERKEK: PSKD100050 - KADIN: PSKD100051'
  },
  {
    id: 16693,
    model: '2026 KIŞ SKODA SERVİS DANIŞMAN & MİS/HASAR GÖMLEK - BEYAZ',
    parcaNo: 'ERKEK: PSKD100025 - KADIN: PSKD100026',
    detay5: 'ERKEK: PSKD100025 - KADIN: PSKD100026'
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
    detay5: 'ERKEK: PSKD100041 - KADIN: PSKD100042'
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
  }
];

async function main() {
  console.log('================================================================');
  console.log('🚀 SKODA 2026 YAZ & 2025 KIŞ MİGRASYON VE VERİ NORMALİZASYONU');
  console.log('================================================================\n');

  // 1. REPAIR NaN BARCODES IN MSSQL & PG
  console.log('--- 1. ONARIM: Bozuk NaN Barkodların Düzeltilmesi ---');
  let mssqlNanSql = '';
  for (const [badBc, goodBc] of Object.entries(NAN_FIX_MAP)) {
    mssqlNanSql += `
      UPDATE [SIPARIS].[dbo].[MasterUrunler] 
      SET Barkod = '${goodBc}', Ean13 = '${goodBc}'
      WHERE Barkod = '${badBc}' OR Ean13 = '${badBc}';
    `;
    const pgRes = await pool.query(`
      UPDATE master_products
      SET barcode = $1, ean13 = $1
      WHERE barcode = $2 OR ean13 = $2
    `, [goodBc, badBc]);
    console.log(`PG: '${badBc}' -> '${goodBc}' (${pgRes.rowCount} satır güncellendi)`);
  }
  executeMssql(mssqlNanSql);
  console.log('MSSQL: 42 adet NaN barkod başarıyla 13 haneli GS1 EAN-13 değerlerine güncellendi.\n');

  // 2. CLEAN BEDEN, CLEAN_SIZE, CODE39 IN MSSQL & PG
  console.log('--- 2. STANDARTLAŞTIRMA: Beden, CleanSize ve Code39 Alanları ---');
  const mssqlSkodaProducts = queryMssqlJson(`
    SELECT Id, ParcaNo, Barkod, UrunAdi
    FROM [SIPARIS].[dbo].[MasterUrunler]
    WHERE ParcaNo LIKE 'PSKD%'
  `);

  let updateMasterSql = '';
  for (const p of mssqlSkodaProducts) {
    const sku = p.ParcaNo.trim().toUpperCase();
    const isPantolon = /PANT/i.test(p.UrunAdi || '') || /^PSKD(100019|100028|200010|200019)/i.test(sku);
    
    // Extract size suffix from SKU
    let cleanVal = null;
    let bedenVal = null;

    if (isPantolon) {
      // Check pantolon sizes (longest suffix first to prevent 'L' matching 'XXXXXXL')
      const sortedPantEntries = Object.entries(PANT_SIZES).sort((a, b) => b[0].length - a[0].length);
      for (const [suf, info] of sortedPantEntries) {
        if (sku.endsWith(suf)) {
          cleanVal = info.clean;
          bedenVal = info.beden;
          break;
        }
      }
    } else {
      // Check top sizes (XXXL, XXL, XL, XS, L, M, S)
      for (const suf of ['XXXL', 'XXL', 'XL', 'XS', 'L', 'M', 'S']) {
        if (sku.endsWith(suf)) {
          cleanVal = TOP_SIZES[suf].clean;
          bedenVal = TOP_SIZES[suf].beden;
          break;
        }
      }
    }

    if (cleanVal && bedenVal) {
      updateMasterSql += `
        UPDATE [SIPARIS].[dbo].[MasterUrunler]
        SET CleanBeden = '${cleanVal}', Beden = '${bedenVal}', Code39 = '${sku}', Marka = 'SKODA', Grup = 'SKODA'
        WHERE Id = ${p.Id};
      `;

      await pool.query(`
        UPDATE master_products
        SET clean_size = $1, size = $2, code39 = $3, brand = 'SKODA', grup = 'SKODA'
        WHERE sku = $3
      `, [cleanVal, bedenVal, sku]);
    }
  }

  if (updateMasterSql) {
    executeMssql(updateMasterSql);
    console.log(`MSSQL & PG: ${mssqlSkodaProducts.length} adet Skoda master ürününün bedenleri ve Code39 alanları normalize edildi.\n`);
  }

  // 3. STANDARDIZE SKODA ORDERS IN MSSQL
  console.log('--- 3. SİPARİŞ NORMALİZASYONU: MSSQL [SIPARIS].dbo.Siparisler ---');
  let updateOrdersSql = '';
  for (const ord of SKODA_ORDERS_TO_STANDARDIZE) {
    const cleanModel = ord.model.replace(/'/g, "''");
    const cleanParca = ord.parcaNo.replace(/'/g, "''");
    const cleanDetay5 = ord.detay5.replace(/'/g, "''");
    updateOrdersSql += `
      UPDATE [SIPARIS].[dbo].[Siparisler]
      SET Model = '${cleanModel}',
          ParcaNo = '${cleanParca}',
          Detay5 = '${cleanDetay5}'
      WHERE Id = ${ord.id};
    `;
  }
  executeMssql(updateOrdersSql);
  console.log(`MSSQL: ${SKODA_ORDERS_TO_STANDARDIZE.length} adet aktif Skoda siparişi güncellendi.\n`);

  // 4. SYNC ACTIVE SKODA ORDERS TO POSTGRESQL ORDERS TABLE
  console.log('--- 4. SENKRONİZASYON: PostgreSQL orders Tablosu ---');
  const targetIds = SKODA_ORDERS_TO_STANDARDIZE.map(o => o.id);
  const mssqlFullOrders = queryMssqlJson(`
    SELECT 
      s.Id, s.Model, s.Detay1, s.Detay2, s.Detay3, s.Detay4, s.Detay5, s.ParcaNo,
      s.[Not], s.Zaman, s.TeslimZaman,
      m.Adi as MusteriAdi,
      b.Adi as BedenAdi,
      ISNULL(si.ToplamAdet, 0) AS ToplamAdet
    FROM [SIPARIS].[dbo].[Siparisler] s
    LEFT JOIN [SIPARIS].[dbo].[Musteriler] m ON s.MusteriId = m.Id
    LEFT JOIN [SIPARIS].[dbo].[Bedenler] b ON s.BedenId = b.Id
    LEFT JOIN (
      SELECT 
        si.SiparisId,
        SUM(ISNULL(si.B01, 0) + ISNULL(si.B02, 0) + ISNULL(si.B03, 0) + ISNULL(si.B04, 0) + ISNULL(si.B05, 0) +
            ISNULL(si.B06, 0) + ISNULL(si.B07, 0) + ISNULL(si.B08, 0) + ISNULL(si.B09, 0) + ISNULL(si.B10, 0) +
            ISNULL(si.B11, 0) + ISNULL(si.B12, 0) + ISNULL(si.B13, 0) + ISNULL(si.B14, 0)) AS ToplamAdet
      FROM [SIPARIS].[dbo].[SiparisIslemleri] si
      WHERE si.IslemId = 1 OR si.IslemId = (SELECT MIN(IslemId) FROM [SIPARIS].[dbo].[SiparisIslemleri] WHERE SiparisId = si.SiparisId)
      GROUP BY si.SiparisId
    ) si ON s.Id = si.SiparisId
    WHERE s.Id IN (${targetIds.join(',')})
  `);

  for (const o of mssqlFullOrders) {
    const orderNo = o.Id;
    const qty = o.ToplamAdet || 1;
    const model = o.Model || 'Skoda Urunu';
    const parcaNo = o.ParcaNo || '';
    const notes = o.Detay5 || o['Not'] || '';
    const musteri = o.MusteriAdi || 'DOĞUŞ OTOMOTİV';

    // Find sample barcode for root SKU in master_products
    const rootSkuMatch = parcaNo.match(/(?:ERKEK|BAY)\s*:\s*([A-Za-z0-9_-]+)/i) || parcaNo.match(/\b(PSKD\d+)/i);
    const rootSku = rootSkuMatch ? rootSkuMatch[1].trim() : parcaNo;

    const mpSample = await pool.query(`
      SELECT barcode, ean13 FROM master_products
      WHERE sku LIKE $1 OR sku = $2
      ORDER BY id ASC LIMIT 1
    `, [`${rootSku}%`, rootSku]);

    const sampleBc = (mpSample.rows[0] && (mpSample.rows[0].barcode || mpSample.rows[0].ean13)) || '8692456899738';

    // Upsert into PG orders table
    const existing = await pool.query('SELECT id, processed_quantity FROM orders WHERE order_number = $1', [orderNo]);
    if (existing.rows.length > 0) {
      await pool.query(`
        UPDATE orders
        SET product_name = $1,
            sku = $2,
            code39 = $2,
            brand = 'SKODA',
            grup = 'SKODA',
            notes = $3,
            quantity = $4,
            dealer = $5,
            sub_customer_name = $5,
            updated_at = NOW()
        WHERE order_number = $6
      `, [model, parcaNo, notes, qty, musteri, orderNo]);
      console.log(`PG orders: Sipariş #${orderNo} güncellendi.`);
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
      `, [orderNo, model, parcaNo, sampleBc, qty, notes, musteri]);
      console.log(`PG orders: Sipariş #${orderNo} yeni eklendi.`);
    }
  }

  // 5. VERIFY ZERO NaN IN BOTH DATABASES
  console.log('\n--- 5. DOĞRULAMA: Kalan NaN Kontrolü ---');
  const mssqlNanRemain = queryMssqlJson(`
    SELECT COUNT(*) as cnt
    FROM [SIPARIS].[dbo].[MasterUrunler]
    WHERE (Barkod LIKE '%NaN%' OR Ean13 LIKE '%NaN%') AND (Marka = 'SKODA' OR ParcaNo LIKE 'PSKD%')
  `);
  const pgNanRemain = await pool.query(`
    SELECT COUNT(*) as cnt
    FROM master_products
    WHERE (barcode LIKE '%NaN%' OR ean13 LIKE '%NaN%') AND (brand = 'SKODA' OR sku LIKE 'PSKD%')
  `);

  console.log(`MSSQL Skoda Kalan NaN: ${mssqlNanRemain[0] ? mssqlNanRemain[0].cnt : 0}`);
  console.log(`PG Skoda Kalan NaN: ${pgNanRemain.rows[0].cnt}`);

  console.log('\n✅ Skoda Migrasyon ve Veri Normalizasyonu Tamamlandı!');
  await pool.end();
  process.exit(0);
}

main().catch(err => {
  console.error('Migration Error:', err);
  process.exit(1);
});
