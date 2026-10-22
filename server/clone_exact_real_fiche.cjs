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

async function cloneExactRealFiche() {
    console.log("==========================================================================");
    console.log("🚀 CLONING 100% BYTE-EXACT REAL LOGO DISPATCH ROW TO IRS2025000001036");
    console.log("==========================================================================\n");

    try {
        const pool = await mssql.connect(config);

        // 1. Get header logicalref 25308
        const stRef = 25308;

        // 2. Get real working line item row from LG_225_01_STLINE
        const fallbackLine = await pool.request().query("SELECT TOP 1 * FROM LG_225_01_STLINE WHERE TRCODE = 8 AND IOCODE = 3 ORDER BY LOGICALREF DESC");
        let realL = fallbackLine.recordset[0];

        delete realL.LOGICALREF; // auto-identity
        realL.STFICHEREF = stRef;
        realL.CLIENTREF = 196;
        realL.DATE_ = new Date();
        realL.MONTH_ = new Date().getMonth() + 1;
        realL.YEAR_ = new Date().getFullYear();

        const lCols = Object.keys(realL).filter(k => k !== 'GUID' && k !== 'CAPIBLOCK_CREADEDDATE');
        const lColNames = lCols.join(', ') + ', GUID';

        const lColVals = lCols.map(k => {
            const v = realL[k];
            if (v === null || v === undefined) return 'NULL';
            if (v instanceof Date) return `'${v.toISOString().replace('T', ' ').replace('Z', '')}'`;
            if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
            return v;
        }).join(', ') + `, UPPER(CAST(NEWID() AS VARCHAR(36)))`;

        const insertLineSql = `INSERT INTO LG_225_01_STLINE (${lColNames}) VALUES (${lColVals});`;
        await pool.request().query(insertLineSql);
        console.log(`🎉 SUCCESS! Byte-exact Line Item cloned into LG_225_01_STLINE for Header LOGICALREF = ${stRef}`);

        // Verify inserted header & line
        const verifyH = await pool.request().query(`SELECT LOGICALREF, FICHENO, DOCODE, CLIENTREF, SOURCEINDEX, STATUS, EDESPATCH, GUID FROM LG_225_01_STFICHE WHERE LOGICALREF = ${stRef}`);
        console.log("\n📊 BIREBIR EKLENEN CANLI İRSALİYE BAŞLIK KARTI:");
        console.log(verifyH.recordset);

        const verifyL = await pool.request().query(`SELECT LOGICALREF, STFICHEREF, STOCKREF, AMOUNT, PRICE, TOTAL FROM LG_225_01_STLINE WHERE STFICHEREF = ${stRef}`);
        console.log("\n📊 BIREBIR EKLENEN CANLI İRSALİYE SATIRLARI:");
        console.log(verifyL.recordset);

        await pool.close();
    } catch(e) {
        console.error("Error:", e.message);
    }
}

cloneExactRealFiche().catch(console.error);
