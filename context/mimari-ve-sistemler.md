# Mimari ve Sistemler (VOG Premium Endüstriyel Donanım & Servisler)

Bu dosya VOG Premium sisteminin donanım, ağ protokolleri, servis daemon'ları ve veritabanı altyapısının teknik özelliklerini açıklar.

## 1. Ağ ve Port Dağılımı

| Servis / Donanım | Protokol / Port | Açıklama |
|---|---|---|
| **Vite Frontend (SPA)** | HTTP / `3000` | PM2: `vog-frontend` (`dist/` statik sunumu) |
| **Node.js Express API** | HTTP & WS / `3001` | PM2: `vog-api` (Ana WMS sunucusu) |
| **PostgreSQL 17** | TCP / `5432` | Ana WMS veritabanı (`vog_wms` / `postgres`) |
| **Logo Tiger 3 ERP (MSSQL)** | TCP / `1433` | Logo veritabanı (`TIGER3`, `LG_016_...`) |
| **OmniSort Mini PLC (HC Robotics)** | TCP Soket / `2000` | 63 oluklu mekanik sorter donanımı |
| **Impinj Speedway R420 (Tünel)** | LLRP / `5084` | 4 antenli RFID okuyucu köprüsü (`VogTunnelBridge.exe`) |
| **Sato CL4NX Plus (Yazıcı)** | Raw TCP / `9100` | RFID / Termal ZPL II giysi etiketi |
| **Godex G530 (Yazıcı)** | USB / Windows Spooler / GDI | 80x100mm / 100x100mm koli etiketi |

## 2. Alt Sistemler ve Sorumluluklar

### A. OmniSort Mini Sorter Yönetimi (`server/sorter_engine.cjs`)
- **Donanım:** HC Robotics OmniSort Mini (63 Oluk / Chute, 8 Panel).
- **İletişim:** TCP Soket haberleşmesi (Port 2000). Heartbeat ve durum paketleri gönderilir.
- **Renk ve Durum Kontrolü:** Oluk durumu LED ışıkları (Mavi, Yeşil, Kırmızı, Sarı).
- **Oluk Tahsis Mantığı:** Marka veya personele göre dinamik oluk ataması, tam dolum alarmı ve koli kapatma sinyali.

### B. RFID Tünel Sistemi (`VogTunnelBridge.exe` & `server/tunnel_daemon.cjs`)
- **Donanım:** Impinj Speedway R420 4 Antenli UHF Okuyucu.
- **Standart:** EPCglobal Class 1 Gen 2 / ISO 18000-6C (SGTIN-96 kodlama).
- **Filtreleme:** Zaman pencereli duplicate EPC filtreleme (500ms debounce).
- **Akış:** Koli tünelden geçerken tüm çipler okunur -> Sipariş kalemleriyle eşleştirilir -> Eksik/fazla çip uyarısı verilir -> Başarılı ise koli otomatik mühürlenir.

### C. Logo Tiger 3 ERP Entegrasyonu (`server/logo_service.cjs`)
- **Model:** `LG_016_ITEMS` (Stok kartları), `LG_016_UNITBARCODE` (Barkod eşleşmeleri), `LG_016_CLCARD` (Cari hesaplar).
- **İrsaliye:** `LG_016_01_STFICHE` ve `LG_016_01_STLINE` tablolarında `TRCODE = 8` (Toptan Satış İrsaliyesi).
- **Güvenlik:** Her irsaliye oluşturulmadan önce cari bakiye, stok mevcudu ve irsaliye numarası çakışması denetlenir.

### D. Etiket Motorları ve Yazıcı Sürücüleri
- **SATO CL4NX Plus (RFID Tekstil Etiketi):**
  - Boyut: 50x30 mm
  - Çözünürlük: 203 DPI (`^PW400`, `^LL240`)
  - Çip: UHF RFID EPC yazma komutları (`^RFW,H,1,2,6^FD...^FS`)
- **Godex G530 (Koli Etiketi):**
  - Boyut: 80x100 mm Dikey (Portrait)
  - Çözünürlük: 300 DPI (`^PW945`, `^LL1181`)
  - İçerik: Bayi adı, personel adı, sipariş barkodu, koli sıra numarası (`KOLI-SC-...`), 14 satıra kadar giysi listesi.
- **A5 Lazer Personel Giysi Fişi:**
  - HTML to PDF / Canvas çıktısı ile teslim tesellüm tutanağı.

## 3. Çalıştırma ve Servis Komutları
- **Frontend Geliştirme:** `npm run dev`
- **Frontend Derleme:** `npm run build`
- **PM2 Süreç Durumu:** `pm2 status`
- **PM2 Yeniden Başlatma:** `pm2 restart vog-api`, `pm2 restart vog-frontend`
- **Hafıza ve Bağlam Denetimi:** `proje-hafizasi` becerisi (`hafızayı güncelle`, `bağlamı denetle`, `kaynakları denetle`)
