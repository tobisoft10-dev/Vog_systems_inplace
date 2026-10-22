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

async function insertLineClean() {
    try {
        const pool = await mssql.connect(config);
        console.log("Connected to DC WINGS!");

        const clientRef = 196;
        const stFicheRef = 25303;

        const itemsRes = await pool.request().query("SELECT TOP 3 LOGICALREF, CODE, NAME FROM LG_225_ITEMS WHERE CARDTYPE = 1");
        const item1 = itemsRes.recordset[0] ? itemsRes.recordset[0].LOGICALREF : 1;
        const item2 = itemsRes.recordset[1] ? itemsRes.recordset[1].LOGICALREF : 2;

        const insertLines = `
        INSERT INTO LG_225_01_STLINE (
            STFICHEREF, TRCODE, LINETYPE, STOCKREF, CLIENTREF, DATE_, FTIME, UOMREF, AMOUNT, PRICE, TOTAL, VAT, VATAMNT, LINENET
        ) VALUES 
        (${stFicheRef}, 8, 0, ${item1}, ${clientRef}, GETDATE(), 36000000, 1, 3, 1250.00, 3750.00, 18, 675.00, 3750.00),
        (${stFicheRef}, 8, 0, ${item2}, ${clientRef}, GETDATE(), 36000000, 1, 4, 850.00, 3400.00, 18, 612.00, 3400.00);
        `;

        await pool.request().query(insertLines);
        console.log("🎉 SUCCESS! LIVE LOGO WAYBILL LINE ITEMS INSERTED INTO LG_225_01_STLINE ON DC!");

        const verifyLines = await pool.request().query(`SELECT LOGICALREF, STFICHEREF, STOCKREF, AMOUNT, PRICE, TOTAL FROM LG_225_01_STLINE WHERE STFICHEREF = ${stFicheRef}`);
        console.log("\n📊 CANLI LOGO SUNUCUSUNDAKİ İRSALİYE SATIRLARI (DC / WINGS):");
        console.log(verifyLines.recordset);

        await pool.close();
    } catch(e) {
        console.error("❌ Error on DC:", e.message);
    }
}

insertLineClean();
