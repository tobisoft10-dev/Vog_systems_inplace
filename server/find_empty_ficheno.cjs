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
        const res = await pool.request().query(`
            SELECT TOP 20 
                F.LOGICALREF, 
                F.FICHENO, 
                F.DOCODE, 
                F.DATE_, 
                F.GENEXP1, 
                F.SPECODE, 
                COUNT(L.LOGICALREF) AS SatirSayisi, 
                SUM(L.AMOUNT) AS ToplamAdet 
            FROM LG_225_01_STFICHE F WITH(NOLOCK) 
            LEFT JOIN LG_225_01_STLINE L WITH(NOLOCK) ON F.LOGICALREF = L.STFICHEREF 
            WHERE (F.FICHENO = '' OR F.FICHENO IS NULL OR RTRIM(LTRIM(F.FICHENO)) = '') AND F.CANCELLED = 0 
            GROUP BY F.LOGICALREF, F.FICHENO, F.DOCODE, F.DATE_, F.GENEXP1, F.SPECODE 
            ORDER BY F.LOGICALREF DESC
        `);
        console.log(JSON.stringify(res.recordset, null, 2));
        await pool.close();
    } catch (e) {
        console.error(e.message);
    }
}
run();
