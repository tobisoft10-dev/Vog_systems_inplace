const { Pool } = require('pg');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

function queryMssql(queryText) {
    try {
        const tmpFile = path.join(__dirname, `tmp_out_${Date.now()}.json`);
        const cleanQuery = queryText.replace(/\r?\n/g, ' ');
        const cmd = `sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -f 65001 -w 65535 -y 0 -o "${tmpFile}" -Q "SET NOCOUNT ON; ${cleanQuery} FOR JSON PATH"`;
        execSync(cmd, { stdio: 'ignore' });
        if (fs.existsSync(tmpFile)) {
            const raw = fs.readFileSync(tmpFile, 'utf8');
            try { fs.unlinkSync(tmpFile); } catch (e) {}
            const jsonStr = raw.split(/\r?\n/).map(l => l.trim()).join('');
            if (jsonStr) return JSON.parse(jsonStr);
        }
    } catch (err) {
        console.error('sqlcmd error:', err.message);
    }
    return [];
}

async function run() {
    console.log("==================================================================");
    console.log(" 🔍 SİPARİŞ #16865 ARAMA (POSTGRESQL & MSSQL)");
    console.log("==================================================================");

    // 1. Postgres search
    try {
        const pg = await pool.query("SELECT * FROM orders WHERE order_number = '16865' OR sku LIKE '%16865%' OR product_name LIKE '%16865%'");
        console.log("📌 PostgreSQL 'orders' Tablosu Sonucu:");
        console.table(pg.rows);

        const allPg = await pool.query("SELECT order_number, brand, sub_customer_name, sku, quantity FROM orders ORDER BY order_number DESC LIMIT 15");
        console.log("📌 PostgreSQL 'orders' Tablosundaki Son 15 Sipariş:");
        console.table(allPg.rows);
    } catch (e) {
        console.error("Postgres error:", e.message);
    }

    // 2. MSSQL BSİP search
    try {
        const mssqlSip = queryMssql("SELECT TOP 5 Id, Model, [Not], Detay1, Detay2, Detay3, Detay4, Detay5 FROM [SIPARIS].[dbo].[Siparisler] WHERE Id = 16865");
        console.log("\n📌 MSSQL [SIPARIS].[dbo].[Siparisler] Id=16865 Sonucu:");
        console.log(JSON.stringify(mssqlSip, null, 2));

        const mssqlRecent = queryMssql("SELECT TOP 10 Id, Model, [Not], Detay1 FROM [SIPARIS].[dbo].[Siparisler] ORDER BY Id DESC");
        console.log("\n📌 MSSQL [SIPARIS].[dbo].[Siparisler] En Son 10 Sipariş:");
        console.table(mssqlRecent);
    } catch (e) {
        console.error("MSSQL error:", e.message);
    }

    await pool.end();
}

run();
