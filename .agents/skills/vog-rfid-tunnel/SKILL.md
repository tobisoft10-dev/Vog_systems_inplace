---
name: vog-rfid-tunnel
description: Impinj Speedway R420 4-antenna RFID tunnel driver, LLRP/TCP socket protocol, UHF Gen2 EPC SGTIN-96 decoding, duplicate read filtration, and automatic parcel dispatching. Use when working on RFID tunnel reading, EPC tag translation, tunnel diagnostics, or carton verification.
---

# VOG RFID Tunnel Skill

Bu skill, VOG Tekstil üretim ve sevkiyat hattında çalışan 4 antenli Impinj Speedway R420 RFID Okuma Tüneli entegrasyonu, etiket okuma algoritmaları, EPC kod çözümü ve otomatik irsaliye/koli tetikleme mekanizmalarını kapsar.

## 1. Donanım & İstasyon Yapısı
- **Okuyucu:** Impinj Speedway R420 (4 Antenli UHF Endüstriyel Okuyucu).
- **Frekans Bandı:** ETSI Standartı (865.6 – 867.6 MHz), EPC Class 1 Gen 2 / ISO 18000-6C.
- **Anten Konfigürasyonu:**
  - Anten 1 & 2: Yan duvar çapraz odaklama (koli yan yüzeyleri).
  - Anten 3: Üst tavan aşağı odaklama.
  - Anten 4: Taban yukarı odaklama.
- **Okuma Süresi:** Koli başına optimum 2 - 3 saniye aralığı.

## 2. EPC ve SGTIN-96 Kod Yapısı
Tünelden okunan 24 karakterlik (96-bit) Hexadecimal EPC kodları standart SGTIN-96 formatında çözümlenir:
- **Header (8 bit):** `0x30` (SGTIN-96 göstergesi).
- **Filter (3 bit):** Ürün tipi (0 = All Other, 1 = Point of Sale, vb.).
- **Partition (3 bit):** Şirket ön eki ve ürün referansı bit sınırları.
- **GS1 Company Prefix:** VOG Tekstil firma kodu.
- **Item Reference:** Logo/WMS ERP Stok Kodu referansı (Barkod kökü).
- **Serial Number:** Tekil serileştirilmiş ürün kimliği (38-bit).

## 3. Yinelenen Okuma Filtreleme (Deduplication Window)
- Tünelden tek geçişte bir çip saniyede onlarca kez okunabilir.
- Bellek içi okuma havuzunda (`readBuffer`), aynı EPC için son 2000ms (2 saniye) içindeki tekrarlar elenir.
- Koli sensörü (foto-fotosel) kesildiğinde veya operatör "OKUMA BİTTİ" dediğinde havuz konsolide edilir ve koli doğrulama motoruna iletilir.

## 4. Logo ERP & WMS Entegrasyonu
- Okunan etiket listesi Logo Tiger ERP'deki açık sipariş veya koli listesi ile eşleştirilir.
- Eksik veya fazla ürün olduğunda tünel ekranında KIRMIZI alarm verilir.
- Tam uyuşma halinde:
  1. Logo ERP'de otomatik `VOG-RFID` özel kodlu Toptan Satış İrsaliyesi (`TRCODE = 8`) oluşturulur.
  2. Koli etiketi (Sato / Godex) otomatik tetiklenir.
  3. Konveyör çıkış kilidi açılarak koli sorter hattına yönlendirilir.

## 5. Webhook & Socket Olayları
- `tunnel:status`: Tünel bağlantı durumu (CONNECTED / SCANNING / IDLE / ERROR).
- `tunnel:tags_detected`: Anlık okunan EPC dizisi ve toplam adet.
- `tunnel:carton_completed`: Koli içeriği tamamlandı ve onaylandı sinyali.
