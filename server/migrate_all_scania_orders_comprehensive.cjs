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
  const tmpFile = path.join(__dirname, `tmp_exec_scania_${Date.now()}.sql`);
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
  const tmpFile = path.join(__dirname, `tmp_q_scania_${Date.now()}.json`);
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

function getScaniaSizeSuffix(order, defaultSize = '01') {
  const bAdi = (order.BedenAdi || '').trim().toUpperCase();
  if (bAdi && !bAdi.includes('XXS-9XL') && !bAdi.includes('36-62') && !bAdi.includes('BEDENSİZ')) {
    const numMatch = bAdi.match(/\b(3[6-9]|[4-5]\d|6[0-2])\b/);
    if (numMatch) {
      const n = parseInt(numMatch[1], 10);
      if (n === 38) return '01';
      if (n === 40) return '02';
      if (n === 42) return '03';
      if (n === 44) return '04';
      if (n === 46) return '05';
      if (n === 48) return '06';
      if (n === 50) return '07';
      if (n === 52) return '08';
      if (n === 54) return '09';
      if (n >= 56) return '10';
    }
    const letterMatch = bAdi.match(/\b(XXS|XS|S|M|L|XL|XXL|2XL|3XL|XXXL|4XL|XXXXL|5XL|XXXXXL|6XL|XXXXXXL)\b/);
    if (letterMatch) {
      const l = letterMatch[1];
      if (l === 'XS' || l === 'XXS') return '01';
      if (l === 'S') return '02';
      if (l === 'M') return '03';
      if (l === 'L') return '04';
      if (l === 'XL') return '05';
      if (l === 'XXL' || l === '2XL') return '06';
      if (l === 'XXXL' || l === '3XL') return '07';
      if (l === 'XXXXL' || l === '4XL') return '08';
      if (l === 'XXXXXL' || l === '5XL') return '09';
      if (l === 'XXXXXXL' || l === '6XL') return '10';
    }
  }
  return defaultSize;
}

