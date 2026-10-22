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
  const tmpFile = path.join(__dirname, `tmp_exec_cupra_${Date.now()}.sql`);
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
  const tmpFile = path.join(__dirname, `tmp_q_cupra_${Date.now()}.json`);
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

function getCupraLetterSize(order, defaultSize = 'XS') {
  const bAdi = (order.BedenAdi || '').trim().toUpperCase();
  if (bAdi && !bAdi.includes('XXS-9XL') && !bAdi.includes('36-62') && !bAdi.includes('BEDENSİZ')) {
    const numMatch = bAdi.match(/\b(3[6-9]|[4-5]\d|6[0-2])\b/);
    if (numMatch) {
      const n = parseInt(numMatch[1], 10);
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
      if (n >= 56) return 'XXXXXXL';
    }
    const letterMatch = bAdi.match(/\b(XXS|XS|S|M|L|XL|XXL|2XL|3XL|XXXL|4XL|XXXXL|5XL|XXXXXL|6XL|XXXXXXL)\b/);
    if (letterMatch) {
      let l = letterMatch[1];
      if (l === '2XL') l = 'XXL';
      if (l === '3XL') l = 'XXXL';
      if (l === '4XL') l = 'XXXXL';
      if (l === '5XL') l = 'XXXXXL';
      if (l === '6XL') l = 'XXXXXXL';
      return l;
    }
  }
  return defaultSize;
}

function getCupraNumericSize(order, defaultSize = '42') {
  const bAdi = (order.BedenAdi || '').trim().toUpperCase();
  if (bAdi && !bAdi.includes('XXS-9XL') && !bAdi.includes('36-62') && !bAdi.includes('BEDENSİZ')) {
    const numMatch = bAdi.match(/\b(3[6-9]|[4-5]\d|6[0-2])\b/);
    if (numMatch) return numMatch[1];
    const letterMatch = bAdi.match(/\b(XXS|XS|S|M|L|XL|XXL|2XL|3XL|XXXL|4XL|XXXXL|5XL|XXXXXL|6XL|XXXXXXL)\b/);
    if (letterMatch) {
      const l = letterMatch[1];
      if (l === 'XXS') return '36';
      if (l === 'XS') return '38';
      if (l === 'S') return '40';
      if (l === 'M') return '42';
      if (l === 'L') return '44';
      if (l === 'XL') return '46';
      if (l === 'XXL' || l === '2XL') return '48';
      if (l === 'XXXL' || l === '3XL') return '50';
      if (l === 'XXXXL' || l === '4XL') return '52';
      if (l === 'XXXXXL' || l === '5XL') return '54';
      if (l === 'XXXXXXL' || l === '6XL') return '56';
    }
  }
  return defaultSize;
}

