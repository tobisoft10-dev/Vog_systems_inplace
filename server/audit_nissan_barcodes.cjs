const { Client } = require('pg');
const sql = require('mssql');
const fs = require('fs');

async function auditNissanBarcodes() {
    console.log('⚡ Starting comprehensive Barcode & Master Product Audit for NISSAN...\n');

    // 1. Fetch PostgreSQL master_products
    const pgClient = new Client({ host: 'localhost', port: 5432, user: 'postgres', password: '1', database: 'vog_db' });
    await pgClient.connect();

    const pgRes = await pgClient.query(`
        SELECT id, sku, brand, product_name, size, barcode, code39 
        FROM master_products 
        WHERE brand ILIKE '%NISSAN%'
        ORDER BY product_name, size
    `);
    await pgClient.end();

    const masterProducts = pgRes.rows;
    console.log(`✅ Loaded ${masterProducts.length} NISSAN products from PostgreSQL master_products table.`);

    // 2. Fetch MS SQL Siparisler
    const sqlConfig = {
        user: 'sa',
        password: '150609%M',
        server: 'localhost\\SQLEXPRESS',
        database: 'SIPARIS',
        options: { encrypt: false, trustServerCertificate: true }
    };
    try {
        await sql.connect(sqlConfig);
        const mssqlRes = await sql.query(`
            SELECT s.Id, s.Model, s.Detay1, s.Detay5, m.Adi as MusteriAdi
            FROM Siparisler s
            LEFT JOIN Musteriler m ON s.MusteriId = m.Id
            WHERE m.Adi LIKE '%NISSAN%' OR s.Model LIKE '%NISSAN%'
            ORDER BY s.Id DESC
        `);
        const siparisler = mssqlRes.recordset;
        console.log(`✅ Loaded ${siparisler.length} NISSAN order records from MS SQL Siparisler table.\n`);

        // Group master products by Category/Name
        const masterByCategory = {};
        masterProducts.forEach(p => {
            const catKey = p.product_name.replace(/-[A-Z0-9]+$/, '').trim();
            if (!masterByCategory[catKey]) masterByCategory[catKey] = [];
            masterByCategory[catKey].push(p);
        });

        console.log('=== PostgreSQL NISSAN Product Categories & Barcode Ranges ===');
        Object.keys(masterByCategory).forEach(cat => {
            const prods = masterByCategory[cat];
            const codeSample = prods.map(p => `${p.size}: ${p.code39}`).join(' | ');
            console.log(`• ${cat} (${prods.length} bedens): ${codeSample}`);
        });

        console.log('\n=== MS SQL NISSAN Order Models & Found Barcodes ===');
        const report = siparisler.map(sip => {
            const detay5 = (sip.Detay5 || '').trim();
            const matchedProds = masterProducts.filter(p => detay5.includes(p.code39) || detay5.includes(p.barcode));

            return {
                Id: sip.Id,
                Musteri: sip.MusteriAdi,
                Model: sip.Model,
                Detay5_Text: detay5.substring(0, 40) + (detay5.length > 40 ? '...' : ''),
                MatchedBarcodesCount: matchedProds.length,
                MatchedBarcodes: matchedProds.map(p => `${p.size}->${p.code39}`).join(', ')
            };
        });

        console.table(report.slice(0, 30));

        fs.writeFileSync('c:/vog_system/server/nissan_audit_summary.json', JSON.stringify({
            masterCategories: masterByCategory,
            ordersAudit: report
        }, null, 2), 'utf8');

        console.log('\n🎉 Audit report written to c:/vog_system/server/nissan_audit_summary.json');

    } catch (err) {
        console.error('MS SQL Error:', err.message);
    } finally {
        try { await sql.close(); } catch(e) {}
    }
}

auditNissanBarcodes();
