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

async function findUserId() {
    console.log("==========================================================================");
    console.log("🔍 FINDING LOGO USER ID FOR 'deporfid' & OTHER LOGO USERS ON DC");
    console.log("==========================================================================\n");

    try {
        const pool = await mssql.connect(config);

        // Check L_CAPIUSER table if exists
        try {
            const userRes = await pool.request().query("SELECT NR, NAME, KEYWORD FROM L_CAPIUSER ORDER BY NR");
            console.log("📋 LOGO KULLANICI LİSTESİ (L_CAPIUSER):");
            console.log(userRes.recordset);
        } catch(e) {
            console.log("L_CAPIUSER query error:", e.message);
        }

        // Check CAPIBLOCK_CREATEDBY distinct values in LG_225_01_STFICHE
        const createdByRes = await pool.request().query("SELECT DISTINCT CAPIBLOCK_CREATEDBY, COUNT(*) AS FicheCount FROM LG_225_01_STFICHE GROUP BY CAPIBLOCK_CREATEDBY ORDER BY FicheCount DESC");
        console.log("\n📋 CANLI İRSALİYELERDEKİ EKLEYEN KULLANICI ID'LERİ (CAPIBLOCK_CREATEDBY):");
        console.log(createdByRes.recordset);

        // Check recent fiches created by real LOGO users
        const recentFiches = await pool.request().query("SELECT TOP 5 LOGICALREF, FICHENO, DOCODE, CLIENTREF, SOURCEINDEX, CAPIBLOCK_CREATEDBY, STATUS FROM LG_225_01_STFICHE ORDER BY LOGICALREF DESC");
        console.log("\n📋 EN SON EKLENEN İRSALİYELERİN EKLEYEN KULLANICI ID'LERİ:");
        console.log(recentFiches.recordset);

        await pool.close();
    } catch(e) {
        console.error("Error:", e.message);
    }
}

findUserId().catch(console.error);
