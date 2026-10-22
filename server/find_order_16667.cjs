const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function run() {
    console.log('🔍 Searching for Order 16667 across all data sources...');

    // 1. Check PostgreSQL orders table
    try {
        const pgRes = await pool.query("SELECT * FROM orders WHERE order_number = 16667 OR id::text = '16667'");
        console.log(`📌 PostgreSQL orders table count: ${pgRes.rows.length}`);
        if (pgRes.rows.length > 0) {
            console.log('PG Order:', pgRes.rows[0]);
        }
    } catch (e) {
        console.error('PG Orders Error:', e.message);
    }

    // 2. Check PostgreSQL vouchers table
    try {
        const vRes = await pool.query("SELECT * FROM vouchers WHERE order_id = 16667");
        console.log(`📌 PostgreSQL vouchers table count: ${vRes.rows.length}`);
    } catch (e) {
        console.error('PG Vouchers Error:', e.message);
    }

    // 3. Check CSV files
    ['orders.csv', 'order.csv'].forEach(file => {
        const filePath = path.join(__dirname, '../', file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n').filter(l => l.includes('16667'));
            console.log(`📌 File ${file} matches count: ${lines.length}`);
            if (lines.length > 0) {
                console.log(`Sample match from ${file}:`, lines[0]);
            }
        }
    });

    // 4. Check MSSQL
    let mssql = null;
    try {
        mssql = require('mssql');
        const mssqlConfig = {
            user: process.env.MSSQL_USER || 'sa',
            password: process.env.MSSQL_PASSWORD || 'Vog2026!',
            server: process.env.MSSQL_HOST || 'localhost',
            database: process.env.MSSQL_DB || 'VOG_ERP',
            options: { encrypt: false, trustServerCertificate: true }
        };
        const mConn = await mssql.connect(mssqlConfig);
        const mRes = await mConn.request().query("SELECT * FROM SIPARIS WHERE Id = 16667");
        console.log(`📌 MSSQL SIPARIS table count: ${mRes.recordset.length}`);
        if (mRes.recordset.length > 0) {
            console.log('MSSQL Record:', mRes.recordset[0]);
        }
        mConn.close();
    } catch (mErr) {
        console.log('📌 MSSQL Query Note:', mErr.message);
    }

    await pool.end();
}

run();
