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
        
        const res1 = await pool.request().query("SELECT TOP 1 * FROM LG_225_01_STFICHE WHERE FICHENO = 'IRS2026000001028'");
        const res2 = await pool.request().query("SELECT TOP 1 * FROM LG_225_01_STFICHE WHERE FICHENO = 'IRS2026000001036'");
        
        const row1 = res1.recordset[0] || {};
        const row2 = res2.recordset[0] || {};

        const diffs = {};
        for (const key of Object.keys(row1)) {
            if (row1[key] !== row2[key] && key !== 'LOGICALREF' && key !== 'FICHENO' && key !== 'NETTOTAL' && key !== 'GROSSTOTAL' && key !== 'GUID' && key !== 'RECHASH') {
                diffs[key] = {
                    irs1028: row1[key],
                    irs1036_normal: row2[key]
                };
            }
        }
        console.log('=== STFICHE DIFFERENCES ===');
        console.log(JSON.stringify(diffs, null, 2));

        await pool.close();
    } catch (e) {
        console.error(e.message);
    }
}
run();
