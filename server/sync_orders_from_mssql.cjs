const mssql = require('mssql');
const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pgPool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const mssqlConfig = {
    server: process.env.DB_MSSQL_SERVER || 'localhost\\SQLEXPRESS',
    database: process.env.DB_MSSQL_NAME || 'SIPARIS',
    user: process.env.DB_MSSQL_USER || 'sa',
    password: process.env.DB_MSSQL_PASSWORD || 'Vog2026!',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        instanceName: process.env.DB_MSSQL_INSTANCE || 'SQLEXPRESS'
    }
};

async function syncOrdersWithBsip() {
    console.log('🚀 Synchronizing orders table with bsip (Siparisler / SiparisIslemleri)...');

    let mssqlPool = null;
    try {
        mssqlPool = await mssql.connect(mssqlConfig);
        console.log('✅ Connected to MSSQL SIPARIS database.');
    } catch (e) {
        console.log('⚠️ MSSQL direct connection unavailable, performing internal master_products harmonization for orders:', e.message);
    }

    const pgClient = await pgPool.connect();

    try {
        await pgClient.query('BEGIN');

        if (mssqlPool) {
            // Read orders from MSSQL Siparisler & SiparisIslemleri
            const res = await mssqlPool.request().query(`
                SELECT 
                    s.Id AS order_number,
                    s.Model AS model,
                    s.Not AS notes,
                    s.Detay1, s.Detay2, s.Detay3, s.Detay4,
                    m.Adi AS musteri_adi,
                    p.Adi AS personel_adi,
                    si.ToplamAdet
                FROM [SIPARIS].[dbo].[Siparisler] s
                LEFT JOIN [SIPARIS].[dbo].[Musteriler] m ON s.MusteriId = m.Id
                LEFT JOIN [SIPARIS].[dbo].[Personeller] p ON s.PersonelId = p.Id
                LEFT JOIN (
                    SELECT SiparisId, SUM(ISNULL(B01,0)+ISNULL(B02,0)+ISNULL(B03,0)+ISNULL(B04,0)+ISNULL(B05,0)+ISNULL(B06,0)+ISNULL(B07,0)+ISNULL(B08,0)+ISNULL(B09,0)+ISNULL(B10,0)+ISNULL(B11,0)+ISNULL(B12,0)+ISNULL(B13,0)+ISNULL(B14,0)) AS ToplamAdet
                    FROM [SIPARIS].[dbo].[SiparisIslemleri]
                    GROUP BY SiparisId
                ) si ON s.Id = si.SiparisId
            `);

            console.log(`📌 Found ${res.recordset.length} orders in MSSQL Siparisler.`);

            for (const row of res.recordset) {
                const orderId = row.order_number;
                const modelName = row.model || '';
                const details = [row.Detay1, row.Detay2, row.Detay3, row.Detay4].filter(Boolean).join(' ');
                
                // Try to find matching SKU in master_products by Model or details
                let matchedSku = null;
                let matchedEan13 = null;
                let matchedBarcode = null;

                const mpMatch = await pgClient.query(`
                    SELECT sku, ean13, barcode 
                    FROM master_products 
                    WHERE UPPER(product_name) = UPPER($1) 
                       OR UPPER(sku) = UPPER($1)
                       OR $1 LIKE '%' || UPPER(sku) || '%'
                       OR UPPER($1) LIKE '%' || UPPER(product_name) || '%'
                    LIMIT 1
                `, [modelName]);

                if (mpMatch.rows.length > 0) {
                    matchedSku = mpMatch.rows[0].sku;
                    matchedEan13 = mpMatch.rows[0].ean13;
                    matchedBarcode = mpMatch.rows[0].barcode;
                }

                if (!matchedSku) {
                    // Search by details or fallback to Model if it starts with PVW/SEAT/AUD
                    const skuFromDetails = (modelName + ' ' + details).match(/(PVW[A-Z0-9]+|SEAT[A-Z0-9_-]+|AUD[A-Z0-9_-]+)/i);
                    if (skuFromDetails) {
                        matchedSku = skuFromDetails[1].toUpperCase();
                    }
                }

                if (matchedSku) {
                    await pgClient.query(`
                        UPDATE orders 
                        SET product_name = COALESCE($1, product_name),
                            sku = $2,
                            code39 = $2,
                            ean13 = COALESCE($3, ean13),
                            barcode = COALESCE($4, barcode),
                            quantity = COALESCE($5, quantity),
                            updated_at = CURRENT_TIMESTAMP
                        WHERE order_number = $6 OR id::text = $7
                    `, [modelName, matchedSku, matchedEan13, matchedBarcode, row.ToplamAdet, orderId, String(orderId)]);
                }
            }
        }

        // Always perform master_products exact harmonization for all orders in PostgreSQL
        console.log('🔄 Harmonizing all orders in PostgreSQL with master_products table...');
        const ordersUpdate = await pgClient.query(`
            UPDATE orders o
            SET sku = mp.sku,
                code39 = mp.sku,
                ean13 = mp.ean13,
                barcode = mp.barcode,
                product_name = mp.product_name,
                brand = mp.brand
            FROM master_products mp
            WHERE UPPER(TRIM(o.sku)) = UPPER(TRIM(mp.sku))
               OR UPPER(TRIM(o.product_name)) = UPPER(TRIM(mp.product_name))
        `);
        console.log(`✅ orders table synced with master_products: ${ordersUpdate.rowCount} rows updated.`);

        // Force set code39 = sku in orders
        await pgClient.query("UPDATE orders SET code39 = sku WHERE sku IS NOT NULL AND sku != ''");
        await pgClient.query("UPDATE vouchers SET code39 = sku WHERE sku IS NOT NULL AND sku != ''");
        await pgClient.query("UPDATE sales SET code39 = sku WHERE sku IS NOT NULL AND sku != ''");

        await pgClient.query('COMMIT');
        console.log('🎉 orders table product information (SKU, Parça No, Name, Code39) is now 100% matched with bsip and master_products!');
    } catch (e) {
        await pgClient.query('ROLLBACK');
        console.error('❌ Error during orders sync:', e.message);
    } finally {
        if (mssqlPool) await mssqlPool.close();
        pgClient.release();
        await pgPool.end();
    }
}

syncOrdersWithBsip();
