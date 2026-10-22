const { Pool } = require('pg');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

async function queryMssqlViaSqlcmd(queryText) {
    try {
        const tmpFile = path.join(__dirname, `tmp_out_${Date.now()}_${Math.random().toString(36).substring(7)}.json`);
        const cleanQuery = queryText.replace(/\r?\n/g, ' ');
        const cmd = `sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -f 65001 -w 65535 -y 0 -o "${tmpFile}" -Q "SET NOCOUNT ON; ${cleanQuery} FOR JSON PATH"`;
        execSync(cmd, { stdio: 'ignore', windowsHide: true });
        if (fs.existsSync(tmpFile)) {
            const raw = fs.readFileSync(tmpFile, 'utf8');
            try { fs.unlinkSync(tmpFile); } catch (e) { }
            const jsonStr = raw.split(/\r?\n/).map(l => l.trim()).join('');
            if (jsonStr) return JSON.parse(jsonStr);
        }
    } catch (err) {
        console.error("SQLCMD ERROR:", err);
    }
    return [];
}

async function repopulateOrders() {
    try {
        console.log("Fetching orders from MSSQL...");
        const newOrders = await queryMssqlViaSqlcmd(`
            SELECT TOP 2000
                s.Id AS order_number,
                s.Model AS model,
                s.[Not] AS notes,
                s.Detay1, s.Detay2, s.Detay3, s.Detay4, s.Detay5,
                m.Adi AS musteri_adi,
                p.Adi AS personel_adi,
                ISNULL(b.Adi, 'BEDEN (XXS-9XL)') AS beden_adi,
                ISNULL(si.ToplamAdet, 0) AS ToplamAdet
            FROM [SIPARIS].[dbo].[Siparisler] s
            LEFT JOIN [SIPARIS].[dbo].[Musteriler] m ON s.MusteriId = m.Id
            LEFT JOIN [SIPARIS].[dbo].[Personeller] p ON s.PersonelId = p.Id
            LEFT JOIN [SIPARIS].[dbo].[Bedenler] b ON s.BedenId = b.Id
            LEFT JOIN (
                SELECT 
                    si.SiparisId,
                    si.IslemId,
                    SUM(
                        ISNULL(si.B01, 0) + ISNULL(si.B02, 0) + ISNULL(si.B03, 0) + ISNULL(si.B04, 0) + ISNULL(si.B05, 0) +
                        ISNULL(si.B06, 0) + ISNULL(si.B07, 0) + ISNULL(si.B08, 0) + ISNULL(si.B09, 0) + ISNULL(si.B10, 0) +
                        ISNULL(si.B11, 0) + ISNULL(si.B12, 0) + ISNULL(si.B13, 0) + ISNULL(si.B14, 0)
                    ) AS ToplamAdet,
                    ROW_NUMBER() OVER(PARTITION BY si.SiparisId ORDER BY CASE WHEN si.IslemId = s2.IslemId THEN 0 ELSE 1 END, si.IslemId DESC) as rn
                FROM [SIPARIS].[dbo].[SiparisIslemleri] si
                LEFT JOIN [SIPARIS].[dbo].[Siparisler] s2 ON si.SiparisId = s2.Id
                GROUP BY si.SiparisId, si.IslemId, s2.IslemId
            ) si ON s.Id = si.SiparisId AND si.rn = 1
            ORDER BY s.Id DESC
        `);

        if (!Array.isArray(newOrders) || newOrders.length === 0) {
            console.log("No orders fetched.");
            return;
        }

        console.log(`Fetched ${newOrders.length} orders. Reversing order for insert...`);
        newOrders.reverse();

        for (const o of newOrders) {
            const orderNum = parseInt(o.order_number);
            if (!orderNum) continue;

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
            else if (fullText.includes('REDCELL')) brand = 'REDCELL';

            const qty = (o.ToplamAdet && o.ToplamAdet > 0) ? o.ToplamAdet : 1;

            let finalSku = o.model || 'GENEL_SKU';
            let finalCode39 = finalSku;
            let finalBarcode = finalSku;
            let finalEan13 = finalSku;
            
            // Clean logic exactly like in fix_skus.cjs
            let c = finalSku;
            c = c.replace(/^(?:PARÇA\s*NO|PARCA\s*NO|KODU?|MODEL|ÜRÜN|URUN)\s*[:=\-]\s*/gi, '');
            const pMatch = c.match(/\b(P[A-Z]{2,10}\d{3,10})\b/i) || c.match(/(P[A-Z]{2,10}\d{3,10})/i);
            if (pMatch && pMatch[1]) {
                finalSku = pMatch[1].toUpperCase().trim();
                finalCode39 = finalSku;
                finalBarcode = finalSku;
                finalEan13 = finalSku;
            } else if (finalSku.includes(' ') || finalSku.length > 25) {
                finalSku = `${brand}-${orderNum}`;
                finalCode39 = finalSku;
            }

            await pool.query(`
                INSERT INTO orders (
                    order_number, sku, code39, barcode, ean13, 
                    sub_customer_name, staff_name, quantity, remaining_quantity, 
                    status, notes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (order_number) DO UPDATE SET 
                    sub_customer_name = EXCLUDED.sub_customer_name,
                    staff_name = EXCLUDED.staff_name,
                    quantity = EXCLUDED.quantity,
                    notes = EXCLUDED.notes
            `, [
                orderNum,
                finalSku,
                finalCode39,
                finalBarcode,
                finalEan13,
                o.musteri_adi || 'VOG Tekstil',
                o.personel_adi || '',
                qty,
                qty,
                'BEKLEMEDE',
                o.notes || ''
            ]);
        }
        
        console.log("Repopulation complete.");
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

repopulateOrders();
