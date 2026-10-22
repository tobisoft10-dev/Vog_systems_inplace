const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

function normalizeSize(sz) {
    if (!sz) return '';
    const s = String(sz).toUpperCase().trim();
    if (s === '2XL') return 'XXL';
    if (s === '3XL') return 'XXXL';
    if (s === '4XL') return 'XXXXL';
    return s;
}

function extractSizeFromBarcode(barcode, prefix) {
    if (!barcode) return null;
    const b = barcode.toUpperCase().trim();
    const p = (prefix || '').toUpperCase().trim();
    if (p && b.startsWith(p)) {
        const remaining = b.substring(p.length).replace(/[-_#/]CH\d+$/i, '').trim();
        if (remaining) return normalizeSize(remaining);
    }
    const match = b.match(/(?:[-_#/]?)((?:[2-9]?X[SL]|XXXL|XXL|XL|XS|[SML])|\b\d{2}(?:\.5)?)$/i);
    return match ? normalizeSize(match[1]) : null;
}

async function simulateRouting() {
    console.log('--- TESTING SIZE EXTRACTION ---');
    console.log('PVWB260012XXL ->', extractSizeFromBarcode('PVWB260012XXL', 'PVWB260012'));
    console.log('PVWB260012M ->', extractSizeFromBarcode('PVWB260012M', 'PVWB260012'));
    console.log('PVWB260013L ->', extractSizeFromBarcode('PVWB260013L', 'PVWB260013'));
    console.log('PVWB260013M ->', extractSizeFromBarcode('PVWB260013M', 'PVWB260013'));
    console.log('PVWB260013 ->', extractSizeFromBarcode('PVWB260013', 'PVWB260013'));
    console.log('PVWK100107XXL ->', extractSizeFromBarcode('PVWK100107XXL', 'PVWK100107'));
    console.log('PVWB26001746 ->', extractSizeFromBarcode('PVWB26001746', 'PVWB260017'));
    console.log('PVWB26001941-CH34 ->', extractSizeFromBarcode('PVWB26001941-CH34', 'PVWB260019'));

    await pool.end();
}

simulateRouting().catch(console.error);
