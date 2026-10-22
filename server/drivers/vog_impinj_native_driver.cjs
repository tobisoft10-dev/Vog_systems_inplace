/**
 * ============================================================================
 * 🚀 VOG NATIVE IMPINJ RFID TUNNEL DRIVER (100% YERLİ & BAĞIMSIZ EPCGLOBAL LLRP)
 * ============================================================================
 * Hiçbir üçüncü parti yazılıma (Takipsan, U-Shops vb.) ihtiyaç duymadan;
 * Tüneldeki fiziksel Impinj okuyucuya (192.168.0.13:5084) doğrudan bağlanır,
 * 4 anteni maksimum güçle devreye alır ve okunan etiketleri milisaniyede VOG Kiosk'a aktarır.
 */

const net = require('net');
const http = require('http');

class VogImpinjNativeDriver {
    constructor(options = {}) {
        this.readerIp = options.readerIp || process.env.IMPINJ_IP || '192.168.0.13';
        this.readerPort = options.readerPort || parseInt(process.env.IMPINJ_LLRP_PORT) || 5084;
        this.backendUrl = options.backendUrl || process.env.VOG_BACKEND_URL || 'http://127.0.0.1:3001';
        this.reconnectInterval = options.reconnectInterval || 4000;
        this.txPower = options.txPower || 30.0; // 30 dBm Maksimum Okuma Gücü
        this.rssiThreshold = options.rssiThreshold || -80; // Sinyal gücü filtresi (-80 dBm varsayılan)
        
        this.socket = null;
        this.isConnected = false;
        this.isScanning = false;
        this.messageId = 1;
        this.incomingBuffer = Buffer.alloc(0);
        this.recentTags = new Map(); // De-duplication map (EPC -> timestamp)
        this.deDupWindowMs = 1200; // 1.2 saniye tekilleştirme penceresi
        
        this.onTagCallback = options.onTag || null;
    }

    /**
     * Sürücüyü Başlatır ve Okuyucuya Doğrudan TCP/LLRP Soketi Açar
     */
    start() {
        console.log('\n===============================================================');
        console.log('🚀 [VOG YERLİ IMPINJ MOTORU] Başlatılıyor...');
        console.log(`📡 Hedef Okuyucu: ${this.readerIp}:${this.readerPort}`);
        console.log(`🏢 VOG Backend API: ${this.backendUrl}`);
        console.log('===============================================================\n');

        this.connect();
        
        // Periyodik hafıza temizliği
        setInterval(() => this.cleanRecentTags(), 5000);
    }

    connect() {
        if (this.readerPort === 0 || process.env.IMPINJ_LLRP_ENABLED === 'false') {
            console.log('ℹ️ [IMPINJ LLRP] Doğrudan LLRP soket istemcisi devre dışı (Tünel PC Webhook / 7070 Köprü modu aktif).');
            return;
        }

        if (this.socket) {
            try { this.socket.destroy(); } catch (e) {}
            this.socket = null;
        }

        console.log(`🔌 [IMPINJ SOKET] Bağlantı açılıyor -> ${this.readerIp}:${this.readerPort}...`);
        this.socket = new net.Socket();
        this.socket.setTimeout(45000);

        this.socket.on('connect', () => {
            console.log(`✅ [IMPINJ BAĞLANDI] ${this.readerIp}:${this.readerPort} ile TCP/LLRP el sıkışması başladı.`);
            this.isConnected = true;
            this.incomingBuffer = Buffer.alloc(0);
        });

        this.socket.on('data', (chunk) => {
            this.handleIncomingData(chunk);
        });

        this.socket.on('timeout', () => {
            console.log(`⚠️ [IMPINJ SOKET TIMEOUT] ${this.readerIp}:${this.readerPort} yanıt vermedi. Yeniden bağlanılıyor...`);
            this.socket.destroy();
        });

        this.socket.on('error', (err) => {
            console.error(`❌ [IMPINJ SOKET HATASI]:`, err.message);
        });

        this.socket.on('close', () => {
            console.log(`🔌 [IMPINJ SOKET KAPANDI] ${this.reconnectInterval / 1000} sn sonra otomatik tekrar bağlanılacak...`);
            this.isConnected = false;
            this.isScanning = false;
            this.socket = null;
            setTimeout(() => this.connect(), this.reconnectInterval);
        });

        this.socket.connect(this.readerPort, this.readerIp);
    }

