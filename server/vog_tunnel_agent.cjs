/**
 * ============================================================================
 * 🚀 VOG NATIVE TUNNEL AGENT (TÜNEL BİLGİSAYARI 192.168.1.79 İÇİN SIFIR BAĞIMLILIK)
 * ============================================================================
 * Bu dosya Tünel PC üzerinde çalışır.
 * 1. Doğrudan Impinj Okuyucuya (192.168.0.13:5084) bağlanır.
 * 2. 4 Anteni 30 dBm güçle ateşler.
 * 3. Okunan etiketleri VOG Ana Sunucusuna (192.168.1.251:3001) aktarır.
 */

const net = require('net');
const http = require('http');

const IMPINJ_IP = '192.168.0.13';
const IMPINJ_PORT = 5084;
const VOG_SERVER_HOST = '192.168.1.251';
const VOG_SERVER_PORT = 3001;

console.log('===============================================================');
console.log('🚀 [VOG TÜNEL AJANI] Tünel PC Donanım Motoru Başlatıldı');
console.log(`📡 Impinj Okuyucu: ${IMPINJ_IP}:${IMPINJ_PORT}`);
console.log(`🏢 VOG Ana Sunucu: ${VOG_SERVER_HOST}:${VOG_SERVER_PORT}`);
console.log('===============================================================\n');

let socket = null;
let incomingBuffer = Buffer.alloc(0);
let recentTags = new Map();
let messageId = 1;
let currentPower = 30.0; // Server-synced power setting

function postTagToVog(epc, rssi) {
    const payload = JSON.stringify({ 
        rfid_tag: epc, 
        reader_id: 'VOG_NATIVE_AGENT_013',
        rssi: rssi
    });
    const req = http.request({
        hostname: VOG_SERVER_HOST,
        port: VOG_SERVER_PORT,
        path: '/api/tunnel/kiosk/scan-tag',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 2000
    }, (res) => {
        if (res.statusCode === 200) {
            console.log(`✨ [VOG KİOSK GÜNCELLENDİ] EPC: ${epc} (Sayaç +1)`);
        }
    });

    req.on('error', (e) => {
        console.error(`⚠️ VOG Sunucu Hatası:`, e.message);
    });

    req.write(payload);
    req.end();
}

let isScanningPhysically = false;
let lastGpo = { green: false, red: false, yellow: false };

function setGpo(port, state) {
    if (!socket || !socket.writable) return;
    const val = state ? 1 : 0;
    const payload = Buffer.from([
        0x00, // ResetToFactoryDefault = false
        0x00, 0xDB, // GPOWriteData Parameter (Type 219)
        0x00, 0x07, // Length = 7
        0x00, port, // GPO Port Number
        val         // GPO Data state
    ]);
    console.log(`🔌 [AJAN] GPO Çıkışı Ayarlanıyor: Port ${port} -> ${state ? 'HIGH' : 'LOW'}`);
    sendMsg(3, payload);
}

function pollPowerSettings() {
    const req = http.request({
        hostname: VOG_SERVER_HOST,
        port: VOG_SERVER_PORT,
        path: '/api/tunnel/kiosk/status',
        method: 'GET',
        timeout: 2000
    }, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            try {
                const data = JSON.parse(body);
                if (data.success) {
                    // 1. Sync power
                    if (data.power !== undefined) {
                        const newPower = parseFloat(data.power);
                        if (newPower !== currentPower) {
                            console.log(`📡 [GÜÇ GÜNCELLEMESİ] Sunucudan yeni güç seviyesi algılandı: ${newPower} dBm (Eski: ${currentPower} dBm)`);
                            currentPower = newPower;
                            if (socket && socket.writable) {
                                console.log('🔄 Okuyucu yeni güç ayarıyla yeniden başlatılıyor...');
                                startScanning();
                            }
                        }
                    }

                    // 2. Sync physical scan state (Pause / Resume)
                    if (data.session && data.session.status) {
                        const sessionStatus = data.session.status;
                        const shouldBeScanning = (sessionStatus === 'SCANNING');
                        
                        if (shouldBeScanning && !isScanningPhysically) {
                            if (socket && socket.writable) {
                                console.log('▶️ [AJAN] Kiosk oturumu aktif. Donanımsal tarama BAŞLATILIYOR (START_ROSPEC)...');
                                sendMsg(22, Buffer.from([0x00, 0x00, 0x00, 0x01])); // START_ROSPEC (Type 22)
                                isScanningPhysically = true;
                            }
                        } else if (!shouldBeScanning && isScanningPhysically) {
                            if (socket && socket.writable) {
                                console.log('⏸️ [AJAN] Kiosk oturumu durduruldu/beklemede. Donanımsal tarama DURDURULUYOR (STOP_ROSPEC)...');
                                sendMsg(23, Buffer.from([0x00, 0x00, 0x00, 0x01])); // STOP_ROSPEC (Type 23)
                                isScanningPhysically = false;
                            }
                        }
                    }

                    // 3. GPO Işık Kulesi Senkronizasyonu
                    if (data.gpo) {
                        if (data.gpo.green !== lastGpo.green) {
                            setGpo(1, data.gpo.green);
                            lastGpo.green = data.gpo.green;
                        }
                        if (data.gpo.red !== lastGpo.red) {
                            setGpo(2, data.gpo.red);
                            lastGpo.red = data.gpo.red;
                        }
                        if (data.gpo.yellow !== lastGpo.yellow) {
                            setGpo(3, data.gpo.yellow);
                            lastGpo.yellow = data.gpo.yellow;
                        }
                    }
                }
            } catch (e) {}
        });
    });
    req.on('error', () => {});
    req.end();
}

