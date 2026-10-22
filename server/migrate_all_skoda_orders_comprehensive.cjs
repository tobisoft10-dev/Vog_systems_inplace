const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: '150609%M',
  host: 'localhost',
  port: 5432,
  database: 'vog_db'
});

function executeMssql(sqlQuery) {
  const tmpFile = path.join(__dirname, `tmp_exec_${Date.now()}.sql`);
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
  const tmpFile = path.join(__dirname, `tmp_q_${Date.now()}.json`);
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
    const numMatch = bAdi.match(/\b(3[6-9]|[4-5]\d|6[0-2])\b/);
    if (numMatch) {
      const n = parseInt(numMatch[1], 10);
      const numToText = {
        36: 'XXS', 38: 'XS', 40: 'S', 42: 'M', 44: 'L', 46: 'XL',
        48: 'XXL', 50: 'XXXL', 52: 'XXXXL', 54: 'XXXXXL', 56: 'XXXXXXL',
        58: 'XXXXXXXL', 60: 'XXXXXXXXL', 62: 'XXXXXXXXXL'
      };
      return numToText[n] || defaultSize;
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

// Function to resolve official Parca No for any Skoda order based on 2026 Yaz & 2025 Kış catalogs
function resolveOfficialParcaNo(order) {
  const model = (order.Model || '').toUpperCase();
  const notText = (order.Not || '').toUpperCase();
  const id = order.Id;

  // 1. Gömlek (Servis Danışman & MİS / Hasar Gömlek)
  if (model.includes('GÖMLEK') || model.includes('GOMLEK')) {
    const sz = getSizeSuffix(order, 'XS');
    if (model.includes('BAYAN') || model.includes('KADIN')) return `PSKD100026${sz}`;
    if (model.includes('BAY') || model.includes('ERKEK')) return `PSKD100025${sz}`;
    return `ERKEK: PSKD100025${sz} - KADIN: PSKD100026${sz}`;
  }

  // 2. Polar (Siyah Polar)
  if (model.includes('POLAR') && !model.includes('YELEK')) {
    const sz = getSizeSuffix(order, 'XS');
    if (model.includes('BAYAN') || model.includes('KADIN')) return `PSKD100042${sz}`;
    if (model.includes('BAY') || model.includes('ERKEK')) return `PSKD100041${sz}`;
    return `ERKEK: PSKD100041${sz} - KADIN: PSKD100042${sz}`;
  }

  // 3. Mont (Softshell Mont)
  if (model.includes('MONT') || model.includes('SOFT SHELL') || model.includes('SOFTSHELL')) {
    if (model.includes('LOJİSTİK') || model.includes('LOJISTIK')) {
      return `PSKODA${id}`;
    }
    if (model.includes('VALE')) {
      return 'PSKD200040';
    }
    const sz = getSizeSuffix(order, 'XS');
    if (model.includes('BAYAN') || model.includes('KADIN')) return `PSKD100051${sz}`;
    if (model.includes('BAY') || model.includes('ERKEK')) return `PSKD100050${sz}`;
    return `ERKEK: PSKD100050${sz} - KADIN: PSKD100051${sz}`;
  }

  // 4. Sweatshirt: Check role (Must be before T-shirt because SWEATSHIRT contains TSHIRT)
  if (model.includes('SWEAT') || model.includes('SWEATSHIRT')) {
    const sz = getSizeSuffix(order, 'XS');
    if (model.includes('YEDEK PARÇA') || model.includes('YEDEK PARCA')) {
      return `PSKD100054${sz}`;
    }
    if (model.includes('FORMEN')) {
      return `PSKD100055${sz}`;
    }
    if (model.includes('TEKNİSYEN') || model.includes('TEKNISYEN') || model.includes('YEŞİL')) {
      return `PSKD100056${sz}`;
    }
    return `PSKD100056${sz}`;
  }

  // 5. Polo T-shirt: Check role
  if ((model.includes('POLO') || model.includes('T-SHIRT') || model.includes('TSHIRT') || model.includes('POLOSHIRT')) && !model.includes('SWEAT')) {
    const sz = getSizeSuffix(order, 'XS');
    if (model.includes('İKRAM') || model.includes('IKRAM')) {
      if (model.includes('KADIN') || model.includes('BAYAN')) return `PSKD200039${sz}`;
      if (model.includes('ERKEK') || model.includes('BAY')) return `PSKD200038${sz}`;
      return `ERKEK: PSKD200038${sz} - KADIN: PSKD200039${sz}`;
    }
    if (model.includes('YEDEK PARÇA') || model.includes('YEDEK PARCA') || model.includes('FÜME MELANJ')) {
      return `PSKD200034${sz}`;
    }
    if (model.includes('FORMEN') || model.includes('GRİ')) {
      return `PSKD200035${sz}`;
    }
    if (model.includes('TEKNİSYEN') || model.includes('TEKNISYEN') || model.includes('KOYU YEŞİL')) {
      return `PSKD200036${sz}`;
    }
    if (model.includes('DANIŞMAN') || model.includes('DANISMAN') || model.includes('HASAR') || model.includes('GARANTİ') || model.includes('MİS') || model.includes('AÇIK YEŞİL')) {
      if (model.includes('BAYAN') || model.includes('KADIN')) return `PSKD200033${sz}`;
      if (model.includes('BAY') || model.includes('ERKEK')) return `PSKD200032${sz}`;
      return `ERKEK: PSKD200032${sz} - KADIN: PSKD200033${sz}`;
    }
    if (model.includes('OVERSIZE')) {
      return 'PSKODA16842';
    }
    if (model.includes('BAYAN') || model.includes('KADIN')) return `PSKD200033${sz}`;
    if (model.includes('BAY') || model.includes('ERKEK')) return `PSKD200032${sz}`;
    return `ERKEK: PSKD200032${sz} - KADIN: PSKD200033${sz}`;
  }

  // 6. Yelek: Check role
  if (model.includes('YELEK')) {
    const sz = getSizeSuffix(order, 'XS');
    if (model.includes('DANIŞMAN') || model.includes('DANISMAN') || model.includes('MEGANE')) {
      if (model.includes('BAYAN') || model.includes('KADIN')) return `PSKD100053${sz}`;
      if (model.includes('BAY') || model.includes('ERKEK')) return `PSKD100052${sz}`;
      return `ERKEK: PSKD100052${sz} - KADIN: PSKD100053${sz}`;
    }
    if (model.includes('YOL YARDIM')) {
      return `PSKD200037${sz}`;
    }
    if (model.includes('TEKNİSYEN') || model.includes('FORMEN') || model.includes('YEDEK PARÇA')) {
      return `PSKD100036${sz}`;
    }
    return `PSKD100036${sz}`;
  }

  // 7. Pantolon: Check role & season
  if (model.includes('PANTOLON')) {
    if (model.includes('TEKNİSYEN') || model.includes('VOLVO')) {
      if (model.includes('YAZ') || model.includes('YAZLIK')) {
        const sz = getSizeSuffix(order, 'XS');
        return `PSKD200019${sz}`;
      }
      const sz = getSizeSuffix(order, 'XXS');
      return `PSKD100028${sz}`;
    }
    if (model.includes('DANIŞMAN') || model.includes('DANISMAN') || model.includes('HASAR') || model.includes('GARANTİ') || model.includes('FORMEN') || model.includes('MİS')) {
      if (model.includes('KIŞ') || model.includes('KIS') || model.includes('KIŞLIK')) {
        const sz = getSizeSuffix(order, 'XXS');
        return `PSKD100019${sz}`;
      }
      const sz = getSizeSuffix(order, 'XS');
      return `PSKD200010${sz}`;
    }
    const sz = getSizeSuffix(order, 'XXS');
    return `PSKD100028${sz}`;
  }

  // 8. Önlük
  if (model.includes('ÖNLÜK') || model.includes('ONLUK')) {
    return 'PSKD200038STD';
  }

  // 9. Aksesuarlar (Kılıf, Şapka vs.)
  if (model.includes('KILIF') || model.includes('ŞAPKA') || model.includes('SAPKA')) {
    return `PSKODA${id}`;
  }

  return null;
}

async function main() {
  console.log('================================================================');
  console.log('🚀 TÜM TABLOLARDA SKODA PARÇA NO VE VERİ NORMALİZASYONU');
  console.log('================================================================\n');

  // 1. FIX MASTER PRODUCTS NAME FOR PSKD200032
  // 1. FIX MASTER PRODUCTS NAME AND VARIANTS
  console.log('--- 1. MASTER TABLOLAR: PSKD200032 & PSKD200037 & PSKD100050 DÜZELTMESİ ---');
  executeMssql(`
    UPDATE [SIPARIS].[dbo].[MasterUrunler]
    SET UrunAdi = 'Yeni Servis Dnş. MİS Garanti Hasar Polo Tshirt Bay',
        Marka = 'SKODA', Grup = 'SKODA'
    WHERE ParcaNo = 'PSKD200032';

    UPDATE [SIPARIS].[dbo].[MasterUrunler]
    SET UrunAdi = 'Yeni Servis Dnş. MİS Garanti Hasar Polo Tshirt Bayan',
        Marka = 'SKODA', Grup = 'SKODA'
    WHERE ParcaNo = 'PSKD200033';

    -- PSKD200037XS variant
    IF NOT EXISTS (SELECT 1 FROM [SIPARIS].[dbo].[MasterUrunler] WHERE ParcaNo = 'PSKD200037XS')
    BEGIN
      INSERT INTO [SIPARIS].[dbo].[MasterUrunler] (ParcaNo, Barkod, Ean13, UrunAdi, Beden, CleanBeden, Marka, Grup, Code39)
      VALUES ('PSKD200037XS', '8686058298943', '8686058298943', 'SKODA YOL YARDIM YELEK SİYAH', 'XS Beden', 'XS', 'SKODA', 'SKODA', 'PSKD200037XS');
    END

    -- PSKD100050XS & PSKD100051XS variants
    IF NOT EXISTS (SELECT 1 FROM [SIPARIS].[dbo].[MasterUrunler] WHERE ParcaNo = 'PSKD100050XS')
    BEGIN
      INSERT INTO [SIPARIS].[dbo].[MasterUrunler] (ParcaNo, Barkod, Ean13, UrunAdi, Beden, CleanBeden, Marka, Grup, Code39)
      VALUES ('PSKD100050XS', '8686623678599', '8686623678599', '2025 KIŞ SKODA YENİ SOFTSHELL MONT SKODA DANIŞMAN', 'XS Beden', 'XS', 'SKODA', 'SKODA', 'PSKD100050XS');
    END

    IF NOT EXISTS (SELECT 1 FROM [SIPARIS].[dbo].[MasterUrunler] WHERE ParcaNo = 'PSKD100051XS')
    BEGIN
      INSERT INTO [SIPARIS].[dbo].[MasterUrunler] (ParcaNo, Barkod, Ean13, UrunAdi, Beden, CleanBeden, Marka, Grup, Code39)
      VALUES ('PSKD100051XS', '8686623678599', '8686623678599', 'Yeni Siyah Softshell Mont Bayan', 'XS Beden', 'XS', 'SKODA', 'SKODA', 'PSKD100051XS');
    END
  `);

  await pool.query(`
    UPDATE master_products
    SET product_name = 'Yeni Servis Dnş. MİS Garanti Hasar Polo Tshirt Bay',
        brand = 'SKODA', grup = 'SKODA'
    WHERE sku = 'PSKD200032';

    UPDATE master_products
    SET product_name = 'Yeni Servis Dnş. MİS Garanti Hasar Polo Tshirt Bayan',
        brand = 'SKODA', grup = 'SKODA'
    WHERE sku = 'PSKD200033';

    -- Ensure PSKD200037 & variants exist in PG master_products
    INSERT INTO master_products (sku, product_name, size, clean_size, code39, barcode, ean13, brand, grup, gender, created_at, updated_at)
    VALUES 
      ('PSKD200037', 'SKODA YOL YARDIM YELEK SİYAH', 'Standart', 'STD', 'PSKD200037', '8686058298943', '8686058298943', 'SKODA', 'SKODA', 'UNISEX', NOW(), NOW()),
      ('PSKD200037XS', 'SKODA YOL YARDIM YELEK SİYAH', 'XS Beden', 'XS', 'PSKD200037XS', '8686058298943', '8686058298943', 'SKODA', 'SKODA', 'UNISEX', NOW(), NOW()),
      ('PSKD100050XS', '2025 KIŞ SKODA YENİ SOFTSHELL MONT SKODA DANIŞMAN', 'XS Beden', 'XS', 'PSKD100050XS', '8686623678599', '8686623678599', 'SKODA', 'SKODA', 'ERKEK', NOW(), NOW()),
      ('PSKD100051XS', 'Yeni Siyah Softshell Mont Bayan', 'XS Beden', 'XS', 'PSKD100051XS', '8686623678599', '8686623678599', 'SKODA', 'SKODA', 'KADIN', NOW(), NOW())
    ON CONFLICT (sku) DO UPDATE 
    SET product_name = EXCLUDED.product_name, clean_size = EXCLUDED.clean_size, size = EXCLUDED.size, brand = 'SKODA', grup = 'SKODA', barcode = EXCLUDED.barcode, ean13 = EXCLUDED.ean13, updated_at = NOW();
  `);
  console.log('✅ Master tablolar düzeltildi.');

  // 2. FETCH ALL SKODA ORDERS ACROSS ENTIRE DATABASE
  console.log('\n--- 2. SİPARİŞ ANALİZİ: Tüm Skoda Siparişleri ---');
  const allSkodaOrders = queryMssqlJson(`
    SELECT s.Id, s.Model, s.ParcaNo, s.Detay5, s.[Not], m.Adi as Musteri, b.Adi as BedenAdi,
    (
      SELECT SUM(ISNULL(B01,0)+ISNULL(B02,0)+ISNULL(B03,0)+ISNULL(B04,0)+ISNULL(B05,0)+ISNULL(B06,0)+ISNULL(B07,0)+ISNULL(B08,0)+ISNULL(B09,0)+ISNULL(B10,0)+ISNULL(B11,0)+ISNULL(B12,0)+ISNULL(B13,0)+ISNULL(B14,0))
      FROM [SIPARIS].[dbo].[SiparisIslemleri]
      WHERE SiparisId = s.Id
    ) AS ToplamAdet
    FROM Siparisler s
    LEFT JOIN Musteriler m ON s.MusteriId = m.Id
    LEFT JOIN Bedenler b ON s.BedenId = b.Id
    WHERE s.Model LIKE '%SKODA%' 
       OR s.ParcaNo LIKE '%SKD%' 
       OR s.ParcaNo LIKE '%SKODA%'
       OR s.Detay5 LIKE '%SKD%'
       OR s.Detay5 LIKE '%SKODA%'
       OR s.[Not] LIKE '%PSKD%'
       OR s.[Not] LIKE '%PSKODA%'
    ORDER BY s.Id DESC
  `);

  console.log(`MSSQL'de toplam ${allSkodaOrders.length} adet Skoda siparişi bulundu.`);

  // 3. UPDATE MSSQL Siparisler
  console.log('\n--- 3. MSSQL Siparisler GÜNCELLEMESİ ---');
  let mssqlUpdateSql = 'BEGIN TRANSACTION;\n';
  const ordersToUpdate = [];

  for (const o of allSkodaOrders) {
    const targetParcaNo = resolveOfficialParcaNo(o);
    if (!targetParcaNo) continue;

    const currentParcaNo = (o.ParcaNo || '').trim();
    // Also clean Detay5 if it contains dirty packaging notes
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

    const escParca = targetParcaNo.replace(/'/g, "''");
    const escDetay5 = cleanDetay5.replace(/'/g, "''");
    mssqlUpdateSql += `
      UPDATE [SIPARIS].[dbo].[Siparisler]
      SET ParcaNo = '${escParca}', Detay5 = '${escDetay5}'
      WHERE Id = ${o.Id};
    \n`;
  }

  mssqlUpdateSql += 'COMMIT TRANSACTION;\n';
  executeMssql(mssqlUpdateSql);
  console.log(`✅ MSSQL Siparisler: ${ordersToUpdate.length} adet sipariş resmi parça kodlarıyla güncellendi.`);

  // 4. SYNCHRONIZE TO POSTGRESQL orders TABLE
  console.log('\n--- 4. POSTGRESQL orders TABLOSUNUN SENKRONİZASYONU ---');
  let pgCount = 0;
  for (const ord of ordersToUpdate) {
    const orderNo = String(ord.id);
    const sampleBc = ord.targetParcaNo.startsWith('ERKEK:') 
      ? ord.targetParcaNo.split(' - ')[0].replace('ERKEK: ', '').trim() 
      : ord.targetParcaNo;

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
      `, [ord.model, ord.targetParcaNo, finalBarcode, ord.cleanDetay5, ord.qty, ord.musteri, orderNo]);
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
      `, [orderNo, ord.model, ord.targetParcaNo, finalBarcode, ord.qty, ord.cleanDetay5, ord.musteri]);
    }
    pgCount++;
  }
  console.log(`✅ PostgreSQL orders: ${pgCount} adet Skoda siparişi eşitlendi ve kaydedildi.`);

  await pool.end();
  console.log('\n🎉 TÜM TABLOLARDA SKODA PARÇA KODU GÜNCELLEMESİ BAŞARIYLA TAMAMLANDI!');
}

main().catch(console.error);
