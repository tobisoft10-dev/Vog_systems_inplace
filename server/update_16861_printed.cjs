const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    password: '!719356Qse!',
    host: 'localhost',
    port: 5432,
    database: 'vog_db'
});

async function run() {
    const res = await pool.query(
        "UPDATE tunnel_scans SET status = 'printed', updated_at = CURRENT_TIMESTAMP WHERE order_id::text = '16861' AND status = 'waiting'"
    );
    console.log(`✅ Order 16861 updated: ${res.rowCount} rows changed to 'printed'.`);

    const statsRes = await pool.query(
        "SELECT order_id, status, COUNT(*) as count FROM tunnel_scans GROUP BY order_id, status ORDER BY order_id"
    );
    console.log("📊 TUNNEL_SCANS TABLE SUMMARY:", statsRes.rows);
    await pool.end();
}

run().catch(console.error);
