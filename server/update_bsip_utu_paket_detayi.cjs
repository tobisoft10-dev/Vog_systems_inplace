const { execSync } = require('child_process');
const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pgPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'vog_db',
    password: process.env.DB_PASSWORD || '150609',
    port: process.env.DB_PORT || 5432,
});

function queryMssql(queryText) {
    try {
        const fs = require('fs');
        const path = require('path');
        const tmpFile = path.join(__dirname, `tmp_out_${Date.now()}_${Math.random().toString(36).substring(7)}.json`);
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
        console.error('sqlcmd query error:', err.message);
    }
    return [];
}

function execMssqlUpdateBatch(updateStatements) {
    if (!updateStatements || updateStatements.length === 0) return;
    try {
        const fs = require('fs');
        const path = require('path');
        const scriptFile = path.join(__dirname, `batch_update_${Date.now()}.sql`);
        fs.writeFileSync(scriptFile, 'SET NOCOUNT ON;\n' + updateStatements.join('\n'), 'utf8');
        const cmd = `sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -i "${scriptFile}"`;
        execSync(cmd, { stdio: 'ignore' });
        try { fs.unlinkSync(scriptFile); } catch (e) {}
        return true;
    } catch (e) {
        console.error('Batch MSSQL update error:', e.message);
        return false;
    }
}

async function runUtuPaketDetayiUpdate() {
    console.log('🚀 Updating BSİP MSSQL [SIPARIS].[dbo].[Siparisler] -> Detay5 (Ütü/Paket Detayı) with Parça No...\n');

    // Load all master_products from PostgreSQL for fast in-memory lookup
    const mpRes = await pgPool.query('SELECT sku, code39, barcode, product_name, brand FROM master_products');
    const masterProducts = mpRes.rows;
    console.log(`📚 Loaded ${masterProducts.length} master products from PostgreSQL.`);

    // Fetch all orders from BSİP MSSQL
    const orders = queryMssql(`
        SELECT Id, Model, [Not], Detay1, Detay2, Detay3, Detay4, Detay5
        FROM [SIPARIS].[dbo].[Siparisler]
        ORDER BY Id DESC
    `);
    console.log(`📦 Fetched ${orders.length} orders from BSİP MSSQL.`);

    let alreadyHasPartNo = 0;
    let updatedCount = 0;
    let updateBatch = [];

    for (const order of orders) {
        const d5 = (order.Detay5 || '').trim();
        const model = (order.Model || '').trim();
        const note = (order.Not || '').trim();
        const d1 = (order.Detay1 || '').trim();

        // Regex check if Detay5 already contains a Parça No / P-Code / SKU
        const existingPartNo = (d5 + ' ' + note + ' ' + d1).match(/\b(K-OG\d{3,6}|P[A-Z]{2,6}\d{3,10}[A-Z0-9]*|SPR-\d{4}-\d{4}|KIYAFETYAZ-[A-Z0-9\-]+|A84333)\b/i);

        if (existingPartNo && d5.includes(existingPartNo[1])) {
            alreadyHasPartNo++;
            continue;
        }

        let parcaNo = existingPartNo ? existingPartNo[1].toUpperCase() : null;

        // If not found in text, search master_products by Model name
        if (!parcaNo && model) {
            const cleanModel = model.replace(/-\s*[A-Z0-9]+$/i, '').trim().toLowerCase();
            const matchedMp = masterProducts.find(mp => 
                mp.product_name && (
                    mp.product_name.toLowerCase().includes(cleanModel) || 
                    cleanModel.includes(mp.product_name.toLowerCase())
                )
            );
            if (matchedMp) {
                parcaNo = matchedMp.sku;
            }
        }

        // If still not found, derive brand-based clean P-Code
        if (!parcaNo) {
            let brandPrefix = 'VOG';
            const uModel = model.toUpperCase();
            if (uModel.includes('NISSAN')) brandPrefix = 'NISSAN';
            else if (uModel.includes('CUPRA')) brandPrefix = 'CUPRA';
            else if (uModel.includes('AUDI')) brandPrefix = 'AUDI';
            else if (uModel.includes('PORSCHE')) brandPrefix = 'PORSCHE';
            else if (uModel.includes('VW') || uModel.includes('VOLKSWAGEN')) brandPrefix = 'VW';
            else if (uModel.includes('SEAT')) brandPrefix = 'SEAT';
            else if (uModel.includes('SKODA')) brandPrefix = 'SKODA';
            else if (uModel.includes('SCANIA')) brandPrefix = 'SCANIA';

            parcaNo = `P${brandPrefix}${order.Id}`;
        }

        // Append parcaNo to Detay5
        const newDetay5 = d5 ? `${d5} ${parcaNo}` : parcaNo;
        const escapedDetay5 = newDetay5.replace(/'/g, "''");

        updateBatch.push(`UPDATE [SIPARIS].[dbo].[Siparisler] SET Detay5 = N'${escapedDetay5}' WHERE Id = ${order.Id};`);
        updatedCount++;

        // Execute in batches of 500
        if (updateBatch.length >= 500) {
            execMssqlUpdateBatch(updateBatch);
            console.log(`   ⚡ Processed batch of ${updateBatch.length} updates... Total updated so far: ${updatedCount}`);
            updateBatch = [];
        }
    }

    if (updateBatch.length > 0) {
        execMssqlUpdateBatch(updateBatch);
        console.log(`   ⚡ Processed final batch of ${updateBatch.length} updates.`);
    }

    console.log(`\n🎉 Summary:`);
    console.log(`   ✔️ Detay5 already contained Parça No: ${alreadyHasPartNo}`);
    console.log(`   ✏️ Detay5 updated with Parça No: ${updatedCount}`);

    await pgPool.end();
}

runUtuPaketDetayiUpdate();
