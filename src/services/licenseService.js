/* eslint-disable */
import pkg from 'node-machine-id';
const { machineIdSync } = pkg;
import CryptoJS from 'crypto-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Reconstructed de-obfuscation helper
const a0_0x58a8 = function(_0x571839) {
    _0x571839 = _0x571839 - 0x189;
    const _0x38af03 = a0_0x34e3();
    let _0x472a15 = _0x38af03[_0x571839];
    return _0x472a15;
};

const a0_0x1d1353 = a0_0x58a8;

// Self-executing obfuscation logic
(function(_0x33fd7b, _0x14b375) {
    const _0x262c81 = a0_0x58a8;
    const _0x37dbe4 = _0x33fd7b();
    while (!![]) {
        try {
            const _0x4c1a8c = -parseInt(_0x262c81(0x1b1)) / 0x1 * (parseInt(_0x262c81(0x1ac)) / 0x2) + parseInt(_0x262c81(0x1ab)) / 0x3 + parseInt(_0x262c81(0x1a9)) / 0x4 + parseInt(_0x262c81(0x1a1)) / 0x5 * (parseInt(_0x262c81(0x19e)) / 0x6) + parseInt(_0x262c81(0x195)) / 0x7 * (-parseInt(_0x262c81(0x19a)) / 0x8) + parseInt(_0x262c81(0x19b)) / 0x9 * (parseInt(_0x262c81(0x1a8)) / 0xa) + parseInt(_0x262c81(0x193)) / 0xb;
            if (_0x4c1a8c === _0x14b375) break;
            else _0x37dbe4['push'](_0x37dbe4['shift']());
        } catch (_0x492b7e) {
            _0x37dbe4['push'](_0x37dbe4['shift']());
        }
    }
}(a0_0x34e3, 0x93406));

const a0_0x21fb89 = (function() {
    let _0x1a97f9 = !![];
    return function(_0x428487, _0x55c5f8) {
        const _0x479a20 = _0x1a97f9 ? function() {
            const _0x520ef4 = a0_0x58a8;
            if (_0x55c5f8) {
                const _0x267765 = _0x55c5f8[_0x520ef4(0x1b0)](_0x428487, arguments);
                return _0x55c5f8 = null, _0x267765;
            }
        } : function() {};
        return _0x1a97f9 = ![], _0x479a20;
    };
}());

const a0_0x472a15 = a0_0x21fb89(this, function() {
    const _0x5be97f = a0_0x58a8;
    return a0_0x472a15[_0x5be97f(0x197)]()[_0x5be97f(0x18c)]('(((.+)+)+)+$')[_0x5be97f(0x197)]()[_0x5be97f(0x1b2)](a0_0x472a15)['search'](_0x5be97f(0x198));
});

// a0_0x472a15();

const MASTER_SECRET = a0_0x1d1353(0x1a7);

class LicenseService {
    getFingerprint() {
        const _0xd8066c = a0_0x1d1353;
        try {
            return machineIdSync();
        } catch (_0x5280df) {
            return console.error("Donanım ID alınamadı: ", _0x5280df), "UNKNOWN_HARDWARE_ID";
        }
    }

    async verify() {
        const _0x2738df = a0_0x1d1353;
        // Paths are handled relative to this file
        const _0x2d9135 = path.join(__dirname, '../../license.key');
        
        if (!fs.existsSync(_0x2d9135)) {
            console.error('\x1b[31m%s\x1b[0m', 'KRİTİK HATA: Lisans dosyası (license.key) bulunamadı!');
            console.error('Fingerprint ID\'niz: ' + this.getFingerprint());
            // In a real app, you might not want to exit(1) in the browser, 
            // but this seems to be a Node.js utility script context.
            if (typeof process !== 'undefined') process.exit(1);
            return false;
        }

        try {
            const _0x5ee806 = fs.readFileSync(_0x2d9135, 'utf8');
            const _0x221aad = CryptoJS.AES.decrypt(_0x5ee806, MASTER_SECRET);
            const _0x508676 = JSON.parse(_0x221aad.toString(CryptoJS.enc.Utf8));
            const _0x3c156a = this.getFingerprint();

            if (_0x508676.hwid !== _0x3c156a) {
                console.error('\x1b[31m%s\x1b[0m', 'KRİTİK HATA: Lisans bu donanım için geçerli değil!');
                console.error('Bu sunucu ID: ' + _0x3c156a);
                if (typeof process !== 'undefined') process.exit(1);
                return false;
            }

            const _0x109009 = new Date(_0x508676.expires);
            if (_0x109009 < new Date()) {
                console.error('\x1b[31m%s\x1b[0m', 'KRİTİK HATA: Lisans süresi dolmuş! (' + _0x508676.expires + ')');
                if (typeof process !== 'undefined') process.exit(1);
                return false;
            }

            console.log('\x1b[32m%s\x1b[0m', '✓ Lisans Başarıyla Doğrulandı (Hardware Binding Active)');
            console.log('Müşteri: ' + _0x508676.customer);
            console.log('Bitiş Tarihi: ' + _0x508676.expires);
            return true;
        } catch (_0xa90783) {
            console.error('\x1b[31m%s\x1b[0m', 'KRİTİK HATA: Lisans anahtarı bozuk veya geçersiz!');
            if (typeof process !== 'undefined') process.exit(1);
            return false;
        }
    }
}

function a0_0x34e3() {
    const _0x334792 = ['2907304aEAFiQ', '102861WFAKeV', 'getFingerprint', 'expires', '42Fiyadt', 'KRİTİK\x20HATA:\x20Lisans\x20anahtarı\x20bozuk\x20veya\x20geçersiz!', 'readFileSync', '552700vjnAjS', 'Fingerprint\x20ID\x27niz:\x20', 'KRİTİK\x20HATA:\x20Lisans\x20süresi\x20dolmuş!\x20(', 'KRİTİK\x20HATA:\x20Lisans\x20dosyası\x20(license.key)\x20bulunamadı!', 'Donanım\x20ID\x20alınamadı:', 'enc', 'VOG_Tekstil_Secure_2026_!@#', '390nxQydr', '547076mRiWYm', 'customer', '556443QAEMzy', '8roxGUS', 'parse', 'verify', '\x1b[31m%s\x1b[0m', 'apply', '39613aIEkiO', 'constructor', 'exit', 'utf8', 'decrypt', 'search', 'dirname', '../../license.key', '✓\x20Lisans\x20Başarıyla\x20Doğrulandı\x20(Hardware\x20Binding\x20Active)', 'error', 'log', 'join', '3410792MGnBGL', '\x1b[33m%s\x1b[0m', '21EtUgZy', 'AES', 'toString', '(((.+)+)+)+$', 'UNKNOWN_HARDWARE_ID'];
    a0_0x34e3 = function() { return _0x334792; };
    return a0_0x34e3();
}

const service = new LicenseService();
export default service;

// Eğer doğrudan çalıştırılıyorsa doğrulama fonksiyonunu tetikle
if (typeof process !== 'undefined' && process.argv && process.argv[1]) {
    try {
        const mainPath = fs.realpathSync(process.argv[1]);
        const filePath = fs.realpathSync(__filename);
        if (mainPath === filePath) {
            service.verify();
        }
    } catch (e) {
        // Hata durumunda yoksay
    }
}
