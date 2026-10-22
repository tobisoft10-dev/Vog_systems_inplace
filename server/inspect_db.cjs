const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vog_db'
});

async function main() {
  try {
    const mpRes = await pool.query("SELECT * FROM master_products WHERE sku ILIKE '%PVWK100100%' OR code39 ILIKE '%PVWK100100%' OR barcode ILIKE '%PVWK100100%'");
    console.log('=== MASTER_PRODUCTS FOR PVWK100100 ===');
    console.log(JSON.stringify(mpRes.rows, null, 2));

    const allMpShoes = await pool.query("SELECT id, product_name, sku, code39, barcode, ean13, size, clean_size, gender FROM master_products WHERE product_name ILIKE '%AYAKKABI%' LIMIT 30");
    console.log('=== ALL SHOES IN MASTER PRODUCTS ===');
    console.log(JSON.stringify(allMpShoes.rows, null, 2));

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

main();
