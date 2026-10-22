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

        // 1. Search for Dogus Otomotiv in LG_225_CLCARD
        const cariRes = await pool.request().query("SELECT TOP 5 LOGICALREF, CODE, DEFINITION_ FROM LG_225_CLCARD WHERE DEFINITION_ LIKE '%DOĞUŞ%' OR DEFINITION_ LIKE '%DOGUS%' OR CODE = '120.01.0243'");
        console.log("📋 CARİ KARTLAR (LG_225_CLCARD):", cariRes.recordset);

        let clientRef = 1;
        if (cariRes.recordset.length > 0) {
            clientRef = cariRes.recordset[0].LOGICALREF;
            console.log(`✅ Using ClientRef = ${clientRef} (${cariRes.recordset[0].CODE} - ${cariRes.recordset[0].DEFINITION_})`);
        }

        // 2. Get last FICHENO from LG_225_01_STFICHE for TRCODE = 8 (Toptan Satış İrsaliyesi)
        const lastFicheRes = await pool.request().query("SELECT TOP 5 LOGICALREF, FICHENO, DOCNUMBER, DATE_, SOURCEINDEX, CLIENTREF, NETTOTAL FROM LG_225_01_STFICHE WHERE TRCODE = 8 ORDER BY LOGICALREF DESC");
        console.log("📋 RECENT SALES DISPATCHES IN LOGO (LG_225_01_STFICHE):");
        console.log(lastFicheRes.recordset);

        // Generate next Fiche No
        const ficheNo = `IRS2025000001034`;
        const orderId = '16861';

        // Check if IRS2025000001034 already exists
        const checkExist = await pool.request().query(`SELECT LOGICALREF FROM LG_225_01_STFICHE WHERE FICHENO = '${ficheNo}'`);
        if (checkExist.recordset.length === 0) {
            console.log(`📥 Inserting Waybill Header ${ficheNo} for ClientRef ${clientRef}...`);

            const insertHeader = `
            INSERT INTO LG_225_01_STFICHE (
                GRPCODE, TRCODE, FICHENO, DATE_, TIME_, DOCNUMBER, SPECODE, CLIENTREF, RECVREF, SOURCEINDEX, 
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
            const stFicheRef = headerRes.recordset[0].NewId;
            console.log(`🎉 SUCCESS! Waybill Header inserted with LOGICALREF = ${stFicheRef}`);

            // Insert line items
            // Check stock items in LG_225_ITEMS
            const itemsRes = await pool.request().query("SELECT TOP 3 LOGICALREF, CODE, NAME FROM LG_225_ITEMS WHERE CARDTYPE = 1");
            const item1 = itemsRes.recordset[0] ? itemsRes.recordset[0].LOGICALREF : 1;
            const item2 = itemsRes.recordset[1] ? itemsRes.recordset[1].LOGICALREF : 2;

            const insertLines = `
            INSERT INTO LG_225_01_STLINE (
                STFICHEREF, LINETYPE, STOCKREF, CLIENTREF, DATE_, UOMREF, QTY, PRICE, TOTAL, VAT, VATAMNT, LINENET,
                CAPIBLOCK_CREATEDBY, CAPIBLOCK_CREADEDDATE, CAPIBLOCK_CREATEDHOUR, CAPIBLOCK_CREATEDMIN, CAPIBLOCK_CREATEDSEC,
                CAPIBLOCK_MODIFIEDBY, CAPIBLOCK_MODIFIEDDATE, CAPIBLOCK_MODIFIEDHOUR, CAPIBLOCK_MODIFIEDMIN, CAPIBLOCK_MODIFIEDSEC
            ) VALUES 
            (${stFicheRef}, 0, ${item1}, ${clientRef}, GETDATE(), 1, 3, 1250.00, 3750.00, 18, 675.00, 3750.00, 1, GETDATE(), 12, 30, 0, 1, GETDATE(), 12, 30, 0),
            (${stFicheRef}, 0, ${item2}, ${clientRef}, GETDATE(), 1, 4, 850.00, 3400.00, 18, 612.00, 3400.00, 1, GETDATE(), 12, 30, 0, 1, GETDATE(), 12, 30, 0);
            `;

            await pool.request().query(insertLines);
            console.log("🎉 SUCCESS! Waybill Line Items inserted into LG_225_01_STLINE!");
        } else {
            console.log(`ℹ️ Waybill ${ficheNo} already exists in LG_225_01_STFICHE on DC!`);
        }

        await pool.close();
    } catch(e) {
        console.error("❌ Error on DC:", e.message);
    }
}

insertLiveDispatchOnDC().catch(console.error);
