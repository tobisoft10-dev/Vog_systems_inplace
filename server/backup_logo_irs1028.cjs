const mssql = require('mssql');
const fs = require('fs');
const path = require('path');

const config = {
    user: 'deporfid',
    password: '!1235!',
    server: 'DC',
    database: 'WINGS',
    port: 1433,
    options: {
        trustServerCertificate: true,
        connectTimeout: 5000
    }
};

async function run() {
    try {
        const pool = await mssql.connect(config);
        
        // 1. Header (STFICHE)
        const headerRes = await pool.request().query("SELECT * FROM LG_225_01_STFICHE WHERE FICHENO = 'IRS2026000001028'");
        const header = headerRes.recordset[0];

        // 2. Lines (STLINE)
        const linesRes = await pool.request().query(`SELECT * FROM LG_225_01_STLINE WHERE STFICHEREF = ${header.LOGICALREF} ORDER BY INVOICELNNO ASC`);
        const lines = linesRes.recordset;

        const backup = {
            backed_up_at: new Date().toISOString(),
            header: header,
            lines: lines
        };

        const backupPath = path.join(__dirname, 'logo_irs1028_backup.json');
        fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), 'utf8');

        console.log(`✅ [LOGO BACKUP] Saved ${lines.length} lines and header to ${backupPath}`);
        console.log('=== HEADER SUMMARY ===');
        console.log(`Fiş No: ${header.FICHENO}, Belge No: ${header.DOCODE}, Cari Ref: ${header.CLIENTREF}, Tarih: ${header.DATE_}`);
        console.log('=== LINES SUMMARY ===');
        lines.forEach((l, idx) => {
            console.log(`Satır ${idx + 1}: StockRef: ${l.STOCKREF}, Miktar: ${l.AMOUNT}, Fiyat: ${l.PRICE}, Tutar: ${l.TOTAL}, KDV: ${l.VAT}`);
        });

        await pool.close();
    } catch (e) {
        console.error(e.message);
    }
}
run();
