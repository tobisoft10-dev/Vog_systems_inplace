const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Pool } = require('./node_modules/pg');

const pool = new Pool({
  user: 'postgres',
  password: '150609%M',
  host: 'localhost',
  port: 5432,
  database: 'vog_db'
});

function executeMssql(sqlQuery) {
  const tmpFile = path.join(__dirname, `tmp_exec_seat_${Date.now()}.sql`);
  fs.writeFileSync(tmpFile, sqlQuery, 'utf8');
  const cmd = `sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -d SIPARIS -f 65001 -w 65535 -y 0 -i "${tmpFile}"`;
  try {
    execSync(cmd, { stdio: 'pipe', maxBuffer: 50 * 1024 * 1024 });
  } catch (err) {
    console.error('MSSQL Exec Error:', err.message);
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (e) { }
  }
}

function queryMssqlJson(queryText) {
  const tmpFile = path.join(__dirname, `tmp_q_seat_${Date.now()}.json`);
  const cleanQuery = queryText.replace(/\r?\n/g, ' ');
  const cmd = `sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -d SIPARIS -f 65001 -w 65535 -y 0 -o "${tmpFile}" -Q "SET NOCOUNT ON; ${cleanQuery} FOR JSON PATH"`;
  try {
    execSync(cmd, { stdio: 'pipe', maxBuffer: 50 * 1024 * 1024 });
    if (fs.existsSync(tmpFile)) {
      const raw = fs.readFileSync(tmpFile, 'utf8').trim();
      fs.unlinkSync(tmpFile);
      const sanitized = raw.replace(/[\u0000-\u001F]+/g, (m) => (m === '\r' || m === '\n' || m === '\t') ? ' ' : '');
      if (sanitized) return JSON.parse(sanitized);
    }
  } catch (err) {
    console.error('MSSQL JSON Query Error:', err.message);
  }
  return [];
}

function getSizeSuffix(order, defaultSize = 'XS') {
  const bAdi = (order.BedenAdi || '').trim().toUpperCase();
  if (bAdi && !bAdi.includes('XXS-9XL') && !bAdi.includes('36-62') && !bAdi.includes('BEDENSİZ')) {
    const numMatch = bAdi.match(/\b(3[4-9]|[4-5]\d|6[0-2])\b/);
    if (numMatch) {
      const n = parseInt(numMatch[1], 10);
      // Pant size mapping table (starting at 38 for men, 36 for women/kış)
      if (n === 36) return 'XXS';
      if (n === 38) return 'XS';
      if (n === 40) return 'S';
      if (n === 42) return 'M';
      if (n === 44) return 'L';
      if (n === 46) return 'XL';
      if (n === 48) return 'XXL';
      if (n === 50) return 'XXXL';
      if (n === 52) return 'XXXXL';
      if (n === 54) return 'XXXXXL';
      if (n === 56) return 'XXXXXXL';
      if (n === 58) return 'XXXXXXXL';
      if (n === 60) return 'XXXXXXXXL';
      if (n === 62) return 'XXXXXXXXXL';
    }
    const letterMatch = bAdi.match(/\b(XXS|XS|S|M|L|XL|XXL|2XL|3XL|XXXL|4XL|XXXXL|5XL|XXXXXL)\b/);
    if (letterMatch) {
      let l = letterMatch[1];
      if (l === '2XL') l = 'XXL';
      if (l === '3XL') l = 'XXXL';
      if (l === '4XL') l = 'XXXXL';
      if (l === '5XL') l = 'XXXXXL';
      return l;
    }
  }
  return defaultSize;
}

