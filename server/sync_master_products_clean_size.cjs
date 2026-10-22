require('dotenv').config({ path: __dirname + '/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

// Standard sizes list
const VALID_LETTER_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL', '8XL', '9XL', 'STANDART', 'STD'];
const VALID_NUMERIC_SIZES = ['34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56', '58', '60', '62'];

function parsePureSize(rawSize, rawProductName, rawSku) {
    if (rawSize && typeof rawSize === 'string') {
        let s = rawSize.replace(/^BEDEN\s*/i, '').replace(/[\(\)]/g, '').trim().toUpperCase();
        if (s === 'XXXL') s = '3XL';
        if (s === 'XXXXL') s = '4XL';
        if (s === 'XXXXXL') s = '5XL';
        if (VALID_LETTER_SIZES.includes(s) || VALID_NUMERIC_SIZES.includes(s)) {
            return s;
        }
        if (!s.includes('XXS-9XL') && !s.includes('36-62') && s.length > 0 && s.length <= 10) {
            return s;
        }
    }

    // Try extracting from product_name e.g. "/4XL/", "(M Beden)", "-XL", " 48 Beden"
    const pName = rawProductName || '';
    const nameMatch = pName.match(/(?:[\/\-\(]|\bBEDEN\s*)([2-9]XL|[X]{1,4}[SL]|XXL|XL|XS|XXS|[SML]|[3-6][0-9])(?:\s*BEDEN|[\/\-\)])/i);
    if (nameMatch) {
        let s = nameMatch[1].toUpperCase();
        if (s === 'XXXL') s = '3XL';
        if (VALID_LETTER_SIZES.includes(s) || VALID_NUMERIC_SIZES.includes(s)) {
            return s;
        }
    }

    // Try extracting from SKU e.g. "PVWK100037XL" -> "XL", "PAUDI25001142" -> "42"
    const sku = (rawSku || '').trim().toUpperCase();
    for (const lsz of ['9XL', '8XL', '7XL', '6XL', '5XL', '4XL', '3XL', '2XL', 'XXL', 'XXS', 'XL', 'XS', 'L', 'M', 'S']) {
        if (sku.endsWith(lsz)) {
            return lsz;
        }
    }
    for (const nsz of ['62', '60', '58', '56', '54', '52', '50', '48', '46', '44', '42', '40', '38', '36', '34']) {
        if (sku.endsWith(nsz) && sku.length >= 8) {
            return nsz;
        }
    }

    return null;
}

function normalizeGender(genderStr) {
    if (!genderStr) return null;
    const g = String(genderStr).trim().toUpperCase();
    if (g === 'BAY' || g === 'ERKEK' || g === 'MALE' || g === 'MEN') return 'ERKEK';
    if (g === 'BAYAN' || g === 'KADIN' || g === 'FEMALE' || g === 'WOMEN') return 'KADIN';
    if (g === 'UNISEX') return 'UNISEX';
    return g;
}

async function main() {
    console.log('🚀 master_products clean_size ve gender senkronizasyonu başlatılıyor...');
    
    // 1. Add clean_size column
    await pool.query('ALTER TABLE master_products ADD COLUMN IF NOT EXISTS clean_size VARCHAR(50)');
    console.log('✅ master_products.clean_size sütunu kontrol edildi.');

    // 2. Fetch all products
    const res = await pool.query('SELECT id, sku, product_name, size, gender FROM master_products');
    console.log(`📦 Toplam ${res.rows.length} master ürün kaydı inceleniyor...`);

    let updatedCount = 0;
    let genderUpdatedCount = 0;

    for (const row of res.rows) {
        const cleanSize = parsePureSize(row.size, row.product_name, row.sku);
        const normGender = normalizeGender(row.gender);

        await pool.query(
            'UPDATE master_products SET clean_size = $1, gender = COALESCE($2, gender) WHERE id = $3',
            [cleanSize, normGender, row.id]
        );
        if (cleanSize) updatedCount++;
        if (normGender) genderUpdatedCount++;
    }

    console.log(`🎉 Başarıyla tamamlandı!`);
    console.log(`- Toplam Beden Çözümlenen Ürün: ${updatedCount}`);
    console.log(`- Normalize Edilen Cinsiyet Kaydı: ${genderUpdatedCount}`);

    // Show sample updated rows
    const sampleRes = await pool.query('SELECT sku, product_name, size, clean_size, gender FROM master_products WHERE clean_size IS NOT NULL LIMIT 15');
    console.log('\n🔍 Örnek Güncellenmiş Kayıtlar:');
    console.table(sampleRes.rows);

    await pool.end();
}

main().catch(err => {
    console.error('❌ Hata:', err);
    process.exit(1);
});
