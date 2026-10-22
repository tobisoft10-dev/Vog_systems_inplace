const { Pool } = require('pg');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: 'postgres',
  password: '150609%M',
  host: 'localhost',
  port: 5432,
  database: 'vog_db'
});

function executeMssql(queryText) {
  const tmpFile = path.join(__dirname, `tmp_fix_${Date.now()}.sql`);
  fs.writeFileSync(tmpFile, queryText, 'utf8');
  const cmd = `sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -d SIPARIS -f 65001 -i "${tmpFile}"`;
  execSync(cmd, { stdio: 'inherit' });
  try { fs.unlinkSync(tmpFile); } catch (e) {}
}

async function run() {
  const baseSkus = [
    'PSKD100025', 'PSKD100026', 'PSKD100041', 'PSKD100042', 'PSKD100052', 'PSKD100053',
    'PSKD100019', 'PSKD100056', 'PSKD100028', 'PSKD100036', 'PSKD100055', 'PSKD100054',
    'PSKD100050', 'PSKD100051', 'PSKD200010', 'PSKD200032', 'PSKD200033', 'PSKD200034',
    'PSKD200035', 'PSKD200019', 'PSKD200036', 'PSKD200038', 'PSKD200039', 'PSKD200040'
  ];

  const inList = baseSkus.map(s => `'${s}'`).join(',');

  executeMssql(`
    UPDATE [SIPARIS].[dbo].[MasterUrunler]
    SET CleanBeden = 'STD', Beden = 'Standart'
    WHERE ParcaNo IN (${inList});
  `);
  console.log('MSSQL: Base product sizes set to STD/Standart.');

  const res = await pool.query(`
    UPDATE master_products
    SET clean_size = 'STD', size = 'Standart'
    WHERE sku = ANY($1::text[])
  `, [baseSkus]);
  console.log(`PG: ${res.rowCount} base products set to STD/Standart.`);

  await pool.end();
}

run().catch(console.error);