function resolveOfficialScaniaParcaNo(order) {
  const model = (order.Model || '').toUpperCase();
  const det5 = (order.Detay5 || '').toUpperCase();
  const currentParca = (order.ParcaNo || '').toUpperCase();
  const id = order.Id;

  // Must be SCANIA
  if (!model.includes('SCANIA') && !det5.includes('SCANIA') && !currentParca.includes('SCANIA') && !currentParca.includes('SCKY') && !det5.includes('SCKY')) {
    return null;
  }

  // Exclude third party or other brand projects
  if (model.includes('BMW') || model.includes('MINI') || model.includes('BORUSAN')) return null;
  if (model.includes('THERMO KING') || model.includes('TÜVTÜRK') || model.includes('TÜV TÜRK') || model.includes('MARİNTÜRK') || model.includes('K & C')) return null;
  if (model.includes('DOĞUŞ LOJİSTİK') || model.includes('DOĞUŞ MARİN') || model.includes('LOJİSTİK SCANIA MODELİ')) return null;

  const isYaz = model.includes('YAZ') || model.includes('YAZLIK') || model.includes('KISA KOL') || model.includes('TSHIRT') || model.includes('T-SHIRT') || model.includes('T SHIRT') || model.includes('POLO');
  const isKis = model.includes('KIŞ') || model.includes('KIS') || model.includes('MONT') || model.includes('SWEAT') || model.includes('YELEK') || model.includes('BERE');

  const isKadinOnly = (model.includes('KADIN') || model.includes('BAYAN')) && !model.includes('ERKEK') && !model.includes('BAY');
  const isErkekOnly = (model.includes('ERKEK') || model.includes('BAY')) && !model.includes('KADIN') && !model.includes('BAYAN');
  const isDualGender = (model.includes('ERKEK') && model.includes('KADIN')) || (model.includes('BAY') && model.includes('BAYAN')) || det5.includes('KADIN') || det5.includes('BAYAN');

  // 1. BERE
  if (model.includes('BERE')) {
    return 'SCKY20000';
  }

  // 2. FORMEN ÖNLÜĞÜ
  if (model.includes('ÖNLÜK') || model.includes('ONLUK') || model.includes('FORMEN ÖNLÜĞÜ') || model.includes('FORMEN ONLUGU')) {
    const sz = getScaniaSizeSuffix(order, '01');
    return `SCKY201${sz}`;
  }

  // 3. YELEK
  if (model.includes('YELEK')) {
    const sz = getScaniaSizeSuffix(order, '01');
    return `SCKY202${sz}`;
  }

  // 4. TULUM
  if (model.includes('TULUM')) {
    const sz = getScaniaSizeSuffix(order, '01');
    return `SCKY206${sz}`;
  }

  // 5. MONT
  if (model.includes('MONT') || model.includes('SOFTSHELL') || model.includes('SOFTJELL')) {
    const szM = getScaniaSizeSuffix(order, '01');
    const szF = getScaniaSizeSuffix(order, '01');
    if (isKadinOnly) return `SCKY209${szF}`;
    if (isErkekOnly) return `SCKY208${szM}`;
    return `ERKEK: SCKY208${szM} - KADIN: SCKY209${szF}`;
  }

  // 6. SWEATSHIRT
  if (model.includes('SWEAT') || model.includes('SWEATSHIRT') || model.includes('SWEAT SHIRT')) {
    const sz = getScaniaSizeSuffix(order, '01');
    // Master Teknisyen Bordo Sweatshirt
    if (model.includes('MASTER') || model.includes('BORDO')) {
      return `SCKY221${sz}`;
    }
    // Teknisyen Lacivert / Mavi Sweatshirt
    if (model.includes('TEKNİSYEN') || model.includes('TEKNISYEN') || model.includes('LACİVERT') || model.includes('LACIVERT') || model.includes('MAVİ') || model.includes('MAVI')) {
      return `SCKY204${sz}`;
    }
    // Danışman & YP Gri / Füme Sweatshirt
    if (model.includes('DANIŞMAN') || model.includes('DANISMAN') || model.includes('FÜME') || model.includes('FUME') || model.includes('GRİ') || model.includes('GRI') || model.includes('YEDEK PARÇA') || model.includes('YEDEK PARCA')) {
      return `SCKY203${sz}`;
    }
    // Default Scania Sweatshirt -> SCKY204
    return `SCKY204${sz}`;
  }

  // 7. T-SHIRT / POLO (Check before Gömlek to prevent "GÖMLEK YAKA POLO" from matching Gömlek)
  if (model.includes('TSHIRT') || model.includes('T-SHIRT') || model.includes('T SHIRT') || model.includes('POLO') || model.includes('0 YAKA') || model.includes('SIFIR YAKA') || model.includes('BİSİKLET')) {
    const szM = getScaniaSizeSuffix(order, '01');
    const szF = getScaniaSizeSuffix(order, '01');

    // Master Teknisyen Bordo
    if (model.includes('MASTER') || (model.includes('BORDO') && !model.includes('YEDEK'))) {
      if (model.includes('POLO')) return `SCKY213${szM}`;
      return `SCKY212${szM}`; // 0 Yaka Bordo
    }

    // Yedek Parça
    if (model.includes('YEDEK PARÇA') || model.includes('YEDEK PARCA') || model.includes('Y.P.')) {
      if (model.includes('POLO')) return `SCKY223${szM}`;
      return `SCKY224${szM}`; // 0 Yaka YP
    }

    // Danışman (Mavi)
    if (model.includes('DANIŞMAN') || model.includes('DANISMAN') || model.includes('S.D.')) {
      if (isKadinOnly) return `SCKY211${szF}`;
      if (isErkekOnly) return `SCKY210${szM}`;
      return `ERKEK: SCKY210${szM} - KADIN: SCKY211${szF}`;
    }

    // Teknisyen Polo Yaka
    if (model.includes('POLO')) {
      if (isKadinOnly) return `SCKY217${szF}`;
      if (isErkekOnly) return `SCKY216${szM}`;
      return `ERKEK: SCKY216${szM} - KADIN: SCKY217${szF}`;
    }

    // Teknisyen 0 Yaka / Basic
    if (isKadinOnly) return `SCKY215${szF}`;
    if (isErkekOnly) return `SCKY214${szM}`;
    return `ERKEK: SCKY214${szM} - KADIN: SCKY215${szF}`;
  }

  // 8. GÖMLEK
  if (model.includes('GÖMLEK') || model.includes('GOMLEK')) {
    const szM = getScaniaSizeSuffix(order, '01');
    const szF = getScaniaSizeSuffix(order, '01');
    // Kısa kol gömlek (Yaz)
    if (model.includes('KISA KOL') || isYaz) {
      if (isKadinOnly) return `SCKY219${szF}`;
      if (isErkekOnly) return `SCKY218${szM}`;
      return `ERKEK: SCKY218${szM} - KADIN: SCKY219${szF}`;
    }
    // Uzun kol gömlek (Kış / Standart)
    if (isKadinOnly) return `SCKY220${szF}`;
    if (isErkekOnly) return `SCKY207${szM}`;
    return `ERKEK: SCKY207${szM} - KADIN: SCKY220${szF}`;
  }

  // 9. PANTOLON
  if (model.includes('PANTOLON')) {
    const szM = getScaniaSizeSuffix(order, '01');
    const szF = getScaniaSizeSuffix(order, '01');
    // Danışman & Yedek Parça Pantolon Lacivert
    if (model.includes('DANIŞMAN') || model.includes('DANISMAN') || model.includes('YEDEK PARÇA') || model.includes('YEDEK PARCA') || (model.includes('LACİVERT') && (model.includes('BAY') || model.includes('ERKEK')) && !model.includes('TEKNİSYEN'))) {
      if (isKadinOnly) return `SCKY225${szF}`;
      if (isErkekOnly) return `SCKY222${szM}`;
      return `ERKEK: SCKY222${szM} - KADIN: SCKY225${szF}`;
    }
    // Teknisyen Pantolon (Füme - Lacivert / VW Modeli)
    return `SCKY205${szM}`;
  }

  // 10. Aksesuar / Şapka
  if (model.includes('ŞAPKA') || model.includes('SAPKA')) {
    return `PSCANIA${id}`;
  }

  return null;
}

