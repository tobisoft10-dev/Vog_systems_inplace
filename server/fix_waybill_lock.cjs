const mssql = require('mssql');

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
        
        // 1. Unlock the waybill by removing e-despatch lock and resetting status
        await pool.request().query(`
            UPDATE LG_225_01_STFICHE 
            SET EDESPATCH = 0, 
                EDESPSTATUS = 0, 
                STATUS = 0, 
                CANCELLED = 0, 
                BILLED = 0,
                PRINTCNT = 0,
                CAPIBLOCK_CREATEDBY = 11
            WHERE FICHENO = 'IRS2026000001028'
        `);

        const res = await pool.request().query(`
            SELECT LOGICALREF, FICHENO, EDESPATCH, EDESPSTATUS, STATUS, CANCELLED, BILLED, PRINTCNT, CAPIBLOCK_CREATEDBY 
            FROM LG_225_01_STFICHE 
            WHERE FICHENO = 'IRS2026000001028'
        `);
        console.log('✅ [SUCCESS] Waybill IRS2026000001028 unlocked:', res.recordset[0]);

        await pool.close();
    } catch (e) {
        console.error(e.message);
    }
}
run();