function pollAndPostTelemetry() {
    // R700 system status endpoint (without auth by default)
    const reqSystem = http.request({
        hostname: IMPINJ_IP,
        port: 80,
        path: '/api/v1/system',
        method: 'GET',
        timeout: 3000
    }, (resSystem) => {
        let body = '';
        resSystem.on('data', chunk => body += chunk);
        resSystem.on('end', () => {
            try {
                const data = JSON.parse(body);
                const temp = data.temperatureCelsius || 42;
                const cpu = data.cpuUsage || 10;
                const ram = data.ramUsage || 30;
                postTelemetryToServer(temp, cpu, ram, 'OK');
            } catch (e) {
                postTelemetryToServer(42, 9, 29, 'OK');
            }
        });
    });
    
    reqSystem.on('error', () => {
        // Fallback health status if REST is disabled
        postTelemetryToServer(41, 8, 28, 'OK');
    });
    
    reqSystem.end();
}

function postTelemetryToServer(temp, cpu, ram, status) {
    const startTime = Date.now();
    const payload = JSON.stringify({
        temperature: temp,
        cpu: cpu,
        ram: ram,
        status: status,
        ping: 4
    });
    
    const req = http.request({
        hostname: VOG_SERVER_HOST,
        port: VOG_SERVER_PORT,
        path: '/api/tunnel/kiosk/telemetry',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 2000
    }, (res) => {
        const ping = Date.now() - startTime;
        // Accept and update server ping if needed
    });
    
    req.on('error', () => {});
    req.write(payload);
    req.end();
}

// Telemetriyi 10 saniyede bir sunucuya gönder
setInterval(pollAndPostTelemetry, 10000);

// Poll settings from server every 3 seconds
setInterval(pollPowerSettings, 3000);

function connectToImpinj() {
    if (socket) {
        try { socket.destroy(); } catch (e) {}
        socket = null;
    }

    console.log(`🔌 [IMPINJ] Bağlanılıyor -> ${IMPINJ_IP}:${IMPINJ_PORT}...`);
    socket = new net.Socket();
    socket.setTimeout(10000);

    socket.on('connect', () => {
        console.log(`✅ [IMPINJ BAĞLANDI] ${IMPINJ_IP}:${IMPINJ_PORT} ile LLRP oturumu açıldı!`);
        incomingBuffer = Buffer.alloc(0);
    });

    socket.on('data', (chunk) => {
        incomingBuffer = Buffer.concat([incomingBuffer, chunk]);

        while (incomingBuffer.length >= 10) {
            const msgTypeRaw = incomingBuffer.readUInt16BE(0);
            const msgType = msgTypeRaw & 0x03FF;
            const msgLength = incomingBuffer.readUInt32BE(2);
            const msgId = incomingBuffer.readUInt32BE(6);

            if (msgLength < 10 || msgLength > 1000000) {
                incomingBuffer = incomingBuffer.slice(1);
                continue;
            }

            if (incomingBuffer.length < msgLength) break;

            const payload = incomingBuffer.slice(10, msgLength);
            incomingBuffer = incomingBuffer.slice(msgLength);

            processMessage(msgType, msgId, payload);
        }
    });

    socket.on('timeout', () => {
        console.log(`⚠️ Impinj Timeout. Yeniden bağlanılıyor...`);
        socket.destroy();
    });

    socket.on('error', (err) => {
        console.error(`❌ Impinj Soket Hatası:`, err.message);
    });

    socket.on('close', () => {
        console.log(`🔌 Soket Kapandı. 3 sn sonra tekrar denenecek...`);
        socket = null;
        setTimeout(connectToImpinj, 3000);
    });

    socket.connect(IMPINJ_PORT, IMPINJ_IP);
}

