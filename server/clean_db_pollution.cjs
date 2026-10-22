const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

const SIZE_TEXT_TO_NUM = {
    'XXS': '36',
    'XS': '38',
    'S': '40',
    'M': '42',
    'L': '44',
    'XL': '46',
    'XXL': '48',
    '2XL': '48',
    '3XL': '50',
    'XXXL': '50',
    '4XL': '52',
    'XXXXL': '52',
    '5XL': '54',
    'XXXXXL': '54',
    '6XL': '56',
    '7XL': '58',
    '8XL': '60',
    '9XL': '62'
};

const SIZE_NUM_TO_TEXT = {
    '36': 'XXS',
    '38': 'XS',
    '40': 'S',
    '42': 'M',
    '44': 'L',
    '46': 'XL',
    '48': '2XL',
    '50': '3XL',
    '52': '4XL',
    '54': '5XL',
    '56': '6XL',
    '58': '7XL',
    '60': '8XL',
    '62': '9XL'
};

function cleanThermalText(str) {
    if (!str) return '';
    return str
        .toString()
        .replace(/İ/g, 'I')
        .replace(/ı/g, 'I')
        .replace(/Ş/g, 'S')
        .replace(/ş/g, 'S')
        .replace(/Ğ/g, 'G')
        .replace(/ğ/g, 'G')
        .replace(/Ü/g, 'U')
        .replace(/ü/g, 'U')
        .replace(/Ö/g, 'O')
        .replace(/ö/g, 'O')
        .replace(/Ç/g, 'C')
        .replace(/ç/g, 'C')
        .toUpperCase()
        .trim();
}

function mapGenderToTurkish(gender) {
    if (!gender) return 'ERKEK';
    const g = String(gender).trim().toUpperCase();
    if (g.includes('BAYAN') || g.includes('KADIN') || g.includes('FEMALE') || g.includes('WOMEN') || g === 'KDN') {
        return 'KADIN';
    }
    if (g.includes('BAY') || g.includes('ERKEK') || g.includes('MALE') || g.includes('MEN') || g === 'ERK') {
        return 'ERKEK';
    }
    if (g.includes('UNISEX')) {
        return 'UNISEX';
    }
    return 'ERKEK';
}

function cleanSizeCode(size) {
    if (!size) return 'STD';
    const raw = String(size).trim().toUpperCase();
    if (raw === 'BEDENSİZ' || raw === 'BEDENSIZ' || raw === 'STANDART' || raw === 'STD' || raw.includes('BEDENSİZ') || raw.includes('BEDENSIZ')) {
        return 'STD';
    }
    let sz = raw.replace(/^BEDEN\s*/i, '').replace(/[\(\)]/g, '').trim();
    if (sz === 'SİZ' || sz === 'SIZ' || !sz) {
        return 'STD';
    }
    if (sz === 'XXXL') sz = '3XL';
    if (sz === 'XXXXL') sz = '4XL';
    if (sz === 'XXXXXL') sz = '5XL';
    return sz;
}

function formatDualSize(size) {
    if (!size) return 'STD';
    const clean = cleanSizeCode(size);
    if (clean === 'STD' || clean === 'STANDART') return 'STD';
    if (SIZE_TEXT_TO_NUM[clean]) {
        const num = SIZE_TEXT_TO_NUM[clean];
        return `${clean} (${num})`;
    }
    if (SIZE_NUM_TO_TEXT[clean]) {
        const txt = SIZE_NUM_TO_TEXT[clean];
        return `${txt} (${clean})`;
    }
    return clean;
}

function cleanProductNameForTitle(name) {
    if (!name || typeof name !== 'string') return '';
    let clean = cleanThermalText(name)
        .replace(/\/\s*(?:XXS|XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL|6XL|7XL|8XL|9XL|\d{2})\s*\//gi, ' / ')
        .replace(/\s*\(\s*(?:BEDEN\s*)?(?:XXS|XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL|6XL|7XL|8XL|9XL|\d{2})\s*(?:BEDEN)?\s*\)/gi, '')
        .replace(/\b(?:BEDEN|Beden)\s*[:=\-]?\s*(?:XXS|XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL|6XL|7XL|8XL|9XL|\d{2})\b/gi, '')
        .replace(/[\/\-]\s*(?:XXS|XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL|6XL|7XL|8XL|9XL|\d{2})\s*$/gi, '')
        .replace(/[\/\-]\s*(?:BAYAN|KADIN|BAY|ERKEK|UNISEX)\s*$/gi, '')
        .replace(/\/\s*(?:BAYAN|KADIN|BAY|ERKEK|UNISEX)\s*\//gi, ' / ')
        .replace(/\b(?:BAY\s*\/\s*BAYAN|BAYAN\s*\/\s*BAY|BAY\s*-\s*BAYAN|BAYAN\s*-\s*BAY|BAYAN|BAY)\b/gi, '')
        .replace(/\/\s*\//g, '/')
        .replace(/\s*\/\s*$/, '')
        .replace(/^\s*\/\s*/, '')
        .replace(/\s*-\s*$/, '')
        .replace(/^\s*-\s*/, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
    return clean.substring(0, 45);
}

async function processTable(tableName, idCol = 'order_number') {
    console.log(`Processing table: ${tableName}`);
    const { rows } = await pool.query(`SELECT * FROM ${tableName}`);
    let updateCount = 0;

    for (const row of rows) {
        let changed = false;

        const newProductName = cleanProductNameForTitle(row.product_name || 'Tekstil Urunu');
        if (newProductName && newProductName !== row.product_name) changed = true;

        const newGender = mapGenderToTurkish(row.gender);
        if (newGender && newGender !== row.gender) changed = true;

        const newBrand = cleanThermalText(row.brand || '').substring(0, 16);
        if (newBrand && newBrand !== row.brand) changed = true;

        const newSize = formatDualSize(row.size);
        if (newSize && newSize !== row.size) changed = true;

        const newSku = cleanThermalText(row.sku || '').substring(0, 24);
        if (newSku && newSku !== row.sku) changed = true;

        const newCode39 = cleanThermalText(row.code39 || '').substring(0, 24);
        if (newCode39 && newCode39 !== row.code39) changed = true;

        const newBarcode = cleanThermalText(row.barcode || '').substring(0, 24);
        if (newBarcode && newBarcode !== row.barcode) changed = true;

        const newEan13 = cleanThermalText(row.ean13 || '').substring(0, 24);
        if (newEan13 && newEan13 !== row.ean13) changed = true;

        if (changed) {
            try {
                await pool.query(`
                    UPDATE ${tableName}
                    SET 
                        product_name = $1,
                        gender = $2,
                        brand = $3,
                        size = $4,
                        sku = $5,
                        code39 = $6,
                        barcode = $7,
                        ean13 = $8,
                        updated_at = NOW()
                    WHERE ${idCol} = $9
                `, [newProductName, newGender, newBrand, newSize, newSku, newCode39, newBarcode, newEan13, row[idCol]]);
                updateCount++;
            } catch (err) {
                console.error(`Error updating ${tableName} ID ${row[idCol]}:`, err.message);
            }
        }
    }
    console.log(`Updated ${updateCount} rows in ${tableName}`);
}

async function run() {
    try {
        await processTable('orders', 'order_number');
        await processTable('sales', 'id');
        await processTable('vouchers', 'id');
        console.log("Database cleanup completed successfully.");
    } catch (err) {
        console.error("Cleanup failed:", err);
    } finally {
        pool.end();
    }
}

run();
