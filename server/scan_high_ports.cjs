const net = require('net');

const TARGET_IP = '192.168.1.79';
const START_PORT = 10001;
const END_PORT = 65535;
const TIMEOUT_MS = 250;
const CONCURRENCY = 250;

console.log(`🔍 [HIGH PORT SCANNER] ${TARGET_IP} üzerinde Port ${START_PORT}..${END_PORT} taranıyor...`);

const openPorts = [];
const queue = [];
for (let p = START_PORT; p <= END_PORT; p++) {
    queue.push(p);
}

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
    console.log(`✅ [YÜKSEK PORT TARAMASI BİTTİ] Hedef: ${TARGET_IP}`);
    console.log(`🌟 Açık Yüksek Portlar: ${openPorts.length > 0 ? openPorts.join(', ') : 'Başka açık port yok'}`);
    console.log(`======================================================\n`);
}

run();
