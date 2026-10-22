
require('dotenv').config({ path: __dirname + '/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function setupDatabase() {
    console.log('🚀 PostgreSQL Veritabanı Güncelleme İşlemi Başlatıldı...');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('📦 Tablolar kontrol ediliyor ve oluşturuluyor...');
        
        // Mevcut tablolara ek olarak yeni tabloları oluştur
        await client.query(`
            -- Enable pgcrypto extension for gen_random_uuid()
            CREATE EXTENSION IF NOT EXISTS "pgcrypto";

            -- Kullanıcılar ve Yetkilendirme
            CREATE TABLE IF NOT EXISTS ws_users (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'CUSTOMER',
                brand TEXT,
                database_name TEXT
            );
 
            -- Fişler (Vouchers)
            CREATE TABLE IF NOT EXISTS vouchers (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                order_id INTEGER REFERENCES orders(order_number) ON DELETE CASCADE,
                location TEXT,
                barcode TEXT,
                ean13 TEXT,
                quantity INTEGER,
                product_name TEXT,
                color TEXT,
                size TEXT,
                brand TEXT,
                sku TEXT,
                price DECIMAL(10, 2),
                gender TEXT,
                box_no INTEGER DEFAULT 1,
                total_boxes INTEGER DEFAULT 1,
                gross_weight DECIMAL(10, 2) DEFAULT 12.50,
                package_type TEXT DEFAULT 'Koli',
                sub_customer_name TEXT,
                recipient_address TEXT,
                carrier TEXT,
                tracking_number TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
 
            -- Satışlar (Sales)
            CREATE TABLE IF NOT EXISTS sales (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                order_id INTEGER REFERENCES orders(order_number) ON DELETE CASCADE,
                location TEXT,
                barcode TEXT,
                ean13 TEXT,
                quantity INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
 
            -- Sayım İşlemleri (Inventory Counts)
            CREATE TABLE IF NOT EXISTS inventory_counts (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                counting_id INTEGER,
                total_line_items INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
 
            CREATE TABLE IF NOT EXISTS inventory_count_items (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                count_id UUID REFERENCES inventory_counts(id) ON DELETE CASCADE,
                gtin TEXT,
                quantity INTEGER
            );

            -- Mod B: Koli Paketleme ve Tünel Doğrulama Tabloları
            CREATE TABLE IF NOT EXISTS order_boxes (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                order_id INTEGER,
                order_number TEXT NOT NULL,
                box_no INTEGER NOT NULL,
                total_boxes INTEGER DEFAULT 1,
                status TEXT DEFAULT 'PLANNED', -- 'PLANNED', 'PACKING', 'PACKED', 'VERIFIED', 'SHIPPED'
                target_quantity INTEGER DEFAULT 0,
                items_plan JSONB DEFAULT '[]'::jsonb,
                packed_quantity INTEGER DEFAULT 0,
                verified_quantity INTEGER DEFAULT 0,
                plan_type TEXT DEFAULT 'MANUAL',
                notes TEXT,
                carrier TEXT,
                tracking_number TEXT,
                staff_name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                packed_at TIMESTAMP,
                verified_at TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(order_number, box_no)
            );

            CREATE TABLE IF NOT EXISTS order_box_items (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                box_id UUID REFERENCES order_boxes(id) ON DELETE CASCADE,
                order_id INTEGER,
                order_number TEXT NOT NULL,
                box_no INTEGER NOT NULL,
                epc TEXT NOT NULL,
                barcode TEXT,
                sku TEXT,
                size TEXT,
                product_name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(order_number, epc)
            );

 
            -- Safe migrations for existing databases
            DO $$ 
            BEGIN 
                -- Enable pgcrypto extension for gen_random_uuid()
                CREATE EXTENSION IF NOT EXISTS "pgcrypto";

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ws_users' AND column_name='role') THEN
                    ALTER TABLE ws_users ADD COLUMN role TEXT DEFAULT 'CUSTOMER';
                END IF;
 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ws_users' AND column_name='brand') THEN
                    ALTER TABLE ws_users ADD COLUMN brand TEXT;
                END IF;
 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vouchers' AND column_name='ean13') THEN
                    ALTER TABLE vouchers ADD COLUMN ean13 TEXT;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vouchers' AND column_name='barcode') THEN
                    ALTER TABLE vouchers ADD COLUMN barcode TEXT;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vouchers' AND column_name='product_name') THEN
                    ALTER TABLE vouchers ADD COLUMN product_name TEXT;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vouchers' AND column_name='color') THEN
                    ALTER TABLE vouchers ADD COLUMN color TEXT;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vouchers' AND column_name='size') THEN
                    ALTER TABLE vouchers ADD COLUMN size TEXT;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vouchers' AND column_name='brand') THEN
                    ALTER TABLE vouchers ADD COLUMN brand TEXT;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vouchers' AND column_name='sku') THEN
                    ALTER TABLE vouchers ADD COLUMN sku TEXT;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vouchers' AND column_name='price') THEN
                    ALTER TABLE vouchers ADD COLUMN price DECIMAL(10, 2);
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vouchers' AND column_name='gender') THEN
                    ALTER TABLE vouchers ADD COLUMN gender TEXT;
                END IF;

                -- Drop old garment-specific columns
                ALTER TABLE vouchers DROP COLUMN IF EXISTS fabric_composition CASCADE;
                ALTER TABLE vouchers DROP COLUMN IF EXISTS origin CASCADE;
                ALTER TABLE vouchers DROP COLUMN IF EXISTS season CASCADE;
                ALTER TABLE vouchers DROP COLUMN IF EXISTS care_instructions CASCADE;
                ALTER TABLE vouchers DROP COLUMN IF EXISTS hs_code CASCADE;

                -- Add box columns if they don't exist
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vouchers' AND column_name='box_no') THEN
                    ALTER TABLE vouchers ADD COLUMN box_no INTEGER DEFAULT 1;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vouchers' AND column_name='total_boxes') THEN
                    ALTER TABLE vouchers ADD COLUMN total_boxes INTEGER DEFAULT 1;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vouchers' AND column_name='gross_weight') THEN
                    ALTER TABLE vouchers ADD COLUMN gross_weight DECIMAL(10, 2) DEFAULT 12.50;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vouchers' AND column_name='package_type') THEN
                    ALTER TABLE vouchers ADD COLUMN package_type TEXT DEFAULT 'Koli';
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vouchers' AND column_name='sub_customer_name') THEN
                    ALTER TABLE vouchers ADD COLUMN sub_customer_name TEXT;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vouchers' AND column_name='recipient_address') THEN
                    ALTER TABLE vouchers ADD COLUMN recipient_address TEXT;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vouchers' AND column_name='carrier') THEN
                    ALTER TABLE vouchers ADD COLUMN carrier TEXT;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vouchers' AND column_name='tracking_number') THEN
                    ALTER TABLE vouchers ADD COLUMN tracking_number TEXT;
                END IF;
                 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='ean13') THEN
                    ALTER TABLE sales ADD COLUMN ean13 TEXT;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='price') THEN
                    ALTER TABLE sales ADD COLUMN price DECIMAL(10, 2);
                END IF;
            END $$;
        `);

        console.log('🌱 Örnek veriler (Seed Data) işlemi atlandı (sadece gerekli kullanıcılar ekleniyor).');

        // Kullanıcı Seed (Bcrypt Hashed default credentials)
        const bcrypt = require('bcrypt');
        const saltRounds = 10;
        const usersToSeed = [
            { username: 'VOG', password: 'Vog2026!Premium', role: 'ADMIN', brand: 'VOG' },
            { username: 'admin', password: 'Vog2026!Premium', role: 'ADMIN', brand: 'VOG' },
            { username: 'zara', password: 'Vog2026!Premium', role: 'CUSTOMER', brand: 'ZARA' },
            { username: 'ford', password: 'Vog2026!Premium', role: 'CUSTOMER', brand: 'FORD' },
            { username: 'seat', password: 'Vog2026!Premium', role: 'CUSTOMER', brand: 'SEAT' },
            { username: 'audi', password: 'Vog2026!Premium', role: 'CUSTOMER', brand: 'AUDI' }
        ];

        for (const u of usersToSeed) {
            const h = await bcrypt.hash(u.password, saltRounds);
            await client.query(`
                INSERT INTO ws_users (username, password, role, brand, database_name) 
                VALUES ($1, $2, $3, $4, 'vog_db') 
                ON CONFLICT (username) DO UPDATE SET 
                    password = EXCLUDED.password,
                    role = EXCLUDED.role,
                    brand = EXCLUDED.brand,
                    database_name = EXCLUDED.database_name;
            `, [u.username, h, u.role, u.brand]);
        }

        await client.query('COMMIT');
        console.log('✅ Veritabanı başarıyla güncellendi ve hazır hale getirildi.');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Hata oluştu:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

setupDatabase();
