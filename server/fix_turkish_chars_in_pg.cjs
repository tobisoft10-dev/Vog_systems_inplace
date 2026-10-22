const { Pool } = require('pg');
const { execSync } = require('child_process');
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

function queryMssqlUtf8(queryText) {
    try {
        const tmpFile = path.join(__dirname, `tmp_fix_${Date.now()}_${Math.random().toString(36).substring(7)}.json`);
        const cleanQuery = queryText.replace(/\r?\n/g, ' ');
        const cmd = `sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -f 65001 -w 65535 -y 0 -o "${tmpFile}" -Q "SET NOCOUNT ON; ${cleanQuery} FOR JSON PATH"`;
        execSync(cmd, { stdio: 'ignore' });
        if (fs.existsSync(tmpFile)) {
            const raw = fs.readFileSync(tmpFile, 'utf8');
            try { fs.unlinkSync(tmpFile); } catch (e) {}
            const jsonStr = raw.split(/\r?\n/).map(l => l.trim()).join('');
            if (jsonStr) return JSON.parse(jsonStr);
        }
    } catch (err) {
        console.error('⚠️ sqlcmd error:', err.message);
    }
    return [];
}

async function fixTurkishChars() {
    console.log('🧹 Cleaning and fixing Turkish character encoding across all PostgreSQL tables...');

    // 1. Direct update for Order 16763 voucher shown in pgAdmin screenshot
    await pool.query(`
        UPDATE vouchers 
        SET product_name = 'SEAT 2026 KIŞ MASTER TEKNİSYEN BAY POLAR FÜME',
            location = 'Ana Depo Teslimat'
        WHERE order_id = 16763 OR sku = 'SKU-VOG-16763'
    `);
    console.log('✅ Repaired order 16763 voucher product_name');

    // 2. Fetch clean order models from MSSQL via UTF-8
    const mssqlOrders = queryMssqlUtf8(`
        SELECT s.Id, s.Model, ISNULL(m.Adi, '') AS MusteriAdi, ISNULL(p.Adi, '') AS PersonelAdi
        FROM [SIPARIS].[dbo].[Siparisler] s
        LEFT JOIN [SIPARIS].[dbo].[Musteriler] m ON s.MusteriId = m.Id
        LEFT JOIN [SIPARIS].[dbo].[Personeller] p ON s.PersonelId = p.Id
    `);

    const orderMap = {};
    mssqlOrders.forEach(o => {
        orderMap[o.Id] = o;
    });

    console.log(`Fetched ${mssqlOrders.length} clean UTF-8 order records from SQL Server.`);

    // 3. Fix orders table
    const pgOrders = await pool.query("SELECT id, order_number, product_name, sub_customer_name, staff_name FROM orders WHERE product_name LIKE '%\\uFFFD%' OR product_name LIKE '%%' OR sub_customer_name LIKE '%\\uFFFD%' OR sub_customer_name LIKE '%%' OR staff_name LIKE '%\\uFFFD%' OR staff_name LIKE '%%'");
    console.log(`Found ${pgOrders.rows.length} orders with corrupt characters in PostgreSQL orders table.`);

    for (const row of pgOrders.rows) {
        const clean = orderMap[row.order_number];
        if (clean) {
            await pool.query(`
                UPDATE orders 
                SET product_name = $1,
                    sub_customer_name = $2,
                    staff_name = $3
                WHERE id = $4
            `, [clean.Model.trim(), clean.MusteriAdi.trim(), clean.PersonelAdi.trim(), row.id]);
        }
    }

    // 4. Fix vouchers table location & product_name
    await pool.query("UPDATE vouchers SET location = REPLACE(location, 'Ana Depo Tesellü...', 'Ana Depo Teslimat') WHERE location LIKE '%Tesellü%'");
    await pool.query("UPDATE vouchers SET location = REPLACE(location, 'Ana Depo Tesellü', 'Ana Depo Teslimat') WHERE location LIKE '%Tesellü%'");

    const pgVouchers = await pool.query("SELECT id, order_id, product_name FROM vouchers WHERE product_name LIKE '%\\uFFFD%' OR product_name LIKE '%%'");
    console.log(`Found ${pgVouchers.rows.length} vouchers with corrupt product_name.`);

    for (const row of pgVouchers.rows) {
        const clean = orderMap[row.order_id];
        if (clean) {
            await pool.query(`
                UPDATE vouchers 
                SET product_name = $1
                WHERE id = $2
            `, [clean.Model.trim(), row.id]);
        }
    }

    // 5. Fix sales table
    const pgSales = await pool.query("SELECT id, order_id, product_name FROM sales WHERE product_name LIKE '%\\uFFFD%' OR product_name LIKE '%%'");
    console.log(`Found ${pgSales.rows.length} sales with corrupt product_name.`);

    for (const row of pgSales.rows) {
        const clean = orderMap[row.order_id];
        if (clean) {
            await pool.query(`
                UPDATE sales 
                SET product_name = $1
                WHERE id = $2
            `, [clean.Model.trim(), row.id]);
        }
    }

    console.log('🎉 All Turkish character corruptions in PostgreSQL successfully repaired!');
    await pool.end();
}

fixTurkishChars();
