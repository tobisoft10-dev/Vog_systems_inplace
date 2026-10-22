# Kurallar ve Sınırlar (VOG Premium Standartları)

Bu dosya VOG Premium projesinde her zaman dikkate alınması gereken kalıcı kuralları, güvenlik sınırlarını ve yasakları içerir.

## Zorunlu Kurallar (Non-Negotiable)

1. **Sıfır Regresyon (Zero Regression):**
   - Yapılan hiçbir geliştirme, hata düzeltmesi veya temizlik halihazırda çalışan özellikleri (Logo ERP irsaliye aktarımı, RFID tünel okuması, sorter oluk eşleşmeleri, etiket şablonları, Scania/VW/Audi/Seat/Skoda/Nissan siparişleri) ASLA bozmamalıdır.
   - Minimal ve nokta atışı müdahale esastır; ihtiyaç duyulmayan çalışan dosyalar yeniden yazılmaz.

2. **Sıfır Kurgu & Gerçekçilik (Zero Fiction / No Hallucination):**
   - Kod tabanında fiziken var olduğu doğrulanmamış hiçbir API, kütüphane, fonksiyon, veritabanı kolonu veya state yapısı kullanılamaz.
   - "TODO", "mockData", "burası sonra yapılacak" gibi eksik geçici kodlar kesinlikle bırakılamaz. Kod derlenebilir ve üretime hazır olmalıdır.

3. **Alt Beden Giysilerde Kadınlar Erkeklerden 1 Beden (2 Numara) Küçük Kuralı:**
   - Pantolon, şort, bermuda, etek, salopet gibi tüm alt beden giysilerde kadın personelin beden numarası erkek karşılığından 1 beden (2 numara) küçüktür:
     - **Kadın:** XXS (34), XS (36), S (38), M (40), L (42), XL (44), 2XL (46), 3XL (48)...
     - **Erkek:** XXS (36), XS (38), S (40), M (42), L (44), XL (46), 2XL (48), 3XL (50)...
   - Bu kural `isAltBedenGarment` fonksiyonu üzerinden hem frontend (`OrdersPage.jsx`, `OrderLabelPrintingPage.jsx`) hem backend (`server/app.js`) tarafında tutarlı uygulanmalıdır.

4. **Üst Bedenlerde Sadece Harf Kodu Kuralı:**
   - Polar, tişört, sweatshirt, yelek, gömlek, mont gibi üst beden giysilerde parça kodunun (SKU) sonu daima harf ile biter (`XS`, `S`, `M`, `L`, `XL`, `XXL`, `XXXL`).
   - Üst bedenlerde parça kodunun sonuna kesinlikle sayısal beden (`...38`, `...40`) eklenemez. Sayısal ekler yalnızca alt beden (pantolon) içindir.

5. **Sıfır İzinli Yazdırma Güvencesi (Zero Unauthorized Print):**
   - Geliştirme, test veya simülasyon sırasında Windows Print Spooler (Godex, Sato veya diğer fiziksel yazıcılar) üzerine gerçek fiziksel baskı gönderilmemelidir.
   - Testler daima ZPL string doğrulaması, Labelary API önizlemesi veya sanal/dummy soketler üzerinden yürütülmelidir.

6. **Logo Tiger 3 ERP Veri Bütünlüğü:**
   - `LG_016_01_STFICHE` ve `LG_016_01_STLINE` tablolarına doğrudan veya XML CAPI ile yazılırken `TRCODE = 8` (Toptan Satış İrsaliyesi), `BILLED = 0`, `INVOICEREF = 0` standartlarına tam uyulmalıdır.
   - İptal edilen veya revize edilen irsaliye logları temizlenirken referans bütünlüğü (`STLINE.STFICHEREF`) korunmalıdır.

## Yapılmaması Gerekenler

- `server/db.js` veya PostgreSQL / MSSQL bağlantı havuzlarında connection leak oluşturacak kapatılmamış sorgular yazmak.
- Sorter Mini motorunda (`sorter_engine.cjs`) PLC soket zamanlayıcılarını (heartbeat) kesintiye uğratmak.
- RFID Tünel okuma algoritmasında (`tunnel_daemon.cjs`) duplicate tag filtresini devre dışı bırakmak.
- Context dosyalarına şifre, veritabanı parolası veya canlı API secret'ları eklemek (`.env` dosyasında tutulur).

## Kullanıcı Onayı Gerektiren İşlemler

- PostgreSQL canlı veritabanında tablo düşürme (`DROP TABLE`), truncate etme veya toplu veri silme.
- Logo Tiger 3 ERP MSSQL veritabanında doğrudan güncelleme/silme (`UPDATE`/`DELETE`) çalıştırma.
- Fiziksel yazıcıya toplu etiket gönderme emri.
- Kod tabanından büyük modül veya dosya silme işlemleri.
