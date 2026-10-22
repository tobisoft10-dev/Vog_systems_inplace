
const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkUsers() {
    try {
        const res = await pool.query('SELECT username, database_name FROM ws_users');
        console.log('WS Users Found:', res.rows.length);
        console.log('Users:', JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error('Error checking users:', err.message);
    } finally {
        await pool.end();
    }
}

checkUsers();
