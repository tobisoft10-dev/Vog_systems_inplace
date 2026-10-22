const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const chToPhysicalMap = {
    // Bölüm 1 (Sol Dış Duvar): R01 (9 Göz) + R09 (6 Göz)
    1: 'R01.1', 2: 'R01.2', 3: 'R01.3', 4: 'R01.4', 5: 'R01.5', 6: 'R01.6', 7: 'R01.7', 8: 'R01.8', 9: 'R01.9',
    10: 'R09.1', 11: 'R09.2', 12: 'R09.3', 13: 'R09.4', 14: 'R09.5', 15: 'R09.6',

    // Bölüm 2 (Sol İç Duvar): R02 (9 Göz) + R10 (6 Göz)
    16: 'R02.1', 17: 'R02.2', 18: 'R02.3', 19: 'R02.4', 20: 'R02.5', 21: 'R02.6', 22: 'R02.7', 23: 'R02.8', 24: 'R02.9',
    25: 'R10.1', 26: 'R10.2', 27: 'R10.3', 28: 'R10.4', 29: 'R10.5', 30: 'R10.6',

    // Bölüm 3 (Sağ İç Duvar): R03 (9 Göz) + R11 (6 Göz)
    31: 'R03.1', 32: 'R03.2', 33: 'R03.3', 34: 'R03.4', 35: 'R03.5', 36: 'R03.6', 37: 'R03.7', 38: 'R03.8', 39: 'R03.9',
    40: 'R11.1', 41: 'R11.2', 42: 'R11.3', 43: 'R11.4', 44: 'R11.5', 45: 'R11.6',

    // Bölüm 4 (Sağ Dış Duvar): R04 (9 Göz) + R12 (6 Göz)
    46: 'R04.1', 47: 'R04.2', 48: 'R04.3', 49: 'R04.4', 50: 'R04.5', 51: 'R04.6', 52: 'R04.7', 53: 'R04.8', 54: 'R04.9',
    55: 'R12.1', 56: 'R12.2', 57: 'R12.3', 58: 'R12.4', 59: 'R12.5', 60: 'R12.6'
};

async function syncDb() {
    console.log('🔄 Syncing PostgreSQL sorter_chute_state with R01.1..R12.6 codes...');
    for (let ch = 1; ch <= 60; ch++) {
        const physical = chToPhysicalMap[ch];
        await pool.query(`
            UPDATE sorter_chute_state 
            SET physical_code = $1 
            WHERE chute_no = $2
        `, [physical, ch]);
    }
    console.log('✅ Successfully updated all 60 chutes in database.');
    process.exit(0);
}

syncDb().catch(e => { console.error(e); process.exit(1); });
