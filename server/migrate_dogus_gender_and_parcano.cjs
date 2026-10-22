const { Pool } = require('c:/vog_system/server/node_modules/pg');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '150609%M',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'vog_db'
});

function executeMssql(queryText) {
    const tmpFile = path.join(__dirname, `tmp_mig_${Date.now()}.sql`);
    fs.writeFileSync(tmpFile, queryText, 'utf8');
    const cmd = `sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -d SIPARIS -f 65001 -i "${tmpFile}"`;
    execSync(cmd, { stdio: 'inherit' });
    try { fs.unlinkSync(tmpFile); } catch (e) {}
}

const SPECIFIC_ORDERS = [
    // Screenshot Range
    { id: 16952, parca: 'PAUDI250025', detay5: 'ERKEK: PAUDI250025' },
    { id: 16951, parca: 'ERKEK: PAUDI0023 - KADIN: PAUDI0026', detay5: 'ERKEK: PAUDI0023 - KADIN: PAUDI0026' },
    { id: 16942, parca: 'PVOG16942', detay5: 'PVOG16942' },
    { id: 16941, parca: 'PVOG16941', detay5: 'PVOG16941' },
    { id: 16940, parca: '15637', detay5: '15637' },
    { id: 16939, parca: 'PSKODA16939', detay5: 'PSKODA16939' },
    { id: 16938, parca: '15638', detay5: '15638' },
    { id: 16937, parca: 'PSCANIA15801', detay5: 'PSCANIA15801' },
    { id: 16936, parca: 'PVOG16936', detay5: 'PVOG16936' },
    { id: 16935, parca: 'PVOG16935', detay5: 'PVOG16935' },
    { id: 16933, parca: 'PVOG16933', detay5: 'PVOG16933' },
    { id: 16932, parca: 'PVOG16932', detay5: 'PVOG16932' },
    { id: 16931, parca: 'PAUDI16931', detay5: 'PAUDI16931' },
    { id: 16930, parca: 'PAUDI16930', detay5: 'PAUDI16930' },
    { id: 16929, parca: 'PAUDI16929', detay5: 'PAUDI16929' },
    { id: 16928, parca: 'ERKEK: PAUDI3535 - KADIN: PAUDI3939', detay5: 'ERKEK: PAUDI3535 - KADIN: PAUDI3939' },
    { id: 16921, parca: 'PSKODA16842', detay5: 'PSKODA16842' },
    { id: 16896, parca: 'PAUDI9989', detay5: 'PAUDI9989' },
    { id: 16895, parca: 'PAUDI250032', detay5: 'ERKEK: PAUDI250032' },
    { id: 16894, parca: 'PAUDI9988', detay5: 'ERKEK: PAUDI9988' },
    { id: 16893, parca: 'PAUDI16893', detay5: 'PAUDI16893' },
    { id: 16892, parca: 'PAUDI9988', detay5: 'ERKEK: PAUDI9988' },
    { id: 16891, parca: 'PAUDI8282', detay5: 'PAUDI8282' },
    { id: 16890, parca: 'PAUDI250021', detay5: 'ERKEK: PAUDI250021' },
    { id: 16889, parca: 'PAUDI16889', detay5: 'PAUDI16889' },
    { id: 16888, parca: 'PAUDI250020', detay5: 'PAUDI250020' },
    { id: 16887, parca: 'ERKEK: PAUDI3538 - KADIN: PAUDI3539', detay5: 'ERKEK: PAUDI3538 - KADIN: PAUDI3539' },
    { id: 16886, parca: 'ERKEK: PAUDI3003 - KADIN: PAUDI3005', detay5: 'ERKEK: PAUDI3003 - KADIN: PAUDI3005' },
    { id: 16871, parca: 'PAUDI6464', detay5: 'ERKEK: PAUDI6464' },
    { id: 16870, parca: 'PAUDI250017', detay5: 'ERKEK: PAUDI250017' },
    { id: 16869, parca: 'PAUDI250016', detay5: 'PAUDI250016' },
    { id: 16868, parca: 'PAUDI9988', detay5: 'ERKEK: PAUDI9988' },
    { id: 16867, parca: 'PAUDI9999', detay5: 'ERKEK: PAUDI9999' },
    { id: 16866, parca: 'PVWT260007', detay5: 'ERKEK: PVWT260007' },
    { id: 16864, parca: 'PAUDI5252', detay5: 'ERKEK: PAUDI5252' },
    { id: 16863, parca: 'ERKEK: PAUDI4242 - KADIN: PAUDI4444', detay5: 'ERKEK: PAUDI4242 - KADIN: PAUDI4444' },
    { id: 16861, parca: 'PAUDI250008', detay5: 'ERKEK: PAUDI250008' },
    { id: 16860, parca: 'PAUDI3576', detay5: 'PAUDI3576' },

    // Cupra Dual & Single
    { id: 16719, parca: 'ERKEK: PCUPRA100014 - KADIN: PCUPRA100015', detay5: 'ERKEK: PCUPRA100014 - KADIN: PCUPRA100015' },
    { id: 16718, parca: 'ERKEK: PCUPRA100007 - KADIN: PCUPRA100008', detay5: 'ERKEK: PCUPRA100007 - KADIN: PCUPRA100008' },
    { id: 16717, parca: 'ERKEK: PCUPRA100009 - KADIN: PCUPRA100010', detay5: 'ERKEK: PCUPRA100009 - KADIN: PCUPRA100010' },
    { id: 16716, parca: 'ERKEK: PCUPRA100011 - KADIN: PCUPRA100013', detay5: 'ERKEK: PCUPRA100011 - KADIN: PCUPRA100013' },
    { id: 16715, parca: 'ERKEK: PCUPRA100014 - KADIN: PCUPRA100015', detay5: 'ERKEK: PCUPRA100014 - KADIN: PCUPRA100015' },
    { id: 16714, parca: 'ERKEK: PCUPRA100007 - KADIN: PCUPRA100008', detay5: 'ERKEK: PCUPRA100007 - KADIN: PCUPRA100008' },
    { id: 16713, parca: 'ERKEK: PCUPRA100009 - KADIN: PCUPRA100010', detay5: 'ERKEK: PCUPRA100009 - KADIN: PCUPRA100010' },

    // Skoda Dual & Single
    { id: 16695, parca: 'ERKEK: PSKD100052 - KADIN: PSKD100053', detay5: 'ERKEK: PSKD100052 - KADIN: PSKD100053' },
    { id: 16694, parca: 'ERKEK: PSKD100050 - KADIN: PSKD100051', detay5: 'ERKEK: PSKD100050 - KADIN: PSKD100051' },
    { id: 16693, parca: 'ERKEK: PSKD100025 - KADIN: PSKD100026', detay5: 'ERKEK: PSKD100025 - KADIN: PSKD100026' },
    { id: 16692, parca: 'PSKD100019', detay5: 'ERKEK: PSKD100019' },
    { id: 16690, parca: 'ERKEK: PSKD100041 - KADIN: PSKD100042', detay5: 'ERKEK: PSKD100041 - KADIN: PSKD100042' },
    { id: 16689, parca: 'PSKD100056', detay5: 'ERKEK: PSKD100056' },
    { id: 16688, parca: 'PSKD100055', detay5: 'ERKEK: PSKD100055' },
    { id: 16687, parca: 'PSKD100054', detay5: 'ERKEK: PSKD100054' },

    // VW Kış Dual & Single
    { id: 16685, parca: 'PVWK100001', detay5: 'ERKEK: PVWK100001' },
    { id: 16684, parca: 'PVWK100025', detay5: 'ERKEK: PVWK100025' },
    { id: 16683, parca: 'ERKEK: PVWK100106 - KADIN: PVWK100107', detay5: 'ERKEK: PVWK100106 - KADIN: PVWK100107' },
    { id: 16682, parca: 'ERKEK: PVWK100102 - KADIN: PVWK100103', detay5: 'ERKEK: PVWK100102 - KADIN: PVWK100103' },
    { id: 16681, parca: 'ERKEK: PVWK100110 - KADIN: PVWK100111', detay5: 'ERKEK: PVWK100110 - KADIN: PVWK100111' },
    { id: 16680, parca: 'ERKEK: PVWK100079 - KADIN: PVWK100084', detay5: 'ERKEK: PVWK100079 - KADIN: PVWK100084' },
    { id: 16679, parca: 'ERKEK: PVWK100108 - KADIN: PVWK100109', detay5: 'ERKEK: PVWK100108 - KADIN: PVWK100109' },
    { id: 16678, parca: 'ERKEK: PVWK100104 - KADIN: PVWK100105', detay5: 'ERKEK: PVWK100104 - KADIN: PVWK100105' },
    { id: 16677, parca: 'PVWT260004', detay5: 'KADIN: PVWT260004' },
    { id: 16676, parca: 'PVWK100074', detay5: 'ERKEK: PVWK100074' },
    { id: 16674, parca: 'ERKEK: PVWT260006 - KADIN: PVWT260005', detay5: 'ERKEK: PVWT260006 - KADIN: PVWT260005' },
    { id: 16673, parca: 'ERKEK: PVWK100009 - KADIN: PVWK100010', detay5: 'ERKEK: PVWK100009 - KADIN: PVWK100010' },
    { id: 16672, parca: 'PVWT260008', detay5: 'ERKEK: PVWT260008' },
    { id: 16671, parca: 'ERKEK: PVWK200080 - KADIN: PVWK200081', detay5: 'ERKEK: PVWK200080 - KADIN: PVWK200081' },
    { id: 16670, parca: 'PVWT260003', detay5: 'ERKEK: PVWT260003' },
    { id: 16668, parca: 'PVWB260017', detay5: 'ERKEK: PVWB260017' },
    { id: 16666, parca: 'ERKEK: PVWK100086 - KADIN: PVWK100087', detay5: 'ERKEK: PVWK100086 - KADIN: PVWK100087' },
    { id: 16665, parca: 'PVWK100088', detay5: 'ERKEK: PVWK100088' },
    { id: 16664, parca: 'ERKEK: PVWK100037 - KADIN: PVWK100027', detay5: 'ERKEK: PVWK100037 - KADIN: PVWK100027' },
    { id: 16663, parca: 'ERKEK: PVWK100004 - KADIN: PVWK100026', detay5: 'ERKEK: PVWK100004 - KADIN: PVWK100026' },
    { id: 16662, parca: 'ERKEK: PVWK100058 - KADIN: PVWK100097', detay5: 'ERKEK: PVWK100058 - KADIN: PVWK100097' },
    { id: 16661, parca: 'ERKEK: PVWK100013 - KADIN: PVWK100028', detay5: 'ERKEK: PVWK100013 - KADIN: PVWK100028' },

    // VW Yaz Dual & Single
    { id: 16574, parca: 'ERKEK: PVWK200088 - KADIN: PVWK200089', detay5: 'ERKEK: PVWK200088 - KADIN: PVWK200089' },
    { id: 16573, parca: 'PVWK200076', detay5: 'ERKEK: PVWK200076' },
    { id: 16571, parca: 'ERKEK: PVWK200074 - KADIN: PVWK200073', detay5: 'ERKEK: PVWK200074 - KADIN: PVWK200073' },
    { id: 16570, parca: 'ERKEK: PVWK200070 - KADIN: PVWK200068', detay5: 'ERKEK: PVWK200070 - KADIN: PVWK200068' },
    { id: 16569, parca: 'ERKEK: PVWK200059 - KADIN: PVWK200069', detay5: 'ERKEK: PVWK200059 - KADIN: PVWK200069' },
    { id: 16568, parca: 'ERKEK: PVWK200059 - KADIN: PVWK200069', detay5: 'ERKEK: PVWK200059 - KADIN: PVWK200069' },
    { id: 16567, parca: 'PVWB260016', detay5: 'ERKEK: PVWB260016' },
    { id: 16566, parca: 'PVWK200005', detay5: 'ERKEK: PVWK200005' },
    { id: 16564, parca: 'ERKEK: PVWB260013 - KADIN: PVWB260012', detay5: 'ERKEK: PVWB260013 - KADIN: PVWB260012' },
    { id: 16563, parca: 'PVWB260009', detay5: 'ERKEK: PVWB260009' },
    { id: 16562, parca: 'PVWB250002', detay5: 'KADIN: PVWB250002' },
    { id: 16543, parca: 'PVWK200078', detay5: 'ERKEK: PVWK200078' },
    { id: 16542, parca: 'PVWK200079', detay5: 'ERKEK: PVWK200079' }
];

