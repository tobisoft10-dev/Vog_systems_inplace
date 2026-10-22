const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vog_db'
});

async function main() {
  try {
    // 1. Montlar
    const monts = await pool.query(`
      SELECT DISTINCT product_name, sku, code39, ean13, size, clean_size, gender
      FROM master_products 
      WHERE (brand ILIKE '%VOLKS%' OR sku ILIKE '%PVW%') 
        AND product_name ILIKE '%MONT%' 
        AND (product_name ILIKE '%DANISMAN%' OR product_name ILIKE '%BINEK%')
      ORDER BY gender, clean_size
    `);
    console.log('=== VW DANISMAN MONTLAR ===', monts.rows.length);
    console.log(JSON.stringify(monts.rows.slice(0, 15), null, 2));

    // 2. Yelekler
    const yeleks = await pool.query(`
      SELECT DISTINCT product_name, sku, code39, ean13, size, clean_size, gender
      FROM master_products 
      WHERE (brand ILIKE '%VOLKS%' OR sku ILIKE '%PVW%') 
        AND product_name ILIKE '%YELEK%'
      ORDER BY gender, clean_size
    `);
    console.log('=== VW DANISMAN YELEKLER ===', yeleks.rows.length);
    console.log(JSON.stringify(yeleks.rows.slice(0, 10), null, 2));

    // 3. Gomlekler
    const gomleks = await pool.query(`
      SELECT DISTINCT product_name, sku, code39, ean13, size, clean_size, gender
      FROM master_products 
      WHERE (brand ILIKE '%VOLKS%' OR sku ILIKE '%PVW%') 
        AND product_name ILIKE '%GOMLEK%' 
        AND (product_name ILIKE '%DANISMAN%' OR product_name ILIKE '%BINEK%')
      ORDER BY gender, clean_size
    `);
    console.log('=== VW DANISMAN GOMLEKLER ===', gomleks.rows.length);
    console.log(JSON.stringify(gomleks.rows.slice(0, 15), null, 2));

    // 4. Pantolonlar
    const pants = await pool.query(`
      SELECT DISTINCT product_name, sku, code39, ean13, size, clean_size, gender
      FROM master_products 
      WHERE (brand ILIKE '%VOLKS%' OR sku ILIKE '%PVW%') 
        AND product_name ILIKE '%PANT%' 
        AND (product_name ILIKE '%DANISMAN%' OR product_name ILIKE '%BINEK%')
      ORDER BY gender, clean_size
    `);
    console.log('=== VW DANISMAN PANTOLONLAR ===', pants.rows.length);
    console.log(JSON.stringify(pants.rows.slice(0, 15), null, 2));

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

main();
