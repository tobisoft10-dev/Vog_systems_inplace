# VOG TEKSTİL - %100 YERLİ SAHA GEÇİŞ VE OPERATÖR KILAVUZU 📖

> **Belge No:** VOG-MAN-2026-V1  
> **Konu:** Takipsan Yazılımlarının Devreden Çıkarılması ve VOG Native Ekosistemi Canlı Saha Kurulum/Kullanım Kılavuzu  
> **Tarih:** 15 Ağustos 2026  

---

## 1. Donanım & Ağ Topolojisi

| Donanım / Servis | IP Adresi & Port | Protokol & Sürücü | Görevi |
| :--- | :--- | :--- | :--- |
| **VOG Ana Sunucu** | `192.168.1.251:3001` / `:3000` | HTTP REST, WebSocket, SSE | PostgreSQL, React UI, ERP Motoru |
| **VOG TCP Donanım Soketi** | `192.168.1.251:2112` | Raw TCP Socket | Doğrudan donanım okuma motoru |
| **Tünel Bilgisayarı (PC)** | `192.168.1.79` | AnyDesk: `431 279 345` | Tünel dokunmatik ekranı |
| **Impinj RFID Okuyucu** | `192.168.0.13` | Impinj Octane SDK / LLRP | Tünel içi 4-Antenli RFID Okuyucu |
| **Tünel Fotosel & PLC Taban Kartı** | `COM / USB (FTDI)` | jSerialComm / GPIO | Koli giriş fotoseli & Yeşil/Kırmızı Stack Light |
| **Yerel Donanım Köprüsü (Bridge)** | `ws://127.0.0.1:8025/ws` | GlassFish Tyrus WebSocket | Impinj & Taban kartını tarayıcıya bağlayan yerel servis |
| **Endüstriyel Barkod / RFID Yazıcı**| `192.168.1.251:9100` / Spooler | ZPL II / EZPL Socket | 100x80mm Otomatik Koli & Ürün Etiket Basımı |
| **Mobil El Terminalleri (PDA)** | **HTTP `3000/terminal`** | `src/pages/HandheldTerminal.jsx` | Mal kabul (tesellüm), hızlı depo sayımı ve Geiger RFID ürün bulma modülü. |
| **Termal Barkod/RFID Yazıcı** | **TCP `9100` / Spooler** | `server/drivers/vog_print_bridge.cjs` | Godex (EZPL) ve Zebra (ZPL II) yazıcılara 100x80mm etiket basımı & RFID EPC yazma. |
| **Merkezi Backend API** | **HTTP `3001`** | `server/app.js` | Tüm sipariş, stok, tünel ve LOGO Tiger ERP canlı irsaliye aktarım motoru. |

---

## 2. Cihaz Bazında Kurulum ve Canlıya Alma Adımları

### 🔹 A. Tünel Makinesi (192.168.1.79) Kurulumu
1. Tünel PC (`192.168.1.79`) üzerinde eski Takipsan masaüstü yazılımı kapatılır.
2. `c:\vog_system\start_tunnel_kiosk.bat` dosyasının kısayolu masaüstüne oluşturulur (veya Windows Başlangıç `shell:startup` klasörüne kopyalanır).
3. Bilgisayar açıldığında Chrome otomatik olarak **`http://localhost:3000/kiosk`** (veya `http://192.168.1.251:3000/kiosk`) adresini tam ekran dokunmatik modda başlatır.
4. **VOG Otomatik Bağlantısı:**
   - VOG Backend sistemi `192.168.1.79:7070` üzerindeki tünel okuyucusuna otomatik olarak TCP istemcisi olarak bağlanır (aynı zamanda yerel `Port: 2112` dinleyicisi de açıktır).

