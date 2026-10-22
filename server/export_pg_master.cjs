const { Client } = require('pg');
const fs = require('fs');

async function main() {
    const client = new Client({ host: 'localhost', port: 5432, user: 'postgres', password: '1', database: 'vog_db' });
    await client.connect();
    const res = await client.query("SELECT id, sku, brand, product_name, size, barcode, code39 FROM master_products WHERE brand ILIKE '%NISSAN%' ORDER BY product_name, size");
    fs.writeFileSync('c:/vog_system/server/pg_master_nissan.json', JSON.stringify(res.rows, null, 2), 'utf8');
    await client.end();
}
main();
