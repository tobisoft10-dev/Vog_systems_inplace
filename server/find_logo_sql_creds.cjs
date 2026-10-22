const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const servers = ['192.168.1.250', '192.168.1.234', '192.168.1.100', 'logodbsrv'];
const users = ['sa', 'LOGO', 'logo', 'tiger', 'TIGER', 'lbs', 'LBS', 'vogerp', 'admin', 'logo_user', 'VOG', 'vog'];
const passwords = [
    '150609%M', '!719356Qse!', 'LOGO', 'logo', 'Logo', 'Logo123', 'Logo2020', 'Logo2021', 'Logo2022', 'Logo2023', 'Logo2024', 'Logo2025', 'Logo2026',
    'Logo123!', 'Logo2020!', 'Logo2022!', 'Logo2025!', 'Logo2026!', 'Logo.123', 'Logo.2020', 'Logo.2025', 'Logo.2026',
    'Tiger', 'TigerWings', 'Tiger123', 'Tiger2025', 'Tiger2026',
    'Vog123', 'Vog2020', 'Vog2022', 'Vog2025', 'Vog2026', 'VogTekstil',
    'sa', '123456', '1234', '12345678', 'Sql2020', 'Sql2025', 'Sql2026', '1'
];

console.log("==========================================================================");
console.log("🔍 COMPREHENSIVE SCAN FOR REAL LOGO TIGER ERP SQL SERVER CONNECTION");
console.log("==========================================================================\n");

for (const srv of servers) {
    for (const usr of users) {
        for (const pwd of passwords) {
            try {
                const tmp = path.join(__dirname, `tmp_scan_${Date.now()}.json`);
                const cmd = `sqlcmd -S ${srv} -U ${usr} -P "${pwd}" -f 65001 -w 65535 -y 0 -o "${tmp}" -Q "SET NOCOUNT ON; SELECT name FROM sys.databases FOR JSON PATH"`;
                execSync(cmd, { stdio: 'ignore', timeout: 800 });
                if (fs.existsSync(tmp)) {
                    const raw = fs.readFileSync(tmp, 'utf8').trim();
                    try { fs.unlinkSync(tmp); } catch(e){}
                    if (raw) {
                        console.log(`🎉 [FOUND REAL LOGO SQL SERVER!] Server: ${srv} | User: '${usr}' | Pwd: '${pwd}'`);
                        console.log("   Databases:", JSON.parse(raw).map(d => d.name));
                        process.exit(0);
                    }
                }
            } catch(e) {}
        }
    }
}

console.log("Scan completed without finding SQL Server match.");