    /**
     * Gelen LLRP İkili (Binary) Paketlerini Çözümler
     */
    handleIncomingData(chunk) {
        this.incomingBuffer = Buffer.concat([this.incomingBuffer, chunk]);

        while (this.incomingBuffer.length >= 10) {
            // LLRP Başlık: 16-bit Type, 32-bit Length, 32-bit MessageID
            const msgTypeRaw = this.incomingBuffer.readUInt16BE(0);
            const msgType = msgTypeRaw & 0x03FF; // Alt 10 bit mesaj tipi
            const msgLength = this.incomingBuffer.readUInt32BE(2);
            const msgId = this.incomingBuffer.readUInt32BE(6);

            if (msgLength < 10 || msgLength > 1000000) {
                // Hatalı paket, 1 bayt kaydır
                this.incomingBuffer = this.incomingBuffer.slice(1);
                continue;
            }

            if (this.incomingBuffer.length < msgLength) {
                // Paketin tamamı henüz gelmedi, bekle
                break;
            }

            const msgPayload = this.incomingBuffer.slice(10, msgLength);
            this.incomingBuffer = this.incomingBuffer.slice(msgLength);

            this.processLlrpMessage(msgType, msgId, msgPayload);
        }
    }

    /**
     * LLRP Mesaj Tipine Göre İşlem Yapar
     */
    processLlrpMessage(msgType, msgId, payload) {
        // MsgType 63: READER_EVENT_NOTIFICATION (İlk El Sıkışma)
        if (msgType === 63 || msgType === 65) {
            console.log('👋 [LLRP EL SIKIŞMA] Impinj Reader hazır bildirim gönderdi.');
            // Okuyucuyu Yapılandır ve Taramayı Başlat
            this.configureAndStartReader();
            return;
        }

        // MsgType 61: RO_ACCESS_REPORT (Etiket Okuma Raporu!)
        if (msgType === 61) {
            this.parseTagReport(payload);
            return;
        }

        // MsgType 62: KEEPALIVE
        if (msgType === 62) {
            this.sendKeepaliveAck(msgId);
            return;
        }

        // MsgType 13 / 31 / 30 / 32 / 34 yanıtları
        if (msgType === 13) {
            console.log('✅ [LLRP] SET_READER_CONFIG_RESPONSE Payload Hex:', payload.toString('hex'));
        } else if (msgType === 31) {
            console.log('✅ [LLRP] DELETE_ROSPEC_RESPONSE Payload Hex:', payload.toString('hex'));
        } else if (msgType === 30) {
            console.log('✅ [LLRP] ADD_ROSPEC_RESPONSE Payload Hex:', payload.toString('hex'));
        } else if (msgType === 34) {
            console.log('✅ [LLRP] ENABLE_ROSPEC_RESPONSE Payload Hex:', payload.toString('hex'));
        } else if (msgType === 32) {
            console.log('⚡ [LLRP] START_ROSPEC_RESPONSE Payload Hex:', payload.toString('hex'));
            this.isScanning = true;
        } else if (msgType === 33) {
            console.log('⚡ [LLRP] STOP_ROSPEC_RESPONSE (Fiziksel tarama durduruldu)');
            this.isScanning = false;
        } else {
            console.log(`🔍 [LLRP ALINDI] Bilinmeyen Mesaj Tipi: ${msgType} (Hex: 0x${msgType.toString(16)}), Uzunluk: ${payload.length + 10}, Hex:`, payload.toString('hex').substring(0, 100));
        }
    }

