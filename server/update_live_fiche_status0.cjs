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

async function updateFicheStatus() {
    console.log("==========================================================================");
    console.log("🛠️ UPDATING IRS2025000001036 TO STATUS = 0 & USER = 11 (TUBA) ON DC");
    console.log("==========================================================================\n");

    try {
        const pool = await mssql.connect(config);

        // Update STATUS = 0 and CAPIBLOCK_CREATEDBY = 11 (TUBA) / 10 (AYŞEGÜL)
        const updateQuery = `
        UPDATE LG_225_01_STFICHE 
        SET STATUS = 0, CAPIBLOCK_CREATEDBY = 11, CAPIBLOCK_MODIFIEDBY = 11, SOURCEINDEX = 0
        WHERE FICHENO = 'IRS2025000001036';
        `;

        await pool.request().query(updateQuery);
        console.log("🎉 SUCCESS! Updated STATUS = 0 & CAPIBLOCK_CREATEDBY = 11 for IRS2025000001036!");

        const verifyRes = await pool.request().query("SELECT LOGICALREF, FICHENO, DOCODE, CLIENTREF, SOURCEINDEX, STATUS, CAPIBLOCK_CREATEDBY, GENEXP1 FROM LG_225_01_STFICHE WHERE FICHENO = 'IRS2025000001036'");
        console.log("\n📊 GÜNCELLENEN İRSALİYE KART BİLGİSİ:");
        console.log(verifyRes.recordset);

        await pool.close();
    } catch(e) {
        console.error("Error:", e.message);
    }
}

updateFicheStatus().catch(console.error);
