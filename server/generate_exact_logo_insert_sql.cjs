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

async function testExactMatchingColumns() {
    console.log("==========================================================================");
    console.log("🔍 GENERATING EXACT MATCHING LOGO SCHEMA INSERT STATEMENTS");
    console.log("==========================================================================\n");

    try {
        const pool = await mssql.connect(config);

        // Fetch sample real paper waybill row (LOGICALREF = 25267)
        const headerRes = await pool.request().query("SELECT TOP 1 * FROM LG_225_01_STFICHE WHERE LOGICALREF = 25267");
        const headerSample = headerRes.recordset[0];

        const lineRes = await pool.request().query("SELECT TOP 1 * FROM LG_225_01_STLINE WHERE STFICHEREF = 25267");
        const lineSample = lineRes.recordset[0];

        // Prepare Header Insert Column List & Default Values mapping
        const headerCols = Object.keys(headerSample).filter(k => k !== 'LOGICALREF');
        console.log(`STFICHE Column Count (excl. LOGICALREF): ${headerCols.length}`);

        const lineCols = Object.keys(lineSample).filter(k => k !== 'LOGICALREF');
        console.log(`STLINE Column Count (excl. LOGICALREF): ${lineCols.length}`);

        // Helper function to build SQL value for a column based on real LOGO default sample
        function buildHeaderValue(colName, orderId, headerGuid) {
            const defaultHash = 'g8iN6YXy7PFewlh8H9CoZPq1SgSNF430T5YS5732hvDB7ZvE6wRESiNpGDiFpp1U';
            if (colName === 'FICHENO') return "''";
            if (colName === 'DOCODE') return `'${orderId}'`;
            if (colName === 'SPECODE') return "'VOG-RFID'";
            if (colName === 'GUID') return `'${headerGuid}'`;
            if (colName === 'RECHASH') return `'${defaultHash}'`;
            if (colName === 'DATE_' || colName === 'DOCDATE' || colName === 'SHIPDATE') return "CONVERT(datetime, CONVERT(date, GETDATE()))";
            if (colName === 'CAPIBLOCK_CREADEDDATE' || colName === 'CAPIBLOCK_MODIFIEDDATE') return "GETDATE()";
            if (colName === 'GENEXP1') return "'VOG RFID Koli İrsaliyesi'";
            if (colName === 'CLIENTREF' || colName === 'RECVREF') return '196';
            if (colName === 'CAPIBLOCK_CREATEDBY' || colName === 'CAPIBLOCK_MODIFIEDBY') return '11';
            if (colName === 'CAPIBLOCK_CREATEDHOUR' || colName === 'CAPIBLOCK_MODIFIEDHOUR') return '12';
            if (colName === 'CAPIBLOCK_CREATEDMIN' || colName === 'CAPIBLOCK_MODIFIEDMIN') return '30';
            
            const sampleVal = headerSample[colName];
            if (sampleVal === null) return "NULL";
            if (typeof sampleVal === 'number') return String(sampleVal);
            if (typeof sampleVal === 'string') return `'${sampleVal.replace(/'/g, "''")}'`;
            if (sampleVal instanceof Date) return "CONVERT(datetime, CONVERT(date, GETDATE()))";
            return "0";
        }

        function buildLineValue(colName, stFicheRef, lineNo, item, lineGuid) {
            const curMonth = new Date().getMonth() + 1;
            const curYear = new Date().getFullYear();
            const cleanName = (item.name || 'Koli Ürünü').replace(/'/g, "''");

            if (colName === 'STFICHEREF') return String(stFicheRef);
            if (colName === 'STFICHELNNO') return String(lineNo);
            if (colName === 'STOCKREF') return String(item.stockRef || 667);
            if (colName === 'AMOUNT') return String(item.qty || 1);
            if (colName === 'LINEEXP') return `'${cleanName}'`;
            if (colName === 'GUID') return `'${lineGuid}'`;
            if (colName === 'CLIENTREF') return '196';
            if (colName === 'DATE_') return "CONVERT(datetime, CONVERT(date, GETDATE()))";
            if (colName === 'MONTH_') return String(curMonth);
            if (colName === 'YEAR_') return String(curYear);
            if (colName === 'UOMREF') return '24';
            if (colName === 'USREF') return '6';
            if (colName === 'UINFO1' || colName === 'UINFO2') return '1';
            if (colName === 'VAT') return '10';

            const sampleVal = lineSample[colName];
            if (sampleVal === null) return "NULL";
            if (typeof sampleVal === 'number') return String(sampleVal);
            if (typeof sampleVal === 'string') return `'${sampleVal.replace(/'/g, "''")}'`;
            if (sampleVal instanceof Date) return "CONVERT(datetime, CONVERT(date, GETDATE()))";
            return "0";
        }

        // Test SQL generation
        const headerGuid = require('uuid').v4().toUpperCase();
        const headerValuesSql = headerCols.map(c => buildHeaderValue(c, '16875', headerGuid)).join(', ');
        const insertHeaderSql = `INSERT INTO LG_225_01_STFICHE (${headerCols.join(', ')}) VALUES (${headerValuesSql}); SELECT SCOPE_IDENTITY() AS NewId;`;

        console.log("\n🧪 TESTING EXECUTING STFICHE INSERT SQL...");
        const hRes = await pool.request().query(insertHeaderSql);
        const newStRef = hRes.recordset[0].NewId;
        console.log(`🎉 STFICHE INSERT SUCCESSFUL! LOGICALREF = ${newStRef}`);

        const item = { stockRef: 667, name: 'SKODA TEKNİSYEN MONTSU 2026', qty: 5 };
        const lineGuid = require('uuid').v4().toUpperCase();
        const lineValuesSql = lineCols.map(c => buildLineValue(c, newStRef, 1, item, lineGuid)).join(', ');
        const insertLineSql = `INSERT INTO LG_225_01_STLINE (${lineCols.join(', ')}) VALUES (${lineValuesSql});`;

        console.log("\n🧪 TESTING EXECUTING STLINE INSERT SQL...");
        await pool.request().query(insertLineSql);
        console.log(`🎉 STLINE INSERT SUCCESSFUL FOR STFICHEREF = ${newStRef}!`);

        // Check inserted record
        const checkRes = await pool.request().query(`SELECT LOGICALREF, FICHENO, DOCODE, TRCODE, IOCODE, EDESPATCH, STATUS, DATE_, DOCDATE FROM LG_225_01_STFICHE WHERE LOGICALREF = ${newStRef}`);
        console.log("\n📊 VERİTABANINA YAZILAN YENİ NUMARASIZ KAĞIT İRSALİYESİ KARTI:");
        console.log(checkRes.recordset[0]);

        await pool.close();
    } catch(e) {
        console.error("Error:", e.message);
    }
}

testExactMatchingColumns().catch(console.error);