    /**
     * Impinj 4 Anteni Yapılandırır ve Taramayı Başlatır
     */
    configureAndStartReader() {
        console.log('⚙️ [IMPINJ KONFİGÜRASYON] Eski tanımlar temizleniyor ve 4 Anten devreye alınıyor (TxPower: 30 dBm, DualTarget)...');
        
        // 1. SET_READER_CONFIG (ResetToFactoryDefault: true -> 30 dBm Max Power, All Antennas Active - Type 3)
        this.sendSetReaderConfig();

        // 2. DELETE_ROSPEC (Eski tanımları temizle - Type 21)
        setTimeout(() => this.sendDeleteRoSpec(), 300);

        // 3. ADD_ROSPEC (Okuma Spesifikasyonu Tanımla - Type 20)
        setTimeout(() => this.sendAddRoSpec(), 600);

        // 4. ENABLE_ROSPEC (Spesifikasyonu Aktifleştir - Type 24)
        setTimeout(() => this.sendEnableRoSpec(), 900);

        // 5. START_ROSPEC (Antenleri Ateşle - Type 22)
        setTimeout(() => this.sendStartRoSpec(), 1200);
    }

    sendSetReaderConfig() {
        // Calculate power index based on this.txPower (10.0 to 30.0 dBm)
        // Index 1 = 10.0 dBm, step 0.25 dBm
        const powerDbm = Math.min(30.0, Math.max(10.0, this.txPower));
        const index = Math.round((powerDbm - 10) / 0.25) + 1;

        console.log(`🔌 [IMPINJ KONFİGÜRASYON] 4 Anten Güç Seviyesi Ayarlanıyor: ${powerDbm} dBm (LLRP Güç İndeksi: ${index})`);

        const pwrMsb = (index >> 8) & 0xFF;
        const pwrLsb = index & 0xFF;

        const parts = [Buffer.from([0x80])]; // ResetToFactoryDefault: true
        
        // Hem genel (AntennaID 0) hem de fiziksel 4 anten portunu (1, 2, 3, 4) teker teker aç ve bağla
        for (const antId of [0, 1, 2, 3, 4]) {
            parts.push(Buffer.from([
                0x00, 0xBB, 0x00, 0x10, // AntennaConfiguration Parameter (Type 187, Length 16)
                0x00, antId,            // AntennaID
                0x00, 0xE0, 0x00, 0x0A, // RFTransmitter Parameter (Type 224, Length 10)
                0x00, 0x00,             // HopTableID = 0
                0x00, 0x00,             // ChannelIndex = 0
                pwrMsb, pwrLsb          // TransmitPower
            ]));
            if (antId >= 1) {
                // AntennaProperties Parameter (Type 181, Length 5) -> IsConnected = true (0x01)
                parts.push(Buffer.from([
                    0x00, 0xB5, 0x00, 0x05,
                    0x01,       // IsConnected = true
                    0x00, antId // AntennaID (1, 2, 3, 4)
                ]));
            }
        }
        const buf = Buffer.concat(parts);

        this.sendLlrpMessage(3, buf);
    }

    setPower(powerDbm) {
        this.txPower = Math.min(30.0, Math.max(10.0, parseFloat(powerDbm)));
        console.log(`📡 [IMPINJ DRIVER] Güç ayarı güncellendi: ${this.txPower} dBm. Okuyucu yeniden yapılandırılıyor...`);
        if (this.isConnected) {
            this.configureAndStartReader();
        }
    }

    setRssiThreshold(val) {
        this.rssiThreshold = Math.min(-30, Math.max(-90, parseInt(val)));
        console.log(`📡 [IMPINJ DRIVER] Sinyal Filtresi (RSSI Eşiği) güncellendi: ${this.rssiThreshold} dBm.`);
    }

