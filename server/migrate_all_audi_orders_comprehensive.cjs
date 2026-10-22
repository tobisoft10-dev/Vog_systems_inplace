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
  const tmpFile = path.join(__dirname, `tmp_exec_audi_${Date.now()}.sql`);
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
  const tmpFile = path.join(__dirname, `tmp_q_audi_${Date.now()}.json`);
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
  if (bAdi && !bAdi.includes('XXS-9XL') && !bAdi.includes('36-62') && !bAdi.includes('BEDENSİZ') && !bAdi.includes('AUDI SD')) {
    const numMatch = bAdi.match(/\b(3[0-9]|[4-5]\d|6[0-2])\b/);
    if (numMatch) {
      const n = parseInt(numMatch[1], 10);
      return String(n);
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

function resolveOfficialAudiParcaNo(order) {
  const model = (order.Model || '').toUpperCase();
  const det5 = (order.Detay5 || '').toUpperCase();
  const notText = (order.Not || '').toUpperCase();
  const id = order.Id;

  // Filter out non-Audi orders
  if (model.includes('BMW') || model.includes('MINI') || model.includes('BORUSAN')) return null;
  if (model.includes('SKODA') && !model.includes('AUDI')) return null;

  const isYaz = model.includes('YAZ') || model.includes('YAZLIK') || model.includes('KISA KOL');
  const isKis = model.includes('KIŞ') || model.includes('KIS') || model.includes('SOFTSHELL') || model.includes('POLAR') || model.includes('MONT') || model.includes('SWEAT') || model.includes('BERE');

  const isKadinOnly = (model.includes('BAYAN') || model.includes('KADIN')) && !model.includes('BAY') && !model.includes('ERKEK');
  const isErkekOnly = (model.includes('BAY') || model.includes('ERKEK')) && !model.includes('BAYAN') && !model.includes('KADIN');

  // 1. BERE
  if (model.includes('BERE')) {
    return 'PAUDI9989';
  }

  // 2. GÖMLEK
  if (model.includes('GÖMLEK') || model.includes('GOMLEK')) {
    if (model.includes('YEDEK PARÇA') || model.includes('YEDEK PARCA') || model.includes('GARANTİ') || model.includes('GARANTI')) {
      const szM = getSizeSuffix(order, 'S');
      const szF = getSizeSuffix(order, 'S');
      if (isKadinOnly) return `PAUDI250019${szF}`;
      if (isErkekOnly) return `PAUDI250018${szM}`;
      return `ERKEK: PAUDI250018${szM} - KADIN: PAUDI250019${szF}`;
    }
    // Servis Danışmanı Beyaz Gömlek
    const szM = getSizeSuffix(order, 'S');
    const szF = getSizeSuffix(order, 'XXS');
    if (isKadinOnly) return `PAUDI250013${szF}`;
    if (isErkekOnly) return `PAUDI250012${szM}`;
    return `ERKEK: PAUDI250012${szM} - KADIN: PAUDI250013${szF}`;
  }

  // 3. E-TRON ÖZEL GRUBU
  if (model.includes('E-TRON') || model.includes('ETRON')) {
    if (model.includes('MONT')) {
      const sz = getSizeSuffix(order, 'S');
      return `PAUDI250032${sz}`;
    }
    if (model.includes('PANTOLON')) {
      const sz = getSizeSuffix(order, '38');
      return `PAUDI250025${sz}`;
    }
    if (model.includes('BEYAZ') || model.includes('DALGALI')) {
      const sz = getSizeSuffix(order, 'S');
      return `PAUDI250024${sz}`;
    }
    if (model.includes('SİYAH') || model.includes('SWEAT') || model.includes('POLO')) {
      const sz = getSizeSuffix(order, 'S');
      return `PAUDI250023${sz}`;
    }
    const sz = getSizeSuffix(order, 'S');
    return `PAUDI250023${sz}`;
  }

  // 4. POLAR
  if (model.includes('POLAR') && !model.includes('BERE')) {
    // Danışman BC Polar
    if (model.includes('DANIŞMAN') || model.includes('DANISMAN') || model.includes('BC')) {
      const szM = getSizeSuffix(order, 'S');
      const szF = getSizeSuffix(order, 'XXS');
      if (isKadinOnly) return `PAUDI4444${szF}`;
      if (isErkekOnly) return `PAUDI4242${szM}`;
      return `ERKEK: PAUDI4242${szM} - KADIN: PAUDI4444${szF}`;
    }
    // Yedek Parça & Garanti Polar
    if (model.includes('YEDEK PARÇA') || model.includes('YEDEK PARCA') || model.includes('GARANTİ') || model.includes('GARANTI')) {
      const szM = getSizeSuffix(order, 'XS');
      const szF = getSizeSuffix(order, 'S');
      if (isKadinOnly) return `PAUDI3005${szF}`;
      if (isErkekOnly) return `PAUDI3003${szM}`;
      return `ERKEK: PAUDI3003${szM} - KADIN: PAUDI3005${szF}`;
    }
    // Mekanik Teknisyen Polar (Siyah - Füme)
    if (model.includes('MEKANİK') || model.includes('MEKANIK')) {
      const sz = getSizeSuffix(order, 'XS');
      return `PAUDI9999${sz}`;
    }
    // Kaporta / PDI / Kalite Kontrol Polar (Füme - Siyah)
    if (model.includes('KAPORTA') || model.includes('PDI') || model.includes('KALİTE') || model.includes('KALITE')) {
      const sz = getSizeSuffix(order, 'XS');
      return `PAUDI9988${sz}`;
    }
    const sz = getSizeSuffix(order, 'XS');
    return `PAUDI9988${sz}`;
  }

  // 5. MONT
  if (model.includes('MONT')) {
    if (model.includes('DİAGNOZ') || model.includes('DIAGNOZ')) {
      const sz = getSizeSuffix(order, 'S');
      return `PAUDI250008${sz}`;
    }
    if (model.includes('FORMEN')) {
      const sz = getSizeSuffix(order, 'XS');
      return `PAUDI6464${sz}`;
    }
    if (model.includes('ACİL') || model.includes('ACIL')) {
      const sz = getSizeSuffix(order, 'XS');
      return `PAUDI250021${sz}`;
    }
    if (model.includes('YEDEK PARÇA') || model.includes('YEDEK PARCA') || model.includes('GARANTİ') || model.includes('GARANTI')) {
      const szM = getSizeSuffix(order, 'S');
      const szF = getSizeSuffix(order, 'S');
      if (isKadinOnly) return `PAUDI3539${szF}`;
      if (isErkekOnly) return `PAUDI3538${szM}`;
      return `ERKEK: PAUDI3538${szM} - KADIN: PAUDI3539${szF}`;
    }
    // Servis Danışmanı Mont
    if (model.includes('DANIŞMAN') || model.includes('DANISMAN')) {
      const szM = getSizeSuffix(order, 'S');
      const szF = getSizeSuffix(order, 'XXS');
      if (isKadinOnly) return `PAUDI250015${szF}`;
      if (isErkekOnly) return `PAUDI250014${szM}`;
      return `ERKEK: PAUDI250014${szM} - KADIN: PAUDI250015${szF}`;
    }
    const sz = getSizeSuffix(order, 'S');
    return `PAUDI250014${sz}`;
  }

  // 6. SWEATSHIRT (KIŞ)
  if (model.includes('SWEAT') || model.includes('SWEATSHIRT')) {
    if (model.includes('DİAGNOZ') || model.includes('DIAGNOZ')) {
      const sz = getSizeSuffix(order, 'S');
      return `PAUDI3576${sz}`;
    }
    if (model.includes('PDI')) {
      const sz = getSizeSuffix(order, 'S');
      return `PAUDI8282${sz}`;
    }
    if (model.includes('KALİTE') || model.includes('KALITE')) {
      const sz = getSizeSuffix(order, 'S');
      return `PAUDI8686${sz}`;
    }
    if (model.includes('ACİL') || model.includes('ACIL')) {
      const sz = getSizeSuffix(order, 'XS');
      return `PAUDI250022${sz}`;
    }
    if (model.includes('FORMEN')) {
      const sz = getSizeSuffix(order, 'XS');
      return `PAUDI250017${sz}`;
    }
    if (model.includes('MEKANİK') || model.includes('MEKANIK') || model.includes('KAPORTA') || model.includes('TEKNİSYEN') || model.includes('TEKNISYEN')) {
      const sz = getSizeSuffix(order, 'XS');
      return `PAUDI5252${sz}`;
    }
    const sz = getSizeSuffix(order, 'XS');
    return `PAUDI5252${sz}`;
  }

  // 7. T-SHIRT / POLO (YAZ)
  if (model.includes('TSHIRT') || model.includes('T-SHIRT') || model.includes('POLO')) {
    // Formen Polo
    if (model.includes('FORMEN')) {
      const sz = getSizeSuffix(order, 'XS');
      return `PAUDI0027${sz}`;
    }
    // Kalite Kontrol
    if (model.includes('KALİTE') || model.includes('KALITE')) {
      const sz = getSizeSuffix(order, 'S');
      return `PAUDI1112${sz}`;
    }
    // PDI
    if (model.includes('PDI')) {
      const sz = getSizeSuffix(order, 'S');
      return `PAUDI1113${sz}`;
    }
    // Diagnoz
    if (model.includes('DİAGNOZ') || model.includes('DIAGNOZ')) {
      const sz = getSizeSuffix(order, 'XS');
      return `PAUDI0028${sz}`;
    }
    // Acil Servis
    if (model.includes('ACİL') || model.includes('ACIL')) {
      const sz = getSizeSuffix(order, 'S');
      return `PAUDI0031${sz}`;
    }
    // Yedek Parça & Garanti
    if (model.includes('YEDEK PARÇA') || model.includes('YEDEK PARCA') || model.includes('GARANTİ') || model.includes('GARANTI')) {
      const szM = getSizeSuffix(order, 'XS');
      const szF = getSizeSuffix(order, 'XS');
      if (isKadinOnly) return `PAUDI0030${szF}`;
      if (isErkekOnly) return `PAUDI0032${szM}`;
      return `ERKEK: PAUDI0032${szM} - KADIN: PAUDI0030${szF}`;
    }
    // Servis Danışmanı T-Shirt (Siyah / Beyaz)
    if (model.includes('DANIŞMAN') || model.includes('DANISMAN')) {
      if (model.includes('BEYAZ')) {
        const szM = getSizeSuffix(order, 'S');
        const szF = getSizeSuffix(order, 'XS');
        if (isKadinOnly) return `PPAUDI260004${szF}`;
        if (isErkekOnly) return `PPAUDI260002${szM}`;
        return `ERKEK: PPAUDI260002${szM} - KADIN: PPAUDI260004${szF}`;
      }
      // Varsayılan Siyah
      const szM = getSizeSuffix(order, 'S');
      const szF = getSizeSuffix(order, 'XS');
      if (isKadinOnly) return `PPAUDI260003${szF}`;
      if (isErkekOnly) return `PPAUDI260001${szM}`;
      return `ERKEK: PPAUDI260001${szM} - KADIN: PPAUDI260003${szF}`;
    }
    // Teknisyen Polo Tişört
    if (model.includes('POLO')) {
      const sz = getSizeSuffix(order, 'XS');
      return `PAUDI25001${sz}`;
    }
    // Teknisyen Normal Tişört
    const sz = getSizeSuffix(order, 'XS');
    return `PAUDI1118${sz}`;
  }

  // 8. PANTOLON
  if (model.includes('PANTOLON')) {
    // Acil Servis Pantolon
    if (model.includes('ACİL') || model.includes('ACIL')) {
      if (isYaz) {
        const sz = getSizeSuffix(order, 'XS'); // 38
        return `PAUDI5533${sz}`;
      }
      const sz = getSizeSuffix(order, '38');
      return `PAUDI250020${sz}`;
    }
    // Diagnoz Pantolon
    if (model.includes('DİAGNOZ') || model.includes('DIAGNOZ') || model.includes('TDU')) {
      if (isYaz) {
        const sz = getSizeSuffix(order, 'S'); // 40
        return `PAUDI0029${sz}`;
      }
      const sz = getSizeSuffix(order, '38');
      return `PAUDI250009${sz}`;
    }
    // Servis Danışmanı Pantolon (S.DAN) - Note: Checked BEFORE generic Formen to handle multi-role "S.DAN PANTOLON FORMEN GAR."
    if (model.includes('DANIŞMAN') || model.includes('DANISMAN') || model.includes('S.DAN')) {
      if (isYaz || det5.includes('PAUDI0023') || det5.includes('PAUDI0026') || model.includes('2026')) {
        const szM = getSizeSuffix(order, 'XXS'); // 36
        const szF = getSizeSuffix(order, 'XXS'); // 34
        if (isKadinOnly) return `PAUDI0026${szF}`;
        if (isErkekOnly) return `PAUDI0023${szM}`;
        return `ERKEK: PAUDI0023${szM} - KADIN: PAUDI0026${szF}`;
      }
      // Kış Servis Danışmanı Pantolon
      const szM = getSizeSuffix(order, '38');
      const szF = getSizeSuffix(order, '34');
      if (isKadinOnly) return `PAUDI250011${szF}`;
      if (isErkekOnly) return `PAUDI250010${szM}`;
      return `ERKEK: PAUDI250010${szM} - KADIN: PAUDI250011${szF}`;
    }
    // Pure Formen Pantolon
    if (model.includes('FORMEN')) {
      if (isYaz) {
        const sz = getSizeSuffix(order, 'XS'); // 38
        return `PAUDI2210${sz}`;
      }
      const sz = getSizeSuffix(order, 'XS'); // 38
      return `PAUDI6868${sz}`;
    }
    // Yedek Parça & Garanti Pantolon
    if (model.includes('YEDEK PARÇA') || model.includes('YEDEK PARCA') || model.includes('GARANTİ') || model.includes('GARANTI')) {
      if (isYaz) {
        const szM = getSizeSuffix(order, 'XS');
        const szF = getSizeSuffix(order, 'XXS');
        if (isKadinOnly) return `PAUDI9925${szF}`;
        if (isErkekOnly) return `PAUDI9922${szM}`;
        return `ERKEK: PAUDI9922${szM} - KADIN: PAUDI9925${szF}`;
      }
      const szM = getSizeSuffix(order, 'XS');
      const szF = getSizeSuffix(order, 'XS');
      if (isKadinOnly) return `PAUDI4009${szF}`;
      if (isErkekOnly) return `PAUDI4007${szM}`;
      return `ERKEK: PAUDI4007${szM} - KADIN: PAUDI4009${szF}`;
    }
    // Teknisyen / Mekanik / Kaporta / PDI / Kalite Kontrol Pantolonu (Füme VW Modeli)
    if (isYaz) {
      const sz = getSizeSuffix(order, 'XS'); // 38
      return `PAUDI2221${sz}`;
    }
    const sz = getSizeSuffix(order, '38');
    return `PAUDI250016${sz}`;
  }

  // 9. Aksesuarlar / Diğer
  if (model.includes('YELEK')) {
    return 'PPORSCHE2000097L';
  }
  if (model.includes('KILIF') || model.includes('BARDAK') || model.includes('ÖNLÜK') || model.includes('ONLUK')) {
    return `PAUDI${id}`;
  }

  return null;
}

async function main() {
  console.log('================================================================');
  console.log('🚀 AUDI 2025 KIŞ & 2026 YAZ PARÇA NO VE VERİ NORMALİZASYONU');
  console.log('================================================================\n');

  // 1. FETCH ALL AUDI ORDERS
  console.log('--- 1. AUDI SİPARİŞLERİNİN ÇEKİLMESİ (MSSQL) ---');
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
    WHERE (s.Model LIKE '%AUDI%' OR s.ParcaNo LIKE '%AUDI%' OR s.Detay5 LIKE '%AUDI%' OR s.[Not] LIKE '%PAUDI%')
      AND s.Model NOT LIKE '%BMW%' 
      AND s.Model NOT LIKE '%MINI%' 
      AND s.Model NOT LIKE '%BORUSAN%'
    ORDER BY s.Id DESC
  `);

  console.log(`MSSQL'de toplam ${allOrders.length} adet Audi siparişi inceleniyor.`);

  const ordersToUpdate = [];
  for (const o of allOrders) {
    const targetParcaNo = resolveOfficialAudiParcaNo(o);
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

  console.log(`Resmi Excel kataloglarına eşleşen Audi sipariş sayısı: ${ordersToUpdate.length}`);

  const isDryRun = process.env.DRY_RUN === '1' || process.argv.includes('--dry-run');
  if (isDryRun) {
    console.log('\n🔍 DRY RUN MODU - ÖRNEK DEĞİŞİKLİKLER:');
    ordersToUpdate.slice(0, 25).forEach(o => {
      console.log(`[ID: ${o.id}] ${o.model}`);
      console.log(`   Eski: ${o.currentParcaNo} -> Yeni: ${o.targetParcaNo}`);
    });
    console.log(`\nToplam ${ordersToUpdate.length} sipariş güncellenecek.`);
    await pool.end();
    return;
  }

  // 2. UPDATE MSSQL Siparisler
  console.log('\n--- 2. MSSQL Siparisler GÜNCELLEMESİ ---');
  // Batch updates in chunks of 200 for safety
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
  console.log(`✅ MSSQL Siparisler: ${ordersToUpdate.length} adet Audi siparişi güncellendi.`);

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
            brand = 'AUDI',
            grup = 'AUDI',
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
          $1, $2, $3, $3, $4, $4, 'AUDI', 'AUDI',
          $5, 0, $5, 'BEKLEMEDE', $6, $7, $7,
          NOW(), NOW()
        )
      `, [orderNo, ord.model, ord.targetParcaNo, finalBarcode, ord.qty, ord.cleanDetay5, ord.musteri]);
    }
    pgCount++;
  }
  console.log(`✅ PostgreSQL orders: ${pgCount} adet Audi siparişi eşitlendi ve kaydedildi.`);

  await pool.end();
  console.log('\n🎉 TÜM TABLOLARDA AUDI PARÇA KODU GÜNCELLEMESİ BAŞARIYLA TAMAMLANDI!');
}

main().catch(console.error);
