---
name: vog-label-printing
description: Sato CL4NX Plus (ZPL II) and Godex (EZPL) industrial thermal & RFID tag printing, label templates (50x30mm RFID, 100x100mm carton, 4x2 inch personnel, A5 packing slips), and Labelary preview simulation. Use when modifying label templates, barcode placement, QR generation, or print socket services.
---

# VOG Label Printing Skill

Bu skill, VOG Tekstil bünyesindeki endüstriyel etiket yazıcıları (Sato CL4NX Plus RFID, Godex), ZPL II ve EZPL şablon üretimi, barkod/QR yerleşimleri ve geliştirme ortamı simülasyon kurallarını kapsar.

## 1. Yazıcı Donanımları & Protokoller
- **SATO CL4NX Plus RFID:**
  - Protokol: ZPL II / SBPL.
  - Çözünürlük: 203 DPI (8 dpmm) veya 305 DPI (12 dpmm).
  - Özellik: UHF Gen2 RFID çip kodlama (`^RF` komutları) ve eşzamanlı termal transfer baskı.
- **Godex Endüstriyel Yazıcı:**
  - Protokol: EZPL (Enhanced Zebra Programming Language uyumlu veya yerel Godex komutları).
  - Kullanım Alanı: Koli etiketleri ve sevk fişleri.

## 2. Standart Etiket Tipleri & Boyutları
1. **50x30 mm (2.6 x 1.5 inç) RFID Giysi Etiketi:**
   - 2D QR Kod veya ortalanmış 1D Code-128 barkod.
   - Beden (S, M, L, XL), Renk, Model Adı, Yıkama Talimat İkonları (`^GFA`).
   - RFID EPC hex kodlama bloğu: `^RB96,8,0,3,1^FS ^RFW,H^FD<EPC_HEX>^FS`.
2. **100x100 mm (4 x 4 inç) Koli Sevk Etiketi:**
   - Sevk irsaliye no, alıcı bayi adı, koli numarası (Örn: `1 / 4`), toplam adet, koli içi ürün özet listesi.
3. **4 x 2 inç Personel Koli & Askı Etiketi:**
   - Personel adı, sicil no, departman/bayi bilgisi, sorter göz numarası (`CH-XX`), koli karekodu.
4. **A5 Termal Çeki Listesi / Sevk Makbuzu:**
   - Detaylı irsaliye satırları, toplam tutar/adet, teslim alan/teslim eden imza alanları.

## 3. KESİNLİKLE UYULMASI GEREKEN KURAL: SIFIR TEST BASKISI (ZERO PRINT)
- **Fiziksel Yazıcı Güvenliği:** Geliştirme, hata ayıklama ve test aşamalarında üretimdeki Sato veya Godex yazıcıların IP ve soketlerine **ASLA** doğrudan test ZPL komutu gönderilmez. Bu kural etiket israfını ve operasyonel aksaklıkları önler.
- **Görsel Önizleme Doğrulama:**
  - Üretilen ZPL kodları `Labelary API` (`http://api.labelary.com/v1/printers/8dpmm/labels/4x2/0/`) veya yerel PDF dönüştürücü ile PNG/PDF dosyasına çevrilir.
  - Çıkan önizleme dosyası artifacts klasörüne kaydedilir ve kullanıcıya görsel olarak sunulur.

## 4. ZPL Şablon Standardı Örneği (4x2 inç Personel)
```zpl
^XA
^PW812
^LL406
^CI28
^FO40,30^A0N,32,28^FDVOG TEKSTIL PREMIUM^FS
^FO40,75^A0N,24,20^FDPERSONEL: AHMET YILMAZ^FS
^FO40,110^A0N,20,18^FDBAYI: SKODA ANKARA (GÖZ: CH-14)^FS
^FO40,150^BY2,2.5,70^BCN,70,Y,N,N^FD16861-CH14^FS
^FO550,50^BQN,2,5^FDQA,https://vog.com.tr/p/16861^FS
^XZ
```
