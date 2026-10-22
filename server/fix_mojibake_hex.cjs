const sql = require('mssql');

const sqlConfig = {
    user: 'sa',
    password: '150609%M',
    server: 'localhost\\SQLEXPRESS',
    database: 'SIPARIS',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function fixMojibakeHex() {
    console.log('⚡ Connecting to MS SQL Server (SIPARIS db)...');
    await sql.connect(sqlConfig);
    console.log('✅ Connected.');

    // Fetch all Siparisler rows where Detay5 is NOT NULL
    const res = await sql.query(`
        SELECT Id, Model, Detay5 
        FROM Siparisler 
        WHERE Detay5 IS NOT NULL AND Detay5 <> ''
    `);

    console.log(`Scanning ${res.recordset.length} records in Siparisler table...\n`);

    let updatedCount = 0;

    for (const row of res.recordset) {
        const id = row.Id;
        let d5 = row.Detay5;
        let modified = false;

        // 1. Fix DAÃ„ÂžITIMI and any corrupted G/g/I/i/C/c/O/o/S/s/U/u
        if (d5.includes('DAÃ„ÂžITIMI') || d5.includes('DAÄžITIMI') || d5.includes('DAÃ„Â') || d5.includes('DAÃ')) {
            d5 = d5.replace(/DAÃ„ÂžITIMI/g, 'DAĞITIMI');
            d5 = d5.replace(/DAÄžITIMI/g, 'DAĞITIMI');
            d5 = d5.replace(/DAÃ„Â/g, 'DAĞ');
            d5 = d5.replace(/DAÃ/g, 'DAĞ');
            modified = true;
        }

        // Fix other common double/triple UTF-8 encodings
        if (d5.includes('PARÃ‡A') || d5.includes('PARÃ') || d5.includes('PARÄ')) {
            d5 = d5.replace(/PARÃ‡A/g, 'PARÇA');
            d5 = d5.replace(/PARÃ§A/g, 'PARÇA');
            d5 = d5.replace(/PARÃ/g, 'PARÇA');
            d5 = d5.replace(/PARÄ/g, 'PARÇA');
            modified = true;
        }

        if (d5.includes('BAYÃ') || d5.includes('BAYÄ')) {
            d5 = d5.replace(/BAYÃ„Â°/g, 'BAYİ');
            d5 = d5.replace(/BAYÄ°/g, 'BAYİ');
            d5 = d5.replace(/BAYÃ/g, 'BAYİ');
            d5 = d5.replace(/BAYÄ/g, 'BAYİ');
            modified = true;
        }

        if (d5.includes('OLABÄ°LÄ°R') || d5.includes('OLABÃ')) {
            d5 = d5.replace(/OLABÄ°LÄ°R/g, 'OLABİLİR');
            d5 = d5.replace(/BÄ°LGÄ°/g, 'BİLGİ');
            modified = true;
        }

        // 2. Ensure NISSAN barcodes (12-digit starting with 90) have "PARÇA NO: " in front of them
        const barcodeMatch = d5.match(/\b(90\d{10})\b/);
        if (barcodeMatch) {
            const code = barcodeMatch[1];
            if (!d5.includes(`PARÇA NO: ${code}`) && !d5.includes(`PARÇA NO:${code}`)) {
                // Insert "PARÇA NO: " right before the 12-digit barcode
                d5 = d5.replace(code, `PARÇA NO: ${code}`);
                modified = true;
            }
        }

        if (modified) {
            console.log(`Updated ID ${id}:`);
            console.log(`  BEFORE: ${row.Detay5}`);
            console.log(`  AFTER : ${d5}\n`);

            const req = new sql.Request();
            req.input('id', sql.Int, id);
            req.input('d5', sql.NVarChar(sql.MAX), d5);
            await req.query(`UPDATE Siparisler SET Detay5 = @d5 WHERE Id = @id`);
            updatedCount++;
        }
    }

    console.log(`\n🎉 SUCCESS! Fixed encoding and added PARÇA NO prefix in ${updatedCount} records.`);
    await sql.close();
}

fixMojibakeHex();
