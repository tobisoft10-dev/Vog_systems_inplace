require('dotenv').config({ path: './server/.env' });
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
`;

async function importData() {
    const lines = rawData.trim().split('\n').filter(l => l.trim() !== '');
    const items = [];

    // Gruplayarak işle (İsim, Kod, Fiyat/Değer)
    for (let i = 0; i < lines.length; i += 3) {
        const namePart = lines[i].trim();
        const barcodePart = lines[i+1]?.trim();
        const valuePart = lines[i+2]?.trim();

        if (!namePart || !barcodePart) continue;

        // 1. Cinsiyet Ayıkla
        let gender = 'UNISEX';
        if (namePart.includes('BAYAN')) gender = 'KADIN';
        else if (namePart.includes('BAY')) gender = 'ERKEK';

        // 2. Beden Ayıkla (Son tireden sonrası)
        const size = namePart.split('-').pop().trim();

        // 3. Renk Ayıkla
        let colorDesc = 'STANDART';
        let colorCode = 'STD';
        if (namePart.includes('KIRMIZI')) {
            colorDesc = 'Kırmızı';
            colorCode = 'RED';
        }

        // 4. Ürün Adı Temizle
        const productName = "SERVİS DANIŞMAN POLO YAKA T-SHIRT";

        // 5. Product Code (Barkodun bedensiz hali)
        const productCode = barcodePart.replace(size, '');

        items.push({
            sku: productCode,
            color_code: colorCode,
            color: colorDesc,
            size: size,
            barcode: barcodePart,
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
        for (const item of items) {
            await client.query(`
                INSERT INTO master_products 
                (sku, color_code, color, size, barcode, product_name, gender, brand, price)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (barcode) DO NOTHING
            `, [
                item.sku, item.color_code, item.color, item.size, 
                item.barcode, item.product_name, item.gender, item.brand, item.price
            ]);
        }
        await client.query('COMMIT');
        console.log('✅ Aktarım başarıyla tamamlandı.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Aktarım sırasında hata oluştu:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

importData();
