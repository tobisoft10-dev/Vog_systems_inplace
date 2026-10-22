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

async function insertLines() {
    try {
        const pool = await mssql.connect(config);

        const stRef = 25308;
        const clientRef = 196;

        const itemsRes = await pool.request().query("SELECT TOP 2 LOGICALREF, CODE, NAME FROM LG_225_ITEMS WHERE CARDTYPE = 1");
        const s1 = itemsRes.recordset[0] ? itemsRes.recordset[0].LOGICALREF : 667;
        const n1 = itemsRes.recordset[0] ? itemsRes.recordset[0].NAME.replace(/'/g, "''") : 'SKODA TEKNİSYEN MONTSU 2026';
        const s2 = itemsRes.recordset[1] ? itemsRes.recordset[1].LOGICALREF : 668;
        const n2 = itemsRes.recordset[1] ? itemsRes.recordset[1].NAME.replace(/'/g, "''") : 'SKODA SERVİS PANTOLONU';

        const curMonth = new Date().getMonth() + 1;
        const curYear = new Date().getFullYear();

        const insertSql = `
        INSERT INTO LG_225_01_STLINE (
            STFICHEREF, TRCODE, IOCODE, LINETYPE, STOCKREF, CLIENTREF, DATE_, FTIME, UOMREF, USREF,
            AMOUNT, PRICE, TOTAL, VAT, VATAMNT, LINENET, LINEEXP, MONTH_, YEAR_, GUID
        ) VALUES 
        (${stRef}, 8, 3, 0, ${s1}, ${clientRef}, GETDATE(), 36000000, 24, 24, 3, 0.00, 0.00, 10, 0.00, 0.00, '${n1}', ${curMonth}, ${curYear}, UPPER(CAST(NEWID() AS VARCHAR(36)))),
        (${stRef}, 8, 3, 0, ${s2}, ${clientRef}, GETDATE(), 36000000, 24, 24, 4, 0.00, 0.00, 10, 0.00, 0.00, '${n2}', ${curMonth}, ${curYear}, UPPER(CAST(NEWID() AS VARCHAR(36))));
        `;

        await pool.request().query(insertSql);
        console.log("🎉 SUCCESS! Lines inserted into LG_225_01_STLINE for Header 25308!");

        const lRes = await pool.request().query(`SELECT LOGICALREF, STFICHEREF, STOCKREF, AMOUNT, PRICE, TOTAL, VAT, UOMREF, LINEEXP, GUID FROM LG_225_01_STLINE WHERE STFICHEREF = ${stRef}`);
        console.log("\n📊 EKLENEN İRSALİYE SATIR BİLGİLERİ:");
        console.log(lRes.recordset);

        await pool.close();
    } catch(e) {
        console.error("Error:", e.message);
    }
}

insertLines().catch(console.error);
