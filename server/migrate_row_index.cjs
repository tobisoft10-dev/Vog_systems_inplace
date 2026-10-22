const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function run() {
  try {
    console.log("Adding excel_row_index column to orders table...");
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS excel_row_index SERIAL;");
    console.log("Column excel_row_index added successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

run();
