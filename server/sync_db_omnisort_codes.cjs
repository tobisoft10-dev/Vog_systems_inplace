const { Pool } = require('pg');
require('dotenv').config({ path: 'c:/vog_system/.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vog_db'
});

const chToPhysicalMap = {
    // Bölüm 1 (A Hattı Sol: A0 [6 Göz] + A1 [9 Göz])
    1: 'A1-1', 2: 'A1-2', 3: 'A1-3', 4: 'A1-4', 5: 'A1-5', 6: 'A1-6', 7: 'A1-7', 8: 'A1-8', 9: 'A1-9',
    10: 'A0-1', 11: 'A0-2', 12: 'A0-3', 13: 'A0-4', 14: 'A0-5', 15: 'A0-6',

    // Bölüm 2 (A Hattı Sağ: A3 [9 Göz] + A4 [6 Göz])
    16: 'A3-1', 17: 'A3-2', 18: 'A3-3', 19: 'A3-4', 20: 'A3-5', 21: 'A3-6', 22: 'A3-7', 23: 'A3-8', 24: 'A3-9',
    25: 'A4-1', 26: 'A4-2', 27: 'A4-3', 28: 'A4-4', 29: 'A4-5', 30: 'A4-6',

    // Bölüm 3 (B Hattı Sol: B0 [6 Göz] + B1 [9 Göz])
    31: 'B1-1', 32: 'B1-2', 33: 'B1-3', 34: 'B1-4', 35: 'B1-5', 36: 'B1-6', 37: 'B1-7', 38: 'B1-8', 39: 'B1-9',
    40: 'B0-1', 41: 'B0-2', 42: 'B0-3', 43: 'B0-4', 44: 'B0-5', 45: 'B0-6',

    // Bölüm 4 (B Hattı Sağ: B3 [9 Göz] + B4 [6 Göz])
    46: 'B3-1', 47: 'B3-2', 48: 'B3-3', 49: 'B3-4', 50: 'B3-5', 51: 'B3-6', 52: 'B3-7', 53: 'B3-8', 54: 'B3-9',
    55: 'B4-1', 56: 'B4-2', 57: 'B4-3', 58: 'B4-4', 59: 'B4-5', 60: 'B4-6'
};

async function syncDb() {
    console.log('🔄 Updating sorter_chute_state with exact OmniSort physical codes (A0-1..B4-6)...');
    for (let ch = 1; ch <= 60; ch++) {
        const pCode = chToPhysicalMap[ch];
        await pool.query(
            `UPDATE sorter_chute_state SET physical_code = $1 WHERE chute_no = $2`,
            [pCode, ch]
        );
    }
    console.log('✅ Updated all 60 chutes in PostgreSQL database!');
    await pool.end();
}

syncDb().catch(e => {
    console.error('Error syncing db:', e);
    process.exit(1);
});