    sendDeleteRoSpec() {
        const buf = Buffer.from([
            0x00, 0x00, 0x00, 0x00 // 0 = Tüm ROSpec tanımlarını sil
        ]);
        this.sendLlrpMessage(21, buf);
    }

    sendAddRoSpec() {
        // 4 Antenin Hepsi Açık Sürekli Okuma ROSpec Paketi (71 Bayt - Hex 0x0047)
        const roSpecBuf = Buffer.from([
            // ROSpec Parameter (Type 177, Length 71 - Hex 0x0047)
            0x00, 0xB1, 0x00, 0x47,
            0x00, 0x00, 0x00, 0x01, // ROSpecID = 1
            0x00,                   // Priority = 0
            0x00,                   // CurrentState = Disabled (0 = Disabled)
            
            // ROBoundarySpec (Type 178, Length 18)
            0x00, 0xB2, 0x00, 0x12,
            0x00, 0xB3, 0x00, 0x05, 0x00, // ROSpecStartTrigger: Null (5 bayt)
            0x00, 0xB6, 0x00, 0x09, 0x00, 0x00, 0x00, 0x00, 0x00, // ROSpecStopTrigger: Null (Type 182, Length 9)
            
            // AISpec (Type 183, Length 30 - Hex 0x001E)
            0x00, 0xB7, 0x00, 0x1E,
            0x00, 0x04,             // Antenna Count = 4 (TÜM 4 ANTENİ SIRAYLA ATESLE!)
            0x00, 0x01,             // Port 1 (Anten 1)
            0x00, 0x02,             // Port 2 (Anten 2)
            0x00, 0x03,             // Port 3 (Anten 3)
            0x00, 0x04,             // Port 4 (Anten 4)
            
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
            0xFF, 0xC0              // Tüm raporlama alanlarını aktif et (AntennaID, PeakRSSI vb.)
        ]);

        this.sendLlrpMessage(20, roSpecBuf);
    }

    sendEnableRoSpec() {
        const buf = Buffer.from([
            0x00, 0x00, 0x00, 0x01 // ROSpecID = 1
        ]);
        this.sendLlrpMessage(24, buf);
    }

    sendStartRoSpec() {
        const buf = Buffer.from([
            0x00, 0x00, 0x00, 0x01 // ROSpecID = 1
        ]);
        this.sendLlrpMessage(22, buf);
    }

    sendStopRoSpec() {
        const buf = Buffer.from([
            0x00, 0x00, 0x00, 0x01 // ROSpecID = 1
        ]);
        this.sendLlrpMessage(23, buf);
    }

    stopScanning() {
        if (this.isConnected && this.isScanning) {
            this.sendStopRoSpec();
            this.isScanning = false;
            console.log('📡 [IMPINJ DRIVER] Fiziksel tarama durduruldu (STOP_ROSPEC gönderildi).');
        }
    }

    /**
     * Impinj Donanım GPO Pinini (Işık Kulesi / Röle) Açar veya Kapatır (LLRP SET_READER_CONFIG)
     * @param {number} port - GPO Port Numarası (1: Kırmızı, 2: Yeşil, 3: Sarı, 4: Buzzer)
     * @param {boolean} state - true (HIGH / 1), false (LOW / 0)
     */
    setGpo(port, state) {
        if (!this.socket || !this.isConnected) return;
        const portNum = parseInt(port, 10) || 1;
        const val = state ? 1 : 0;
        
        // SET_READER_CONFIG (Type 3) -> ResetToFactory: false (0x00) + GPOWriteData Parameter (Type 221 / 0x00DD, Length 6)
        const gpoBuf = Buffer.from([
            0x00,                   // ResetToFactoryDefault: false
            0x00, 0xDD, 0x00, 0x06, // GPOWriteData Parameter (Type 221, Length 6)
            0x00, portNum,          // GPOPortNumber (1, 2, 3, 4)
            val                     // GPODataValue (0 veya 1)
        ]);

        console.log(`🚥 [IMPINJ GPO] Port #${portNum} durumu ayarlanıyor: ${state ? '⚡ HIGH (ON)' : '⭕ LOW (OFF)'}`);
        this.sendLlrpMessage(3, gpoBuf);
    }

