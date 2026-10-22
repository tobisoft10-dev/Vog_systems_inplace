const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

const epcs = [
    { epc: '303B4FDAC05A0800000002C9', barcode: '8682030092192', serial: '713' },
    { epc: '303B4FDAC05A0800000002CB', barcode: '8682030092192', serial: '715' },
    { epc: '303B4FDAC05A0800000002CC', barcode: '8682030092192', serial: '716' },
    { epc: '303B50CC02DE11C000000001', barcode: '8691680751687', serial: '1' },
    { epc: '303B50CC02DE11C000000002', barcode: '8691680751687', serial: '2' },
    { epc: '303B50CC02DE11C000000003', barcode: '8691680751687', serial: '3' },
    { epc: '303B506CC1D767C0000000BB', barcode: '8687870482719', serial: '187' },
    { epc: '303B506CC1D767C0000000BC', barcode: '8687870482719', serial: '188' },
    { epc: '840005BA64897F818D880001', barcode: '00615049686314', serial: '6669467649' },
    { epc: '840005BA648B0F4E8D880001', barcode: '00615049696313', serial: '62504042497' }
];

async function run() {
    console.log("==================================================================");
    console.log(" 📊 TÜM OKUNAN 10 ETİKETİN DEŞİFRE EDİLMİŞ VERİTABANI ANALİZİ");
    console.log("==================================================================");

    const barcodes = epcs.map(e => e.barcode);
    const epcStrings = epcs.map(e => e.epc);

    // 1. master_products
    const mp = await pool.query(
        `SELECT id, brand, product_name, sku, barcode, size, color 
         FROM master_products 
         WHERE barcode = ANY($1) OR sku = ANY($1) OR ean13 = ANY($1)`,
        [barcodes]
    );
    console.log("\n📦 MASTER PRODUCTS EŞLEŞMELERİ:");
    console.table(mp.rows);

    // 2. orders
    const ord = await pool.query(
        `SELECT id, order_number, brand, product_name, sku, code39, sub_customer_name, staff_name, quantity, remaining_quantity 
         FROM orders 
         WHERE sku = ANY($1) OR code39 = ANY($1) OR order_number IN ('16706', '16804', '16806', '16667')`
        , [barcodes]
    );
    console.log("\n📋 İLGİLİ SİPARİŞLER (orders tablosu):");
    console.table(ord.rows);


    // 3. vouchers / sales / shipments
    const vouchers = await pool.query(
        `SELECT id, brand, code39, sku, size, quantity 
         FROM vouchers 
         WHERE code39 = ANY($1) OR sku = ANY($1) LIMIT 10`,
        [barcodes]
    );
    console.log("\n🏷️ VOUCHERS EŞLEŞMELERİ:");
    console.table(vouchers.rows);

    await pool.end();
}

run();
