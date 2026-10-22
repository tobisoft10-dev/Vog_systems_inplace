const mssql = require('mssql');
const { v4: uuidv4 } = require('uuid');

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

function generateGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    }).toUpperCase();
}

async function fixExactLogoDispatch() {
    console.log("==========================================================================");
    console.log("🛠️ FIXING ALL LOGO DISPATCH FIELDS ON CENTRAL SERVER DC (WINGS)");
    console.log("==========================================================================\n");

    try {
        const pool = await mssql.connect(config);

        const defaultHash = 'g8iN6YXy7PFewlh8H9CoZPq1SgSNF430T5YS5732hvDB7ZvE6wRESiNpGDiFpp1U';
        const curMonth = new Date().getMonth() + 1;
        const curYear = new Date().getFullYear();

        // 1. Update Headers in LG_225_01_STFICHE for test irsaliyes
        const updateHeaderQuery = `
        UPDATE LG_225_01_STFICHE 
        SET 
            IOCODE = 3,
            GRPCODE = 2,
            STATUS = 0,
            SOURCEINDEX = 0,
            DOCDATE = GETDATE(),
            DOCTIME = 171125248,
            GUID = ISNULL(GUID, UPPER(CAST(NEWID() AS VARCHAR(36)))),
            RECHASH = ISNULL(RECHASH, '${defaultHash}'),
            CAPIBLOCK_CREATEDBY = 11,
            CAPIBLOCK_MODIFIEDBY = 11,
            GROSSTOTAL = 0.00,
            NETTOTAL = 0.00,
            TOTALVAT = 0.00
        WHERE FICHENO LIKE 'IRS2025%' OR FICHENO LIKE 'IRS2026%' OR DOCODE = '16861';
        `;

        await pool.request().query(updateHeaderQuery);
        console.log("🎉 SUCCESS! Updated Header fields (IOCODE = 3, GRPCODE = 2, STATUS = 0, GUID, RECHASH, DOCDATE/DOCTIME)");

        // 2. Update Lines in LG_225_01_STLINE
        const updateLinesQuery = `
        UPDATE L 
        SET 
            L.IOCODE = 3,
            L.TRCODE = 8,
            L.VAT = 10,
            L.VATAMNT = 0.00,
            L.UOMREF = 24,
            L.USREF = 24,
            L.PRICE = 0.00,
            L.TOTAL = 0.00,
            L.LINENET = 0.00,
            L.MONTH_ = ${curMonth},
            L.YEAR_ = ${curYear},
            L.GUID = ISNULL(L.GUID, UPPER(CAST(NEWID() AS VARCHAR(36)))),
            L.LINEEXP = ISNULL(L.LINEEXP, I.NAME)
        FROM LG_225_01_STLINE L
        INNER JOIN LG_225_01_STFICHE F ON L.STFICHEREF = F.LOGICALREF
        LEFT JOIN LG_225_ITEMS I ON L.STOCKREF = I.LOGICALREF
        WHERE F.FICHENO LIKE 'IRS2025%' OR F.FICHENO LIKE 'IRS2026%' OR F.DOCODE = '16861';
        `;

        await pool.request().query(updateLinesQuery);
        console.log("🎉 SUCCESS! Updated Line Item fields (IOCODE = 3, VAT = 10, UOMREF = 24, PRICE = 0, TOTAL = 0, MONTH_ = " + curMonth + ", YEAR_ = " + curYear + ", GUID, LINEEXP)");

        // Verify Header
        const headerRes = await pool.request().query("SELECT TOP 2 LOGICALREF, FICHENO, DOCODE, GRPCODE, TRCODE, IOCODE, SOURCEINDEX, STATUS, GUID, RECHASH, DOCDATE, DOCTIME, CAPIBLOCK_CREATEDBY FROM LG_225_01_STFICHE WHERE FICHENO LIKE 'IRS2025%' ORDER BY LOGICALREF DESC");
        console.log("\n📊 GÜNCELLENEN İRSALİYE BAŞLIK KARTI (LG_225_01_STFICHE):");
        console.log(headerRes.recordset);

        // Verify Lines
        const lineRes = await pool.request().query("SELECT TOP 2 LOGICALREF, STFICHEREF, STOCKREF, IOCODE, VAT, UOMREF, LINEEXP, AMOUNT, PRICE, TOTAL, MONTH_, YEAR_, GUID FROM LG_225_01_STLINE WHERE STFICHEREF IN (SELECT LOGICALREF FROM LG_225_01_STFICHE WHERE FICHENO LIKE 'IRS2025%') ORDER BY LOGICALREF DESC");
        console.log("\n📊 GÜNCELLENEN İRSALİYE SATIRLARI (LG_225_01_STLINE):");
        console.log(lineRes.recordset);

        await pool.close();
    } catch(e) {
        console.error("Error:", e.message);
    }
}

fixExactLogoDispatch().catch(console.error);
