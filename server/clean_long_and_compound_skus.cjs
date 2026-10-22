const { Pool } = require('pg');

const pool = new Pool({ connectionString: 'postgresql://postgres:150609@localhost:5432/vog_db' });

// Comprehensive regex for clean part codes
const SKU_REGEX = /\b(P(?:AUDI|VW|SEAT|SKODA|PORSCHE|CUPRA|SCANIA|VOG|FORD|SSH|SKD|WB|WT|WK)\d+[A-Z0-9\-]*|SCKY\d+[A-Z0-9\-]*|KIYAFET(?:KIS|YAZ)-[A-Z0-9\-]+|K-OG\d+|[0-9]{12,13})\b/i;

async function run() {
  console.log('=== CLEANING & DEDUPLICATING DIRTY / LONG SKUS ===\n');

  const longSkus = await pool.query(`
    SELECT id, sku, product_name, brand, size, color
    FROM master_products 
    WHERE LENGTH(sku) > 20
    ORDER BY LENGTH(sku) DESC;
  `);

  console.log(`Found ${longSkus.rows.length} records with SKU > 20 chars.`);

  let updatedCount = 0;
  let deletedDupsCount = 0;
  let ordersUpdated = 0;
  let garbageDeleted = 0;

  for (const r of longSkus.rows) {
    const m = r.sku.match(SKU_REGEX);
    if (m) {
      const cleanSku = m[1].toUpperCase();

      // Check if cleanSku already exists in master_products
      const existing = await pool.query('SELECT id, sku FROM master_products WHERE UPPER(TRIM(sku)) = $1 AND id != $2', [cleanSku, r.id]);

      if (existing.rows.length > 0) {
        // Clean version already exists!
        // 1. Update any orders pointing to dirty SKU to point to cleanSku
        const updOrder = await pool.query('UPDATE orders SET sku = $1 WHERE sku = $2', [cleanSku, r.sku]);
        ordersUpdated += updOrder.rowCount;

        // 2. Delete the dirty duplicate record from master_products
        await pool.query('DELETE FROM master_products WHERE id = $1', [r.id]);
        deletedDupsCount++;
      } else {
        // Clean version does not exist yet. Update this record!
        // Also derive proper brand if current is GENEL
        let brand = r.brand;
        if (cleanSku.startsWith('PAUDI')) brand = 'AUDI';
        else if (cleanSku.startsWith('PVW')) brand = 'VOLKSWAGEN';
        else if (cleanSku.startsWith('PSEAT')) brand = 'SEAT';
        else if (cleanSku.startsWith('PCUPRA')) brand = 'CUPRA';
        else if (cleanSku.startsWith('PSKODA') || cleanSku.startsWith('PSKD')) brand = 'SKODA';
        else if (cleanSku.startsWith('PPORSCHE')) brand = 'PORSCHE';
        else if (cleanSku.startsWith('PSCANIA') || cleanSku.startsWith('SCKY')) brand = 'SCANIA';
        else if (cleanSku.startsWith('PFORD')) brand = 'FORD';
        else if (cleanSku.startsWith('PVOG')) brand = 'VOG';

        await pool.query(`
          UPDATE master_products 
          SET sku = $1, code39 = $1, brand = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [cleanSku, brand, r.id]);

        const updOrder = await pool.query('UPDATE orders SET sku = $1 WHERE sku = $2', [cleanSku, r.sku]);
        ordersUpdated += updOrder.rowCount;

        updatedCount++;
      }
    } else {
      // Pure sentence / note without any valid SKU
      // Check if referenced in orders
      const inOrders = await pool.query('SELECT COUNT(*) as c FROM orders WHERE sku = $1', [r.sku]);
      if (parseInt(inOrders.rows[0].c) === 0) {
        // Safe to purge garbage note
        await pool.query('DELETE FROM master_products WHERE id = $1', [r.id]);
        garbageDeleted++;
      }
    }
  }

  console.log(`\nRESULTS:`);
  console.log(`- Cleaned and updated to real SKU: ${updatedCount}`);
  console.log(`- Deleted duplicate records (clean version kept): ${deletedDupsCount}`);
  console.log(`- Updated orders to use clean SKU: ${ordersUpdated}`);
  console.log(`- Purged unreferenced packaging note rows: ${garbageDeleted}`);

  // Check new count
  const countRes = await pool.query('SELECT COUNT(*) as c, COUNT(DISTINCT UPPER(TRIM(sku))) as d FROM master_products');
  console.log(`\nPostgreSQL master_products now: ${countRes.rows[0].c} total records, ${countRes.rows[0].d} distinct SKUs.`);

  await pool.end();
}
run().catch(console.error);
