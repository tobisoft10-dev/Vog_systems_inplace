const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 VOG Tekstil Premium - Sistem Başlatılıyor...');

function run(command, cwd = process.cwd()) {
    try {
        if (!fs.existsSync(cwd)) {
            console.error(`⚠️  Dizin bulunamadı, atlanıyor: ${cwd}`);
            return false;
        }
        console.log(`\n> Komut çalışıyor: ${command} (${cwd})`);
        execSync(command, { stdio: 'inherit', cwd });
        return true;
    } catch (error) {
        console.error(`❌ Hata: ${command} başarısız oldu.`);
        return false;
    }
}

// 1. Önce eski servisleri temizleyelim (Opsiyonel)
console.log('🧹 Eski PM2 servisleri temizleniyor...');
try { execSync('pm2 delete vog-api vog-frontend', { stdio: 'ignore' }); } catch(e) {}

// 2. Dizin Tespiti (Resilient Path Detection)
let rootPath = process.cwd();
let serverPath = path.join(rootPath, 'server');

// Eğer halihazırda 'server' klasörünün içindeysek bir üst dizine çıkalım
if (path.basename(rootPath) === 'server' || !fs.existsSync(serverPath)) {
    if (fs.existsSync(path.join(rootPath, 'app.js'))) {
        serverPath = rootPath;
        rootPath = path.join(rootPath, '..');
        console.log('ℹ️  Server klasörü içinde olduğunuz tespit edildi, yollar ayarlanıyor...');
    }
}

console.log(`📂 Tespit Edilen Kök Dizin: ${rootPath}`);
console.log(`📂 Tespit Edilen Server Dizini: ${serverPath}`);

// 3. Server Bağımlılıklarını Kontrol Et ve Başlat
console.log('\n📦 Backend ayarlanıyor...');

const hasNodeModules = fs.existsSync(path.join(serverPath, 'node_modules'));

if (!hasNodeModules) {
    console.log('📦 node_modules bulunamadı, kurulum yapılıyor...');
    run('npm install', serverPath);
} else {
    console.log('✅ node_modules zaten mevcut, kurulum adımı atlanıyor.');
}

// Veritabanı tablolarını ve seed verilerini güncelle (Kurulum hatası olsa bile dene)
console.log('🗄 Veritabanı şeması güncelleniyor...');
run('node setup_db.cjs', serverPath);

console.log('🩹 Eksik SKU, EAN13 ve Fiyat alanları onarılıyor...');
run('node heal_db_data.cjs', serverPath);

console.log('🚀 Backend API başlatılıyor...');
run('pm2 start app.js --name vog-api -f', serverPath);

// 4. Frontend'i Ayarla ve Başlat
console.log('\n🖼 Frontend ayarlanıyor...');
const distPath = path.join(rootPath, 'dist');
if (!fs.existsSync(distPath)) {
    console.log('🏗 dist klasörü bulunamadı, build deneniyor...');
    run('npm run build', rootPath);
}

// Windows ve Linux uyumlu PM2 komutu
// En stabil yöntem: PM2'nin kendi serve özelliğini kullanmak
const frontendCmd = process.platform === 'win32' 
    ? `pm2 serve dist 3000 --spa --name vog-frontend -f`
    : 'pm2 start "npx serve -s dist -p 3000" --name vog-frontend -f';

console.log(`> Frontend komutu yürütülüyor: ${frontendCmd}`);
if (run(frontendCmd, rootPath)) {
    console.log('\n✅ Frontend 3000 portunda başlatıldı.');
}

// 5. PM2 Durumunu Kaydet (Reboot sonrası için)
console.log('💾 PM2 durumu kaydediliyor...');
run('pm2 save');

console.log('\n---------------------------------------------------');
console.log('✨ TÜM SİSTEM BAŞARIYLA AYAĞA KALDIRILDI');
console.log('Backend API: http://localhost:3001');
console.log('Frontend UI: http://localhost:3000');
console.log('Durumu görmek için: pm2 status');
console.log('---------------------------------------------------');
