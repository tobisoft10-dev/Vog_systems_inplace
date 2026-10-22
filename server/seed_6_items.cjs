const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    password: '!719356Qse!',
    host: 'localhost',
    port: 5432,
    database: 'vog_db'
});

async function setup() {
    const sampleProducts = [
        { barcode: '901320100105', product_name: 'Yıkamacı Tshirt-XL' },
        { barcode: 'PVW16500', product_name: 'Polo Yaka Tişört-L' },
        { barcode: 'K-OG0313', product_name: 'Servis Danışmanı Gömlek-M' },
        { barcode: 'PSEAT16810', product_name: 'Teknisyen Pantolon-50' },
        { barcode: 'PSKODA1540', product_name: 'Yedek Parça Yelek-L' },
        { barcode: 'PAUDI12090', product_name: 'Kışlık Mont-XL' }
    ];

    for (let p of sampleProducts) {
        await pool.query(
            "INSERT INTO master_products (barcode, product_name, sku) VALUES ($1, $2, $1) ON CONFLICT DO NOTHING",
            [p.barcode, p.product_name]
        );
    }

    await pool.query("DELETE FROM tunnel_scans WHERE order_id::text = '16706'");

    const qtys = [2, 4, 2, 3, 1, 2];
    for (let i = 0; i < sampleProducts.length; i++) {
        for (let q = 0; q < qtys[i]; q++) {
            await pool.query(
                "INSERT INTO tunnel_scans (order_id, barcode, rfid_tag, status) VALUES (16706, $1, $2, 'Scanned')",
                [sampleProducts[i].barcode, `TAG_16706_${i}_${q}`]
            );
        }
    }

    console.log("🎉 SUCCESS: 6 distinct product rows created for order 16706 in tunnel_scans!");
    await pool.end();
}

setup().catch(console.error);
