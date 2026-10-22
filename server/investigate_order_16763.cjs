const mssql = require('mssql');
const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pgPool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const mssqlConfig = {
    server: process.env.DB_MSSQL_SERVER || 'localhost\\SQLEXPRESS',
    database: process.env.DB_MSSQL_NAME || 'SIPARIS',
    user: process.env.DB_MSSQL_USER || 'sa',
    password: process.env.DB_MSSQL_PASSWORD || 'Vog2026!',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        instanceName: process.env.DB_MSSQL_INSTANCE || 'SQLEXPRESS'
    }
};

async function investigateOrder16763() {
    console.log('🔍 Investigating Order #16763 across PostgreSQL and MSSQL...');

    // 1. Check PostgreSQL orders table
    const pgRes = await pgPool.query('SELECT * FROM orders WHERE order_number = 16763 OR id::text = \'16763\'');
    console.log('\n--- PostgreSQL orders table search ---');
    console.log(`Found in PostgreSQL: ${pgRes.rows.length} rows`);
    if (pgRes.rows.length > 0) {
        console.log(pgRes.rows[0]);
    }

    // 2. Check PostgreSQL vouchers table
    const vRes = await pgPool.query('SELECT * FROM vouchers WHERE order_id = 16763');
    console.log('\n--- PostgreSQL vouchers table search ---');
    console.log(`Found in vouchers: ${vRes.rows.length} rows`);
    if (vRes.rows.length > 0) {
        console.log(vRes.rows);
    }

    // 3. Check MSSQL Siparisler & SiparisIslemleri table
    try {
        const poolMssql = await mssql.connect(mssqlConfig);
        console.log('\n--- MSSQL Siparisler search for ID = 16763 ---');
        const mssqlRes = await poolMssql.request().query(`
            SELECT s.*, m.Adi AS MusteriAdi, b.Adi AS BedenAdi, i.Adi AS IslemAdi
            FROM [SIPARIS].[dbo].[Siparisler] s
            LEFT JOIN [SIPARIS].[dbo].[Musteriler] m ON s.MusteriId = m.Id
            LEFT JOIN [SIPARIS].[dbo].[Bedenler] b ON s.BedenId = b.Id
            LEFT JOIN [SIPARIS].[dbo].[Islemler] i ON s.IslemId = i.Id
            WHERE s.Id = 16763
        `);
        console.log(`Found in MSSQL Siparisler: ${mssqlRes.recordset.length} rows`);
        if (mssqlRes.recordset.length > 0) {
            console.log(mssqlRes.recordset[0]);
        }

        console.log('\n--- MSSQL SiparisIslemleri (bsip) search for SiparisId = 16763 ---');
        const bsipRes = await poolMssql.request().query(`
            SELECT * FROM [SIPARIS].[dbo].[SiparisIslemleri] WHERE SiparisId = 16763
        `);
        console.log(`Found in MSSQL SiparisIslemleri: ${bsipRes.recordset.length} rows`);
        if (bsipRes.recordset.length > 0) {
            console.log(bsipRes.recordset);
        }

        await poolMssql.close();
    } catch (e) {
        console.log('⚠️ MSSQL Connection note:', e.message);
    }

    await pgPool.end();
}

investigateOrder16763();
