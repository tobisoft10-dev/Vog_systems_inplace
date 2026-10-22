const http = require('http');
const net = require('net');

const TARGET_IP = '192.168.1.79';
const PORT = 7070;

console.log(`🔌 [PROBE] ${TARGET_IP}:${PORT} servisi analiz ediliyor...\n`);

// 1. HTTP GET Test
const req = http.get(`http://${TARGET_IP}:${PORT}/`, (res) => {
    let data = '';
    console.log(`HTTP Yanıt Kodu: ${res.statusCode}`);
    console.log('HTTP Başlıkları:', res.headers);
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('HTTP Yanıt Gövdesi (İlk 500 Karakter):');
        console.log(data.substring(0, 500));
    });
});

req.on('error', (err) => {
    console.log(`HTTP isteği başarısız (${err.message}). Raw TCP Socket olarak test ediliyor...`);

    // 2. Raw Socket Test
    const client = new net.Socket();
    client.setTimeout(3000);

    client.connect(PORT, TARGET_IP, () => {
        console.log(`✅ RAW TCP Socket Bağlantısı Başarılı: ${TARGET_IP}:${PORT}`);
        client.write('\r\n');
    });

    client.on('data', (buf) => {
        console.log('📥 Gelen Raw Veri (Hex):', buf.toString('hex'));
        console.log('📥 Gelen Raw Veri (Metin):', buf.toString('utf8'));
        client.end();
    });

    client.on('timeout', () => {
        console.log('Socket zaman aşımı (veri bekleniyor)');
        client.destroy();
    });

    client.on('error', (e) => {
        console.log('Socket hatası:', e.message);
    });
});
req.setTimeout(3000, () => req.destroy());
