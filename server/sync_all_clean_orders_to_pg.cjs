const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: '!719356Qse!',
  database: 'vog_db',
  port: 5432
});

const GENDER_CLEAN_REGEX = /\s*(?:\/|\-|\*|\()*\s*\b(?:BAY\s*\/\s*BAYAN|BAY\s*-\s*BAYAN|BAY\s*&\s*BAYAN|ERKEK\s*\/\s*KADIN|ERKEK\s*-\s*KADIN|ERKEKLER|KADINLAR|BAYAN|BAY(?![iİıIeErR])|ERKEK|KADIN)\b\s*(?:\/|\-|\*|\))*\s*/gi;

function removeGenderFromProductName(text) {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text.replace(GENDER_CLEAN_REGEX, ' ');
  cleaned = cleaned.replace(/\s*-\s*-\s*/g, ' - ');
  cleaned = cleaned.replace(/\s*\/\s*\/\s*/g, ' / ');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  cleaned = cleaned.replace(/^[\s\-_/\*]+|[\s\-_/\*]+$/g, '').trim();
  return cleaned;
}

const KNOWN_COLORS = [
  'FÜME / SİYAH', 'FÜME / KIRMIZI', 'FÜME / MAVİ', 'FÜME / SARI', 'LACİVERT / BEYAZ',
  'SİYAH / BEYAZ', 'SİYAH / KIRMIZI', 'SİYAH / SARI', 'SARI FOSFORLU', 'TURUNCU FOSFORLU',
  'SİYAH', 'BEYAZ', 'FÜME', 'LACİVERT', 'KIRMIZI', 'MAVİ', 'GRİ', 'YEŞİL', 'BORDO',
  'SARI', 'TURUNCU', 'ANTRASİT', 'PETROL', 'BEJ', 'KAHVERENGİ', 'MELANJ', 'HAKİ'
];

function extractColorAndCleanProductName(productName, existingColor = null) {
  if (!productName || typeof productName !== 'string') {
    return { cleanProductName: productName || '', color: existingColor || 'STANDART' };
  }
  let str = removeGenderFromProductName(productName);
  let detectedColor = existingColor && existingColor !== 'STANDART' ? existingColor : null;

  for (const c of KNOWN_COLORS) {
    const regexTrailing = new RegExp(`[\\s\\-_/]+${c.replace(/\//g, '\\/')}[\\s\\-_/]*$`, 'i');
    if (regexTrailing.test(str)) {
      if (!detectedColor) detectedColor = c;
      str = str.replace(regexTrailing, '').trim();
      break;
    }
    const regexEnclosed = new RegExp(`[\\-\\(\\[/]\\s*${c.replace(/\//g, '\\/')}\\s*[\\-\\)\\]/]`, 'i');
    if (regexEnclosed.test(str)) {
      if (!detectedColor) detectedColor = c;
      str = str.replace(regexEnclosed, ' ').trim();
      break;
    }
  }

  str = str.replace(/^[\s\-_/\*]+|[\s\-_/\*]+$/g, '').trim();
  str = str.replace(/\s{2,}/g, ' ');
  return {
    cleanProductName: str || productName.trim(),
    color: detectedColor || 'STANDART'
  };
}

function cleanParcaNo(raw, bedenAdi = '') {
  if (!raw) return '';
  let str = String(raw).trim();
  const parcaMatch = str.match(/PARÇA\s*NO\s*:\s*([^\s,;]+)/i);
  if (parcaMatch) return parcaMatch[1].trim();

  const dualMatch = str.match(/(?:ERKEK|BAY)\s*:\s*([A-Za-z0-9_-]+)/i);
  if (dualMatch) return dualMatch[1].trim();

  const cleanCandidate = str.replace(/^PARCA\s*NO\s*:\s*/i, '')
                           .replace(/^SKU\s*:\s*/i, '')
                           .replace(/^KOD\s*:\s*/i, '')
                           .split(/[\s,;-]/)[0].trim();
  if (cleanCandidate && /^[A-Za-z0-9_]{4,}$/.test(cleanCandidate)) {
    return cleanCandidate;
  }
  return str.split(/[\s,;]/)[0].trim();
}

function resolveBrandAndGrup(sku, defaultBrand = 'GENEL') {
  if (!sku) return { brand: defaultBrand, grup: defaultBrand };
  const s = sku.toUpperCase();
  if (s.startsWith('PAUDI') || s.startsWith('SSHAUDI')) return { brand: 'AUDI', grup: 'AUDI' };
  if (s.startsWith('PVWK') || s.startsWith('PVWT') || s.startsWith('PVWB') || s.startsWith('PVW')) return { brand: 'VOLKSWAGEN', grup: 'VOLKSWAGEN' };
  if (s.startsWith('PPORSCHE') || s.startsWith('SSHPORSCHE')) return { brand: 'PORSCHE', grup: 'PORSCHE' };
  if (s.startsWith('PSEAT')) return { brand: 'SEAT', grup: 'SEAT' };
  if (s.startsWith('PCUPRA')) return { brand: 'CUPRA', grup: 'CUPRA' };
  if (s.startsWith('PSKODA') || s.startsWith('PSKD')) return { brand: 'SKODA', grup: 'SKODA' };
  if (s.startsWith('PSCANIA')) return { brand: 'SCANIA', grup: 'SCANIA' };
  if (s.startsWith('PVOG') || s.startsWith('K-OG')) return { brand: 'VOG', grup: 'VOG' };
  return { brand: defaultBrand, grup: defaultBrand };
}

