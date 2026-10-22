const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runSqlCmd(query, db = 'SIPARIS') {
    try {
        const tmpFile = path.join(__dirname, `tmp_225_${Date.now()}.json`);
        const cleanQuery = query.replace(/\r?\n/g, ' ');
        const cmd = `sqlcmd -S .\\SQLEXPRESS -d ${db} -U sa -P "150609%M" -f 65001 -w 65535 -y 0 -o "${tmpFile}" -Q "SET NOCOUNT ON; ${cleanQuery} FOR JSON PATH"`;
        execSync(cmd, { stdio: 'ignore' });
        if (fs.existsSync(tmpFile)) {
            const raw = fs.readFileSync(tmpFile, 'utf8');
            try { fs.unlinkSync(tmpFile); } catch (e) {}
            const jsonStr = raw.split(/\r?\n/).map(l => l.trim()).join('');
            if (jsonStr) return JSON.parse(jsonStr);
        }
    } catch (e) {
        console.error("runSqlCmd error:", e.message);
    }
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

async function insertFirm225Test() {
    console.log("========================================================================");
    console.log("🚀 LOGO TIGER ERP FİRMA 225 (2026 DÖNEMİ) İRSALİYE AKTARIMI");
    console.log("========================================================================\n");

    const orderId = '16861';
    const ficheNo = `IRS-${orderId}-${Date.now().toString().slice(-4)}`;

    const firm225Query = `
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LG_225_01_STFICHE')
    BEGIN
        CREATE TABLE LG_225_01_STFICHE (
            LOGICALREF INT IDENTITY(1,1) PRIMARY KEY,
            GRPCODE SMALLINT DEFAULT 1,
            TRCODE SMALLINT DEFAULT 8,
            FICHENO VARCHAR(32) NOT NULL,
            DOCNUMBER VARCHAR(32),
            SPECODE VARCHAR(32),
            CLIENTREF INT DEFAULT 1,
            RECVREF INT DEFAULT 1,
            SOURCEINDEX SMALLINT DEFAULT 1,
            CANCELLED SMALLINT DEFAULT 0,
            GENEXP1 VARCHAR(255),
            GENEXP2 VARCHAR(255),
            STATUS SMALLINT DEFAULT 1,
            BILLED SMALLINT DEFAULT 0
        );
    END;

    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LG_225_01_STLINE')
    BEGIN
        CREATE TABLE LG_225_01_STLINE (
            LOGICALREF INT IDENTITY(1,1) PRIMARY KEY,
            STFICHEREF INT NOT NULL,
            LINETYPE SMALLINT DEFAULT 0,
            STOCKREF INT DEFAULT 101,
            CLIENTREF INT DEFAULT 1,
            UOMREF INT DEFAULT 1,
            QTY FLOAT DEFAULT 1,
            PRICE DECIMAL(18,2) DEFAULT 0.00,
            TOTAL DECIMAL(18,2) DEFAULT 0.00,
            VAT SMALLINT DEFAULT 18,
            VATAMNT DECIMAL(18,2) DEFAULT 0.00,
            LINENET DECIMAL(18,2) DEFAULT 0.00
        );
    END;

    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LG_225_26_STFICHE')
    BEGIN
        CREATE TABLE LG_225_26_STFICHE (
            LOGICALREF INT IDENTITY(1,1) PRIMARY KEY,
            GRPCODE SMALLINT DEFAULT 1,
            TRCODE SMALLINT DEFAULT 8,
            FICHENO VARCHAR(32) NOT NULL,
            DOCNUMBER VARCHAR(32),
            SPECODE VARCHAR(32),
            CLIENTREF INT DEFAULT 1,
            RECVREF INT DEFAULT 1,
            SOURCEINDEX SMALLINT DEFAULT 1,
            CANCELLED SMALLINT DEFAULT 0,
            GENEXP1 VARCHAR(255),
            GENEXP2 VARCHAR(255),
            STATUS SMALLINT DEFAULT 1,
            BILLED SMALLINT DEFAULT 0
        );
    END;

    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LG_225_26_STLINE')
    BEGIN
        CREATE TABLE LG_225_26_STLINE (
            LOGICALREF INT IDENTITY(1,1) PRIMARY KEY,
            STFICHEREF INT NOT NULL,
            LINETYPE SMALLINT DEFAULT 0,
            STOCKREF INT DEFAULT 101,
            CLIENTREF INT DEFAULT 1,
            UOMREF INT DEFAULT 1,
            QTY FLOAT DEFAULT 1,
            PRICE DECIMAL(18,2) DEFAULT 0.00,
            TOTAL DECIMAL(18,2) DEFAULT 0.00,
            VAT SMALLINT DEFAULT 18,
            VATAMNT DECIMAL(18,2) DEFAULT 0.00,
            LINENET DECIMAL(18,2) DEFAULT 0.00
        );
    END;

    INSERT INTO LG_225_01_STFICHE (GRPCODE, TRCODE, FICHENO, DOCNUMBER, SPECODE, CLIENTREF, RECVREF, SOURCEINDEX, CANCELLED, GENEXP1, GENEXP2, STATUS, BILLED)
    VALUES (1, 8, '${ficheNo}', '${orderId}', 'VOG-RFID', 1, 1, 1, 0, 'VOG RFID Tünel Otomatik Koli İrsaliyesi', 'SKODA ARCA ETİMESGUT BAYİİ', 1, 0);

    DECLARE @Ref01 INT = SCOPE_IDENTITY();

    INSERT INTO LG_225_01_STLINE (STFICHEREF, LINETYPE, STOCKREF, CLIENTREF, UOMREF, QTY, PRICE, TOTAL, VAT, VATAMNT, LINENET)
    VALUES 
    (@Ref01, 0, 101, 1, 1, 3, 1250.00, 3750.00, 18, 675.00, 3750.00),
    (@Ref01, 0, 102, 1, 1, 4, 850.00, 3400.00, 18, 612.00, 3400.00),
    (@Ref01, 0, 103, 1, 1, 4, 450.00, 1800.00, 18, 324.00, 1800.00);

    INSERT INTO LG_225_26_STFICHE (GRPCODE, TRCODE, FICHENO, DOCNUMBER, SPECODE, CLIENTREF, RECVREF, SOURCEINDEX, CANCELLED, GENEXP1, GENEXP2, STATUS, BILLED)
    VALUES (1, 8, '${ficheNo}', '${orderId}', 'VOG-RFID', 1, 1, 1, 0, 'VOG RFID Tünel Otomatik Koli İrsaliyesi', 'SKODA ARCA ETİMESGUT BAYİİ', 1, 0);

    DECLARE @Ref26 INT = SCOPE_IDENTITY();

    INSERT INTO LG_225_26_STLINE (STFICHEREF, LINETYPE, STOCKREF, CLIENTREF, UOMREF, QTY, PRICE, TOTAL, VAT, VATAMNT, LINENET)
    VALUES 
    (@Ref26, 0, 101, 1, 1, 3, 1250.00, 3750.00, 18, 675.00, 3750.00),
    (@Ref26, 0, 102, 1, 1, 4, 850.00, 3400.00, 18, 612.00, 3400.00),
    (@Ref26, 0, 103, 1, 1, 4, 450.00, 1800.00, 18, 324.00, 1800.00);
    `;

    console.log(`📥 LOGO Tiger Firma 225 İrsaliye Kaydı İşleniyor (Fiş No: ${ficheNo})...`);
    runSqlCmdNonQuery(firm225Query, 'SIPARIS');

    console.log("\n📊 FİRMA 225 DÖNEM 01 İRSALİYE BAŞLIK (LG_225_01_STFICHE):");
    const f225_01 = runSqlCmd("SELECT TOP 5 LOGICALREF, GRPCODE, TRCODE, FICHENO, DOCNUMBER, SPECODE, GENEXP1, STATUS FROM LG_225_01_STFICHE ORDER BY LOGICALREF DESC");
    console.log(f225_01);

    console.log("\n📊 FİRMA 225 DÖNEM 26 İRSALİYE BAŞLIK (LG_225_26_STFICHE):");
    const f225_26 = runSqlCmd("SELECT TOP 5 LOGICALREF, GRPCODE, TRCODE, FICHENO, DOCNUMBER, SPECODE, GENEXP1, STATUS FROM LG_225_26_STFICHE ORDER BY LOGICALREF DESC");
    console.log(f225_26);
}

insertFirm225Test().catch(console.error);
