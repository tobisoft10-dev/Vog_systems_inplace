const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const server = '192.168.1.250';
const users = ['sa', 'LOGO', 'logo', 'tiger', 'lbs', 'vogerp', 'logo_user', 'admin'];
const passwords = ['150609%M', '!719356Qse!', 'LOGO', 'logo', 'Logo', 'Logo123', 'Logo2020', 'Logo2022', 'Logo2026', 'Logo2025', 'Tiger', 'TigerWings', '123456', '1234', '1', 'Sql2020', 'Vog2020', 'Vog2022', 'Vog2026'];

console.log("==========================================================================");
console.log(`🔌 CONNECTING TO REAL CENTRAL LOGO SERVER ON ${server}`);
console.log("==========================================================================\n");

// 1. Try Windows Auth
try {
    const tmpWin = path.join(__dirname, `tmp_win_250_${Date.now()}.json`);
    const cmd = `sqlcmd -S ${server} -E -f 65001 -w 65535 -y 0 -o "${tmpWin}" -Q "SET NOCOUNT ON; SELECT name FROM sys.databases FOR JSON PATH"`;
    execSync(cmd, { stdio: 'ignore' });
    if (fs.existsSync(tmpWin)) {
        const raw = fs.readFileSync(tmpWin, 'utf8').trim();
        try { fs.unlinkSync(tmpWin); } catch(e){}
        if (raw) {
            console.log("🎉 SUCCESS VIA WINDOWS AUTH (-E)! DATABASES:", JSON.parse(raw).map(d => d.name));
            process.exit(0);
        }
    }
} catch(e) {}

// 2. Try SQL Users & Passwords
for (const u of users) {
    for (const p of passwords) {
        try {
            const tmpSql = path.join(__dirname, `tmp_sql_250_${Date.now()}.json`);
            const cmd = `sqlcmd -S ${server} -U ${u} -P "${p}" -f 65001 -w 65535 -y 0 -o "${tmpSql}" -Q "SET NOCOUNT ON; SELECT name FROM sys.databases FOR JSON PATH"`;
            execSync(cmd, { stdio: 'ignore' });
            if (fs.existsSync(tmpSql)) {
                const raw = fs.readFileSync(tmpSql, 'utf8').trim();
                try { fs.unlinkSync(tmpSql); } catch(e){}
                if (raw) {
                    console.log(`🎉 SUCCESS VIA SQL AUTH! User: '${u}', Password: '${p}'`);
                    console.log("DATABASES:", JSON.parse(raw).map(d => d.name));
                    process.exit(0);
                }
            }
        } catch(e) {}
    }
}

console.log("Scan completed.");
