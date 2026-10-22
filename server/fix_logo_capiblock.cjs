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

async function fixCapiblock() {
    console.log("==========================================================================");
    console.log("🛠️ LOGO TIGER CAPIBLOCK (EKLEYEN USER ID: 1) SÜTUNLARI VE FİLTRE DÜZELTMESİ");
    console.log("==========================================================================\n");

    const fixColumnsQuery = `
    -- Add CAPIBLOCK columns to LG_225_01_STFICHE if not exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('LG_225_01_STFICHE') AND name = 'CAPIBLOCK_CREATEDBY')
    BEGIN
        ALTER TABLE LG_225_01_STFICHE ADD 
            CAPIBLOCK_CREATEDBY SMALLINT DEFAULT 1,
            CAPIBLOCK_CREADEDDATE DATETIME DEFAULT GETDATE(),
            CAPIBLOCK_CREATEDHOUR SMALLINT DEFAULT 12,
            CAPIBLOCK_CREATEDMIN SMALLINT DEFAULT 30,
            CAPIBLOCK_CREATEDSEC SMALLINT DEFAULT 0,
            CAPIBLOCK_MODIFIEDBY SMALLINT DEFAULT 1,
            CAPIBLOCK_MODIFIEDDATE DATETIME DEFAULT GETDATE(),
            CAPIBLOCK_MODIFIEDHOUR SMALLINT DEFAULT 12,
            CAPIBLOCK_MODIFIEDMIN SMALLINT DEFAULT 30,
            CAPIBLOCK_MODIFIEDSEC SMALLINT DEFAULT 0;
    END;

    -- Add CAPIBLOCK columns to LG_225_01_STLINE if not exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('LG_225_01_STLINE') AND name = 'CAPIBLOCK_CREATEDBY')
    BEGIN
        ALTER TABLE LG_225_01_STLINE ADD 
            CAPIBLOCK_CREATEDBY SMALLINT DEFAULT 1,
            CAPIBLOCK_CREADEDDATE DATETIME DEFAULT GETDATE(),
            CAPIBLOCK_CREATEDHOUR SMALLINT DEFAULT 12,
            CAPIBLOCK_CREATEDMIN SMALLINT DEFAULT 30,
            CAPIBLOCK_CREATEDSEC SMALLINT DEFAULT 0,
            CAPIBLOCK_MODIFIEDBY SMALLINT DEFAULT 1,
            CAPIBLOCK_MODIFIEDDATE DATETIME DEFAULT GETDATE(),
            CAPIBLOCK_MODIFIEDHOUR SMALLINT DEFAULT 12,
            CAPIBLOCK_MODIFIEDMIN SMALLINT DEFAULT 30,
            CAPIBLOCK_MODIFIEDSEC SMALLINT DEFAULT 0;
    END;

    -- Update existing records to CAPIBLOCK_CREATEDBY = 1 and CAPIBLOCK_MODIFIEDBY = 1
    UPDATE LG_225_01_STFICHE SET CAPIBLOCK_CREATEDBY = 1, CAPIBLOCK_MODIFIEDBY = 1, SOURCEINDEX = 0, STATUS = 1, CANCELLED = 0;
    UPDATE LG_225_01_STLINE SET CAPIBLOCK_CREATEDBY = 1, CAPIBLOCK_MODIFIEDBY = 1;
    `;

    runSqlCmdNonQuery(fixColumnsQuery, 'SIPARIS');

    console.log("\n📊 DÜZELTİLMİŞ İRSALİYE KAYDI (LG_225_01_STFICHE):");
    console.log(runSqlCmd("SELECT LOGICALREF, GRPCODE, TRCODE, FICHENO, DOCNUMBER, SOURCEINDEX, CLIENTREF, CAPIBLOCK_CREATEDBY, STATUS FROM LG_225_01_STFICHE"));
}

fixCapiblock().catch(console.error);
