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
        
        await pool.request().query(`
            DELETE FROM LG_225_01_STLINE WHERE STFICHEREF IN (SELECT LOGICALREF FROM LG_225_01_STFICHE WHERE FICHENO = 'IRS2026000001028');
            DELETE FROM LG_225_01_STFICHE WHERE FICHENO = 'IRS2026000001028';
        `);

        const check = await pool.request().query("SELECT * FROM LG_225_01_STFICHE WHERE FICHENO = 'IRS2026000001028'");
        console.log('✅ [SUCCESS] IRS2026000001028 tamamen silindi. Kalan kayıt sayısı:', check.recordset.length);

        await pool.close();
    } catch (e) {
        console.error('Delete error:', e.message);
    }
}
run();
