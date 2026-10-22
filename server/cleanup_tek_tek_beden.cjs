const { Pool } = require('c:/vog_system/server/node_modules/pg');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pgPool = new Pool({ database: 'vog_db', user: 'postgres', password: process.env.DB_PASSWORD || '150609' });

function runSqlcmd(sqlQuery) {
    const tmpSql = path.join(__dirname, `tmp_query_${Date.now()}.sql`);
    fs.writeFileSync(tmpSql, sqlQuery, 'utf8');
    const cmd = `sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -f 65001 -w 65535 -y 0 -i "${tmpSql}"`;
    try {
        const out = execSync(cmd, { encoding: 'utf8', windowsHide: true });
        try { fs.unlinkSync(tmpSql); } catch (_) {}
        return out;
    } catch (err) {
        try { fs.unlinkSync(tmpSql); } catch (_) {}
        throw err;
    }
}

async function runCleanup() {
    console.log("==================================================================");
    console.log(" 🧹 VOG SYSTEM: CLEANUP 'TEK TEK BEDEN' & RESOLVE REAL PART NUMBERS");
    console.log("==================================================================");

    // 1. Clean vouchers table
    console.log("\n1. Updating 'vouchers' table...");
    const vUpdate = await pgPool.query(`
        UPDATE vouchers
        SET sku = 'PVOG16954',
            code39 = 'PVOG16954'
        WHERE order_id = 16954 
           OR sku ILIKE '%TEK TEK BEDEN%' 
           OR code39 ILIKE '%TEK TEK BEDEN%'
        RETURNING id, order_id, product_name, size, sku, code39, barcode, ean13;
    `);
    console.log(`✅ Vouchers updated: ${vUpdate.rows.length} rows`);
    vUpdate.rows.forEach((r, i) => {
        console.log(`   [${i+1}] Order #${r.order_id} | Size: ${r.size} | SKU: ${r.sku} | Code39: ${r.code39}`);
    });

    // 2. Clean sales table
    console.log("\n2. Updating 'sales' table...");
    const sUpdate = await pgPool.query(`
        UPDATE sales
        SET sku = 'PVOG16954',
            code39 = 'PVOG16954'
        WHERE order_id = 16954 
           OR sku ILIKE '%TEK TEK BEDEN%' 
           OR code39 ILIKE '%TEK TEK BEDEN%'
        RETURNING id, order_id, product_name, size, sku, code39;
    `);
    console.log(`✅ Sales updated: ${sUpdate.rows.length} rows`);

    // 3. Clean rfid_tags table
    console.log("\n3. Updating 'rfid_tags' table...");
    const rUpdate = await pgPool.query(`
        UPDATE rfid_tags
        SET sku = 'PVOG16954'
        WHERE order_id = '16954' 
           OR sku ILIKE '%TEK TEK BEDEN%'
        RETURNING id, epc, sku, order_id;
    `);
    console.log(`✅ RFID tags updated: ${rUpdate.rows.length} rows`);

    // 4. Clean orders table
    console.log("\n4. Updating 'orders' table...");
    // 4a. Order 16954 -> PVOG16954
    const o16954 = await pgPool.query(`
        UPDATE orders
        SET sku = 'PVOG16954',
            code39 = 'PVOG16954'
        WHERE order_number = 16954
        RETURNING id, order_number, product_name, sku, code39;
    `);
    console.log(`✅ Order 16954 updated in 'orders': SKU=${o16954.rows[0]?.sku}, Code39=${o16954.rows[0]?.code39}`);

    // 4b. Acıbadem Orders (16782..16902) -> PVOG{order_number}
    const acibademOrders = [16782, 16783, 16784, 16786, 16850, 16851, 16852, 16853, 16902];
    const oAcibadem = await pgPool.query(`
        UPDATE orders
        SET sku = 'PVOG' || order_number,
            code39 = 'PVOG' || order_number
        WHERE order_number = ANY($1)
        RETURNING order_number, sku, code39;
    `, [acibademOrders]);
    console.log(`✅ Acıbadem orders updated in 'orders': ${oAcibadem.rows.length} rows`);
    oAcibadem.rows.forEach(r => console.log(`   Order #${r.order_number} -> SKU: ${r.sku}, Code39: ${r.code39}`));

    // 4c. Orders 16896 and 16901
    await pgPool.query("UPDATE orders SET sku = 'PAUDI9989', code39 = 'PAUDI9989' WHERE order_number = 16896");
    await pgPool.query("UPDATE orders SET sku = 'PVOG16901', code39 = 'PVOG16901' WHERE order_number = 16901");
    console.log(`✅ Orders 16896 (PAUDI9989) and 16901 (PVOG16901) updated in 'orders'.`);

    // 5. Clean master_products table in PostgreSQL
    console.log("\n5. Updating 'master_products' table in PostgreSQL...");
    // 5a. Order 16954
    const ex16954 = await pgPool.query("SELECT id FROM master_products WHERE UPPER(sku) = 'PVOG16954'");
    if (ex16954.rows.length > 0) {
        await pgPool.query("DELETE FROM master_products WHERE sku = 'TEK TEK BEDEN' OR id = '751f7a8b-67f9-4027-a13c-6abccdfc8770'");
        console.log("   Deleted duplicate 'TEK TEK BEDEN' (PVOG16954 already exists).");
    } else {
        await pgPool.query(`
            UPDATE master_products
            SET sku = 'PVOG16954',
                code39 = 'PVOG16954'
            WHERE sku = 'TEK TEK BEDEN' OR id = '751f7a8b-67f9-4027-a13c-6abccdfc8770';
        `);
        console.log("   Updated 'TEK TEK BEDEN' to PVOG16954 in master_products.");
    }

    // 5b. Order 16783
    const ex16783 = await pgPool.query("SELECT id FROM master_products WHERE UPPER(sku) = 'PVOG16783'");
    if (ex16783.rows.length > 0) {
        await pgPool.query("DELETE FROM master_products WHERE sku = 'TEK TEK BEDEN BEDEN ALDI' OR id = 'ffd3acd3-f08d-4d4f-9ead-fd82e95d8f72'");
        console.log("   Deleted duplicate 'TEK TEK BEDEN BEDEN ALDI' (PVOG16783 already exists).");
    } else {
        await pgPool.query(`
            UPDATE master_products
            SET sku = 'PVOG16783',
                code39 = 'PVOG16783'
            WHERE sku = 'TEK TEK BEDEN BEDEN ALDI' OR id = 'ffd3acd3-f08d-4d4f-9ead-fd82e95d8f72';
        `);
        console.log("   Updated 'TEK TEK BEDEN BEDEN ALDI' to PVOG16783 in master_products.");
    }

    // 5c. Clean up any remaining TEK TEK prefixed SKUs in master_products
    const dirtyMp = await pgPool.query(`
        SELECT id, sku, code39 
        FROM master_products 
        WHERE sku ILIKE 'TEK TEK %' OR code39 ILIKE 'TEK TEK %'
    `);
    console.log(`   Found ${dirtyMp.rows.length} master_products rows with 'TEK TEK %' prefix.`);
    for (const d of dirtyMp.rows) {
        const matchP = d.sku.match(/\b(P[A-Z0-9]+)\b/i);
        if (matchP) {
            const cleanP = matchP[1].trim().toUpperCase();
            // Check if clean exists
            const exists = await pgPool.query("SELECT id FROM master_products WHERE UPPER(TRIM(sku)) = $1 AND id != $2 LIMIT 1", [cleanP, d.id]);
            if (exists.rows.length > 0) {
                // Remove duplicate dirty entry
                await pgPool.query("DELETE FROM master_products WHERE id = $1", [d.id]);
            } else {
                // Update to clean SKU
                await pgPool.query("UPDATE master_products SET sku = $1, code39 = $1 WHERE id = $2", [cleanP, d.id]);
            }
        } else {
            // Delete garbage
            await pgPool.query("DELETE FROM master_products WHERE id = $1", [d.id]);
        }
    }
    console.log(`✅ Cleaned dirty master_products prefix entries.`);

    // 6. Update MSSQL [SIPARIS].[dbo].[Siparisler]
    console.log("\n6. Updating MSSQL [SIPARIS].[dbo].[Siparisler]...");
    const mssqlSipRes = runSqlcmd(`
        USE [SIPARIS];
        UPDATE [Siparisler]
        SET ParcaNo = 'PVOG16954'
        WHERE Id = 16954;
        SELECT Id, Model, ParcaNo, Detay5 FROM [Siparisler] WHERE Id = 16954;
    `);
    console.log(mssqlSipRes);

    // 7. Update MSSQL [SIPARIS].[dbo].[MasterUrunler]
    console.log("\n7. Updating MSSQL [SIPARIS].[dbo].[MasterUrunler]...");
    const mssqlMuRes = runSqlcmd(`
        USE [SIPARIS];
        -- Update the polluted Acibadem row
        UPDATE [MasterUrunler]
        SET ParcaNo = 'PVOG16783', Code39 = 'PVOG16783'
        WHERE Id = 24071 OR ParcaNo = 'TEK TEK BEDEN BEDEN ALDI';

        -- Check if PVOG16954 exists, if not insert it
        IF NOT EXISTS (SELECT 1 FROM [MasterUrunler] WHERE ParcaNo = 'PVOG16954')
        BEGIN
            INSERT INTO [MasterUrunler] (ParcaNo, Barkod, Code39, UrunAdi, Marka)
            VALUES ('PVOG16954', 'AUTO-d33bab', 'PVOG16954', 'KISA KOL GÖMLEK YAKA / FÜME MELANJ GARANTİ KONAKLARI', 'GENEL');
        END;

        SELECT Id, ParcaNo, Barkod, Code39, UrunAdi, Marka 
        FROM [MasterUrunler] 
        WHERE ParcaNo IN ('PVOG16954', 'PVOG16783') OR ParcaNo LIKE '%TEK TEK%';
    `);
    console.log(mssqlMuRes);

    // 8. Verification Audit
    console.log("\n==================================================================");
    console.log(" 🔍 VERIFICATION AUDIT ACROSS ALL TABLES");
    console.log("==================================================================");
    const vCheck = await pgPool.query("SELECT count(*) FROM vouchers WHERE sku ILIKE '%TEK TEK%' OR code39 ILIKE '%TEK TEK%'");
    const sCheck = await pgPool.query("SELECT count(*) FROM sales WHERE sku ILIKE '%TEK TEK%' OR code39 ILIKE '%TEK TEK%'");
    const oCheck = await pgPool.query("SELECT count(*) FROM orders WHERE sku ILIKE '%TEK TEK%' OR code39 ILIKE '%TEK TEK%'");
    const rCheck = await pgPool.query("SELECT count(*) FROM rfid_tags WHERE sku ILIKE '%TEK TEK%'");
    const mpCheck = await pgPool.query("SELECT count(*) FROM master_products WHERE sku ILIKE '%TEK TEK%' OR code39 ILIKE '%TEK TEK%'");

    console.log(`vouchers with TEK TEK:        ${vCheck.rows[0].count} (Must be 0)`);
    console.log(`sales with TEK TEK:           ${sCheck.rows[0].count} (Must be 0)`);
    console.log(`orders with TEK TEK:          ${oCheck.rows[0].count} (Must be 0)`);
    console.log(`rfid_tags with TEK TEK:       ${rCheck.rows[0].count} (Must be 0)`);
    console.log(`master_products with TEK TEK: ${mpCheck.rows[0].count} (Must be 0)`);

    console.log("\nAll 9 Vouchers for Order 16954 now:");
    const vFinal = await pgPool.query("SELECT id, order_id, brand, product_name, size, sku, code39, barcode, ean13 FROM vouchers WHERE order_id = 16954 ORDER BY size, id");
    console.table(vFinal.rows);

    await pgPool.end();
}

runCleanup().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