function resolveOfficialSeatParcaNo(order) {
  const model = (order.Model || '').toUpperCase();
  const det5 = (order.Detay5 || '').toUpperCase();
  const notText = (order.Not || '').toUpperCase();
  const currentParca = (order.ParcaNo || '').toUpperCase();
  const id = order.Id;

  // Must be a SEAT order
  if (!model.includes('SEAT') && !det5.includes('SEAT') && !currentParca.includes('SEAT')) return null;
  if (model.includes('BMW') || model.includes('MINI') || model.includes('BORUSAN')) return null;
  if (model.includes('CUPRA')) return null;
  if (model.includes('AUDI RPT') || model.includes('MERCEDES')) return null;
  if (model.includes('ACIBADEM') || model.includes('FORD') || model.includes('OPEL') || model.includes('TÜVTÜRK') || model.includes('TÜVSÜD') || model.includes('KIA')) return null;

  const isYaz = model.includes('YAZ') || model.includes('YAZLIK') || model.includes('KISA KOL');
  const isKis = model.includes('KIŞ') || model.includes('KIS') || model.includes('SOFTSHELL') || model.includes('SOFTJELL') || model.includes('POLAR') || model.includes('MONT') || model.includes('SWEAT') || model.includes('YELEK') || model.includes('GÖMLEK') || model.includes('GOMLEK');

  const isKadinOnly = (model.includes('BAYAN') || model.includes('KADIN')) && !model.includes('BAY') && !model.includes('ERKEK');
  const isErkekOnly = (model.includes('BAY') || model.includes('ERKEK')) && !model.includes('BAYAN') && !model.includes('KADIN');
  const isDualGender = (model.includes('BAY') && model.includes('BAYAN')) || (model.includes('ERKEK') && model.includes('KADIN')) || det5.includes('BAYAN') || det5.includes('KADIN');

  // 1. GÖMLEK
  if (model.includes('GÖMLEK') || model.includes('GOMLEK')) {
    const szM = getSizeSuffix(order, 'XS');
    const szF = getSizeSuffix(order, 'XS');
    if (isKadinOnly) return `PSEAT100003${szF}`;
    if (isErkekOnly) return `PSEAT100004${szM}`;
    return `ERKEK: PSEAT100004${szM} - KADIN: PSEAT100003${szF}`;
  }

  // 2. POLAR
  if (model.includes('POLAR')) {
    // Formen Polar
    if (model.includes('FORMEN')) {
      const sz = getSizeSuffix(order, 'XS');
      return `PSEAT100040${sz}`;
    }
    // Master Teknisyen Polar
    if (model.includes('MASTER')) {
      const sz = getSizeSuffix(order, 'XS');
      return `PSEAT100050${sz}`;
    }
    // Teknisyen / Kaporta / Mekanik Polar
    if (model.includes('TEKNİSYEN') || model.includes('TEKNISYEN') || model.includes('KAPORTA') || model.includes('MEKANİK') || model.includes('MEKANIK')) {
      const sz = getSizeSuffix(order, 'XS');
      return `PSEAT100039${sz}`;
    }
    // Servis Danışmanı / Garanti-Dispozisyon Polar
    const szM = getSizeSuffix(order, 'XS');
    const szF = getSizeSuffix(order, 'XS');
    if (isKadinOnly) return `PSEAT100037${szF}`;
    if (isErkekOnly) return `PSEAT100038${szM}`;
    return `ERKEK: PSEAT100038${szM} - KADIN: PSEAT100037${szF}`;
  }

  // 3. MONT / SOFTSHELL
  if (model.includes('MONT') || model.includes('SOFTSHELL') || model.includes('SOFTJELL')) {
    if (model.includes('ACİL') || model.includes('ACIL')) {
      const sz = getSizeSuffix(order, 'XS');
      return `PSEAT100025${sz}`;
    }
    // Servis Danışmanı Mont
    const szM = getSizeSuffix(order, 'XS');
    const szF = getSizeSuffix(order, 'XS');
    if (isKadinOnly) return `PSEAT100024${szF}`;
    if (isErkekOnly) return `PSEAT100023${szM}`;
    return `ERKEK: PSEAT100023${szM} - KADIN: PSEAT100024${szF}`;
  }

  // 4. YELEK
  if (model.includes('YELEK')) {
    const sz = getSizeSuffix(order, 'XS');
    return `PSEAT100020${sz}`;
  }

  // 5. SWEATSHIRT (KIŞ)
  if (model.includes('SWEAT') || model.includes('SWEATSHIRT') || model.includes('SWEAT SHIRT')) {
    // Master Teknisyen
    if (model.includes('MASTER')) {
      const sz = getSizeSuffix(order, 'XS');
      return `PSEAT100028${sz}`;
    }
    // Garanti
    if (model.includes('GARANTİ') || model.includes('GARANTI') || model.includes('DİS') || model.includes('DIS')) {
      const szM = getSizeSuffix(order, 'XS');
      const szF = getSizeSuffix(order, 'XS');
      if (isDualGender) return `ERKEK: PSEAT100051${szM} - KADIN: PSEAT100052${szF}`;
      if (isKadinOnly) return `PSEAT100052${szF}`;
      return `PSEAT100051${szM}`;
    }
    // Formen / YP
    if (model.includes('FORMEN') || model.includes('YEDEK PARÇA') || model.includes('YEDEK PARCA')) {
      const sz = getSizeSuffix(order, 'XS');
      return `PSEAT100019${sz}`;
    }
    // Kaporta / Bisiklet Yaka (0 Yaka)
    if (model.includes('KAPORTA') || model.includes('BİSİKLET') || model.includes('BISIKLET') || (/\b[0O]\s*YAKA\b/i.test(model) && !model.includes('POLO'))) {
      const sz = getSizeSuffix(order, 'XS');
      return `PSEAT100022${sz}`;
    }
    // Mekanik / Teknisyen Polo Yaka Sweatshirt
    const sz = getSizeSuffix(order, 'XS');
    return `PSEAT100021${sz}`;
  }

  // 6. T-SHIRT / POLO (YAZ)
  if (model.includes('TSHIRT') || model.includes('T-SHIRT') || model.includes('POLO') || model.includes('T SHIRT') || isYaz) {
    if (model.includes('PANTOLON')) {
      // Handled in Pantolon section
    } else {
      // Formen Polo
      if (model.includes('FORMEN')) {
        const sz = getSizeSuffix(order, 'XS');
        return `PSEAT200007${sz}`;
      }
      // Master Teknisyen Polo
      if (model.includes('MASTER')) {
        const sz = getSizeSuffix(order, 'XS');
        return `PSEAT200028${sz}`;
      }
      // Stajyer Polo
      if (model.includes('STAJYER')) {
        const sz = getSizeSuffix(order, 'XS');
        return `PSEAT200019${sz}`;
      }
      // Teknisyen Bisiklet / 0 Yaka
      if (model.includes('BİSİKLET') || model.includes('BISIKLET') || (/\b[0O]\s*YAKA\b/i.test(model) && !model.includes('POLO'))) {
        const sz = getSizeSuffix(order, 'XS');
        return `PSEAT200012${sz}`;
      }
      // Servis Danışmanı Kırmızı Polo
      if (model.includes('KIRMIZI')) {
        const szM = getSizeSuffix(order, 'XS');
        const szF = getSizeSuffix(order, 'XS');
        if (isKadinOnly) return `PSEAT200018${szF}`;
        if (isErkekOnly) return `PSEAT200017${szM}`;
        return `ERKEK: PSEAT200017${szM} - KADIN: PSEAT200018${szF}`;
      }
      // Servis Danışmanı Beyaz Polo
      if (model.includes('DANIŞMAN') || model.includes('DANISMAN') || model.includes('S.DAN') || model.includes('DİĞER') || model.includes('DIGER')) {
        const szM = getSizeSuffix(order, 'XS');
        const szF = getSizeSuffix(order, 'XS');
        if (isKadinOnly) return `PSEAT200005${szF}`;
        if (isErkekOnly) return `PSEAT200002${szM}`;
        return `ERKEK: PSEAT200002${szM} - KADIN: PSEAT200005${szF}`;
      }
      // Teknisyen Normal Polo
      const sz = getSizeSuffix(order, 'XS');
      return `PSEAT200010${sz}`;
    }
  }

  // 7. PANTOLON
  if (model.includes('PANTOLON')) {
    // Servis Danışmanı Pantolon
    if (model.includes('DANIŞMAN') || model.includes('DANISMAN') || model.includes('S.DAN') || model.includes('D.SERVİS') || model.includes('D.SERVIS')) {
      if (isYaz || det5.includes('PSEAT200003') || det5.includes('PSEAT200006')) {
        const szM = getSizeSuffix(order, 'XS');
        const szF = getSizeSuffix(order, 'XS');
        if (isKadinOnly) return `PSEAT200006${szF}`;
        if (isErkekOnly) return `PSEAT200003${szM}`;
        return `ERKEK: PSEAT200003${szM} - KADIN: PSEAT200006${szF}`;
      }
      // Kış Servis Danışmanı Pantolon
      const szM = getSizeSuffix(order, 'XS');
      const szF = getSizeSuffix(order, 'XS');
      if (isKadinOnly) return `PSEAT100012${szF}`;
      if (isErkekOnly) return `PSEAT100005${szM}`;
      return `ERKEK: PSEAT100005${szM} - KADIN: PSEAT100012${szF}`;
    }

    // Teknisyen / Formen / Garanti / Master Teknisyen Pantolon
    if (isYaz || currentParca.includes('PSEAT200009')) {
      const sz = getSizeSuffix(order, 'XS');
      return `PSEAT200009${sz}`;
    }
    // Kış Teknisyen / Formen / Garanti Pantolon (VW Modeli)
    const sz = getSizeSuffix(order, 'XXS');
    return `PSEAT100006${sz}`;
  }

  // 8. Aksesuarlar / Sentetik fallback
  if (model.includes('KILIF') || model.includes('ATKI') || model.includes('KOLTUK')) {
    return `PSEAT${id}`;
  }

  return null;
}

