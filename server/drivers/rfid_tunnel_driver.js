/**
 * VOG Tekstil Premium - Native RFID Tunnel Hardware Driver
 * 
 * SICK RFU6xx, Impinj Speedway, Zebra FX9600 vb. sabit RFID okuyucuları
 * ile doğrudan TCP/IP Socket veya REST veri akışı üzerinden haberleşir.
 * Tag tekilleştirme (de-duplication), RSSI filtreleme ve canlı oturum yönetimi sağlar.
 */

const net = require('net');
const EventEmitter = require('events');

class RFIDTunnelDriver extends EventEmitter {
    constructor(options = {}) {
        super();
        this.socketPort = options.socketPort || 2112; // Standart SICK / Raw RFID dinleme portu
        this.server = null;
        this.clients = new Set();
        
        // Aktif Kiosk Oturumu Durumu
        this.activeSession = {
            status: 'IDLE', // 'IDLE', 'SCANNING', 'PAUSED', 'COMPLETED', 'ALARM'
            session_type: 'ORDER', // 'ORDER' | 'PERSONNEL'
            personnel_id: null,
            service_center: null,
            department: null,
            box_barcode: null,
            bundle_items: [],
            discrepancies: {
                foreign_items: [],
                extra_items: [],
                missing_items: []
            },
            is_alarm: false,
            alarm_info: null,
            auto_next_box: true,
            order_id: null,
            order_number: null,
            brand: null,
            product_name: null,
            sub_customer_name: null,
            staff_name: null,
            target_quantity: 0,
            scanned_quantity: 0,
            box_no: 1,
            total_boxes: 1,
            started_at: null,
            last_scan_at: null,
            tags: new Map(), // epc -> { epc, barcode, sku, size, timestamp, count }
            items_breakdown: {}, // size -> count
            errors: []
        };

        // Tag de-duplication cache (son 1.5 sn içindeki tekrarları filtrele)
        this.tagCooldown = new Map();
        this.cooldownMs = options.cooldownMs || 1500;

        // 4 Tünel Anteni Canlı İzleme ve Telemetri Durumu
        this.antennaStats = {
            1: { port: 1, name: 'Anten 1 (Üst Sol)', count: 0, last_seen: null, active: true },
            2: { port: 2, name: 'Anten 2 (Üst Sağ)', count: 0, last_seen: null, active: true },
            3: { port: 3, name: 'Anten 3 (Alt Sol)', count: 0, last_seen: null, active: true },
            4: { port: 4, name: 'Anten 4 (Alt Sağ)', count: 0, last_seen: null, active: true }
        };

        // Database Pool
        this.pool = options.pool || null;

        // ⏱️ Tünel Çıkışı Otomatik Koli Basım Ayarları ve Zamanlayıcısı (Debounce Passage Tracker)
        this.autoComplete = options.autoComplete !== undefined ? !!options.autoComplete : false;
        this.autoPrintOnExit = options.autoPrintOnExit !== undefined ? options.autoPrintOnExit : true;
        this.exitDebounceMs = options.exitDebounceMs || 2000; // 2.0 sn sessizlik = tünelden çıktı
        this.minBoxItems = options.minBoxItems !== undefined ? options.minBoxItems : 1;
        this.passageDebounceTimer = null;
    }

    setAutoComplete(isAuto) {
        this.autoComplete = !!isAuto;
        console.log(`🏷️ [RFID DRIVER] Otomatik Koli Etiketi Modu Güncellendi: ${this.autoComplete ? '⚡ OTOMATİK' : '✋ MANUEL'}`);
    }

    setExitAutoPrintOptions(opts = {}) {
        if (opts.autoPrintOnExit !== undefined) this.autoPrintOnExit = !!opts.autoPrintOnExit;
        if (opts.exitDebounceMs !== undefined) this.exitDebounceMs = Math.max(500, parseInt(opts.exitDebounceMs, 10));
        if (opts.minBoxItems !== undefined) this.minBoxItems = Math.max(1, parseInt(opts.minBoxItems, 10));
        console.log(`🖨️ [RFID DRIVER] Tünel Çıkışı Otomatik Basım Ayarları: autoPrint=${this.autoPrintOnExit}, debounce=${this.exitDebounceMs}ms, minItems=${this.minBoxItems}`);
    }

    clearPassageTimer() {
        if (this.passageDebounceTimer) {
            clearTimeout(this.passageDebounceTimer);
            this.passageDebounceTimer = null;
        }
    }

    /**
     * 🚨 Alarm Tetikler ve Tünel Akışını Durdurur
     */
    triggerAlarm(type, message, details = {}) {
        this.clearPassageTimer();

        if (!this.activeSession) return;

        this.activeSession.status = 'ALARM';
        this.activeSession.is_alarm = true;
        this.activeSession.alarm_info = {
            type: type || 'GENERAL_ALARM',
            message: message || 'Koli içeriğinde uyumsuzluk algılandı!',
            timestamp: new Date().toISOString(),
            details: details
        };
        this.activeSession.is_completing = false;

        console.warn(`🚨 [TUNNEL DRIVER ALARM] [${type}]: ${message}`);

        const summary = this.getSessionSummary();
        this.emit('alarm_triggered', {
            type: type,
            message: message,
            discrepancies: summary.discrepancies,
            session: summary
        });
        this.emit('session_update', {
            type: 'ALARM',
            message: message,
            session: summary
        });
    }

    /**
     * 🔄 Alarmı Sıfırlar ve İsteğe Bağlı Olarak Taramayı Yeniden Başlatır
     */
    resetAlarm(resumeScanning = true) {
        if (!this.activeSession) return;

        this.activeSession.is_alarm = false;
        this.activeSession.alarm_info = null;
        if (!this.activeSession.discrepancies) {
            this.activeSession.discrepancies = { foreign_items: [], extra_items: [], missing_items: [] };
        } else {
            this.activeSession.discrepancies.missing_items = [];
        }

        if (resumeScanning) {
            this.activeSession.status = 'SCANNING';
        }

        console.log(`🔄 [TUNNEL DRIVER ALARM RESET] Alarm sıfırlandı. Durum: ${this.activeSession.status}`);

        const summary = this.getSessionSummary();
        this.emit('session_update', {
            type: 'ALARM_RESET',
            session: summary
        });
        return summary;
    }

    /**
     * 🗑️ Mevcut Kolinin Okunan Etiketlerini Sıfırlar (Kutuyu Düzeltip Yeniden Geçirmek İçin)
     */
    clearCurrentBoxScans() {
        if (!this.activeSession) return;

        this.clearPassageTimer();
        this.tagCooldown.clear();
        this.activeSession.tags.clear();
        this.activeSession.foreign_tags = [];
        this.activeSession.items_breakdown = {};
        this.activeSession.scanned_quantity = 0;
        this.activeSession.discrepancies = {
            foreign_items: [],
            extra_items: [],
            missing_items: []
        };
        this.activeSession.is_alarm = false;
        this.activeSession.alarm_info = null;
        this.activeSession.is_completing = false;
        this.activeSession.is_auto_completed = false;
        this.activeSession.status = 'SCANNING';

        if (Array.isArray(this.activeSession.bundle_items)) {
            this.activeSession.bundle_items.forEach(it => {
                it.is_scanned = false;
                delete it.scanned_epc;
                delete it.scanned_at;
            });
        }

        console.log(`🗑️ [TUNNEL DRIVER BOX CLEARED] Koli #${this.activeSession.box_no || 1} okumaları sıfırlandı. Yeniden taramaya hazır.`);

        const summary = this.getSessionSummary();
        this.emit('session_update', {
            type: 'BOX_SCANS_CLEARED',
            session: summary
        });
        return summary;
    }

