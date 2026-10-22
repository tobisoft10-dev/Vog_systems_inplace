const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runSqlCmd(query, db = 'SIPARIS') {
    try {
        const tmpFile = path.join(__dirname, `tmp_firm_${Date.now()}.json`);
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

console.log("==================================================================");
console.log("🔍 DISCOVERING ALL LOGO FIRM TABLES & CARI CARDS IN SQL SERVER");
console.log("==================================================================\n");

// List all databases
const dbs = runSqlCmd("SELECT name FROM sys.databases WHERE name NOT IN ('master','tempdb','model','msdb')");

console.log("DATABASES:", dbs.map(d => d.name));

for (const dbRow of dbs) {
    const dbName = dbRow.name;
    const stficheTables = runSqlCmd(`SELECT TABLE_NAME FROM [${dbName}].INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE 'LG_%_STFICHE' OR TABLE_NAME LIKE 'LG_%_CLCARD'`, dbName);
    if (stficheTables.length > 0) {
        console.log(`\n🎯 LOGO ERP TABLES FOUND IN DATABASE [${dbName}]:`);
        console.log(stficheTables.map(t => t.TABLE_NAME));
    }
}
