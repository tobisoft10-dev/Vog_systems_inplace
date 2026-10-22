const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '!719356Qse!',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'vog_db'
});

// Helper: Standard EAN-13 Generator with checksum
function generateEAN13() {
  const prefix = '869'; // Turkey country code
  const randomPart = Math.floor(100000000 + Math.random() * 900000000).toString();
  const eanWithoutChecksum = prefix + randomPart;
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    let digit = parseInt(eanWithoutChecksum[i]);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  const checksum = (10 - (sum % 10)) % 10;
  return eanWithoutChecksum + checksum;
}

// Helper: Slugify product name for SKU
function cleanSkuString(brand, name, size) {
  const cleanBrand = (brand || 'VOG').toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanSize = (size || 'M').toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  let cleanName = (name || 'PRODUCT').toString().trim()
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ç/g, 'c')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/İ/g, 'I')
    .replace(/Ş/g, 'S')
    .replace(/Ğ/g, 'G')
    .replace(/Ç/g, 'C')
    .replace(/Ö/g, 'O')
    .replace(/Ü/g, 'U')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 10);
    
  if (cleanName.endsWith('-')) cleanName = cleanName.slice(0, -1);
  return `${cleanBrand}-${cleanName}-${cleanSize}`;
}

async function healDatabase() {
  console.log('🚀 Database Healing Process Started...');
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 0. Pre-heal master_products table itself
    console.log('🩹 Healing master_products table itself...');
    const masterProductsRes = await client.query(`
      SELECT id, sku, product_name, size, brand, ean13, price, barcode 
      FROM master_products 
      WHERE sku IS NULL OR ean13 IS NULL OR price IS NULL OR barcode IS NULL
    `);
    console.log(`🔍 Found ${masterProductsRes.rows.length} master_products that need healing.`);
    
    let healedMasterCount = 0;
    for (const prod of masterProductsRes.rows) {
      const brand = (prod.brand || 'SEAT').trim();
      const productName = (prod.product_name || 'Urun').trim();
      const size = (prod.size || 'M').trim();
      
      let sku = prod.sku;
      let ean13 = prod.ean13;
      let price = prod.price || 250.00;
      let barcode = prod.barcode;
      
      if (!sku) {
        sku = cleanSkuString(brand, productName, size);
      }
      if (!ean13) {
        ean13 = generateEAN13();
      }
      if (!barcode) {
        barcode = ean13;
      }
      
      try {
        await client.query(`
          UPDATE master_products 
          SET sku = $1, ean13 = $2, price = $3, barcode = $4
          WHERE id = $5
        `, [sku, ean13, price, barcode, prod.id]);
        healedMasterCount++;
      } catch (err) {
        // If unique constraint violation on ean13/barcode, generate another one and try once
        if (err.message.includes('unique') || err.code === '23505') {
          ean13 = generateEAN13();
          barcode = ean13;
          await client.query(`
            UPDATE master_products 
            SET sku = $1, ean13 = $2, price = $3, barcode = $4
            WHERE id = $5
          `, [sku, ean13, price, barcode, prod.id]);
          healedMasterCount++;
        } else {
          throw err;
        }
      }
    }
    console.log(`✅ Successfully healed ${healedMasterCount} master_products rows.`);

    // 1. Find all orders with null SKU, EAN13, or Price
    const ordersRes = await client.query(`
      SELECT id, sku, product_name, size, brand, ean13, quantity 
      FROM orders 
      WHERE sku IS NULL OR ean13 IS NULL
    `);
    
    console.log(`🔍 Found ${ordersRes.rows.length} orders that need healing.`);
    
    let healedCount = 0;
    
    for (const order of ordersRes.rows) {
      const brand = (order.brand || 'SEAT').trim();
      const productName = (order.product_name || 'Standart Urun').trim();
      
      // Parse size from notes or default to 'M'
      let size = order.size ? order.size.trim() : 'M';
      
      // Try to find matching master product
      let masterProduct = null;
      
      // Attempt 1: Match by product_name, brand and size
      const matchRes = await client.query(`
        SELECT sku, ean13, price, product_name 
        FROM master_products 
        WHERE UPPER(brand) = UPPER($1) 
          AND UPPER(product_name) = UPPER($2) 
          AND UPPER(size) = UPPER($3)
        LIMIT 1
      `, [brand, productName, size]);
      
      if (matchRes.rows.length > 0) {
        masterProduct = matchRes.rows[0];
      } else {
        // Attempt 2: Match by product_name and brand (without size constraint)
        const matchNoSizeRes = await client.query(`
          SELECT sku, ean13, price, product_name 
          FROM master_products 
          WHERE UPPER(brand) = UPPER($1) 
            AND UPPER(product_name) = UPPER($2)
          LIMIT 1
        `, [brand, productName]);
        if (matchNoSizeRes.rows.length > 0) {
          masterProduct = matchNoSizeRes.rows[0];
        }
      }
      
      let sku = order.sku;
      let ean13 = order.ean13;
      let price = 250.00; // Premium Default Price
      
      if (masterProduct) {
        sku = masterProduct.sku;
        ean13 = masterProduct.ean13 || ean13;
        price = masterProduct.price || price;
      }
      
      // If still missing SKU or EAN13, generate them
      if (!sku) {
        sku = cleanSkuString(brand, productName, size);
      }
      if (!ean13) {
        // Check if there is already a product in master_products with this SKU
        const skuCheck = await client.query('SELECT ean13, price FROM master_products WHERE sku = $1 LIMIT 1', [sku]);
        if (skuCheck.rows.length > 0) {
          ean13 = skuCheck.rows[0].ean13 || generateEAN13();
          price = skuCheck.rows[0].price || price;
        } else {
          ean13 = generateEAN13();
        }
      }
      
      // Upsert into master_products if it wasn't there
      const existingProd = await client.query('SELECT id, ean13, price FROM master_products WHERE sku = $1 LIMIT 1', [sku]);
      if (existingProd.rows.length > 0) {
        ean13 = existingProd.rows[0].ean13 || ean13;
        price = existingProd.rows[0].price || price;
        await client.query(`
          UPDATE master_products 
          SET product_name = COALESCE(product_name, $1),
              size = COALESCE(size, $2),
              brand = COALESCE(brand, $3),
              ean13 = COALESCE(ean13, $4),
              barcode = COALESCE(barcode, $4),
              price = COALESCE(price, $5)
          WHERE id = $6
        `, [productName, size, brand, ean13, price, existingProd.rows[0].id]);
      } else {
        await client.query(`
          INSERT INTO master_products (sku, product_name, size, brand, ean13, barcode, price)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [sku, productName, size, brand, ean13, ean13, price]);
      }
      
      // Update the order row
      await client.query(`
        UPDATE orders 
        SET sku = $1, ean13 = $2, estimated_delivery_date = COALESCE(estimated_delivery_date, '1 Hafta')
        WHERE id = $3
      `, [sku, ean13, order.id]);
      
      healedCount++;
    }
    
    // 2. Heal Vouchers and Sales prices and EAN13s from master_products by SKU
    console.log('🔄 Syncing missing fields in vouchers and sales tables from master_products...');
    
    const vouchersFix = await client.query(`
      UPDATE vouchers v
      SET 
        ean13 = COALESCE(v.ean13, mp.ean13),
        price = COALESCE(v.price, mp.price),
        sku = COALESCE(v.sku, mp.sku)
      FROM master_products mp
      WHERE (v.sku = mp.sku OR v.ean13 = mp.ean13)
        AND (v.ean13 IS NULL OR v.price IS NULL OR v.sku IS NULL)
      RETURNING v.id
    `);
    console.log(`✅ Healed ${vouchersFix.rowCount} rows in vouchers table.`);
    
    const salesFix = await client.query(`
      UPDATE sales s
      SET 
        ean13 = COALESCE(s.ean13, mp.ean13),
        price = COALESCE(s.price, mp.price),
        sku = COALESCE(s.sku, mp.sku)
      FROM master_products mp
      WHERE (s.sku = mp.sku OR s.ean13 = mp.ean13)
        AND (s.ean13 IS NULL OR s.price IS NULL OR s.sku IS NULL)
      RETURNING s.id
    `);
    console.log(`✅ Healed ${salesFix.rowCount} rows in sales table.`);
    
    await client.query('COMMIT');
    console.log(`✨ Successfully healed ${healedCount} order records and synced all catalogs!`);
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error during healing process:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

healDatabase();
