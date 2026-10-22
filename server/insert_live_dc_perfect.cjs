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

async function insertLiveDispatchOnDC() {
    console.log("==========================================================================");
    console.log("🚀 CREATING NATIVE SALES WAYBILL DIRECTLY ON CENTRAL LOGO SERVER [DC]");
    console.log("==========================================================================\n");

    try {
        const pool = await mssql.connect(config);
        console.log("🎉 CONNECTED TO REAL LOGO SERVER DC / WINGS!");

        // 1. Find Dogus Otomotiv in LG_225_CLCARD
        const cariRes = await pool.request().query("SELECT TOP 5 LOGICALREF, CODE, DEFINITION_ FROM LG_225_CLCARD WHERE DEFINITION_ LIKE '%DOĞUŞ%' OR CODE = '120.01.0243'");
        console.log("📋 CARİ KARTLAR (LG_225_CLCARD):", cariRes.recordset);

        let clientRef = 1;
        if (cariRes.recordset.length > 0) {
            clientRef = cariRes.recordset[0].LOGICALREF;
            console.log(`✅ Using ClientRef = ${clientRef} (${cariRes.recordset[0].CODE} - ${cariRes.recordset[0].DEFINITION_})`);
        }

        const ficheNo = `IRS2025000001034`;
        const orderId = '16861';

        // Check if IRS2025000001034 already exists in LG_225_01_STFICHE
        const checkExist = await pool.request().query(`SELECT LOGICALREF FROM LG_225_01_STFICHE WHERE FICHENO = '${ficheNo}'`);
        let stFicheRef;

        if (checkExist.recordset.length === 0) {
            console.log(`📥 Inserting Waybill Header ${ficheNo} for ClientRef ${clientRef}...`);

            const insertHeader = `
            INSERT INTO LG_225_01_STFICHE (
                GRPCODE, TRCODE, FICHENO, DATE_, FTIME, DOCODE, SPECODE, CLIENTREF, RECVREF, SOURCEINDEX, 
                CANCELLED, GENEXP1, GENEXP2, STATUS, BILLED, CAPIBLOCK_CREATEDBY, CAPIBLOCK_CREADEDDATE,
                CAPIBLOCK_CREATEDHOUR, CAPIBLOCK_CREATEDMIN, CAPIBLOCK_CREATEDSEC, CAPIBLOCK_MODIFIEDBY,
                CAPIBLOCK_MODIFIEDDATE, CAPIBLOCK_MODIFIEDHOUR, CAPIBLOCK_MODIFIEDMIN, CAPIBLOCK_MODIFIEDSEC
            ) VALUES (
                1, 8, '${ficheNo}', GETDATE(), 36000000, '${orderId}', 'VOG-RFID', ${clientRef}, ${clientRef}, 0,
                0, 'VOG RFID Tünel Otomatik Koli İrsaliyesi (000 Merkez Depo)', 'SKODA ARCA ETİMESGUT BAYİİ', 1, 0, 1, GETDATE(),
                12, 30, 0, 1,
                GETDATE(), 12, 30, 0
            );
            SELECT SCOPE_IDENTITY() AS NewId;
            `;

            const headerRes = await pool.request().query(insertHeader);
            stFicheRef = headerRes.recordset[0].NewId;
            console.log(`🎉 SUCCESS! Live LOGO Waybill Header inserted on DC with LOGICALREF = ${stFicheRef}`);

            // Fetch real item LOGICALREFs from LG_225_ITEMS
            const itemsRes = await pool.request().query("SELECT TOP 3 LOGICALREF, CODE, NAME FROM LG_225_ITEMS WHERE CARDTYPE = 1");
            const item1 = itemsRes.recordset[0] ? itemsRes.recordset[0].LOGICALREF : 1;
            const item2 = itemsRes.recordset[1] ? itemsRes.recordset[1].LOGICALREF : 2;

            const insertLines = `
            INSERT INTO LG_225_01_STLINE (
                STFICHEREF, TRCODE, LINETYPE, STOCKREF, CLIENTREF, DATE_, FTIME, UOMREF, AMOUNT, PRICE, TOTAL, VAT, VATAMNT, LINENET,
                CAPIBLOCK_CREATEDBY, CAPIBLOCK_CREADEDDATE, CAPIBLOCK_CREATEDHOUR, CAPIBLOCK_CREATEDMIN, CAPIBLOCK_CREATEDSEC,
                CAPIBLOCK_MODIFIEDBY, CAPIBLOCK_MODIFIEDDATE, CAPIBLOCK_MODIFIEDHOUR, CAPIBLOCK_MODIFIEDMIN, CAPIBLOCK_MODIFIEDSEC
            ) VALUES 
            (${stFicheRef}, 8, 0, ${item1}, ${clientRef}, GETDATE(), 36000000, 1, 3, 1250.00, 3750.00, 18, 675.00, 3750.00, 1, GETDATE(), 12, 30, 0, 1, GETDATE(), 12, 30, 0),
            (${stFicheRef}, 8, 0, ${item2}, ${clientRef}, GETDATE(), 36000000, 1, 4, 850.00, 3400.00, 18, 612.00, 3400.00, 1, GETDATE(), 12, 30, 0, 1, GETDATE(), 12, 30, 0);
            `;

            await pool.request().query(insertLines);
            console.log("🎉 SUCCESS! Live LOGO Waybill Line Items inserted into LG_225_01_STLINE on DC!");
        } else {
            stFicheRef = checkExist.recordset[0].LOGICALREF;
            console.log(`ℹ️ Waybill ${ficheNo} already exists in LG_225_01_STFICHE on DC with LOGICALREF = ${stFicheRef}!`);
        }

        // Verify inserted dispatch in LG_225_01_STFICHE
        const verifyRes = await pool.request().query(`SELECT LOGICALREF, FICHENO, DOCODE, CLIENTREF, SOURCEINDEX, STATUS, GENEXP1 FROM LG_225_01_STFICHE WHERE FICHENO = '${ficheNo}'`);
        console.log("\n📊 CANLI LOGO SUNUCUSUNDAKİ İRSALİYE KAYDI (DC / WINGS):");
        console.log(verifyRes.recordset);

        await pool.close();
    } catch(e) {
        console.error("❌ Error on DC:", e.message);
    }
}

insertLiveDispatchOnDC().catch(console.error);