    /**
     * Işık Kulesi ve Sesli İkaz (Buzzer) Durumunu Senkronize Eder
     * @param {Object} states - { red: boolean, green: boolean, yellow: boolean, buzzer: boolean }
     */
    setStackLight(states = {}) {
        if (typeof states.red !== 'undefined') this.setGpo(1, states.red);
        if (typeof states.green !== 'undefined') this.setGpo(2, states.green);
        if (typeof states.yellow !== 'undefined') this.setGpo(3, states.yellow);
        if (typeof states.buzzer !== 'undefined') this.setGpo(4, states.buzzer);
    }

    sendKeepaliveAck(msgId) {
        this.sendLlrpMessage(72, Buffer.alloc(0), msgId);
    }


    sendLlrpMessage(msgType, payload, msgId = null) {
        if (!this.socket || !this.isConnected) return;

        const id = msgId !== null ? msgId : ++this.messageId;
        const msgLen = 10 + payload.length;
        const header = Buffer.alloc(10);
        
        // 0x0400 | msgType
        header.writeUInt16BE(0x0400 | (msgType & 0x03FF), 0);
        header.writeUInt32BE(msgLen, 2);
        header.writeUInt32BE(id, 6);

        const packet = Buffer.concat([header, payload]);
        try {
            this.socket.write(packet);
        } catch (e) {
            console.error('LLRP Paket Gönderme Hatası:', e.message);
        }
    }

    /**
     * RO_ACCESS_REPORT İçindeki EPC Etiketlerini Ayrıştırır
     */
    parseTagReport(payload) {
        let offset = 0;
        
        while (offset < payload.length - 1) {
            const paramHeader = payload.readUInt16BE(offset);
            const isTv = (paramHeader & 0x8000) !== 0;

            if (isTv) {
                const tvType = (paramHeader >> 8) & 0x7F;
                const size = (tvType === 13) ? 13 : ((tvType === 1 || tvType === 3 || tvType === 8 || tvType === 9) ? 3 : 2);
                if (offset + size > payload.length) break;

                // TV Type 13 = EPC-96 Parameter (96-bit EPC)
                if (tvType === 13) {
                    const epcBytes = payload.slice(offset + 1, offset + 13);
                    const epc = epcBytes.toString('hex').toUpperCase();
                    this.onTagScanned(epc, null);
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

                // TLV Type 240 = TagReportData (Parse nested parameters to extract EPC + RSSI)
                if (tlvType === 240) {
                    const subPayload = payload.slice(offset + 4, offset + tlvLength);
                    this.parseSingleTagReportData(subPayload);
                }
                // TLV Type 241 = EPCData Parameter (fallback if outside TagReportData)
                else if (tlvType === 241 && tlvLength >= 6) {
                    const bitCount = payload.readUInt16BE(offset + 4);
                    const byteCount = Math.ceil(bitCount / 8);
                    if (offset + 6 + byteCount <= payload.length) {
                        const epcBytes = payload.slice(offset + 6, offset + 6 + byteCount);
                        const epc = epcBytes.toString('hex').toUpperCase();
                        this.onTagScanned(epc, null);
                    }
                }
                offset += tlvLength;
            }
        }
    }

    /**
     * Tek bir TagReportData (Tip 240) altındaki parametreleri çözümler ve EPC + RSSI eşleştirir
     */
    parseSingleTagReportData(payload) {
        let offset = 0;
        let epc = null;
        let rssi = null;
        let antenna = 1;

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

                if (tvType === 13) { // EPC-96
                    const epcBytes = payload.slice(offset + 1, offset + 13);
                    epc = epcBytes.toString('hex').toUpperCase();
                } else if (tvType === 2) { // PeakRSSI (signed 8-bit dBm)
                    rssi = payload.readInt8(offset + 1);
                } else if (tvType === 1) { // AntennaID
                    antenna = payload.readUInt16BE(offset + 1);
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

                // TLV Type 241 = EPCData
                if (tlvType === 241 && tlvLength >= 6) {
                    const bitCount = payload.readUInt16BE(offset + 4);
                    const byteCount = Math.ceil(bitCount / 8);
                    if (offset + 6 + byteCount <= payload.length) {
                        const epcBytes = payload.slice(offset + 6, offset + 6 + byteCount);
                        epc = epcBytes.toString('hex').toUpperCase();
                    }
                }
                offset += tlvLength;
            }
        }

        if (epc) {
            this.onTagScanned(epc, rssi, antenna || 1);
        }
    }

