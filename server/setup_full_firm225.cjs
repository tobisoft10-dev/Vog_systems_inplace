const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runSqlCmd(query, db = 'SIPARIS') {
    try {
        const tmpFile = path.join(__dirname, `tmp_f225_${Date.now()}.json`);
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

async function setupFullFirm225() {
    console.log("==========================================================================");
    console.log("🚀 LOGO TIGER ERP FİRMA 225 DÖNEM 01 EKSİKSİZ TABLO & CARİ KART ENTEGRASYONU");
    console.log("==========================================================================\n");

    const orderId = '16861';
    const ficheNo = `IRS-16861-CANLI`;

    const setupQuery = `
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LG_225_CLCARD')
    BEGIN
        CREATE TABLE LG_225_CLCARD (
            LOGICALREF INT IDENTITY(1,1) PRIMARY KEY,
            CODE VARCHAR(32) NOT NULL,
            DEFINITION_ VARCHAR(255) NOT NULL,
            CARDTYPE SMALLINT DEFAULT 3,
            SPECODE VARCHAR(32) DEFAULT '',
            CYPHCODE VARCHAR(32) DEFAULT '',
            ACTIVE SMALLINT DEFAULT 0
        );
    END;

    IF NOT EXISTS (SELECT * FROM LG_225_CLCARD WHERE CODE = '320.01.001')
    BEGIN
        INSERT INTO LG_225_CLCARD (CODE, DEFINITION_, CARDTYPE, ACTIVE) 
        VALUES ('320.01.001', 'DOĞUŞ OTOMOTİV SERVİS VE TİCARET A.Ş.', 3, 0);
    END;

    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LG_225_ITEMS')
    BEGIN
        CREATE TABLE LG_225_ITEMS (
            LOGICALREF INT IDENTITY(1,1) PRIMARY KEY,
            CODE VARCHAR(32) NOT NULL,
            NAME VARCHAR(255) NOT NULL,
            CARDTYPE SMALLINT DEFAULT 1
        );
        INSERT INTO LG_225_ITEMS (CODE, NAME) VALUES ('SKD-MONT-01', 'SKODA TEKNİSYEN MONTSU 2026');
        INSERT INTO LG_225_ITEMS (CODE, NAME) VALUES ('SKD-PNT-02', 'SKODA SERVİS PANTOLONU');
        INSERT INTO LG_225_ITEMS (CODE, NAME) VALUES ('SKD-TSH-03', 'SKODA LOGOLU T-SHIRT L');
    END;

    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LG_225_01_STFICHE')
    BEGIN
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
            SOURCEINDEX SMALLINT DEFAULT 1,
            SOURCECOSTGRP SMALLINT DEFAULT 0,
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
            DATE_ DATETIME DEFAULT GETDATE(),
            UOMREF INT DEFAULT 1,
            QTY FLOAT DEFAULT 1,
            PRICE DECIMAL(18,2) DEFAULT 0.00,
            TOTAL DECIMAL(18,2) DEFAULT 0.00,
            VAT SMALLINT DEFAULT 18,
            VATAMNT DECIMAL(18,2) DEFAULT 0.00,
            LINENET DECIMAL(18,2) DEFAULT 0.00
        );
    END;

    IF NOT EXISTS (SELECT * FROM LG_225_01_STFICHE WHERE FICHENO = '${ficheNo}')
    BEGIN
        INSERT INTO LG_225_01_STFICHE (GRPCODE, TRCODE, FICHENO, DOCNUMBER, SPECODE, CLIENTREF, RECVREF, SOURCEINDEX, CANCELLED, GENEXP1, GENEXP2, STATUS, BILLED)
        VALUES (1, 8, '${ficheNo}', '${orderId}', 'VOG-RFID', 1, 1, 1, 0, 'VOG RFID Tünel Otomatik Koli İrsaliyesi', 'SKODA ARCA ETİMESGUT BAYİİ', 1, 0);

        DECLARE @F225Ref INT = SCOPE_IDENTITY();

        INSERT INTO LG_225_01_STLINE (STFICHEREF, LINETYPE, STOCKREF, CLIENTREF, UOMREF, QTY, PRICE, TOTAL, VAT, VATAMNT, LINENET)
        VALUES 
        (@F225Ref, 0, 101, 1, 1, 3, 1250.00, 3750.00, 18, 675.00, 3750.00),
        (@F225Ref, 0, 102, 1, 1, 4, 850.00, 3400.00, 18, 612.00, 3400.00),
        (@F225Ref, 0, 103, 1, 1, 4, 450.00, 1800.00, 18, 324.00, 1800.00);
    END;
    `;

    console.log("📥 LOGO Tiger Firma 225 Canlı Tablo & Cari Kart İşlemi Yürütülüyor...");
    runSqlCmdNonQuery(setupQuery, 'SIPARIS');

    console.log("\n📊 CARİ KART KONTROLÜ (LG_225_CLCARD):");
    console.log(runSqlCmd("SELECT LOGICALREF, CODE, DEFINITION_ FROM LG_225_CLCARD"));

    console.log("\n📊 İRSALİYE BAŞLIK KONTROLÜ (LG_225_01_STFICHE):");
    console.log(runSqlCmd("SELECT LOGICALREF, GRPCODE, TRCODE, FICHENO, DOCNUMBER, CLIENTREF, GENEXP1, STATUS FROM LG_225_01_STFICHE"));
}

setupFullFirm225().catch(console.error);
