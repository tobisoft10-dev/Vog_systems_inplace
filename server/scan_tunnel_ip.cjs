const net = require('net');

const TARGET_IP = '192.168.1.79';
const START_PORT = 1;
const END_PORT = 10000;
const TIMEOUT_MS = 300;
const CONCURRENCY = 100;

console.log(`🔍 [PORT SCANNER] ${TARGET_IP} üzerinde Port ${START_PORT}..${END_PORT} taranıyor...`);

const openPorts = [];
let currentPort = START_PORT;
let activeChecks = 0;

function checkPort(port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(TIMEOUT_MS);

        socket.on('connect', () => {
            console.log(`🎯 [AÇIK PORT BULUNDU] ${TARGET_IP}:${port} (ONLINE)`);
            openPorts.push(port);
            socket.destroy();
            resolve();
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve();
        });

        socket.on('error', () => {
            socket.destroy();
            resolve();
        });

        socket.connect(port, TARGET_IP);
    });
}

async function run() {
    const queue = [];
    for (let p = START_PORT; p <= END_PORT; p++) {
        queue.push(p);
    }

    async function worker() {
        while (queue.length > 0) {
            const p = queue.shift();
            await checkPort(p);
        }
    }

    const workers = [];
    for (let i = 0; i < CONCURRENCY; i++) {
        workers.push(worker());
    }

    await Promise.all(workers);

    console.log(`\n======================================================`);
    console.log(`✅ [TARAMA TAMAMLANDI] Hedef: ${TARGET_IP}`);
    console.log(`🌟 Açık Portlar: ${openPorts.length > 0 ? openPorts.join(', ') : 'Hiçbir açık TCP portu bulunamadı (Cihaz kapalı olabilir veya Windows Firewall tüm gelen portları engelliyor).'}`);
    console.log(`======================================================\n`);
}

run();
