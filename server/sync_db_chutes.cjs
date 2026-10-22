const { Pool } = require('pg');
const engine = require('./services/sorter_engine.cjs');

const pool = new Pool({
    user: 'postgres',
    password: '!719356Qse!',
    host: 'localhost',
    database: 'vog_db',
    port: 5432
});

async function syncDbPhysicalCodes() {
    console.log('🔄 Syncing sorter_chute_state physical codes in DB...');
    for (let ch = 1; ch <= 60; ch++) {
        const phys = engine.chToPhysicalMap[ch];
        await pool.query(
            'UPDATE sorter_chute_state SET physical_code = $1 WHERE chute_no = $2',
            [phys, ch]
        );
    }
    const res = await pool.query('SELECT chute_no, physical_code, item_count, assigned_destination FROM sorter_chute_state ORDER BY chute_no LIMIT 15');
    console.log('✅ Updated DB rows:');
    console.table(res.rows);
    await pool.end();
}

syncDbPhysicalCodes().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
