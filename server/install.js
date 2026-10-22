const { execSync } = require('child_process');

console.log('--- VOG Tekstil Kurulum Yardımcısı ---');
console.log('Bağımlılıklar yükleniyor, lütfen bekleyin...');

try {
    // Run npm install in the current directory
    execSync('npm install', { stdio: 'inherit' });
    console.log('\n✅ Kurulum başarıyla tamamlandı.');
    console.log('Sunucuyu başlatmak için şunu yazabilirsiniz: node app.js');
} catch (error) {
    console.error('\n❌ Hata oluştu:', error.message);
    console.log('Lütfen sisteminizde npm yüklü olduğundan emin olun.');
}
