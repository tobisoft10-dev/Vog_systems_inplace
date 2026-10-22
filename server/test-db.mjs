import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const { Pool } = pg;
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function run() {
  try {
    const res1 = await pool.query("SELECT DISTINCT sku, product_name, size FROM orders WHERE grup LIKE '%FORMEN%';");
    console.log("Formen SKUs:", res1.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();
