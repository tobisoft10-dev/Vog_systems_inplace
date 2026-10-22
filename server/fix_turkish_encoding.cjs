const sql = require('mssql');

const sqlConfig = {
    user: 'sa',
    password: '150609%M',
    server: '127.0.0.1',
    database: 'SIPARIS',
    options: {
        instanceName: 'SQLEXPRESS',
        encrypt: false,
        trustServerCertificate: true
    }
};

function cleanTurkishText(text) {
    if (!text) return text;

    let s = text;

    // Fix double-encoded UTF-8 sequences and common Mojibake
    s = s.replace(/PARÃ‡A/g, 'PARÇA');
    s = s.replace(/PARÃ§A/g, 'PARÇA');
    s = s.replace(/DAÃ„ÂžITIMI/g, 'DAĞITIMI');
    s = s.replace(/DAÄžITIMI/g, 'DAĞITIMI');
    s = s.replace(/BAYÃ„Â°/g, 'BAYİ');
    s = s.replace(/BAYÄ°/g, 'BAYİ');
    s = s.replace(/BÃ–LGE/g, 'BÖLGE');

    // Individual broken Turkish UTF-8 bytes
    s = s.replace(/Ã‡/g, 'Ç');
    s = s.replace(/Ã§/g, 'ç');
    s = s.replace(/Äž/g, 'Ğ');
    s = s.replace(/ÄŸ/g, 'ğ');
    s = s.replace(/Ä°/g, 'İ');
    s = s.replace(/Ä±/g, 'ı');
    s = s.replace(/Ã–/g, 'Ö');
    s = s.replace(/Ã¶/g, 'ö');
    s = s.replace(/Åž/g, 'Ş');
    s = s.replace(/ÅŸ/g, 'ş');
    s = s.replace(/Ãœ/g, 'Ü');
    s = s.replace(/Ã¼/g, 'ü');

    return s;
}

async function runEncodingFix() {
    console.log('⚡ Connecting to MS SQL Server (127.0.0.1\\SQLEXPRESS)...');
    try {
        await sql.connect(sqlConfig);
        console.log('✅ Connected to SIPARIS database.');

        // Select all Siparisler rows where Detay5 is NOT NULL
        const res = await sql.query(`
            SELECT Id, Detay5, Detay1 
            FROM Siparisler 
            WHERE Detay5 IS NOT NULL AND Detay5 <> ''
        `);

        console.log(`Analyzing ${res.recordset.length} records in Siparisler table...\n`);

        let updatedDetay5 = 0;
        let updatedDetay1 = 0;

        for (const row of res.recordset) {
            const id = row.Id;
            const origDetay5 = row.Detay5;
            const origDetay1 = row.Detay1;

            const fixedDetay5 = cleanTurkishText(origDetay5);
            const fixedDetay1 = cleanTurkishText(origDetay1);

            if (fixedDetay5 !== origDetay5) {
                console.log(`[Detay5 Update] ID ${id}:`);
                console.log(`   BEFORE: ${origDetay5}`);
                console.log(`   AFTER : ${fixedDetay5}`);

                const req = new sql.Request();
                req.input('id', sql.Int, id);
                req.input('d5', sql.NVarChar(sql.MAX), fixedDetay5);
                await req.query(`UPDATE Siparisler SET Detay5 = @d5 WHERE Id = @id`);
                updatedDetay5++;
            }

            if (fixedDetay1 !== origDetay1) {
                console.log(`[Detay1 Update] ID ${id}:`);
                console.log(`   BEFORE: ${origDetay1}`);
                console.log(`   AFTER : ${fixedDetay1}`);

                const req = new sql.Request();
                req.input('id', sql.Int, id);
                req.input('d1', sql.NVarChar(sql.MAX), fixedDetay1);
                await req.query(`UPDATE Siparisler SET Detay1 = @d1 WHERE Id = @id`);
                updatedDetay1++;
            }
        }

        console.log(`\n🎉 SUCCESS!`);
        console.log(`• Updated Detay5 in ${updatedDetay5} records.`);
        console.log(`• Updated Detay1 in ${updatedDetay1} records.`);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        try { await sql.close(); } catch(e) {}
    }
}

runEncodingFix();
