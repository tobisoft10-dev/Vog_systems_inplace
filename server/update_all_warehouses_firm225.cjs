const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runSqlCmd(query, db = 'SIPARIS') {
    try {
        const tmpFile = path.join(__dirname, `tmp_wh_${Date.now()}.json`);
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

async function updateAllWarehouses() {
    console.log("==========================================================================");
    console.log("🚀 FİRMA 225 TÜM AMBARLAR (AMBAR 0 & AMBAR 1) İRSALİYE GÜNCELLEMESİ");
    console.log("==========================================================================\n");

    const orderId = '16861';

    runSqlCmdNonQuery("UPDATE LG_225_01_STFICHE SET SOURCEINDEX = 0", 'SIPARIS');

    const insertQuery = `
    IF NOT EXISTS (SELECT * FROM LG_225_01_STFICHE WHERE FICHENO = 'IRS-16861-MERKEZ')
    BEGIN
        INSERT INTO LG_225_01_STFICHE (GRPCODE, TRCODE, FICHENO, DOCNUMBER, SPECODE, CLIENTREF, RECVREF, SOURCEINDEX, CANCELLED, GENEXP1, GENEXP2, STATUS, BILLED)
        VALUES (1, 8, 'IRS-16861-MERKEZ', '${orderId}', 'VOG-RFID', 1, 1, 0, 0, 'VOG RFID Tünel Otomatik Koli İrsaliyesi (Merkez Ambar)', 'DOĞUŞ OTOMOTİV SERVİS VE TİCARET A.Ş.', 1, 0);

        DECLARE @RefMerkez INT = SCOPE_IDENTITY();

        INSERT INTO LG_225_01_STLINE (STFICHEREF, LINETYPE, STOCKREF, CLIENTREF, UOMREF, QTY, PRICE, TOTAL, VAT, VATAMNT, LINENET)
        VALUES 
        (@RefMerkez, 0, 101, 1, 1, 3, 1250.00, 3750.00, 18, 675.00, 3750.00),
        (@RefMerkez, 0, 102, 1, 1, 4, 850.00, 3400.00, 18, 612.00, 3400.00),
        (@RefMerkez, 0, 103, 1, 1, 4, 450.00, 1800.00, 18, 324.00, 1800.00);
    END;
    `;

    runSqlCmdNonQuery(insertQuery, 'SIPARIS');

    console.log("\n📊 GÜNCELLENMİŞ İRSALİYE LİSTESİ (LG_225_01_STFICHE):");
    console.log(runSqlCmd("SELECT LOGICALREF, GRPCODE, TRCODE, FICHENO, DOCNUMBER, SOURCEINDEX, CLIENTREF, GENEXP1, STATUS FROM LG_225_01_STFICHE"));
}

updateAllWarehouses().catch(console.error);
