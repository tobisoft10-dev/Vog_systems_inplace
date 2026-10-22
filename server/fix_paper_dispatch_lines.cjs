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

async function fixPaperDispatchLines() {
    console.log("==========================================================================");
    console.log("🛠️ CONVERTING TO KAĞIT İRSALİYESİ (EDESPATCH = 0) & FIXING LINE DETAILS");
    console.log("==========================================================================\n");

    try {
        const pool = await mssql.connect(config);

        const stRef = 25308;

        // 1. Update Header for Paper Waybill (EDESPATCH = 0)
        await pool.request().query(`
            UPDATE LG_225_01_STFICHE 
            SET EDESPATCH = 0, EDESPSTATUS = 0, PROFILEID = 0, STATUS = 0, IOCODE = 3
            WHERE LOGICALREF = ${stRef} OR FICHENO = 'IRS2025000001036';
        `);
        console.log("🎉 SUCCESS! Waybill Header converted to KAĞIT İRSALİYESİ (EDESPATCH = 0)!");

        // 2. Clear old lines for stRef 25308 and insert 100% complete lines with STFICHELNNO, UINFO1, UINFO2
        await pool.request().query(`DELETE FROM LG_225_01_STLINE WHERE STFICHEREF = ${stRef}`);

        const insertLinesSql = `
        INSERT INTO LG_225_01_STLINE (
            STFICHEREF, STFICHELNNO, TRCODE, IOCODE, LINETYPE, STOCKREF, CLIENTREF, DATE_, FTIME, 
            UOMREF, USREF, UINFO1, UINFO2, AMOUNT, PRICE, TOTAL, VAT, VATAMNT, LINENET, LINEEXP, 
            MONTH_, YEAR_, DETLINE, GLOBTRANS, CALCTYPE, BILLED, CANCELLED, GUID
        ) VALUES 
        (${stRef}, 1, 8, 3, 0, 667, 196, GETDATE(), 36000000, 24, 6, 1, 1, 3, 0.00, 0.00, 10, 0.00, 0.00, 'SKODA TEKNİSYEN MONTSU 2026', 8, 2026, 0, 0, 0, 0, 0, UPPER(CAST(NEWID() AS VARCHAR(36)))),
        (${stRef}, 2, 8, 3, 0, 668, 196, GETDATE(), 36000000, 24, 6, 1, 1, 4, 0.00, 0.00, 10, 0.00, 0.00, 'SKODA SERVİS PANTOLONU', 8, 2026, 0, 0, 0, 0, 0, UPPER(CAST(NEWID() AS VARCHAR(36))));
        `;

        await pool.request().query(insertLinesSql);
        console.log("🎉 SUCCESS! Fixed line details (STFICHELNNO = 1, 2, UINFO1 = 1, UINFO2 = 1, EDESPATCH = 0) inserted into LG_225_01_STLINE!");

        // Verify Header
        const hRes = await pool.request().query(`SELECT LOGICALREF, FICHENO, EDESPATCH, EDESPSTATUS, SOURCEINDEX, STATUS FROM LG_225_01_STFICHE WHERE LOGICALREF = ${stRef}`);
        console.log("\n📊 KAĞIT İRSALİYESİ BAŞLIK KARTI:");
        console.log(hRes.recordset);

        // Verify Lines
        const lRes = await pool.request().query(`SELECT LOGICALREF, STFICHEREF, STFICHELNNO, STOCKREF, UINFO1, UINFO2, AMOUNT, PRICE, TOTAL, VAT, UOMREF, LINEEXP FROM LG_225_01_STLINE WHERE STFICHEREF = ${stRef}`);
        console.log("\n📊 KAĞIT İRSALİYESİ DETAY SATIRLARI:");
        console.log(lRes.recordset);

        await pool.close();
    } catch(e) {
        console.error("Error:", e.message);
    }
}

fixPaperDispatchLines().catch(console.error);
