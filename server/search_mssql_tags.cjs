const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function queryMssql(queryText) {
    try {
        const tmpFile = path.join(__dirname, `tmp_out_${Date.now()}.json`);
        const cleanQuery = queryText.replace(/\r?\n/g, ' ');
        const cmd = `sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -f 65001 -w 65535 -y 0 -o "${tmpFile}" -Q "SET NOCOUNT ON; ${cleanQuery} FOR JSON PATH"`;
        execSync(cmd, { stdio: 'ignore' });
        if (fs.existsSync(tmpFile)) {
            const raw = fs.readFileSync(tmpFile, 'utf8');
            try { fs.unlinkSync(tmpFile); } catch (e) {}
            const jsonStr = raw.split(/\r?\n/).map(l => l.trim()).join('');
            if (jsonStr) return JSON.parse(jsonStr);
        }
    } catch (err) {
        console.error('sqlcmd error:', err.message);
    }
    return [];
}

const barcodes = ['8682030092192', '8691680751687', '8687870482719', '00615049686314', '00615049696313'];

console.log("==================================================================");
console.log(" 🔍 MSSQL (LOGO & BSİP) BARKOD ARAMA SONUÇLARI");
console.log("==================================================================");

// Search in LOGO items / barcodes if available
try {
    const dbs = queryMssql("SELECT name FROM sys.databases WHERE name LIKE '%LOGO%' OR name LIKE '%TIGER%' OR name LIKE '%SIPARIS%' OR name LIKE '%VOG%'");
    console.log("Mevcut MSSQL Veritabanları:", dbs);

    for (const b of barcodes) {
        const res = queryMssql(`
            SELECT TOP 5 Id, Model, [Not], Detay1, Detay2, Detay3, Detay5 
            FROM [SIPARIS].[dbo].[Siparisler] 
            WHERE Detay1 LIKE '%${b}%' OR Detay5 LIKE '%${b}%' OR [Not] LIKE '%${b}%' OR Model LIKE '%${b}%'
        `);
        if (res.length > 0) {
            console.log(`✅ Barkod: ${b} -> BSİP Siparis Eşleşti:`, res);
        } else {
            console.log(`⚪ Barkod: ${b} -> BSİP Siparis'te doğrudan bulunamadı.`);
        }
    }
} catch (e) {
    console.error(e);
}
