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

async function inspectSampleFiche() {
    console.log("==========================================================================");
    console.log("🔍 INSPECTING SAMPLE LIVE DISPATCH IN LOGO (TRCODE = 8 & IOCODE = 3)");
    console.log("==========================================================================\n");

    try {
        const pool = await mssql.connect(config);

        // Fetch a real sample live dispatch header
        const sampleHeaderRes = await pool.request().query(`
            SELECT TOP 1 * FROM LG_225_01_STFICHE 
            WHERE TRCODE = 8 AND IOCODE = 3 AND LOGICALREF < 25000
            ORDER BY LOGICALREF DESC
        `);

        if (sampleHeaderRes.recordset.length > 0) {
            const sample = sampleHeaderRes.recordset[0];
            console.log("📋 LIVE SAMPLE HEADER VALUES (LOGICALREF = " + sample.LOGICALREF + "):");
            console.log("   FICHENO:", sample.FICHENO);
            console.log("   TRCODE:", sample.TRCODE, "| IOCODE:", sample.IOCODE, "| GRPCODE:", sample.GRPCODE);
            console.log("   SOURCEINDEX:", sample.SOURCEINDEX, "| STATUS:", sample.STATUS);
            console.log("   CLIENTREF:", sample.CLIENTREF, "| RECVREF:", sample.RECVREF);
            console.log("   GUID:", sample.GUID);
            console.log("   RECHASH:", sample.RECHASH);
            console.log("   DOCDATE:", sample.DOCDATE, "| DOCTIME:", sample.DOCTIME);
            console.log("   CAPIBLOCK_CREATEDBY:", sample.CAPIBLOCK_CREATEDBY);
        }

        // Fetch sample line item
        const sampleLineRes = await pool.request().query(`
            SELECT TOP 1 * FROM LG_225_01_STLINE 
            WHERE TRCODE = 8 AND IOCODE = 3 AND STFICHEREF < 25000
            ORDER BY LOGICALREF DESC
        `);

        if (sampleLineRes.recordset.length > 0) {
            const lineSample = sampleLineRes.recordset[0];
            console.log("\n📋 LIVE SAMPLE LINE ITEM VALUES (LOGICALREF = " + lineSample.LOGICALREF + "):");
            console.log("   STOCKREF:", lineSample.STOCKREF);
            console.log("   UOMREF:", lineSample.UOMREF, "| USREF:", lineSample.USREF);
            console.log("   VAT:", lineSample.VAT, "| VATAMNT:", lineSample.VATAMNT);
            console.log("   AMOUNT:", lineSample.AMOUNT, "| PRICE:", lineSample.PRICE, "| TOTAL:", lineSample.TOTAL);
            console.log("   LINEEXP:", lineSample.LINEEXP);
            console.log("   MONTH_:", lineSample.MONTH_, "| YEAR_:", lineSample.YEAR_);
            console.log("   GUID:", lineSample.GUID);
        }

        await pool.close();
    } catch(e) {
        console.error("Error:", e.message);
    }
}

inspectSampleFiche().catch(console.error);
