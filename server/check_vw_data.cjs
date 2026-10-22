const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'vog_db',
  password: process.env.DB_PASSWORD || '!719356Qse!',
  port: process.env.DB_PORT || 5432
});

async function check() {
  const pRows = await pool.query("SELECT * FROM personnel WHERE brand = 'VOLKSWAGEN' LIMIT 3");
  console.log('Sample VW Personnel in DB:', pRows.rows);

  const oRows = await pool.query("SELECT * FROM orders WHERE brand = 'VOLKSWAGEN' LIMIT 5");
  console.log('Sample VW Orders in DB:', oRows.rows);

  const distinctDealers = await pool.query("SELECT service_center, COUNT(*) as c FROM personnel WHERE brand = 'VOLKSWAGEN' GROUP BY service_center ORDER BY c DESC LIMIT 5");
  console.log('Top 5 VW Dealers by Staff Count:', distinctDealers.rows);

  const distinctDepts = await pool.query("SELECT department, role, COUNT(*) as c FROM personnel WHERE brand = 'VOLKSWAGEN' GROUP BY department, role");
  console.log('VW Departments & Roles in DB:', distinctDepts.rows);

  await pool.end();
}
check();
