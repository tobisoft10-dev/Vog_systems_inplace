const { Client } = require('pg');

async function scanAndFixPostgres() {
    console.log('⚡ Scanning PostgreSQL vog_db database for Turkish encoding issues...\n');

    const client = new Client({ host: 'localhost', port: 5432, user: 'postgres', password: '1', database: 'vog_db' });
    await client.connect();

    try {
        // Fetch all text/varchar columns in public schema
        const colsRes = await client.query(`
            SELECT table_name, column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND data_type IN ('character varying', 'text', 'character')
        `);

        console.log(`Found ${colsRes.rows.length} text columns across PostgreSQL tables.`);

        let totalPgCleaned = 0;

        for (const row of colsRes.rows) {
            const table = row.table_name;
            const col = row.column_name;

            // Search for rows with broken encoding in this column
            const querySearch = `
                SELECT id, "${col}" as val 
                FROM "${table}" 
                WHERE "${col}" LIKE '%Ã%' OR "${col}" LIKE '%Ä%' OR "${col}" LIKE '%Å%' OR "${col}" LIKE '%Â%'
            `;

            try {
                const searchRes = await client.query(querySearch);
                if (searchRes.rows.length > 0) {
                    console.log(`Found ${searchRes.rows.length} corrupted rows in Table '${table}', Column '${col}'`);

                    for (const item of searchRes.rows) {
                        let val = item.val;
                        if (!val) continue;

                        let fixed = val;
                        fixed = fixed.replace(/PARÃ‡A/g, 'PARÇA');
                        fixed = fixed.replace(/DAÃ„ÂžITIMI/g, 'DAĞITIMI');
                        fixed = fixed.replace(/DAÄžITIMI/g, 'DAĞITIMI');
                        fixed = fixed.replace(/BAYÃ„Â°/g, 'BAYİ');
                        fixed = fixed.replace(/BAYÄ°/g, 'BAYİ');
                        fixed = fixed.replace(/BÃ–LGE/g, 'BÖLGE');
                        fixed = fixed.replace(/Ã‡/g, 'Ç');
                        fixed = fixed.replace(/Ã§/g, 'ç');
                        fixed = fixed.replace(/Äž/g, 'Ğ');
                        fixed = fixed.replace(/ÄŸ/g, 'ğ');
                        fixed = fixed.replace(/Ä°/g, 'İ');
                        fixed = fixed.replace(/Ä±/g, 'ı');
                        fixed = fixed.replace(/Ã–/g, 'Ö');
                        fixed = fixed.replace(/Ã¶/g, 'ö');
                        fixed = fixed.replace(/Åž/g, 'Ş');
                        fixed = fixed.replace(/ÅŸ/g, 'ş');
                        fixed = fixed.replace(/Ãœ/g, 'Ü');
                        fixed = fixed.replace(/Ã¼/g, 'ü');

                        if (fixed !== val) {
                            await client.query(`UPDATE "${table}" SET "${col}" = $1 WHERE id = $2`, [fixed, item.id]);
                            totalPgCleaned++;
                        }
                    }
                }
            } catch (e) {
                // Ignore tables without primary key 'id'
            }
        }

        console.log(`\n🎉 POSTGRESQL CLEANUP SUMMARY: Fixed ${totalPgCleaned} corrupted text fields across PostgreSQL tables!`);

    } catch (e) {
        console.error('PostgreSQL Error:', e.message);
    } finally {
        await client.end();
    }
}

scanAndFixPostgres();
