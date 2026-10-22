const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vog_db'
});

async function main() {
  try {
    // 1. Check all master products with 'AYAKKABI' or 'PVW'
    const shoes = await pool.query("SELECT * FROM master_products WHERE sku ILIKE '%PVW%' AND (product_name ILIKE '%AYAKKABI%' OR grup ILIKE '%AYAKKABI%')");
    console.log('=== SHOE MASTER PRODUCTS (Count: ' + shoes.rows.length + ') ===');
    console.log(JSON.stringify(shoes.rows, null, 2));

    // 2. Check all distinct SKUs in master_products for VW Danisman
    const vwDanisman = await pool.query("SELECT DISTINCT product_name, sku, code39, ean13, barcode, size, clean_size, gender FROM master_products WHERE product_name ILIKE '%DANISMAN%' OR product_name ILIKE '%SERVIS%' LIMIT 50");
    console.log('=== VW DANISMAN MASTER PRODUCTS (Count: ' + vwDanisman.rows.length + ') ===');
    console.log(JSON.stringify(vwDanisman.rows, null, 2));

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

main();
