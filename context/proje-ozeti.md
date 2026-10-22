# Proje Özeti: VOG Premium (WMS & Endüstriyel Otomasyon)

Bu dosya VOG Premium projesinin ne olduğunu, amacını, kapsamını ve mevcut durumunu açıklar.

## Projenin Adı
**VOG Premium** — Depo Yönetim Sistemi (WMS), Endüstriyel Ayıklama (Sorter), RFID Tünel ve ERP Entegrasyon Platformu.

## Kısa Tanım
VOG Tekstil'in kurumsal ve özel üretim hazır giyim süreçlerini (Doğuş Otomotiv markaları: Scania, Volkswagen, Audi, Cupra, Seat, Skoda ve Nissan) siparişten ipliğe, RFID etiketlemeden otomatik sorter ayrıştırmasına, tünel okumasından Logo Tiger 3 ERP irsaliye kesimine kadar uçtan uca yöneten yüksek performanslı endüstriyel WMS ve üretim platformudur.

## Ana Amaç
- Yüksek hacimli personel kıyafet siparişlerinin sıfır hata ile toplanması, kutulanması ve etiketlenmesi.
- Sato CL4NX Plus RFID/termal yazıcılar ile UHF Gen2 EPC (SGTIN-96) çiplerinin basımı ve doğrulanması.
- Impinj Speedway R420 4 antenli RFID tüneli ile koli içi ürünlerin saniyeler içinde %100 doğrulukla sayılması.
- HC Robotics OmniSort Mini 63 gözlü akıllı ayıklama robotu ile personel ve sipariş bazlı giysi ayrıştırması.
- Logo Tiger 3 ERP (MSSQL & CAPI/XML) ile çift yönlü anlık irsaliye (TRCODE 8) ve stok entegrasyonu.
- B2B Kurumsal Müşteri Portalı ve Şık Vitrin (React 19 / Vite SPA).

## Kapsama Dahil Olanlar
1. **Endüstriyel Donanım Entegrasyonları:**
   - **RFID Tüneli:** Impinj Speedway R420 (LLRP / TCP 5084 daemon `VogTunnelBridge.exe`).
   - **Sorter (OmniSort Mini):** HC Robotics 63 oluklu, 8 panelli mini sorter (TCP 2000 PLC haberleşmesi, LED kontrol, koli düşüm kaydı).
   - **Endüstriyel Yazıcılar:** SATO CL4NX Plus (50x30mm RFID/termal ZPL), Godex G530 (80x100mm portrait / 100x100mm EZPL/GDI koli etiketi), A5 lazer personel fişi.
2. **ERP & Veri Tabanı:**
   - **PostgreSQL 17:** Ana WMS veritabanı (personel siparişleri, koli planları, çip logları, sorter atamaları).
   - **Logo Tiger 3 ERP (MSSQL direct & XML):** `LG_016_ITEMS`, `LG_016_01_STFICHE`, `LG_016_01_STLINE` entegrasyonu, otomatik toptan satış irsaliyesi oluşturma.
3. **Frontend & Vitrin (React 19 / Vite):**
   - Yönetim Kokpiti, Sipariş Matrisi, Etiket Basım Merkezi, Sorter Dağıtım Paneli, RFID Tünel Kiosk Arayüzü, Müşteri Showroom Portalı ve Diorama Konseptli Kurumsal Ana Sayfa.
4. **Backend (Node.js Express):**
   - RESTful API, WebSocket canlı telemetri, print spooler servisleri, etiketleme motorları.

## Kapsam Dışında Kalanlar
- Logo Muhasebe defteri finansal kayıtları (yalnızca ambar/stok ve toptan satış irsaliyeleri kapsamdadır).
- Fiziksel PLC donanım firmware modifikasyonu (yalnızca standart TCP soket komutları kullanılır).

## Mevcut Durum (Canlı / Operasyonel)
- **Scania 2026 Kış:** 438 personel, 4.879 parça giysi aktarımı, 1..897 sıralı koli numaralandırması ve ZPL etiketleme hazır.
- **Seat 2026 Yaz & Kış:** Tam katalog ve personel entegrasyonu aktif.
- **VW Binek & Ticari (BSIP):** 2025/2026 katalogları, çift beden kuralları ve irsaliye motoru aktif.
- **Audi, Cupra, Skoda, Nissan:** Beden kuralları ve Logo Tiger eşleşmeleri %100 doğrulanmış durumda.
- **PM2 Süreçleri:** `vog-api` (Port 3001) ve `vog-frontend` (Port 3000) kesintisiz online.

## Önemli Konumlar
- Frontend: `src/` (Sayfalar: `src/pages/`, Bileşenler: `src/components/`, Stil: `src/index.css`)
- Backend & Servisler: `server/` (`app.js`, `sorter_engine.cjs`, `tunnel_daemon.cjs`, `personnel_numbering_service.cjs`, `db.js`)
- Donanım Köprüleri: `VogTunnelBridge.exe`, `scripts/`
- Kaynaklar & Belgeler: `context/kaynaklar/`
