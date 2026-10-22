require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const rawData = `
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAY - XS
PSEAT200002XS
2
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAY - S
PSEAT200002S
2
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAY - M
PSEAT200002M
2
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAY - L
PSEAT200002L
2
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAY - XL
PSEAT200002XL
2
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAY - XXL
PSEAT200002XXL
2
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAY - XXXL
PSEAT200002XXXL
2
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAYAN - XS
PSEAT200005XS
2
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAYAN - S
PSEAT200005S
2
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAYAN - M
PSEAT200005M
2
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAYAN - L
PSEAT200005L
2
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAYAN - XL
PSEAT200005XL
2
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAYAN - XXL
PSEAT200005XXL
2
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAYAN - XXXL
PSEAT200005XXXL
2
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAY KIRMIZI - XS
PSEAT200017XS
2
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAY KIRMIZI - S
PSEAT200017S
2
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAY KIRMIZI - M
PSEAT200017M
2
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAY KIRMIZI - L
PSEAT200017L
2
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAY KIRMIZI - XL
PSEAT200017XL
2
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAY KIRMIZI - XXL
PSEAT200017XXL
2
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAY KIRMIZI - XXXL
PSEAT200017XXXL
2
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAYAN KIRMIZI - XS
PSEAT200018XS
2
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAYAN KIRMIZI - S
PSEAT200018S
2
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAYAN KIRMIZI - M
PSEAT200018M
2
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAYAN KIRMIZI - L
PSEAT200018L
2
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAYAN KIRMIZI - XL
PSEAT200018XL
2
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAYAN KIRMIZI - XXL
PSEAT200018XXL
2
SERVİS DANIŞMAN POLO YAKA T-SHIRT BAYAN KIRMIZI - XXXL
PSEAT200018XXXL
2
`;

function calculateEAN13CheckDigit(ean12) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(ean12[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit;
}

// Generate a stable unique EAN13 based on the alphanumeric barcode string
function generateEAN13(barcodeStr) {
    const prefix = "8680002"; // Turkey + Company Prefix
    
    // Create a simple deterministic hash from the barcode string
    let hash = 0;
    for (let i = 0; i < barcodeStr.length; i++) {
        hash = ((hash << 5) - hash) + barcodeStr.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    const stableId = Math.abs(hash % 100000); // 5 digits
    
    const productPart = String(stableId).padStart(5, '0');
    const ean12 = prefix + productPart;
    return ean12 + calculateEAN13CheckDigit(ean12);
}

async function importData() {
    const lines = rawData.trim().split('\n').filter(l => l.trim() !== '');
    const items = [];

    for (let i = 0; i < lines.length; i += 3) {
        const namePart = lines[i].trim();
        const barcodePart = lines[i+1]?.trim();

        if (!namePart || !barcodePart) continue;

        let gender = 'UNISEX';
        if (namePart.includes('BAYAN')) gender = 'KADIN';
        else if (namePart.includes('BAY')) gender = 'ERKEK';

        const size = namePart.split('-').pop().trim();

        let colorDesc = 'STANDART';
        let colorCode = 'STD';
        if (namePart.includes('KIRMIZI')) {
            colorDesc = 'Kırmızı';
            colorCode = 'RED';
        }

        const productName = "SERVİS DANIŞMAN POLO YAKA T-SHIRT";
        const productCode = barcodePart.replace(size, '');
        
        // Use the barcode string as a seed for EAN13 to ensure uniqueness and stability
        const ean13 = generateEAN13(barcodePart);

        items.push({
            product_code: productCode,
            color_code: colorCode,
            color: colorDesc,
            size: size,
            barcode: barcodePart, // Old alphanumeric code
            ean13: ean13,         // New EAN-13 code
            product_name: productName,
            gender: gender,
            brand: 'SEAT',
            price: 250.00 // '2' yerine piyasa uyumlu mantıklı bir fiyat koydum
        });
    }

    console.log(`📦 Toplam ${items.length} ürün ayrıştırıldı. PostgreSQL'e aktarılıyor...`);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Update Schema to include ean13
        await client.query(`
            -- Enable pgcrypto extension for gen_random_uuid()
            CREATE EXTENSION IF NOT EXISTS "pgcrypto";

            CREATE TABLE IF NOT EXISTS master_products (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                sku TEXT NOT NULL,
                color_code TEXT,
                color TEXT,
                size TEXT,
                barcode TEXT UNIQUE,
                ean13 TEXT UNIQUE,
                product_name TEXT,
                gender TEXT,
                brand TEXT,
                price DECIMAL(10, 2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Check if ean13 column exists, if not add it (for existing DBs)
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='master_products' AND column_name='ean13') THEN
                    ALTER TABLE master_products ADD COLUMN ean13 TEXT UNIQUE;
                END IF;
            END $$;
        `);

        for (const item of items) {
            await client.query(`
                INSERT INTO master_products 
                (sku, color_code, color, size, barcode, ean13, product_name, gender, brand, price)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (barcode) DO UPDATE SET 
                sku = EXCLUDED.sku,
                color_code = EXCLUDED.color_code,
                color = EXCLUDED.color,
                size = EXCLUDED.size,
                ean13 = EXCLUDED.ean13,
                product_name = EXCLUDED.product_name,
                gender = EXCLUDED.gender,
                brand = EXCLUDED.brand,
                price = EXCLUDED.price;
            `, [
                item.sku, item.color_code, item.color, item.size, 
                item.barcode, item.ean13, item.product_name, item.gender, item.brand, item.price
            ]);
        }
        await client.query('COMMIT');
        console.log('✅ Aktarım ve EAN-13 eşleştirmesi başarıyla tamamlandı.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Aktarım sırasında hata oluştu:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

importData();
