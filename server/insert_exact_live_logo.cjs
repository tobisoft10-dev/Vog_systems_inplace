const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runSqlCmd(query, db = 'SIPARIS') {
    try {
        const tmpFile = path.join(__dirname, `tmp_live_${Date.now()}.json`);
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

async function insertExactLiveLogo() {
    console.log("==========================================================================");
    console.log("🚀 CANLI LOGO FORMATINDA BİREBİR İRSALİYE EKLENİYOR (IRS2025000001034)");
    console.log("==========================================================================\n");

    runSqlCmdNonQuery("TRUNCATE TABLE LG_225_01_STLINE", 'SIPARIS');
    runSqlCmdNonQuery("TRUNCATE TABLE LG_225_01_STFICHE", 'SIPARIS');

    const query = `
    IF NOT EXISTS (SELECT * FROM LG_225_CLCARD WHERE CODE = '120.01.0243')
    BEGIN
        INSERT INTO LG_225_CLCARD (CODE, DEFINITION_, CARDTYPE, ACTIVE)
        VALUES ('120.01.0243', 'DOĞUŞ OTOMOTİV SERVİS VE TİC. A.Ş.', 3, 0);
    END;

    DECLARE @CariRef INT;
    SELECT TOP 1 @CariRef = LOGICALREF FROM LG_225_CLCARD WHERE CODE = '120.01.0243' OR CODE = '320.01.001';

    INSERT INTO LG_225_01_STFICHE (GRPCODE, TRCODE, FICHENO, DOCNUMBER, SPECODE, CLIENTREF, RECVREF, SOURCEINDEX, CANCELLED, GENEXP1, GENEXP2, STATUS, BILLED)
    VALUES (1, 8, 'IRS2025000001034', '16861', 'VOG-RFID', @CariRef, @CariRef, 0, 0, 'VOG RFID Tünel Otomatik Koli İrsaliyesi', 'SKODA ARCA ETİMESGUT BAYİİ', 1, 0);

    DECLARE @NewStRef INT = SCOPE_IDENTITY();

    INSERT INTO LG_225_01_STLINE (STFICHEREF, LINETYPE, STOCKREF, CLIENTREF, UOMREF, QTY, PRICE, TOTAL, VAT, VATAMNT, LINENET)
    VALUES 
    (@NewStRef, 0, 101, @CariRef, 1, 3, 1250.00, 3750.00, 18, 675.00, 3750.00),
    (@NewStRef, 0, 102, @CariRef, 1, 4, 850.00, 3400.00, 18, 612.00, 3400.00),
    (@NewStRef, 0, 103, @CariRef, 1, 4, 450.00, 1800.00, 18, 324.00, 1800.00);
    `;

    runSqlCmdNonQuery(query, 'SIPARIS');

    console.log("\n📊 EKLENEN CANLI FORMATTAKİ İRSALİYE (LG_225_01_STFICHE):");
    console.log(runSqlCmd("SELECT LOGICALREF, GRPCODE, TRCODE, FICHENO, DOCNUMBER, SOURCEINDEX, CLIENTREF, GENEXP1, STATUS FROM LG_225_01_STFICHE"));
}

insertExactLiveLogo().catch(console.error);