### 🔹 B. Mobil El Terminalleri (Zebra / Newland / Android PDA) Kurulumu
1. El terminalinde Chrome veya yerel tarayıcı açılır.
2. Adres satırına **`http://192.168.1.251:3000/terminal`** (veya sunucu yerel IP'si) yazılır.
3. Tarayıcı menüsünden *"Ana Ekrana Ekle (Install PWA)"* seçeneğine dokunularak cihaz ekranına **"VOG PDA"** simgesi eklenir.
4. **Çevrimdışı Mod:** Wi-Fi kopsa bile terminal okumaya devam eder (`localStorage` tamponu); bağlantı geldiğinde otomatik olarak sunucuya aktarılır.

### 🔹 C. Etiket Yazıcıları (Godex G530 / Zebra ZT411 / ZD420) Kurulumu
1. Yazıcının bağlı olduğu bilgisayarda `c:\vog_system\start_vog_printer.bat` çalıştırılır.
2. Servis arka planda çalışarak koli tamamlandığında hiçbir pencere açmadan doğrudan yazıcıdan 100x80mm etiket çıkartır.

---

## 3. Günlük Saha Operasyon Akışı (Operatör Senaryosu)

```
      [ 1. MAL KABUL ]                [ 2. TÜNEL GEÇİŞİ ]                [ 3. KOLİ KAPATMA & LOGO ]
┌───────────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────────┐
│ Depocu El Terminali       │   │ Koli Konveyörden Geçer    │   │ Operatör "KOLİYİ TAMAMLA" │
│ ile gelen ürün barkodunu  │──>│ Tünel Kiosk Ekranı        │──>│ butonuna dokunur:         │
│ okutur. Sipariş %100 olur │   │ "50 / 50" (Yeşil Yanar)   │   │ - Koli Etiketi basılır    │
│ ve "Depoda"ya geçer.      │   │ Melodik Başarı Sesi Çalar │   │ - LOGO İrsaliyesi oluşur. │
└───────────────────────────┘   └───────────────────────────┘   └──────────────────────────┘
```

1. **Mal Kabul / Tesellüm:**
   - Operatör el terminalinde **"Mal Kabul"** sekmesine girer, sipariş seçer veya doğrudan barkod okutur.
   - Her okumada **Bip Sesi + Titreşim** gelir. Sipariş tamamlandığında yeşil konfeti/kutlama bildirimi çıkar.

2. **Tünel Okuma:**
   - Tünel ekranında **"SİPARİŞ SEÇ"** butonuna basılarak ilgili sipariş seçilir (Örn: `#16763 - SEAT POLAR`).
   - Koli tünelden geçerken fotosel antenleri açar; ekrandaki dev sayaç anlık olarak `0 -> 8` şeklinde artar.
   - Adet tam olduğunda ekran **Yeşil** parlar ve **Melodik Başarı Sesi** çalar.
   - Fazla/hatalı ürün varsa ekran **Kırmızı** yanıp söner ve **Alarm Siren Sesi** çalar.

3. **Koli Kapatma & LOGO ERP:**
   - Operatör ekrandaki **"KOLİYİ TAMAMLA & ETİKET BAS"** butonuna dokunur.
   - Godex/Zebra yazıcıdan QR kodlu 100x80mm etiket anında çıkar.
   - Arka planda merkezi LOGO Tiger ERP (`WINGS / 225`) sisteminde faturalaşmamış resmi kağıt satış irsaliyesi (`LG_225_01_STFICHE`) oluşturulur.

---

## 4. Sorun Giderme ve Güvenlik Notları

* **Tünel Okumuyor:** `http://localhost:3001/api/tunnel/kiosk/status` adresinden sürücü durumunun `READY` veya `SCANNING` olduğunu kontrol edin. Port `2112` dinleyicisinin açık olduğunu doğrulayın.
* **Yazıcı Etiket Basmıyor:** `c:\vog_system\start_vog_printer.bat` penceresinin açık olduğunu ve yazıcının açık/kağıt takılı olduğunu kontrol edin.
* **Geri Dönüş (Rollback):** İhtiyaç halinde `c:\vog_backup_20260815_phase1` yedeği ile sistem anında eski durumuna geri yüklenebilir.
