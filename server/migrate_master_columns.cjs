const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

async function migrateColumns() {
    console.log('🚀 Veritabanına bağlanılıyor...');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        console.log('📦 master_products tablosundaki sütun adları güncelleniyor...');

        // Sütunları yeniden adlandır
        await client.query(`
            DO $$ 
            BEGIN 
                IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='master_products' AND column_name='product_code') THEN
                    ALTER TABLE master_products RENAME COLUMN product_code TO sku;
                END IF;
                IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='master_products' AND column_name='color_description') THEN
                    ALTER TABLE master_products RENAME COLUMN color_description TO color;
                END IF;
                IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='master_products' AND column_name='price01') THEN
                    ALTER TABLE master_products RENAME COLUMN price01 TO price;
                END IF;
            END $$;
        `);

        await client.query('COMMIT');
        console.log('✅ Sütun adları başarıyla güncellendi (product_code -> sku, vs).');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Hata oluştu:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrateColumns();
