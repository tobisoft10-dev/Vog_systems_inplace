const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables from server folder or root folder
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

async function runMigration() {
    console.log('🚀 Veritabanı UUID güncellemesi ve örnek verilerin aktarımı başlatılıyor...');
    console.log(`📡 Hedef Sunucu: ${process.env.DB_HOST || 'localhost'} / Veritabanı: ${process.env.DB_NAME || 'vog_db'}`);
    
    const sqlPath = path.join(__dirname, '..', 'scratch', 'rebuild_db_uuid.sql');
    if (!fs.existsSync(sqlPath)) {
        console.error('❌ Hata: scratch/rebuild_db_uuid.sql dosyası bulunamadı!');
        process.exit(1);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    const client = await pool.connect();
    
    try {
        console.log('⏳ SQL sorguları çalıştırılıyor (Bu işlem birkaç saniye sürebilir)...');
        await client.query(sqlContent);
        console.log('✅ Veritabanı başarıyla sıfırlandı ve yeni UUID yapısıyla yeniden oluşturuldu.');
        console.log('🌱 Örnek veriler başarıyla yüklendi.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Hata oluştu:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
