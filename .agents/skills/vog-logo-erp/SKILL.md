---
name: vog-logo-erp
description: Logo Tiger 3 ERP integration, MSSQL direct queries, XML data exchange service, wholesale dispatch slips (TRCODE 8), unit barcodes, and stock card synchronization. Use when working on Logo Tiger dispatch creation, ERP barcode matching, client balance lookups, or stock availability.
---

# VOG Logo Tiger ERP Skill

Bu skill, VOG Tekstil WMS ve RFID sisteminin Logo Tiger 3 ERP ile olan çift yönlü veri akışını, SQL sorgularını, XML veri aktarım servislerini ve otomatik irsaliye mekanizmalarını yönetir.

## 1. Veritabanı Tabloları & İlişkiler (MSSQL)
- **`LG_XXX_ITEMS`:** Malzeme (Stok) kartları tablosu.
  - `LOGICALREF`: Birincil anahtar.
  - `CODE`: Malzeme kodu (Örn: `VOG-MONT-001`).
  - `NAME`: Ürün adı.
  - `CARDTYPE`: Kart tipi (1 = Ticari Mal, 10 = Hammadde, vb.).
- **`LG_XXX_UNITBARCODE`:** Barkod ve birim eşleşmeleri tablosu.
  - `ITMUNITREF`: Birim referansı.
  - `ITEMREF`: Malzeme kart referansı (`ITEMS.LOGICALREF`).
  - `BARCODE`: EAN-13 / Code-128 / UPC barkod metni.
- **`LG_XXX_CLCARD`:** Cari hesap (Müşteri / Bayi) kartları.
  - `LOGICALREF`: Cari referansı.
  - `CODE`: Cari kodu (Örn: `120.01.001`).
  - `DEFINITION_`: Bayi unvanı.
- **`LG_XXX_XX_STFICHE`:** Stok fişleri ve İrsaliyeler başlık tablosu.
  - `TRCODE`: Fiş türü. `8` = Toptan Satış İrsaliyesi (Wholesale Dispatch).
  - `FICHENO`: İrsaliye numarası (Örn: `IRS2026000001035`).
  - `SPECODE`: Özel kod (`'VOG-RFID'` otomatik tünel irsaliyelerini işaretler).
  - `CLIENTREF`: Cari hesap referansı.
- **`LG_XXX_XX_STLINE`:** Stok fişi hareket satırları.
  - `STFICHEREF`: `STFICHE.LOGICALREF` yabancı anahtarı.
  - `STOCKREF`: `ITEMS.LOGICALREF`.
  - `AMOUNT`: Sevk edilen miktar.
  - `PRICE`: Birim fiyat.
  - `TOTAL`: Satır toplam tutarı.

## 2. Otomatik İrsaliye Üretim Süreci (RFID Tünel)
1. Tünelde okunan EPC'ler çözümlenir (`SGTIN-96` -> `BARCODE`).
2. `UNITBARCODE` tablosundan `ITEMREF` bulunur.
3. İlgili açık sipariş veya sevk emrinin cari bilgisi (`CLIENTREF`) alınır.
4. Yeni bir `FICHENO` üretilir (Yıl ve sayaç bazlı).
5. `STFICHE` ve bağlı `STLINE` satırları `SPECODE = 'VOG-RFID'` olarak transaction içinde yazılır.
6. ERP başarılı yanıt döndüğünde koli sevk etiketi onaylanır.

## 3. Güvenlik & Offline Dayanıklılık Kuralları
- **SQL Injection Koruması:** Logo MSSQL sorgularında parametrik binding veya güvenli ORM/hazır prosedürler kullanılmalıdır.
- **Offline / Hata Fallback:** Eğer Logo ERP MSSQL bağlantısı zaman aşımına uğrarsa (Network kopması vb.), okuma verileri yerel PostgreSQL `offline_dispatch_queue` tablosunda saklanır ve bağlantı kurulduğunda otomatik senkronize edilir.
