const sorterEngine = require('./services/sorter_engine.cjs');
const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function syncCodes() {
    for (let i = 1; i <= 60; i++) {
        const code = sorterEngine.chToPhysicalMap[i] || `CH-${i.toString().padStart(2, '0')}`;
        await pool.query('UPDATE sorter_chute_state SET physical_code = $1 WHERE chute_no = $2', [code, i]);
    }
    console.log('✅ Synchronized all 60 physical_code in sorter_chute_state to OmniSort Mini architecture.');
    await pool.end();
}

syncCodes().catch(err => {
    console.error(err);
    process.exit(1);
});
