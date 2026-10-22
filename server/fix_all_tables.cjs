const { Pool } = require('pg');
const pool = new Pool({ database: 'vog_db', user: 'postgres', password: '!719356Qse!' });

function removeGenderFromProductName(pName) {
    if (!pName || typeof pName !== 'string') return '';
    let cleaned = pName.trim();

    cleaned = cleaned.replace(/[\s\-_/]*(?:BAY\s*[\/&\-]\s*BAYAN|BAY\s+BAYAN|BAYAN\s*[\/&\-]\s*BAY|ERKEK\s*[\/&\-]\s*KADIN|ERKEK\s+VE\s+BAYAN|ERKEK\s+VE\s+KADIN|ERKEK\s+KADIN|KADIN\s*[\/&\-]\s*ERKEK|ERKEK\s*[\/&\-]\s*BAYAN|ERKEK\s+BAYAN|BAY\s*[\/&\-]\s*BAY)[\s\-_/]*/gi, ' ');
    cleaned = cleaned.replace(/\s*\(\s*(?:BAY\s*[\/&\-]\s*BAYAN|BAYAN|BAY|ERKEK\s*MODEL[İIıi]?|BAY\s*MODEL[İIıi]?|BAYAN\s*MODEL[İIıi]?|ERKEK|KADIN|UNISEX)\s*\)\s*/gi, ' ');
    cleaned = cleaned.replace(/\b(?:ERKEK|BAYAN|BAY|KADIN)\s*MODEL[İIıiA-Za-z]*\b/gi, ' ');
    cleaned = cleaned.replace(/\b(?:ERKEKLER|KADINLAR|BAYANLAR|BAYANDA|ERKEKTE|KADINDA)\b/gi, ' ');
    cleaned = cleaned.replace(/\b(?:BAYAN|BAY(?![iİıIeErR])|ERKEK|KADIN)\b/gi, ' ');
    cleaned = cleaned.replace(/(?<=[A-ZÇĞİÖŞÜ])(?:BAYAN|BAY(?![iİıIeErR])|ERKEK|KADIN)\b/gi, '');
    cleaned = cleaned.replace(/\b(?:BAYAN|BAY(?![iİıIeErR])|ERKEK|KADIN)(?=[A-ZÇĞİÖŞÜ])/gi, '');

    cleaned = cleaned
        .replace(/\s+/g, ' ')
        .replace(/[\s\-_/\*]+$/g, '')
        .replace(/^[\s\-_/\*]+/g, '')
        .trim();

    return cleaned || pName.trim();
}

async function fixAll() {
    console.log('Fixing orders...');
    const ords = await pool.query('SELECT id, product_name, sku, code39 FROM orders');
    for (const o of ords.rows) {
        const cleanName = removeGenderFromProductName(o.product_name || '');
        const cleanSku = (o.sku || '').trim();
        const cleanCode39 = cleanSku;
        if (cleanName !== o.product_name || cleanSku !== o.sku || cleanCode39 !== o.code39) {
            await pool.query('UPDATE orders SET product_name = $1, sku = $2, code39 = $3 WHERE id = $4', [cleanName, cleanSku, cleanCode39, o.id]);
        }
    }

    console.log('Fixing master_products...');
    const mps = await pool.query('SELECT id, product_name, sku, code39 FROM master_products');
    for (const m of mps.rows) {
        const cleanName = removeGenderFromProductName(m.product_name || '');
        const cleanSku = (m.sku || '').trim();
        const cleanCode39 = cleanSku;
        if (cleanName !== m.product_name || cleanSku !== m.sku || cleanCode39 !== m.code39) {
            await pool.query('UPDATE master_products SET product_name = $1, sku = $2, code39 = $3 WHERE id = $4', [cleanName, cleanSku, cleanCode39, m.id]);
        }
    }

    console.log('Fixing vouchers...');
    const vchs = await pool.query('SELECT id, product_name, sku, code39 FROM vouchers');
    for (const v of vchs.rows) {
        const cleanName = removeGenderFromProductName(v.product_name || '');
        const cleanSku = (v.sku || '').trim();
        const cleanCode39 = cleanSku;
        if (cleanName !== v.product_name || cleanSku !== v.sku || cleanCode39 !== v.code39) {
            await pool.query('UPDATE vouchers SET product_name = $1, sku = $2, code39 = $3 WHERE id = $4', [cleanName, cleanSku, cleanCode39, v.id]);
        }
    }

    console.log('Fixing sales...');
    const sls = await pool.query('SELECT id, product_name, sku, code39 FROM sales');
    for (const s of sls.rows) {
        const cleanName = removeGenderFromProductName(s.product_name || '');
        const cleanSku = (s.sku || '').trim();
        const cleanCode39 = cleanSku;
        if (cleanName !== s.product_name || cleanSku !== s.sku || cleanCode39 !== s.code39) {
            await pool.query('UPDATE sales SET product_name = $1, sku = $2, code39 = $3 WHERE id = $4', [cleanName, cleanSku, cleanCode39, s.id]);
        }
    }

    console.log('✅ ALL TABLES UPDATED.');

    const check3260 = await pool.query('SELECT order_number, product_name, sku, code39 FROM orders WHERE order_number = 3260');
    console.log('Order 3260:', check3260.rows[0]);

    const check16673 = await pool.query('SELECT order_number, product_name, color, sku, code39, barcode, ean13 FROM orders WHERE order_number = 16673');
    console.log('Order 16673 Orders:', check16673.rows[0]);

    const check16673V = await pool.query('SELECT order_id, product_name, color, sku, code39, barcode, ean13 FROM vouchers WHERE order_id = 16673');
    console.log('Order 16673 Vouchers:', check16673V.rows[0]);

    await pool.end();
}

fixAll().catch(console.error);
