const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function test() {
    try {
        const p = await pool.query("SELECT id, name FROM personnel WHERE name = 'CEM OĞUZ' LIMIT 1");
        console.log('Selected person:', p.rows[0]);

        const res = await fetch('http://localhost:3001/api/personnel-orders/complete-box', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ personnel_id: p.rows[0].id, print_label: false })
        });
        const data = await res.json();
        console.log('Complete Box Response:', data);

        const bl = await pool.query("SELECT id, brand, dealer, staff_name, department, barcode, box_number, total_quantity FROM box_labels WHERE staff_name = 'CEM OĞUZ'");
        console.log('Saved in box_labels:', bl.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

test();
