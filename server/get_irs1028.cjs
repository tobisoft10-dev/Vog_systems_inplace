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
            SELECT 
                F.LOGICALREF AS FicheRef,
                F.FICHENO, 
                F.DATE_, 
                F.DOCODE, 
                C.CODE AS CariKodu, 
                C.DEFINITION_ AS CariUnvani, 
                I.CODE AS UrunKodu, 
                I.NAME AS UrunAdi, 
                L.AMOUNT, 
                L.PRICE, 
                L.TOTAL, 
                L.VAT, 
                F.GENEXP1 
            FROM LG_225_01_STFICHE F WITH(NOLOCK) 
            INNER JOIN LG_225_01_STLINE L WITH(NOLOCK) ON F.LOGICALREF = L.STFICHEREF 
            LEFT JOIN LG_225_ITEMS I WITH(NOLOCK) ON L.STOCKREF = I.LOGICALREF 
            LEFT JOIN LG_225_CLCARD C WITH(NOLOCK) ON F.CLIENTREF = C.LOGICALREF 
            WHERE F.FICHENO = 'IRS2026000001028'
        `);
        console.log('=== IRS2026000001028 FULL CONTENT ===');
        console.log(JSON.stringify(res.recordset, null, 2));
        await pool.close();
    } catch (e) {
        console.error(e.message);
    }
}
run();