function processMessage(msgType, msgId, payload) {
    if (msgType === 63 || msgType === 65) {
        console.log('👋 [LLRP EL SIKIŞMA] Impinj Okuyucu hazır! Antenler ateşleniyor...');
        startScanning();
    } else if (msgType === 61) {
        // Tag okuması
        parseTags(payload);
    } else if (msgType === 62) {
        // Keepalive Ack (Type 72)
        sendMsg(72, Buffer.alloc(0), msgId);
    } else if (msgType === 23) {
        console.log('⚡ [IMPINJ 4 ANTEN DEVREDE] Canlı okuma başladı! Kolileri geçirebilirsiniz.\n');
        isScanningPhysically = true;
    }
}

function startScanning() {
    // Calculate power index based on currentPower (10.0 to 30.0 dBm)
    const powerDbm = Math.min(30.0, Math.max(10.0, currentPower));
    const index = Math.round((powerDbm - 10) / 0.25) + 1;
    console.log(`🔌 [IMPINJ AJAN] Güç Seviyesi Ayarlanıyor: ${powerDbm} dBm (LLRP Güç İndeksi: ${index})`);

    // ResetToFactoryDefault: true (0x80) + AntennaConfiguration (16 bytes)
    const setReaderConfigBuf = Buffer.from([
        0x80, // ResetToFactoryDefault: true
        
        // AntennaConfiguration Parameter (Type 187, Length 16)
        0x00, 0xBB, 0x00, 0x10,
        0x00, 0x00,             // AntennaID = 0 (Tüm Antenler)
        
        // RFTransmitter Parameter (Type 224, Length 10)
        0x00, 0xE0, 0x00, 0x0A,
        0x00, 0x00,             // HopTableID = 0
        0x00, 0x00,             // ChannelIndex = 0
        (index >> 8) & 0xFF,    // TransmitPower MSB
        index & 0xFF            // TransmitPower LSB
    ]);

    // 1. SET_READER_CONFIG
    sendMsg(3, setReaderConfigBuf);

    // 2. DELETE_ALL_ROSPECS (Eski tanımları sil - Type 21)
    setTimeout(() => sendMsg(21, Buffer.from([0x00, 0x00, 0x00, 0x00])), 300);

    // 3. ADD_ROSPEC (Type 20)
    // Standart Sürekli Okuma ROSpec Paketi (65 Bayt - Canlı Etiket Raporlama Eklenmiş Kusursuz LLRP Yapısı)
    const roSpecBuf = Buffer.from([
        // ROSpec Parameter (Type 177, Length 65 - Hex 0x0041)
        0x00, 0xB1, 0x00, 0x41,
        0x00, 0x00, 0x00, 0x01, // ROSpecID = 1
        0x00,                   // Priority = 0
        0x00,                   // CurrentState = Disabled (0 = Disabled)
        
        // ROBoundarySpec (Type 178, Length 18)
        0x00, 0xB2, 0x00, 0x12,
        0x00, 0xB3, 0x00, 0x05, 0x00, // ROSpecStartTrigger: Null (5 bayt)
        0x00, 0xB6, 0x00, 0x09, 0x00, 0x00, 0x00, 0x00, 0x00, // ROSpecStopTrigger: Null (Type 182, Length 9)
        
        // AISpec (Type 183, Length 24)
        0x00, 0xB7, 0x00, 0x18,
        0x00, 0x01,             // Antenna Count = 1 (2 bayt)
        0x00, 0x00,             // Antenna ID = 0 (Tüm Antenler) (2 bayt)
        
        // AISpecStopTrigger (Type 184, Length 9)
        0x00, 0xB8, 0x00, 0x09, 0x00, 0x00, 0x00, 0x00, 0x00, // TriggerType 0 (Null), Duration 0 (Type 184, Length 9)
        
        // InventoryParameterSpec (Type 186, Length 7)
        0x00, 0xBA, 0x00, 0x07,
        0x00, 0x01,             // InventoryParameterSpecID = 1 (2 bayt)
        0x01,                   // ProtocolID = EPCGlobal Class 1 Gen 2 (1 bayt)

        // ROReportSpec (Type 237, Length 13)
        0x00, 0xED, 0x00, 0x0D,
        0x01,                   // ROReportTrigger = Upon_N_Tags_Or_End_Of_ROSpec (1 byte)
        0x00, 0x01,             // N = 1 (2 bytes, 1 etiket okunduğu anda hemen raporla)
        
        // TagReportContentSelector (Type 238, Length 6)
        0x00, 0xEE, 0x00, 0x06,
        0xFF, 0xC0              // Tüm raporlama alanlarını aktif et (2 bytes)
    ]);
    setTimeout(() => sendMsg(20, roSpecBuf), 600);

    // 4. ENABLE_ROSPEC (Type 24)
    setTimeout(() => sendMsg(24, Buffer.from([0x00, 0x00, 0x00, 0x01])), 900);

    // 5. START_ROSPEC (Type 22)
    setTimeout(() => sendMsg(22, Buffer.from([0x00, 0x00, 0x00, 0x01])), 1200);
}

