const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runSqlCmd(query, db = 'SIPARIS') {
    try {
        const tmpFile = path.join(__dirname, `tmp_single_${Date.now()}.json`);
        const cleanQuery = query.replace(/\r?\n/g, ' ');
        const cmd = `sqlcmd -S .\\SQLEXPRESS -d ${db} -U sa -P "150609%M" -f 65001 -w 65535 -y 0 -o "${tmpFile}" -Q "SET NOCOUNT ON; ${cleanQuery} FOR JSON PATH"`;
        execSync(cmd, { stdio: 'ignore' });
        if (fs.existsSync(tmpFile)) {
            const raw = fs.readFileSync(tmpFile, 'utf8');
            try { fs.unlinkSync(tmpFile); } catch (e) {}
            const jsonStr = raw.split(/\r?\n/).map(l => l.trim()).join('');
            if (jsonStr) return JSON.parse(jsonStr);
        }
    } catch (e) {}
    return [];
}

function runSqlCmdNonQuery(query, db = 'SIPARIS') {
    try {
        const cleanQuery = query.replace(/\r?\n/g, ' ');
        const cmd = `sqlcmd -S .\\SQLEXPRESS -d ${db} -U sa -P "150609%M" -Q "${cleanQuery}"`;
        execSync(cmd, { stdio: 'ignore' });
        return true;
    } catch (e) {
        console.error("sqlcmd nonquery error:", e.message);
        return false;
    }
}

async function keepSingleFiche() {
    console.log("==========================================================================");
    console.log("🧹 LOGO TIGER FİRMA 225 - SADECE 1 ADET TEK İRSALİYE FİŞİ BIZAKILIYOR");
    console.log("==========================================================================\n");

    runSqlCmdNonQuery("DELETE FROM LG_225_01_STLINE WHERE STFICHEREF <> 1", 'SIPARIS');
    runSqlCmdNonQuery("DELETE FROM LG_225_01_STFICHE WHERE LOGICALREF <> 1", 'SIPARIS');
    runSqlCmdNonQuery("UPDATE LG_225_01_STFICHE SET FICHENO = 'IRS-16861-0001', SOURCEINDEX = 0 WHERE LOGICALREF = 1", 'SIPARIS');

    console.log("\n📊 KALAN TEK İRSALİYE FİŞİ (LG_225_01_STFICHE):");
    console.log(runSqlCmd("SELECT LOGICALREF, GRPCODE, TRCODE, FICHENO, DOCNUMBER, SOURCEINDEX, CLIENTREF, GENEXP1, STATUS FROM LG_225_01_STFICHE"));

    console.log("\n📊 TEK İRSALİYE SATIRLARI (LG_225_01_STLINE):");
    console.log(runSqlCmd("SELECT LOGICALREF, STFICHEREF, STOCKREF, QTY, PRICE, TOTAL FROM LG_225_01_STLINE"));
}

keepSingleFiche().catch(console.error);
