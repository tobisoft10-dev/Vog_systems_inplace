import CryptoJS from 'crypto-js';
import fs from 'fs';

// Bu anahtar LicenseService.js ile AYNI olmalıdır
const MASTER_SECRET = "VOG_Tekstil_Secure_2026_!@#";

// --- LİSANS BİLGİLERİNİ BURADAN GÜNCELLEYİN ---
const licenseData = {
    hwid: "5d062310aa0a16cfa2eed6427a23148aa6daa79826eb3db051ab13d3bab1d3e2", // Sunucuda çıkan "Fingerprint ID'niz" kısmını buraya yazın
    customer: "VOG Tekstil Premium",
    expires: "2027-04-08" // Son kullanma tarihi
};
// ----------------------------------------------

try {
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(licenseData), MASTER_SECRET).toString();
    fs.writeFileSync('license.key', encrypted);
    console.log("✓ license.key başarıyla oluşturuldu!");
    console.log("------------------------------------------");
    console.log("Şimdi bu oluşan 'license.key' dosyasını kopyalayıp sunucuya atın.");
    console.log("------------------------------------------");
} catch (err) {
    console.error("Hata:", err);
}
