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

async function compare25312Vs25311() {
    console.log("==========================================================================");
    console.log("🔍 COMPARING OUR NEWEST FICHE (25312) VS REAL WORKING FICHE (25311)");
    console.log("==========================================================================\n");

    try {
        const pool = await mssql.connect(config);

        const ourRes = await pool.request().query("SELECT * FROM LG_225_01_STFICHE WHERE LOGICALREF = 25312");
        const ourFiche = ourRes.recordset[0];

        const realRes = await pool.request().query("SELECT * FROM LG_225_01_STFICHE WHERE LOGICALREF = 25311");
        const realFiche = realRes.recordset[0];

        const diffs = [];
        const keys = Object.keys(realFiche);

        for (const k of keys) {
            const rVal = realFiche[k];
            const oVal = ourFiche[k];
            if (String(rVal) !== String(oVal)) {
                diffs.push({
                    Column: k,
                    Real_LOGO_25311: rVal,
                    Our_Inserted_25312: oVal
                });
            }
        }

        console.log(`⚠️ FOUND ${diffs.length} COLUMN DIFFERENCES BETWEEN REAL (25311) VS OURS (25312):`);
        console.table(diffs);

        await pool.close();
    } catch(e) {
        console.error("Error:", e.message);
    }
}

compare25312Vs25311().catch(console.error);
