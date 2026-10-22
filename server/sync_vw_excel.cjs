const { Pool } = require('pg');
const xlsx = require('xlsx');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function syncVWPersonnel() {
    try {
        console.log('1. Checking and creating columns in personnel table...');
        await pool.query(`ALTER TABLE personnel ADD COLUMN IF NOT EXISTS gender text;`);
        await pool.query(`ALTER TABLE personnel ADD COLUMN IF NOT EXISTS mont_preference text;`);
        await pool.query(`ALTER TABLE personnel ADD COLUMN IF NOT EXISTS box_no integer;`);
        await pool.query(`ALTER TABLE personnel ADD COLUMN IF NOT EXISTS box_barcode text;`);
        await pool.query(`ALTER TABLE personnel ADD COLUMN IF NOT EXISTS packing_status text DEFAULT 'PENDING';`);
        await pool.query(`ALTER TABLE personnel ADD COLUMN IF NOT EXISTS sorter_chute integer;`);

        console.log('2. Reading Excel file...');
        const excelPath = 'C:/Users/ctopuz/Downloads/VW Binek Servis Danışmanları.xlsx';
        const wb = xlsx.readFile(excelPath);
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = xlsx.utils.sheet_to_json(sheet);
        console.log(`Excel read successfully. Total rows: ${rows.length}`);

        let updated = 0;
        let inserted = 0;

        for (const row of rows) {
            const dealer = String(row['Yetkili Satıcı'] || '').trim();
            const name = String(row['Personel Ünvanı'] || '').trim();
            const role = String(row['YENİ GÖNDERİM'] || 'SERVİS DANIŞMANI').trim();
            const mont = String(row['Danışman Mont Terchi'] || 'İNCE').trim().toUpperCase();
            const gender = String(row['Cinsiyet'] || 'Erkek').trim();
            const topSize = String(row['Beden Ölçüsü'] || 'L').trim();
            const bottomSize = String(row['Alt Beden Ölçüsü'] || '48').trim();
            const shoeCode = String(row['Ayakkabı Parça Kodu'] || '').trim();
            const dept = `BİNEK SERVİS (${mont})`;

            if (!name) continue;

            const existing = await pool.query(
                `SELECT id FROM personnel WHERE UPPER(name) = UPPER($1) AND UPPER(service_center) = UPPER($2) AND brand = 'VOLKSWAGEN'`,
                [name, dealer]
            );

            if (existing.rows.length > 0) {
                await pool.query(
                    `UPDATE personnel 
                     SET gender = $1, mont_preference = $2, department = $3, role = $4, top_size = $5, bottom_size = $6, shoe_size = $7, updated_at = CURRENT_TIMESTAMP
                     WHERE id = $8`,
                    [gender, mont, dept, role, topSize, bottomSize, shoeCode, existing.rows[0].id]
                );
                updated++;
            } else {
                await pool.query(
                    `INSERT INTO personnel (name, service_center, brand, department, role, gender, mont_preference, top_size, bottom_size, shoe_size)
                     VALUES ($1, $2, 'VOLKSWAGEN', $3, $4, $5, $6, $7, $8, $9)`,
                    [name, dealer, dept, role, gender, mont, topSize, bottomSize, shoeCode]
                );
                inserted++;
            }
        }

        console.log(`Sync completed! Updated: ${updated}, Inserted: ${inserted}`);

        // Verify summary
        const summary = await pool.query(`
            SELECT department, mont_preference, gender, COUNT(*) 
            FROM personnel 
            WHERE brand = 'VOLKSWAGEN' 
            GROUP BY department, mont_preference, gender
            ORDER BY department, gender
        `);
        console.log('VW Personnel Summary:', summary.rows);

    } catch (err) {
        console.error('Error syncing VW personnel:', err);
    } finally {
        await pool.end();
    }
}

syncVWPersonnel();
