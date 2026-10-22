const { Client } = require('pg');

async function printSchema() {
    const client = new Client({ host: 'localhost', port: 5432, user: 'postgres', password: '1', database: 'vog_db' });
    await client.connect();

    const cols = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'master_products'
    `);
    console.log('Columns:', cols.rows.map(r => r.column_name));

    const sample = await client.query(`SELECT * FROM master_products WHERE brand = 'NISSAN' LIMIT 5`);
    console.log('\nSample NISSAN row:');
    console.log(sample.rows[0]);

    await client.end();
}

printSchema();
