const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runSqlCmd(query) {
    try {
        const tmpFile = path.join(__dirname, `tmp_cols_${Date.now()}.json`);
        const cleanQuery = query.replace(/\r?\n/g, ' ');
        const cmd = `sqlcmd -S .\\SQLEXPRESS -d SIPARIS -U sa -P "150609%M" -f 65001 -w 65535 -y 0 -o "${tmpFile}" -Q "SET NOCOUNT ON; ${cleanQuery} FOR JSON PATH"`;
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

console.log("🔍 MATCHING COLUMNS IN [SIPARIS] DATABASE:");
const cols = runSqlCmd("SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME LIKE '%Irsaliye%' OR COLUMN_NAME LIKE '%Sevk%' OR COLUMN_NAME LIKE '%Logo%' OR COLUMN_NAME LIKE '%Muhasebe%' ORDER BY TABLE_NAME");
console.log(cols);

console.log("🔍 ALL TABLES IN [SIPARIS] DATABASE:");
const tables = runSqlCmd("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES ORDER BY TABLE_NAME");
console.log(tables);
