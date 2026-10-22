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
        const tmpFile = path.join(__dirname, `tmp_bsip_${Date.now()}.json`);
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
    console.log("==================================================================");
    console.log(" 🚀 BSİP SİPARİŞ ENTEGRASYONU & İRSALİYESİZ SİPARİŞ AKTARIMI");
    console.log("==================================================================");

    // 1. Column analysis of Siparisler
    const cols = queryMssql("SELECT COLUMN_NAME, DATA_TYPE FROM [SIPARIS].INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Siparisler'");
    console.log("📌 Siparisler Tablosundaki Kolonlar:", cols.map(c => c.COLUMN_NAME).join(', '));

    // 2. Check Order #16865 specifically
    const order16865 = queryMssql(`
        SELECT s.*, m.Adi AS MusteriAdi, p.Adi AS PersonelAdi 
        FROM [SIPARIS].[dbo].[Siparisler] s
        LEFT JOIN [SIPARIS].[dbo].[Musteriler] m ON s.MusteriId = m.Id
        LEFT JOIN [SIPARIS].[dbo].[Personeller] p ON s.PersonelId = p.Id
        WHERE s.Id = 16865
    `);
    console.log("\n📌 Sipariş #16865 Tam Verisi (BSİP):", JSON.stringify(order16865, null, 2));

    // 3. Check if there are other related tables (e.g. Irsaliyeler, Sevk, Fatura)
    const tables = queryMssql("SELECT TABLE_NAME FROM [SIPARIS].INFORMATION_SCHEMA.TABLES");
    console.log("\n📌 BSİP Veritabanındaki Tablolar:", tables.map(t => t.TABLE_NAME).join(', '));

    // 4. Query all active, pending, unbilled / non-waybill orders
    const allOrders = queryMssql(`
        SELECT 
            s.Id AS order_number,
            s.Model AS model,
            s.ParcaNo AS parca_no,
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
    console.log(`\n📦 BSİP'ten toplam ${allOrders.length} sipariş okundu.`);

    // 5. Ensure Unique Constraint on orders.order_number in PostgreSQL
    try {
        await pgPool.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number_unique ON orders (order_number);
        `);
    } catch(e) {
        console.log("Index note:", e.message);
    }

    let inserted = 0;
    let updated = 0;

    function isPackagingOrInvalid(txt) {
        if (!txt) return true;
        const s = String(txt).trim().toUpperCase();
        if (s.length < 3) return true;
        if (s === 'VOG' || s === 'PVOG' || s.startsWith('SKU-VOG-') || s.startsWith('ORD-')) return true;
        if (/^(?:TEK\s*TEK|PAKET|BEDEN|PO[SŞ]ET|KOL[Iİ]|D[Iİ]K[Iİ]L|L[UÜ]TFEN|ENG[Iİ]N|DO[GĞ]U[SŞ]|SAKIN|STANDART|ADET)/i.test(s)) return true;
        if (/TEK\s*TEK\s*BEDEN/i.test(s)) return true;
        return false;
    }

    for (const o of allOrders) {
        const orderNumStr = o.order_number.toString();

        // Detect Brand
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

        const qty = (o.ToplamAdet && o.ToplamAdet > 0) ? o.ToplamAdet : 1;

        let sku = o.parca_no;
        if (isPackagingOrInvalid(sku)) {
            // Check if Detay5 contains a P-code
            const matchP = (o.Detay5 || '').match(/\b(P[A-Z]{2,6}\d{3,10}[A-Z0-9]*)\b/i);
            if (matchP && !isPackagingOrInvalid(matchP[1])) {
                sku = matchP[1].trim().toUpperCase();
            } else if (!isPackagingOrInvalid(o.notes)) {
                sku = o.notes.trim();
            } else {
                sku = (brand === 'GENEL' || brand === 'VOG') ? `PVOG${orderNumStr}` : `${brand}-${orderNumStr}`;
            }
        }

        // Check if exists in PG
        const existing = await pgPool.query("SELECT id FROM orders WHERE order_number = $1 LIMIT 1", [orderNumStr]);
        if (existing.rows.length > 0) {
            await pgPool.query(`
                UPDATE orders SET
                    brand = $1,
                    product_name = $2,
                    sku = $3,
                    code39 = $4,
                    sub_customer_name = $5,
                    staff_name = $6,
                    quantity = $7
                WHERE order_number = $8
            `, [
                brand,
                o.model || 'Tekstil Ürünü',
                sku,
                sku,
                o.musteri_adi || 'VOG Tekstil',
                o.personel_adi || '',
                qty,
                orderNumStr
            ]);
            updated++;
        } else {
            await pgPool.query(`
                INSERT INTO orders (
                    order_number, brand, product_name, sku, code39,
                    sub_customer_name, staff_name, quantity, remaining_quantity,
                    status, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
            `, [
                orderNumStr,
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
            inserted++;
        }
    }

    console.log(`\n🎉 TAMAMLANDI: ${inserted} yeni sipariş eklendi, ${updated} sipariş güncellendi.`);

    // Check order 16865 in PG
    const check16865 = await pgPool.query("SELECT * FROM orders WHERE order_number = '16865'");
    console.log("\n📌 PostgreSQL'de Sipariş #16865:", check16865.rows[0]);

    await pgPool.end();
}

run();