async function main() {
  console.log('================================================================');
  console.log('🚀 SEAT 2025 KIŞ & 2026 YAZ PARÇA NO VE VERİ NORMALİZASYONU');
  console.log('================================================================\n');

  // 1. FETCH ALL SEAT ORDERS
  console.log('--- 1. SEAT SİPARİŞLERİNİN ÇEKİLMESİ (MSSQL) ---');
  const allOrders = queryMssqlJson(`
    SELECT s.Id, s.Model, s.ParcaNo, s.Detay5, s.[Not], m.Adi as Musteri, b.Adi as BedenAdi,
    (
      SELECT SUM(ISNULL(B01,0)+ISNULL(B02,0)+ISNULL(B03,0)+ISNULL(B04,0)+ISNULL(B05,0)+ISNULL(B06,0)+ISNULL(B07,0)+ISNULL(B08,0)+ISNULL(B09,0)+ISNULL(B10,0)+ISNULL(B11,0)+ISNULL(B12,0)+ISNULL(B13,0)+ISNULL(B14,0))
      FROM [SIPARIS].[dbo].[SiparisIslemleri]
      WHERE SiparisId = s.Id
    ) AS ToplamAdet
    FROM Siparisler s
    LEFT JOIN Musteriler m ON s.MusteriId = m.Id
    LEFT JOIN Bedenler b ON s.BedenId = b.Id
    WHERE (s.Model LIKE '%SEAT%' OR s.ParcaNo LIKE '%SEAT%' OR s.Detay5 LIKE '%SEAT%' OR s.[Not] LIKE '%PSEAT%')
      AND s.Model NOT LIKE '%BMW%' 
      AND s.Model NOT LIKE '%MINI%' 
      AND s.Model NOT LIKE '%BORUSAN%'
      AND s.Model NOT LIKE '%CUPRA%'
      AND s.Model NOT LIKE '%AUDI RPT%'
    ORDER BY s.Id DESC
  `);

  console.log(`MSSQL'de toplam ${allOrders.length} adet Seat siparişi inceleniyor.`);

  const ordersToUpdate = [];
  for (const o of allOrders) {
    const targetParcaNo = resolveOfficialSeatParcaNo(o);
    if (!targetParcaNo) continue;

    const currentParcaNo = (o.ParcaNo || '').trim();
    let cleanDetay5 = (o.Detay5 || '').trim();
    if (/^(?:TEK\s*TEK|PAKET|KOL[Iİ]|PO[SŞ]ET|İSİM|ISIM)/i.test(cleanDetay5)) {
      cleanDetay5 = `TEK TEK PAKET. ${targetParcaNo}`;
    }

    ordersToUpdate.push({
      id: o.Id,
      model: o.Model,
      currentParcaNo,
      targetParcaNo,
      cleanDetay5,
      qty: o.ToplamAdet || 0,
      musteri: o.Musteri || 'DOĞUŞ OTOMOTİV SERVİS VE TİCARET A.Ş.'
    });
  }

  console.log(`Resmi Excel kataloglarına eşleşen Seat sipariş sayısı: ${ordersToUpdate.length}`);

  const isDryRun = process.env.DRY_RUN === '1' || process.argv.includes('--dry-run');
  if (isDryRun) {
    console.log('\n🔍 DRY RUN MODU - ÖRNEK DEĞİŞİKLİKLER:');
    ordersToUpdate.slice(0, 30).forEach(o => {
      console.log(`[ID: ${o.id}] ${o.model}`);
      console.log(`   Eski: ${o.currentParcaNo} -> Yeni: ${o.targetParcaNo}`);
    });
    console.log(`\nToplam ${ordersToUpdate.length} sipariş güncellenecek.`);
    await pool.end();
    return;
  }

  // 2. UPDATE MSSQL Siparisler
  console.log('\n--- 2. MSSQL Siparisler GÜNCELLEMESİ ---');
  const chunkSize = 200;
  for (let i = 0; i < ordersToUpdate.length; i += chunkSize) {
    const chunk = ordersToUpdate.slice(i, i + chunkSize);
    let mssqlUpdateSql = 'BEGIN TRANSACTION;\n';
    for (const ord of chunk) {
      const escParca = ord.targetParcaNo.replace(/'/g, "''");
      const escDetay5 = ord.cleanDetay5.replace(/'/g, "''");
      mssqlUpdateSql += `
        UPDATE [SIPARIS].[dbo].[Siparisler]
        SET ParcaNo = '${escParca}', Detay5 = '${escDetay5}'
        WHERE Id = ${ord.id};
      \n`;
    }
    mssqlUpdateSql += 'COMMIT TRANSACTION;\n';
    executeMssql(mssqlUpdateSql);
  }
  console.log(`✅ MSSQL Siparisler: ${ordersToUpdate.length} adet Seat siparişi güncellendi.`);

  // 3. SYNCHRONIZE TO POSTGRESQL orders TABLE
  console.log('\n--- 3. POSTGRESQL orders TABLOSUNUN SENKRONİZASYONU ---');
  let pgCount = 0;
  for (const ord of ordersToUpdate) {
    const orderNo = String(ord.id);
    const sampleBc = ord.targetParcaNo.startsWith('ERKEK:')
      ? ord.targetParcaNo.split(' - ')[0].replace('ERKEK: ', '').trim()
      : ord.targetParcaNo;

    let finalBarcode = sampleBc;
    const bcRow = await pool.query(
      'SELECT barcode FROM master_products WHERE UPPER(sku) = $1 OR UPPER(sku) LIKE $2 LIMIT 1',
      [sampleBc.toUpperCase(), sampleBc.toUpperCase() + '%']
    );
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
            brand = 'SEAT',
            grup = 'SEAT',
            dealer = $6,
            sub_customer_name = $6,
            updated_at = NOW()
        WHERE order_number = $7
      `, [ord.model, ord.targetParcaNo, finalBarcode, ord.cleanDetay5, ord.qty, ord.musteri, orderNo]);
    } else {
      await pool.query(`
        INSERT INTO orders (
          order_number, product_name, sku, code39, barcode, ean13, brand, grup,
          quantity, processed_quantity, remaining_quantity, status, notes, dealer, sub_customer_name,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $3, $4, $4, 'SEAT', 'SEAT',
          $5, 0, $5, 'BEKLEMEDE', $6, $7, $7,
          NOW(), NOW()
        )
      `, [orderNo, ord.model, ord.targetParcaNo, finalBarcode, ord.qty, ord.cleanDetay5, ord.musteri]);
    }
    pgCount++;
  }
  console.log(`✅ PostgreSQL orders: ${pgCount} adet Seat siparişi eşitlendi ve kaydedildi.`);

  await pool.end();
  console.log('\n🎉 TÜM TABLOLARDA SEAT PARÇA KODU GÜNCELLEMESİ BAŞARIYLA TAMAMLANDI!');
}

main().catch(console.error);
