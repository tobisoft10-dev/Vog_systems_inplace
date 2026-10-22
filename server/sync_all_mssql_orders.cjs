const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pgPool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

function queryMssql(queryText) {
    try {
        const tmpFile = path.join(__dirname, `tmp_out_${Date.now()}.json`);
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
        console.error('sqlcmd error:', err.message);
    }
    return [];
}

async function run() {
    console.log("🚀 BSİP MSSQL -> PostgreSQL Sipariş Senkronizasyonu Başlatılıyor...");

    const orders = queryMssql(`
        SELECT 
            s.Id AS order_number,
            s.Model AS model,
            s.[Not] AS notes,
            s.Detay1, s.Detay2, s.Detay3, s.Detay4, s.Detay5,
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
        ORDER BY s.Id DESC
    `);

    console.log(`📦 MSSQL'den ${orders.length} adet sipariş çekildi.`);

    for (const o of orders) {
        // Determine brand
        let brand = 'GENEL';
        const fullText = `${o.model || ''} ${o.musteri_adi || ''} ${o.notes || ''} ${o.Detay1 || ''}`.toUpperCase();
        if (fullText.includes('VOLKSWAGEN') || fullText.includes('VW')) brand = 'VOLKSWAGEN';
        else if (fullText.includes('AUDI')) brand = 'AUDI';
        else if (fullText.includes('SKODA')) brand = 'SKODA';
        else if (fullText.includes('SEAT')) brand = 'SEAT';
        else if (fullText.includes('CUPRA')) brand = 'CUPRA';
        else if (fullText.includes('NISSAN')) brand = 'NISSAN';
        else if (fullText.includes('PORSCHE')) brand = 'PORSCHE';
        else if (fullText.includes('FORD')) brand = 'FORD';
        else if (fullText.includes('ACIBADEM')) brand = 'ACIBADEM';

        const qty = o.ToplamAdet || 1;
        const sku = o.Detay5 || o.notes || `${brand}-${o.order_number}`;

        try {
            await pgPool.query(`
                INSERT INTO orders (
                    order_number, brand, product_name, sku, code39,
                    sub_customer_name, staff_name, quantity, remaining_quantity,
                    status, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
                ON CONFLICT (order_number) DO UPDATE SET
                    brand = EXCLUDED.brand,
                    product_name = EXCLUDED.product_name,
                    sku = EXCLUDED.sku,
                    code39 = EXCLUDED.code39,
                    sub_customer_name = EXCLUDED.sub_customer_name,
                    staff_name = EXCLUDED.staff_name,
                    quantity = EXCLUDED.quantity,
                    remaining_quantity = EXCLUDED.remaining_quantity
            `, [
                o.order_number.toString(),
                brand,
                o.model || 'Tekstil Ürünü',
                sku,
                sku,
                o.musteri_adi || 'VOG Tekstil',
                o.personel_adi || '',
                qty,
                qty,
                'BEKLEMEDE'
            ]);
        } catch (err) {
            console.error(`Sipariş #${o.order_number} eklenirken hata:`, err.message);
        }
    }

    console.log("✅ Tüm BSİP siparişleri PostgreSQL 'orders' tablosuna aktarıldı!");
    
    // Check order 16865
    const check16865 = await pgPool.query("SELECT * FROM orders WHERE order_number = '16865'");
    console.log("📌 Sipariş #16865 Durumu:", check16865.rows[0]);

    await pgPool.end();
}

run();
