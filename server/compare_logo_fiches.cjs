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

async function compareFiches() {
    console.log("==========================================================================");
    console.log("🔍 COMPARING REAL UI DISPATCH VS OUR INSERTED DISPATCH IN LOGO (DC WINGS)");
    console.log("==========================================================================\n");

    try {
        const pool = await mssql.connect(config);

        // Fetch a real UI-created sales waybill (TRCODE = 8)
        const realRes = await pool.request().query("SELECT TOP 1 * FROM LG_225_01_STFICHE WHERE TRCODE = 8 AND FICHENO LIKE 'IRS%' AND LOGICALREF <> 25303 AND LOGICALREF <> 4047 ORDER BY LOGICALREF DESC");
        const realFiche = realRes.recordset[0];

        // Fetch our inserted waybill (LOGICALREF = 25303 or IRS2025000001036)
        const ourRes = await pool.request().query("SELECT TOP 1 * FROM LG_225_01_STFICHE WHERE FICHENO = 'IRS2025000001036' OR LOGICALREF = 25303");
        const ourFiche = ourRes.recordset[0];

        if (!realFiche || !ourFiche) {
            console.log("Could not find both fiches to compare!");
            process.exit(0);
        }

        console.log(`REAL DISPATCH: FICHENO = ${realFiche.FICHENO} (LOGICALREF = ${realFiche.LOGICALREF})`);
        console.log(`OUR DISPATCH:  FICHENO = ${ourFiche.FICHENO} (LOGICALREF = ${ourFiche.LOGICALREF})\n`);

        const diffs = [];
        const keys = Object.keys(realFiche);

        for (const key of keys) {
            const realVal = realFiche[key];
            const ourVal = ourFiche[key];
            if (String(realVal) !== String(ourVal)) {
                diffs.push({
                    Column: key,
                    Real_LOGO_Value: realVal,
                    Our_Inserted_Value: ourVal
                });
            }
        }

        console.log(`⚠️ FOUND ${diffs.length} COLUMN DIFFERENCES BETWEEN REAL LOGO DISPATCH VS OUR DISPATCH:`);
        console.table(diffs);

        await pool.close();
    } catch(e) {
        console.error("Error:", e.message);
    }
}

compareFiches().catch(console.error);