async function migrate() {
    console.log(`Starting migration for ${SPECIFIC_ORDERS.length} targeted Doğuş orders...`);

    // 1. Build MSSQL batch update
    let mssqlSql = 'BEGIN TRANSACTION;\n';
    for (const item of SPECIFIC_ORDERS) {
        const pEsc = item.parca.replace(/'/g, "''");
        const dEsc = item.detay5.replace(/'/g, "''");
        mssqlSql += `UPDATE [SIPARIS].[dbo].[Siparisler] SET ParcaNo = N'${pEsc}', Detay5 = N'${dEsc}' WHERE Id = ${item.id};\n`;
    }

    // Also update any remaining BAYAN -> KADIN and BAY -> ERKEK in Detay5 for Doğuş orders
    mssqlSql += `
        UPDATE [SIPARIS].[dbo].[Siparisler]
        SET Detay5 = REPLACE(Detay5, 'BAYAN', 'KADIN')
        WHERE MusteriId IN (SELECT Id FROM [SIPARIS].[dbo].[Musteriler] WHERE Adi LIKE '%DOĞUŞ%' OR Adi LIKE '%DOGUS%')
          AND Detay5 LIKE '%BAYAN%';
    `;
    mssqlSql += 'COMMIT TRANSACTION;\n';

    console.log('Executing MSSQL Siparisler updates...');
    executeMssql(mssqlSql);
    console.log('✅ MSSQL Siparisler updated successfully.');

    // 2. PostgreSQL orders update
    console.log('Updating PostgreSQL orders table...');
    for (const item of SPECIFIC_ORDERS) {
        const orderNum = String(item.id);
        await pool.query(`
            UPDATE orders
            SET sku = $1,
                code39 = $1,
                notes = COALESCE(notes, '') || ' | ' || $2
            WHERE order_number::text = $3 OR id::text = $3
        `, [item.parca, item.detay5, orderNum]);
    }
    console.log('✅ PostgreSQL orders updated successfully.');

    // 3. Ensure MasterUrunler has 15637, 15638, PSCANIA15801 correctly indexed
    console.log('Checking MasterUrunler definitions...');
    const extraSql = `
        IF NOT EXISTS (SELECT 1 FROM [SIPARIS].[dbo].[MasterUrunler] WHERE ParcaNo = 'PSCANIA15801')
        BEGIN
            INSERT INTO [SIPARIS].[dbo].[MasterUrunler] (ParcaNo, UrunAdi, Marka, Grup, Cinsiyet, Barkod, Ean13, Code39)
            VALUES ('PSCANIA15801', 'DOĞUŞ OTOMOTİV 2026 KIŞ LOJİSTİK SCANIA MODELİ PANTOLON', 'SCANIA', 'SCANIA', 'UNISEX', '8684148094661', '8684148094661', 'PSCANIA15801');
        END
        IF NOT EXISTS (SELECT 1 FROM [SIPARIS].[dbo].[MasterUrunler] WHERE ParcaNo = '15637')
        BEGIN
            INSERT INTO [SIPARIS].[dbo].[MasterUrunler] (ParcaNo, UrunAdi, Marka, Grup, Cinsiyet, Barkod, Ean13, Code39)
            VALUES ('15637', 'DOĞUŞ OTOMOTİV LOJİSTİK KIŞ 2026 KULAKLIKLI BERE FÜME', 'GENEL', 'GENEL', 'UNISEX', '8690000015637', '8690000015637', '15637');
        END
        IF NOT EXISTS (SELECT 1 FROM [SIPARIS].[dbo].[MasterUrunler] WHERE ParcaNo = '15638')
        BEGIN
            INSERT INTO [SIPARIS].[dbo].[MasterUrunler] (ParcaNo, UrunAdi, Marka, Grup, Cinsiyet, Barkod, Ean13, Code39)
            VALUES ('15638', 'DOĞUŞ OTOMOTİV 2025 KIŞ LOJİSTİK POLAR FÜME', 'GENEL', 'GENEL', 'UNISEX', '8690000015638', '8690000015638', '15638');
        END
    `;
    executeMssql(extraSql);

    // Also update postgres master_products if missing
    await pool.query(`
        INSERT INTO master_products (sku, product_name, brand, grup, gender, barcode, ean13, code39)
        VALUES ('PSCANIA15801', 'DOĞUŞ OTOMOTİV 2026 KIŞ LOJİSTİK SCANIA MODELİ PANTOLON', 'SCANIA', 'SCANIA', 'UNISEX', '8684148094661', '8684148094661', 'PSCANIA15801')
        ON CONFLICT (sku) DO UPDATE SET product_name = EXCLUDED.product_name, brand = EXCLUDED.brand, barcode = EXCLUDED.barcode;

        INSERT INTO master_products (sku, product_name, brand, grup, gender, barcode, ean13, code39)
        VALUES ('15637', 'DOĞUŞ OTOMOTİV LOJİSTİK KIŞ 2026 KULAKLIKLI BERE FÜME', 'GENEL', 'GENEL', 'UNISEX', '8690000015637', '8690000015637', '15637')
        ON CONFLICT (sku) DO UPDATE SET product_name = EXCLUDED.product_name;

        INSERT INTO master_products (sku, product_name, brand, grup, gender, barcode, ean13, code39)
        VALUES ('15638', 'DOĞUŞ OTOMOTİV 2025 KIŞ LOJİSTİK POLAR FÜME', 'GENEL', 'GENEL', 'UNISEX', '8690000015638', '8690000015638', '15638')
        ON CONFLICT (sku) DO UPDATE SET product_name = EXCLUDED.product_name;
    `);

    console.log('✅ Master products verified.');
    await pool.end();
    console.log('🎉 Migration finished successfully!');
}

migrate().catch(console.error);
