const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

if (!process.env.DB_USER) {
  console.error("❌ HATA: .env dosyası okunamadı veya DB_USER tanımlı değil!");
  console.error("Lütfen uzak sunucudaki 'server' klasöründe '.env' dosyasının bulunduğundan ve veritabanı bilgilerinin doğru olduğundan emin olun.");
  process.exit(1);
}

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function run() {
  console.log("🚀 Starting database insert transaction...");
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch products from master_products to populate real data references
    console.log("🔍 Fetching sample products from master_products...");
    const productsRes = await client.query(
      "SELECT sku, product_name, barcode, ean13, price, brand, gender, color, size FROM master_products WHERE brand = 'SEAT' LIMIT 2;"
    );

    if (productsRes.rows.length < 2) {
      throw new Error("Could not find at least 2 SEAT products in master_products to use as reference.");
    }

    const prod1 = productsRes.rows[0];
    const prod2 = productsRes.rows[1];
    console.log(`✅ Reference Product 1: ${prod1.product_name} (${prod1.sku})`);
    console.log(`✅ Reference Product 2: ${prod2.product_name} (${prod2.sku})`);

    // 2. Fetch a sub_customer to use as reference
    console.log("🔍 Fetching a SEAT dealer from sub_customers...");
    const subCustomerRes = await client.query(
      "SELECT id, name FROM sub_customers WHERE parent_brand = 'SEAT' LIMIT 1;"
    );

    if (subCustomerRes.rows.length === 0) {
      throw new Error("Could not find any SEAT sub_customers to reference.");
    }

    const subCust = subCustomerRes.rows[0];
    console.log(`✅ Reference Sub Customer: ${subCust.name} (ID: ${subCust.id})`);

    // 3. Insert into orders table
    console.log("📦 Inserting new test orders...");
    const order1Res = await client.query(`
      INSERT INTO orders (
        brand, staff_name, sub_customer_id, sub_customer_name, product_name, 
        sku, quantity, status, estimated_delivery_date, notes, grup, size, ean13, barcode
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING order_number, id, sku, product_name, quantity, staff_name, brand;
    `, [
      'SEAT', 'CAN YILMAZ', subCust.id, subCust.name, prod1.product_name,
      prod1.sku, 3, 'İşlem Bekliyor', '2026-08-15', 'Görev: Formen - Test Siparişi 1', 'Formen', prod1.size, prod1.ean13, prod1.barcode
    ]);

    const order2Res = await client.query(`
      INSERT INTO orders (
        brand, staff_name, sub_customer_id, sub_customer_name, product_name, 
        sku, quantity, status, estimated_delivery_date, notes, grup, size, ean13, barcode
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING order_number, id, sku, product_name, quantity, staff_name, brand;
    `, [
      'SEAT', 'PINAR KAYA', subCust.id, subCust.name, prod2.product_name,
      prod2.sku, 5, 'İşlem Bekliyor', '2026-08-20', 'Görev: Danışman - Test Siparişi 2', 'Danışman', prod2.size, prod2.ean13, prod2.barcode
    ]);

    const ord1 = order1Res.rows[0];
    const ord2 = order2Res.rows[0];
    console.log(`✅ Order 1 Inserted: Number = ${ord1.order_number}, ID = ${ord1.id}`);
    console.log(`✅ Order 2 Inserted: Number = ${ord2.order_number}, ID = ${ord2.id}`);

    // 4. Insert corresponding vouchers referencing the order_number
    console.log("📦 Inserting corresponding vouchers...");
    const voucher1Res = await client.query(`
      INSERT INTO vouchers (
        order_id, location, barcode, ean13, quantity, product_name, 
        color, size, brand, sku, price, gender, staff_name, grup, sub_customer_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id, order_id, location, sku, quantity, tracking_number;
    `, [
      ord1.order_number, 'Ana Depo Tesellüm', prod1.barcode, prod1.ean13, 3, prod1.product_name,
      prod1.color, prod1.size, 'SEAT', prod1.sku, prod1.price, prod1.gender, ord1.staff_name, 'Formen', subCust.name
    ]);

    const voucher2Res = await client.query(`
      INSERT INTO vouchers (
        order_id, location, barcode, ean13, quantity, product_name, 
        color, size, brand, sku, price, gender, staff_name, grup, sub_customer_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id, order_id, location, sku, quantity, tracking_number;
    `, [
      ord2.order_number, 'Ana Depo Tesellüm', prod2.barcode, prod2.ean13, 5, prod2.product_name,
      prod2.color, prod2.size, 'SEAT', prod2.sku, prod2.price, prod2.gender, ord2.staff_name, 'Danışman', subCust.name
    ]);

    const v1 = voucher1Res.rows[0];
    const v2 = voucher2Res.rows[0];
    console.log(`✅ Voucher 1 Inserted: ID = ${v1.id}, Order ID = ${v1.order_id}`);
    console.log(`✅ Voucher 2 Inserted: ID = ${v2.id}, Order ID = ${v2.order_id}`);

    // 5. Insert corresponding sales records referencing the order_number
    console.log("📦 Inserting corresponding sales...");
    const sale1Res = await client.query(`
      INSERT INTO sales (
        order_id, location, barcode, ean13, quantity, sku, product_name, staff_name, brand, price, grup
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, order_id, sku, quantity;
    `, [
      ord1.order_number, 'Satış Noktası', prod1.barcode, prod1.ean13, 3, prod1.sku, prod1.product_name, ord1.staff_name, 'SEAT', prod1.price, 'Formen'
    ]);

    const sale2Res = await client.query(`
      INSERT INTO sales (
        order_id, location, barcode, ean13, quantity, sku, product_name, staff_name, brand, price, grup
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, order_id, sku, quantity;
    `, [
      ord2.order_number, 'Satış Noktası', prod2.barcode, prod2.ean13, 5, prod2.sku, prod2.product_name, ord2.staff_name, 'SEAT', prod2.price, 'Danışman'
    ]);

    const s1 = sale1Res.rows[0];
    const s2 = sale2Res.rows[0];
    console.log(`✅ Sale 1 Inserted: ID = ${s1.id}, Order ID = ${s1.order_id}`);
    console.log(`✅ Sale 2 Inserted: ID = ${s2.id}, Order ID = ${s2.order_id}`);

    // Commit Transaction
    await client.query('COMMIT');
    console.log("🎉 Transaction committed successfully! All test data inserted.");

    // Verification Queries
    console.log("\n=== VERIFICATION QUERY RESULTS ===");
    
    console.log("\n--- ORDERS ---");
    const verifyOrders = await client.query(
      "SELECT order_number, staff_name, sku, quantity, status, notes FROM orders WHERE order_number IN ($1, $2);",
      [ord1.order_number, ord2.order_number]
    );
    console.table(verifyOrders.rows);

    console.log("\n--- VOUCHERS ---");
    const verifyVouchers = await client.query(
      "SELECT id, order_id, location, sku, quantity, staff_name, brand FROM vouchers WHERE order_id IN ($1, $2);",
      [ord1.order_number, ord2.order_number]
    );
    console.table(verifyVouchers.rows);

    console.log("\n--- SALES ---");
    const verifySales = await client.query(
      "SELECT id, order_id, location, sku, quantity, staff_name, brand FROM sales WHERE order_id IN ($1, $2);",
      [ord1.order_number, ord2.order_number]
    );
    console.table(verifySales.rows);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Transaction failed and rolled back:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
