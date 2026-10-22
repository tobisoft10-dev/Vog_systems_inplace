const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'vog_db',
    password: process.env.DB_PASSWORD || '150609',
    port: process.env.DB_PORT || 5432,
});

async function resetForProduction() {
    console.log('🚀 [CANLIYA GEÇİŞ] PostgreSQL Tüm Test & Koli/Stok Verilerini Sıfırlama Başlatılıyor...\n');

    try {
        // Tables to completely wipe for clean production state
        const tablesToClear = [
            'vouchers',
            'sales',
            'tunnel_scans',
            'rfid_reads',
            'orders',
            'inventory_counts',
            'master_products',
            'box_labels',
            'customer_stocks'
        ];

        for (const tableName of tablesToClear) {
            try {
                await pool.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE;`);
                console.log(`🧹 [TEMİZLENDİ] '${tableName}' tablosundaki tüm veriler sıfırlandı.`);
            } catch (err) {
                try {
                    await pool.query(`DELETE FROM ${tableName};`);
                    console.log(`🧹 [TEMİZLENDİ - DELETE] '${tableName}' tablosu temizlendi.`);
                } catch (delErr) {
                    console.log(`⚠️ Tablo '${tableName}' mevcut değil veya pasif:`, delErr.message);
                }
            }
        }

        console.log('\n---------------------------------------------------------');
        console.log('📊 CANLI SİSTEM VERİTABANI GÜNCEL KART/TABLO DURUMU:');
        console.log('---------------------------------------------------------');

        const checkTables = [
            { name: 'master_products', desc: 'Ana Ürün Kataloğu (SIFIRLANDI)' },
            { name: 'box_labels', desc: 'Koli Etiket Kayıtları (SIFIRLANDI)' },
            { name: 'customer_stocks', desc: 'Müşteri Stok Kayıtları (SIFIRLANDI)' },
            { name: 'vouchers', desc: 'Fiş/Etiket Basım Kayıtları (SIFIRLANDI)' },
            { name: 'sales', desc: 'Satış Hareketleri (SIFIRLANDI)' },
            { name: 'orders', desc: 'Sipariş Kayıtları (SIFIRLANDI)' },
            { name: 'tunnel_scans', desc: 'Tünel RFID Okuma Geçişleri (SIFIRLANDI)' },
            { name: 'rfid_reads', desc: 'RFID Canlı Okuma Kayıtları (SIFIRLANDI)' },
            { name: 'inventory_counts', desc: 'El Terminali Sayım Kayıtları (SIFIRLANDI)' },
            { name: 'ws_users', desc: 'Kullanıcı Hesapları (KORUNDU - Oturum Hesapları)' },
            { name: 'personnel', desc: 'Personel Tanımları (KORUNDU - Personel Kartları)' }
        ];

        for (const t of checkTables) {
            try {
                const res = await pool.query(`SELECT COUNT(*) as cnt FROM ${t.name}`);
                const count = res.rows[0].cnt;
                console.log(`🔹 ${t.name.padEnd(20)}: ${count.toString().padStart(6)} kayıt | (${t.desc})`);
            } catch (e) {
                console.log(`🔹 ${t.name.padEnd(20)}: Tablo yok (${t.desc})`);
            }
        }

        console.log('\n✅ [BAŞARILI] Koli Etiketleri (box_labels), Müşteri Stokları (customer_stocks) ve tüm veriler temizlendi!');

    } catch (error) {
        console.error('❌ [HATA] Temizleme işlemi esnasında bir hata oluştu:', error.message);
    } finally {
        await pool.end();
    }
}

resetForProduction();
