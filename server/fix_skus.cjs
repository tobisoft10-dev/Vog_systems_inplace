const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

function cleanParcaNo(rawCandidate) {
    if (!rawCandidate || typeof rawCandidate !== 'string') return '';
    let c = rawCandidate.trim();

    c = c.replace(/^(?:PARÇA\s*NO|PARCA\s*NO|KODU?|MODEL|ÜRÜN|URUN)\s*[:=\-]\s*/gi, '');

    const pMatch = c.match(/\b(P[A-Z]{2,10}\d{3,10})\b/i);
    if (pMatch && pMatch[1]) return pMatch[1].toUpperCase().trim();
    
    const pMatch2 = c.match(/(P[A-Z]{2,10}\d{3,10})/i);
    if (pMatch2 && pMatch2[1]) return pMatch2[1].toUpperCase().trim();

    const pMale = c.match(/(?:ERKEK|BAY)\s*[:=\-]\s*(P[A-Z0-9]+)/i);
    if (pMale && pMale[1]) return pMale[1].toUpperCase().trim();

    return '';
}

async function fixSkus() {
    try {
        const { rows } = await pool.query(`SELECT order_number, brand, sku FROM orders`);
        let updatedCount = 0;
        
        for (const row of rows) {
            let currentSku = row.sku || '';
            let newSku = currentSku;
            
            // Try to extract a valid P-code using the new logic
            let pCode = cleanParcaNo(currentSku);
            
            if (pCode) {
                newSku = pCode;
            } else {
                // If it's a completely invalid string (e.g. "OLACAK KOLI YAPILACAK") with no P-Code, 
                // and it contains spaces, fallback to BRAND-ORDER_NUMBER
                if (currentSku.includes(' ') || currentSku.length > 25) {
                    newSku = `${row.brand}-${row.order_number}`;
                }
            }
            
            if (newSku !== currentSku) {
                await pool.query(`UPDATE orders SET sku = $1, code39 = $1 WHERE order_number = $2`, [newSku, row.order_number]);
                updatedCount++;
            }
        }
        console.log(`Fixed ${updatedCount} dirty SKUs in orders table.`);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
fixSkus();
