const net = require('net');

const SICK_IPS = ['192.168.1.15', '192.168.1.16', '192.168.1.17', '192.168.1.49'];
const PORTS = [2111, 2112, 2113, 2114, 5000, 5001, 80, 5084, 7070, 9000, 23];

console.log('🔍 [SICK SCANNER] Gerçek SICK RFID Okuyucu Cihazları Taranıyor...\n');

async function testIpPort(ip, port) {
    return new Promise((resolve) => {
        const s = new net.Socket();
        s.setTimeout(500);

        s.on('connect', () => {
            console.log(`🌟 [SICK CANLI OKUYUCU BULUNDU] ${ip}:${port} (ONLINE & CONNECTED)`);
            s.destroy();
            resolve({ ip, port, open: true });
        });

        s.on('timeout', () => { s.destroy(); resolve({ ip, port, open: false }); });
        s.on('error', () => { s.destroy(); resolve({ ip, port, open: false }); });

        s.connect(port, ip);
    });
}

async function run() {
    const tasks = [];
    for (const ip of SICK_IPS) {
        for (const port of PORTS) {
            tasks.push(testIpPort(ip, port));
        }
    }

    const results = await Promise.all(tasks);
    const openList = results.filter(r => r.open);

    console.log('\n======================================================');
    console.log('✅ [SICK TARAMA SONUCU]');
    console.log(openList.length > 0 ? openList : 'Bu portlarda açık soket bulunamadı.');
    console.log('======================================================\n');
}

run();
