/**
 * VOG Tekstil Premium - Takipsan Hardware Bridge Controller
 * 
 * Takipsan donanım köprüsü (ws://127.0.0.1:8025/ws) üzerinden:
 * - Kırmızı ışık (redLight / redLightFlash)
 * - Yeşil ışık (greenLight / greenLightFlash)
 * - Siren / Sesli İkaz (sirenStart / sirenStop)
 * - Yürüyen Palet / Konveyör Motor Durdurma (outputoff / bandStop)
 * - Yürüyen Palet / Konveyör Başlatma (bandStart)
 * sinyallerini asenkron ve güvenli (non-blocking) olarak yönetir.
 */

const WebSocket = require('ws');

class TakipsanTunnelBridge {
    constructor(options = {}) {
        this.wsUrl = options.wsUrl || process.env.BRIDGE_WS_URL || 'ws://127.0.0.1:8025/ws';
        this.ws = null;
        this.isConnected = false;
        this.reconnectTimer = null;
        this.autoReconnect = options.autoReconnect !== false;
        this.isAlarmActive = false;
    }

    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        try {
            this.ws = new WebSocket(this.wsUrl, { handshakeTimeout: 3000 });

            this.ws.on('open', () => {
                this.isConnected = true;
                console.log(`🔌 [TAKIPSAN BRIDGE] Donanım köprüsüne bağlandı: ${this.wsUrl}`);
            });

            this.ws.on('message', (data) => {
                // Sessizce dinle
            });

            this.ws.on('error', (err) => {
                // Sessiz hata yönetimi (Tünel PC offline ise konsolu kirletme)
                this.isConnected = false;
            });

            this.ws.on('close', () => {
                this.isConnected = false;
                this.ws = null;
                if (this.autoReconnect && !this.reconnectTimer) {
                    this.reconnectTimer = setTimeout(() => {
                        this.reconnectTimer = null;
                        this.connect();
                    }, 5000);
                }
            });
        } catch (e) {
            this.isConnected = false;
            this.ws = null;
        }
    }

    send(messageObj) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            // Bağlantı yoksa yeniden bağlanmayı dene
            this.connect();
            return false;
        }

        try {
            this.ws.send(JSON.stringify(messageObj));
            return true;
        } catch (e) {
            console.warn('⚠️ [TAKIPSAN BRIDGE] Mesaj gönderme hatası:', e.message);
            return false;
        }
    }

    /**
     * 🚨 ALARM DURUMU:
     * - Kırmızı Işık YAK
     * - Sesli İkaz (Siren) ÇAL
     * - Yürüyen Paleti / Konveyör Bandı DURDUR
     */
    triggerAlarm(details = {}) {
        this.isAlarmActive = true;
        console.log('🚨 [TAKIPSAN BRIDGE] ALARM TETİKLENDİ: Kırmızı Işık Açılıyor, Siren Başlatılıyor ve Palet Durduruluyor...');

        // 1. Kırmızı Işık Komutları
        this.send({ type: 'redLight' });
        this.send({ type: 'redLightFlash' });

        // 2. Siren / Sesli İkaz
        this.send({ type: 'sirenStart' });

        // 3. Konveyör / Yürüyen Palet Rölesini Kes (Durdur)
        this.send({ type: 'outputoff', body: { pin: 0 } });
        this.send({ type: 'outputoff', body: { pin: 1 } });
        this.send({ type: 'outputoff', body: { pin: 2 } });
        this.send({ type: 'outputoff', body: { pin: 3 } });
        this.send({ type: 'outputoff', body: { pin: 4 } });

        // Taban kart kısa komut simülasyonu
        this.send({
            type: 'basecard',
            body: { command: 'TS 1 KisaKomut 1000 BantDurdur Sari Kirmizi Siren' }
        });
    }

    /**
     * 🟢 BAŞARILI TAMAMLANMA:
     * - Yeşil Işık YAK (Kısa flaş)
     * - Siren DURDUR
     * - Konveyör / Paleti ÇALIŞTIR
     */
    triggerSuccess() {
        this.isAlarmActive = false;
        console.log('🟢 [TAKIPSAN BRIDGE] KOLİ ONAYLANDI: Yeşil Işık Açılıyor, Siren Kapatılıyor, Palet Aktif...');

        this.send({ type: 'sirenStop' });
        this.send({ type: 'greenLight' });
        this.send({ type: 'greenLightFlash' });
        this.send({ type: 'bandStart' });
        this.send({ type: 'outputon', body: { pin: 0 } });
    }

    /**
     * 🟡 NORMAL BEKLEME / TARAMA MODU:
     * - Siren DURDUR
     * - Sarı / Normal Işık
     * - Palet ÇALIŞTIR
     */
    resetNormal() {
        this.isAlarmActive = false;
        console.log('🔄 [TAKIPSAN BRIDGE] Normal Tarama Moduna Alındı: Siren Kapatıldı, Palet Başlatıldı.');

        this.send({ type: 'sirenStop' });
        this.send({ type: 'bandStart' });
        this.send({ type: 'yellowLight' });
        this.send({ type: 'outputon', body: { pin: 0 } });
    }
}

// Singleton export
const takipsanBridgeInstance = new TakipsanTunnelBridge();
takipsanBridgeInstance.connect();

module.exports = takipsanBridgeInstance;