async function run() {
  console.log('🚀 BSİP -> PostgreSQL orders tablosu tam senkronizasyonu başlatılıyor...');

  // 1. Fetch Master Products for lookup
  const mpRes = await pool.query('SELECT sku, code39, barcode, ean13, product_name, color, brand, grup, gender FROM master_products');
  const mpBySku = new Map();
  const mpByEan = new Map();
  for (const r of mpRes.rows) {
    if (r.sku) mpBySku.set(r.sku.toUpperCase(), r);
    if (r.ean13) mpByEan.set(r.ean13, r);
    if (r.barcode) mpByEan.set(r.barcode, r);
  }
  console.log(`📌 Master Products yüklendi: ${mpRes.rows.length} kayıt.`);

  // 2. Query MSSQL via sqlcmd JSON
  const sql = `
    SELECT 
        s.Id AS order_number,
        s.Model AS model,
        s.[Not] AS notes,
        s.Detay1, s.Detay2, s.Detay3, s.Detay4, s.Detay5,
        m.Adi AS musteri_adi,
        p.Adi AS personel_adi,
        ISNULL(b.Adi, 'BEDEN (XXS-9XL)') AS beden_adi,
        ISNULL(si.ToplamAdet, 0) AS ToplamAdet
    FROM [SIPARIS].[dbo].[Siparisler] s
    LEFT JOIN [SIPARIS].[dbo].[Musteriler] m ON s.MusteriId = m.Id
    LEFT JOIN [SIPARIS].[dbo].[Personeller] p ON s.PersonelId = p.Id
    LEFT JOIN [SIPARIS].[dbo].[Bedenler] b ON s.BedenId = b.Id
    LEFT JOIN (
        SELECT 
            si.SiparisId,
            si.IslemId,
            SUM(
                ISNULL(si.B01, 0) + ISNULL(si.B02, 0) + ISNULL(si.B03, 0) + ISNULL(si.B04, 0) + ISNULL(si.B05, 0) +
                ISNULL(si.B06, 0) + ISNULL(si.B07, 0) + ISNULL(si.B08, 0) + ISNULL(si.B09, 0) + ISNULL(si.B10, 0) +
                ISNULL(si.B11, 0) + ISNULL(si.B12, 0) + ISNULL(si.B13, 0) + ISNULL(si.B14, 0)
            ) AS ToplamAdet,
            ROW_NUMBER() OVER(PARTITION BY si.SiparisId ORDER BY CASE WHEN si.IslemId = s2.IslemId THEN 0 ELSE 1 END, si.IslemId DESC) as rn
        FROM [SIPARIS].[dbo].[SiparisIslemleri] si
        LEFT JOIN [SIPARIS].[dbo].[Siparisler] s2 ON si.SiparisId = s2.Id
        GROUP BY si.SiparisId, si.IslemId, s2.IslemId
    ) si ON s.Id = si.SiparisId AND si.rn = 1
    ORDER BY s.Id ASC
  `;

  const tmpFile = path.join(__dirname, `tmp_all_orders_${Date.now()}.json`);
  const cleanSql = sql.replace(/\r?\n/g, ' ');
  const cmd = `sqlcmd -S .\\SQLEXPRESS -d SIPARIS -U sa -P "150609%M" -f 65001 -w 65535 -y 0 -o "${tmpFile}" -Q "SET NOCOUNT ON; ${cleanSql} FOR JSON PATH"`;
  execSync(cmd, { stdio: 'ignore' });

  let allOrders = [];
  if (fs.existsSync(tmpFile)) {
    const raw = fs.readFileSync(tmpFile, 'utf8');
    try { fs.unlinkSync(tmpFile); } catch(e) {}
    const jsonStr = raw.split(/\r?\n/).map(l => l.trim()).join('');
    if (jsonStr) allOrders = JSON.parse(jsonStr);
  }

  console.log(`📦 MSSQL Siparisler tablosundan ${allOrders.length} sipariş çekildi.`);

  // 3. Batch upsert into PostgreSQL orders
  let count = 0;
  await pool.query('BEGIN');
  for (const o of allOrders) {
    const orderNum = parseInt(o.order_number);
    if (!orderNum) continue;

    let brand = 'GENEL';
    const fullText = `${o.model || ''} ${o.musteri_adi || ''} ${o.notes || ''} ${o.Detay1 || ''}`.toUpperCase();
    if (fullText.includes('VOLKSWAGEN') || fullText.includes('VW')) brand = 'VOLKSWAGEN';
    else if (fullText.includes('AUDI')) brand = 'AUDI';
    else if (fullText.includes('SKODA')) brand = 'SKODA';
    else if (fullText.includes('SEAT')) brand = 'SEAT';
    else if (fullText.includes('CUPRA')) brand = 'CUPRA';
    else if (fullText.includes('NISSAN')) brand = 'NISSAN';
    else if (fullText.includes('PORSCHE')) brand = 'PORSCHE';
    else if (fullText.includes('FORD')) brand = 'FORD';
    else if (fullText.includes('ACIBADEM')) brand = 'ACIBADEM';
    else if (fullText.includes('REDCELL')) brand = 'REDCELL';

    const qty = (o.ToplamAdet && o.ToplamAdet > 0) ? o.ToplamAdet : 1;
    const rawCandidate = o.Detay5 || o.Detay1 || o.notes || '';
    const cleanParca = cleanParcaNo(rawCandidate, o.beden_adi) || `PVOG${orderNum}`;

    const colorInfo = extractColorAndCleanProductName(o.model || 'Tekstil Ürünü');
    let finalProductName = colorInfo.cleanProductName;
    let finalColor = colorInfo.color || 'STANDART';
    let finalSku = cleanParca || `${brand}-${orderNum}`;
    let finalBarcode = (o.Detay2 && /^\d{8,14}$/.test(String(o.Detay2).trim())) ? String(o.Detay2).trim() : '';
    let finalEan13 = finalBarcode;
    let finalBrand = brand;
    let finalGrup = brand;
    let finalGender = 'UNISEX';

    // Master products lookup
    let matchedMp = null;
    if (finalBarcode && mpByEan.has(finalBarcode)) {
      matchedMp = mpByEan.get(finalBarcode);
    } else if (cleanParca && mpBySku.has(cleanParca.toUpperCase())) {
      matchedMp = mpBySku.get(cleanParca.toUpperCase());
    }

    if (matchedMp) {
      finalSku = matchedMp.sku;
      finalBarcode = matchedMp.barcode || matchedMp.ean13 || finalBarcode;
      finalEan13 = matchedMp.ean13 || matchedMp.barcode || finalEan13;
      finalBrand = matchedMp.brand || finalBrand;
      finalGrup = matchedMp.grup || finalBrand;
      if (matchedMp.color && (!finalColor || finalColor === 'STANDART')) finalColor = matchedMp.color;
      if (matchedMp.gender && finalGender === 'UNISEX') finalGender = matchedMp.gender;
      if (!finalProductName || finalProductName === 'Tekstil Ürünü') {
        if (matchedMp.product_name) {
          finalProductName = removeGenderFromProductName(matchedMp.product_name);
        }
      }
    } else {
      const bgInfo = resolveBrandAndGrup(finalSku, finalBrand);
      finalBrand = bgInfo.brand;
      finalGrup = bgInfo.grup;
    }

    const finalCode39 = finalSku; // code39 = sku

    await pool.query(`
      INSERT INTO orders (
        order_number, brand, grup, product_name, color, size, gender, sku, code39,
        barcode, ean13, sub_customer_name, staff_name, quantity, remaining_quantity,
        status, notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
      ON CONFLICT (order_number) DO UPDATE SET 
        brand = EXCLUDED.brand,
        grup = EXCLUDED.grup,
        product_name = EXCLUDED.product_name,
        color = EXCLUDED.color,
        size = EXCLUDED.size,
        gender = EXCLUDED.gender,
        sku = EXCLUDED.sku,
        code39 = EXCLUDED.code39,
        barcode = EXCLUDED.barcode,
        ean13 = EXCLUDED.ean13,
        sub_customer_name = EXCLUDED.sub_customer_name,
        staff_name = EXCLUDED.staff_name,
        quantity = EXCLUDED.quantity,
        remaining_quantity = CASE 
          WHEN orders.processed_quantity > 0 THEN GREATEST(0, EXCLUDED.quantity - orders.processed_quantity)
          ELSE EXCLUDED.quantity 
        END,
        updated_at = NOW()
    `, [
      orderNum,
      finalBrand,
      finalGrup,
      finalProductName,
      finalColor,
      o.beden_adi || 'BEDEN (XXS-9XL)',
      finalGender,
      finalSku,
      finalCode39,
      finalBarcode,
      finalEan13,
      o.musteri_adi || 'VOG Tekstil',
      o.personel_adi || '',
      qty,
      qty,
      'BEKLEMEDE',
      o.notes || ''
    ]);

    count++;
    if (count % 2000 === 0) {
      console.log(`⏳ ${count} / ${allOrders.length} sipariş işlendi...`);
    }
  }

  await pool.query('COMMIT');
  console.log(`✅ Toplam ${count} sipariş PostgreSQL orders tablosuna başarıyla eşitlendi.`);

  // Verify sample orders
  const sampleRes = await pool.query(`
    SELECT order_number, product_name, color, sku, code39, gender, brand, quantity 
    FROM orders 
    WHERE order_number IN (16673, 16667, 16804, 16806, 16950)
    ORDER BY order_number DESC
  `);
  console.log('\n--- KONTROL SİPARİŞLERİ ---');
  console.table(sampleRes.rows);

  await pool.end();
  process.exit(0);
}

run().catch(err => {
  console.error('Hata:', err);
  process.exit(1);
});