function resolveOfficialCupraParcaNo(order) {
  const model = (order.Model || '').toUpperCase();
  const det5 = (order.Detay5 || '').toUpperCase();
  const currentParca = (order.ParcaNo || '').toUpperCase();
  const id = order.Id;

  // Must be CUPRA
  if (!model.includes('CUPRA') && !det5.includes('CUPRA') && !currentParca.includes('CUPRA') && !currentParca.includes('PCUPRA')) {
    return null;
  }

  // Exclude third party or other brand projects
  if (model.includes('BMW') || model.includes('MINI') || model.includes('BORUSAN')) return null;

  const isExpert = model.includes('EXPERT');
  const isYaz = model.includes('YAZ') || model.includes('YAZLIK') || model.includes('KISA KOL') || model.includes('TSHIRT') || model.includes('T-SHIRT') || model.includes('T SHIRT');
  const isKis = model.includes('KIŞ') || model.includes('KIS') || model.includes('MONT') || model.includes('SWEAT') || model.includes('YELEK') || model.includes('POLAR') || model.includes('GÖMLEK') || model.includes('SOFTSHELL') || model.includes('SOFTJELL');

  const hasBayan = model.includes('BAYAN') || model.includes('KADIN') || det5.includes('BAYAN') || det5.includes('KADIN');
  const hasBay = model.replace(/BAYAN/g, '').includes('BAY') || model.includes('ERKEK') || det5.replace(/BAYAN/g, '').includes('BAY') || det5.includes('ERKEK');
  const isKadinOnly = hasBayan && !hasBay;
  const isErkekOnly = hasBay && !hasBayan;
  const isDualGender = hasBay && hasBayan;

  // -------------------------------------------------------------
  // 1. CUPRA EXPERT PRODUCTS
  // -------------------------------------------------------------
  if (isExpert) {
    // 1.1 Expert Mont (Siyah - Gri)
    if (model.includes('MONT') || model.includes('SOFTSHELL') || model.includes('SOFTJELL')) {
      const szM = getCupraLetterSize(order, 'S');
      const szF = getCupraLetterSize(order, 'S');
      if (isKadinOnly) return `PCUPRA100046${szF}`;
      if (isErkekOnly) return `PCUPRA100035${szM}`;
      return `ERKEK: PCUPRA100035${szM} - KADIN: PCUPRA100046${szF}`;
    }

    // 1.2 Expert Gömlek (Beyaz Kol Katlamalı)
    if (model.includes('GÖMLEK') || model.includes('GOMLEK')) {
      const szM = getCupraLetterSize(order, 'S');
      const szF = getCupraLetterSize(order, 'S');
      if (isKadinOnly) return `PCUPRA100030${szF}`;
      if (isErkekOnly) return `PCUPRA100029${szM}`;
      return `ERKEK: PCUPRA100029${szM} - KADIN: PCUPRA100030${szF}`;
    }

    // 1.3 Expert Master Teknisyen / Formen Sweatshirt (Petrol 0 Yaka)
    if ((model.includes('TEKNİSYEN') || model.includes('MASTER') || model.includes('FORMEN')) && (model.includes('SWEAT') || model.includes('0 YAKA') || model.includes('SIFIR YAKA'))) {
      if (!isYaz || model.includes('KIŞ') || model.includes('SWEAT')) {
        const sz = getCupraLetterSize(order, 'S');
        return `PCUPRA100034${sz}`;
      }
    }

    // 1.4 Expert Master Teknisyen / Formen Bisiklet Yaka Tişört (Yaz)
    if ((model.includes('TEKNİSYEN') || model.includes('MASTER') || model.includes('FORMEN')) && (model.includes('TSHIRT') || model.includes('T-SHIRT') || model.includes('BİSİKLET') || model.includes('0 YAKA'))) {
      const sz = getCupraLetterSize(order, 'S');
      return `PCUPRA200042${sz}`;
    }

    // 1.5 Expert Master Teknisyen / Formen Pantolon
    if ((model.includes('TEKNİSYEN') || model.includes('MASTER') || model.includes('FORMEN')) && model.includes('PANTOLON')) {
      const sz = getCupraNumericSize(order, '42');
      if (isYaz || det5.includes('PCUPRA200043')) {
        return `PCUPRA200043${sz}`;
      }
      return `PCUPRA100033${sz}`;
    }

    // 1.6 Expert Danışman Polo Yaka Sweatshirt (Gri veya Petrol/Mavi) - Kış
    if (model.includes('SWEAT') || (model.includes('POLO') && (model.includes('KIŞ') || model.includes('UZUN KOLLU')))) {
      const szM = getCupraLetterSize(order, 'S');
      const szF = getCupraLetterSize(order, 'S');
      if (model.includes('PETROL') || model.includes('MAVİ') || model.includes('MAVI')) {
        if (isKadinOnly) return `PCUPRA100045${szF}`;
        if (isErkekOnly) return `PCUPRA100044${szM}`;
        return `ERKEK: PCUPRA100044${szM} - KADIN: PCUPRA100045${szF}`;
      }
      // Gri Polo Yaka Sweatshirt
      if (isKadinOnly) return `PCUPRA100032${szF}`;
      if (isErkekOnly) return `PCUPRA100031${szM}`;
      return `ERKEK: PCUPRA100031${szM} - KADIN: PCUPRA100032${szF}`;
    }

    // 1.7 Expert Danışman Polo Yaka Tişört (Gri veya Petrol/Mavi) - Yaz
    if (model.includes('TSHIRT') || model.includes('T-SHIRT') || model.includes('POLO')) {
      const szM = getCupraLetterSize(order, 'XS');
      const szF = getCupraLetterSize(order, 'S');
      if (model.includes('PETROL') || model.includes('MAVİ') || model.includes('MAVI')) {
        if (isKadinOnly) return `PCUPRA200041${szF}`;
        if (isErkekOnly) return `PCUPRA200040${szM}`;
        return `ERKEK: PCUPRA200040${szM} - KADIN: PCUPRA200041${szF}`;
      }
      // Gri Polo Yaka Tişört
      if (isKadinOnly) return `PCUPRA200039${szF}`;
      if (isErkekOnly) return `PCUPRA200038${szM}`;
      return `ERKEK: PCUPRA200038${szM} - KADIN: PCUPRA200039${szF}`;
    }

    // 1.8 Expert Danışman Pantolon
    if (model.includes('PANTOLON')) {
      const szM = getCupraNumericSize(order, '42');
      const szF = getCupraNumericSize(order, '38');
      if (isYaz || det5.includes('PCUPRA200036') || det5.includes('PCUPRA200037')) {
        if (isKadinOnly) return `PCUPRA200037${szF}`;
        if (isErkekOnly) return `PCUPRA200036${szM}`;
        return `ERKEK: PCUPRA200036${szM} - KADIN: PCUPRA200037${szF}`;
      }
      // Kışlık Expert Danışman Pantolon
      if (isKadinOnly) return `PCUPRA100028${szF}`;
      if (isErkekOnly) return `PCUPRA100027${szM}`;
      return `ERKEK: PCUPRA100027${szM} - KADIN: PCUPRA100028${szF}`;
    }
  }

  // -------------------------------------------------------------
  // 2. STANDART CUPRA PRODUCTS (Danışman, Teknisyen, Formen, vb.)
  // -------------------------------------------------------------

  // 2.1 Yelek
  if (model.includes('YELEK')) {
    const sz = getCupraLetterSize(order, 'S');
    return `PCUPRA100019${sz}`;
  }

  // 2.2 Polar
  if (model.includes('POLAR')) {
    // Danışman / Garanti Polar
    if (model.includes('DANIŞMAN') || model.includes('DANISMAN') || model.includes('GARANTİ') || model.includes('GARANTI') || model.includes('S.DAN')) {
      const szM = getCupraLetterSize(order, 'S');
      const szF = getCupraLetterSize(order, 'XS');
      if (isKadinOnly) return `PCUPRA100015${szF}`;
      if (isErkekOnly) return `PCUPRA100014${szM}`;
      return `ERKEK: PCUPRA100014${szM} - KADIN: PCUPRA100015${szF}`;
    }
    // Teknisyen / Formen / Kaporta / Master Polar
    const sz = getCupraLetterSize(order, 'S');
    return `PCUPRA100020${sz}`;
  }

  // 2.3 Mont / Softshell
  if (model.includes('MONT') || model.includes('SOFTSHELL') || model.includes('SOFTJELL')) {
    if (model.includes('ACİL') || model.includes('ACIL')) {
      const sz = getCupraLetterSize(order, 'XS');
      return `PCUPRA100026${sz}`;
    }
    // Danışman Softshell Mont
    const szM = getCupraLetterSize(order, 'S');
    const szF = getCupraLetterSize(order, 'XS');
    if (isKadinOnly) return `PCUPRA100013${szF}`;
    if (isErkekOnly) return `PCUPRA100011${szM}`;
    return `ERKEK: PCUPRA100011${szM} - KADIN: PCUPRA100013${szF}`;
  }

  // 2.4 Gömlek
  if (model.includes('GÖMLEK') || model.includes('GOMLEK')) {
    const szM = getCupraLetterSize(order, 'S');
    const szF = getCupraLetterSize(order, 'XS');
    if (isKadinOnly) return `PCUPRA100010${szF}`;
    if (isErkekOnly) return `PCUPRA100009${szM}`;
    return `ERKEK: PCUPRA100009${szM} - KADIN: PCUPRA100010${szF}`;
  }

  // 2.5 Sweatshirt (Kış)
  if (model.includes('SWEAT') || model.includes('SWEATSHIRT') || model.includes('SWEAT SHIRT')) {
    // Master Teknisyen
    if (model.includes('MASTER')) {
      const sz = getCupraLetterSize(order, 'S');
      return `PCUPRA100023${sz}`;
    }
    // Garanti / Dispozisyon
    if (model.includes('GARANTİ') || model.includes('GARANTI') || model.includes('DİS') || model.includes('DIS')) {
      const szM = getCupraLetterSize(order, 'S');
      const szF = getCupraLetterSize(order, 'XS');
      if (isKadinOnly) return `PCUPRA100017${szF}`;
      if (isErkekOnly) return `PCUPRA100016${szM}`;
      return `ERKEK: PCUPRA100016${szM} - KADIN: PCUPRA100017${szF}`;
    }
    // Formen / Yedek Parça Polo Yaka Sweatshirt
    if (model.includes('FORMEN') || model.includes('YEDEK PARÇA') || model.includes('YEDEK PARCA')) {
      const sz = getCupraLetterSize(order, 'S');
      return `PCUPRA100021${sz}`;
    }
    // Kaporta Teknisyen 0 Yaka Sweatshirt
    if (model.includes('KAPORTA') || model.includes('BİSİKLET') || (/\b[0O]\s*YAKA\b/i.test(model) && !model.includes('POLO'))) {
      const sz = getCupraLetterSize(order, 'XS');
      return `PCUPRA100022${sz}`;
    }
    // Mekanik Teknisyen Polo Yaka Sweatshirt
    const sz = getCupraLetterSize(order, 'XS');
    return `PCUPRA100024${sz}`;
  }

  // 2.6 T-Shirt / Polo (Yaz)
  if (model.includes('TSHIRT') || model.includes('T-SHIRT') || model.includes('POLO') || model.includes('T SHIRT') || isYaz) {
    if (model.includes('PANTOLON')) {
      // Handled in Pantolon section below
    } else {
      // Formen Polo
      if (model.includes('FORMEN')) {
        const sz = getCupraLetterSize(order, 'XS');
        return `PCUPRA200012${sz}`;
      }
      // Master Teknisyen Polo
      if (model.includes('MASTER')) {
        const sz = getCupraLetterSize(order, 'XS');
        return `PCUPRA200013${sz}`;
      }
      // Kaporta Teknisyen Tişört (0 Yaka)
      if (model.includes('KAPORTA') || (/\b[0O]\s*YAKA\b/i.test(model) && !model.includes('POLO'))) {
        const sz = getCupraLetterSize(order, 'XS');
        return `PCUPRA200011${sz}`;
      }
      // Mekanik Teknisyen / Garanti Disp. Polo
      if (model.includes('MEKANİK') || model.includes('MEKANIK') || model.includes('GARANTİ') || model.includes('GARANTI') || model.includes('TEKNİSYEN') || model.includes('TEKNISYEN')) {
        const sz = getCupraLetterSize(order, 'XS');
        return `PCUPRA200010${sz}`;
      }
      // Servis Danışmanı Gri Polo
      if (model.includes('GRİ') || model.includes('GRI')) {
        const szM = getCupraLetterSize(order, 'XS');
        const szF = getCupraLetterSize(order, 'XS');
        if (isKadinOnly) return `PCUPRA200007${szF}`;
        if (isErkekOnly) return `PCUPRA200004${szM}`;
        return `ERKEK: PCUPRA200004${szM} - KADIN: PCUPRA200007${szF}`;
      }
      // Servis Danışmanı Beyaz / Mavi Polo
      const szM = getCupraLetterSize(order, 'XS');
      const szF = getCupraLetterSize(order, 'XS');
      if (isKadinOnly) return `PCUPRA200005${szF}`;
      if (isErkekOnly) return `PCUPRA200002${szM}`;
      return `ERKEK: PCUPRA200002${szM} - KADIN: PCUPRA200005${szF}`;
    }
  }

  // 2.7 Pantolon
  if (model.includes('PANTOLON')) {
    // Danışman Pantolon
    if (model.includes('DANIŞMAN') || model.includes('DANISMAN') || model.includes('S.DAN')) {
      if (isYaz || det5.includes('PCUPRA200003') || det5.includes('PCUPRA200006')) {
        const szM = getCupraLetterSize(order, 'XS');
        const szF = getCupraLetterSize(order, 'XS');
        if (isKadinOnly) return `PCUPRA200006${szF}`;
        if (isErkekOnly) return `PCUPRA200003${szM}`;
        return `ERKEK: PCUPRA200003${szM} - KADIN: PCUPRA200006${szF}`;
      }
      // Kışlık Danışman Pantolon (Numerik)
      const szM = getCupraNumericSize(order, '40');
      const szF = getCupraNumericSize(order, '36');
      if (isKadinOnly) return `PCUPRA100008${szF}`;
      if (isErkekOnly) return `PCUPRA100007${szM}`;
      return `ERKEK: PCUPRA100007${szM} - KADIN: PCUPRA100008${szF}`;
    }

    // Teknisyen / Formen / Kaporta Pantolon
    if (isYaz || currentParca.includes('PCUPRA200009') || det5.includes('PCUPRA200009')) {
      const sz = getCupraLetterSize(order, 'XS');
      return `PCUPRA200009${sz}`;
    }
    // Kışlık Teknisyen Pantolon (Numerik)
    const sz = getCupraNumericSize(order, '38');
    return `PCUPRA100018${sz}`;
  }

  // 2.8 Fallback
  if (model.includes('KILIF') || model.includes('ATKI') || model.includes('KOLTUK')) {
    return `PCUPRA${id}`;
  }

  return null;
}

