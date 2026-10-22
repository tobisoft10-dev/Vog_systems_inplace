const mssql = require('mssql');

const passwords = [
    'Vog2026!', 'Vog2026', 'Vog2025!', 'Vog2024!', 'Vog1234!', 'vog2026', 'vog2026!',
    '123456', '12345678', 'sa', '1234', '123456789', 'admin', 'Password123!', 'VogTekstil2026!',
    'VogTekstil', 'VogTekstil!', 'vog', 'vog123', 'root', ''
];

async function testPasswords() {
    for (const pwd of passwords) {
        try {
            console.log(`Testing sa password: "${pwd}"...`);
            const pool = await mssql.connect({
                server: 'adc\\SQLEXPRESS',
                database: 'SIPARIS',
                user: 'sa',
                password: pwd,
                options: { encrypt: false, trustServerCertificate: true }
            });
            console.log(`🎉 SUCCESS! Connected with sa password: "${pwd}"`);
            
            const res = await pool.request().query('SELECT TOP 3 Id, Zaman, Model FROM [SIPARIS].[dbo].[Siparisler] ORDER BY Id DESC');
            console.log('QueryResult:', res.recordset);
            await pool.close();
            return pwd;
        } catch (e) {
            // failed
        }
    }
    console.log('❌ None of the standard sa passwords matched.');
}

testPasswords();
