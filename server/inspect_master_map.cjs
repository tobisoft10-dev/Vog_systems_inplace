const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vog_db'
});

async function main() {
  try {
    // 1. Ayakkabı eşleşmeleri
    const shoeMp = await pool.query("SELECT sku, code39, ean13, barcode, size, clean_size, gender, product_name FROM master_products WHERE sku ILIKE 'PVWB%' OR sku ILIKE 'PVWK%'");
    console.log('=== SHOE MASTER PRODUCTS IN DB ===', shoeMp.rows.length);
    const shoeMap = {};
    shoeMp.rows.forEach(r => {
      shoeMap[r.sku] = { ean13: r.ean13 || r.barcode, size: r.clean_size || r.size, name: r.product_name };
    });
    console.log('Sample shoe map:', Object.keys(shoeMap).slice(0, 10).map(k => `${k} -> EAN: ${shoeMap[k].ean13}, Size: ${shoeMap[k].size}`));

    // 2. Mont (Kalın / İnce / Erkek / Kadın)
    const montMp = await pool.query("SELECT sku, code39, ean13, size, clean_size, gender, product_name FROM master_products WHERE (sku ILIKE 'PVWK100102%' OR sku ILIKE 'PVWK100103%' OR sku ILIKE 'PVWK100106%' OR sku ILIKE 'PVWK100107%')");
    console.log('=== MONT MASTER PRODUCTS ===', montMp.rows.length);
    console.log(montMp.rows.slice(0, 8));

    // 3. Yelek (Erkek / Kadın)
    const yelekMp = await pool.query("SELECT sku, code39, ean13, size, clean_size, gender, product_name FROM master_products WHERE (sku ILIKE 'PVWK100104%' OR sku ILIKE 'PVWK100105%')");
    console.log('=== YELEK MASTER PRODUCTS ===', yelekMp.rows.length);
    console.log(yelekMp.rows.slice(0, 8));

    // 4. Gomlek
    const gomlekMp = await pool.query("SELECT sku, code39, ean13, size, clean_size, gender, product_name FROM master_products WHERE (sku ILIKE 'PVWB260012%' OR sku ILIKE 'PVWB260013%')");
    console.log('=== GOMLEK MASTER PRODUCTS ===', gomlekMp.rows.length);
    console.log(gomlekMp.rows.slice(0, 8));

    // 5. Pantolon
    const pantMp = await pool.query("SELECT sku, code39, ean13, size, clean_size, gender, product_name FROM master_products WHERE (sku ILIKE 'PVWB260009%' OR sku ILIKE 'PVWB260017%' OR sku ILIKE 'PVWB250007%' OR sku ILIKE 'PVWK100008%')");
    console.log('=== PANTOLON MASTER PRODUCTS ===', pantMp.rows.length);
    console.log(pantMp.rows.slice(0, 8));

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

main();
