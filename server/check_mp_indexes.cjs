const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:150609@localhost:5432/vog_db' });

async function check() {
    const res = await pool.query(`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'master_products';
    `);
    console.log(res.rows);
    await pool.end();
}
check();
