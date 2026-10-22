const net = require('net');
const http = require('http');

const TARGET_IP = '192.168.0.13';
const PORTS = [
    80, 8080, 2111, 2112, 2113, 2114, 5000, 5001, 5084, 7070, 9000, 9100, 23, 10001, 4001, 60000, 65000
];

console.log(`🔍 [RFID SCANNER] ${TARGET_IP} üzerinde RFID ve web portları taranıyor...\n`);

async function checkPort(port) {
    return new Promise((resolve) => {
        const s = new net.Socket();
        s.setTimeout(500);

        s.on('connect', () => {
            console.log(`🎯 [AÇIK PORT BULUNDU] ${TARGET_IP}:${port} (ONLINE)`);
            s.destroy();
            resolve({ port, open: true });
        });

        s.on('timeout', () => { s.destroy(); resolve({ port, open: false }); });
        s.on('error', () => { s.destroy(); resolve({ port, open: false }); });

        s.connect(port, TARGET_IP);
    });
}

async function run() {
    const results = await Promise.all(PORTS.map(p => checkPort(p)));
    const openList = results.filter(r => r.open).map(r => r.port);

    console.log('\n======================================================');
    console.log(`✅ [${TARGET_IP} TARAMA BİTTİ] Açık Portlar:`, openList);
    console.log('======================================================\n');

    if (openList.includes(80)) {
        console.log(`📥 [HTTP PROBE] http://${TARGET_IP}/ bilgisi çekiliyor...`);
        http.get(`http://${TARGET_IP}/`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const titleMatch = data.match(/<title>([^<]+)<\/title>/i);
                console.log('📄 Web Sayfası Başlığı:', titleMatch ? titleMatch[1] : 'Başlık yok');
                console.log('📄 Sayfa Başlangıcı:\n', data.substring(0, 1000));
            });
        }).on('error', (e) => console.log('HTTP hatası:', e.message));
    }
}

run();