    /**
     * Okunan Etiketi İşler ve VOG Kiosk'a Basar
     */
    onTagScanned(epc, rssi, antenna = 1) {
        if (!epc || epc.length < 8) return;

        // Yazılımsal Sinyal Filtresi (RSSI Eşiği) Uygula
        if (rssi !== null && this.rssiThreshold !== undefined) {
            if (rssi < this.rssiThreshold) {
                // Sinyal eşik altında kaldıysa sessizce veya loglayarak iptal et
                return;
            }
        }

        const now = Date.now();
        const lastSeen = this.recentTags.get(epc) || 0;
        
        // De-duplication kontrolü
        if (now - lastSeen < this.deDupWindowMs) {
            return; // Çok yeni okundu, mükerrer sayma
        }

        this.recentTags.set(epc, now);
        console.log(`🏷️ [VOG NATIVE IMPINJ OKUMA] EPC: ${epc} (${new Date().toLocaleTimeString('tr-TR')}) RSSI: ${rssi !== null ? rssi : 'N/A'} dBm [ANTEN #${antenna}]`);

        if (this.onTagCallback) {
            this.onTagCallback(epc, rssi, antenna);
        }

        // VOG Backend API'ye Anında Gönder (RSSI ve Anten bilgisi ile birlikte)
        this.dispatchTagToBackend(epc, rssi, antenna);
    }

    setPower(power) {
        this.txPower = parseFloat(power) || 20.0;
        console.log(`📡 [VOG IMPINJ NATIVE] Güç ${this.txPower} dBm olarak güncellendi.`);
    }

    setRssiThreshold(rssi) {
        this.rssiThreshold = parseInt(rssi, 10) || -50;
        console.log(`📡 [VOG IMPINJ NATIVE] RSSI eşiği ${this.rssiThreshold} dBm olarak güncellendi.`);
    }

    dispatchTagToBackend(epc, rssi, antenna = 1) {
        const postData = JSON.stringify({
            rfid_tag: epc,
            rssi: rssi !== null && rssi !== undefined ? rssi : null,
            antenna: antenna,
            reader_id: 'VOG_NATIVE_IMPINJ_5084'
        });

        try {
            const url = new URL(`${this.backendUrl}/api/tunnel/kiosk/scan-tag`);
            const req = http.request(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: 1500
            }, (res) => {
                if (res.statusCode === 200) {
                    console.log(`✨ [KIOSK SAYAÇ ARTTI] EPC: ${epc} VOG Kiosk'a işlendi!`);
                }
            });

            req.on('error', (e) => {
                // Backend meşgulse hata yut
            });

            req.write(postData);
            req.end();
        } catch (e) {}
    }

    cleanRecentTags() {
        const now = Date.now();
        for (const [epc, time] of this.recentTags.entries()) {
            if (now - time > 10000) {
                this.recentTags.delete(epc);
            }
        }
    }
}

// Komut Satırından Doğrudan Çalıştırıldığında
if (require.main === module) {
    const driver = new VogImpinjNativeDriver();
    driver.start();
}

module.exports = VogImpinjNativeDriver;
