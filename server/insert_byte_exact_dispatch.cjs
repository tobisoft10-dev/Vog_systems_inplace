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

async function insertByteExactDispatch() {
    try {
        const pool = await mssql.connect(config);

        // 1. Check Header LOGICALREF 25308
        const hRes = await pool.request().query("SELECT LOGICALREF, FICHENO, DOCODE, CLIENTREF, SOURCEINDEX, STATUS, EDESPATCH, GUID, RECHASH FROM LG_225_01_STFICHE WHERE FICHENO = 'IRS2025000001036'");
        console.log("📋 HEADER 25308 STATUS ON DC:");
        console.log(hRes.recordset);

        // 2. Clone a line item using INSERT INTO ... SELECT
        const stRef = hRes.recordset[0] ? hRes.recordset[0].LOGICALREF : 25308;

        const cloneLineSql = `
        INSERT INTO LG_225_01_STLINE (
            STFICHEREF, TRCODE, IOCODE, LINETYPE, STOCKREF, CLIENTREF, DATE_, FTIME, UOMREF, USREF, AMOUNT, PRICE, TOTAL, VAT, VATAMNT, LINENET, LINEEXP, MONTH_, YEAR_, GUID
        )
        SELECT TOP 1
            ${stRef}, 8, 3, 0, STOCKREF, 196, GETDATE(), 36000000, 24, 24, 3, 0.00, 0.00, 10, 0.00, 0.00, 'SKODA TEKNİSYEN MONTSU 2026', MONTH(GETDATE()), YEAR(GETDATE()), UPPER(CAST(NEWID() AS VARCHAR(36)))
        FROM LG_225_01_STLINE WHERE TRCODE = 8 AND IOCODE = 3;
        `;

        await pool.request().query(cloneLineSql);
        console.log("🎉 SUCCESS! Line item cloned via SQL SELECT into LG_225_01_STLINE!");

        const lRes = await pool.request().query(`SELECT LOGICALREF, STFICHEREF, STOCKREF, AMOUNT, PRICE, TOTAL, VAT, UOMREF, LINEEXP, GUID FROM LG_225_01_STLINE WHERE STFICHEREF = ${stRef}`);
        console.log("\n📊 EKLENEN İRSALİYE SATIR BİLGİSİ:");
        console.log(lRes.recordset);

        await pool.close();
    } catch(e) {
        console.error("Error:", e.message);
    }
}

insertByteExactDispatch().catch(console.error);
