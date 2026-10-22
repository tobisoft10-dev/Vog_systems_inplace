const { Pool } = require('pg');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: 'postgresql://postgres:150609@localhost:5432/vog_db' });

function runSqlcmd(sqlQuery) {
    const tmpSql = path.join(__dirname, `tmp_val_${Date.now()}_${Math.floor(Math.random() * 10000)}.sql`);
    fs.writeFileSync(tmpSql, sqlQuery, 'utf8');
    const cmd = `sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -f 65001 -w 65535 -y 0 -i "${tmpSql}"`;
    try {
        const out = execSync(cmd, { encoding: 'utf8', windowsHide: true });
        try { fs.unlinkSync(tmpSql); } catch (_) {}
        return out;
    } catch (err) {
        try { fs.unlinkSync(tmpSql); } catch (_) {}
        throw err;
    }
}

async function validateIntegrity() {
    console.log('================================================================');
    console.log('🔍 MASTER ÜRÜNLER POSTGRESQL ↔ MSSQL BÜTÜNLÜK VE EŞLEŞME RAPORU');
    console.log('================================================================\n');

    // 1. Row counts
    const pgCountRes = await pool.query('SELECT COUNT(*) as c, COUNT(DISTINCT sku) as d FROM master_products');
    const pgCount = parseInt(pgCountRes.rows[0].c);
    const pgDistinct = parseInt(pgCountRes.rows[0].d);

    const mssqlOut = runSqlcmd(`
        USE [SIPARIS];
        SET NOCOUNT ON;
        SELECT CAST(COUNT(*) AS VARCHAR(20)) + '|' + CAST(COUNT(DISTINCT [ParcaNo]) AS VARCHAR(20))
        FROM [dbo].[MasterUrunler];
    `);
    const mssqlParts = mssqlOut.trim().split('\n').pop().trim().split('|');
    const mssqlCount = parseInt(mssqlParts[0]) || 0;
    const mssqlDistinct = parseInt(mssqlParts[1]) || 0;

    console.log('📊 1. KAYIT SAYILARI & TEKİLLİK (UNIQUENESS):');
    console.log(`   • PostgreSQL master_products : ${pgCount} kayıt (Tekil SKU: ${pgDistinct})`);
    console.log(`   • MSSQL MasterUrunler        : ${mssqlCount} kayıt (Tekil ParcaNo: ${mssqlDistinct})`);
    const countMatch = (pgCount === mssqlCount && pgCount === pgDistinct && mssqlCount === mssqlDistinct);
    console.log(`   • Durum                      : ${countMatch ? '✅ %100 BİREBİR EŞİT VE TEKİL' : '⚠️ FARK MEVCUT'}\n`);

    // 2. Garbage text check
    const pgGarbage = await pool.query(`
        SELECT COUNT(*) as c 
        FROM master_products 
        WHERE sku IN ('TEK', 'PAKET', 'PAKETLENECEK', 'PO', 'PAKETLEN');
    `);
    const mssqlGarbageOut = runSqlcmd(`
        USE [SIPARIS];
        SET NOCOUNT ON;
        SELECT COUNT(*) FROM [dbo].[MasterUrunler] 
        WHERE [ParcaNo] IN ('TEK', 'PAKET', 'PAKETLENECEK', 'PO', 'PAKETLEN');
    `);
    const mssqlGarbage = parseInt(mssqlGarbageOut.trim().split('\n').pop().trim()) || 0;

    console.log('🧹 2. ÇÖP KELİME KONTROLÜ (TEK, PAKET, PO):');
    console.log(`   • PostgreSQL'deki çöp kayıt  : ${pgGarbage.rows[0].c} adet`);
    console.log(`   • MSSQL'deki çöp kayıt       : ${mssqlGarbage} adet`);
    console.log(`   • Durum                      : ${(pgGarbage.rows[0].c === '0' && mssqlGarbage === 0) ? '✅ TAMAMEN TEMİZLENDİ' : '⚠️ ÇÖP VERİ VAR'}\n`);

    // 3. NULL Brand check
    const pgNullBrand = await pool.query('SELECT COUNT(*) as c FROM master_products WHERE brand IS NULL OR brand = \'\'');
    const mssqlNullBrandOut = runSqlcmd('USE [SIPARIS]; SET NOCOUNT ON; SELECT COUNT(*) FROM [dbo].[MasterUrunler] WHERE [Marka] IS NULL OR [Marka] = \'\';');
    const mssqlNullBrand = parseInt(mssqlNullBrandOut.trim().split('\n').pop().trim()) || 0;

    console.log('🏷️ 3. NULL MARKA KONTROLÜ:');
    console.log(`   • PostgreSQL NULL Marka      : ${pgNullBrand.rows[0].c} adet`);
    console.log(`   • MSSQL NULL Marka           : ${mssqlNullBrand} adet`);
    console.log(`   • Durum                      : ${(pgNullBrand.rows[0].c === '0' && mssqlNullBrand === 0) ? '✅ TÜM KAYITLAR MARKAYA SAHİP' : '⚠️ NULL MARKA VAR'}\n`);

    // 4. Brand Breakdown parity test
    console.log('🏢 4. MARKA BAZLI DAĞILIM KARŞILAŞTIRMASI:');
    const pgBrands = await pool.query('SELECT brand, COUNT(*) as c FROM master_products GROUP BY brand ORDER BY brand');
    const pgBrandMap = new Map(pgBrands.rows.map(r => [r.brand, parseInt(r.c)]));

    const mssqlBrandOut = runSqlcmd(`
        USE [SIPARIS];
        SET NOCOUNT ON;
        SELECT [Marka] + '|' + CAST(COUNT(*) AS VARCHAR(20))
        FROM [dbo].[MasterUrunler]
        GROUP BY [Marka]
        ORDER BY [Marka];
    `);
    const mssqlBrandMap = new Map();
    for (const line of mssqlBrandOut.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.includes('|')) {
            const [b, c] = trimmed.split('|');
            mssqlBrandMap.set(b.trim(), parseInt(c.trim()));
        }
    }

    let allBrandsMatch = true;
    const allBrands = new Set([...pgBrandMap.keys(), ...mssqlBrandMap.keys()]);
    console.log('┌────────────────────┬──────────────┬──────────────┬────────────┐');
    console.log('│ MARKA              │ POSTGRESQL   │ MSSQL        │ EŞLEŞME    │');
    console.log('├────────────────────┼──────────────┼──────────────┼────────────┤');
    for (const b of [...allBrands].sort()) {
        const pgc = pgBrandMap.get(b) || 0;
        const msc = mssqlBrandMap.get(b) || 0;
        const isMatch = (pgc === msc);
        if (!isMatch) allBrandsMatch = false;
        console.log(`│ ${b.padEnd(18)} │ ${String(pgc).padStart(12)} │ ${String(msc).padStart(12)} │ ${isMatch ? '✅ EŞİT' : '❌ FARK'}    │`);
    }
    console.log('└────────────────────┴──────────────┴──────────────┴────────────┘');
    console.log(`   • Genel Marka Eşitliği       : ${allBrandsMatch ? '✅ TÜM MARKALARDA BİREBİR EŞİTLİK SAĞLANDI' : '❌ FARK VAR'}\n`);

    // 5. Sample Record Cross-check
    console.log('🔍 5. ÖRNEK NISSAN & VOLKSWAGEN KAYITLARININ ÇAPRAZ ALAN TESTİ:');
    const sampleSkus = ['8520147032006', '6001258147015', '901020100101'];
    for (const testSku of sampleSkus) {
        const pgSample = await pool.query('SELECT sku, product_name, brand, size, clean_size, barcode, ean13, code39, grup, color FROM master_products WHERE sku = $1', [testSku]);
        if (pgSample.rows.length > 0) {
            const p = pgSample.rows[0];
            const mssqlSampleOut = runSqlcmd(`
                USE [SIPARIS];
                SET NOCOUNT ON;
                SELECT [ParcaNo], [UrunAdi], [Marka], [Beden], [CleanBeden], [Barkod], [Ean13], [Code39], [Grup], [Renk]
                FROM [dbo].[MasterUrunler]
                WHERE [ParcaNo] = N'${testSku}';
            `);
            console.log(`   📌 Test SKU: ${testSku} (${p.brand})`);
            console.log(`      PG   -> Ürün: "${p.product_name}", Beden: ${p.clean_size}, Barkod: ${p.barcode}, Renk: ${p.color}`);
            console.log(`      MSSQL-> ${mssqlSampleOut.trim().split('\n').pop().trim()}`);
        }
    }

    console.log('\n================================================================');
    console.log('🏆 BÜTÜNLÜK VE DOĞRULAMA TESTİ TAMAMLANDI.');
    console.log('================================================================\n');

    await pool.end();
}

validateIntegrity().catch(console.error);
