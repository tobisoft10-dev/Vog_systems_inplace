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
        
        const backupPath = path.join(__dirname, 'logo_irs1028_backup.json');
        const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
        const { header, lines } = backup;

        console.log(`🚀 Recreating waybill '${header.FICHENO}' in LOGO MSSQL...`);

        // 1. Delete old existing lines and header for IRS2026000001028
        await pool.request().query(`
            DELETE FROM LG_225_01_STLINE WHERE STFICHEREF IN (SELECT LOGICALREF FROM LG_225_01_STFICHE WHERE FICHENO = '${header.FICHENO}');
            DELETE FROM LG_225_01_STFICHE WHERE FICHENO = '${header.FICHENO}';
        `);
        console.log(`🧹 Deleted old records for ${header.FICHENO}`);

        // 2. Insert fresh header
        const headerCols = Object.keys(header).filter(c => c !== 'LOGICALREF');
        const colList = headerCols.join(', ');
        
        const headerValList = headerCols.map(c => {
            const val = header[c];
            if (c === 'RECSTATUS') return '2';
            if (c === 'EDESPATCH' || c === 'EDESPSTATUS') return '0';
            if (c === 'STATUS' || c === 'CANCELLED' || c === 'BILLED' || c === 'PRINTCNT') return '0';
            if (c === 'CAPIBLOCK_CREATEDBY' || c === 'CAPIBLOCK_MODIFIEDBY') return '11';
            if (val === null) return 'NULL';
            if (typeof val === 'number') return String(val);
            if (val instanceof Date || (typeof val === 'string' && val.includes('T00:00:00'))) {
                return `'${val.split('T')[0]}'`;
            }
            return `'${String(val).replace(/'/g, "''")}'`;
        }).join(', ');

        const insertHeaderSql = `
            INSERT INTO LG_225_01_STFICHE (${colList})
            VALUES (${headerValList});
        `;

        await pool.request().query(insertHeaderSql);

        const getHeaderRes = await pool.request().query(`SELECT TOP 1 LOGICALREF FROM LG_225_01_STFICHE WHERE FICHENO = '${header.FICHENO}' ORDER BY LOGICALREF DESC`);
        const newStFicheRef = getHeaderRes.recordset[0].LOGICALREF;
        console.log(`✅ [HEADER CREATED] New LOGICALREF = ${newStFicheRef} for FICHENO '${header.FICHENO}'`);

        // 3. Insert fresh lines
        for (const line of lines) {
            const lineCols = Object.keys(line).filter(c => c !== 'LOGICALREF');
            const lineColList = lineCols.join(', ');
            
            const lineValList = lineCols.map(c => {
                if (c === 'STFICHEREF') return String(newStFicheRef);
                if (c === 'RECSTATUS') return '2';
                if (c === 'STATUS' || c === 'CANCELLED' || c === 'BILLED') return '0';
                if (c === 'CAPIBLOCK_CREATEDBY' || c === 'CAPIBLOCK_MODIFIEDBY') return '11';
                
                const val = line[c];
                if (val === null) return 'NULL';
                if (typeof val === 'number') return String(val);
                if (val instanceof Date || (typeof val === 'string' && val.includes('T00:00:00'))) {
                    return `'${val.split('T')[0]}'`;
                }
                return `'${String(val).replace(/'/g, "''")}'`;
            }).join(', ');

            const insertLineSql = `INSERT INTO LG_225_01_STLINE (${lineColList}) VALUES (${lineValList});`;
            await pool.request().query(insertLineSql);
            console.log(`✅ [LINE CREATED] Added line for StockRef ${line.STOCKREF} (Adet: ${line.AMOUNT})`);
        }

        console.log(`🎉 Waybill '${header.FICHENO}' successfully recreated with exact LOGO data!`);

        await pool.close();
    } catch (e) {
        console.error('Recreate error:', e.message);
    }
}
run();