    resetPassageDebounceTimer() {
        this.clearPassageTimer();

        // Eğer alarm aktifse veya tünel çıkış takibi kapalıysa zamanlayıcı kurma!
        if (!this.autoPrintOnExit || !this.activeSession || this.activeSession.status !== 'SCANNING' || this.activeSession.is_alarm) {
            return;
        }

        // 🚨 KURAL: Henüz bu kolide hiç ürün okunmadıysa (scannedQty < minBoxItems), çıkış zamanlayıcısı kurma!
        if ((this.activeSession.scanned_quantity || 0) < this.minBoxItems) {
            return;
        }

        this.passageDebounceTimer = setTimeout(() => {
            this.handlePassageExit();
        }, this.exitDebounceMs);
    }

    handlePassageExit() {
        this.clearPassageTimer();

        if (!this.activeSession || this.activeSession.status !== 'SCANNING') {
            return;
        }

        if (this.activeSession.is_completing || this.activeSession.is_auto_completed) {
            return;
        }

        // 🚨 Alarm aktifse işlem yapma (akış zaten durduruldu)
        if (this.activeSession.is_alarm) {
            console.warn(`⚠️ [PASSAGE EXIT] Alarm aktif durumda, koli çıkış işlemi durduruldu.`);
            return;
        }

        const scannedQty = this.activeSession.scanned_quantity || 0;
        const targetQty = this.activeSession.target_quantity || 0;

        // 🚨 KURAL 0: Boş Tünel / Koli Arası Geçiş Koruması
        if (scannedQty < this.minBoxItems) {
            return;
        }

        // 🚨 KURAL 1: Koli İçinde Olmaması Gereken (Yabancı) Ürün Varsa Alarm Ver ve Dur!
        if (this.activeSession.discrepancies?.foreign_items?.length > 0 || (this.activeSession.foreign_tags && this.activeSession.foreign_tags.length > 0)) {
            const foreignList = this.activeSession.discrepancies?.foreign_items || this.activeSession.foreign_tags;
            const msg = `🚨 Koli içinde olmaması gereken ${foreignList.length} adet yabancı/hatalı ürün tespit edildi! Akış durduruldu.`;
            this.triggerAlarm('FOREIGN_ITEM', msg);
            return;
        }

        // 🚨 KURAL 2: Beden Adetleri Fazla Varsa Alarm Ver ve Dur!
        if (this.activeSession.discrepancies?.extra_items?.length > 0) {
            const extraCount = this.activeSession.discrepancies.extra_items.length;
            const msg = `⚠️ Koli içinde ${extraCount} adet fazla/hatalı beden tespit edildi! Akış durduruldu.`;
            this.triggerAlarm('EXTRA_SIZE', msg);
            return;
        }

        // 🚨 KURAL 3: Beden Adetleri Eksik İse Alarm Ver ve Dur! (Detayları bilgi kutusuna ilet)
        const missingItems = Array.isArray(this.activeSession.bundle_items)
            ? this.activeSession.bundle_items.filter(item => !item.is_scanned)
            : [];
        const isIncomplete = (targetQty > 0 && scannedQty < targetQty) || missingItems.length > 0;

        if (isIncomplete) {
            this.activeSession.discrepancies.missing_items = missingItems.map(it => ({
                name: it.short_name || it.name,
                size: it.size || 'STD',
                part_no: it.part_no || it.sku,
                barcode: it.barcode,
                expected_qty: 1,
                reason: 'Koli İçinde Eksik Parça (Taranmadı)'
            }));

            const msg = `⚠️ Koli içinde eksik parça var (${scannedQty}/${targetQty} Adet - ${missingItems.length} parça eksik). Akış durduruldu.`;
            console.warn(`⚠️ [PASSAGE EXIT - EKSİK KOLİ] Koli #${this.activeSession.box_no} EKSİK: ${msg}`);
            this.triggerAlarm('MISSING_ITEMS', msg);
            return;
        }

        console.log(`🎯 [PASSAGE EXIT DETECTED] Koli #${this.activeSession.box_no} tünelden %100 TAM VE EKSİKSİZ çıktı! (${this.exitDebounceMs}ms sessizlik). Toplam Okunan Adet: ${scannedQty}/${targetQty}.`);
        
        this.activeSession.is_completing = true;

        const summary = this.getSessionSummary();
        this.emit('passage_exit', summary);
        this.emit('session_update', { type: 'PASSAGE_EXIT', session: summary });
    }

    getAntennaStatus() {
        return [
            { port: 1, name: 'Anten 1 (Üst Sol)', count: this.antennaStats[1].count, last_seen: this.antennaStats[1].last_seen, active: true },
            { port: 2, name: 'Anten 2 (Üst Sağ)', count: this.antennaStats[2].count, last_seen: this.antennaStats[2].last_seen, active: true },
            { port: 3, name: 'Anten 3 (Alt Sol)', count: this.antennaStats[3].count, last_seen: this.antennaStats[3].last_seen, active: true },
            { port: 4, name: 'Anten 4 (Alt Sağ)', count: this.antennaStats[4].count, last_seen: this.antennaStats[4].last_seen, active: true }
        ];
    }

