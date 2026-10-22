const WebSocket = require('ws');
const http = require('http');

const BRIDGE_WS_URL = process.env.BRIDGE_WS_URL || 'ws://127.0.0.1:8025/ws';
const VOG_BACKEND_URL = process.env.VOG_BACKEND_URL || 'http://127.0.0.1:3001';
const IMPINJ_IP = process.env.IMPINJ_IP || '192.168.0.13';

console.log('===============================================================');
console.log('🚀 [VOG NATIVE TUNNEL CONTROLLER - 100% YERLİ DONANIM SÜRÜCÜSÜ]');
console.log(`📡 Hedef Impinj Okuyucu IP: ${IMPINJ_IP}`);
console.log(`🔌 Donanım Köprüsü: ${BRIDGE_WS_URL}`);
console.log(`🏢 VOG Backend Hedefi: ${VOG_BACKEND_URL}`);
console.log('===============================================================\n');

let ws = null;
let isConnected = false;
let isScanning = false;

function postTagToVog(epc) {
    const payload = JSON.stringify({ rfid_tag: epc, reader_id: 'VOG_NATIVE_TUNNEL' });
    const url = new URL(`${VOG_BACKEND_URL}/api/tunnel/kiosk/scan-tag`);

    const req = http.request(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 2000
    }, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
            console.log(`✅ [VOG KİOSK'A İŞLENDİ] EPC: ${epc} -> HTTP ${res.statusCode}`);
        });
    });

    req.on('error', (e) => {
        console.error(`❌ [VOG HTTP HATASI] (${epc}):`, e.message);
    });

    req.write(payload);
    req.end();
}

function startDriver() {
    console.log(`🔌 [BAĞLANTI BAŞLATILIYOR] ${BRIDGE_WS_URL}...`);
    ws = new WebSocket(BRIDGE_WS_URL);

    ws.on('open', () => {
        console.log(`🎉 [KÖPRÜYE BAĞLANILDI] ${BRIDGE_WS_URL}`);
        isConnected = true;

        // 1. ADIM: CREATE READER (Impinj Okuyucu Nesnesi Oluştur)
        const createMsg = {
            type: "createreader",
            body: {
                id: "1",
                param: {
                    id: 1,
                    readerType: "Impinj",
                    connectionType: "Ethernet",
                    address: IMPINJ_IP
                }
            }
        };
        console.log('📤 [1/3] createreader gönderiliyor:', JSON.stringify(createMsg));
        ws.send(JSON.stringify(createMsg));

        // 2. ADIM: CONNECT READER (Okuyucuya Bağlan ve 4 Anteni Yapılandır)
        setTimeout(() => {
            if (!ws || ws.readyState !== WebSocket.OPEN) return;
            const connectMsg = {
                type: "connectreader",
                body: {
                    id: "1",
                    param: {
                        id: 1,
                        settings: {
                            readPower: 30.0,
                            writePower: 30.0,
                            antennas: [
                                { portNumber: 1, enabled: true, readPower: 30.0 },
                                { portNumber: 2, enabled: true, readPower: 30.0 },
                                { portNumber: 3, enabled: true, readPower: 30.0 },
                                { portNumber: 4, enabled: true, readPower: 30.0 }
                            ]
                        }
                    }
                }
            };
            console.log('📤 [2/3] connectreader gönderiliyor:', JSON.stringify(connectMsg));
            ws.send(JSON.stringify(connectMsg));
        }, 800);

        // 3. ADIM: START READER (Antenleri Ateşle ve Taramayı Başlat)
        setTimeout(() => {
            if (!ws || ws.readyState !== WebSocket.OPEN) return;
            const startMsg = {
                type: "startreader",
                body: {
                    id: "1",
                    param: {
                        id: 1
                    }
                }
            };
            console.log('⚡ [3/3] startreader (Anten Ateşleme) gönderiliyor:', JSON.stringify(startMsg));
            ws.send(JSON.stringify(startMsg));
            isScanning = true;
            console.log('🟢 [SİSTEM %100 HAZIR] Tünel antenleri devrede, koliler geçebilir!\n');
        }, 1800);
    });

    ws.on('message', (raw) => {
        try {
            const data = JSON.parse(raw.toString());
            console.log('📥 [DONANIM GELEN VERİ]:', JSON.stringify(data));

            // Tag Listesi Yakalama
            if (data.tags && Array.isArray(data.tags)) {
                for (const t of data.tags) {
                    const epc = typeof t === 'string' ? t : (t.epc || t.tag || t.Epc);
                    if (epc) {
                        console.log(`🏷️ [ETİKET YAKALANDI] EPC: ${epc}`);
                        postTagToVog(epc);
                    }
                }
            } else if (data.body && data.body.tags && Array.isArray(data.body.tags)) {
                for (const t of data.body.tags) {
                    const epc = typeof t === 'string' ? t : (t.epc || t.tag || t.Epc);
                    if (epc) {
                        console.log(`🏷️ [ETİKET YAKALANDI] EPC: ${epc}`);
                        postTagToVog(epc);
                    }
                }
            } else if (data.epc || (data.body && data.body.epc)) {
                const epc = data.epc || data.body.epc;
                console.log(`🏷️ [ETİKET YAKALANDI] EPC: ${epc}`);
                postTagToVog(epc);
            }

            // Fotosel
            if (data.type === 'inputchanged' && data.state === true) {
                console.log('📸 [FOTOSEL] Koli tünelde algılandı!');
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: "startreader", body: { id: "1", param: { id: 1 } } }));
                }
            }
        } catch (e) {
            console.log('📥 [RAW TEXT]:', raw.toString());
        }
    });

    ws.on('error', (err) => {
        console.error('⚠️ [KÖPRÜ HATASI]:', err.message);
    });

    ws.on('close', (code, reason) => {
        console.log(`🔌 [BAĞLANTI KAPANDI] (Kod: ${code}). 3 sn içinde tekrar denenecek...`);
        isConnected = false;
        isScanning = false;
        setTimeout(startDriver, 3000);
    });
}

// Keep-Alive Heartbeat every 5 seconds
setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
    }
}, 5000);

startDriver();
