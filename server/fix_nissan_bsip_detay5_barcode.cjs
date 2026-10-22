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
        const scriptFile = path.join(__dirname, `batch_nissan_update_${Date.now()}.sql`);
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

async function fixNissanDetay5Barcodes() {
    console.log('🚀 Updating Nissan orders in BSİP MSSQL [SIPARIS].[dbo].[Siparisler] -> Detay5 to use BARCODE values...\n');

    // 1. Fetch Nissan master products from PostgreSQL
    const nissanMpRes = await pgPool.query(
        "SELECT sku, barcode, code39, product_name FROM master_products WHERE UPPER(brand) = 'NISSAN'"
    );
    const nissanProducts = nissanMpRes.rows;
    console.log(`📚 Loaded ${nissanProducts.length} Nissan master products from PostgreSQL.`);

    // 2. Fetch all orders from BSİP MSSQL
    const allOrders = queryMssql(`
        SELECT Id, Model, [Not], Detay1, Detay2, Detay3, Detay4, Detay5
        FROM [SIPARIS].[dbo].[Siparisler]
        WHERE Model LIKE '%NISSAN%' OR Detay5 LIKE '%PNISSAN%' OR Detay5 LIKE '%NISSAN%' OR [Not] LIKE '%NISSAN%'
        ORDER BY Id DESC
    `);
    console.log(`📦 Found ${allOrders.length} Nissan orders in BSİP MSSQL.`);

    let updatedCount = 0;
    let updateStatements = [];

    for (const order of allOrders) {
        let d5 = (order.Detay5 || '').trim();
        const model = (order.Model || '').trim();
        const uModel = model.toUpperCase();

        // Find best matching barcode from Nissan master products
        let targetBarcode = '901020100105'; // Default fallback Servis Danışmanı Erkek XL barcode

        if (uModel.includes('KADIN') || uModel.includes('BAYAN')) {
            targetBarcode = '901120100105'; // Servis Danışmanı Kadın XL
        } else if (uModel.includes('YEDEK PARÇA') || uModel.includes('YP')) {
            targetBarcode = '901220100105';
        } else if (uModel.includes('YIKAMACI') || uModel.includes('YIKAMA')) {
            targetBarcode = '901320100105';
        } else if (uModel.includes('MASTER TEKNİSYEN') || uModel.includes('MASTER')) {
            targetBarcode = '901420100105';
        } else if (uModel.includes('TEKNİSYEN')) {
            targetBarcode = '901520100105';
        } else if (uModel.includes('FORMEN')) {
            targetBarcode = '901620100105';
        } else if (uModel.includes('VALE')) {
            targetBarcode = '901720100105';
        } else if (uModel.includes('PANTOLON')) {
            targetBarcode = '903020100105';
        }

        // Try exact master products match if available
        const cleanModel = model.replace(/-\s*[A-Z0-9]+$/i, '').trim().toLowerCase();
        const exactMatch = nissanProducts.find(p => p.product_name && p.product_name.toLowerCase().includes(cleanModel));
        if (exactMatch && exactMatch.barcode) {
            targetBarcode = exactMatch.barcode;
        }

        // Replace any PNISSAN... or KIYAFETYAZ... in Detay5 with targetBarcode
        let newD5 = d5.replace(/PNISSAN\d+/gi, targetBarcode)
                      .replace(/PARÇA NO:\s*PNISSAN\d+/gi, `PARÇA NO: ${targetBarcode}`);

        if (!newD5.includes(targetBarcode)) {
            newD5 = newD5.replace(/PARÇA NO:\s*[A-Z0-9\-]+/gi, `PARÇA NO: ${targetBarcode}`);
            if (!newD5.includes(targetBarcode)) {
                newD5 = newD5 ? `${newD5} PARÇA NO: ${targetBarcode}` : `PARÇA NO: ${targetBarcode}`;
            }
        }

        if (newD5 !== d5) {
            const escaped = newD5.replace(/'/g, "''");
            updateStatements.push(`UPDATE [SIPARIS].[dbo].[Siparisler] SET Detay5 = N'${escaped}' WHERE Id = ${order.Id};`);
            updatedCount++;
            console.log(`   ✅ Order #${order.Id} Nissan Detay5 updated -> "${newD5}"`);
        }
    }

    if (updateStatements.length > 0) {
        execMssqlUpdateBatch(updateStatements);
        console.log(`\n🎉 Successfully updated ${updatedCount} Nissan orders in BSİP MSSQL with Barcode values!`);
    } else {
        console.log(`\n✔️ All Nissan orders already have correct Barcodes.`);
    }

    await pgPool.end();
}

fixNissanDetay5Barcodes();
