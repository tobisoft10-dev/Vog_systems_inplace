const { Pool } = require('pg');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pgPool = new Pool({ connectionString: 'postgresql://postgres:150609@localhost:5432/vog_db' });

function runSqlcmd(sqlQuery) {
    const tmpSql = path.join(__dirname, `tmp_comp_${Date.now()}.sql`);
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

async function compareDatabases() {
    console.log('Comparing PostgreSQL master_products vs MSSQL MasterUrunler...\n');

    // 1. Total counts
    const pgCountRes = await pgPool.query('SELECT COUNT(*) FROM master_products');
    const pgCount = parseInt(pgCountRes.rows[0].count);

    const mssqlCountOut = runSqlcmd('USE [SIPARIS]; SELECT COUNT(*) FROM [dbo].[MasterUrunler];');
    const mssqlCountMatch = mssqlCountOut.match(/\b(\d+)\b/);
    const mssqlCount = mssqlCountMatch ? parseInt(mssqlCountMatch[1]) : 0;

    console.log(`Row counts: PG = ${pgCount}, MSSQL = ${mssqlCount}`);

    // 2. Brand breakdown comparison
    const pgBrands = await pgPool.query(`
        SELECT COALESCE(brand, 'NULL') as brand, COUNT(*) as c
        FROM master_products GROUP BY brand ORDER BY brand
    `);
    const pgBrandMap = new Map(pgBrands.rows.map(r => [r.brand, parseInt(r.c)]));

    const mssqlBrandOut = runSqlcmd(`
        USE [SIPARIS];
        SET NOCOUNT ON;
        SELECT ISNULL([Marka], 'NULL') + '|' + CAST(COUNT(*) AS VARCHAR(20))
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

    console.log('\n--- BRAND BREAKDOWN COMPARISON ---');
    const allBrands = new Set([...pgBrandMap.keys(), ...mssqlBrandMap.keys()]);
    for (const b of allBrands) {
        const pgc = pgBrandMap.get(b) || 0;
        const msc = mssqlBrandMap.get(b) || 0;
        const diff = pgc - msc;
        if (diff !== 0) {
            console.log(`⚠️ Brand "${b}": PG = ${pgc}, MSSQL = ${msc} (Diff: ${diff})`);
        } else {
            console.log(`✅ Brand "${b}": ${pgc} matching`);
        }
    }

    // 3. Check for any SKUs in PG not in MSSQL
    const pgSkusRes = await pgPool.query('SELECT sku FROM master_products');
    console.log(`Fetched ${pgSkusRes.rows.length} SKUs from PG.`);

    await pgPool.end();
}

compareDatabases().catch(console.error);
