const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    password: '!719356Qse!',
    host: 'localhost',
    port: 5432,
    database: 'vog_db'
});

async function inspectAndUpdate() {
    const colsRes = await pool.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tunnel_scans'"
    );
    console.log("📋 TABLE COLUMNS:", colsRes.rows.map(r => r.column_name));

    // Ensure status column exists
    const hasStatus = colsRes.rows.some(r => r.column_name === 'status');
    if (!hasStatus) {
        await pool.query("ALTER TABLE tunnel_scans ADD COLUMN status VARCHAR(50) DEFAULT 'waiting'");
        console.log("➕ Added status column to tunnel_scans table!");
    }

    // Set all rows to printed first
    await pool.query("UPDATE tunnel_scans SET status = 'printed'");

    // Set order 16861 to waiting
    const res16861 = await pool.query("UPDATE tunnel_scans SET status = 'waiting' WHERE order_id::text = '16861'");
    console.log(`✅ Order 16861 status set to 'waiting' (${res16861.rowCount} rows), all other orders set to 'printed'!`);

    const statsRes = await pool.query("SELECT order_id, status, COUNT(*) as count FROM tunnel_scans GROUP BY order_id, status");
    console.log("📊 CURRENT TUNNEL_SCANS STATUS BREAKDOWN:", statsRes.rows);

    await pool.end();
}

inspectAndUpdate().catch(console.error);