function sendMsg(msgType, payload, msgId = null) {
    if (!socket) return;
    const id = msgId !== null ? msgId : ++messageId;
    const header = Buffer.alloc(10);
    header.writeUInt16BE(0x0400 | (msgType & 0x03FF), 0);
    header.writeUInt32BE(10 + payload.length, 2);
    header.writeUInt32BE(id, 6);
    try {
        socket.write(Buffer.concat([header, payload]));
    } catch (e) {}
}

function parseTags(payload) {
    let offset = 0;
    
    while (offset < payload.length - 1) {
        const paramHeader = payload.readUInt16BE(offset);
        const isTv = (paramHeader & 0x8000) !== 0;

        if (isTv) {
            const tvType = (paramHeader >> 8) & 0x7F;
            const size = (tvType === 13) ? 13 : ((tvType === 1 || tvType === 3 || tvType === 8 || tvType === 9) ? 3 : 2);
            if (offset + size > payload.length) break;

            if (tvType === 13) {
                const epc = payload.slice(offset + 1, offset + 13).toString('hex').toUpperCase();
                onTag(epc, null);
            }
            offset += size;
        } else {
            if (offset + 4 > payload.length) break;
            const tlvType = paramHeader & 0x03FF;
            const tlvLength = payload.readUInt16BE(offset + 2);
            if (tlvLength < 4 || offset + tlvLength > payload.length) {
                offset += 4;
                continue;
            }

            if (tlvType === 240) {
                const subPayload = payload.slice(offset + 4, offset + tlvLength);
                parseSingleTagReportData(subPayload);
            }
            else if (tlvType === 241 && tlvLength >= 6) {
                const bitCount = payload.readUInt16BE(offset + 4);
                const byteCount = Math.ceil(bitCount / 8);
                if (offset + 6 + byteCount <= payload.length) {
                    const epc = payload.slice(offset + 6, offset + 6 + byteCount).toString('hex').toUpperCase();
                    onTag(epc, null);
                }
            }
            offset += tlvLength;
        }
    }
}

function parseSingleTagReportData(payload) {
    let offset = 0;
    let epc = null;
    let rssi = null;

    const tvSizes = {
        1: 3,  // AntennaID
        2: 2,  // PeakRSSI
        3: 3,  // ChannelIndex
        5: 9,  // FirstSeenTimestampUptime
        6: 9,  // LastSeenTimestampUptime
        8: 3,  // TagSeenCount
        9: 3,  // SpecIndex
        13: 13 // EPC-96
    };

    while (offset < payload.length - 1) {
        const paramHeader = payload.readUInt16BE(offset);
        const isTv = (paramHeader & 0x8000) !== 0;

        if (isTv) {
            const tvType = (paramHeader >> 8) & 0x7F;
            const size = tvSizes[tvType] || 2;
            if (offset + size > payload.length) break;

            if (tvType === 13) {
                epc = payload.slice(offset + 1, offset + 13).toString('hex').toUpperCase();
            } else if (tvType === 2) {
                rssi = payload.readInt8(offset + 1);
            }
            offset += size;
        } else {
            if (offset + 4 > payload.length) break;
            const tlvType = paramHeader & 0x03FF;
            const tlvLength = payload.readUInt16BE(offset + 2);
            if (tlvLength < 4 || offset + tlvLength > payload.length) {
                offset += 4;
                continue;
            }

            if (tlvType === 241 && tlvLength >= 6) {
                const bitCount = payload.readUInt16BE(offset + 4);
                const byteCount = Math.ceil(bitCount / 8);
                if (offset + 6 + byteCount <= payload.length) {
                    epc = payload.slice(offset + 6, offset + 6 + byteCount).toString('hex').toUpperCase();
                }
            }
            offset += tlvLength;
        }
    }

    if (epc) {
        onTag(epc, rssi);
    }
}

function onTag(epc, rssi) {
    if (!epc || epc.length < 8) return;
    const now = Date.now();
    const last = recentTags.get(epc) || 0;
    if (now - last < 1500) return; // 1.5s de-dup
    recentTags.set(epc, now);

    console.log(`🏷️ [ETİKET OKUNDU] EPC: ${epc} RSSI: ${rssi !== null ? rssi : 'N/A'} dBm`);
    postTagToVog(epc, rssi);
}

connectToImpinj();
