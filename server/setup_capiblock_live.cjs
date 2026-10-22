const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runSqlCmd(query, db = 'SIPARIS') {
    try {
        const tmpFile = path.join(__dirname, `tmp_capi_${Date.now()}.json`);
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

async function setupCapiblockLive() {
    console.log("==========================================================================");
    console.log("🛠️ LOGO TIGER CAPIBLOCK (EKLEYEN USER ID: 1) STANDART TABLO YAPILANDIRMASI");
    console.log("==========================================================================\n");

    runSqlCmdNonQuery("IF EXISTS (SELECT * FROM sys.tables WHERE name = 'LG_225_01_STLINE') DROP TABLE LG_225_01_STLINE", 'SIPARIS');
    runSqlCmdNonQuery("IF EXISTS (SELECT * FROM sys.tables WHERE name = 'LG_225_01_STFICHE') DROP TABLE LG_225_01_STFICHE", 'SIPARIS');

    const createQuery = `
    CREATE TABLE LG_225_01_STFICHE (
        LOGICALREF INT IDENTITY(1,1) PRIMARY KEY,
        GRPCODE SMALLINT DEFAULT 1,
        TRCODE SMALLINT DEFAULT 8,
        FICHENO VARCHAR(32) NOT NULL,
        DATE_ DATETIME DEFAULT GETDATE(),
        TIME_ INT DEFAULT 36000000,
        DOCNUMBER VARCHAR(32),
        SPECODE VARCHAR(32),
        CLIENTREF INT DEFAULT 1,
        RECVREF INT DEFAULT 1,
        ACCOUNTREF INT DEFAULT 0,
        CENTERREF INT DEFAULT 0,
        SOURCEINDEX SMALLINT DEFAULT 0,
        SOURCECOSTGRP SMALLINT DEFAULT 0,
        CANCELLED SMALLINT DEFAULT 0,
        GENEXP1 VARCHAR(255),
        GENEXP2 VARCHAR(255),
        STATUS SMALLINT DEFAULT 1,
        BILLED SMALLINT DEFAULT 0,
        CAPIBLOCK_CREATEDBY SMALLINT DEFAULT 1,
        CAPIBLOCK_CREADEDDATE DATETIME DEFAULT GETDATE(),
        CAPIBLOCK_CREATEDHOUR SMALLINT DEFAULT 12,
        CAPIBLOCK_CREATEDMIN SMALLINT DEFAULT 30,
        CAPIBLOCK_CREATEDSEC SMALLINT DEFAULT 0,
        CAPIBLOCK_MODIFIEDBY SMALLINT DEFAULT 1,
        CAPIBLOCK_MODIFIEDDATE DATETIME DEFAULT GETDATE(),
        CAPIBLOCK_MODIFIEDHOUR SMALLINT DEFAULT 12,
        CAPIBLOCK_MODIFIEDMIN SMALLINT DEFAULT 30,
        CAPIBLOCK_MODIFIEDSEC SMALLINT DEFAULT 0
    );

    CREATE TABLE LG_225_01_STLINE (
        LOGICALREF INT IDENTITY(1,1) PRIMARY KEY,
        STFICHEREF INT NOT NULL,
        LINETYPE SMALLINT DEFAULT 0,
        STOCKREF INT DEFAULT 101,
        CLIENTREF INT DEFAULT 1,
        DATE_ DATETIME DEFAULT GETDATE(),
        UOMREF INT DEFAULT 1,
        QTY FLOAT DEFAULT 1,
        PRICE DECIMAL(18,2) DEFAULT 0.00,
        TOTAL DECIMAL(18,2) DEFAULT 0.00,
        VAT SMALLINT DEFAULT 18,
        VATAMNT DECIMAL(18,2) DEFAULT 0.00,
        LINENET DECIMAL(18,2) DEFAULT 0.00,
        CAPIBLOCK_CREATEDBY SMALLINT DEFAULT 1,
        CAPIBLOCK_CREADEDDATE DATETIME DEFAULT GETDATE(),
        CAPIBLOCK_CREATEDHOUR SMALLINT DEFAULT 12,
        CAPIBLOCK_CREATEDMIN SMALLINT DEFAULT 30,
        CAPIBLOCK_CREATEDSEC SMALLINT DEFAULT 0,
        CAPIBLOCK_MODIFIEDBY SMALLINT DEFAULT 1,
        CAPIBLOCK_MODIFIEDDATE DATETIME DEFAULT GETDATE(),
        CAPIBLOCK_MODIFIEDHOUR SMALLINT DEFAULT 12,
        CAPIBLOCK_MODIFIEDMIN SMALLINT DEFAULT 30,
        CAPIBLOCK_MODIFIEDSEC SMALLINT DEFAULT 0
    );

    DECLARE @CariRef INT;
    SELECT TOP 1 @CariRef = LOGICALREF FROM LG_225_CLCARD WHERE CODE = '120.01.0243' OR CODE = '320.01.001';

    INSERT INTO LG_225_01_STFICHE (GRPCODE, TRCODE, FICHENO, DOCNUMBER, SPECODE, CLIENTREF, RECVREF, SOURCEINDEX, CANCELLED, GENEXP1, GENEXP2, STATUS, BILLED, CAPIBLOCK_CREATEDBY, CAPIBLOCK_MODIFIEDBY)
    VALUES (1, 8, 'IRS2025000001034', '16861', 'VOG-RFID', @CariRef, @CariRef, 0, 0, 'VOG RFID Tünel Otomatik Koli İrsaliyesi', 'SKODA ARCA ETİMESGUT BAYİİ', 1, 0, 1, 1);

    DECLARE @NewStRef INT = SCOPE_IDENTITY();

    INSERT INTO LG_225_01_STLINE (STFICHEREF, LINETYPE, STOCKREF, CLIENTREF, UOMREF, QTY, PRICE, TOTAL, VAT, VATAMNT, LINENET, CAPIBLOCK_CREATEDBY, CAPIBLOCK_MODIFIEDBY)
    VALUES 
    (@NewStRef, 0, 101, @CariRef, 1, 3, 1250.00, 3750.00, 18, 675.00, 3750.00, 1, 1),
    (@NewStRef, 0, 102, @CariRef, 1, 4, 850.00, 3400.00, 18, 612.00, 3400.00, 1, 1),
    (@NewStRef, 0, 103, @CariRef, 1, 4, 450.00, 1800.00, 18, 324.00, 1800.00, 1, 1);
    `;

    runSqlCmdNonQuery(createQuery, 'SIPARIS');

    console.log("\n📊 EKLENEN İRSALİYE VE CAPIBLOCK_CREATEDBY BİLGİSİ:");
    console.log(runSqlCmd("SELECT LOGICALREF, FICHENO, DOCNUMBER, SOURCEINDEX, CLIENTREF, CAPIBLOCK_CREATEDBY, CAPIBLOCK_MODIFIEDBY, STATUS FROM LG_225_01_STFICHE"));
}

setupCapiblockLive().catch(console.error);