async function main() {
  console.log('🚀 CUPRA SİPARİŞLERİ KAPSAMLI PARÇA KODU NORMALİZASYONU BAŞLATILIYOR...');

  // 1. GET ALL MSSQL CUPRA ORDERS
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
    WHERE (s.Model LIKE '%CUPRA%' OR s.ParcaNo LIKE '%CUPRA%' OR s.Detay5 LIKE '%CUPRA%' OR s.[Not] LIKE '%PCUPRA%')
    ORDER BY s.Id DESC
  `);

  console.log(`MSSQL'de toplam ${allOrders.length} adet Cupra adayı sipariş inceleniyor.`);

  const ordersToUpdate = [];
  for (const o of allOrders) {
    const targetParcaNo = resolveOfficialCupraParcaNo(o);
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

  console.log(`Resmi Excel kataloglarına eşleşen Cupra sipariş sayısı: ${ordersToUpdate.length}`);

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
  console.log(`✅ MSSQL Siparisler: ${ordersToUpdate.length} adet Cupra siparişi güncellendi.`);

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
            brand = 'CUPRA',
            grup = 'CUPRA',
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
          $1, $2, $3, $3, $4, $4, 'CUPRA', 'CUPRA',
          $5, 0, $5, 'BEKLEMEDE', $6, $7, $7,
          NOW(), NOW()
        )
      `, [orderNo, ord.model, ord.targetParcaNo, finalBarcode, ord.qty, ord.cleanDetay5, ord.musteri]);
    }
    pgCount++;
  }
  console.log(`✅ PostgreSQL orders: ${pgCount} adet Cupra siparişi eşitlendi ve kaydedildi.`);

  await pool.end();
  console.log('\n🎉 TÜM TABLOLARDA CUPRA PARÇA KODU GÜNCELLEMESİ BAŞARIYLA TAMAMLANDI!');
}

main().catch(console.error);