async function main() {
  console.log('================================================================');
  console.log('🚀 SCANIA 2025 KIŞ & 2026 YAZ PARÇA NO VE VERİ NORMALİZASYONU');
  console.log('================================================================\n');

  // 1. FETCH ALL SCANIA ORDERS
  console.log('--- 1. SCANIA SİPARİŞLERİNİN ÇEKİLMESİ (MSSQL) ---');
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
    WHERE (s.Model LIKE '%SCANIA%' OR s.ParcaNo LIKE '%SCANIA%' OR s.Detay5 LIKE '%SCANIA%' OR s.ParcaNo LIKE '%SCKY%' OR s.Detay5 LIKE '%SCKY%')
    ORDER BY s.Id DESC
  `);

  console.log(`MSSQL'de toplam ${allOrders.length} adet Scania adayı sipariş inceleniyor.`);

  const ordersToUpdate = [];
  for (const o of allOrders) {
    const targetParcaNo = resolveOfficialScaniaParcaNo(o);
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

  console.log(`Resmi Excel kataloglarına eşleşen Scania sipariş sayısı: ${ordersToUpdate.length}`);

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
  console.log(`✅ MSSQL Siparisler: ${ordersToUpdate.length} adet Scania siparişi güncellendi.`);

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
            brand = 'SCANIA',
            grup = 'SCANIA',
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
          $1, $2, $3, $3, $4, $4, 'SCANIA', 'SCANIA',
          $5, 0, $5, 'BEKLEMEDE', $6, $7, $7,
          NOW(), NOW()
        )
      `, [orderNo, ord.model, ord.targetParcaNo, finalBarcode, ord.qty, ord.cleanDetay5, ord.musteri]);
    }
    pgCount++;
  }
  console.log(`✅ PostgreSQL orders: ${pgCount} adet Scania siparişi eşitlendi ve kaydedildi.`);

  await pool.end();
  console.log('\n🎉 TÜM TABLOLARDA SCANIA PARÇA KODU GÜNCELLEMESİ BAŞARIYLA TAMAMLANDI!');
}

main().catch(console.error);
