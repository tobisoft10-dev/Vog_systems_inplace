const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runSqlCmd(query, db = 'SIPARIS') {
    try {
        const tmpFile = path.join(__dirname, `tmp_d000_${Date.now()}.json`);
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

async function updateDepo000Merkez() {
    console.log("==========================================================================");
    console.log("🏬 DEPO 000 MERKEZ GÜNCELLEMESİ (LG_225_01_STFICHE)");
    console.log("==========================================================================\n");

    const updateQuery = `
    UPDATE LG_225_01_STFICHE 
    SET SOURCEINDEX = 0, GENEXP1 = 'VOG RFID Tünel Otomatik Koli İrsaliyesi (000 Merkez Depo)'
    WHERE LOGICALREF = 1 OR FICHENO LIKE 'IRS-16861%';
    `;

    runSqlCmdNonQuery(updateQuery, 'SIPARIS');

    console.log("\n📊 DEPO 000 MERKEZ GÜNCEL İRSALİYE KAYDI (LG_225_01_STFICHE):");
    console.log(runSqlCmd("SELECT LOGICALREF, GRPCODE, TRCODE, FICHENO, DOCNUMBER, SOURCEINDEX, CLIENTREF, GENEXP1, STATUS FROM LG_225_01_STFICHE"));
}

updateDepo000Merkez().catch(console.error);