    /**
     * TCP Socket Sunucusunu Başlatır (Donanım okuyucular buraya bağlanıp veri basabilir)
     */
    startSocketServer() {
        if (this.server) return;

        this.server = net.createServer((socket) => {
            const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
            console.log(`🔌 [RFID DRIVER] RFID Okuyucu Donanımı Bağlandı: ${clientAddress}`);
            this.clients.add(socket);

            let buffer = '';

            socket.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
                // Satır sonu veya özel SICK STX/ETX ayırıcıları
                const lines = buffer.split(/[\r\n\x03]+/);
                buffer = lines.pop(); // Tamamlanmamış parçayı buffer'da tut

                for (const line of lines) {
                    const cleanLine = line.replace(/[\x02\x03]/g, '').trim();
                    if (cleanLine) {
                        this.handleRawData(cleanLine, clientAddress);
                    }
                }
            });

            socket.on('close', () => {
                console.log(`🔌 [RFID DRIVER] RFID Okuyucu Bağlantısı Kesildi: ${clientAddress}`);
                this.clients.delete(socket);
            });

            socket.on('error', (err) => {
                console.error(`⚠️ [RFID DRIVER] Okuyucu Socket Hatası (${clientAddress}):`, err.message);
                this.clients.delete(socket);
            });
        });

        this.server.listen(this.socketPort, '0.0.0.0', () => {
            console.log(`🚀 [RFID DRIVER] VOG Native RFID Tünel TCP Socket Dinleyicisi Başlatıldı (Port: ${this.socketPort})`);
        });
    }

    /**
     * Uzak Tünel Makinesine (Örn: 192.168.1.79:7070) İstemci Olarak Bağlanır
     */
    connectToRemoteReader(ip = process.env.TUNNEL_READER_IP || '192.168.1.79', port = process.env.TUNNEL_READER_PORT || 7070) {
        if (this.remoteClient) return;

        console.log(`🔌 [RFID DRIVER] Uzak Tünel Makinesine Bağlanılıyor: ${ip}:${port}...`);
        const client = new net.Socket();
        this.remoteClient = client;

        client.connect(port, ip, () => {
            console.log(`✅ [RFID DRIVER] Uzak Tünel Makinesine Başarıyla Bağlanıldı: ${ip}:${port}`);
        });

        let buffer = '';
        client.on('data', (chunk) => {
            buffer += chunk.toString('utf8');
            const lines = buffer.split(/[\r\n\x03]+/);
            buffer = lines.pop();

            for (const line of lines) {
                const cleanLine = line.replace(/[\x02\x03]/g, '').trim();
                if (cleanLine) {
                    this.handleRawData(cleanLine, `REMOTE_${ip}:${port}`);
                }
            }
        });

        client.on('close', () => {
            console.log(`⚠️ [RFID DRIVER] Uzak Tünel Bağlantısı Kapandı (${ip}:${port}). 5 sn içinde tekrar denenecek...`);
            this.remoteClient = null;
            setTimeout(() => this.connectToRemoteReader(ip, port), 5000);
        });

        client.on('error', (err) => {
            console.warn(`⚠️ [RFID DRIVER] Uzak Tünel Soket Hatası (${ip}:${port}):`, err.message);
        });
    }

    /**
     * Donanımdan gelen raw string veriyi ayrıştırır (SICK SOPAS, Raw Hex veya JSON)
     */
    handleRawData(rawData, source = 'SOCKET') {
        try {
            // 1. JSON Formatı
            if (rawData.startsWith('{') && rawData.endsWith('}')) {
                const parsed = JSON.parse(rawData);
                if (parsed.tags && Array.isArray(parsed.tags)) {
                    parsed.tags.forEach(t => this.processTag(typeof t === 'string' ? t : t.epc || t.tag, source));
                    return;
                }
                if (parsed.epc || parsed.tag) {
                    this.processTag(parsed.epc || parsed.tag, source);
                    return;
                }
            }

            // 2. SICK / Raw ASCII Hex Formatı (Örn: "30395D198000000000000001;RSSI=-55")
            const parts = rawData.split(/[;,\s]+/);
            for (const part of parts) {
                // Standart 24 haneli Hex EPC tespiti
                const match = part.match(/[0-9A-Fa-f]{24}/);
                if (match) {
                    this.processTag(match[0].toUpperCase(), source);
                }
            }
        } catch (e) {
            console.error('⚠️ [RFID DRIVER] Raw veri ayrıştırma hatası:', e.message);
        }
    }

    setDatabasePool(pool) {
        this.pool = pool;
    }

    /**
     * 24 Haneli EPC'den barkod/veri çıkarma yardımcısı (GS1 SGTIN-96 ve Hex Desteği)
     */
    extractBarcodeFromEPC(epc) {
        if (!epc) return '';
        epc = String(epc).trim().toUpperCase();

        // 1. Standart GS1 SGTIN-96 Kod Çözümleme (0x30 ile başlayan 24 haneli hex EPC)
        if (epc.length === 24 && epc.startsWith('30')) {
            try {
                const buf = Buffer.from(epc, 'hex');
                let bitStr = '';
                for (let b of buf) bitStr += b.toString(2).padStart(8, '0');
                const partition = parseInt(bitStr.slice(11, 14), 2);
                const partTable = [
                    { m: 40, l: 12, n: 4, d: 1 },
                    { m: 37, l: 11, n: 7, d: 2 },
                    { m: 34, l: 10, n: 10, d: 3 },
                    { m: 30, l: 9, n: 14, d: 4 },
                    { m: 27, l: 8, n: 17, d: 5 },
                    { m: 24, l: 7, n: 20, d: 6 },
                    { m: 20, l: 6, n: 24, d: 7 }
                ];
                const p = partTable[partition];
                if (p) {
                    const companyPrefixBits = bitStr.slice(14, 14 + p.m);
                    const itemRefBits = bitStr.slice(14 + p.m, 14 + p.m + p.n);
                    const companyPrefix = parseInt(companyPrefixBits, 2).toString().padStart(p.l, '0');
                    const itemRef = parseInt(itemRefBits, 2).toString().padStart(p.d, '0');
                    const gtin14 = itemRef[0] + companyPrefix + itemRef.slice(1);
                    return gtin14.replace(/^0+/, '');
                }
            } catch (_) {}
        }

        // 2. Ham Hex / ASCII Gömülü Barkod Tespiti
        if (epc.length >= 16) {
            const potential = epc.substring(6, 16).replace(/^0+/, '');
            if (potential && potential.length >= 6) return potential;
        }

        return epc;
    }

    /**
     * Tekil bir RFID EPC etiketini işleme alır
     */
    async processTag(epc, source = 'API', metadata = {}) {
        if (!epc) return null;
        epc = epc.trim().toUpperCase();

        if (this.activeSession && (this.activeSession.status === 'ALARM' || this.activeSession.is_alarm)) {
            console.log(`🚫 [ALARM ACTIVE] Alarm aktifken yeni etiket (${epc}) işleme alınmaz. Akış durduruldu.`);
            return { epc, status: 'ALARM_ACTIVE', reason: 'Alarm aktif, akış durduruldu.' };
        }

        const now = Date.now();
        const antennaPort = parseInt(metadata.antenna || 1, 10) || 1;
        if (this.antennaStats && this.antennaStats[antennaPort]) {
            this.antennaStats[antennaPort].last_seen = new Date().toISOString();
        }

        const lastSeen = this.tagCooldown.get(epc);

        // Cooldown süresi dolmadıysa aynı etiketi tekrar işleme sokma
        if (lastSeen && (now - lastSeen) < this.cooldownMs) {
            return { epc, status: 'COOLDOWN_IGNORED' };
        }
        this.tagCooldown.set(epc, now);

        // Temizlik: Cooldown map şişmesin
        if (this.tagCooldown.size > 5000) {
            for (const [k, time] of this.tagCooldown.entries()) {
                if (now - time > 10000) this.tagCooldown.delete(k);
            }
        }

        // Aktif oturum yoksa veya tamamlanmış/duraklatılmışsa kesinlikle işleme alma
        if (this.activeSession.status !== 'SCANNING') {
            // 🚨 Alarm aktifse, ASLA auto-resume yapma ve yeni etiketleri kabul etme!
            if (this.activeSession.status === 'ALARM' || this.activeSession.is_alarm) {
                console.log(`🚫 [ALARM ACTIVE] Alarm aktifken yeni etiket (${epc}) işleme alınmaz. Akış durduruldu.`);
                return { epc, status: 'ALARM_ACTIVE', reason: 'Alarm aktif, akış durduruldu.' };
            }

            // 🚨 KESİNTİSİZ TARAMA KORUMASI (AUTO-RESUME):
            // Operatör oturumu manuel 'PAUSED' yapmadığı sürece, yeni bir etiketin tünele girmesi
            // konveyörden sıradaki kolinin geldiğini gösterir.
            if (this.activeSession.status !== 'PAUSED' && !this.activeSession.is_completing) {
                console.log(`⚡ [AUTO-RESUME SCANNING] Yeni etiket (${epc}) tünelde okundu! Durum '${this.activeSession.status}' -> 'SCANNING' yapıldı.`);
                this.activeSession.status = 'SCANNING';
                this.activeSession.is_completing = false;
                this.activeSession.is_auto_completed = false;
                this.clearPassageTimer();
                this.emit('session_update', {
                    type: 'BOX_STARTED',
                    session: this.getSessionSummary()
                });
            } else {
                const rawEvent = { epc, timestamp: new Date().toISOString(), source, inSession: false };
                this.emit('raw_tag', rawEvent);
                return rawEvent;
            }
        }

        // 🚨 MÜKERRER OKUMA KORUMASI 1: Zaten bu koli içinde okundu mu?
        if (this.activeSession.tags.has(epc)) {
            const tagRecord = this.activeSession.tags.get(epc);
            tagRecord.count += 1;
            tagRecord.last_seen = new Date().toISOString();
            if (this.autoPrintOnExit) {
                this.resetPassageDebounceTimer();
            }
            // Sayacı ASLA artırma, sadece log/telemetri döndür
            return { epc, status: 'DUPLICATE_IGNORED', count: tagRecord.count };
        }

        // 🚨 MÜKERRER OKUMA KORUMASI 2: Bu siparişin önceki bir kolisinde okundu mu?
        if (this.activeSession.order_scanned_epcs && this.activeSession.order_scanned_epcs.has(epc)) {
            console.log(`⚠️ [MÜKERRER KORUMASI] EPC: ${epc} bu siparişin (#${this.activeSession.order_number}) önceki kolisinde zaten okundu! Reddedildi.`);
            return { epc, status: 'ALREADY_SCANNED_IN_ORDER' };
        }

        // Hedef adet dolduysa veya koli çıkış basımı sürüyorsa yeni etiket alma
        if (this.activeSession.is_completing || this.activeSession.is_auto_completed || (!this.autoPrintOnExit && this.activeSession.scanned_quantity >= this.activeSession.target_quantity)) {
            return { epc, status: 'TARGET_ALREADY_REACHED' };
        }

        // 0. SGTIN-96 VOG EPC Format Kontrolü (303B50CC + OrderHex [6 hane] + SerialHex)
        let isVogSgtin = false;
        let vogEmbeddedOrderId = null;
        if (epc.startsWith('303B50CC') && epc.length >= 14) {
            const orderHex = epc.substring(8, 14);
            vogEmbeddedOrderId = parseInt(orderHex, 16);
            if (!isNaN(vogEmbeddedOrderId)) {
                isVogSgtin = true;
            }
        }

        // Veritabanından etiket bilgilerini getir (Önce rfid_tags, bulunamazsa SGTIN-96 orders)
        let dbTag = null;
        let orderInfo = null;

        if (this.pool) {
            try {
                const tagRes = await this.pool.query(
                    'SELECT product_name, sku, size, gender, barcode, brand, order_id FROM rfid_tags WHERE epc = $1 OR epc = substring($1 from 1 for 22) OR epc = rpad($1, 24, \'0\') LIMIT 1',
                    [epc]
                );
                if (tagRes.rows.length > 0) {
                    dbTag = tagRes.rows[0];
                }
            } catch (tagErr) {
                console.warn('⚠️ [RFID DRIVER] rfid_tags sorgu uyarısı:', tagErr.message);
            }

            if (isVogSgtin && vogEmbeddedOrderId) {
                try {
                    const oRes = await this.pool.query(
                        'SELECT id, order_number, brand, sku, barcode, ean13, product_name FROM orders WHERE order_number = $1 OR id::text = $2 LIMIT 1',
                        [vogEmbeddedOrderId, String(vogEmbeddedOrderId)]
                    );
                    if (oRes.rows.length > 0) {
                        orderInfo = oRes.rows[0];
                    } else {
                        // Eğer bu sipariş numarası silinmiş/atlanmışsa yakındaki siparişlerin markasını kontrol et
                        const nearRes = await this.pool.query(
                            'SELECT brand FROM orders WHERE order_number BETWEEN $1 AND $2 AND brand IS NOT NULL LIMIT 1',
                            [vogEmbeddedOrderId - 5, vogEmbeddedOrderId + 5]
                        );
                        if (nearRes.rows.length > 0 && nearRes.rows[0].brand) {
                            orderInfo = { brand: nearRes.rows[0].brand };
                        }
                    }
                } catch (_) {}
            }
        }

        const extractedBarcode = this.extractBarcodeFromEPC(epc);
        let tagBarcode = metadata.barcode || (dbTag ? dbTag.barcode : (orderInfo ? (orderInfo.barcode || orderInfo.ean13) : extractedBarcode));
        const tagCleanBarcode = tagBarcode ? String(tagBarcode).replace(/^0+/, '') : '';
        let tagSku = metadata.sku || (dbTag ? dbTag.sku : (orderInfo ? orderInfo.sku : ''));
        let tagBrand = (metadata.brand || (dbTag ? dbTag.brand : (orderInfo ? orderInfo.brand : '')) || '').trim().toUpperCase();

        // SKU Prefix'ten Marka Çıkarsama (Örn: PSKD100041 -> SKODA)
        if (!tagBrand && tagSku) {
            const skuUpper = tagSku.toUpperCase();
            if (skuUpper.startsWith('PSKD')) tagBrand = 'SKODA';
            else if (skuUpper.startsWith('PVWK')) tagBrand = 'VOLKSWAGEN';
            else if (skuUpper.startsWith('SCKY') || skuUpper.startsWith('SCANIA')) tagBrand = 'SCANIA';
            else if (skuUpper.startsWith('PAUD')) tagBrand = 'AUDI';
            else if (skuUpper.startsWith('PSET')) tagBrand = 'SEAT';
            else if (skuUpper.startsWith('PCUP')) tagBrand = 'CUPRA';
        }

        const brandPrefixes = {
            'SKODA': 'PSKD',
            'SCANIA': 'SCKY',
            'VOLKSWAGEN': 'PVWK',
            'AUDI': 'PAUD',
            'SEAT': 'PSET',
            'CUPRA': 'PCUP'
        };

        // 🛡️ SİPARİŞLE EŞLEŞME (WHITELIST) VE ÇEVRESEL PARAZİT KORUMASI
        let isMatched = false;
        let isForeign = false;
        let rejectReason = '';

        const activeOrderNum = String(this.activeSession.order_number || '');
        const activeOrderId = String(this.activeSession.order_id || '');
        const activeBrand = String(this.activeSession.brand || '').toUpperCase();
        const activeOrderInt = parseInt(activeOrderNum || activeOrderId, 10);
        const expectedPrefix = brandPrefixes[activeBrand] || '';

        // P. PERSONEL BAZLI KOLİ EŞLEŞTİRME VE BEDEN KONTROLÜ
        if (this.activeSession.session_type === 'PERSONNEL') {
            const activeStaffName = String(this.activeSession.staff_name || '').trim().toLowerCase();
            const tagStaffName = dbTag && dbTag.staff_name ? String(dbTag.staff_name).trim().toLowerCase() : '';

            // 1. Marka Kontrolü: Farklı marka ise anında yabancı ürün!
            if (tagBrand && activeBrand && tagBrand !== activeBrand) {
                isForeign = true;
                rejectReason = `Farklı Marka Etiketi (${tagBrand} != ${activeBrand})`;
            }

            // 2. Personel Paket İçeriğinde (bundle_items) Bu Ürün Var mı?
            let candidateBundleItems = [];
            if (!isForeign && Array.isArray(this.activeSession.bundle_items) && this.activeSession.bundle_items.length > 0) {
                const tagBarcodeClean = String(tagBarcode || '').replace(/^0+/, '');
                const tagSkuUpper = String(tagSku || '').toUpperCase().trim();
                const tagProdNameUpper = String(metadata.product_name || (dbTag ? dbTag.product_name : '') || (orderInfo ? orderInfo.product_name : '') || '').toUpperCase().trim();
                const getBaseSku = (s) => (s ? s.replace(/(XXS|XS|S|M|L|XL|[2-9]XL|XXXL|[0-9]{2})$/i, '').trim() : '');
                const tagBaseSku = getBaseSku(tagSkuUpper);

                candidateBundleItems = this.activeSession.bundle_items.filter(item => {
                    const itemBcClean = String(item.barcode || '').replace(/^0+/, '');
                    const itemPartUpper = String(item.part_no || item.sku || '').toUpperCase().trim();
                    const itemBaseSku = getBaseSku(itemPartUpper);
                    const itemNameUpper = String(item.name || item.short_name || '').toUpperCase().trim();

                    // Barkod eşleşmesi
                    if (tagBarcodeClean && itemBcClean && tagBarcodeClean === itemBcClean) return true;
                    // SKU / Parça No eşleşmesi
                    if (tagSkuUpper && itemPartUpper && (tagSkuUpper === itemPartUpper || tagSkuUpper.startsWith(itemPartUpper) || itemPartUpper.startsWith(tagSkuUpper))) return true;
                    if (tagBaseSku && itemBaseSku && tagBaseSku === itemBaseSku) return true;
                    // Kategori anahtar kelime eşleşmesi
                    const keywords = ['MONT', 'YELEK', 'GÖMLEK', 'GOMLEK', 'PANTOLON', 'POLAR', 'SWEAT', 'AYAKKABI', 'TSHIRT', 'TIŞÖRT', 'POLO'];
                    for (const kw of keywords) {
                        const tagHas = tagProdNameUpper.includes(kw) || tagSkuUpper.includes(kw);
                        const itemHas = itemNameUpper.includes(kw) || itemPartUpper.includes(kw);
                        if (tagHas && itemHas) return true;
                    }
                    return false;
                });
            }

            if (!isForeign) {
                if (candidateBundleItems.length > 0) {
                    isMatched = true;
                    isForeign = false;
                } else if (this.activeSession.allowed_epcs && this.activeSession.allowed_epcs.has(epc)) {
                    isMatched = true;
                    isForeign = false;
                } else if (tagStaffName && activeStaffName && tagStaffName === activeStaffName) {
                    isMatched = true;
                    isForeign = false;
                } else {
                    // Bu ürün bu personelin paketinde YOK (Olmaması gereken ürün)!
                    isForeign = true;
                    rejectReason = `Personel (${this.activeSession.staff_name || 'Personel'}) Paketinde Bulunmayan Ürün (${tagBarcode || tagSku || metadata.product_name || epc})`;
                }
            }
        }
        // O. SİPARİŞ BAZLI KOLİ EŞLEŞTİRME KONTROLÜ
        else if (isVogSgtin && activeOrderInt && vogEmbeddedOrderId) {
            if (vogEmbeddedOrderId === activeOrderInt) {
                isMatched = true;
                isForeign = false;
            } else {
                isForeign = true;
                isMatched = false;
                rejectReason = `Başka VOG Siparişine (#${vogEmbeddedOrderId}) Ait Etiket`;
            }
        }
        // A. Veritabanında rfid_tags kaydı varsa:
        else if (dbTag) {
            const tagOrder = String(dbTag.order_id || '');
            if (tagOrder && tagOrder !== activeOrderNum && tagOrder !== activeOrderId) {
                isForeign = true;
                rejectReason = `Baska Siparis Etiketi (#${tagOrder})`;
            } else if (dbTag.brand && activeBrand && dbTag.brand.trim().toUpperCase() !== activeBrand) {
                isForeign = true;
                rejectReason = `Baska Marka Etiketi (${dbTag.brand} != ${activeBrand})`;
            } else if (this.activeSession.allowed_epcs && this.activeSession.allowed_epcs.size > 0 && this.activeSession.allowed_epcs.has(epc)) {
                isMatched = true;
            } else if (this.activeSession.allowed_barcodes && this.activeSession.allowed_barcodes.size > 0) {
                if (this.activeSession.allowed_barcodes.has(tagBarcode) || this.activeSession.allowed_barcodes.has(tagCleanBarcode)) {
                    isMatched = true;
                } else {
                    isForeign = true;
                    rejectReason = `Siparis Barkod Listesinde Yok (${tagBarcode})`;
                }
            } else {
                isMatched = true;
            }
        }
        // B. Veritabanında rfid_tags kaydı yoksa (ham/harici etiket):
        else {
            if (this.activeSession.allowed_epcs && this.activeSession.allowed_epcs.size > 0 && this.activeSession.allowed_epcs.has(epc)) {
                isMatched = true;
            } else if (this.activeSession.allowed_barcodes && this.activeSession.allowed_barcodes.size > 0) {
                if (this.activeSession.allowed_barcodes.has(tagBarcode) || this.activeSession.allowed_barcodes.has(tagCleanBarcode)) {
                    isMatched = true;
                } else {
                    isForeign = true;
                    rejectReason = `Seçili Siparişle (#${activeOrderNum}) Uyuşmayan Barkod (${tagBarcode || epc})`;
                }
            } else if (this.activeSession.expected_epcs) {
                if (this.activeSession.expected_epcs.has(epc)) {
                    isMatched = true;
                } else {
                    isForeign = true;
                    rejectReason = `Beklenen Etiketler Arasında Yok`;
                }
            } else {
                isMatched = true;
            }
        }

        // 🚨 KURAL 1: KOLİ İÇİNDE OLMAMASI GEREKEN (YABANCI) ÜRÜN VARSA ALARM VER VE DUR!
        if (isForeign || !isMatched) {
            console.warn(`🚫 [YABANCI ETİKET ENGELLENDİ] EPC: ${epc} | Barkod: ${tagBarcode} | Neden: ${rejectReason} | Aktif: #${activeOrderNum} (${activeBrand}). Sayaca EKLENMEDİ.`);
            
            if (!this.activeSession.foreign_tags) this.activeSession.foreign_tags = [];
            if (!this.activeSession.foreign_tags.some(f => f.epc === epc)) {
                this.activeSession.foreign_tags.push({
                    epc,
                    barcode: tagBarcode,
                    sku: tagSku,
                    name: metadata.product_name || (dbTag ? dbTag.product_name : '') || tagSku || 'Yabancı Ürün',
                    reason: rejectReason,
                    is_foreign: true,
                    timestamp: new Date().toISOString()
                });
            }

            if (!this.activeSession.discrepancies) {
                this.activeSession.discrepancies = { foreign_items: [], extra_items: [], missing_items: [] };
            }
            if (!this.activeSession.discrepancies.foreign_items.some(f => f.epc === epc)) {
                this.activeSession.discrepancies.foreign_items.push({
                    epc,
                    barcode: tagBarcode,
                    sku: tagSku,
                    name: metadata.product_name || (dbTag ? dbTag.product_name : '') || tagSku || 'Yabancı Ürün',
                    reason: rejectReason,
                    timestamp: new Date().toISOString()
                });
            }

            // 🚨 ANINDA ALARM VER VE AKIŞI DURDUR!
            const alarmMsg = `🚨 Koli içinde olmaması gereken ürün tespit edildi: ${metadata.product_name || tagSku || tagBarcode || epc} (${rejectReason})! Akış durduruldu.`;
            this.triggerAlarm('FOREIGN_ITEM', alarmMsg, {
                epc,
                barcode: tagBarcode,
                sku: tagSku,
                reason: rejectReason
            });

            const summary = this.getSessionSummary();
            this.emit('foreign_tag_detected', { epc, barcode: tagBarcode, reason: rejectReason, session: summary });
            return { epc, status: 'FOREIGN_TAG_REJECTED', reason: rejectReason };
        }

        // 🚨 KURAL 2: PERSONEL MODUNDA BEDEN ADETLERİ VE FAZLALIK KONTROLÜ
        let bundleMatchedItem = null;
        if (this.activeSession.session_type === 'PERSONNEL' && Array.isArray(this.activeSession.bundle_items)) {
            const tagBarcodeClean = String(tagBarcode || '').replace(/^0+/, '');
            const tagSkuUpper = String(tagSku || '').toUpperCase().trim();
            const tagSizeUpper = String(metadata.size || (dbTag ? dbTag.size : '') || this.activeSession.clean_size || this.activeSession.size || 'STD').toUpperCase().trim();
            const tagProdNameUpper = String(metadata.product_name || (dbTag ? dbTag.product_name : '') || (orderInfo ? orderInfo.product_name : '') || '').toUpperCase().trim();
            const getBaseSku = (s) => (s ? s.replace(/(XXS|XS|S|M|L|XL|[2-9]XL|XXXL|[0-9]{2})$/i, '').trim() : '');
            const tagBaseSku = getBaseSku(tagSkuUpper);

            const candidateBundleItems = this.activeSession.bundle_items.filter(item => {
                const itemBcClean = String(item.barcode || '').replace(/^0+/, '');
                const itemPartUpper = String(item.part_no || item.sku || '').toUpperCase().trim();
                const itemBaseSku = getBaseSku(itemPartUpper);
                const itemNameUpper = String(item.name || item.short_name || '').toUpperCase().trim();

                if (tagBarcodeClean && itemBcClean && tagBarcodeClean === itemBcClean) return true;
                if (tagSkuUpper && itemPartUpper && (tagSkuUpper === itemPartUpper || tagSkuUpper.startsWith(itemPartUpper) || itemPartUpper.startsWith(tagSkuUpper))) return true;
                if (tagBaseSku && itemBaseSku && tagBaseSku === itemBaseSku) return true;
                const keywords = ['MONT', 'YELEK', 'GÖMLEK', 'GOMLEK', 'PANTOLON', 'POLAR', 'SWEAT', 'AYAKKABI', 'TSHIRT', 'TIŞÖRT', 'POLO'];
                for (const kw of keywords) {
                    const tagHas = tagProdNameUpper.includes(kw) || tagSkuUpper.includes(kw);
                    const itemHas = itemNameUpper.includes(kw) || itemPartUpper.includes(kw);
                    if (tagHas && itemHas) return true;
                }
                return false;
            });

            // Aday parçalardan henüz taranmamış ve bedeni uyuşan parçayı bul:
            bundleMatchedItem = candidateBundleItems.find(item => {
                if (item.is_scanned) return false;
                const itemSizeUpper = String(item.size || 'STD').toUpperCase().trim();
                return itemSizeUpper === 'STD' || tagSizeUpper === 'STD' || itemSizeUpper === tagSizeUpper;
            });

            // Eğer aday parça türü bulundu ama boş beden slotu kalmadıysa -> FAZLA VEYA HATALI BEDEN!
            if (!bundleMatchedItem && candidateBundleItems.length > 0) {
                const expectedSizes = [...new Set(candidateBundleItems.map(it => it.size || 'STD'))];
                const alreadyScannedCount = candidateBundleItems.filter(it => it.is_scanned).length;
                const totalAllowed = candidateBundleItems.length;

                const sizeReason = alreadyScannedCount >= totalAllowed
                    ? `Bu üründen paketteki tüm adetler zaten tamamlandı (${alreadyScannedCount}/${totalAllowed} adet). Fazla ürün!`
                    : `Personel paketinde bu beden (${tagSizeUpper}) bulunmuyor. Beklenen beden: ${expectedSizes.join(', ')}`;

                console.warn(`⚠️ [BEDEN / ADET UYUMSUZLUĞU] EPC: ${epc} | ${sizeReason}. Sayaca EKLENMEDİ. ALARM TETİKLENİYOR.`);

                if (!this.activeSession.discrepancies) {
                    this.activeSession.discrepancies = { foreign_items: [], extra_items: [], missing_items: [] };
                }
                if (!this.activeSession.discrepancies.extra_items.some(e => e.epc === epc)) {
                    this.activeSession.discrepancies.extra_items.push({
                        epc,
                        barcode: tagBarcode,
                        sku: tagSku,
                        name: metadata.product_name || (dbTag ? dbTag.product_name : '') || tagSku || candidateBundleItems[0]?.name || 'Ürün',
                        size: tagSizeUpper,
                        expected_sizes: expectedSizes,
                        reason: sizeReason,
                        timestamp: new Date().toISOString()
                    });
                }

                // 🚨 ALARM VER VE DUR! (Tünel Akışını ve Paleti Durdur)
                const alarmMsg = `⚠️ Koli içinde fazla veya hatalı beden tespit edildi: ${candidateBundleItems[0]?.short_name || candidateBundleItems[0]?.name || 'Ürün'} (${tagSizeUpper})! ${sizeReason}`;
                this.triggerAlarm('EXTRA_SIZE', alarmMsg, {
                    epc,
                    barcode: tagBarcode,
                    sku: tagSku,
                    size: tagSizeUpper,
                    reason: sizeReason
                });

                return { epc, status: 'EXTRA_SIZE_ALARM', reason: sizeReason };
            }
        }

        if (this.antennaStats[antennaPort]) {
            this.antennaStats[antennaPort].count += 1;
            this.antennaStats[antennaPort].last_seen = new Date().toISOString();
        }

        // ✅ SEÇİLİ SİPARİŞ / PERSONEL İLE %100 EŞLEŞEN MEŞRU ETİKET -> SAYAÇ +1
        const isOverTarget = this.activeSession.scanned_quantity >= this.activeSession.target_quantity;
        const tagRecord = {
            epc,
            barcode: (dbTag && dbTag.barcode) ? dbTag.barcode : (tagBarcode !== epc ? tagBarcode : (this.activeSession.barcode || this.activeSession.ean13 || epc)),
            sku: (dbTag && dbTag.sku) ? dbTag.sku : (tagSku || this.activeSession.sku || ''),
            size: metadata.size || (dbTag ? dbTag.size : (this.activeSession.clean_size || this.activeSession.size || 'STD')),
            gender: metadata.gender || (dbTag ? dbTag.gender : (this.activeSession.gender || 'UNISEX')),
            product_name: metadata.product_name || (dbTag ? dbTag.product_name : (this.activeSession.product_name || 'Tekstil Ürünü')),
            first_seen: new Date().toISOString(),
            last_seen: new Date().toISOString(),
            count: 1,
            source,
            antenna: antennaPort,
            rssi: metadata.rssi !== undefined ? metadata.rssi : null,
            is_overtarget: isOverTarget,
            is_matched: true,
            is_foreign: false
        };

        this.activeSession.tags.set(epc, tagRecord);
        if (this.activeSession.order_scanned_epcs) {
            this.activeSession.order_scanned_epcs.add(epc);
        }
        this.activeSession.scanned_quantity += 1;
        this.activeSession.last_scan_at = new Date().toISOString();

        // Beden dökümünü güncelle
        const sizeKey = tagRecord.size || 'STD';
        this.activeSession.items_breakdown[sizeKey] = (this.activeSession.items_breakdown[sizeKey] || 0) + 1;

        // Bundle parçası bulunduysa işaretle
        if (bundleMatchedItem) {
            bundleMatchedItem.is_scanned = true;
            bundleMatchedItem.scanned_epc = epc;
            bundleMatchedItem.scanned_at = new Date().toISOString();
            console.log(`✅ [BUNDLE MATCH] Parça: ${bundleMatchedItem.part_no || bundleMatchedItem.name} (${bundleMatchedItem.size}) -> EPC: ${epc} ile eşleştirildi.`);
        }

        const summary = this.getSessionSummary();

        // ⏱️ TÜNEL GEÇİŞ ZAMANLAYICISI:
        if (this.autoPrintOnExit) {
            this.resetPassageDebounceTimer();
        }

        // 🚨 OTOMATİK TAMAMLANMA VE KİLİTLEME KONTROLÜ
        // Koli hedefe ulaştığında ve eksik parça yoksa koli tamamlanması tetiklenir
        // (Etiketin otomatik basılıp basılmayacağını savedConfig.autoComplete belirler)
        const targetQty = this.activeSession.target_quantity || 0;
        const hasUnscannedBundle = Array.isArray(this.activeSession.bundle_items) && 
            this.activeSession.bundle_items.some(item => !item.is_scanned);
        const isFull = (targetQty > 0 && this.activeSession.scanned_quantity >= targetQty) && !hasUnscannedBundle;

        // Mod A: Hedefe ulaşıldı ve eksik parça yoksa
        if (!this.activeSession.is_verification_mode && isFull && !this.activeSession.is_completing && !this.activeSession.is_auto_completed) {
            this.activeSession.is_completing = true;
            console.log(`🎯 [RFID DRIVER] Hedefe ulaşıldı ve koli TAM (${this.activeSession.scanned_quantity}/${targetQty})! Otomatik tamamlanıyor.`);
            this.emit('target_reached', summary);
            this.emit('session_update', { type: 'TARGET_REACHED', session: summary });
        }

        // Mod B: Doğrulama Tamamlandı Kontrolü (%100 eşleşme)
        if (this.activeSession.is_verification_mode && summary.is_fully_verified && !this.activeSession.is_completing && !this.activeSession.is_auto_completed) {
            this.activeSession.is_completing = true;
            console.log(`✅ [RFID DRIVER] Koli %100 Doğrulandı (${summary.matched_quantity}/${summary.expected_quantity})!`);
            this.emit('box_verified', summary);
            this.emit('session_update', { type: 'BOX_VERIFIED', session: summary });
        }

        this.emit('tag_scanned', { tag: tagRecord, session: summary });
        return tagRecord;
    }

    /**
     * Kiosk için Yeni Tarama Oturumu Başlatır
     */
    startSession(orderData) {
        const totalOrderQty = parseInt(orderData.total_order_quantity || orderData.total_quantity || orderData.quantity || 1, 10);
        const boxTargetQty = parseInt(orderData.target_quantity || Math.ceil(totalOrderQty / (orderData.total_boxes || 1)), 10);
        
        let expectedEpcsSet = null;
        if (orderData.expected_epcs && Array.isArray(orderData.expected_epcs)) {
            expectedEpcsSet = new Set(orderData.expected_epcs.map(e => String(e).trim().toUpperCase()));
        }

        let allowedEpcsSet = new Set();
        if (orderData.allowed_epcs && Array.isArray(orderData.allowed_epcs)) {
            orderData.allowed_epcs.forEach(e => allowedEpcsSet.add(String(e).trim().toUpperCase()));
        }
        if (expectedEpcsSet) {
            expectedEpcsSet.forEach(e => allowedEpcsSet.add(e));
        }

        let allowedBarcodesSet = new Set();
        if (orderData.allowed_barcodes && Array.isArray(orderData.allowed_barcodes)) {
            orderData.allowed_barcodes.forEach(b => {
                const str = String(b).trim();
                if (str) {
                    allowedBarcodesSet.add(str);
                    allowedBarcodesSet.add(str.replace(/^0+/, ''));
                }
            });
        }
        if (orderData.barcode) {
            const b = String(orderData.barcode).trim();
            allowedBarcodesSet.add(b);
            allowedBarcodesSet.add(b.replace(/^0+/, ''));
        }
        if (orderData.ean13) {
            const e = String(orderData.ean13).trim();
            allowedBarcodesSet.add(e);
            allowedBarcodesSet.add(e.replace(/^0+/, ''));
        }

        let allowedSkusSet = new Set();
        if (orderData.allowed_skus && Array.isArray(orderData.allowed_skus)) {
            orderData.allowed_skus.forEach(s => allowedSkusSet.add(String(s).trim().toUpperCase()));
        }
        if (orderData.sku) {
            allowedSkusSet.add(String(orderData.sku).trim().toUpperCase());
        }

        // Personel koli bundle_items içeriğindeki tüm barkod ve SKU'ları izinli listeye ekle
        if (orderData.bundle_items && Array.isArray(orderData.bundle_items)) {
            orderData.bundle_items.forEach(bi => {
                if (bi.barcode) {
                    const bc = String(bi.barcode).trim();
                    allowedBarcodesSet.add(bc);
                    allowedBarcodesSet.add(bc.replace(/^0+/, ''));
                }
                if (bi.part_no) {
                    const pn = String(bi.part_no).trim().toUpperCase();
                    allowedSkusSet.add(pn);
                    const basePart = pn.replace(/(XXS|XS|S|M|L|XL|[2-9]XL|XXXL|[0-9]{2})$/i, '');
                    if (basePart) allowedSkusSet.add(basePart);
                }
                if (bi.sku) {
                    allowedSkusSet.add(String(bi.sku).trim().toUpperCase());
                }
            });
        }

        const boxNum = parseInt(orderData.box_no || 1, 10);
        const isNextBoxOfSameOrder = boxNum > 1 && this.activeSession && String(this.activeSession.order_number) === String(orderData.order_number || orderData.order_id);

        this.activeSession = {
            status: 'SCANNING',
            session_type: orderData.session_type || 'ORDER',
            personnel_id: orderData.personnel_id || null,
            service_center: orderData.service_center || null,
            department: orderData.department || null,
            box_barcode: orderData.box_barcode || null,
            bundle_items: orderData.bundle_items || [],
            auto_next_box: orderData.auto_next_box !== false,
            is_verification_mode: !!orderData.is_verification_mode,
            expected_epcs: expectedEpcsSet,
            allowed_epcs: allowedEpcsSet,
            allowed_barcodes: allowedBarcodesSet,
            allowed_skus: allowedSkusSet,
            order_scanned_epcs: isNextBoxOfSameOrder && this.activeSession.order_scanned_epcs ? this.activeSession.order_scanned_epcs : new Set(),
            expected_quantity: expectedEpcsSet ? expectedEpcsSet.size : boxTargetQty,
            order_id: orderData.order_id || orderData.id,
            order_number: orderData.order_number || orderData.order_id,
            brand: (orderData.brand || 'VOG').trim().toUpperCase(),
            product_name: orderData.product_name || orderData.model || 'Tekstil Ürünü',
            sku: orderData.sku || orderData.code39 || '',
            barcode: orderData.barcode || orderData.ean13 || '',
            ean13: orderData.ean13 || orderData.barcode || '',
            clean_size: orderData.clean_size || orderData.size || 'STD',
            gender: orderData.gender || 'UNISEX',
            sub_customer_name: orderData.sub_customer_name || orderData.customer_name || 'Standart Sevkiyat',
            staff_name: orderData.staff_name || 'Operatör',
            total_order_quantity: totalOrderQty,
            total_processed_quantity: 0,
            remaining_order_quantity: totalOrderQty,
            target_quantity: expectedEpcsSet ? expectedEpcsSet.size : boxTargetQty,
            scanned_quantity: 0,
            box_no: parseInt(orderData.box_no || 1, 10),
            total_boxes: parseInt(orderData.total_boxes || 1, 10),
            started_at: new Date().toISOString(),
            last_scan_at: null,
            tags: new Map(),
            foreign_tags: [],
            items_breakdown: {},
            box_plan: orderData.box_plan || orderData.items_plan || [],
            discrepancies: {
                foreign_items: [],
                extra_items: [],
                missing_items: []
            },
            is_alarm: false,
            alarm_info: null,
            is_completing: false,
            is_auto_completed: false,
            errors: []
        };

        if (this.passageDebounceTimer) {
            clearTimeout(this.passageDebounceTimer);
            this.passageDebounceTimer = null;
        }
        this.tagCooldown.clear();
        if (this.antennaStats) {
            Object.keys(this.antennaStats).forEach(p => {
                this.antennaStats[p].count = 0;
            });
        }
        console.log(`🏷️ [RFID DRIVER] Yeni Tünel Oturumu Başlatıldı: Sipariş #${this.activeSession.order_number} (${this.activeSession.brand} - Hedef: ${this.activeSession.target_quantity} Adet). İzin Verilen Barkod Sayısı: ${allowedBarcodesSet.size}, İzin Verilen EPC: ${allowedEpcsSet.size}`);
        
        const summary = this.getSessionSummary();
        this.emit('session_started', summary);
        return summary;
    }

    /**
     * Oturumu Duraklatır veya Devam Ettirir
     */
    pauseSession() {
        if (this.activeSession.status === 'SCANNING') {
            this.activeSession.status = 'PAUSED';
        } else if (this.activeSession.status === 'PAUSED') {
            this.activeSession.status = 'SCANNING';
        }
        return this.getSessionSummary();
    }

    /**
     * Oturumu Sıfırlar
     */
    resetSession() {
        this.activeSession.tags.clear();
        this.activeSession.foreign_tags = [];
        this.activeSession.items_breakdown = {};
        this.activeSession.scanned_quantity = 0;
        this.activeSession.discrepancies = {
            foreign_items: [],
            extra_items: [],
            missing_items: []
        };
        this.activeSession.is_alarm = false;
        this.activeSession.alarm_info = null;
        if (Array.isArray(this.activeSession.bundle_items)) {
            this.activeSession.bundle_items.forEach(item => {
                item.is_scanned = false;
                delete item.scanned_epc;
                delete item.scanned_at;
            });
        }
        this.activeSession.status = 'SCANNING';
        this.activeSession.last_scan_at = null;
        this.activeSession.is_auto_completed = false;
        this.activeSession.is_completing = false;
        if (this.activeSession.order_scanned_epcs) this.activeSession.order_scanned_epcs.clear();
        if (this.passageDebounceTimer) {
            clearTimeout(this.passageDebounceTimer);
            this.passageDebounceTimer = null;
        }
        this.tagCooldown.clear();
        if (this.antennaStats) {
            Object.keys(this.antennaStats).forEach(p => {
                this.antennaStats[p].count = 0;
            });
        }
        
        const summary = this.getSessionSummary();
        this.emit('session_reset', summary);
        return summary;
    }

    /**
     * Oturumu Tamamlar / Kapatır
     */
    completeSession() {
        if (this.passageDebounceTimer) {
            clearTimeout(this.passageDebounceTimer);
            this.passageDebounceTimer = null;
        }
        this.activeSession.status = 'COMPLETED';
        const summary = this.getSessionSummary();
        this.emit('session_completed', summary);
        return summary;
    }

    /**
     * Oturum Özetini JSON Uyumlu Olarak Döndürür
     */
    getSessionSummary() {
        const tagList = Array.from(this.activeSession.tags.values());
        const percent = this.activeSession.target_quantity > 0
            ? Math.min(100, Math.round((this.activeSession.scanned_quantity / this.activeSession.target_quantity) * 100))
            : 0;

        const totalOrder = this.activeSession.total_order_quantity || this.activeSession.target_quantity || 1;
        const totalProcessed = this.activeSession.total_processed_quantity || 0;
        const remainingOrder = this.activeSession.remaining_order_quantity !== undefined 
            ? this.activeSession.remaining_order_quantity 
            : Math.max(0, totalOrder - totalProcessed);

        const matchedTags = tagList.filter(t => !t.is_foreign);
        const foreignTags = (this.activeSession.foreign_tags && this.activeSession.foreign_tags.length > 0)
            ? this.activeSession.foreign_tags
            : tagList.filter(t => t.is_foreign);
        const expectedQty = this.activeSession.expected_quantity || this.activeSession.target_quantity || 0;
        const matchedCount = matchedTags.length;
        const foreignCount = foreignTags.length;
        const missingCount = Math.max(0, expectedQty - matchedCount);
        const isFullyVerified = this.activeSession.is_verification_mode
            ? (matchedCount === expectedQty && foreignCount === 0 && expectedQty > 0)
            : (this.activeSession.scanned_quantity === this.activeSession.target_quantity);

        return {
            status: this.activeSession.status,
            is_alarm: !!this.activeSession.is_alarm,
            alarm_info: this.activeSession.alarm_info || null,
            discrepancies: this.activeSession.discrepancies || { foreign_items: [], extra_items: [], missing_items: [] },
            is_verification_mode: !!this.activeSession.is_verification_mode,
            expected_quantity: expectedQty,
            matched_quantity: matchedCount,
            foreign_quantity: foreignCount,
            missing_quantity: missingCount,
            is_fully_verified: isFullyVerified,
            session_type: this.activeSession.session_type || 'ORDER',
            personnel_id: this.activeSession.personnel_id || null,
            service_center: this.activeSession.service_center || null,
            department: this.activeSession.department || null,
            box_barcode: this.activeSession.box_barcode || null,
            bundle_items: this.activeSession.bundle_items || [],
            auto_next_box: this.activeSession.auto_next_box !== false,
            order_id: this.activeSession.order_id,
            order_number: this.activeSession.order_number,
            brand: this.activeSession.brand,
            product_name: this.activeSession.product_name,
            sku: this.activeSession.sku,
            sub_customer_name: this.activeSession.sub_customer_name,
            staff_name: this.activeSession.staff_name,
            total_order_quantity: totalOrder,
            total_processed_quantity: totalProcessed,
            remaining_order_quantity: remainingOrder,
            target_quantity: this.activeSession.target_quantity,
            scanned_quantity: this.activeSession.scanned_quantity,
            remaining_quantity: Math.max(0, this.activeSession.target_quantity - this.activeSession.scanned_quantity),
            progress_percent: percent,
            is_matched: isFullyVerified,
            is_overcount: foreignCount > 0 || (!this.autoPrintOnExit && this.activeSession.scanned_quantity > this.activeSession.target_quantity) || ((totalProcessed + this.activeSession.scanned_quantity) > totalOrder),
            box_no: this.activeSession.box_no,
            total_boxes: this.activeSession.total_boxes,
            started_at: this.activeSession.started_at,
            last_scan_at: this.activeSession.last_scan_at,
            items_breakdown: this.activeSession.items_breakdown,
            box_plan: this.activeSession.box_plan || [],
            tags_count: tagList.length,
            antennas: this.getAntennaStatus(),
            foreign_tags: foreignTags.slice(-20),
            tags: tagList // Tüm koli etiketlerini eksiksiz ilet
        };

    }

}

// Singleton örneği oluştur ve dışa aktar
const tunnelDriverInstance = new RFIDTunnelDriver();
tunnelDriverInstance.RFIDTunnelDriver = RFIDTunnelDriver;
module.exports = tunnelDriverInstance;
