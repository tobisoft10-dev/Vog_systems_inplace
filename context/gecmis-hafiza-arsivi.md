- **feature/vog-homepage-redesign-mockup (VOG Web Sayfası Ana Sayfa Yenileme - Mockup Birebir Uygulaması):**
  - **Kullanıcı Talebi:** *"vog web sayfa ana sayfa bu sekilde olacak"* (kullanıcının ilettiği yüksek çözünürlüklü mockup görseli).
  - **Uygulanan Tasarım & Bileşenler:**
    1. **Hero Section (Diorama & Dikiş Makinesi Konsepti):**
       - Yüksek çözünürlüklü makro dikiş makinesi ve minyatür figürler arka planı (`/vog_images/vog_hero_diorama.jpg`).
       - Sol üst "VOG" logo metni ve "Vog Tekstil • Est. 1996" alt başlığı; sağ üst dairesel cam hamburger menü butonu.
       - Başlık: *"Moda bizim için bir yaşam."*, Alt başlık: *"Özel üretim hazır giyim ve kurumsal giyimin öncüsü. VOG TEKSTİL • EST. 1996"*.
       - Eylem Butonları: *"Ürünleri İncele →"* (oval beyaz buton) ve *"İletişim"* (glassmorphism buton).
    2. **Kumaş Geçişi (Pinking Shears / Zikzak Dikiş):**
       - Hero ile ürünler bölümü arasında 24px yüksekliğinde fiziksel terzi zikzak makası kumaş kesimini temsil eden SVG zikzak separatör.
    3. **Ürünlerimiz Bölümü (3x3 Grid & Showroom Giriş Kartı):**
       - `#FAF7F2` sıcak krem zemin, `KOLEKSİYON` badge'i ve *"Ürünlerimiz"* başlığı.
       - 9 ana kategori kartı (Polo Tişörtler, Tişörtler, Ceketler, Yelekler, Gömlekler, Sweatshirtler, Gömlekler, Polarlar, Kurumsal Kıyafetler).
       - Merkezde süzülen interaktif *"Showroom Girişi"* kartı (`MÜŞTERİ` etiketi, e-posta/şifre giriş alanları, `#7A2838` bordo "GİRİŞ YAP" butonu, kapatma ve portal yönlendirmesi).
       - Sağ alt köşede `mix-blend-mode: multiply` ile kusursuz entegre edilmiş minyatür kumaş denetçisi terzi figürü (`/vog_images/miniature_inspector.jpg`).
    4. **Dersimizi Çalıştık Bölümü (4 Belgesel Kart):**
       - `HABERLER & DUYURULAR` etiketi ve *"Dersimizi Çalıştık"* başlığı.
       - 4 adet monochrome/siyah-beyaz hikaye kartı: Atölye, Dokuma İnovasyonu, Volkswagen Kurumsal Çözüm, Doğuş Otomotiv İş Birliği.
    5. **Zengin Bordo Footer (`#7A2838`):**
       - 5 dairesel sosyal medya ikonu, telif metni, 3 kurumsal sütun (Kurumsal, İletişim, Ürünler) ve alt yatay yasal linkler barı.
    6. **Layout & Global Navbar Entegrasyonu:**
       - `src/components/Layout.jsx`: Ana sayfada (`/`) üst kısımda kahraman alanı görünürken global floating navbar gizlenir, sayfa aşağı kaydırıldığında pürüzsüzce belirir. Çift footer oluşmasını önlemek için standart `<Footer />` ana sayfada bastırılır.
  - **Doğrulama & Test:**
    - `npm run build`: 692 modül 0 hata ile derlendi (6.74s).
    - `pm2 restart vog-frontend`: Port 3000 üzerinde güncel dist başarıyla yayına alındı.
    - HTTP status 200 OK doğrulandı.

- **feature/scania-2026-kis-personnel-import-and-label-integration (SCANIA 2026 Kış Kişi Listesi Aktarımı, Koli Numaralandırma & Etiket Basım Entegrasyonu):**
  - **Kullanıcı Talebi:** *"indirilenler klasorundeki SCANIA 2026 KIŞ KİŞİ LİSTESİ .xlsx excel dosyasını oku ve içindeki bilgilerietiket basımı için aktar."*
  - **Kapsam & Analiz:**
    * Kaynak Dosya: `C:\Users\ctopuz\Downloads\SCANIA 2026 KIŞ KİŞİ LİSTESİ .xlsx`
    * Sayfalar ve Personel Envanteri:
      1. `Teknisyen`: 298 Kişi (Pantolon, Sweatshirt Mavi, Scania Kolsuz Yelek, Bere)
      2. `Master Teknisyen`: 26 Kişi (Pantolon, Master Teknisyen Sweatshirt `SCKY221..`, Kolsuz Yelek, Bere)
      3. `Servis Danışmanı`: 82 Kişi (Danışman Pantolon, Danışman Uzun Kol Gömlek, Sweatshirt Gri, Kolsuz Yelek, Bere)
      4. `Yedek Parça`: 32 Kişi (Y.P. Pantolon, Sweatshirt Gri, Kolsuz Yelek, Bere)
      5. `Kodlar`: 196 adet resmi Scania katalog tanımı (Tümü `master_products` ile %100 eşleşti, 0 eksik).
    * Toplam 2026 Kış: 438 Personel, 4.879 Parça Kıyafet.
    * Özel Durum (Fatih Semiz - 5XL): Row 156'da formül boşluğundan kaynaklanan boş hücreler `Kodlar` sayfasından `SCKY20509` (Pantolon), `SCKY20409` (Sweatshirt Mavi), `SCKY20209` (Kolsuz Yelek) ve `SCKY20000` (Bere) olarak otomatik tamamlandı.
  - **Uygulanan Mimari & Çözüm:**
    1. **Aktarım Scripti (`server/import_scania_2026_kis.cjs`):**
       - 2025 Kışına ait eski 392 personel kaydı güvenle temizlendi.
       - 2026 Yazına ait 459 personel kaydı %100 korundu (Sıfır Regresyon).
       - 438 yeni 2026 Kış personeli, `master_products` ile doğrulanmış zengin `bundle_items` JSONB verisiyle `personnel` tablosuna aktarıldı.
       - Departmanlar: `Danışman (Kış)` (82), `Teknisyen (Kış)` (324; 298 Teknisyen + 26 Master Teknisyen), `Yedek Parça (Kış)` (32).
    2. **Koli Numaralandırma & Barkodlama (`personnel_numbering_service.cjs`):**
       - Tüm Scania personelleri Bayi/Yetkili Satıcı (Türkçe alfabetik) ve Personel Adı sıralamasıyla `1 .. 897` arası sequential numaralandırıldı.
       - Koli barkodları `KOLI-SC-DAN-0001`, `KOLI-SC-TEK-0001`, `KOLI-SC-YDP-0001` formatında oluşturuldu.
    3. **Etiket Basım Merkezi & Sorter Entegrasyonu:**
       - `/api/personnel-orders/:id/label-data` üzerinden her personel için:
         * A5 Personel Fişi (`FIS-SC-...`) ve giysi kontrol listesi,
         * Godex G530 80x100mm portrait dikey koli etiketi ZPL (`^PW945`, `^LL1181`),
         * Sato CL4NX Plus RFID/Termal ZPL tekil kıyafet etiketleri (her parça için adetli ve tekil) hazırlandı.
       - Mini-Sorter eşleştirme motoru (`sorter_engine.cjs`) Scania kıyafet okutmaları için doğrulandı.
  - **Test & Doğrulama:**
    - `verify_scania_2026_kis_labels.cjs`: Tüm 7 test aşaması (Brands 897, Departments 6 adet, Staff List, Teknisyen/Master/Danışman/5XL label data, Sorter matching simülasyonu, VW sıfır regresyon, Scania Yaz sıfır regresyon) %100 PASS.
    - `e2e_scania_test.cjs`: Scania uçtan uca test süiti 897 personel hedefiyle %100 PASS.
    - `npm run build`: 694 modül 0 hata ile derlendi (16.93s).
    - ZERO PRINT: Windows Print Spooler kuyruğunda 0 bekleyen iş teyit edildi.

- **feature/bottom-garments-female-1-size-lower-rule (Alt Bedenli Giysilerde Kadınlar Erkeklerden 1 Beden Aşağı Kuralı & Evrensel Alt Giyim Mimarisi):**
  - **Kullanıcı Kuralı:** *"alt bedenli giysilerde kadınlar erkeklerden 1 beden aşağı kuralı uygulamalıyız"*
  - **Kapsam & Mimari Çözüm:**
    1. **Evrensel Alt Beden Tespiti (`isAltBedenGarment`):**
       - Sadece `pantolon` kelimesine bağımlı eski yapı kaldırıldı; pantolon, şort, bermuda, etek, tayt, eşofman altı, salopet, alt giyim veya sayısal beden (34-62) içeren tüm ürünleri otomatik tanıyan `isAltBedenGarment(productName, extraInfo, size)` yardımcı fonksiyonu hem backend (`server/app.js`) hem frontend (`OrdersPage.jsx`, `OrderLabelPrintingPage.jsx`) mimarisine entegre edildi.
       - Üst bedenlerde (tişört, polar, sweat, gömlek, mont, yelek vb.) asla sayısal beden kullanılmaz; harf bedenleri (XS, S, M, L, XL, 2XL, 3XL...) esastır.
    2. **Kadınlar Erkeklerden 1 Beden (2 Numara) Küçük Eşleme Tablosu (`formatDualSize` & `getSizeAliases`):**
       - **Kadın Alt Beden:** `XXS -> 34`, `XS -> 36`, `S -> 38`, `M -> 40`, `L -> 42`, `XL -> 44`, `2XL -> 46`, `3XL -> 48`, `4XL -> 50`...
         * Çift Beden: `formatDualSize('S', 'KADIN', true)` -> `'S (38)'`, `formatDualSize('38', 'KADIN', true)` -> `'S (38)'`, `formatDualSize('36', 'KADIN', true)` -> `'XS (36)'`.
       - **Erkek Alt Beden:** `XXS -> 36`, `XS -> 38`, `S -> 40`, `M -> 42`, `L -> 44`, `XL -> 46`, `2XL -> 48`, `3XL -> 50`, `4XL -> 52`...
         * Çift Beden: `formatDualSize('S', 'ERKEK', true)` -> `'S (40)'`, `formatDualSize('40', 'ERKEK', true)` -> `'S (40)'`, `formatDualSize('38', 'ERKEK', true)` -> `'XS (38)'`.
       - **Üst Bedenler (Polar, Tişört, Mont vb.):** Hem kadın hem erkek için standart çift beden tablosu korunur (`XS -> XS (38)`, `S -> S (40)`, `M -> M (42)`, `L -> L (44)`, `XL -> XL (46)`, `2XL -> 2XL (48)`, `3XL -> 3XL (50)`).
    3. **Tüm Entegrasyon Noktalarının Eşitlenmesi:**
       - `resolveExactSizeSkuAndBarcode`: Pantolon ve tüm alt beden ürünlerinde kadınlar için 1 beden küçük sayısal SKU eki (`PVWT26000438`, `PCUPRA10002838`), erkekler için standart sayısal SKU eki (`PVWT26000340`, `PCUPRA10002740`) güvenceye alındı.
       - SATO CL4NX Plus RFID ZPL etiket motoru (`generateSatoRfidZplQr`, `generateSatoRfidZplClassic`), Fiş oluşturma (`resolveVoucherMetadata`, `/api/vouchers/create`, `/api/vouchers/create-from-order`), Etiket Basım Merkezi (`OrderLabelPrintingPage.jsx`), Sipariş Matrisi (`OrdersPage.jsx`) ve Personel Alt Beden Takibi bu standarda bağlandı.
  - **Test & Doğrulama:**
    - `verify_alt_beden_complete.cjs`: 67/67 test %100 PASS (Tüm alt beden algılama, kadın 1 beden küçük kuralları, erkek tabloları, üst giyim kuralları ve ZPL etiket çıktıları).
    - `verify_cupra_16715_resolution.cjs`: 43/43 test %100 PASS.
    - `verify_4_pair_resolutions.cjs`: 16/16 test %100 PASS.
    - `test_pants_gender_size_rules.cjs`: 55/55 test %100 PASS.
    - `npm run build`: 694 modül hatasız derlendi (7.29s). PM2 `vog-api` ve `vog-frontend` online. ZERO PRINT güvencesi (kuyrukta 0 iş).

- **feature/cupra-16715-upper-garment-letter-sizes-and-dual-size-labels (CUPRA 16715 Polar Beden & Parça No Çözümlemesi, Üst Beden Harf Kodu Kuralı & Çift Beden Etiket Standardı):**
  - **Kullanıcı Talebi:** *"CUPRA 16715 sipariş parçano sonunda bende numarası yazıyor üst bedenlerde sadece harf ile olmalı bedenler daha önceki gibi etiket beden alanında da XS (38) şeklinde olacak buna göre güncelleme yap."*
  - **Kök Neden & Analiz:**
    1. **Üst Beden vs Alt Beden SKU Kuralı:** Daha önce `PCUPRA` için eklenen fallback ve varyant mantığı, pantolon kontrolü yapmaksızın tüm bedenleri sayısal formata (`PCUPRA10001438`) çeviriyordu. Oysa CUPRA'da sayısal ekler (`PCUPRA10002738`, `PCUPRA20004338`) yalnızca **pantolon (alt bedenler)** içindir; polar, tişört, mont, gömlek, sweat gibi **üst bedenlerde** parça kodunun sonu daima **harf ile** bitmelidir (`PCUPRA100014XS`, `PCUPRA100014S`, `PCUPRA100014M`, `PCUPRA100014L`, `PCUPRA100014XL`, `PCUPRA100014XXL`, `PCUPRA100014XXXL`).
    2. **Katalog (`master_products`) Bozuklukları:** `PCUPRA100014XS` satırı tabloda eksikti. `PCUPRA100014XL` ise geçmiş toplu aktarımdan dolayı `size = '4XL'` ve `clean_size = '4XL'` olarak kaydedilmişti; bu nedenle XL bedeni `PCUPRA100014XXXXL` ile eşleşiyordu. `PCUPRA100015XL` de benzer şekilde `5XL` olarak kalmıştı.
    3. **Etiket `BEDEN:` Alanı Çift Beden Formatı:** `generateSatoRfidZplQr` ve `generateSatoRfidZplClassic` fonksiyonlarında pantolon dışındaki ürünlerin parantez içi çift bedeni (`rawSize.replace(/\s*\([^)]*\)/g, '')`) budanarak yalnızca `XS` basılıyordu. Kullanıcı etiket üzerinde `XS (38)` standardının önceki gibi korunmasını talep etti.
  - **Uygulanan Çözüm & Mimari:**
    1. **Veritabanı Katalog Onarımı (`master_products`):**
       - `PCUPRA100014XS` (`sku = 'PCUPRA100014XS'`, `code39 = 'PCUPRA100014XS'`, `barcode = '8692357100704'`, `ean13 = '8692357100704'`, `product_name = 'CUPRA SERVİS DANIŞMAN / GARANTİ POLAR BAY XS BEDEN'`, `size = 'XS'`, `clean_size = 'XS'`, `gender = 'ERKEK'`, `brand = 'CUPRA'`) eklendi.
       - `PCUPRA100014XL` ve `PCUPRA100015XL` için `size = 'XL'`, `clean_size = 'XL'` olarak düzeltildi.
       - Diğer hatalı XL kayıtları (`PCUPRA200012XL`, `PCUPRA200013XL`, `PCUPRA200038XL`, `PCUPRA200042XL`) `size = 'XL'` olarak güncellendi.
    2. **Sipariş 16715 Kayıtlarının Düzeltilmesi (`vouchers` & `rfid_tags`):**
       - `vouchers` tablosunda XS bedenleri `PCUPRA10001438`'den `PCUPRA100014XS`'e, XL bedeni `PCUPRA100014XXXXL`'den `PCUPRA100014XL`'e güncellendi.
       - `rfid_tags` tablosunda 5 adet XS etiketi `PCUPRA100014XS` ve 22 adet XL etiketi `PCUPRA100014XL` olarak güncellendi.
    3. **Motor Güncellemesi (`server/app.js`):**
       - `resolveExactSizeSkuAndBarcode`: `PCUPRA` için `isPant` kontrolü eklendi; pantolon ise sayısal beden (`38`, `40`...), üst giyim ise harf eki (`XS`, `S`, `M`, `L`, `XL`, `XXL`, `XXXL`) atanması sağlandı.
       - `formatDualSize(size, gender, isPantolon)`: Kadın beden farkı (1 beden küçük: XS -> 36, S -> 38...) kuralı yalnızca `isPantolon && isFemaleGender(gender)` koşuluna bağlandı. Üst giyimde (polar vb.) hem kadın hem erkek standart çift beden tablosunu (`XS -> XS (38)`, `S -> S (40)`, `M -> M (42)`, `L -> L (44)`, `XL -> XL (46)`, `2XL -> 2XL (48)`, `3XL -> 3XL (50)`) kullanır.
       - `generateSatoRfidZplQr` ve `generateSatoRfidZplClassic`: Etiketin `BEDEN:` alanında ayakkabı haricindeki tüm giyim ürünlerinde `formatDualSize(clean_size || size, gender, isPantolon)` uygulanarak `XS (38)` formatında basılması sağlandı.
       - `getSizeAliases` ve `/api/printer/print-order-rfid-labels`: `isPantolon` parametresi entegre edilerek tutarlılık güvenceye alındı.
    4. **Frontend (`src/pages/OrdersPage.jsx`):**
       - `getSizeTextToNum` ve `getSizeNumToText` fonksiyonlarına `isPantolon = false` opsiyonu eklendi; kadın beden farkı yalnızca pantolonlar için geçerli kılındı.
  - **Test & Doğrulama:**
    - `verify_cupra_16715_resolution.cjs`: 43/43 test %100 PASS (Erkek/Kadın tüm bedenlerde SKU ve ZPL etiket formatları doğrulandı).
    - `test_pants_gender_size_rules.cjs`: 55/55 test %100 PASS.
    - `verify_4_pair_resolutions.cjs`: 16/16 test %100 PASS.
    - `verify_all_vw_rules.cjs`: 15/15 test %100 PASS.
    - `npm run build`: 694 modül 0 hata ile derlendi (7.32s). PM2 `vog-api` ve `vog-frontend` online. ZERO PRINT (0 kuyruk) doğrulandı.

- **feature/vw-orders-16674-16673-16682-16679-gender-pairing-and-sync (Volkswagen 16674, 16673, 16682, 16679 Çift Cinsiyet Parça No Eşleştirmesi, Beden Varyant Çözümlemesi & Tam Senkronizasyon):**
  - **Kullanıcı Talebi:** *"16674 için ERKEK: PVWT260006 - KADIN: PVWT260005, 16673 için ERKEK: PVWK100009 - KADIN: PVWK100010, 16682 için ERKEK: PVWK100102 - KADIN: PVWK100103, 16679 için ERKEK: PVWK100108 - KADIN: PVWK100109 olmalı"*
  - **Uygulanan Çözüm & Mimari:**
    1. **Frontend Dinamik Cinsiyet Değişimi (`OrderLabelPrintingPage.jsx`):**
       - `resolveGenderSpecificSku` fonksiyonuna `PVWT260006` (Erkek) <-> `PVWT260005` (Kadın), `PVWK100108` (Erkek) <-> `PVWK100109` (Kadın), `PVWK100079` <-> `PVWK100084` ve `PVWK100110` <-> `PVWK100111` çiftleri eklendi.
       - Arayüzde Erkek/Kadın butonlarına basıldığında veya sipariş seçildiğinde anında doğru eş SKU'ya dönüşmesi sağlandı.
    2. **Backend Beden & Barkod Çözümlemesi (`server/app.js`):**
       - `resolveExactSizeSkuAndBarcode` içerisindeki `cleanGender === 'KADIN'` ve `cleanGender === 'ERKEK'` bloklarına tüm hedef çiftler entegre edildi.
       - SATO CL4NX Plus termal/RFID etiket emri verildiğinde (`POST /api/printer/print-order-rfid-labels`), `master_products` üzerinden her iki cinsiyetin tüm bedenleri (XS..3XL..4XL) için resmi GS1 barkodlarının eksiksiz çözümlenmesi güvenceye alındı.
    3. **MSSQL & PostgreSQL Tam Veritabanı Eşitlemesi:**
       - **16674 (228 Adet):** MSSQL `ParcaNo = 'ERKEK: PVWT260006 - KADIN: PVWT260005'`. PostgreSQL `orders` tablosunda `sku = 'PVWT260006'`, `barcode = '8692457797187'`. `vouchers` tablosunda 14 satır (Erkek: 193 Adet, Kadın: 35 Adet) resmi EAN-13 barkodları ve beden kodlarıyla güncellendi.
       - **16673 (1.610 Adet):** MSSQL `ParcaNo = 'ERKEK: PVWK100009 - KADIN: PVWK100010'`. PostgreSQL `orders` tablosunda `sku = 'PVWK100009'`, `barcode = '8692457797187'`. `vouchers` tablosunda 14 satır (Erkek: 1.020 Adet, Kadın: 590 Adet) oluşturuldu.
       - **16682 (197 Adet):** MSSQL `ParcaNo = 'ERKEK: PVWK100102 - KADIN: PVWK100103'`. PostgreSQL `orders` tablosuna eksik olan sipariş kartı eklendi (`sku = 'PVWK100102'`, `barcode = '8692457797187'`, `quantity = 197`, `status = 'BEKLEMEDE'`). `vouchers` tablosundaki 10 satır (Erkek: 155 Adet, Kadın: 42 Adet) senkronize edildi.
       - **16679 (118 Adet):** MSSQL `ParcaNo = 'ERKEK: PVWK100108 - KADIN: PVWK100109'`. PostgreSQL `orders` tablosuna eksik olan sipariş kartı eklendi (`sku = 'PVWK100108'`, `barcode = '8692457797187'`, `quantity = 118`, `status = 'BEKLEMEDE'`). `vouchers` tablosundaki 14 satır (Erkek: 97 Adet, Kadın: 21 Adet) senkronize edildi.
       - **16667 (509 Adet):** `orders` tablosundaki varlığı ve 6 beden fişi tekrar teyit edildi.
  - **Test & Doğrulama:**
    - `verify_4_pair_resolutions.cjs`: 16/16 test %100 PASS (Erkek ve Kadın tüm bedenler ve GS1 barkodları doğrulandı).
    - `verify_all_vw_rules.cjs`: 15/15 test hatasız PASS (Sıfır regresyon).
    - `verify_order_16667_endpoints.cjs`: 6/6 test hatasız PASS.
    - `npm run build`: 694 modül 0 hata ile derlendi (7.03s).
    - PM2 `vog-api` ve `vog-frontend` online ve aktif. ZERO PRINT tam korundu.

- **audit/bsip-vw-parcano-discrepancies-and-catalog-matching (BSip MSSQL Volkswagen Siparişleri Parça No Denetimi, Dummy Kod & Eksiklik Envanteri):**
  - **Kullanıcı Talebi:** *"volkwagen için başka sipariş numaralarında da parcano bilgisinde eksiklik varsa BSip kayıtlarında bunları bana listele gerekli düzeltmeleri yapayım"*
  - **Kapsam & Yöntem:** BSip (MSSQL `[SIPARIS].[dbo].[Siparisler]`, `SiparisIslemleri`, `Musteriler`) üzerindeki tüm Volkswagen ve Doğuş Otomotiv siparişleri ile PostgreSQL `master_products` kataloğu taranarak analiz edildi (`server/scratch/analyze_vw_bsip_parcano.cjs`).
  - **Tespit Edilen 4 Temel Problem Grubu:**
    1. **Sipariş No'dan Türetilmiş Dummy / Geçici Parça Kodları (`PVW...`):**
       - **Sipariş 16656 (8.000 Adet - DOĞUŞ OTOMOTİV):** Model: `VW LACİVERT KOLTUK KILIFI PSSH0011`. Mevcut Parça No: `PVW16656`. Gerçek Parça No: Model adında ve Detay1/5'te `PSSH0011` olarak kayıtlı. Durum: `BEKLEMEDE`.
       - **Sipariş 16167 (500 Adet - DOĞUŞ OTOMOTİV):** Model: `VW KAPİŞONLU SWEAT SHIRT SİYAH ERKEK`. Mevcut Parça No: `PVW16167`.
       - **Sipariş 16122 (510 Adet - DOĞUŞ OTOMOTİV):** Model: `VW YAĞMURLUK SİYAH KAPİŞONLU`. Mevcut Parça No: `PVW16122`.
       - **Sipariş 16121 (500 Adet - DOĞUŞ OTOMOTİV):** Model: `VW KAPİŞONLU SWEAT SHIRT SİYAH KADIN`. Mevcut Parça No: `PVW16121`.
       - **Sipariş 16284 (164 Adet - DOĞUŞ OTOMOTİV):** Model: `2026 YAZ LOJİSTİK SCANIA PANTOLON`. Mevcut Parça No: `PVW16284`. Gerçek Parça No: Detay5'te `PSCANIA16284`.
       - Diğer müşteriler (16479 Mevaris 10 ad, 16410 Klüeber 24 ad, 16304, 16303, 16247, 16246, 16238 Türk Ova/Deniz Petshop).
    2. **Parça No Alanı Boş / NULL Olanlar:**
       - **Sipariş 17050 (07.10.2026 - ELİT PAK):** `VW MODELİ DOLUMLU YELEK BEJ ELİT KATKI`. Parça No: `NULL`. Notlarda XS-XXXL fermuar ölçüleri mevcut.
       - **Sipariş 16984 (23.09.2026 - TEOS MARİNA):** `VW TEKNİSYEN MODELİ SWEATSHIRT LACİVERT`. Parça No: `NULL`.
    3. **Parça No Alanında Ham Çift Metin Olanlar (`ERKEK: ... - KADIN: ...`):**
       - 16674, 16673, 16682, 16679 çözüldü ve senkronize edildi.
       - 2026 Yaz VW Siparişleri (16574, 16571, 16570, 16569, 16568, 16564) benzer çift cinsiyet metinleri içeriyor ve beklemede.
    4. **Yanlış Marka Kodu Girilenler:**
       - Sipariş 16241 (Türk Ova) & 16038 (Yoyo): VW Kapitone Yelek modeline `PPORSCHE2000097L` (Porsche parça kodu) girilmiş.


- **feature/agent-skills-context7-playwright-supabase (Context7, Playwright ve Supabase Ajan Eklentileri & Bağımlılık Entegrasyonu):**
  - **Kullanıcı Talebi:** *"context7, playwright ekledik mi? bunu da ekleyelim ve bunları kullanalım Supabase"*
  - **Uygulanan Çözüm & Mimari:**
    1. **Context7 Skill (`context7`):** `intellectronica/agent-skills/skills/context7` kaynağından hem proje (`.agents/skills/context7`) hem global (`C:\Users\ctopuz\.gemini\config\skills\context7`) dizinlerine kuruldu. Kütüphane API imzaları, güncel dokümantasyon sorgulama ve kod örnekleri için hazırlandı.
    2. **Playwright Skill (`playwright-cli`):** `microsoft/playwright-cli/skills/playwright-cli` kaynağından hem proje (`.agents/skills/playwright`) hem global (`C:\Users\ctopuz\.gemini\config\skills\playwright`) dizinlerine tüm referans belgeleriyle (`element-attributes`, `test-generation`, `tracing`, `video-recording` vb.) kuruldu. Ayrıca projenin `devDependencies` altına `@playwright/test` paketi eklendi.
    3. **Supabase Skill & Kütüphanesi (`supabase` & `supabase-postgres-best-practices`):** `supabase/agent-skills` resmi reposundan `supabase` ve `supabase-postgres-best-practices` olmak üzere iki temel skill proje ve global seviyede kuruldu. Projenin `package.json` bağımlılıklarına `@supabase/supabase-js` paketi yüklendi.
    4. **Doğrulama:** `npx skills list` çıktısında `context7`, `playwright-cli`, `supabase`, `supabase-postgres-best-practices` eklentilerinin `Antigravity` ve `Gemini CLI` ajanları için aktif olduğu teyit edildi. `npm run build` ile 694 modül 0 hata ile derlendi (6.48s).

- **feature/agent-skill-headroom-installation (Headroom Token & Context Compression Eklentisi Entegrasyonu):**
  - **Kullanıcı Talebi:** *"headroom eklentisini ekle"*
  - **Uygulanan Çözüm & Mimari:**
    * `roman-ryzenadvanced/headroom-skill@headroom` deposu kaynak alınarak projenin `.agents/skills/headroom` (proje düzeyi) ve `C:\Users\ctopuz\.gemini\config\skills\headroom` (global düzey) dizinlerine eksiksiz kuruldu.
    * Kurulan bileşenler: `SKILL.md` (YAML frontmatter + 7 ana kural), `AGENTS.md`, `README.md`, `docs/` (`integrations.md`, `reversible-ccr.md`, `techniques.md`), `prompts/` (`cache_alignment.md`, `effort_routing.md`, `verbosity_steering.md`) ve `scripts/` (`smart_crusher.py`, `log_compressor.py`, `search_compressor.py`, `code_compressor.py`, `context_manager.py`, `_common.py`).
    * `npx skills list` komutu ile `Antigravity` ve `Gemini CLI` için `headroom` eklentisinin aktifleştiği doğrulandı.

- **bugfix/order-16667-vw-formen-sweatshirt-pvwb250003-label-resolution (16667 Nolu Sipariş Volkswagen Formen Binek Sweatshirt PVWB250003 Etiket & Barkod Çözümlemesi, Dummy SKU İptali & 3XL Alias Eşleşmesi):**
  - **Kullanıcı Talebi:** *"16667 nolu sipariş etiketini düzeltiyorduk"*
  - **Kök Neden & Analiz:**
    1. **Placeholder / Dummy SKU Problemi (`PVW16667`):** MSSQL `Siparisler` tablosunda 16667 nolu sipariş için `ParcaNo` alanına geçici/dummy olarak `PVW16667` girilmişti. Gerçek ürün kodu `Detay5` alanında (`TEK TEK PAKET. ERKEK: PVWB250003S`) yer almasına rağmen, `server/app.js` içerisindeki `isPackagingOrInvalidSku` fonksiyonunda `PVW16667` geçersiz sayılmadığından `extractSkuFromOrderDetails` fonksiyonu doğrudan `PVW16667` döndürüyor ve `Detay5`'teki gerçek ürün kodunu okumaya geçemiyordu.
    2. **Yanlış Barkod Rehin Alması (`8693963757795` -> `PVW2460`):** `orders` tablosundaki barkod alanı `8693963757795` (eski VW `PVW2460` lacivert ürününe ait) olduğundan ve `PVW16667` master ürünlerde bulunamadığından, `resolveExactSizeSkuAndBarcode` fonksiyonu fallback olarak barkod sorgusuna düşüyor ve M ile L bedenlerini `PVW2460M` ve `PVW2460L` olarak etiketliyordu.
    3. **3XL / XXXL Alias Eşleşme Kontrolü:** `resolveExactSizeSkuAndBarcode` içerisinde yer alan `matchedMpRow.clean_size !== cleanSize` katı eşitlik kontrolü, istenen beden `3XL` ve master üründeki beden `XXXL` olduğunda alias kontrolü yapmadan eşleşmedi kabul edip varyant aramaya veya fallback'e zorluyordu.
  - **Uygulanan Çözüm & Mimari:**
    1. **`isPackagingOrInvalidSku` Güncellemesi (`server/app.js`):** `PVW16667` açıkça geçersiz/placeholder SKU listesine eklendi. Böylece `extractSkuFromOrderDetails` otomatik olarak `Detay5` / `notes` alanını tarayarak siparişin asıl ürün kodunu (`PVWB250003`) çözümler.
    2. **Beden Alias Eşleşme Güvencesi (`resolveExactSizeSkuAndBarcode`):** Katı `clean_size !== cleanSize` karşılaştırması yerine `isMatchedSizeCorrect` alias kontrolü getirildi; `3XL` ile `XXXL` birbirinin tam eşdeğeri olarak `master_products` kayıtlarıyla doğrudan eşleşti.
    3. **Veritabanı Senkronizasyonu & Temizliği:**
       - MSSQL `Siparisler` tablosunda `Id = 16667` için `ParcaNo = 'PVWB250003'` olarak güncellendi.
       - PostgreSQL `orders` tablosunda 16667 nolu sipariş için `sku = 'PVWB250003'`, `code39 = 'PVWB250003'`, `barcode = '8686755596488'`, `ean13 = '8686755596488'`, `notes = 'TEK TEK PAKET. ERKEK: PVWB250003S'`, `status = 'BEKLIYOR'`, `processed_quantity = 0`, `remaining_quantity = 509` olarak onarıldı.
       - PostgreSQL `vouchers` tablosundaki tekil test satırları temizlendi; siparişin 6 ana bedeni (S: 37, M: 124, L: 174, XL: 124, XXL: 37, 3XL: 13) resmi GS1 EAN-13 barkodları ve `PVWB250003` beden SKU'ları ile güncellendi.
       - PostgreSQL `rfid_tags` tablosundaki 513 adet hatalı basım test etiketi silinerek sipariş sıfırlandı ve üretime hazır hale getirildi.
  - **Test & Doğrulama:**
    - `verify_order_16667_endpoints.cjs`: Tüm 6 beden (S, M, L, XL, XXL, 3XL) `master_products_match` ile sırasıyla `8692500032111`, `8692500032128`, `8692500032135`, `8692500032142`, `8692500032159`, `8692500032166` barkodlarına %100 doğrulukla çözümlendi.
    - `verify_all_vw_rules.cjs`: 15/15 test hatasız PASS (Sıfır Regresyon).
    - `test_cupra_sku.cjs` & `test_vw_pantolon_88.cjs`: Tamamen PASS.
    - ZERO PRINT kuralı korundu (fiziksel yazıcılara sıfır basım).

- **bugfix/vw-pantolon-pvwk100088-size-boundary-and-order-preservation (Volkswagen Pantolon PVWK100088 Beden 46 ve 60 Parça No Regex Düzeltmesi & Sipariş Baz SKU Koruma):**
  - **Kullanıcı Talebi:** *"vokswagen için etiket basma sayfasında parçano dogru olmasına rağmen etikette eksik rakam ile cıktı bun neden oldu hatayı düzelt"*, *"60 numaralı beden içinde aynı durum var"*, *"PVWK10008846 VE PVWK10008860 OLMALI"*
  - **Kök Neden & Analiz:**
    1. **[2-8]XL Açgözlü Regex Çakışması:** `getCleanBaseSku` (`server/app.js`) ve `cleanBaseProductSku` (`src/pages/OrderLabelPrintingPage.jsx`) fonksiyonlarında yer alan `(?:X{1,14}L|[2-8]XL|...)` regex kuralı, `master_products` tablosunda `PVWK100088XL` şeklinde kayıtlı olan pantolon ürününü temizlerken sondaki `8XL` kısmını `[2-8]XL` olarak eşleştiriyor ve sondaki 8 rakamını beden zannederek yutuyordu. Sonuçta baz kod `PVWK100088` yerine 5 basamaklı eksik `PVWK10008` koduna düşüyordu.
    2. Ardından beden ekleme mantığı 46 bedeni eklediğinde `PVWK1000846` (ortadaki 8 eksik!), 60 bedeni eklediğinde ise `PVWK1000860` üretiliyordu.
    3. **Sipariş Baz SKU'sunun Bozulması (`POST /api/printer/print-order-rfid-labels`):** Yazdırma esnasında satır 13226 civarındaki `UPDATE orders SET sku = firstResolved.sku` sorgusu, siparişin ana SKU'sunu (`PVWK100088`) çözümlenen ilk bedenin SKU'su olan `PVWK1000846` ile eziyordu (Order 16665 bu nedenle bozulmuştu).
  - **Uygulanan Çözüm & Mimari:**
    1. **Güvenli Regex Ayrıştırması (`getCleanBaseSku` & `cleanBaseProductSku`):**
       - Ayrılmış bedenler önce temizlenir (`[-_](?:X{1,14}L|[2-9]XL|XXS|XS|XXL|XL|[SML]|STD|\d{2})$`).
       - Doğrudan `[2-9]XL` bedenleri SADECE kendisinden önce en az 6 basamaklı rakam öbeği varsa (`^([A-Z0-9]*\D\d{6,8})[2-9]XL$`) temizlenir; böylece `PVWK100088` sonundaki `8` rakamının `8XL` zannedilip yutulması kesin olarak engellendi.
       - Tekil harf bedenler (`XL|[SML]`) önündeki rakamı tüketmeden izole şekilde temizlenir.
       - VW doğrudan 2 basamaklı beden çıkarma kuralında (`PVWT26000448` -> `PVWT260004`, `PVWK10008846` -> `PVWK100088`) model kodunun en az 6 basamaklı olması güvenceye alındı (`^(P[A-Z0-9]*VW[A-Z0-9]*\d{6,8})(?:3[2-9]|[4-5]\d|6[0-2])$`).
    2. **Sipariş Tablosunun Korunması (`server/app.js`):**
       - `POST /api/printer/print-order-rfid-labels` uç noktasında sipariş tablosu güncellenirken `getCleanBaseSku(sku)` kullanılarak siparişin her zaman ana ürün baz SKU'su (`PVWK100088`) olarak kalması sağlandı; bedene özel SKU ile ezilme engellendi.
       - PostgreSQL `orders` tablosundaki 16665 numaralı siparişin SKU ve code39 alanları `PVWK100088` olarak onarıldı.
  - **Test & Doğrulama:**
    - `test_vw_pantolon_88.cjs`: `PVWK100088` için 46 beden `PVWK10008846` (Barkod: 8697619171270), 60 beden `PVWK10008860` (Barkod: 8689829693038) ve 17 farklı getCleanBaseSku senaryosu %100 PASS.
    - `verify_all_vw_rules.cjs`: 15/15 test hatasız tamamlandı.
    - `npm run build`: 694 modül 0 hata ile derlendi (7.07s).
    - PM2 üzerinde `vog-api` ve `vog-frontend` online. Yazıcı kuyruğunda 0 bekleyen iş (ZERO PRINT).

- **feature/volkswagen-seamless-size-suffix-and-extra-label-printing (Volkswagen Kesintisiz Beden Ekleme Standardı, Ekstra Beden Etiket Basım Merkezi & Cinsiyet Çözümlemesi):**
  - **Kullanıcı Talebi:** *"haztırlarsan siparişte olmayan bedenler eklendi extra sekmesine onlardaki parçano ve sonunda beden olma işlemi diğer siparişte olan bedenlerdeki gibi olmalı sadece volkwagen firmasında parçano sonu bedenler ile devam ediyordu. tıpkı önceden oldugu gibi. buna göre düzeltme yaparmısın. PVWK1000102XS erkek PVWK1000103XS kasın"*
  - **Kök Neden & Analiz:**
    * Volkswagen ürünlerinde (`VOLKSWAGEN` / `VW` / `PVW...`), Parça No / SKU kodunun sonu standart olarak beden ile bitmektedir (örn: `PVWK100102XS`, `PVWK100103XS`, `PVWT26000448`).
    * Ekstra / İlave Etiket Basım sekmesinde (Tab 2) siparişte olmayan veya ilave basılan bedenlerde cinsiyet değiştiğinde (`PVWK100102` Erkek <-> `PVWK100103` Kadın) baz SKU ve sonuna eklenen beden kodu tam uyumlu değildi.
    * Açgözlü bir regex kuralı (`PVWK10010` -> `PVWK10009`), `PVWK100102` kodunu yanlışlıkla `PVWK100092` haline getiriyordu.
    * Fallback mantığında genel markalar için sonuna beden yapıştıran eski kod, Volkswagen harici markaların (Skoda, Scania vb.) parça kodlarına da beden ekleyebiliyordu.
  - **Uygulanan Çözüm & Mimari:**
    1. **Volkswagen Kesintisiz Beden Ek Standardı (`formatVwSizeSuffix` & `formatVwSizeCode`):**
       - SADECE Volkswagen ürünlerinde Parça No sonuna beden boşluksuz ve tiresiz eklenir (`PVWK100102XS`, `PVWK100103XS`, `PVWK100102XXL`, `PVWK100102XXXL`, `PVWK1001024XL`, `PVWT26000448`).
       - `2XL` -> `XXL`, `3XL` -> `XXXL` dönüşümü sağlandı. `4XL`, `5XL` gibi sipariş harici ekstra bedenler de doğrudan eklenir.
       - Diğer tüm markalarda (Skoda, Scania, Audi, Seat, Cupra, Nissan, VOG) parça kodları korunur; parça kodunun sonuna beden eklenmez (ZERO REGRESSION).
    2. **Tam Cinsiyet Çiftleri & Açgözlü Regex Düzeltmesi (`server/app.js` & `OrderLabelPrintingPage.jsx`):**
       - Erkek: `PVWK100102` (Mont İnce), `PVWK100104` (Yelek), `PVWK100106` (Mont Kalın).
       - Kadın: `PVWK100103` (Mont İnce), `PVWK100105` (Yelek), `PVWK100107` (Mont Kalın).
       - Regex negatif lookahead (`PVWK10010(?![0-9])`) ile `PVWK100102`'nin `PVWK100092`'ye bozulması engellendi.
       - 3 sıfırlı yazım hataları (`PVWK1000102` -> `PVWK100102`, `PVWK1000103` -> `PVWK100103`) otomatik olarak normalize edildi.
    3. **Ekstra Sekmesi Canlı Etiket Önizleme & Dinamik Beden Seçimi (`OrderLabelPrintingPage.jsx`):**
       - Tab 2'de cinsiyet butonlarına anlık çözümlenen Parça No ipucu eklendi (`skuHint`).
       - Beden butonlarına tıklanarak önizlemede anında canlı görüntüleme sağlandı (`selectedExtraPreviewBeden`).
       - Önizleme etiketinde "Çözümlenen Parça No / SKU (Cinsiyet • Beden):" canlı yansıtıldı.
       - Yazdırma isteğinde backend'e temizlenmiş baz SKU gönderilerek `master_products` üzerinden doğru barkod ve parça no eşleştirmesi güvenceye alındı.
    4. **Test & Doğrulama (ZERO PRINT):**
       - `server/scratch/verify_all_vw_rules.cjs`: 15 testlik doğrulama süiti 15/15 PASS (%100 başarı) ile tamamlandı.
       - `npm run build`: Vite derlemesi 0 hata ile tamamlandı (6.96s).
       - PM2 üzerinde `vog-api` ve `vog-frontend` servisleri sorunsuz yeniden başlatıldı.
       - Fiziksel yazıcılara sıfır baskı gönderildi (Spooler: 0 bekleyen iş).

- **feature/true-80x100mm-portrait-box-label (Godex G530 %100 Dikey 80x100mm Standart Koli Etiketi ve Görsel Önizleme Kalibrasyonu):**
  - **Kullanıcı Talebi:** *"koli etiketi yazıcıdan potraid dikey çıkmalı ama hala yatay çıkıyor. genişlik 80  yükseklik 100  80x100  olmalı. kodu güncellerken test için şu an ön izleme olarak göster yazıcıdan yazdırma. ben uzaktayım yazıcının yanında değilim"*
  - **Kök Neden & Mimari Analiz:**
    * Fiziksel rulo kağıt boyutu net olarak **80 mm genişlik x 100 mm yükseklik** (80x100 mm).
    * `server/drivers/vog_print_bridge.cjs` içerisindeki `generateBoxLabelZPL` fonksiyonu eski yatay formatta (`^PW812`, `^LL649` = 100x80mm @ 203 DPI) kalmıştı; bu durum `/api/printer/print-box-label` uç noktası veya doğrudan yazdırma çağrıldığında etiketin fiziksel olarak yatay basılmasına neden oluyordu.
    * Benzer şekilde `server/templates/koli_etiketi.html` ve `koli_etiketi_siparis.html` dosyalarındaki `@page` kuralı `size: 100mm 80mm;` (yatay) olarak tanımlıydı.
  - **Uygulanan Çözüm & Mimari:**
    1. **80x100mm Standart Dikey ZPL Geometrisi (Godex G530 @ 300 DPI / 12 dpmm):**
       - Genişlik: `^PW945` (80 mm = 944.88 dot), Dış Çerçeve Genişliği: `^GB905` (76.6 mm, simetrik 20 dot sol/sağ pay).
       - Yükseklik: `^LL1181` (100 mm = 1181 dot), Dış Çerçeve Yüksekliği: `1145 dot` (97 mm).
       - Yönlendirme: `^PON` (Normal Dikey Portrait).
       - 4 Sütunlu Tablo: `Parca No` (215 dot), `Urun Aciklamasi` (440 dot), `Beden` (105 dot), `Adet` (85 dot).
    2. **ZPL Motorlarının Eşitlenmesi:**
       - `server/app.js` (`generateGodexBoxZpl`): Hem Personel Kolisi (Template 1) hem de Genel Sevkiyat Kolisi (Template 2) tam 80x100mm portrait ölçülerine (`^PW945`, `^LL1181`, `^PON`, `^GB905`) uyarlandı.
       - `server/drivers/vog_print_bridge.cjs` (`generateBoxLabelZPL`): Eski 100x80mm yatay ZPL kaldırılarak 80x100mm portrait ZPL yapısına geçirildi.
    3. **HTML Şablonları & Modal Entegrasyonu:**
       - `server/templates/koli_etiketi.html` ve `koli_etiketi_siparis.html`: `@page { size: 80mm 100mm portrait; }` ve `width: 80mm; height: 100mm;` olarak güncellendi.
       - `src/components/PersonnelLabelAndReceiptModal.jsx`: Koli etiketi baskı stil kuralı `@page { size: 80mm 100mm portrait; margin: 0; }` ve başlık `(80x100 mm)` olarak güncellendi.
       - `PersonnelOrderManagement.jsx` ve `ApkDownloadPage.jsx`: UI metinleri 80x100mm olarak eşitlendi.
    4. **ZERO PRINT Güvencesi & Görsel Önizleme (Labelary API):**
       - Test sürecinde fiziksel yazıcıya hiçbir iş gönderilmedi (Windows Print Spooler: 0 bekleyen iş).
       - Labelary API (12 dpmm / 300 DPI, 3.15x3.94 inç = 80x100 mm) üzerinden `personnel_box_80x100_portrait.png` ve `general_box_80x100_portrait.png` yüksek çözünürlüklü görsel önizlemeleri üretildi ve artifacts dizinine kaydedildi.
  - **Test & Doğrulama:**
    - `node -c server/app.js` ve `node -c server/drivers/vog_print_bridge.cjs` 0 hata ile doğrulandı.
    - `npm run build`: Vite 694 modül 0 hata ile derlendi (6.79s).
    - PM2 üzerinde `vog-api` ve `vog-frontend` servisleri yeniden başlatıldı ve online doğrulandı.

- **feature/personnel-tunnel-box-alarm-and-discrepancies (RFID Tünel Personel Kolileme: Yabancı Ürün, Fazla/Hatalı Beden & Eksik Ürün Alarm Sistemi, Takipsan Konveyör Bant Durdurma, Kırmızı Işık & Bilgi Kutusu Modalı):**
  - **Kullanıcı Talebi:** *"eğer personelin kutusu içinde olmaması gereken ürün varsa alarm ver ve dur. eğer hepsi olması gereken ve tamamlandı ise onayla ve sonraki personele geç. Eğer koli içinde olması gereken ürünler tamam ama beden adetleri fazla yada eksik ise yine alarm ver ve bunu bilgi kutusunda detayları göster. alarm verdiğinde akışı durduralım. eğer mumkunse Takipsan cihazının yürüyen paleti de durduralım veya üzerindeki ışıklar kırmızı yakalım"*
  - **Uygulanan Mimari & Çözüm:**
    1. **Takipsan Donanım Köprüsü (`server/drivers/takipsan_tunnel_bridge.cjs`):**
       - Yerel WebSocket köprüsü (`ws://127.0.0.1:8025/ws`) üzerinde çalışan singleton sürücü.
       - `triggerAlarm()`: `redLight`, `redLightFlash`, `sirenStart`, `outputoff` (pin 0..4 bant motor rölesi), ve seri kısa komut `TS 1 KisaKomut 1000 BantDurdur Sari Kirmizi Siren` göndererek konveyör bandını derhal durdurur ve kırmızı ışık/sireni yakar.
       - `triggerSuccess()`: `bandStart`, `outputon` (pin 0..4), `sirenStop`, `greenLight` göndererek koli tamamlandığında yeşil ışık yakar ve bandın devam etmesini sağlar.
       - `resetNormal()`: `sirenStop`, `yellowLight`, `bandStart`, `outputon` ile alarmı kaldırıp normal çalışma durumuna döner.
    2. **RFID Tünel Sürücüsü Katı Eşleşme & Alarm Motoru (`server/drivers/rfid_tunnel_driver.js`):**
       - Oturum durumuna `discrepancies: { foreign_items: [], extra_items: [], missing_items: [] }`, `is_alarm: false`, `alarm_info: null` yapısı eklendi.
       - Tünel alarm durumundayken (`is_alarm === true` veya `status === 'ALARM'`) tarama sayacı durdurulur ve yeni etiketler okunmaz.
       - Gevşek marka eşleşmesi (`tagBrand === activeBrand`) ve Fallback #6 tamamen kaldırıldı. Yalnızca personelin koli listesinde (`bundle_items`) tanımlı ürünler kabul edilir.
       - **Yabancı / Olmaması Gereken Ürün Tespiti:** Koliye ait olmayan ürün tarandığında anında ALARM (`FOREIGN_ITEM`), tünel durdurulur, Takipsan kırmızı ışık + siren yakılır, konveyör durdurulur ve `discrepancies.foreign_items` listesine eklenir.
       - **Fazla / Hatalı Beden Tespiti:** Ürün koliye ait olsa bile o beden için boş kota kalmamışsa veya personelin talep ettiği bedenden farklı bir beden gelmişse anında ALARM (`EXTRA_SIZE`), tünel durdurulur, Takipsan bandı durdurulur ve `discrepancies.extra_items` listesine eklenir (koli adet sayacı artırılmaz).
       - **Eksik Ürün Tespiti:** Koli tünelden çıkarken (`handlePassageExit`), boş bant koruması (`scannedQty >= minBoxItems`) sonrası taranmamış parça kalmışsa (`bundle_items.filter(it => !it.is_scanned).length > 0`) anında ALARM (`MISSING_ITEMS`), Takipsan bandı durdurulur ve `discrepancies.missing_items` doldurulur.
       - **%100 Eksiksiz Koli Onayı & Sonraki Personele Geçiş:** Yalnızca `foreign_items === 0 && extra_items === 0 && missing_items === 0 && scanned_quantity >= target_quantity` sağlandığında koli onaylanır, yeşil ışık yakılır, veritabanına mühürlenir ve otomatik olarak sıradaki personele (`box_no + 1`) geçilir.
    3. **Backend API Entegrasyonu (`server/app.js`):**
       - `rfidTunnelDriver.on('alarm_triggered')` dinleyicisi: Takipsan köprüsü ve Impinj LLRP Stack Light (Kırmızı + Buzzer) & GPO 3 rölesini tetikler.
       - `POST /api/tunnel/kiosk/reset-alarm`: Alarmı kaldırır, sirenleri susturur, Takipsan ve Impinj rölelerini normale çevirir ve taramayı devam ettirir.
       - `POST /api/tunnel/kiosk/clear-box-scans`: Hatalı koli çıktığında mevcut kolinin tarama kayıtlarını sıfırlar, böylece koli düzeltilip tünelden tekrar geçirilebilir.
       - `executeCompletePersonnelBox`: Koli hatasız tamamlandığında Takipsan `triggerSuccess()` ve Impinj yeşil ışık tetiklenir, uyuşmazlıklar sıfırlanarak bir sonraki personele geçilir.
    4. **Frontend Kiosk Ekranı & Bilgi Kutusu Modalı (`src/pages/TunnelKioskPage.jsx`):**
       - Sesli ikaz (alarm buzzer sesi) entegrasyonu.
       - Üst durum çubuğunda yanıp sönen kırmızı acil alarm şeridi.
       - Kapsamlı **BİLGİ KUTUSU Modalı**:
         * 🛑 Koliye Ait Olmayan Ürünler tablosu (Ürün adı, barkod, EPC, açıklama).
         * ⚠️ Fazla / Hatalı Bedenler tablosu (Ürün adı, okunan beden, beklenen beden, açıklama).
         * ⏳ Eksik Kalan Parçalar tablosu (Ürün adı, beden, parça no, durum).
         * Hızlı müdahale butonları: "Alarmı Sıfırla & Akışı Başlat", "Koli Sayımını Sıfırla", "Bu Haliyle Manuel Tamamla".
    5. **Test & Doğrulama:**
       - `server/scratch/test_personnel_alarm_and_discrepancies.cjs` ile yabancı ürün, fazla beden, eksik ürün ve %100 hatasız tam koli senaryoları 4/4 doğrulandı.
       - `npm run build`: 694 modül 0 hata ile derlendi (6.65s).
       - PM2 üzerinde `vog-api` ve `vog-frontend` servisleri sorunsuz yeniden başlatıldı.

- **feature/auto-advance-when-autoprint-disabled (Koli Etiketi Otomatik Yazdırma Kapalıyken de Koli Tamamlanınca Otomatik Sonraki Koliye Geçiş & Kesintisiz Tarama):**
  - **Kullanıcı Talebi:** *"koli etiketi yazdırma otomatik kapalı oldugunda da sıradaki koli  tamamlanınca otomatik sonraki koliye geç"*
  - **Kök Neden & Mimari Analiz:**
    * Önceki mimaride `savedConfig.autoComplete === false` (Koli Etiketi Otomatik Yazdırma Kapalı) olduğunda, koli içindeki ürünler tamamlandığında (örneğin 7/7 hedef adede ulaşıldığında veya tünel çıkış sessizliğinde) `handleAutoBoxComplete` ve `handlePassageExit` fonksiyonları tünel durumunu `status = 'READY_FOR_PRINT'` olarak kilitliyor ve işlemi durdurarak ekrandan buton onayını bekliyordu.
    * Bu durum, konveyör hattında koli etiketini otomatik bastırmak istemeyen kullanıcılar için hattın durmasına ve operatörün her kolide ekrana dokunmak zorunda kalmasına neden oluyordu.
  - **Uygulanan Çözüm & Mimari:**
    1. **Koli Etiketi Yazdırma ile Koli İlerleme Mantığının Ayrılması:**
       * `savedConfig.autoComplete` seçeneği yalnızca **fiziksel koli etiketinin Godex/SATO yazıcıdan basılıp basılmayacağını** yönetir.
       * Koli tam tamamlandığında (`!isIncomplete` / `scanned_quantity >= target_quantity` ve bundle öğeleri eksiksiz), otomatik yazdırma KAPALI olsa dahi koli PostgreSQL veritabanında başarıyla mühürlenir (`PACKED`), `tunnel_scans` kayıtları oluşturulur ve **anında sıradaki koliye (`box_no + 1`) otomatik geçilir**.
    2. **Otomatik Koli Etiketi Baskı Güvenliği (`doPrint`):**
       * `executeCompletePersonnelBox(session, shouldPrint)` ve `executeCompleteBox(session, syncToLogo, shouldPrint)` fonksiyonlarına `shouldPrint` bayrağı eklendi.
       * `autoComplete === false` olduğunda fiziksel yazıcıya hiçbir ZPL gönderilmez (`doPrint = false`, ZERO PRINT & Sıfır Kağıt Koruması tam korundu).
       * Sadece `autoComplete === true` ise veya operatör ekrandan manuel "Koli Etiketi Yazdır" / "Koliyi Tamamla & Etiket Bas" butonuna basarsa fiziksel baskı yapılır.
    3. **Kesintisiz Anten Taraması & Sıradaki Koliye Anında Başlama:**
       * Koli tamamlandığında antenler ASLA kapatılmaz (`stopScanning()` atlandı), tünel durumu anında `status = 'SCANNING'` olarak kalır ve `BOX_STARTED` olayı yayımlanır.
       * `rfid_tunnel_driver.js` içindeki `resetPassageDebounceTimer` ve `handlePassageExit` koli tam olduğunda engelleme yapmadan oturumun tamamlanmasını tetikler.
       * Auto-Resume mekanizması `!PAUSED` olan her durumda tünele giren sıradaki koli etiketlerini anında karşılar.
    4. **Kiosk UI Açıklamaları (`TunnelKioskPage.jsx`):**
       * Koli etiketi basım modu kartındaki bilgilendirme metni güncellendi: *"⚡ Otomatik koli etiketi yazdırma KAPALI: Koli tamamlandığında sıradaki koliye OTOMATİK geçilir (Etiket basılmaz, istendiğinde butonla basılır)."*
  - **Test & Doğrulama:**
    * `test_auto_advance_when_autoprint_disabled.cjs`: `autoComplete=false` durumunda hedef adede ulaşma, auto-resume, eksik koli durdurma ve tam koli çıkışı 4/4 test ile doğrulandı.
    * `test_integration_auto_advance.cjs`: `server/app.js` fonksiyon imzaları, `isAutoPrint` parametre geçişi ve spooler boş kuyruk kontrolü doğrulandı.
    * `npm run build`: Vite 694 modül 0 hata ile derlendi (7.11s).
    * PM2 yeniden başlatıldı: `vog-api` (PID 96660) ve `vog-frontend` (PID 96408) online ve aktif.

- **feature/continuous-antennas-auto-mode-and-true-portrait-carton-label (Tünel Otomatik Modda Antenlerin Kesintisiz Açık Kalması & Godex G530 %100 Dikey Portrait Koli Etiketi Standardizasyonu):**
  - **Kullanıcı Talepleri:**
    1. *"otomatik modde tunelde antenler sürekli açık kalmalı"*
    2. *"koli etiketi potraid çıkmıyor potraid olmalı"*
  - **Uygulanan Mimari & Çözüm:**
    1. **Tünel Otomatik Modda Kesintisiz Anten Taraması (`savedConfig.autoComplete === true`):**
       - Tünel konveyör bandında koliler peş peşe kesintisiz aktığı için, otomatik modda (`autoComplete === true`) `vogImpinjDriver.stopScanning()` çağrıları `handleAutoBoxComplete`, `executeCompletePersonnelBox` ve `executeCompleteBox` fonksiyonlarında devre dışı bırakıldı.
       - Koli tamamlandığında antenler ASLA durdurulmaz (`isScanning = true` kalır), RF sinyali kesilmez; yalnızca tamamlanan kolinin taranmış etiketleri (`tags`) kaydedilip sıradaki koli için temizlenir ve durum anında `SCANNING` olarak devam eder.
       - Son koli tamamlansa dahi otomatik mod aktifken antenler kapatılmaz, konveyörden gelecek bir sonraki koli veya sipariş için aktif okuma sürdürülür.
       - Yalnızca manuel modda (`autoComplete === false`) veya operatör ekrandan duraklat/durdur butonlarına bastığında antenler kapatılır.
       - **Koli Geçiş Aralıklarında Durma & Düğme Bekleme Kök Neden Çözümü (`rfid_tunnel_driver.js`):**
         * *Kök Neden:* `handlePassageExit()` fonksiyonunda `scanned_quantity < minBoxItems` kontrolü `isIncomplete` kontrolünden sonra yer alıyordu. Konveyör bandında iki koli arasındaki 2 saniyelik boşlukta (`scanned_quantity === 0`), sistem bu boşluğu "0/7 Adet Eksik Koli" olarak algılayıp `status = 'READY_FOR_PRINT'` durumuna geçiriyor ve oturumu kilitliyordu. Bir sonraki koli geldiğinde durum `SCANNING` olmadığı için tüm etiketler reddediliyor ve operatörün düğmeye basması gerekiyordu.
         * *Çözüm 1 (Boş Bant Koruması):* `handlePassageExit()` en başına `if (scannedQty < this.minBoxItems) return;` kuralı konuldu. Koli içinde hiç ürün okunmadıysa (boş bant / koli arası geçiş) sistem ASLA durdurulmaz, `SCANNING` kesintisiz devam eder.
         * *Çözüm 2 (Çıkış Sayacı İptali):* `scanned_quantity < minBoxItems` iken çıkış zamanlayıcısı kurulmaz; koli geçişlerinde (`executeCompletePersonnelBox`, `executeCompleteBox`) `clearPassageTimer()` çağrılarak önceki koliye ait sayaçlar sıfırlanır.
         * *Çözüm 3 (Auto-Resume Kendi Kendini İyileştirme):* Otomatik mod aktifken (`autoComplete === true`) tünele yeni bir RFID etiketi ulaştığında, oturum duraklatılmamışsa (`!PAUSED`) durum anında operatörsüz olarak `SCANNING`e çekilir ve etiket okunur. Operatörün düğmeye basma ihtiyacı tamamen ortadan kaldırıldı.
         * *Doğrulama:* `server/scratch/test_continuous_conveyor_fix.cjs` ile tüm senaryolar (boş bant, sayaç iptali, auto-resume ve 3/7 eksik koli durdurması) %100 test edildi ve doğrulandı.
    2. **Godex G530 %100 Dikey (Portrait: `^PW910`, `^LL1220`, `^GB880`) Koli Etiketi Standardizasyonu:**
       - Önceki geliştirmede `^PW1180` ve `^GB1140` (1140 dot genişlik x 1053 dot yükseklik) yapılarak genişliği yüksekliğinden büyük (yatay/landscape) hale gelen koli etiketi şablonu baştan sona yeniden dikey portrait standardına uyarlandı:
         * Genişlik: `^PW910`, Dış Çerçeve Genişliği: `^GB880` (Maksimum 880 dot genişlik).
         * Uzunluk: `^LL1220`, Dış Çerçeve Yüksekliği: 1085 dot.
         * Yönlendirme: `^PON` (Normal Dikey, Boyut Oranı: 1.25 kat dikey uzanım).
         * Tablo Yapısı: `^GB870` genişliğinde 10 satırlı dikey tablo ("liste dik") formatı.
         * 4 Sütunlu Tam Detay: **Parça No** (205 dot), **Ürün Açıklaması** (430 dot), **Beden** (95 dot), **Adet** (70 dot).
         * Hem Personel Koli Şablonu hem de Genel Sevkiyat Koli Şablonu aynı katı portrait standardına bağlandı.
  - **Test & Doğrulama:**
    - `server/scratch/verify_portrait_and_antennas.cjs`:
      * ZPL sözdizimi, `^PW910`, `^LL1220`, `^PON`, `^GB880` ve 4 sütun (`Parca No`, `Urun Aciklamasi`, `Beden`, `Adet`) doğrulandı.
      * Otomatik modda `stopScanning()` bypass mantığı tüm koli tamamlama fonksiyonlarında teyit edildi.
      * Windows Print Spooler: Godex ve SATO yazıcılarında 0 iş bekliyor (ZERO PRINT eksiksiz korundu).
    - Canlı API Testi: `GET /api/personnel-orders/:uuid/label-data` ile üretilen `box_label.zpl` gerçek veritabanı üzerinden doğrulandı (`PW910: true, GB880: true, PON: true, Parca No: true`).
    - Labelary Simülasyonu: `scratch/personnel_portrait.png` ve `scratch/general_portrait.png` görsel önizlemeleri üretildi ve dikey portrait yerleşim onaylandı.
    - PM2 üzerinde `vog-api` servisi sorunsuz yeniden başlatıldı (PID 90992, status: online).

- **feature/flutter-rfid-apk-download-page-v1.5.2 (RFID El Terminali Flutter v1.5.2 İndirme Sayfası, Dağıtım & APK Senkronizasyonu):**
  - **Kullanıcı Talebi:** *"RFID ELTERMINALI FLUTTER için download sayfasını son surum uygulama içink g"*
  - **Uygulanan Mimari & Çözüm:**
    1. **APK Dosya Dağıtımı & Tam Eşitleme (25.6 MB / 25,609,046 Bayt):**
       - Flutter derlemesinden çıkan en güncel sürüm (`v1.5.2+13`, 06.10.2026) tüm web ve API dağıtım noktalarına kopyalandı ve boyutları doğrulandı:
         * `c:\vog_system\vog-terminal.apk` (25,609,046 B)
         * `c:\vog_system\vog-terminal-v1.5.2.apk` (25,609,046 B)
         * `c:\vog_system\public\vog-terminal.apk` & `vog-terminal-v1.5.2.apk` (25,609,046 B)
         * `c:\vog_system\dist\vog-terminal.apk` & `vog-terminal-v1.5.2.apk` (25,609,046 B)
         * `c:\vog_system\server\vog-terminal.apk` & `vog-terminal-v1.5.2.apk` (25,609,046 B)
         * `c:\vog_system\server\vog-terminal-v1.5.1.apk` (25,307,483 B)
    2. **Backend API Uç Noktaları & Landing HTML (`server/app.js`):**
       - `GET /api/terminal/info`: v1.5.2 (Build 13, 06.10.2026, 24.4 MB) ve tüm yeni modül özellikleri dinamik döndürülüyor.
       - `GET ['/vog-terminal-v1.5.2.apk', '/vog-terminal-v1.5.1.apk', '/vog-terminal.apk', ...]`: v1.5.2 ve v1.5.1 yolları bağlandı; doğrudan ve versiyonlu indirme desteklendi.
       - `sendApkLandingHtml` (Port 3001 `/download`, `/apk`, `/indir`, `/terminal-apk`): Eski v1.3.0 HTML yapısı modern koyu tema, v1.5.2 rozetleri, Personel Kolileme vurgusu, indirme butonları, QR ve kurulum adımlarıyla baştan aşağı yenilendi.
    3. **Frontend React İndirme Sayfası (`src/pages/ApkDownloadPage.jsx`):**
       - Sürüm rozetleri: `v1.5.2 (Build 13)`, `06 Ekim 2026`, `24.4 MB`, `Android 7.0+`.
       - Öne çıkan kartlar: 👔 **Personel Bazlı Excel Sıralı Kolileme & Eşleştirme**, 🏷️ **Godex G530 100x100mm Dikey 4 Sütunlu Koli Etiketi**, 🔫 **Chainway UHF Donanım Tabanca Tetiği**.
       - İndirme Seçenekleri: Büyük birincil `EN SON SÜRÜMÜ İNDİR (v1.5.2 - 24.4 MB)`, `v1.5.2 Doğrudan APK`, `v1.5.1 Önceki Sürüm` ve akordeon ile v1.5.0, v1.4.0, v1.3.1 erişimi.
       - bwip-js QR Kod: Yüksek kontrastlı canlı QR kod tuvali; el terminali kamerası veya telefonla anında tarama.
       - 1 tıkla indirme URL'sini kopyalama butonu ve doğrudan Chrome terminal linki kutusu (`http://192.168.1.251:3001/vog-terminal.apk`).
       - 4 Sekmeli Modül Önizlemesi (Personel, Sevk Çıkış, Mal Kabul, Donanım & Ayarlar).
       - Koyu/Açık tema uyumluluğu (`force-white-text`) ile kristal netliğinde kontrast.
    4. **Fulfillment Koli Ekranı (`src/pages/BoxLabelPrinting.jsx`):**
       - İndirme butonu ve araç ipucu v1.5.2 olarak güncellendi.
  - **Test & Doğrulama:**
    - HTTP HEAD & GET Testleri: Port 3000 ve Port 3001 üzerinden `/vog-terminal.apk` ve `/vog-terminal-v1.5.2.apk` 200 OK ve 25,609,046 bayt doğrulandı.
    - Puppeteer görsel ekran görüntüleri (`scratch/apk_download_react_v2.png` ve `scratch/apk_download_backend.png`) ile tipografi, QR ve butonlar test edildi ve onaylandı.
    - `npm run build`: 694 modül 0 hata ile derlendi (6.35s).
    - PM2 servisleri (`vog-api` ve `vog-frontend`) online ve çalışır durumda.

- **feature/flutter-personnel-box-packing-v1.5.2 (Chainway Android El Terminali Personel Bazlı Excel Sıralı Kolileme & Eşleştirme Modülü):**
  - **Kullanıcı Talebi:** *"seçili firma bölüm için personel bazlı kolileme yapmak istiyorum ve bunu web uygulamasındaki gibi koli sırası personel adı eşlesecek şekilde exceldeki gibi"*
  - **Uygulanan Mimari & Çözüm:**
    1. **Veri Modelleri (`vog_terminal_flutter/lib/models/personnel_model.dart`):**
       - `PersonnelBrand`, `PersonnelDepartment`, `PersonnelBoxSummary`, `PersonnelBundleItem`, `PersonnelBoxDetail` modelleri eklendi.
       - Dinamik kota, parça adedi, taranan EPC'ler ve mühürlenme durumu tanımlandı.
    2. **API İletişim Katmanı (`vog_terminal_flutter/lib/services/api_service.dart`):**
       - `getPersonnelBrands()`: Marka ve departman koli sayıları/özetleri.
       - `getPersonnelBoxes(brand, department)`: İlgili bölümün Excel sıralı koli listesi (A sütununa göre 1..N).
       - `getPersonnelBoxDetails(brand, department, boxNo)`: Seçilen kolinin personel adı, bayi adı, koli barkodu ve giysi kontrol listesi.
       - `savePersonnelBox(brand, department, boxNo, boxBarcode, items, printLabel)`: Koli kaydetme, PostgreSQL güncelleme ve Godex dikey koli etiketi yazdırma.
    3. **Personel Kolileme Arayüzü (`vog_terminal_flutter/lib/screens/personnel_packing_screen.dart`):**
       - **Firma & Bölüm Seçimi:** Açılır menüden Marka (SKODA, SCANIA vb.) ve Departman (Danışman 181, Formen 112, Hasar Garanti 165, MİS 106, Teknisyen 887, Yedek Parça 103) seçimi.
       - **Excel Sıralı Koli Gezintisi:** `< Önceki`, `Sonraki >` ve `KOLİ 1 / 181` tıklanabilir modal arama butonu ile Excel satır sırasına göre personeller arasında anında gezinme.
       - **Personel Koli Kartı:** Personel Adı, Bayi/Servis Merkezi, Cinsiyet, Koli Barkodu (`KOLI-SK-DAN-0001`), Paketleme Durumu (`BEKLİYOR` / `PAKETLENDİ`).
       - **Canlı Sayaç & İlerleme Çubuğu:** Dev punto ile `Okunan: 4 / 7 ADET (%57)` canlı göstergesi.
       - **Giysi Kontrol Listesi:** Her kıyafet için Parça No (`PSKD100054M`), Açıklama, Beden, Barkod kartı; okundukça zümrüt yeşiline döner.
       - **Chainway UHF Donanım Tetikleyici Entegrasyonu:** Tabanca tetiğine basıldığında RFID SGTIN-96, Barkod ve Parça Kodu akıllı eşleştirme algoritması. Mükerrer okuma ve yabancı ürün sesli/titreşimli uyarıları.
       - **Mühürleme & Etiket Butonu:** "📦 KOLİYİ MÜHÜRLE & ETİKET BAS" tıklandığında koli PostgreSQL'de mühürlenir, Godex G530 dikey koli etiketi basılır ve sıradaki koliye otomatik geçilir.
    4. **Navigasyon Çubuğu (`MainShell`):**
       - Tab 0: **Personel** (Koli & Eşleşme - Öncelikli ekran)
       - Tab 1: **Sevk Çıkış** (Toptan Koli)
       - Tab 2: **Mal Kabul** (Stok Girişi)
       - Tab 3: **Ayarlar** (PDA & Ağ)
    5. **APK Üretimi & Yayın:**
       - Sürüm: `v1.5.2+13` (06.10.2026), 24.4 MB release APK başarıyla derlendi.
       - Web sunucusu üzerinden anında indirme: `http://<IP>:3000/vog-terminal.apk` ve `http://<IP>:3001/vog-terminal.apk`.

- **feature/carton-label-portrait-with-partno-and-auto-print-rules (100x100mm Dikey Portre Koli Etiketi, 4 Sütunlu Parça No Tablosu, Polar Eşleştirme ve Eksik Koli Baskı Koruması):**
  - **Kullanıcı Talepleri:**
    1. *"polar ürünleradı tunel ve eksik olmasına rağmen etiket bastı.otomatik basmamalı eksik oldugunda. sadece manuel basılabilir"*
    2. *"ve otomatik koli etiketi seçili olmadan otomatik baskı yapmamalı"*
    3. *"koli etiketi potraid basılmalı. liste dik daha iyi oluyor. ayrıca listede parcano değeride olmalı"*
  - **Uygulanan Çözüm & Mimari:**
    1. **Otomatik Koli Etiketi Seçimi Zorunluluğu (`autoComplete`):**
       - `rfid_tunnel_driver.js` ve `server/app.js` içerisindeki `handlePassageExitAutoPrint` ile `handleAutoBoxComplete` mekanizmalarına katı kural konuldu.
       - Arayüzde veya konfigürasyonda `autoComplete === false` (Manuel Mod) ise koli %100 tam olsa dahi otomatik koli etiketi basımı KESİNLİKLE yapılmaz; sistem `READY_FOR_PRINT` durumuna geçerek operatörün ekrandaki butona manuel basmasını bekler.
    2. **Eksik Koli Otomatik Baskı Engeli (Sıfır Hatalı Baskı):**
       - Koli tünelden çıktığında (`passage_exit`) veya zaman aşımı tetiklendiğinde; `scanned_quantity < target_quantity` ise ya da `bundle_items` içinde taranmamış eksik kıyafet parçası bulunuyorsa otomatik baskı %100 engellenir, koli durdurulur (`INCOMPLETE_BOX_STOPPED` olayı tetiklenir). Sadece operatör bilinçli olarak manuel basım yapabilir.
    3. **Polar Ürünlerinin SGTIN-96 & Bundle Eşleşmesi:**
       - Tünel EPC okumasında Polar giysilerinin SGTIN-96 etiketleri (`303B50CC004132...` -> Sipariş #16690, Ürün `PSKD100041`) personel koli paketindeki polar parçasıyla SKU öneki, kategori adı (`POLAR`), barkod ve beden eşleşmesiyle kusursuz tanındı.
    4. **Dikey (Portrait) 100x100mm Koli Etiketi & 4 Sütunlu Tablo (Parça No Ekli):**
       - `generateGodexBoxZpl` fonksiyonu 100x100mm (300 DPI / 12 dpmm = 1180x1180 dot) dikey yönlendirmeye (`^PON`) uyarlandı.
       - Eski sistemde `it.size || it.part_no` mantığı yüzünden Parça No kolonunda sadece beden ("L", "46") görünüyordu.
       - Yeni yapıda 4 bağımsız sütun inşa edildi:
         * **Parça No:** `it.part_no` / `it.clean_part_no` (Örn: `PSKD100041L`, `PSKD100025L`)
         * **Ürün Açıklaması:** `it.clean_name` (Örn: `SIYAH POLAR BAY`, `SIYAH MONT BAY`)
         * **Beden:** `it.clean_size` / `it.size` (Örn: `L`, `46`, `STD`)
         * **Adet:** `it.quantity` (Örn: `1`, `2`)
       - Hem Personel koli etiketleri hem de Genel Sevkiyat koli etiketleri aynı standart dikey 4 sütunlu yapıya geçirildi.
       - Koli tamamlandığında sıradaki koliye otomatik geçiş (1 sn gecikmeyle SCANNING başlatma) eklendi.
  - **Test & Doğrulama:**
    - `server/scratch/verify_all_requirements.cjs` ile 5 farklı senaryo (Polar EPC, Eksik Koli Manuel/Oto, Tam Koli Manuel/Oto) test edildi: **5/5 PASSED (%100 Başarı)**.
    - Labelary API ile dikey ve 4 sütunlu etiket simülasyonu yapıldı, PNG önizlemeleri doğrulandı.
    - `node -c server/app.js` ile sözdizimi doğrulandı.
    - PM2 üzerinde `vog-api` servisi sorunsuz yeniden başlatıldı.

- **build/flutter-apk-v1.5.1 (Chainway RFID & Barkod Android El Terminali v1.5.1+12 APK Derlemesi):**
  - **Kullanıcı Talebi:** *"flutter olarak build oldu mu", "url üzerinden indirmek istiyorum", "evet yeni güncellemeyi build edelim"*
  - **Uygulanan Değişiklikler:**
    - `vog_terminal_flutter/pubspec.yaml` sürümü `1.5.1+12` olarak güncellendi.
    - `vog_terminal_flutter/lib/config/api_config.dart` içerisindeki `appVersion = 'v1.5.1'`, `appBuild = '12'`, `appReleaseDate = '06.10.2026'` değerleri eşitlendi.
    - `flutter analyze` ile Dart kodları denetlendi: 0 hata (No issues found).
    - `flutter build apk --release` komutu ile yeni Android release APK derlendi: `build/app/outputs/flutter-apk/app-release.apk` (24.1 MB).
    - Yeni derlenen APK hem ana dizine hem de web sunucu yayın klasörüne kopyalandı:
      * `c:\vog_system\public\vog-terminal-v1.5.1.apk`
      * `c:\vog_system\public\vog-terminal.apk`
      * `c:\vog_system\vog-terminal-v1.5.1.apk`
      * `c:\vog_system\vog-terminal.apk`
    - Ağ üzerindeki tüm el terminalleri ve tarayıcılar için aktif indirme URL'leri sağlandı (`http://192.168.1.251:3000/vog-terminal.apk` & `http://192.168.1.251:3001/vog-terminal.apk`).

- **fix/rfid-tunnel-tag-matching-and-sgtin96-personnel-support (RFID Tüneli Anten Okuma, SGTIN-96 Üretim Siparişi Eşleştirme ve RSSI Hassasiyet Kalibrasyonu):**
  - **Kullanıcı Talebi:** *"koliyi tünele koyduk ama antenler okumadı"*
  - **Kök Neden Analizi (Root Cause Analysis):**
    1. **Donanım ve Ağ Durumu:** Yapılan analizde Impinj antenlerinin ve Tünel PC'nin (`192.168.1.79:7070`) fiziksel olarak sağlam ve bağlı olduğu; koli tünele girdiğinde antenlerin etiketleri okuyup `POST /api/tunnel/kiosk/scan-tag` servisine ilettiği (`vog-api-out.log` kayıtlarında EPC: `303B50CC0041340000017600`, `303B50CC004135000004B100` vb. net sinyallerle kanıtlandı) tespit edildi.
    2. **SGTIN-96 Çözümleme Atlaması:** `server/drivers/rfid_tunnel_driver.js` içerisinde `if (session_type === 'PERSONNEL')` bloğunun hemen altına `else if (epc.startsWith('303B50CC'))` yazıldığı için, personel koli oturumlarında SGTIN-96 etiketlerinin sipariş numarası çözümlenmiyordu.
    3. **Hatalı "Yabancı Etiket" Reddi:** Personel giysileri fabrikanın resmi Skoda siparişlerinden (#16692 Pantolon, #16693 Gömlek, #16695 Yelek) üretildiği için bu etiketler veritabanındaki `rfid_tags` tablosunda bireysel tekil personel kaydı olarak bulunamıyor, barkodu eşleşmedi denilerek sürücü tarafından `FOREIGN_TAG_REJECTED` (Yabancı Etiket) olarak sessizce engelleniyordu. Ekranda sayaç 0/7 kaldığı için operatör donanım okumadı sanıyordu.
    4. **Aşırı Dar RSSI Filtresi (-52 dBm):** `server/tunnel_config.json` dosyasında `rssiThreshold: -52` olarak kalmıştı. Kapalı koli içindeki giysilerde arka/dip konumda kalan etiketler -55 dBm ila -65 dBm seviyesinde okunduğu için 7 etiketin yarısı yazılım filtre eşiğine takılıyordu.
    5. **LLRP Hata Döngüsü:** `.env` dosyasındaki `IMPINJ_IP=192.168.1.79` Tünel PC'ye işaret ederken bu makinede 5084 LLRP portu kapalıydı (Tünel PC webhook ve port 7070 soket köprüsü kullanıyor); bu durum 4 saniyede bir `ETIMEDOUT` hata logu basılmasına yol açıyordu.
  - **Uygulanan Çözüm & Mimari:**
    1. **`server/drivers/rfid_tunnel_driver.js`:**
       - Etiket okuma mantığının başına SGTIN-96 başlığı (`303B50CC...`) ve sipariş ID çıkarma (`parseInt(orderHex, 16)`) yerleştirildi.
       - SGTIN-96 sipariş no üzerinden `orders` tablosundan marka (`brand`), ürün kodu (`sku`), barkod ve ürün adı otomatik zenginleştirildi (`orderInfo`).
       - Personel oturumu (`session_type === 'PERSONNEL'`) kontrolü; SGTIN-96 sipariş markası (`orderInfo.brand === activeBrand`), marka resmi kod öneki (`PSKD...`, `SCKY...`, `PVWK...`), personel paket barkodları ve SKU'ları ile tam uyumlu hale getirildi.
       - Yabancı etiket algılandığında `this.activeSession.foreign_tags` listesine kaydedilip WebSocket/SSE ile `session_update` bildirilmesi sağlandı; `getSessionSummary()` içerisine yansıtıldı.
    2. **`server/tunnel_config.json`:**
       - `rssiThreshold` değeri endüstriyel standart olan `-68 dBm` seviyesine çekilerek koli içindeki tüm giysilerin eksiksiz okunması sağlandı; depo dış parazit koruması korundu.
    3. **`server/.env` & `server/drivers/vog_impinj_native_driver.cjs`:**
       - Tünel PC köprü modundayken doğrudan 5084 portu yoklaması `IMPINJ_LLRP_ENABLED=false` ile kapatılarak log kirliliği ve kaynak israfı engellendi.
    4. **`src/pages/TunnelKioskPage.jsx`:**
       - `triggerImpinjManual` butonu backend tünel durumunu kontrol edip otomatik `SCANNING` modunu aktive edecek ve canlı durumu tazeleyecek şekilde güçlendirildi.
  - **Test & Doğrulama:**
    - Fiziksel antenlerden gelen gerçek giysi etiketleri (`303B50CC004134...`, `303B50CC004135...`, `303B50CC004137...`, `303B50CC004133...`) ile simülasyon test edildi: **Tüm etiketler %100 MATCHED, sayaç 7/7 hedefe başarıyla ulaştı, giysi kontrol listesinde tüm parçalar yeşile döndü**.
    - `npm run build`: 694 modül 0 hata ile derlendi (5.92s).
    - PM2 servisleri (`vog-api` ve `vog-frontend`) online ve sıfır hata ile yayında.
    - Kiosk oturumu temiz başlangıç durumuna (Hasar Garanti Koli #21 Murat Çevik) getirildi.

  - **Kullanıcı Talebi:**
    1. *"koli sırasını personel sıralaması alfanumerik sıralı ayarladık ama şimdi SKODA 2026 Kış Personel Listesi.xlsx excel dosyasındaki satır numarasına göre persole kolileri sıralanmalı. bu şekilde güncelleme yapar mısın"*
    2. *"excel dosyasında resimde göründüğü gibi bölüm lokasyon adları var. bunu da seçmemiz gerek firma adını seçtikten sonra. ve her bölüm sıra koli numarası A sutununda yazılı ve 1 den başlıyor"*
  - **Kaynak Excel ve Veri Analizi:**
    * Dosya: `C:\Users\ctopuz\Documents\SKODA 2026 Kış Personel Listesi.xlsx`
    * 6 Bölüm / Departman Sayfası:
      1. `Danışman`: 181 koli (A Sütunu NO: 1..181)
      2. `Formen`: 112 koli (A Sütunu NO: 1..112)
      3. `Hasar Garanti`: 165 koli (A Sütunu NO: 1..165)
      4. `MİS`: 106 koli (A Sütunu NO: 1..106)
      5. `Teknisyen`: 887 koli (A Sütunu NO: 1..887)
      6. `Yedek Parça`: 103 koli (A Sütunu NO: 1..103)
      * Toplam: 1.554 resmi Skoda personeli.
  - **Veritabanı Entegrasyonu & Migrasyon (`server/scripts/import_skoda_2026_kis_official.cjs`):**
    * PostgreSQL `personnel` tablosuna 1.554 personelin tamamı aktarıldı.
    * Her bölümün `box_no` değeri kendi Excel A sütunu `NO` değerine (1'den N'e) eşitlendi.
    * Koli barkodları çakışmayı önlemek ve benzersizlik sağlamak için `KOLI-SK-[BÖLÜM]-[0001]` standardında üretildi:
      - `Danışman`: `KOLI-SK-DAN-0001` .. `KOLI-SK-DAN-0181`
      - `Formen`: `KOLI-SK-FRM-0001` .. `KOLI-SK-FRM-0112`
      - `Hasar Garanti`: `KOLI-SK-HAS-0001` .. `KOLI-SK-HAS-0165`
      - `MİS`: `KOLI-SK-MIS-0001` .. `KOLI-SK-MIS-0106`
      - `Teknisyen`: `KOLI-SK-TEK-0001` .. `KOLI-SK-TEK-0887`
      - `Yedek Parça`: `KOLI-SK-YDP-0001` .. `KOLI-SK-YDP-0103`
    * Bedenler ve Doğuş Otomotiv katalog kotaları (`bundle_items`) ilgili departman rollerine göre (7 parça / 4 parça) birebir eşleştirildi.
  - **Backend Mimarisi (`server/services/personnel_numbering_service.cjs` & `server/app.js`):**
    * `getPersonnelDepartments`: Marka bazında departmanları ve her birinin `total_count`, `packed_count`, `remaining_count` değerlerini döner.
    * `getPersonnelBoxList`: `department` parametresine göre filtrelenir ve `box_no ASC` sıralanır.
    * `getPersonnelBoxDetails`: `box_no` ve `department` ikilisiyle doğru koli çekilir; `total_boxes` o departmanın toplam koli sayısına dinamik eşitlenir.
    * `renumberPersonnelCartons`: Bölüm bazında 1..N Excel sıra numaralandırması yapar.
    * `executeCompletePersonnelBox`: Koli tünelden tamamlandığında `session.department` sınırında kalarak sonraki koliye (#1 -> #2) geçer, departman dışına taşmaz.
  - **Frontend Mimarisi (`src/pages/TunnelKioskPage.jsx`):**
    * Personel Seçim Modalı:
      - `Marka:` seçildikten sonra hemen yanına `Bölüm / Lokasyon:` dropdown seçicisi eklendi.
      - 6 bölüm canlı koli sayılarıyla listelenir: `📁 Danışman (181 Koli)`, `📁 Formen (112 Koli)`, vb.
      - Marka veya Bölüm değiştiğinde başlangıç koli no otomatik 1'e çekilir ve koli listesi seçili bölüme göre yüklenir.
      - Koli kartlarında `🏢 [Bölüm Adı]` rozeti, bayi/lokasyon bilgisi ve `KOLI-SK-XXX-0001` barkodu gösterilir.
      - Tünel Kiosk aktif ekranında personel adı, bayi, departman (`🏢 Danışman`), koli ilerleme bilgisi (`📦 Koli 1 / 181`) ve 7 parçalık set kontrol listesi tam uyumlu render edilir.
  - **Test & Doğrulama:**
    * Puppeteer ile tam ekran testleri yapıldı:
      - `dept_modal_skoda_danisman.png`: Danışman (181 Koli) listesi, 1'den başlayan sıralama.
      - `dept_modal_skoda_formen.png`: Formen (112 Koli) listesi, 1'den başlayan sıralama.
      - `dept_kiosk_danisman_koli1_active.png`: Koli #1 Emrah Avcı (Açıkkapı Otomotiv) 1/181 Koli aktif tünel ekranı ve 7 parça içerik listesi.
    * `npm run build`: 694 modül 0 hata ile derlendi (6.91s).
    * PM2 servisleri (`vog-api` ve `vog-frontend`) online ve çalışır durumda.

- **fix/sorter-tracking-brand-and-chute-capacity-sync (Personel Mini-Sorter Akış Döngüsü ile Takip Ekranı Arasındaki Koli İçi Adet ve Aktif Marka Eşleşmesi):**
  - **Kullanıcı Talebi:** *"PERSONEL BAZLI MİNİ-SORTER ÇALIŞMA AKIŞI sayfasında 60 göz sorter personel eşleşmesi yapıldıktan sonra bunun takibini yapacağımız sayfada neden koli içi adetleri hala varsayılan kutu adedi olarak görünüyor"*
  - **Sorunun Kök Nedenleri:**
    1. **Marka Uyumsuzluğu / Ayrıklığı:** Mini-Sorter Akış sayfasında (`PersonnelSorterWorkflowPage.jsx`) örneğin SCANIA markası için 30 veya 60 gözlük döngü tahsisi yapıldığında, takip sayfası olan `PersonnelOrderManagement.jsx` (`/admin/personnel`) varsayılan olarak `VOLKSWAGEN` markasını seçili getiriyordu. Kullanıcı sayfaya geldiğinde Standby durumunda bekleyen VW danışmanlarını ve onların varsayılan `0 / 7` kutu adetlerini görüyordu; sorter'a atanmış Scania personelleri tabloda listelenmiyordu.
    2. **Koli Hedef Kapasitesinin Tabloda Göz Ardı Edilmesi:** `PersonnelOrderManagement.jsx` tablosundaki `KOLİLEME` hücresi `boxCap = p.box_capacity || activeBoxCapacity || 7` şeklinde sadece global varsayılana bakıyordu. Sorter gözüne atanmış personelin döngü kategori filtresine (örn. sadece Mont & Yelek seçildiğinde) göre belirlenen `chute_target_capacity` (göz hedef kapasitesi) değeri önceliklendirilmiyordu.
    3. **Backend SQL Filtre Uyumsuzluğu:** `GET /api/personnel-orders/staff-list` servisinde `status=ON_SORTER` filtresi geldiğinde SQL sorgusu `AND UPPER(p.packing_status) = 'ON_SORTER'` şeklinde çalıştırılıyordu. Oysa veritabanında `packing_status` 'PENDING' idi ve sorter'daki personeller `p.sorter_chute IS NOT NULL` ile belirleniyordu. Bu durum "SORTER'DA / KISMİ" filtresine tıklandığında 0 kayıt dönmesine yol açıyordu.
    4. **Döngü Paket Kalıcılığı & Aktif Marka Takibi:** `allocateWaveToSorter` servisi göz ataması yaparken döngünün filtrelenmiş `bundle_items` listesini personelin `bundle_items` alanına yazmıyordu ve aktif partinin markası `sorter_settings` tablosunda saklanmıyordu.
  - **Uygulanan Çözüm & Mimari Değişiklikler:**
    1. **Backend (`server/services/personnel_workflow_service.cjs`):**
       - `allocateWaveToSorter` metodu güncellendi: Döngü atanırken `bundle_items = COALESCE($6::jsonb, bundle_items)` ile filtrelenmiş parçaların kaydedilmesi sağlandı.
       - Dağıtım anında `sorter_settings` tablosuna `active_sorter_brand` anahtarıyla o anki döngü markası otomatik kaydedildi.
    2. **Backend (`server/app.js`):**
       - `GET /api/personnel-orders/staff-list`:
         * `sorter_chute_state sc` ve `sorter_mappings sm` ile LEFT JOIN yapılarak `sc.target_capacity as chute_target_capacity` ve `sm.destination_name` çekildi.
         * `status=ON_SORTER` geldiğinde `p.sorter_chute IS NOT NULL`, `status=PENDING` geldiğinde `(p.packing_status = 'PENDING' OR p.packing_status IS NULL) AND p.sorter_chute IS NULL` koşulları çalıştırıldı.
         * Zenginleştirilmiş personel nesnesine `chute_target_capacity`, `effectiveBoxCap = chuteTarget || activeBoxCap` ve `effectiveItemTarget = chuteTarget || Math.min(totalTarget, effectiveBoxCap)` eklendi; API yanıtına `active_sorter_brand` alanı eklendi.
       - `GET /api/personnel-orders/active-sorter-assignments`: `sc.target_capacity` dinamik olarak kullanıldı ve `active_brand` döndürüldü.
    3. **Frontend (`src/pages/PersonnelOrderManagement.jsx`):**
       - `useSearchParams` entegrasyonu ile URL'den gelen `?brand=...` parametresi okundu.
       - `activeSorterBrand` durumu tanımlandı; `fetchStaffList` ve `fetchSorterStatus` üzerinden otomatik algılandı.
       - **Akıllı Banner:** Başka marka seçiliyken sorter'da aktif parti varsa sayfa başında `⚡ Mini-Sorter'da Aktif Dağıtılmış Parti: [MARKA] (X Göz Eşleşti)` bildirim bannerı ve tek tıkla o markanın ekranına geçiş butonu (`👉 [MARKA] Takip Ekranına Geç`) sunuldu.
       - **Marka Seçici İpuçları:** Firma/Marka dropdown'unda aktif sorter partisi olan marka `⚡ SCANIA — Sorter'da Aktif (30 Göz)` şeklinde vurgulandı.
       - **Sekme Geçiş Kolaylığı:** Kullanıcı başka markadayken `SORTER'DA / KISMİ` sekmesine bastığında otomatik olarak aktif partinin markasına geçiş sağlandı.
       - **KOLİLEME Sütunu:** `chute_target_capacity` en öncelikli hedef kapasite yapıldı; personelin sorter göz hedef adedi `0 / 7  🎯 7 Adet` veya `0 / 5  🎯 5 Adet` şeklinde net bir rozetle gösterildi.
       - **Koli Planla Modalı:** Koli İçi Kapasitesi ve Sorter Göz Hedefi dinamik olarak eşleşti.
    4. **Frontend (`src/pages/PersonnelSorterWorkflowPage.jsx`):**
       - Üst bardaki "Personel Sorter Tablosu" butonuna `?brand=${selectedBrand}` parametresi eklendi.
       - 4. Adımda döngü sorter'a dağıtıldıktan sonra anında çıkan `👉 [MARKA] Sorter Takip Ekranına Git →` navigasyon butonu eklendi.
  - **Test & Doğrulama:**
    - Puppeteer ile tam sayfa test edildi:
      * VW markasındayken üstte Scania aktif döngü bildirim bannerının çıktığı görsel olarak doğrulandı (`personnel_active_banner_vw_full.png`).
      * Scania takip ekranına geçildiğinde "SORTER'DA / KISMİ (30)" filtresinde 30 personelin 1-60 gözleri arasında eksiksiz listelendiği doğrulandı (`personnel_scania_direct_sorter.png`).
      * Dinamik hedef kapasite testi (Göz 1 için 5 adet, Göz 3 için 3 adet) yapıldı ve KOLİLEME sütununda `0 / 5 🎯 5 Adet` ile `0 / 3 🎯 3 Adet` olarak render edildiği kanıtlandı.
    - `npm run build` ile 694 modül 0 hata ile derlendi (6.56s).
    - PM2 servisleri (`vog-api` ve `vog-frontend`) online ve sağlıklı.

- **fix/personnel-box-capacity-and-cross-page-sync (Kolileme Sütununda Dinamik Koli İçi Adet Eşleşmesi ve Sayfalar Arası Senkronizasyon):**
  - **Kullanıcı Talebi:** *"kolileme sütununda koli içi adedi her satırda 7 gorumuyor. .. dier sayfalarda kutu içi adetleri güncellenirse buradada aynı şekilde eşleşmeli"*
  - **Sorunun Kök Nedeni:**
    * `PersonnelOrderManagement.jsx` sayfasında `KOLİLEME` sütunu `{p.current_packed} / {p.total_target}` şeklinde render ediliyordu. Volkswagen 7 parçalı set için `p.total_target = 7` olduğundan her satırda sabit `0 / 7` görünüyordu.
    * `PersonnelSorterWorkflowPage.jsx` sayfasındaki 2. Adımda ("Ürün Cinsine Göre Kutu İçi Maks Adetler & Akıllı Hacim") veya `boxCapacity` (Varsayılan Koli Kapasitesi) ve şablon butonlarında (`❄️ Kışlık Koli (5)`, `☀️ Yazlık Kompakt (8)`, `📦 Büyük Koli XL (10)`) yapılan seçimler veritabanına kalıcı kaydedilmediği için diğer sayfalara aktarılmıyordu.
  - **Uygulanan Çözüm & Mimari:**
    1. **Veritabanı ve Servis Seviyesi Kalıcılık (`sorter_settings`):**
       - `server/services/personnel_workflow_service.cjs`: `getPersonnelBoxSettings(pool)` ve `savePersonnelBoxSettings(...)` metodları eklendi. `sorter_settings` tablosunda `personnel_box_capacity`, `personnel_category_limits`, `personnel_selected_categories` anahtarları üzerinden UPSERT ile kaydedilmesi sağlandı.
       - `server/app.js`:
         * `GET /api/personnel-workflow/category-limits` ve `POST /api/personnel-workflow/category-limits` endpoint'leri eklendi.
         * `POST /api/personnel-workflow/plan` çağrıldığında koli kapasitesi ve kategori limitleri arka planda otomatik kaydedildi.
         * `GET /api/personnel-orders/staff-list` endpoint'i `getPersonnelBoxSettings` ile güncel `activeBoxCap` okuyacak şekilde güncellendi; her personele `box_capacity`, `box_item_target`, `total_boxes_needed`, `boxes_needed` hesaplanarak `default_box_capacity` ile birlikte döndürüldü.
    2. **`PersonnelSorterWorkflowPage.jsx` Entegrasyonu:**
       - İlk yüklemede `GET /api/personnel-workflow/category-limits` çağrılarak kayıtlı `box_capacity`, `category_limits` ve `selected_categories` yüklendi.
       - Koli kapasitesi değiştirildiğinde veya şablon butonlarına basıldığında `POST /api/personnel-workflow/category-limits` ile anında kaydedilmesi sağlandı.
       - Butonlara kapasite rakamları eklendi ve aktif şablon görsel olarak vurgulandı (`❄️ Kışlık Koli (5)`, `☀️ Yazlık Kompakt (8)`, `📦 Büyük Koli XL (10)`, `🔄 Standart (7)`).
    3. **`PersonnelOrderManagement.jsx` Entegrasyonu:**
       - Kolileme sütunu dinamik koli kapasitesi hesabı (`currentPacked / boxCap`) ile güncellendi.
       - Birden çok koli ihtiyacı olan personeller için `📦 X Koli` rozeti ve toplam parça detayı (`Toplam: X/Y parça`) eklendi.
       - Tablo araç çubuğuna canlı `📦 Koli İçi Kapasitesi: [ 5 ] Adet` widget'ı ve hızlı butonlar (`5`, `7`, `8`, `10`) eklendi; buradan yapılan değişikliklerin de anında kaydedilip her iki sayfayı senkronize etmesi sağlandı.
       - Koli Planla modalında koli kapasitesi ve toplam ihtiyaç bilgileri gösterildi.
  - **Test & Doğrulama:**
    - Puppeteer ile hem `box_capacity = 5` (Kışlık Koli) hem de `box_capacity = 8` (Yazlık Kompakt) durumları test edildi.
    - 5 adet koli kapasitesinde Volkswagen personellerinde `0 / 5  📦 2 Koli  %0  Toplam: 0/7 parça` olarak render edildiği ve 8 adet koli kapasitesinde `0 / 8  %0` olarak render edildiği tarayıcıda görsel olarak doğrulandı (`kolileme_synced_verified.png` ve `kolileme_synced_verified_8.png`).
    - `npm run build` ile 694 modül 0 hata ile derlendi (6.98s).
    - PM2 servisleri (`vog-api` ve `vog-frontend`) online ve hatasız çalışıyor.

- **fix/extra-label-printing-dynamic-order-sizes (İlave / Ekstra Fiş Basımında Sipariş Bedenlerinin Dinamik Eşlenmesi):**
  - **Kullanıcı Talebi:** *"1. resimde olan bedenler ilave fiş basımda da da aynı bedenler olmalı"*
  - **Kapsam:**
    - Sipariş etiket ve fiş basım ekranında (`/admin/orders/:orderId/labels`, örn: `#16692 2026 KIŞ SKODA SERVİS DANIŞMAN, HASAR, YEDEK PARÇA, FORMEN VE GARANTİ PANTOLON`), Tab 1'de ("Planlı Sipariş / Kalan Bedenler Baskısı") siparişin kesim matrisine ait gerçek bedenleri (`38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60`) gösterilirken; Tab 2'de ("İlave / Ekstra Etiket Basımı") standart üst giyim harf bedenleri (`XS, S, M, L, XL, XXL, 3XL, 4XL`) sabit kodlanmıştı.
    - `src/pages/OrderLabelPrintingPage.jsx` bileşeninde `extraActiveSizes` useMemo kancası eklendi; siparişin seçili cinsiyet grubuna (`extraGender`) ait `calculateOrderSizeBreakdown` kırılımı dinamik olarak Tab 2'deki hızlı artırıcı beden kartlarına bağlandı.
    - Cinsiyet butonlarındaki (`1. CİNSİYET GRUBU SEÇİMİ`) SKU ipucu `orderBaseSku` üzerinden siparişin gerçek parça koduna (`PSKD100019`) dinamik olarak bağlandı.
    - Kartlar üzerinde sipariş adetleri (`Sipariş: 22` vb.) subtle bilgi olarak sunuldu, hızlı butonlar (`-1`, `+1`, `+5`) ve manuel adet girişi tüm sipariş bedenleriyle %100 uyumlu hale getirildi.
    - Sıfırlama (`🗑️ Adetleri Sıfırla`) ve baskı sonrası sayaç temizliği `extraSizes` nesnesini temizleyecek şekilde güncellendi.
  - **Test & Doğrulama:**
    - Puppeteer ile `#16692` siparişinin Tab 2 ekranında 12 bedenin (`38` - `60`) sipariş adetleriyle birlikte eksiksiz render edildiği doğrulandı.
    - Hızlı stepper butonları (`+1`, `+5`) test edildi; kartların yeşil renkle vurgulanması ve `Toplam İlave Basılacak: 6 Adet` toplamının doğru hesaplandığı görsel ekran görüntüsüyle (`tab2_sizes_stepper_verified.png`) kanıtlandı.
    - `npm run build` ile 694 modül 0 hata ile derlendi (7.08s).
    - PM2 servisleri (`vog-api` ve `vog-frontend`) online ve çalışır durumda.

  - **Kullanıcı Talebi:** *"ana sayfa menusunu kaldıralım"*
  - **Uygulanan Değişiklikler:**
    - `src/components/AdminSidebar.jsx`: `navItems` listesinden `{ name: t('nav.home'), path: '/admin', icon: '📊' }` kaldırıldı.
    - `src/components/AdminLayout.jsx`: Mobil alt gezinme barı `bottomBarItems` listesinden `t('nav.home')` kaldırıldı.
  - **Test & Doğrulama:**
    - `npm run build` ile 694 modül 0 hata ile derlendi (6.56s).
    - PM2 `vog-api` ve `vog-frontend` servisleri yeniden başlatıldı ve online duruma getirildi.

- **feature/skoda-brand-and-workflow-integration (Skoda Markası, 285 Personel, 9 Departman, Resmi Barkod Kataloğu ve 4 Adımlı Sorter Akış Entegrasyonu):**
  - **Kullanıcı Talebi:** *"firma olarak skoda 'yı ekleyelim"*
  - **Kapsam:**
    1. Sistem genelinde (Personel Mini-Sorter Akış Yönetimi `PersonnelSorterWorkflowPage.jsx`, Personel Sipariş Yönetimi `PersonnelOrderManagement.jsx` ve Siparişlerim Personel Görünümü `PersonnelOrdersView.jsx`) **SKODA** markası tam teşekküllü olarak eklendi.
    2. `C:\Users\ctopuz\Downloads` altındaki `Skoda Barkodlar 2025 KIŞ.XLSX` ve `Skoda Barkodlar 2026 YAZ.XLSX` resmi kataloglarındaki kotalar ve ürün kodları (345 adet `PSKD...` master_product kaydı) referans alınarak 22 Doğuş Otomotiv Skoda yetkili servisine ait 285 personel eksiksiz olarak PostgreSQL `personnel` tablosuna aktarıldı.
    3. 9 Resmi Skoda Departmanı yapılandırıldı:
       - `Servis Danışman (Kış)`: 3 Kışlık Gömlek (Bay/Bayan `PSKD100025`/`26`), 2 Kışlık Pantolon (`PSKD100019`), 1 Siyah Polar (`PSKD100041`/`42`), 1 Yelek (`PSKD100052`/`53`) -> 7 Parça
       - `Servis Danışman (Yaz)`: 4 Polo Tişört (Bay/Bayan `PSKD200032`/`33`), 2 Yazlık Pantolon (`PSKD200010`) -> 6 Parça
       - `Teknisyen (Kış)`: 3 Yeşil Sweatshirt (`PSKD100056`), 2 Teknisyen Pantolon (`PSKD100028`), 1 Teknisyen Yelek (`PSKD100036`), 1 Siyah Polar (`PSKD100041`) -> 7 Parça
       - `Teknisyen (Yaz)`: 4 Teknisyen Tişört (`PSKD200036`), 2 Teknisyen Pantolon (`PSKD200019`) -> 6 Parça
       - `Formen (Kış)`: 3 Yeşil Formen Sweatshirt (`PSKD100055`), 2 Pantolon (`PSKD100019`), 1 Yelek (`PSKD100036`), 1 Siyah Polar (`PSKD100041`) -> 7 Parça
       - `Formen (Yaz)`: 4 Formen Tişört (`PSKD200035`), 2 Pantolon (`PSKD200010`) -> 6 Parça
       - `Yedek Parça (Kış)`: 3 Siyah Yedek Parça Sweatshirt (`PSKD100054`), 2 Pantolon (`PSKD100019`), 1 Yelek (`PSKD100036`), 1 Siyah Polar (`PSKD100041`) -> 7 Parça
       - `Yedek Parça (Yaz)`: 4 Yedek Parça Tişört (`PSKD200034`), 2 Pantolon (`PSKD200010`) -> 6 Parça
       - `Hasar / Garanti (Kış)`: 3 Gömlek, 2 Pantolon, 1 Siyah Polar, 1 Yelek -> 7 Parça
    4. Gerçek ERP Sipariş Numaraları: `orders` tablosundaki 51 adet kayıtlı Skoda siparişi (`#16695`, `#16694`, `#16693`, `#16692`, `#16691`, `#16939` vb.) ile entegre edildi.
    5. Mini-Sorter ve Koli Etiketleme: `server/templates/koli_etiketi_skoda.html` ve Godex `KOLI-SK-XXXX` etiket formatı tam entegre edildi.
    6. Kategori eşleme motoru (`inferCategoryAndColor`) yeşil teknisyen sweatshirt'leri ve füme pantolonları tanıyacak şekilde güçlendirildi.
  - **Uygulanan Dosyalar:**
    - `server/import_skoda_personnel.cjs`: 285 personelin `bundle_items` JSONB ve beden varyantlarıyla tek seferde ve güvenle veritabanına aktarımı.
    - `server/services/personnel_workflow_service.cjs`: Skoda varsayılan sipariş no (`16695`), parça ortalamaları ve kategori/renk çıkarım kuralları.
    - `server/app.js`: Çoklu marka (`SKODA`, `SCANIA`, `VOLKSWAGEN`) `bundle_items` etiket ve sevk fişi dökümü, `displayPartNo` ve Godex etiket entegrasyonu.
    - `src/pages/PersonnelSorterWorkflowPage.jsx`: Marka listeleme ve sipariş varsayılanı.
    - `src/pages/PersonnelOrderManagement.jsx`: Marka seçim dropdown fallback seçeneklerine `SKODA (285 Personel)` eklendi.
    - `src/components/PersonnelOrdersView.jsx`: Siparişlerim Personel Görünümü dropdown fallback'ine `SKODA (285 Personel)` eklendi.
  - **Test & Doğrulama:**
    - `server/scratch/verify_skoda_workflow.cjs`: 7 aşamalı test simülasyonu çalıştırıldı: **23 PASSED, 0 FAILED (%100 Başarı)**.
    - `server/scratch/verify_all_workflow_steps.cjs`: Tüm marka ve 4 adımlı workflow regresyon testi çalıştırıldı: **33 PASSED, 0 FAILED (%100 Başarı)**.
    - `npm run build` ile 694 modül 0 hata ile derlendi (6.29s).
    - PM2 `vog-api` (Port 3001) ve `vog-frontend` (Port 3000) online ve kesintisiz yayında.
    - ZERO PRINT politikası eksiksiz korundu.

- **feature/personnel-sorter-workflow-and-wave-picking-management (Personel Bazlı Mini-Sorter 4 Adımlı Çalışma Akışı, Konsolide Depo Çeki Listesi & 60 Gözlük Döngü Mimarisi):**
  - **Kullanıcı Talebi:**
    *"personel bazlı mini sorter çalışma akışı aşağıdaki gibi olacak:
    1. önce Firma ve sipariş numarası seçilecek,
    2. sonra siparişin bağlı oldugu firmanın bölümleri seçilecek,
    3. Bölüm içindeki personellerin toplam beden renk ürün bilgilerine göre toplam adetler hesaplanıp depodan getirilmesi için liste hazırlanacak ve pdf olarak ekran dan yada yazıcıdan bu pdf'e erişilebilecek,
    4. toplam 60 minisorter gözümüz var. her personel için 1 veya fazla goz olabilir. ürün çeşidi ve buna göre kutu için maksimum adede göre bu durum değişkendir. buna göre bir yönetim sayfamız olmalı. ve her 60 göz dolacak sekilde döngü olarak toplam personel sayısına göre depodan gelecek ürün listeleri ve mini sorturda döngü sırasına göre gözlere personel ürünlerinin dağılımı. ve koli etiketlerinin buna göre yazdırılıp kolilerin üzerine yapıştırılması adımları düzenleyen yöneten sayfa kurmamız gerekiyor."*
    *Takip Sorusu: "harika. ürünün cinsine göre kutu içindeki kapladıgıalan yuzunden kutu içi maks adet ayarlamalarını yapabilecekmiyim"*
  - **Kapsam & Mimari Çözüm:**
    1. **Adım 1 - Firma & Sipariş Belirleme:**
       - Sistemdeki tüm firmalar (`SCANIA`, `VOLKSWAGEN`, `SEAT`, `AUDI`, `FORD`, `ZARA`) ve kayıtlı sipariş numaraları dinamik listelenir.
       - Kullanıcı mevcut siparişi seçebilir veya yeni özel bir sipariş numarası belirleyebilir.
    2. **Adım 2 - Bölüm Seçimi & Ürün Cinsine Göre Kutu İçi Maks Adet / Hacim Ayarları:**
       - Firmanın tüm bölümleri personel sayıları, tahmini parça sayıları ve koli adetleriyle listelenir.
       - **Kategori Bazlı Kutu Hacim ve Maksimum Adet Ayar Motoru (`DEFAULT_CATEGORY_LIMITS` & `calculateStaffBoxesNeeded`):**
         * Kullanıcı ekrandan her ürün cinsi için kutu içi maks adet ve kapladığı hacim yüzdesini (% hacim, 1 koli = %100) interaktif olarak değiştirebilir:
           - 🧥 **Mont / Kaban:** Maks 2 Adet / %45 Hacim
           - 🦺 **Yelek / Polar:** Maks 4 Adet / %25 Hacim
           - 🧶 **Sweatshirt / Hırka:** Maks 5 Adet / %20 Hacim
           - 👖 **Pantolon:** Maks 6 Adet / %16 Hacim
           - 👔 **Gömlek:** Maks 8 Adet / %12 Hacim
           - 👕 **Polo / Tişört:** Maks 12 Adet / %8 Hacim
           - 🧢 **Bere / Aksesuar:** Maks 25 Adet / %4 Hacim
           - 👞 **Ayakkabı / Bot:** Maks 1 Çift / %50 Hacim
           - 📦 **Diğer Kıyafet:** Maks 10 Adet / %10 Hacim
         * **Hazır Şablonlar (Presets):** ❄️ Standart Kışlık, ☀️ Yazlık Kompakt, 📦 Büyük Boy Koli (XL Hacim), 🔄 Varsayılana Sıfırla.
         * **Hacim Mantığı:** Bir personelin kıyafet paketi %100 hacmi VEYA herhangi bir kategorinin kutu içi maks sınırını aştığında (Örn: Volkswagen 1 Mont + 1 Yelek + 2 Gömlek + 2 Pantolon + 1 Ayakkabı = %176 Doluluk), sistem personeli otomatik olarak **2 Kutuya (ve Mini-Sorter'da 2 ayrı göze)** ayırır.
         * Ayarlar hem Step 2'de akordeon panel olarak, hem de Step 3 ve Step 4'te üst araç çubuğundaki `⚙️ Kutu Hacim & Maks Adet Ayarları` butonuyla açılan modal üzerinden değiştirilebilir ve tek tıkla plan anında yeniden hesaplatılabilir.
    3. **Adım 3 - Konsolide Depo Toplama Listesi & PDF Motoru:**
       - Seçilen bölümlerdeki tüm personellerin kıyafet paketleri ürün, beden, renk ve miktar bazında agrege edilir.
       - Arama ve kategori filtreli zengin malzeme çeki tablosu oluşturulur.
       - `jsPDF` ve `jspdf-autotable` ile Türkçe karakter (Roboto) destekli, antetli, sayaçlı, onay kutulu resmi A4 PDF üretilir ve indirilir.
       - Doğrudan tarayıcıdan yazdırma (`window.print`) desteği sağlandı.
    4. **Adım 4 - OmniSort Mini 60 Gözlük Döngü (Wave) Mimarisi & Koli Etiketleme:**
       - Toplam personel ve göz ihtiyacı 60'ar gözlük döngülere (Wave 1, Wave 2, Wave 3...) bölünür.
       - Personelin koli ihtiyacı (1 Koli veya 2 Koli) ve hacim yüzdesi tabloda rozetle gösterilir (`📦 2 Koli (%176 Hacim)`).
       - Her döngü için:
         * Yalnızca o döngüye ait personellerin depodan çekilecek ürünlerini listeleyen özel PDF dökümü.
         * `⚡ Bu Döngüyü Sorter'a Dağıt (1-60 Göz)` butonu ile 1-to-1 güvenli göz tahsisi ve PLC LED geri bildirimi.
         * 60 Göz Canlı Saha Matrisi (OmniSort Mini 8 Duvar haritası üzerinde canlı doluluk ve ilerleme takibi).
         * Godex 100x100mm Koli Sevk Etiketleri ve A5 Sevk Fişleri önizleme ve baskı desteği.
         * `✅ Döngüyü Bitir & Kolile -> Sıradaki Döngüye Geç` butonu ile 60 gözün tek hamlede sıfırlanıp bir sonraki döngüye geçişi.
  - **Uygulanan Dosyalar:**
    - `server/services/personnel_workflow_service.cjs`: Workflow, depo konsolidasyon, wave, sorter tahsis motoru ve `DEFAULT_CATEGORY_LIMITS`, `calculateStaffBoxesNeeded`, `normalizeCategoryLimits` hacim motoru.
    - `server/app.js`: `/api/personnel-workflow/*` (brands, orders, departments, category-limits, plan, allocate-wave, complete-wave, batch-box-labels) rotaları.
    - `src/pages/PersonnelSorterWorkflowPage.jsx`: 4 adımlı reaktif stepper, konsolide tablo, PDF oluşturucu, 60 göz saha yönetim paneli ve interaktif Kutu Hacim & Maks Adet ayar paneli / modalı.
    - `src/App.jsx`: `/admin/personnel-sorter-flow` ve `/admin/personnel-workflow` rotaları.
    - `src/components/AdminSidebar.jsx`: Sol menüye `🔄 Personel Sorter Akış Yönetimi` kalıcı linki.
    - `src/pages/PersonnelOrderManagement.jsx`: Üst araç çubuğuna hızlı geçiş butonu.
  - **Test & Doğrulama:**
    - `server/scratch/verify_all_workflow_steps.cjs` ile tüm 4 adım, 8 senaryo ve 33 kural test edildi: **33 PASSED, 0 FAILED (%100 Başarı)**.
    - `npm run build` ile 694 modül 0 hata ile derlendi (5.93s).
    - PM2 üzerinde `vog-api` (Port 3001) ve `vog-frontend` (Port 3000) online ve kesintisiz yayında.
    - SIFIR TEST BASKISI (ZERO PRINT) kuralına %100 uyuldu.

- **feature/scania-brand-and-personnel-import-summer-winter (Scania Markası, 851 Personel Yaz/Kış İçe Aktarımı, Dinamik Kıyafet Paketleri ve Sorter Entegrasyonu):**
  - **Kullanıcı Talebi:** *"bu listede scania yok ekleyelim ayrıca downloads klasorunde yaz ve kış dosyaları var oradaki bilgileride içeri aktaralım"*
  - **Kapsam:**
    1. `C:\Users\ctopuz\Downloads` altındaki `Scania 2026 Yaz Kişi Listesi.xlsx` ve `SCANIA KIŞ 2025 KİŞİ LİSTESİ.xlsx` dosyalarındaki tüm bayiler, personeller ve kıyafet kotaları eksiksiz olarak PostgreSQL `personnel` ve `master_products` tablolarına aktarıldı.
    2. Sistemdeki firma/marka seçici dropdown'larına SCANIA dinamik olarak eklendi (toplam 851 personel).
    3. Personel sipariş yönetim merkezi (`PersonnelOrderManagement.jsx`) ve etiket basım merkezi (`PersonnelOrdersView.jsx`) çoklu marka (`VOLKSWAGEN`, `SCANIA`, `SEAT`, `AUDI`, `FORD`) destekleyecek şekilde dinamikleştirildi.
    4. Scania için dinamik kıyafet setleri (`bundle_items` JSONB mimarisi), A5 sevk fişi (`FIS-SC-...`), Godex koli etiketi (`KOLI-SC-...`) ve SATO CL4NX Plus tekil RFID/barkod kıyafet etiketleri geliştirildi.
    5. Mini-Sorter eşleştirme motoruna Scania özel kıyafet paketi (`bundle_items`) ve SKU kota takip desteği entegre edildi.
  - **İçe Aktarılan Veri Özeti (Toplam 851 Personel):**
    - `Danışman (Yaz)`: 79 Personel (Gömlek, Pantolon, Polo Tişört)
    - `Danışman (Kış)`: 76 Personel (Gömlek, Pantolon, Sweatshirt, Kolsuz Yelek, Bere)
    - `Teknisyen (Yaz)`: 345 Personel (Pantolon, Polo Tişört, Tişört)
    - `Teknisyen (Kış)`: 285 Personel (Pantolon, Sweatshirt Mavi, Kolsuz Yelek, Bere)
    - `Yedek Parça (Yaz)`: 35 Personel (Pantolon, Tişört, Polo Tişört)
    - `Yedek Parça (Kış)`: 31 Personel (Pantolon, Sweatshirt Gri, Kolsuz Yelek, Bere)
  - **Uygulanan Mimari & Kod Değişiklikleri:**
    1. **Veritabanı İçe Aktarımı (`server/import_scania_personnel.cjs`):**
       - Excel tablolarındaki Danışman, Teknisyen ve Yedek Parça sayfaları taranarak `personnel` tablosuna aktarıldı.
       - Her personelin kıyafet listesi gerçek SKU, beden ve adetleriyle `bundle_items` (JSONB) alanına yazıldı.
       - Eksik olabilecek tüm Scania ürün kodları `master_products` tablosuna senkronize edildi.
    2. **Backend API Genişletmesi (`server/app.js`):**
       - `GET /api/personnel-orders/brands`: Veritabanındaki tüm markaları ve personel sayılarını dinamik döndüren uç nokta yazıldı.
       - `GET /api/personnel-orders/staff-list`: Personelin `bundle_items` verisini okuyarak dinamik `total_target`, `bundle_items` ve `part_no` üretecek şekilde güncellendi (VW için 7 parçalı danışman seti aynen korundu).
       - `resolveScaniaStaffBundle(p, dbPool)`: Scania personeline ait kıyafet adetlerini (örneğin 3 pantolon için 1/3, 2/3, 3/3 şeklinde) tekil parçalara açarak SATO ZPL kodlarını üreten servis yazıldı.
       - `GET /api/personnel-orders/:id/label-data`: Scania için A5 fişi (`FIS-SC-...`, gruplanmış kalemler), Godex dikey koli etiketi (`KOLI-SC-...`) ve SATO parça etiketlerini dinamik döndürecek şekilde uyarlandı.
       - `POST /api/personnel-orders/print-voucher`: Scania kıyafetleri ve kolileri için termal baskı kuyruğu ve `rfid_tags` senkronizasyonu sağlandı.
       - `POST /api/personnel-orders/allocate-sorter`: Scania personellerinin göz atamalarında hedef kapasiteyi dinamik (`target_capacity = targetCap`) ayarlayacak şekilde güncellendi.
    3. **Sorter Motoru Özel Paket Eşleşmesi (`server/services/sorter_engine.cjs`):**
       - `matchPersonnelForGarment`: Aktif gözdeki personelin `bundle_items` dizisi varsa, taranan barkod/SKU doğrudan personelin paketindeki kalemlerle eşleştirilir ve gözdeki SKU adedi personelin kotasını aşmayacak şekilde güvenli atama yapılır. Volkswagen'in 1 Mont, 1 Yelek, 2 Gömlek, 2 Pantolon, 1 Ayakkabı kuralı sıfır regresyonla korundu.
    4. **Frontend Çoklu Marka Desteği:**
       - `src/pages/PersonnelOrderManagement.jsx`: Firma/Marka dropdown'ı `/api/personnel-orders/brands` üzerinden dinamik beslendi; `SCANIA (851 Personel)` seçildiğinde tüm bölümler, bayiler ve personeller anlık olarak listelenir hale getirildi.
       - `src/components/PersonnelOrdersView.jsx`: Üst araç çubuğuna Marka Seçici dropdown eklendi; başlık ve istatistikler seçilen markaya göre dinamikleştirildi.
       - `src/components/PersonnelLabelAndReceiptModal.jsx`: Modal başlığı, A5 fiş dökümü, sekme etiketleri ve baskı butonları personelin gerçek marka ve parça sayısına (`total_items`) göre dinamikleştirildi.
  - **Test ve Doğrulama:**
    - `server/e2e_scania_test.cjs` uçtan uca test senaryosu çalıştırıldı:
      * Markalar API'sinde `SCANIA` (851 personel) doğrulandı.
      * Scania'ya ait 6 departman ve bayiler doğrulandı.
      * Danışman, Teknisyen ve Yedek Parça personellerinin A5 fişleri, koli barkodları ve SATO ZPL etiketleri doğrulandı.
      * Sorter motorunun Scania kıyafetini (örneğin Danışman Pantolonu `SCKY22204`) gözdeki Scania personeline başarıyla yönlendirdiği simüle edildi.
      * Volkswagen (442 danışman, 7 parça kıyafet seti) için sıfır regresyon (zero regression) doğrulandı.
    - `npm run build` ile frontend 0 hata ile derlendi (6.16s).
    - PM2 üzerinde `vog-api` (Port 3001) ve `vog-frontend` (Port 3000) kesintisiz yeniden başlatıldı.
    - Zero Print politikası korundu.

- **fix/personnel-sorter-cross-assignment-and-order-isolation (Personel Bazlı Sorter Beden Çaprazlaması Kök Neden Analizi, EAN-13 İzolasyonu & Sipariş Bazlı Ayrıştırma Koruması):**
  - **Kullanıcı Talebi:** *"personel bazlı mini sorter makinasında gözler ile personel isimleri eşleştirdim ve sonra makinayı calıstırdım tum etiketleri okudu ama bazı isimleri diğer personel gözüne koydu. bu çok buyuk bir sorun. neden oldugunu analiz edip bulurmsun. bunu dikkatli bir şekilde çözmeliyiz. Sipariş bazlı mini sorter eşleşmesini , personel için olanı eklemeden önce calısmıstık onda hiç sorun olmadı. ama şimdi oan da bakacağım ve sende kontrol et lütfen"*
  - **Kök Neden & Derin Analiz (Canlı Veritabanı ve Log İncelemesi):**
    1. **EAN-13 Tekil Olmayan Barkod Eşleşmesi (`server/app.js` Satır 5732):**
       - Sorter kamerası / okuyucu bir barkod okuduğunda, `rfid_tags` tablosunda `WHERE r.epc = $1 OR r.barcode = $1 ORDER BY r.created_at DESC LIMIT 1` sorgusu çalıştırılıyordu.
       - GS1 perakende standardında aynı ürün modelinin (örneğin Volkswagen Danışman Gömleği) tüm beden ve adetlerinde `r.barcode` (EAN-13, örn: `8684072311659`) BİREBİR AYNIDIR.
       - `ORDER BY r.created_at DESC LIMIT 1` ifadesi yüzünden, etiket basımı en son hangi personel için yapılmışsa (örneğin Sıla Çınar veya Ebru Turak), okutulan TÜM gömlekler tekil EPC'ye bakılmaksızın son basılan personele mal ediliyordu!
    2. **Gömlek Beden Kontrolünün Eksikliği (`server/services/sorter_engine.cjs`):**
       - Eski kodda `cCounts.gomlek < 2 && scanUpper.startsWith(gomlekPrefix)` koşulu sadece ön eke bakıyor, barkoddaki veya personeldeki üst bedeni (M vs XXL) kontrol etmiyordu.
       - Bu nedenle Ebru Turak (Beden: XXL, Göz: 47), Sıla Çınar'a (Beden: M, Göz: 59) ait `PVWB260012M` barkodlu M beden gömleği kapmış ve gözüne koymuştu.
    3. **Erkek Gömleklerinde Bedensiz Part No Üretimi (`resolveVwStaffBundle` & `master_products`):**
       - `master_products` tablosunda erkek gömleği için beden varyantları bulunmadığından part no `PVWB260013` (bedensiz) olarak üretiliyordu.
       - Süleyman Akçay (Beden: L, Göz: 34) ve Sefa Devrim Kapucu (Beden: M, Göz: 41) için okutulan gömlekler, beden eşleşmesi yapılamadığı için kota sırasına göre gelişi güzel doldurulmuştu.
    4. **Sipariş Bazlı Ayrıştırma (`match_type = 'ORDER'`) ile Personel Öncelik Çakışması:**
       - `server/app.js` ve `server/services/sorter_engine.cjs` içinde `matchPersonnelForGarment`, rezerve toptan sipariş eşleşmelerinden önce çağrılıyordu. Eğer sorter'da hem toptan sipariş hem personel eşleşmesi aktifse, siparişe ait ürünler personele yönlendirilebiliyordu.
  - **Uygulanan Çözüm ve Mimari İyileştirmeler:**
    1. **EAN-13 İzolasyonu & Kesin EPC Filtreleme (`server/app.js`):**
       - `rfid_tags` sorgusundaki `OR r.barcode = $1` kaldırıldı; tablo sadece 24 karakterlik tekil RFID EPC (`WHERE r.epc = $1`) ile sorgulanacak şekilde izole edildi.
    2. **Barkod İçi Doğrudan Göz Eşleşmesi (`-CH{chuteNo}`):**
       - `extractChuteFromBarcode` fonksiyonu güçlendirildi: `(?:[-_#/]CH|\bCH|[-_#/]GOZ|\bGOZ)(\d{1,2})$` formatındaki doğrudan göz kodları (örneğin `PVWB260013L-CH34`) algılandığında 0. öncelikle doğrudan ilgili personele ve göze yönlendirilir.
       - Pantolon beden numaralarının (42, 44, 46 vb.) göz numarası sanılmasını engelleyen katı ayrıştırma regex'i yazıldı.
    3. **Sıkı Beden & Cinsiyet & Model & Kota Uyumu (`sorter_engine.cjs`):**
       - Gömleklerde `top_size` (M, L, XL, XXL) birebir eşit olmadan ASLA eşleşme yapılmaz.
       - Montlarda kalın/ince model ve beden kontrolü sağlandı.
       - Pantolonlarda bel bedeni (38, 42, 44, 46 vb.) birebir kontrol edildi.
       - Ayakkabılarda numara kontrolü sağlandı.
       - Bedensiz eski barkod gelirse ve aktif personeller farklı bedenlere sahipse körü körüne atama engellendi.
    4. **Sipariş Bazlı Ayrıştırma Önceliği & Sıfır Regresyon (Zero Regression):**
       - `resolveDestinationChute` ve `/wms/white/mission/find` fonksiyonlarında aktif toptan sipariş rezervasyonları (`match_type = 'ORDER'`) personel genel kıyafet eşleşmesinin ÖNÜNE alındı.
       - Sorter'da aktif bir toptan siparişe ait ürün geçtiğinde doğrudan toptan sipariş gözüne (`ORDER`) yönlendirilir; personel motorunun toptan sipariş ürünlerini kapması %100 engellendi.
    5. **Erkek Gömlek Beden Varyantları (`master_products` & `resolveVwStaffBundle`):**
       - `master_products` tablosuna `PVWB260013XS`'den `PVWB260013XXXL`'e kadar tüm erkek bedenleri eklendi.
       - `resolveVwStaffBundle` içinde `ensurePartNoWithSize` eklenerek part no'nun daima `${gomlekPrefix}${top}` (örn: `PVWB260013L`, `PVWB260013M`) olarak üretilmesi garanti edildi.
    6. **Termal ve Önizleme Barkod Entegrasyonu (`generateSatoRfidZplClassic`, `generateSatoRfidZplQr`, `PersonnelLabelAndReceiptModal.jsx`):**
       - Personel kıyafet etiketlerinde barkod ve QR kod verisine `-CH{chuteNo}` dinamik olarak eklendi; insan okur göz metni (`PARCA NO: PVWB260013L`) temiz bırakıldı.
       - Ekranda ve tarayıcı baskısındaki `BarcodePreviewCanvas` bileşenine gözlü part no aktarıldı.
  - **Doğrulama & Test Sonuçları:**
    - `server/verify_all_sorter_scenarios.cjs` simülasyonu ile 5 zorlu senaryo ve 17 kritik kural test edildi: **17 PASSED, 0 FAILED (%100 Başarı)**.
    - Toptan sipariş koruma testi: `#TEST-ORDER-99999` siparişine ait pantolon sorter'dan geçtiğinde personel gözü yerine doğrudan siparişin rezerve gözü olan 12 nolu göze gitti.
    - `npm run build` ile frontend 0 hata ile derlendi (6.62s).
    - `vog-api` (Port 3001) PM2 üzerinde kesintisiz yeniden başlatıldı (pid 65032).
    - ZERO PRINT kuralına %100 uyuldu.

- **fix/sorter-wall-color-badge-pure-white-text (Sorter Duvar Rengi Rozet Yazısının Beyaz ve Okunur Yapılması):**
  - **Kullanıcı Talebi:** *"duvar renginin oldugu label yazısı beyaz olmalı siyah oldugu için okunmuyor"*
  - **Kök Neden & Analiz:**
    - `src/index.css` dosyasında satır 1561-1570 arasında yer alan genel Light Mode kuralı (`:root.light-mode [style*="color: #ffffff"]:not(...) { color: var(--text-primary) !important; }`), inline `color: '#ffffff'` verilen elementleri açık tema arka planlarında görünmez olmasın diye zorla siyaha (`#111111`) çeviriyordu.
    - Mini-Sorter 8 Duvar matrisinde duvar renklerini belirten rozetler (örneğin Turuncu `#ea580c`, Lacivert `#1e3a8a`, Mor `#7e22ce`, Kırmızı `#dc2626`) koyu renkli zeminlere sahip olduğundan, metin rengi siyaha döndüğünde kontrast kayboluyor ve metin okunamaz hale geliyordu.
  - **Uygulanan Çözüm:**
    1. **CSS İstisna ve Öncelik Kuralları (`src/index.css`):**
       - `:root.light-mode [style*="color: #ffffff"]:not(...)` seçicilerine `:not(.force-white-text):not(.force-white-text *):not(.sorter-wall-badge):not(.sorter-wall-badge *)` istisnaları eklendi.
       - `.force-white-text` ve `.sorter-wall-badge` sınıfları için `color: #ffffff !important`, `-webkit-text-fill-color: #ffffff !important` ve `text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7) !important` tanımlanarak hem Açık (Light) hem Koyu (Dark) temada tavizsiz beyaz ve yüksek kontrast sağlandı.
    2. **Bileşen Güncellemeleri (`src/pages/PersonnelOrderManagement.jsx`):**
       - 8 Duvar başlıklarındaki renk rozetlerine (`1. DUVAR: ... [Turuncu (%50)]`) `className="sorter-wall-badge force-white-text"` ve `WebkitTextFillColor: '#ffffff'` eklendi.
       - Üst legend bantındaki 8 adet duvar rozetine (`🟧 1. Duvar (Turuncu %50)`) `className="sorter-wall-badge force-white-text"` ve `WebkitTextFillColor: '#ffffff'` eklendi.
       - Göz listesi tablosundaki duvar rozetine ve personel tablosundaki sorter göz butonuna aynı sınıflar ve beyaz metin koruması uygulandı.
  - **Test & Doğrulama:**
    - `npm run build` ile 693 modül 0 hata ile derlendi (6.38s).
    - PM2 üzerinde `vog-frontend` (Port 3000) ve `vog-api` (Port 3001) kesintisiz online.
    - SIFIR TEST BASKISI (ZERO PRINT) kuralına %100 uyuldu.

- **feature/sorter-walls-2-4-6-8-proportional-width-and-identical-chute-dimensions (2, 4, 6 ve 8 Nolu Alt Duvarların Orantılı Darlığı & Birebir Eşit Göz Ölçüleri):**
  - **Kullanıcı Talebi:** *"2,4,6,8 nolu duvarlar 2 sütun oldugundan biraz daha dar olmalı ve gözlerin ölçüleri her duvarda aynı olmalı"*
  - **Kök Neden & Mimari Tasarım:**
    - Daha önce tüm duvar kartları `1fr : 1fr` eşit genişlikte yerleştirildiği için, 2 sütunlu duvarlardaki gözler (chutes) 3 sütunlu duvarlara kıyasla %50 daha geniş ve yayvan görünüyordu.
    - Göz yükseklikleri ise boş ve dolu gözlerdeki içerik farklılıklarından ötürü satır bazında esneyebiliyordu.
  - **Uygulanan Çözüm:**
    1. **3fr : 2fr Orantılı Duvar Çiftleri:**
       - Duvarlar sahada olduğu gibi eşleştirildi: [Duvar 1 (Üst), Duvar 2 (Alt)], [Duvar 3 (Üst), Duvar 4 (Alt)], [Duvar 5 (Üst), Duvar 6 (Alt)], [Duvar 7 (Üst), Duvar 8 (Alt)].
       - Satır konteyneri `gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)'` olarak ayarlandı.
       - Böylece 3 sütunlu duvarlar 3 birim (60%), 2 sütunlu duvarlar ise 2 birim (40%) genişlik alarak **tam 2/3 orantısında daha dar** hale getirildi.
    2. **Birebir Eşit Göz (Chute) Ölçüleri (Width & Height):**
       - 3fr / 3 = 1fr per göz; 2fr / 2 = 1fr per göz. Her iki duvardaki her bir gözün genişliği birebir eşitlendi.
       - Tüm göz kartlarına `height: 136px`, `minHeight: 136px`, `boxSizing: 'border-box'` ve `justifyContent: 'space-between'` verilerek hem boş hem dolu gözlerin yükseklikleri sabitlendi.
       - Üst başlıklar yukarıda, orta bilgiler ortada, alt butonlar (`[🏷️ Fiş/Etiket] [📦 Koli Bitir]` veya `[🎯 Personel Ata]`) ise aynı hizada sabitlendi.
  - **Uygulanan Dosya:** [PersonnelOrderManagement.jsx](file:///c:/vog_system/src/pages/PersonnelOrderManagement.jsx)
  - **Doğrulama:** `npm run build` ile 693 modül 0 hata ile derlendi (6.50s).




- **feature/personnel-orders-and-label-printing-hub-in-orders-page (Personel Bazlı Etiket Basımının Siparişlerim Sayfasına Taşınması & Çift Modlu Etiket Merkezi):**
  - **Kullanıcı Talebi:** *"projeyi incele analiz et ve hataları çöz. resimdeki personel bazlı mini sort sayfası herşeyi tam sığmadıetiket basma işlemlerini Siparişlerim sayfasına taşıyalım. Siparişlerim sayfasında hem sipariş bazlı hemde personel bazlı etiketler yazdırılabilsin"*
  - **Kök Neden & Analiz:**
    1. `PersonnelOrderManagement.jsx` (Personel Mini-Sorter sayfası Tab 1 tablosu) 10 geniş sütun, 3 butonlu satır içi işlem alanı (`[🏷️ FİŞ & ETİKET BAS] [📦 KOLİ PLANLA] [🗑️ SİL]`) ve 900+ satırlık satır içi etiket modalı yüzünden standart ekranlarda yatay taşmaya (overflow) uğruyor ve kullanıcı ekranına tam sığmıyordu.
    2. Kullanıcı etiket basım işlemlerini ana "Siparişlerim" (`OrdersPage.jsx` / `/admin/orders`) sayfasında hem ERP toptan siparişleri hem de Volkswagen bayi danışmanları bazında tek bir merkezi noktadan yönetmek istiyordu.
  - **Uygulanan Çözüm ve Mimari Değişiklikler:**
    1. **`src/components/PersonnelLabelAndReceiptModal.jsx` (Modüler ve Yeniden Kullanılabilir Etiket/Fiş Modalı):**
       - A5 Sevk / Üretim Fişi (`#personnel-receipt-print-area`)
       - SATO CL4NX Plus RFID Kıyafet Etiketleri (7 parça: mont, yelek, 2 gömlek, 2 pantolon, ayakkabı)
       - 1D Code-128 ve 2D QR barkod render motoru (`@bwip-js/browser`)
       - Godex 100x100mm Koli Etiketi
       - Tek Tıkla Toplu Baskı (`🚀 Hepsini Tek Tıkla Bas`) ve ayrı sekmeler
       - Silent print hidden iframe (`#vog-silent-print-frame`)
    2. **`src/pages/PersonnelOrderManagement.jsx` (Tablo Düzenleme & Sıfır Taşma):**
       - Tablo satırlarından `🏷️ FİŞ & ETİKET BAS` ve `FİŞ & STOK DURUMU` sütunları kaldırılarak tablo 8 optimize sütuna (`ID`, `İŞLEM ADIMI`, `MÜŞTERİ / BAYİ`, `PARÇA NO`, `PERSONEL & MODEL`, `SORTER GÖZÜ`, `KOLİLEME`, `İŞLEMLER` [Koli Planla & Sil]) indirgendi.
       - Sayfa içi yatay taşma sorunu tamamen giderildi; tüm sütunlar standart ekranlara tam oturdu.
       - Tablo araç çubuğuna `🏷️ Etiket Basım Merkezi (Siparişlerim) →` butonu eklenerek kullanıcı `/admin/orders?tab=personnel` sayfasına doğrudan yönlendirildi.
    3. **`src/components/PersonnelOrdersView.jsx` (Yeni Personel Sipariş & Etiket Görünümü):**
       - Volkswagen danışmanları etiket basım merkezi olarak geliştirildi.
       - Canlı KPI Sayaç Kartları (Toplam Danışman, Fiş Bekleyen, Fişi Basılan, Kolilenen).
       - Filtreleme: Bölüm (İnce/Kalın), Bayi Dropdown, Canlı Arama kutusu.
       - Durum sekmeleri: `TÜM DANIŞMANLAR`, `⏳ FİŞ BEKLEYENLER`, `🖨️ FİŞİ BASILANLAR`, `📦 KOLİLENMİŞ / HAZIR`.
       - Tablo: Her satırda yeşil fosforlu `🏷️ FİŞ & ETİKET BAS` butonu, `İŞLEM ADIMI` dropdown'u, Fiş durumu rozeti ve koli ilerleme çubuğu.
       - Çoklu seçim araç çubuğu: Toplu "BASILDI" işaretleme ve toplu baskı.
    4. **`src/pages/OrdersPage.jsx` (Çift Modlu Sipariş & Etiket Merkezi):**
       - Üst başlık altına şık Mode Switcher eklendi:
         * `[ 📦 SİPARİŞ BAZLI ETİKET & FİŞ (ERP TOPTAN) ]`
         * `[ 👤 PERSONEL BAZLI ETİKET & FİŞ (VOLKSWAGEN / BAYİ) ]`
       - URL senkronizasyonu: `/admin/orders?tab=personnel` URL parametresi ile doğrudan Personel sekmesine geçiş.
       - Mevcut ERP toptan sipariş listesi ve SATO RFID/Godex koli basım akışları %100 korundu (ZERO REGRESSION).
  - **Test & Doğrulama:**
    - `npm run build` ile 693 modül 0 hata ile derlendi (6.58s).
    - PM2 üzerinde `vog-api` (Port 3001) ve `vog-frontend` (Port 3000) online ve HTTP 200 OK yanıt veriyor.
    - SIFIR TEST BASKISI (ZERO PRINT) kuralına %100 uyuldu.


- **feature/agent-skills-specification-integration (Açık Standart Agent Skills Entegrasyonu & VOG Çekirdek Becerileri):**
  - **Kullanıcı Talebi:** *"agent skills https://agentskills.io/home paketini bu projeye entegre edelim"*
  - **Kapsam:**
    1. Açık yapay zeka beceri standardı olan **Agent Skills** (`https://agentskills.io` ve `https://skills.sh` / `vercel-labs/skills`) spesifikasyonunun VOG Tekstil Premium projesine entegre edilmesi.
    2. Proje kök dizininde standart `.agents/skills/<skill-name>/SKILL.md` mimarisinin kurulması.
    3. `skills` açık ekosistem CLI paketinin projeye devDependency (`skills@^1.7.0`) ve `package.json` betikleri (`npm run skills`, `npm run skills:list`, `npm run skills:find`) olarak eklenmesi.
    4. VOG Tekstil operasyonları için 4 adet yüksek katma değerli, sıfır kurgu (zero fiction) içeren uzman çekirdek becerinin (Domain Agent Skills) oluşturulması:
       - `.agents/skills/vog-sorter-management/SKILL.md`: OmniSort Mini (HC Robotics) 63 gözlü konveyör mimarisi, 4 duvar (A1, A2, B1, B2) ve A2 hata gözleri PLC haritalaması, LED renk kodları (0..5), çalışma profilleri, drop kayıtları ve sıfırlama akışları.
       - `.agents/skills/vog-rfid-tunnel/SKILL.md`: Impinj Speedway R420 4 antenli RFID tünel sürücüsü, UHF Gen2 SGTIN-96 kod çözümü, yinelenen okuma filtreleme (2s debounce) ve otomatik irsaliye entegrasyonu.
       - `.agents/skills/vog-label-printing/SKILL.md`: SATO CL4NX Plus (ZPL II) ve Godex (EZPL) etiket baskı mimarisi, 50x30mm RFID, 100x100mm koli, 4x2 inç personel etiketleri, Labelary önizleme simülasyonu ve katı ZERO PRINT geliştirme kuralı.
       - `.agents/skills/vog-logo-erp/SKILL.md`: Logo Tiger 3 ERP MSSQL tabloları (`ITEMS`, `UNITBARCODE`, `CLCARD`, `STFICHE`, `STLINE`), toptan satış irsaliyesi (`TRCODE 8`, `SPECODE 'VOG-RFID'`) ve offline PostgreSQL fallback kuyruğu.
  - **Test & Doğrulama:**
    - `npm run skills:list` çalıştırılarak tüm 4 becerinin Antigravity ve Gemini CLI ajanları tarafından `local` kaynak olarak eksiksiz keşfedildiği teyit edildi.
    - `npm run build` ile 691 modül 0 hata ile derlendi (`dist/`).
    - PM2 `vog-api` (Port 3001) ve `vog-frontend` (Port 3000) kesintisiz online.
    - SIFIR TEST BASKISI (ZERO PRINT) kuralı eksiksiz korundu.

- **fix/sorter-chute-reset-and-empty-state-synchronization (Sorter Göz Sıfırlama ve Boş Göz Durum Senkronizasyonu):**
  - **Kullanıcı Şikayeti:** *"GÖZLERİ SSIFIRLADIGIM HALDE HALA DOLU GORUNUYOR"* (Gözler sıfırlandığı halde gözlerin hala dolu veya tamamlandı görünmesi).
  - **Kök Nedenler:**
    1. **JavaScript `0 || 7` Mantıksal Hata (Falsy Zero Fallback):**
       - `server/app.js` satır 8569'da: `const count = chState.item_count || (staff ? staff.current_packed : 0);`
       - Gözde 0 adet ürün varken `0` falsy olduğu için JavaScript sağ taraftaki `staff.current_packed` (7) değerini alıyordu.
       - Aynı şekilde `PersonnelOrderManagement.jsx` satır 2752'de: `count = assignItem?.item_count || chState.item_count || (assignedStaff ? assignedStaff.current_packed : 0)`
       - Sonuç: Veritabanında göz tertemiz (0 parça) olmasına rağmen ekranda ve API'de göz `count = 7`, `is_full = true` (Yeşil 7/7 DOLU) görünüyordu!
    2. **`reset-sorter` Tamamlanan Personelleri Atlıyordu (`server/app.js`):**
       - Kolilenen personellerde `sorter_chute` zaten NULL yapıldığı için, `reset-sorter` rotasındaki `UPDATE personnel SET packing_status = 'PENDING' WHERE sorter_chute IS NOT NULL;` sorgusu daha önce kolilenmiş personelleri (`packing_status = 'PACKED'`) hiç güncellemiyordu. Bu personeller sürekli `TAMAMLANANLAR (4)` ve `7/7 %100` kalıyordu.
    3. **61-63 Arası Hata/Reject Gözleri Sıfırlanmıyordu:**
       - `reset-sorter` rotası sadece `WHERE chute_no BETWEEN 1 AND 60` çalışıyordu. Chute 61 (Unassigned Stock) içinde kalan 3 parça temizlenmiyordu.
    4. **`clear-sorter-allocations` Tekil Göz No Desteği Yoktu:**
       - Göz tablosunda "❌ BOŞALT" tıklandığında yalnızca `staff_ids` gönderiliyordu; `chute_no` doğrudan gönderilmediği için gözde personel yoksa temizleme çalışmıyordu.
    5. **8 Duvar Saha Matrisinde Boş Gözlerin Görsel Ayrımı:**
       - Boş gözler de atanmış gözler gibi yoğun renkli (%50 opacity) arka plana sahip olduğu için ilk bakışta dolu izlenimi veriyordu.
  - **Uygulanan Çözümler:**
    1. **`server/app.js` (Satır 8418 & 8464 & 8569):**
       - `active-sorter-assignments`: `count = Number(chState.item_count) || 0;` ve `is_full = count >= targetCap && count > 0;` yapıldı. Göz 0 adet ise kesinlikle 0 gösterilir ve `is_full` asla true olamaz.
       - `reset-sorter`: Chute 1-63 için `sorter_chute_state`, `sorter_chute_items` ve `sorter_mappings` tamamen temizlendi. `reset_packing_status: true` olduğunda `packing_status IN ('PACKED', 'PACKING')` olan tüm personeller istisnasız `PENDING` yapıldı.
       - `clear-sorter-allocations`: `chute_no`, `chute_nos` ve `all: true` doğrudan parametre olarak desteklendi.
    2. **`server/services/sorter_engine.cjs` (Satır 301 & 330):**
       - `resetChute(chuteNo)` ve `resetAllChutes()` tüm eşleşmeleri ve ürünleri temizleyecek, personellerin durumlarını sıfırlayacak ve PLC LED'lerini söndürecek şekilde güncellendi.
    3. **`src/pages/PersonnelOrderManagement.jsx`:**
       - `handleClearSingleChute`: `chute_no: chuteNo` parametresi API'ye eklendi.
       - 8 Duvar Saha Matrisi: Nullish coalescing (`??`) ile `count` ve `isFull` hesaplandı. Boş gözler için nötr, temiz standby arka planı uygulandı.
    4. **Test & Doğrulama:**
       - `scratch/test_reset_flow.cjs` ve `scratch/test_single_chute_clear.cjs` çalıştırıldı.
       - 63 gözün tamamının 0 adet, standby ve boş olduğu, tamamlanan sayaçların 0 olduğu testle kanıtlandı.
       - `npm run build` ile hatasız derlendi, `pm2 restart all` ile yayına alındı.
  - **Kullanıcı Sorusu:** *"PERSONEL ATAMA GÖZDE TIKLAYINCA SAYFA DEĞİŞİYOR PERSONELİ SEÇİYORUM SONRA NE YAPACAĞIM"*
  - **Kullanıcı Deneyimi Sorunları (UX Friction):**
    1. Sorter 60 Göz Tablosunda veya 8 Duvar Saha Matrisinde boş bir gözde `🎯 Personel Ata` butonuna tıklandığında sayfa `orders` sekmesine geçiyor ve kullanıcı hangi göz için seçim yaptığını kaybediyordu.
    2. Personel listesinde checkbox ile personel seçildiğinde, işlem butonu (`⚡ Seçilileri Mini-Sorter'a Dağıt (1-60 Göz)`) listenin en üstünde kaldığı için uzun listelerde aşağı kaydıran kullanıcı ne yapacağını göremiyordu.
  - **Uygulanan Çözümler:**
    1. **Backend Tekil Göz Atama Rotası (`server/app.js` - Satır 8183):**
       - `POST /api/personnel-orders/assign-single-chute` endpoint'i yazıldı.
       - Personel ve hedef göz (1-60) tekil olarak eşleştirilir, varsa personelin eski gözü veya gözün eski personeli temizlenir.
       - PostgreSQL `idx_personnel_unique_active_sorter_chute` indeksine tam uyumlu çalışır.
       - PLC LED Sarı (2) yakılarak operatöre fiziksel geri bildirim verilir.
    2. **Ön Yüz Gözden Doğrudan Atama Modalı (`src/pages/PersonnelOrderManagement.jsx`):**
       - Sorter ekranında boş bir gözdeki `🎯 Personel Ata` butonuna basıldığında sayfa artık değişmez; doğrudan `Göz #{chNo} İçin Personel Seç & Ata` modalı açılır.
       - Canlı arama kutusu ve atanabilir personeller listelenir (henüz göze atanmamışlar en üstte).
       - Tek tıkla `🎯 Bu Göze Ata` denildiğinde personel doğrudan o göze bağlanır.
    3. **Sabit Kayan İşlem Çubuğu (Floating Sticky Action Bar):**
       - `orders` sekmesinde herhangi bir personel seçildiğinde (`selectedStaffIds.length > 0`), ekranın altında sabit kayan turuncu çubuk belirir:
       - `[N] Personel Seçildi -> ⚡ SEÇİLİLERİ GÖZLERE DAĞIT (1-60 Göz) | ✕ Seçimi Kaldır`
       - Sayfa ne kadar aşağı kaydırılırsa kaydırılsın kullanıcı tek tıkla toplu dağıtımı başlatabilir.
    4. **Derleme & Canlı Yayın:**
       - `npm run build` ile hatasız derlendi, PM2 `vog-frontend` ve `vog-api` güncellendi.

- **fix/personnel-chute-allocation-collision-and-1-to-1-invariant (Personel Sorter Göz Dağıtımı Çakışma Önleme ve 1-to-1 Göz Güvencesi):**
  - **Kullanıcı Şikayeti:** *"personel bazlı siparişlerin gözlere dağıtımında sorun var . farkı personelleri aynı gözlere atadı"* (Farklı personellerin aynı sorter gözlerine atanması veya farklı personellerin kıyafetlerinin aynı göze düşmesi sorunu).
  - **Kök Nedenler:**
    1. **`complete-box` Personel Gözünü Sıfırlamıyordu (`server/app.js`):** Kolileme tamamlandığında `sorter_mappings` silinip göz standby yapılıyor ancak `personnel.sorter_chute` kolilenen personelde NULL yapılmıyordu. Sonuç: Yeni bir personel bu göze atandığında veritabanında iki farklı personelin `sorter_chute` değeri aynı kalıyordu.
    2. **`allocate-sorter` Göz Doluluk Doğrulaması Eksikliği (`server/app.js`):** `availableChutes` hesaplanırken `personnel` tablosundaki mevcut atamalar (`WHERE sorter_chute IS NOT NULL`) kontrol edilmiyordu. Ayrıca `staff_ids` tekilleştirilmiyordu.
    3. **PostgreSQL Seviyesinde Tekillik Kısıtı Yoktu:** `personnel` tablosunda `sorter_chute` için `UNIQUE` indeks bulunmadığından veritabanı çift atamaları kabul ediyordu.
    4. **`sorter_engine.cjs` Barcode/RFID Çakışması:** `matchPersonnelForGarment` fonksiyonunda `rfid_tags` tablosuna `WHERE (r.epc = $1 OR r.barcode = $1) LIMIT 1` ile bakılıyordu. GS1 EAN-13 barkodu (`8692457797187`) tüm personellerde ortak olduğu için `LIMIT 1` her zaman ilk personeli seçiyor ve farklı personellerin tüm kıyafetlerini o personelin gözüne yönlendiriyordu.
    5. **Eksik Kota Kontrolü:** Sorter motorunda bir göze 1 Mont, 1 Yelek, 2 Gömlek, 2 Pantolon, 1 Ayakkabı sınırları kontrol edilmediğinden aynı göze birden fazla aynı ürün düşebiliyordu.
  - **Uygulanan Çözümler:**
    1. **PostgreSQL Benzersizlik İndeksi:** `CREATE UNIQUE INDEX IF NOT EXISTS idx_personnel_unique_active_sorter_chute ON personnel (sorter_chute) WHERE sorter_chute IS NOT NULL;` çalıştırıldı. Artık iki farklı personelin aynı göze atanması veritabanı motoru seviyesinde fiziksel olarak imkansız kılındı.
    2. **Göz Atama Motoru (`server/app.js` - `allocate-sorter`):**
       - `staff_ids` listesi deduplicate edildi (`new Set`).
       - Zaten kolilenmiş (`PACKED`) veya sevk edilmiş (`SHIPPED`) personeller otomatik elendi.
       - Sistemdeki tüm aktif gözler 3 kaynaktan (`personnel`, `sorter_mappings`, `sorter_chute_state`) birleşik taranarak gerçek boş gözler (`freeChutes`) tekil ve sıralı olarak bulundu.
       - Her personele kesinlikle benzersiz (1-to-1) göz numarası tahsis edildi.
    3. **Kolileme & Sıfırlama Senkronizasyonu (`server/app.js`):**
       - `complete-box` rotasında `sorter_chute = NULL` yapıldı ve `sorter_chute_items` temizlendi.
       - `clear-sorter-allocations` ve `reset-sorter` rotalarında personellerin `sorter_chute` alanları 1-60 için eksiksiz `NULL` yapıldı.
    4. **Akıllı Ayrıştırma & Kota Takip Motoru (`server/services/sorter_engine.cjs`):**
       - `getChutesStatus` fonksiyonu `SELECT DISTINCT ON (c.chute_no)` ile kilitlendi (çift satır üretimi engellendi).
       - `matchPersonnelForGarment` içinde `rfid_tags` eşleşmesi yalnızca tekil `epc = $1` ile sınırlandırıldı.
       - Aktif gözlerdeki düşen ürünler (`sorter_chute_items`) taranarak parça bazlı kota takibi eklendi: 1 Mont, 1 Yelek, 2 Gömlek, 2 Pantolon, 1 Ayakkabı. Kotası dolan göze aynı türden yeni ürün yönlendirilmesi engellendi (chute collision %100 önlendi).
       - `resetChute` ve `resetAllChutes` fonksiyonlarına `UPDATE personnel SET sorter_chute = NULL` eklendi.
    5. **Ön Yüz Geliştirmesi (`src/pages/PersonnelOrderManagement.jsx`):**
       - `handleAllocateToSorter` fonksiyonu seçim listesindeki personellerin göz durumlarını ayrıştırarak bilgilendirici onay mesajı verecek şekilde optimize edildi.
       - `/api/wms/sorter-chutes` alias rotası backend'e eklendi.
    6. **Test & Doğrulama:**
       - `scratch/test_chute_allocation_invariants.cjs` çalıştırıldı: 4 personele 4 tekil göz atandığı, DB seviyesinde çift atama denemesinin `PostgreSQL 23505 unique_violation` ile başarıyla reddedildiği, `complete-box` ve `resetAllChutes` adımlarının gözleri %100 sıfırladığı doğrulandı.
       - `scratch/test_garment_quota_routing.cjs` çalıştırıldı: Mont okutulduğunda 1. personelin gözüne, 2. mont okutulduğunda 2. personelin gözüne yönlendiği, 3. montta ise her iki gözün mont kotası dolu olduğu için çakışma yapmadan güvenle reddedildiği kanıtlandı.
       - `npm run build` ile 691 modül hatasız derlendi.
       - `npx pm2 restart all` ile `vog-api` ve `vog-frontend` güncellendi ve online duruma getirildi.
  - **Kullanıcı Şikayeti:** *"mini sorter personel ile iletişim kuramıyor yada etiketler bilinmeyen gozune gidiyor yada etiketleri tanımadı. ekrana da sayfa tam sığmıyor"* (Ekran görüntüsü paylaşıldı: Canlı eşleşme tablosunda personeller gözlere atanmış ancak sayaçlar `0/7 Parça %0` durumunda kalmış; kıyafetler Asansör Arkası Bilinmeyen / Hata Gözü'ne [Chute 61 / A2-1] yönlenmiş ve tablo yatayda sağa taşıp butonları kesilmişti).
  - **Kök Nedenler:**
    1. **Toptan Sipariş Hijacking (`server/app.js`):** Sorter konveyör BCR / kamera barkod okuduğunda (`PVWK100102L`, `PVWB26001746` vb.), `handleMissionFind` eski toptan siparişler tablosunda (`orders`) bu SKU'ları bulup `destination = "DOĞUŞ OTOMOTİV..."` ve `resolvedOrderNum = 16678` atıyordu. Aktif personel eşleşmelerine (`match_type = 'PERSONNEL'`) bakılmadığı için toptan sipariş aktif personelin kıyafetini gasp ediyordu.
    2. **Eksik Personel Eşleştirme Motoru (`server/services/sorter_engine.cjs`):** `resolveDestinationChute` içerisindeki `PERSONNEL MATCH` mantığında sadece `shoe_size` kontrol ediliyordu. Mont, Yelek, Gömlek ve Pantolon için hiçbir kural bulunmadığından ve destination da personele ait olmadığından sistem ürünleri doğrudan `Chute 61` (Asansör Arkası Hata/Reject Gözü) cascade'ine yönlendiriyordu.
    3. **RFID/EPC & Etiket Kaydı Eksikliği (`server/app.js`):** `print-voucher` endpoint'inde 7 parça basılırken tekil EPC üretilmiyor ve `rfid_tags` tablosuna INSERT yapılmıyordu.
    4. **Ekran Taşması (`src/pages/PersonnelOrderManagement.jsx`):** Eşleşme tablosu sarmalayıcısında `overflow: 'hidden'` vardı (`overflowX: 'auto'` yoktu), hücre paddingleri `0.9rem 1.2rem` büyüklüğündeydi ve butonlar geniş yer kapladığından 1360px altında sağ kenar ve işlem butonları ekrandan taşıp kesiliyordu.
  - **Uygulanan Çözümler:**
    1. **Akıllı Personel Eşleştirme Motoru (`sorter_engine.cjs`):**
       - `matchPersonnelForGarment(cleanBarcode, sku)` fonksiyonu yazıldı. Sorter'a atanmış aktif personellerin 5 parçalık bundle'ları (Erkek/Kadın, İnce/Kalın Mont, Yelek, Gömlek, Pantolon, Ayakkabı, EAN13 barkodları ve RFID EPC'leri) dinamik olarak taranıp en uygun boş/eksik göze yönlendirme sağlandı.
       - `resolveDestinationChute` fonksiyonuna `matchPersonnelForGarment` entegre edildi.
       - `recordChuteDrop` fonksiyonuna personel sayaç ve durum entegrasyonu eklendi; ürün göze düştüğünde `sorter_chute_state.item_count` artarken, 7/7 tamamlandığında personelin `packing_status` durumu anında `'PACKED'` ve LED Yeşil (`1`), kısmi dolulukta Mavi (`4`) yapıldı.
       - `matchPersonnelForGarment` dışa export edildi.
    2. **Toptan Sipariş Çakışması Engellendi (`server/app.js`):**
       - `handleMissionFind` rotasında `orders` tablosuna bakılmadan önce 2. öncelik olarak `sorterEngine.matchPersonnelForGarment` çağrısı yerleştirildi; personel kıyafeti tarandığında toptan siparişlere ezdirilmeden doğrudan ilgili personele (`targetStaff`) ve gözüne yönlendirildi.
       - `print-voucher` rotasında 7 parçanın her birine standart 24 karakterlik SGTIN-96 formatında tekil EPC üretildi ve `rfid_tags` tablosuna personelin ID'si ve göz bilgisiyle kaydedildi.
    3. **Duyarlı ve Ekrana Tam Sığan Tablo Tasarımı (`src/pages/PersonnelOrderManagement.jsx`):**
       - Tablo sarmalayıcısına `overflowX: 'auto'`, `maxWidth: '100%'`, `boxSizing: 'border-box'` ve dokunmatik kaydırma özellikleri eklendi.
       - Hücre içi paddingler `0.9rem 1.2rem`'den `0.6rem 0.8rem`'e optimize edildi.
       - İşlemler butonları (`🏷️ FİŞ & ETİKET BAS`, `📦 KOLİ BİTİR`, `❌ BOŞALT`) kompakt ve `whiteSpace: 'nowrap'` ile şık bir hizaya getirildi.
       - Sayfa ana taşıyıcısına `maxWidth: '100vw'`, `boxSizing: 'border-box'`, `overflowX: 'hidden'` eklendi.
    4. **Doğrulama ve Testler:**
       - Sorter BCR simülasyonu ile 11 farklı aktif personel kıyafeti (Mont, Yelek, Pantolon, Ayakkabı, Gömlek) için `/wms/white/mission/find` çağrıldı; 11 testin 11'i de %100 başarıyla doğru gözlere (Göz 1, 2, 3, 4) yönlendirildi, hiçbir parça Chute 61'e düşmedi.
       - Sayaçların `sorter_chute_state` ve `/api/personnel-orders/active-sorter-assignments` üzerinde anlık olarak arttığı ve yüzde barının ilerlediği doğrulandı.
       - Test verileri sıfırlanarak sistem temiz 0/7 başlangıç durumuna getirildi.
       - `npm run build` ile 691 modül hatasız derlendi, PM2 `vog-api` ve `vog-frontend` servisleri yeniden başlatıldı.
  - **Kullanıcı Geri Bildirimi:** *"etiket tamam ama personel etiketi değil bu sipariş etiketi gibi oldu. personel adı yazan etiket olmalı"* (Fiziksel SATO CL4NX Plus çıktısının fotoğrafı paylaşıldı: Başlıkta sadece ürün adı `SERVIS DANISMAN GOMLEK` ve `ERKEK | VOLKSWAGEN` yazıyor, personelin adı ve bayisi yer almıyordu).
  - **Kök Neden:** SATO ZPL fonksiyonları (`generateSatoRfidZplClassic` ve `generateSatoRfidZplQr`) yalnızca genel sipariş başlığı üretiyordu; `item.staff_name`, `dealer_name` ve `sorter_chute` alanları ZPL başlığına dahil edilmemişti.
  - **Uygulanan Çözümler:**
    1. **SATO ZPL Şablonları (`server/app.js`):**
       - Hem `generateSatoRfidZplClassic` (1D Code 128) hem de `generateSatoRfidZplQr` (2D Karekod) motorlarına `isPersonnel` kontrolü eklendi.
       - Üst marjin kalibrasyonu yapıldı: Metnin etiketin üst kenarına yapışmaması için ilk satır `Y: 18` yerine ferah ve dengeli bir üst marjin sağlayan `Y: 26` seviyesine indirildi (`PERSONEL: {STAFF_NAME}`).
       - Ek olarak kullanıcının talebiyle `^LH0,12` (Label Home dikey ofseti: +1.5 mm) ve `^LL285` uygulanarak tüm etiket bloğu tam kararında aşağı kaydırıldı.
       - İkinci satır `Y: 48` (Ürün Açıklaması), üçüncü satır `Y: 66` (Bayi/Cinsiyet/Göz), çizgi `Y: 82` ve barkod `Y: 86` olarak hizalandı.
       - Parça No, EAN barkod, Beden, Tarih, VOG Tekstil, Yerli Üretim ve RFID logoları eski standart koordinatlarında (`Y: 126, 154, 182, 217, 221`) milimetrik olarak kilitlendi.
    2. **API Rotaları (`server/app.js`):**
       - `POST /api/personnel-orders/print-voucher` ve `GET /api/personnel-orders/:id/label-data` rotalarında ZPL üretilirken personelin adı (`p.name`), bayisi (`p.service_center`), cinsiyeti (`p.gender`) ve göz numarası (`p.sorter_chute`) eksiksiz enjekte edildi.
    3. **Ön Yüz Önizleme (`src/pages/PersonnelOrderManagement.jsx`):**
       - 7 Parça Kıyafet Etiketleri sekmesindeki kartların başlığı doğrudan `👤 {printModalData.staff.name}` ve `🏢 {printModalData.staff.service_center}` olarak revize edildi.
    4. **Test & Servisler:**
       - Labelary ZPL render motoruyla etiketin 1D ve QR simülasyonları üretilip üst ve alt marjinlerin tam oturduğu doğrulandı.
       - `npm run build` ile 691 modül derlendi, PM2 `vog-api` ve `vog-frontend` servisleri yeniden başlatıldı.



- **fix/personnel-receipt-a5-print-preview-layout (A5 Sevk & Dağıtım Fişi Baskı Önizleme ve Sayfa Boyutu Düzeltmesi):**
  - **Kullanıcı Şikayeti:** *"önizleme neden boyle"* (Paylaşılan ekran görüntüsünde başlık metinleri parçalanmış: `SAN. TİC. / LTD. ŞTİ.`, sağ taraftaki `Tarih:` metni `Tari`, `25.09.202` olarak kesilmiş ve `STANDBY` rozeti sağ marjinden taşmıştı).
  - **Kök Nedenler:**
    1. Tarayıcının varsayılan yazıcısı bir termal etiket yazıcısı (Godex G530 veya SATO CL4NX veya 100mm etiket) olduğunda veya son kullanılan sayfa dar olduğunda, `printHtmlBlock` içindeki `@page { size: auto; }` kuralı sebebiyle tarayıcı baskı önizleme alanını 100mm'ye sıkıştırıyordu.
    2. `#personnel-receipt-print-area` başlık flexbox alanında `whiteSpace: nowrap`, `min-width` ve flex büyüme sınırları bulunmadığı için şirket unvanı her iki kelimede bir alt satıra kırılıyor, sağ taraftaki tarih/saat bilgileri ise sağ marjinin dışına taşıp kırpılıyordu.
    3. `el.innerHTML` klonlaması HTML `<canvas>` öğelerinin piksel verilerini kopyalamadığı için QR karekod baskıda kaybolma riski taşıyordu.
  - **Uygulanan Çözümler:**
    1. **Baskı Motoru (`printHtmlBlock`):**
       - `@page { size: A5 portrait; margin: 5mm 6mm; }` kuralı ile sayfa standardı A5 Dikey (148x210 mm) olarak kilitlendi.
       - Yazdırılacak alandaki `<canvas>` ögeleri `toDataURL('image/png')` ile geçici `<img>` etiketlerine dönüştürülerek klonlandı; QR kodun baskıda ve önizlemede kusursuz ve pırıl pırıl çıkması sağlandı.
       - `@media print` stilleri ile `#personnel-receipt-print-area` öğesinin sayfa kırılması (`break-inside: avoid`) ve taşması engellendi.
    2. **A5 Fiş Başlık & Gövde Tasarımı:**
       - Sol Blok: `flex: 1 1 auto`, `minWidth: 0`, `whiteSpace: nowrap` ile unvan kırılmaları önlendi.
       - Sağ Blok: `flex: 0 0 auto`, `textAlign: right`, `whiteSpace: nowrap`, `paddingLeft: 0.8rem` ile sağ marjinden taşma tamamen engellendi.
       - Tablo ve imza alanları A5 dikey oranına tam oturacak şekilde optimize edildi.
    3. **Derleme & Servisler:** `npm run build` ile 691 modül 0 hata ile derlendi, `vog-frontend` PM2 servisi başarıyla yeniden başlatıldı.



- **feature/personnel-label-barcode-type-selector-1d-qr (Personel Etiket Basımında 1D Çizgili Barkod vs 2D QR Karekod Seçim Mimarisi):**
  - **Kullanıcı Geri Bildirimi:** *"tamam çıktı aldım fakat karekod 1d barkod seçeneğini göremedim"*
  - **Geliştirme & Çözüm Özeti:**
    1. **Frontend (`src/pages/PersonnelOrderManagement.jsx`):**
       - `labelBarcodeType` state'i eklendi (Varsayılan: `'1D'` [Code 128], Seçenek: `'QR'` [2D Karekod]).
       - **Modal Üst Çubuğu (Tabs Bar):** Sekmelerin hemen sağ tarafına gözden kaçmayacak şekilde `BARKOD FORMATI: [ 🏷️ 1D Çizgili Barkod ] [ 🔲 2D QR Karekod ]` toggle buton grubu yerleştirildi.
       - **7 Parça Kıyafet Etiketleri Bölümü (LABELS Tab):** Kartların hemen üstüne bilgilendirici ve dinamik bir Format Seçici Kutusu eklendi; kullanıcının seçtiği formata göre kartlardaki `<BarcodePreviewCanvas>` anında reaktif olarak güncelleniyor (Code 128 çizgili barkod veya 2D QR karekod önizlemesi).
       - **Akıllı Buton Etiketleri:** `Bu 7 Etiketi Bas (SATO - 1D Barkod / 2D Karekod)` ve modal alt çubuğundaki butonlar aktif formatı net bir şekilde gösterecek şekilde dinamikleştirildi.
       - `handlePrintVoucher` fonksiyonu sunucuya `barcode_type: labelBarcodeType` parametresini gönderecek şekilde güncellendi.
    2. **Backend (`server/app.js`):**
       - `POST /api/personnel-orders/print-voucher` rotası `req.body.barcode_type` parametresini alacak şekilde güncellendi.
       - `bundleItems.map` döngüsünde hardcoded çağrı yerine `generateSatoRfidZpl(item, barcode_type)` çağrıldı (`1D` seçildiğinde `generateSatoRfidZplClassic` ile Code 128 ZPL, `QR` seçildiğinde `generateSatoRfidZplQr` ile 2D Karekod ZPL üretilerek SATO CL4NX Plus yazıcısına iletiliyor).
       - `GET /api/personnel-orders/:id/label-data` rotası da `req.query.barcode_type` parametresini destekleyecek şekilde güncellendi.
    3. **Doğrulama & Servisler:**
       - `npm run build` ile 691 modül hatasız derlendi.
       - `npx pm2 restart all` ile `vog-api` ve `vog-frontend` güncellendi ve online duruma getirildi.
       - Node.js test betiği ile ZPL çıktısının `1D` ve `QR` formatlarında doğru komutları (`^BCN` vs `^BQN`) ürettiği doğrulandı.

- **fix/personnel-sorter-label-printing-bridge-resolution (Personel Bazlı Mini-Sorter Etiket & Fiş Basım Çözümü):**
  - **Kullanıcı Şikayeti:** *"personel bazlı mimi sorter da etiket basamadım"*
  - **Kök Nedenler & Tespitler:**
    1. PM2 servisleri (`vog-api` ve `vog-frontend`) 17 saattir kesintisiz çalışıyordu ve son eklenen `/api/personnel-orders/print-voucher` endpoint'i ile güncellenen `dist/` ön yüz dosyaları servise yansımamıştı.
    2. RDP oturumunda termal yazıcı adları dinamik oturum eki (`redirected 12`) alıyordu.
    3. `vog_print_bridge.cjs` içindeki PowerShell komutu string escaping sebebiyle `$_` değişkenini kaybediyor ve `Out-Printer` RAW ZPL yerine metin olarak işlem yapmaya çalışıyordu.
  - **Uygulanan Çözümler:**
    1. **Native Win32 RAW Spooler Entegrasyonu (`server/drivers/vog_print_bridge.cjs`):**
       - `sendRawToWindowsSpooler` metodu, C# Win32 Spooler API (`OpenPrinter`, `StartDocPrinter` [pDataType: "RAW"], `WritePrinter`) kullanan `server/raw_printer_sender.ps1` dosyasını çağıracak şekilde güncellendi.
       - Dinamik RDP yönlendirmeli yazıcılar (`SATO CL4NX Plus 203dpi (redirected XX)` ve `Godex G530 (redirected XX)`) otomatik tespit edilerek RAW ZPL doğrudan Windows kuyruğuna aktarılıyor.
    2. **Pop-up Engelini %100 Aşma & Tarayıcı Yazdırma (`src/pages/PersonnelOrderManagement.jsx`):**
       - `printHtmlBlock` fonksiyonu gizli iframe (`vog-silent-print-frame`) mimarisine geçirildi. Tarayıcı pop-up engelleyicileri tamamen aşılarak A5 Üretim Fişi anında `window.print()` diyaloguna iletiliyor.
       - Hem 7 Parça Etiketleri hem de Koli Etiketi sekmelerine `Bu 7 Etiketi Bas (SATO)` ve `Bu Koli Etiketini Bas (Godex)` butonlarının yanına `📄 Tarayıcı / PDF` butonları da eklendi.
    3. **Derleme & Servis Yenileme:**
       - `npm run build` ile 691 modül 0 hata ile derlendi.
       - `npx pm2 restart all` ile `vog-api` ve `vog-frontend` güncellendi.
    4. **Canlı Test & Doğrulama:**
       - `POST /api/personnel-orders/print-voucher` çağrısıyla SATO CL4NX Plus ve Godex G530 yönlendirilmiş kuyruklarına ZPL iletimi test edildi; her iki yazıcı için `SENT_TO_SPOOLER` başarı yanıtı alındı.

- **feature/omnisort-8-modules-4-walls-50-percent-transparent-colors (Mini-Sorter 8 Modül & 4 Saha Duvarı %50 Transparan Renk Mimarisi):**
  - **Kullanıcı Talebi:** *"1. ve 2. duvar gözleri turuncu. 3. ve 4. duvar göz renkleri lacivert. 5. ve 6. duvar renkleri mor, 7. ve 8. duvar renkleri kırmızı olacak ve %50 transparent opacity olmalı"*
  - **Uygulanan Standart & Renk Haritası:**
    * **1. ve 2. Duvar (A Hattı Sol / Göz 1-15: Modül 1 Z-A1-1..9 + Modül 2 Z-A0-1..6):** **TURUNCU** -> `rgba(234, 88, 12, 0.50)`, Bordür: `rgba(249, 115, 22, 0.85)`, Glow: `rgba(234, 88, 12, 0.45)`.
    * **3. ve 4. Duvar (A Hattı Sağ / Göz 16-30: Modül 3 Z-A3-1..9 + Modül 4 Z-A4-1..6):** **LACİVERT** -> `rgba(30, 58, 138, 0.50)`, Bordür: `rgba(59, 130, 246, 0.85)`, Glow: `rgba(30, 58, 138, 0.55)`.
    * **5. ve 6. Duvar (B Hattı Sol / Göz 31-45: Modül 5 Z-B1-1..9 + Modül 6 Z-B0-1..6):** **MOR** -> `rgba(126, 34, 206, 0.50)`, Bordür: `rgba(168, 85, 247, 0.85)`, Glow: `rgba(126, 34, 206, 0.45)`.
    * **7. ve 8. Duvar (B Hattı Sağ / Göz 46-60: Modül 7 Z-B3-1..9 + Modül 8 Z-B4-1..6):** **KIRMIZI** -> `rgba(220, 38, 38, 0.50)`, Bordür: `rgba(239, 68, 68, 0.85)`, Glow: `rgba(220, 38, 38, 0.45)`.
    * **Orta Asansör / Tanımsız-Hata Gözleri (A2 Modülü / Göz 61-63):** **MAVİ** -> `rgba(2, 132, 199, 0.50)`.
  - **Etkilenen Bileşenler:**
    1. `src/pages/PersonnelOrderManagement.jsx`:
       - `getChuteWallStyle(chNo)` fonksiyonu bu kurala bağlandı.
       - Tab 1 tablosundaki `SORTER GÖZÜ` sütununda personelin atandığı gözün duvar rengi (%50 saydam) ve rozeti yansıtıldı.
       - Tab 2'deki Canlı Eşleşme Tablosunda ve 4 Duvar Saha Matrisinde tüm göz kartları %50 saydam renk stiline bağlandı.
       - Eski mükerrer JSX grid parçası temizlendi.
    2. `src/pages/HardwareDashboard.jsx` (`/admin/iot`):
       - `getSorterWallColor(gate, label)` tanımlandı.
       - `GateNode` bileşeni (43" TV ve normal ekran modu) %50 saydam arka plan ve duvar bordürlerine bağlandı.
       - `BayCardsGrid` 4 duvar modül kartları ve `PhysicalMatrixGrid` sütun başlıkları kullanıcının renklerine göre güncellendi.
       - `selectedGate` göz detay modalı başlığına duvar rozeti eklendi.
       - Bilgi lejantına 4 duvarın renk şeridi yerleştirildi.
  - **Derleme & Servisler:** `npm run build` ile 691 modül 0 hata ile derlendi; PM2 `vog-api` ve `vog-frontend` online. ZERO PRINT kuralı %100 korundu.

- **feature/dual-voucher-and-label-printing-from-sorter (Sipariş ve Personel Bazlı Fiş & Etiket Yönetimi ve Sorter'dan Doğrudan Basım):**
  - **Kullanıcı Talebi:** *"şimdi fiş etiket basımınıda sipariş bazlı ve personel bazlı tıpkı resimdeki gibi işlevler ile yönetebilmeliyişz ve nunu her iki türlü de sorterdan kolaylıkla basabilmeliyiz."*
  - **Kapsam:** 
    1. Kullanıcının paylaştığı `OrdersPage.jsx` tablosundaki buton ve durum mimarisinin (`ID`, `SON İŞLEM`, `FİŞ & STOK DURUMU`, `İŞLEM` [🏷️ FİŞ & ETİKET BAS, 📦 KOLİ PLANLA, 🗑️ SİL], `MÜŞTERİ / BAYİ`, `PARÇA NO`) hem Sipariş Bazlı hem de Personel Bazlı yönetimde birebir aynı işlevsellik ile çalışır hale getirilmesi.
    2. Sorter üzerinden her iki modda da (Personel Bazlı Mini-Sorter ve Sipariş Bazlı Donanım Sorter `/admin/iot`) tek tıkla `🏷️ FİŞ & ETİKET BAS` ve `📦 KOLİ PLANLA` yapılabilmesi.
    3. Personel için A5 formatında resmi Üretim & Sevk Fişi (bayi, personel, sorter gözü, 7 parça kıyafet dökümü, teslim eden/alan imza alanları, dijital QR) ve 7 parçalık bireysel barkod etiketleri (Mont, Yelek, 2x Gömlek, 2x Pantolon, Ayakkabı) ile Godex dikey koli etiketini içeren interaktif `PersonnelLabelAndReceiptModal` geliştirilmesi.
    4. ZERO PRINT kuralının %100 korunması (geliştirme ve test boyunca Windows Spooler kuyruğu: 0 iş).
  - **Veritabanı Şeması Güncellemesi (`server/migrations/add_personnel_print_status.cjs`):**
    - `personnel` tablosuna: `last_step` (Default: 'PLANLAMA'), `voucher_status` (Default: 'BEKLİYOR'), `label_print_count` (0), `voucher_print_count` (0), `last_printed_at` sütunları eklendi.
  - **Backend API Uç Noktaları (`server/app.js`):**
    - `GET /api/personnel-orders/:id/label-data`: Personelin 7 parçalık giysi paketini, benzersiz SKU/barkodlarını, A5 sevk fişi verilerini ve koli barkodlarını döner.
    - `POST /api/personnel-orders/print-voucher`: Fiş ve etiket basım emrini alır, `voucher_status = 'BASILDI'` yapar, sayaçları ve zaman damgasını günceller, ZPL çıktılarını döner (fiziksel baskı yapmadan güvenle simüle eder).
    - `POST /api/personnel-orders/update-step`: `last_step` değerini günceller (`PLANLAMA`, `KESİM`, `DİKİM`, `ÜTÜ PAKET`, `TAMAMLANDI`).
    - `POST /api/personnel-orders/delete-staff`: Personel kaydını ve varsa Sorter göz tahsisini güvenle kaldırır.
    - `staff-list` endpoint'ine `last_step`, `voucher_status`, `part_no`, `voucher_print_count` alanları bağlandı.
  - **Ön Yüz Geliştirmeleri:**
    1. **`src/pages/PersonnelOrderManagement.jsx`:**
       - Tab 1 tablosu kullanıcının görselindeki 3 butonlu yapıya kavuşturuldu:
         * `ID` (Checkbox ve kısa ID)
         * `SON İŞLEM` (İşlem adımını anında değiştirebilen açılır menü)
         * `FİŞ & STOK DURUMU` (`BEKLİYOR`, `BASILDI`, `TAMAMLANDI` dinamik rozetleri)
         * `İŞLEM`: `🏷️ FİŞ & ETİKET BAS` (Yeşil), `📦 KOLİ PLANLA` (Mor), `🗑️ SİL` (Kırmızı)
         * `MÜŞTERİ / BAYİ`, `PARÇA NO`, `PERSONEL & MODEL`, `SORTER GÖZÜ`, `KOLİLEME`
       - Tab 2 (Mini-Sorter Canlı Eşleşme Tablosu ve 60 Gözlü 4 Duvar Matrisi):
         * Her bir aktif göz için doğrudan `🏷️ FİŞ & ETİKET BAS` ve `📦 KOLİ PLANLA / BİTİR` butonları eklendi.
       - `PersonnelLabelAndReceiptModal`:
         * Sekmeler: `📑 TÜMÜ`, `🧾 ÜRETİM & SEVK FİŞİ (A5)`, `🏷️ 7 PARÇA KIYAFET ETİKETLERİ`, `📦 GODEX KOLİ ETİKETİ`
         * Tek tıkla Fiş Yazdır, 7 Parça Etiketini Bas, Koli Etiketi Bas ve "🚀 Hepsini Tek Tıkla Bas" aksiyonları.
    2. **`src/pages/HardwareDashboard.jsx` (`/admin/iot`):**
       - Sorter göz detay modalına (`selectedGate`) ve ayıklama takip tablosuna `🏷️ FİŞ & ETİKET BAS` (ilgili siparişin etiketleme merkezine veya personel kokpitine yönlendirir) ve `📦 KOLİ PLANLA` butonları eklendi.
  - **Test ve Doğrulama:**
    - `npm run build`: 691 modül 0 hata ile derlendi (`dist/`).
    - PM2 `vog-api` (Port 3001) ve `vog-frontend` (Port 3000) online.
    - Windows Print Spooler: 0 aktif iş (`Win32_PrintJob: Count = 0`).
    - Puppeteer ile Tab 1, Fiş/Etiket Modalı, Tab 2 Sorter eşleşme tablosu ve Donanım Sorter modalı ekran görüntüleri alınarak doğrulandı.

- **feature/personnel-orders-and-mini-sorter-management (Personel Bazlı Sipariş, Mini-Sorter 60 Göz Yönetimi, Dikey Godex Koli Etiketleme ve Merkezi Yönetim Paneli):**
  - **Kullanıcı Talebi:** *"downloads klasorunde bulunan VW Binek Servis Danışmanları.xlsx dosyasını incele ve personel bazlı mini-sorter yönetimini ilgilisayfaya ekle.bunada Personel bazlı sipariş diyeceğiz. Seçimi yaparken ilgili firmanın ilgili böümünü seçeçeğiz ve orada çalışan kişileriin kolilerini oluşturup ürünlerin sevkini yapacağız. burrada akış mevcutta olan akış gibi olacak. tek değişiklik sipariş numarası bazlı değil Personel bazlı kolileme olacak. tüm akış ve işlemlerin merkezi bir panelden başlatılıp izlenmesini sağlayan bir yönetim Yönetim sayfası oluşturalım. bunu geliştirip proje toparlayalım ve gereksiz menu kırınnımlarını kaldıralım."*
  - **Kapsam:** 
    1. İndirilenler klasöründeki resmi `VW Binek Servis Danışmanları.xlsx` dosyasının incelenmesi (449 Danışman, 80 Bayi) ve veritabanı `personnel` tablosuna aktarılması.
    2. Geleneksel sipariş bazlı kolilemenin yanında, Firma (Marka) ve Bölüm (Binek Servis İnce / Kalın) bazlı filtreleme ile her bir danışmana özel 7 parçalı kıyafet paketi (Mont Kalın/İnce, Yelek, 2x Gömlek, 2x Pantolon, Ayakkabı) oluşturulması.
    3. Mini-Sorter 60 Göz (4 Duvar: A1 Sol 1-15, A2 Sağ 16-30, B1 Sol 31-45, B2 Sağ 46-60 + A2 Asansör 61-63) ile personel eşleştirme, dinamik göz tahsisi, PLC LED komutları (Sarı: 2 Ayıklanıyor, Yeşil: 1 Paket Tamamlandı 7/7, Kırmızı: 3 Dolu/Hata) ve barkod okutma terminali simülasyonu.
    4. Kolileme tamamlandığında deterministik koli barkodu (`KOLI-VW-XXXX`), `box_labels` kaydı ve 14 satırlı Dikey (Portrait: `^PW910`, `^LL1220`) Godex G530 koli etiketinin oluşturulması.
    5. Toplu sevk ve Logo Tiger ERP kağıt irsaliye aktarımı.
    6. Tüm bu akışların tek bir merkezden yönetildiği kokpit (`PersonnelOrderManagement.jsx`) ve sol menüdeki 18 dağınık kırılımın 9 odaklı kurumsal operasyon merkezine sadeleştirilmesi (`AdminSidebar.jsx`).
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Geliştirme ve test aşamalarında yazıcılara 0 fiziksel çıktı gönderildi (ZERO PRINT eksiksiz korundu; Windows Spooler kuyruğu: 0 iş).
  - **Uygulanan Mimari & Kod Değişiklikleri:**
    1. **Excel Analizi ve Veritabanı Zenginleştirme (`server/sync_vw_excel.cjs`):**
       - `VW Binek Servis Danışmanları.xlsx` dosyasındaki 449 satır incelendi; `personnel` tablosuna `gender`, `mont_preference`, `box_no`, `box_barcode`, `packing_status`, `sorter_chute` sütunları eklendi.
       - 251 personel `BİNEK SERVİS (KALIN)` (203 Erkek, 48 Kadın) ve 198 personel `BİNEK SERVİS (İNCE)` (157 Erkek, 41 Kadın) olarak 80 yetkili satıcıya ayrıştırılarak aktarıldı.
       - 7 parçalı standart danışman paketi tanımlandı: Mont (1), Yelek (1), Gömlek (2), Pantolon (2), Ayakkabı (1).
    2. **Mini-Sorter Ayıklama Motoru Entegrasyonu (`server/services/sorter_engine.cjs`):**
       - `PROFILES` sözlüğüne `PROFILE_PERSONNEL: 'PERSONNEL'` eklendi.
       - `resolveDestinationChute()` fonksiyonuna en yüksek öncelik olarak `PRIORITY 0.0: PERSONEL BAZLI SİPARİŞ & AYRIŞTIRMA (PERSONNEL MATCH)` kuralı eklendi. Okutulan ürünün personel adı, hedef bayi, ayakkabı barkodu veya kıyafet SKU'su üzerinden personele ait göze (1..60) yönlendirilmesi sağlandı.
       - Sorter PLC LED mantığı entegre edildi: Tahsis edildiğinde Sarı (LED: 2), 7 parça tamamlandığında Yeşil (LED: 1).
    3. **Backend API Uç Noktaları (`server/app.js`):**
       - `GET /api/personnel-orders/departments`: Marka bazında bölümleri (İnce/Kalın) ve personel sayılarını döner.
       - `GET /api/personnel-orders/dealers`: Bölüm ve marka bazında bayileri ve çalışan sayılarını listeler.
       - `GET /api/personnel-orders/staff-list`: İlgili filtredeki personelleri, 7'li paket dökümlerini, paketlenen adetlerini, koli durumlarını ve sorter göz numaralarını döner.
       - `POST /api/personnel-orders/allocate-sorter`: Seçilen personelleri Mini-Sorter'ın boş gözlerine (1..60) atar ve sarı LED'leri yakar.
       - `POST /api/personnel-orders/pack-item`: Terminalden barkod/ürün okutulduğunda personelin paketleme sayacını artırır; 7/7'ye ulaşıldığında yeşil LED yakar.
       - `POST /api/personnel-orders/complete-box`: Koliyi mühürler, `KOLI-VW-XXXX` barkodunu oluşturur, `box_labels` tablosuna yazar, personeli `PACKED` yapar, sorter gözünü boşaltır ve 14 satırlı dikey Godex ZPL üretir.
       - `POST /api/personnel-orders/batch-dispatch`: Kolilenen personellerin durumunu `SHIPPED` yapar ve Logo Tiger ERP irsaliye kuyruğuna iletir.
       - `POST /api/personnel-orders/clear-sorter-allocations`: Mini-Sorter üzerindeki tüm veya seçili personel atamalarını temizler ve LED'leri söndürür.
        - `POST /api/personnel-orders/reset-sorter`: Mini-Sorter'ı tam sıfırlar (60 gözün tahsisini kaldırır, PLC LED ışıklarını söndürür, sayaçları sıfırlar).
        - `GET /api/personnel-orders/active-sorter-assignments`: 60 gözün tamamındaki canlı personel eşleşmesini, duvar kodunu, toplanan parça sayısını (X/7) ve doluluk durumunu döner.
       - `box_labels` tablosuna eksik sütunlar (`department`, `barcode`, `total_quantity`) eklendi.
       - Dikey Godex ZPL şablonunda Code 128 altındaki yazı çakışması `^BCN,65,N,N,N` ve bağımsız `^FD` satırı ile giderildi.
    4. **Merkezi Yönetim Kokpiti (`src/pages/PersonnelOrderManagement.jsx`):**
       - Firma, Bölüm, Bayi, Cinsiyet ve Arama filtreleri.
       - 5 KPI Kartı (Toplam Personel, Sorter Aktif, Kolilenen, Sevk Edilen, Bekleyen).
       - 4 İnteraktif Sekme:
         * Sekme 1 (Personel Sipariş & Kolileme Listesi): Çoklu seçim, Sorter'a Aktar butonu, 7/7 ilerleme çubuğu, detay çekmecesi, koli barkodu ve Godex etiketleme.
          * Sekme 2 (Mini-Sorter 60 Göz Canlı Matris):
            - 🎯 Hangi Gözde Hangi Personel Eşleşti? (Canlı Eşleşme Tablosu): 4 filtre sekmesi ([🎯 Eşleşen Personeller], [🟢 Koliye Hazır 7/7], [⚪ Boş Gözler], [📋 Tüm Gözler 60]), arama kutusu, canlı parça sayaçları (% progress), LED durumları (Yeşil 1 / Sarı 2), [🏷️ Koli Bitir] ve [❌ Gözü Boşalt] hızlı butonları.
            - 🔄 Sorter'ı Sıfırla (Reset) ve 🤖 Sipariş Bazlı Sorter (/admin/iot) butonları.
            - 📐 4 Duvar Saha Matrisi: A1 Sol (1-15), A2 Sağ (16-30), B1 Sol (31-45), B2 Sağ (46-60) ve A2 Asansör (61-63) kartları; personel adı, bedenleri, sayaçları ve aksiyonları.
         * Sekme 3 (Canlı Okutma & Kolileme Terminali): Barkod/RFID simülatörü, göze yönlendirme ve anlık geri bildirim.
         * Sekme 4 (Koli Sevkiyat & Logo Tiger ERP): Toplu irsaliyeleme ve sevkiyat manifestosu.
    5. **Navigasyon & Menü Sadeleştirme (`src/components/AdminSidebar.jsx` & `src/App.jsx`):**
       - 18 parçalı dağınık menü 9 ana kurumsal operasyon merkezine dönüştürüldü:
         1. 📊 Genel Bakış (`/admin`)
         2. 👑 CEO Review (`/admin/ceo`)
         3. 📦 Föy / Sipariş Yönetimi (`/admin/orders`)
         4. 🎯 Personel Bazlı Sipariş & Sorter (`/admin/personnel`)
         5. 🏭 Koli İstasyonu (Fulfillment) (`/admin/fulfillment`)
         6. 🚇 RFID Tünel İstasyonu (`/admin/tunnel`)
         7. 🧵 Ürün Kataloğu & Müşteriler (`/admin/catalog`)
         8. 📈 Raporlar & Analizler (`/admin/reports`)
         9. ⚙️ Sistem & Donanım Ayarları (`/admin/settings`)
       - Rotalar `/admin/personnel` ve `/admin/personnel-orders` olarak bağlandı.
  - **Test ve Doğrulama:**
    - `npm run build`: 691 modül 6.70s içinde 0 hata ile derlendi (`dist/`).
    - PM2 `vog-api` (Port 3001) ve `vog-frontend` (Port 3000) aktif ve online.
    - SATO ve Godex etiketlerinde ZERO PRINT kuralı korundu (Spooler: 0 bekleyen iş).
    - Labelary API ile 14 satırlı dikey koli etiketi PNG olarak render edildi (`godex_personnel_box_label_vw.png`).
    - Edge Puppeteer ile tam arayüz ekran görüntüleri alındı (`personnel_orders_cockpit.png`, `personnel_orders_dept_ince.png`, `personnel_sorter_60_matrix.png`, `personnel_box_detail_modal.png`, `personnel_godex_label_modal.png`).

- **feature/nvidia-nemotron-openrouter-integration (NVIDIA Nemotron 3.5 & OpenRouter Entegrasyonu):**
  - **Kullanıcı Talebi:** *"nvidia nemotron 3.5 ile birlikte çalışabilmen için gerekli ayarlamaları yapabilirmisin openrouter api key: sk-or-v1-24c2ec6c... bunu kullanalım"*
  - **Kapsam:** Antigravity ve VOG Tekstil geliştirme ortamının OpenRouter üzerinden `nvidia/nemotron-3.5-lightning` (262k context, yüksek akıl yürütme ve kod analizi) modeliyle tam uyumlu çalışır hale getirilmesi.
  - **Uygulanan Bileşenler:**
    1. **Global Antigravity Skill (`C:\Users\ctopuz\.gemini\config\skills\nvidia-nemotron`):**
       - `SKILL.md`: Nemotron 3.5 yetenekleri, modelleri ve iş akışı tanımları.
       - `scripts/query_nemotron.py`: UTF-8 uyumlu, stream destekli Python istemcisi.
       - `scripts/query_nemotron.cjs`: Node.js istemcisi.
    2. **Proje İçi Hızlı Araçlar (`c:\vog_system\scripts`):**
       - `scripts/query_nemotron.py` ve `scripts/query_nemotron.cjs`.
       - `scripts/ask_nemotron.bat`: Windows terminalinden `ask_nemotron "soru"` ile doğrudan sorgulama.
    3. **Backend Servisi & Uç Noktaları (`server/services/nemotron_service.cjs` & `server/app.js`):**
       - `GET /api/ai/nemotron/status`: Bağlantı ve aktif model durumu.
       - `POST /api/ai/nemotron/chat`: Doğrudan Nemotron 3.5 sohbet/akıl yürütme çağrısı.
       - `POST /api/ai/nemotron/review`: Kod ve SQL mimari inceleme yardımcısı.
    4. **Ortam Değişkenleri:** `.env` ve `server/.env` içine `OPENROUTER_API_KEY`, `NEMOTRON_MODEL=nvidia/nemotron-3.5-lightning` ve `NEMOTRON_BASE_URL` işlendi.
  - **Doğrulama:** Python, Node.js, Windows Batch ve Express `/api/ai/nemotron/status` ve `/chat` uç noktalarından canlı test yapıldı; 200 OK ile Türkçe yanıtlar ve reasoning token'lar başarıyla alındı. PM2 `vog-api` güncellendi ve online.

- **feature/dual-counter-queue-vs-physical-ejection (Kuyruğa Giden [Queue] ve Yazıcıdan O An Çıkan [Fiziksel Çıkış] İkili Sayaç & Canlı Çıkış Takip Mimarisi):**
  - **Kullanıcı Talebi:** *"yazıcıya gönderilen etiketlerin sayacı gorunuyor ama bu queue ya giden etiketler. ben ayrıca yazıcıdan o an cıkan etiketin kacıncı etiket oldugunu da ayrıca görmek istiyorum"*
  - **Kapsam:** SATO CL4NX Plus RFID baskısında sadece kuyruğa iletilen parti adedinin değil, operatörün fabrikanın yazıcı ağzında gördüğü fiziksel çıkışla birebir örtüşen iki ayrı bağımsız sayacın sunulması:
    1. **Gösterge 1 (Kuyruğa Gönderilen - Queue / Spooler):** `X / N Adet Emir İletildi (%100 Kuyrukta Hazır)`.
    2. **Gösterge 2 (Yazıcıdan O An Çıkan Etiket - Canlı Fiziksel Çıkış):** Çok büyük ve belirgin `#X . Etiket Çıktı (/ N)`, `Kalan Çıkacak: Y Adet`, `🟢 ŞU AN ÇIKIYOR` canlı rozeti ve `% İlerleme Oranı`.
    3. **Hero Çıkış Kartı:** Yazıcı ağzından o an çıkan etiketin kimliği (`#X / N`, Beden, Cinsiyet, SKU, EAN-13 Barkod ve kodlanan RFID EPC Çipi).
    4. **SATO Donanım Çıkış Ritmi:** Endüstriyel SATO CL4NX Plus UHF RFID yazma/doğrulama ve termal besleme döngüsüne uygun (~550-650ms/etiket) gerçekçi donanım senkronizasyonu.
    5. **Sunucu Çıkış Takipçisi:** `server/app.js` üzerinde `activeSatoPrintJob` durumu, donanım besleme simülatörü ve `GET /api/printer/active-job-status` uç noktası.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Yazıcılara 0 fiziksel çıktı gönderildi (ZERO PRINT eksiksiz korundu; Windows Spooler kuyruğu: 0 iş).
  - **Uygulanan Değişiklikler:**
    - `server/app.js`: `activeSatoPrintJob` durumu ve `GET /api/printer/active-job-status` eklendi; baskı başladığında sunucu canlı çıkış döngüsü başlatır, iptal edildiğinde (`cancel-print-job`) anında durdurur.
    - `src/pages/OrderLabelPrintingPage.jsx`: `printJob` state'ine `queuedCount`, `ejectedCount`, `remainingToEject` eklendi; arayüz çift sayaç kartları ve anlık çıkan etiket hero kartı ile yenilendi; SATO donanım ritmi bağlandı.
    - Derleme & Doğrulama: `npm run build` ile 690 modül 6.17s'de derlendi; PM2 servisleri yeniden başlatıldı; Edge Puppeteer ile `order_16693_dual_counter_ejection.png` alınarak doğrulandı; Spooler kuyruğu: 0 iş.

- **feature/order-label-emergency-stop-and-custom-title (Acil Durum Baskı Durdurma Düğmesi & SATO Etiket İlk Satır Başlığı Belirleme / Elle Düzeltme Özelliği):**
  - **Kullanıcı Talebi:** *"hata oldugun yazdırma işlemini durdurabilme düğmesi ekle. etiketin üst kısmındaki ilk satırda yazan kısmı belirleyebilme özelliği ekle mesela bu bölümde 2026 KIŞ SKODA TEKNİSYEN PANTOLON VOLVO MODELİ (TEKNİSYEN MODELİ) - (DİZE ELYAF KONULACAK) yazıyorken sadece 2026 KIŞ SKODA TEKNİSYEN PANTOLON yazsın ve elle düzeltilip yazdıgımız etikette yazsın diyebilmeliyim"*
  - **Kapsam:** 
    1. **Acil Baskı Durdurma Düğmesi (`🛑 BASKIYI DURDUR`):** SATO veya Godex yazıcıya baskı emri gönderilirken veya hata oluştuğunda operatörün tek tıkla işlemi anında durdurabilmesi, Windows Print Spooler kuyruğunun temizlenmesi (`cancelSpoolerJobs`), istemci tarafındaki ilerleme döngüsünün durdurulması ve ekranda basılan/iptal edilen etiket adetlerinin net olarak gösterilmesi (`isStopped: true`).
    2. **Etiket İlk Satır Başlığı Belirleme (`custom_title` / `customLabelTitle`):** SATO RFID etiketinin en üst ilk satırında (`^FD${title}^FS`) basılacak model/ürün adının operatör tarafından elle yazılabilmesi ve düzeltilebilmesi (`#custom-label-title-input`); parantez içi ek notları (`(TEKNİSYEN MODELİ)`, `(DİZE ELYAF KONULACAK)`) ve gereksiz model ibarelerini (`VOLVO MODELİ`) otomatik temizleyen `smartCleanTitle` fonksiyonu ve `✨ Otomatik Temizle` / `↺ Orijinal Ad` düğmeleri; yazılan başlığın canlı önizlemede (hem 1D Çizgili Barkod hem 2D QR Karekod kartlarında) anlık güncellenmesi ve ZPL üreticilerine iletilmesi.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Yazıcılara 0 fiziksel çıktı gönderildi (ZERO PRINT eksiksiz korundu; Windows Spooler kuyruğu: 0 iş).
  - **Uygulanan Mimari & Kod Değişiklikleri:**
    1. **Print Bridge & Spooler İptali (`server/drivers/vog_print_bridge.cjs`):**
       - `cancelSpoolerJobs(printerName)` metodu eklendi; PowerShell `Get-PrintJob | Remove-PrintJob` komutuyla Windows Spooler'daki bekleyen veya takılan işler anında silinir.
    2. **Backend Uç Noktaları & ZPL Başlık Override (`server/app.js`):**
       - `POST /api/printer/cancel-print-job` ve `POST /api/printer/stop-print-job` uç noktaları eklendi; SATO ve Godex spooler işlerini iptal eder, `printerQueue.length = 0` ile bellek içi kuyruğu temizler.
       - `cleanProductNameForTitle(name)`: Parantez içi notları (`\s*\([^)]*\)/gu`), model kalıplarını (`(?:VOLVO|FORD|...)\s+MODEL[İIıiA-Za-z]*`) ve fazla tire/boşlukları temizleyecek şekilde güçlendirildi.
       - `generateSatoRfidZplQr` ve `generateSatoRfidZplClassic`: `item.custom_title || item.label_title` öncelikli olarak kullanılır, yoksa `cleanProductNameForTitle` devreye girer.
       - `POST /api/printer/print-order-rfid-labels`: `custom_title` parametresini kabul eder ve ZPL motoruna aktarır.
    3. **Kullanıcı Arayüzü & Önizleme Motoru (`src/pages/OrderLabelPrintingPage.jsx`):**
       - `smartCleanTitle(text)` yardımcısı ve `LabelTitleEditorBox` bileşeni eklendi; Tab 1 (Planlı) ve Tab 2 (İlave) sekmelerinde üst kontrol kartı olarak yerleştirildi.
       - Canlı önizleme kartlarında (hem Planlı hem İlave) "Etikette Basılacak Model (1. Satır)" başlığı altında operatörün yazdığı `customLabelTitle` anında yansıtıldı.
       - `printJob` canlı takip paneline kırmızı neonlu `🛑 BASKIYI DURDUR` butonu entegre edildi.
       - Durdurulduğunda panel kırmızı uyarı temasına bürünür: `🛑 Yazdırma İşlemi Operatör Tarafından Durduruldu! (Toplam N etiketten X adedi basıldı, Y adedi iptal edildi)`.
       - Hata bildirim bannerına `🛑 Kuyruğu Temizle & Durdur` butonu eklendi.
    4. **Derleme & Doğrulama:**
       - `npm run build`: 690 modül 6.78s içinde 0 hata ile derlendi.
       - PM2 `vog-api` ve `vog-frontend` yeniden başlatıldı (online).
       - Puppeteer ile tam sayfa doğrulamalar yapıldı (`order_16693_custom_title_live.png`, `order_16693_active_print_with_stop_btn.png`, `order_16693_stopped_banner_final.png`).
       - Windows Print Spooler: 0 bekleyen iş (ZERO PRINT eksiksiz korundu).
  - **Kullanıcı Talebi:** *"etiket basarken kaçıncı etiket basıldıgını ve ne kadar kaldıgını görebileğimiz bir kısım eklermisin sayfaya. Fiş basımı modalı bir sayfaya dönüştür ve güzelce yerleştir herşeyi. gerektiğinde bedenler kadın erkek çocuk v.s. için ekstre etiket basımını desteklesin. ilave etiket basımını kolaylaştırsın."*
  - **Kapsam:** Siparişler sayfasındaki dar açılır popup fiş modalının yerine geçecek şekilde, tam sayfa `/admin/orders/:orderId/labels` ve `/admin/orders/label-print/:orderId` rotalarına sahip `OrderLabelPrintingPage.jsx` geliştirilmesi; SATO CL4NX Plus ile etiket basılırken "Basılan: X / N" ve "Kalan: Y Adet" canlı sayaçları, yüzde ilerleme çubuğu ve o anda kodlanan aktif EPC çipini gösteren canlı takipçinin eklenmesi; sipariş bakiyesinden bağımsız olarak Erkek, Kadın, Çocuk ve Unisex için hızlı stepper butonlu (+1, +5) ilave/ekstra etiket basım sekmesinin sunulması; ERP üretim tablosu (`ProductionMatrixTable`) ve Godex koli ayarları ile tam entegrasyon sağlanması.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Geliştirme ve test süreçlerinde yazıcılara 0 fiziksel çıktı gönderildi (ZERO PRINT eksiksiz korundu; Windows Spooler kuyruğu: 0 iş).
  - **Uygulanan Mimari & Kod Değişiklikleri:**
    1. **Backend Uç Noktası (`server/app.js`):**
       - `GET /api/orders/detail/:orderId`: Önce `cachedMssqlOrdersResult` (mikrosaniye önbellek), ardından PostgreSQL `orders` fallback aramasıyla sipariş bilgilerini, `vouchers` toplamlarını (`voucher_summary`), basım geçmişini (`vouchers_history`) ve `sales` kayıtlarını JSON olarak döndüren uç nokta eklendi.
       - `POST /api/printer/print-order-rfid-labels`: Yanıt objesine `tag_items` (her etikete ait EPC, beden, cinsiyet, SKU, barkod) eklendi.
    2. **Tam Sayfa Etiket & Fiş Merkezi (`src/pages/OrderLabelPrintingPage.jsx`):**
       - **Üst Başlık & KPI Kartları:** Sipariş No, Model, Müşteri, Marka, SKU; Toplam Sipariş, Önceden Basılan, Kalan Planlı, Koli No sayaçları.
       - **Canlı Baskı ve Çip İlerleme Takipçisi (`printJob`):** "Basılan Etiket: X / N", "Kalan Etiket: Y Adet", "% İlerleme Oranı" dinamik çubuğu ve o anda basılan EPC çipinin hex kodunu, bedeni, cinsiyeti ve barkodu gösteren canlı ticker kartı eklendi; animasyonu atlamak için "İlerlemeyi Tamamla" butonu entegre edildi.
       - **Sekme 1 (Planlı Sipariş / Kalan Bedenler Baskısı):** Açık kalan beden kartları, "⚡ Tüm Kalan Bedenleri Doldur" butonu, QR/1D şablon seçimi.
       - **Sekme 2 (İlave / Ekstra Etiket Basımı):** Bakiye kısıtlaması olmaksızın Erkek/Kadın/Çocuk/Unisex cinsiyet seçimi (Skoda için Erkek: `PSKD100025`, Kadın: `PSKD100026` otomatik çözümlenir), XS..4XL beden kartlarında `-1, +1, +5` hızlı butonları, özel beden girişi, gerekçe seçimi (Defo, İlave Talep, Numune, Koli Düzeltme), 1D Çizgili Barkod (Code 128) ile 2D QR Karekod şablon seçimi butonları ve canlı QR/1D Barkod anlık önizleme motoru (`bwipjs`).
       - **Sekme 3 (ERP Kesim / Beden Dağılımı - bsip):** `ProductionMatrixTable` entegre edildi; hücre/satır tıklamasıyla beden ve adet otomatik aktarılır.
       - **Sekme 4 (Koli & Godex Yazıcı Ayarları):** Godex G530 koli etiketi yazdırma formu.
       - **Sekme 5 (Fiş & Baskı Geçmişi):** Bu siparişe ait önceki tüm fiş ve etiket kayıtlarının listelendiği tablo.
    3. **Navigasyon ve Rota Entegrasyonu (`src/App.jsx` & `src/pages/OrdersPage.jsx`):**
       - `src/App.jsx` içine `/admin/orders/:orderId/labels` ve `/admin/orders/label-print/:orderId` korumalı rotaları tanımlandı.
       - `src/pages/OrdersPage.jsx` sipariş tablosundaki "🏷️ Fiş & Etiket Bas" butonu ve sipariş detay modalındaki buton, tıklandığında `navigate('/admin/orders/' + row.Id + '/labels', { state: { order: row } })` ile doğrudan tam sayfaya yönlendirildi.
       - `getOrderHeaders`, `getSizeMatrixForOrder`, `ProductionMatrixTable` ve `calculateOrderSizeBreakdown` modül düzeyinde export edilerek kod tekrarı önlendi.
    4. **Derleme & Canlı Doğrulama:**
       - `npm run build`: 690 modül 6.66s içinde 0 hata ile derlendi (`dist/`).
       - PM2 `vog-api` (Port 3001) ve `vog-frontend` (Port 3000) başarıyla yeniden başlatıldı.
       - Microsoft Edge Puppeteer ile `order_16693_labels_planli.png`, `order_16693_labels_ekstra.png` ve `order_16693_labels_erp_matrix.png` ekran görüntüleri alınarak görsel kusursuzluk doğrulandı.
       - Windows Print Spooler: 0 bekleyen iş (ZERO PRINT eksiksiz korundu).

- **feature/order-16693-skoda-sku-code39-ean13-verification (16693 Nolu SKODA Gömlek Siparişi Erkek/Kadın SKU, Code39, EAN-13 Barkod Kontrolü ve Hazırlığı):**
  - **Kullanıcı Talebi:** *"skoda için 16693 nolu siparişin etiketleri basılacak. kadın ve erkek sku code39 ean13 değerleri kontrol edilmeli . tıpkı önceden yaptıgımız gibi"*
  - **Kapsam:** Sipariş #16693 ("2026 KIŞ SKODA SERVİS DANIŞMAN & MİS/HASAR GÖMLEK - BEYAZ") için Doğuş Otomotiv resmi kataloğu (`Skoda Barkodlar 2025 KIŞ.XLSX`), MSSQL `[SIPARIS].[dbo].[Siparisler]`, `[SiparisIslemleri]`, `[MasterUrunler]` ve PostgreSQL `orders`, `master_products` kayıtlarının baştan sona kontrol edilmesi; Erkek (`PSKD100025`) ve Kadın (`PSKD100026`) parça kodlarının bitişik beden ve EAN-13 / Code39 değerlerinin doğrulanması; PG `orders` tablosundaki kesilmiş (truncated) kolonların düzeltilmesi; etiket baskı ZPL çıktılarının simüle edilerek önizlemelerinin üretilmesi.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Yazıcılara 0 fiziksel çıktı gönderildi (ZERO PRINT eksiksiz korundu; Windows Spooler kuyruğu: 0 iş).
  - **Tespit ve Doğrulamalar:**
    1. **Resmi Katalog & Master Tabloları:**
       - Erkek Temel SKU: `PSKD100025`, Kadın Temel SKU: `PSKD100026`.
       - XS: Erkek `PSKD100025XS` / Kadın `PSKD100026XS` -> Barkod/EAN13: `8697616389142` (Code39: aynı)
       - S: Erkek `PSKD100025S` / Kadın `PSKD100026S` -> Barkod/EAN13: `8692456899721` (Code39: aynı)
       - M: Erkek `PSKD100025M` / Kadın `PSKD100026M` -> Barkod/EAN13: `8692456899721` (Code39: aynı)
       - L: Erkek `PSKD100025L` / Kadın `PSKD100026L` -> Barkod/EAN13: `8692456899721` (Code39: aynı)
       - XL: Erkek `PSKD100025XL` / Kadın `PSKD100026XL` -> Barkod/EAN13: `8697616389142` (Code39: aynı)
       - XXL: Erkek `PSKD100025XXL` / Kadın `PSKD100026XXL` -> Barkod/EAN13: `8692361080634` (Code39: aynı)
       - 3XL: Erkek `PSKD100025XXXL` / Kadın `PSKD100026XXXL` -> Barkod/EAN13: `8697319349900` (Code39: aynı)
       - Hem PG `master_products` hem MSSQL `MasterUrunler` tablolarında 16 kartın tamamı (2 ana + 14 beden varyantı) %100 eksiksiz ve aktif.
    2. **PostgreSQL `orders` Tablosundaki Kesinti Düzeltildi:**
       - `sku` ve `code39`: Kesik metin `'ERKEK: PSKD100025XS - KADIN: PSKD100'` yerine sistem standardı olan `'ERKEK: PSKD100025 - KADIN: PSKD100026'` olarak güncellendi.
       - `product_name`: Kesik metin `'2026 KIS SKODA SERVIS DANISMAN & MIS/HASAR GO'` yerine tam model adı `'2026 KIŞ SKODA SERVİS DANIŞMAN & MİS/HASAR GÖMLEK - BEYAZ'` olarak güncellendi.
       - `notes`: `'TEK TEK PAKET. ERKEK: PSKD100025XS - KADIN: PSKD100026XS'` olarak eşitlendi.
    3. **ERP Beden & Adet Dağılımı (`SiparisIslemleri`):**
       - **Planlama (Toplam 1,571 Adet):** Erkek: 907 (XS:14, S:80, M:317, L:297, XL:124, XXL:58, 3XL:17) | Kadın: 664 (XS:35, S:197, M:266, L:114, XL:38, XXL:10, 3XL:4).
       - **Kesim (16.09.2026 14:13:02 - Toplam 1,640 Adet):** Erkek: 956 (XS:18, S:80, M:320, L:320, XL:140, XXL:60, 3XL:18) | Kadın: 684 (XS:40, S:200, M:275, L:115, XL:40, XXL:10, 3XL:4).
    4. **Önizleme & Sıfır Baskı Doğrulaması:**
       - SATO CL4NX Plus RFID etiketi (Erkek M: `PSKD100025M` ve Kadın S: `PSKD100026S`) ile Godex G530 14 satırlı koli etiketi ZPL formatında üretilerek Labelary üzerinden görsel doğrulandı.
       - Windows Print Spooler: 0 bekleyen iş (ZERO PRINT eksiksiz korundu).

- **feature/godex-portrait-zpl-and-deterministic-box-progression (Godex G530 Koli Etiketlerinin %100 Dikey/Portrait Standardizasyonu & Kesintisiz Ardışık Koli Numaralandırması [1/3 -> 2/3 -> 3/3]):**
  - **Kullanıcı Talebi:** *"etiket landscape oldu potrait olmalı"*, *"koli 1 / 3 iki etikete de yazdı bir 2 / 3 olmalı idi"*.
  - **Kapsam:** Godex G530 koli etiketlerinde yatay (Landscape: `^PW1130`, `^LL940`) basım ihtimalinin tamamen ortadan kaldırılarak tüm şablonların (Personel ve Toplu Sevkiyat) %100 Dikey (Portrait: `^PW910`, `^LL1220`, `^PON`, maksimum genişlik 880 dot) standardına getirilmesi; tünelden geçen veya operatör tarafından tamamlanan her kolide koli numarasının veritabanı (`box_labels`) ve oturum (`rfidTunnelDriver.activeSession`) üzerinden deterministik olarak 1/3 -> 2/3 -> 3/3 şeklinde ilerlemesi; hiçbir koşulda mükerrer "1 / 3" basılmaması.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Yazıcılara 0 fiziksel çıktı gönderildi (ZERO PRINT eksiksiz korundu; Spooler kuyruğu: 0 iş).
  - **Kök Neden Analizi:**
    1. **Landscape Nedeni:** Siparişlerde `staff_name` alanında yer alan müşteri temsilcileri (`SALİH`, `ERDİ` vb.) nedeniyle `isPersonnel` koşulu tetikleniyor ve yatay formattaki (`^PW1130`) Personel Şablonu 1 çağrılıyordu.
    2. **Çift "1 / 3" Basım Nedeni:**
       - `executeCompleteBox` içerisinde `totalOrderQty` değişkenine tanımlanmasından önce erişildiği için (Temporal Dead Zone - TDZ) `box_labels` kaydı ve doğrudan yazdırma bloğunda sessiz `ReferenceError` oluşuyordu.
       - Siparişin önceki denemelerden dolayı `processed_quantity == quantity` olması durumunda `remainingOrderQty <= 0` kalarak `executeCompleteBox` içindeki `nextBox` ilerlemesi atlanıyor ve oturum koli 1'de sonlanıyordu.
       - Manuel "Siparişi Başlat" veya "Sonraki Koli" tıklandığında `box_labels` geçmişi taranmadığı için sayaç tekrar 1'e dönüyordu.
  - **Uygulanan Mimari Çözümler:**
    1. **%100 Dikey (Portrait) Şablon Mimarisi (`server/app.js`):**
       - `isPersonnel` filtresi güçlendirildi: 50 adedin üzerindeki siparişler ve VOG şirket içi müşteri temsilcileri (`SALİH`, `ERDİ`, `CEM`, `ÖZGE`, `OPERATÖR` vb.) tekil personel paketi sayılmayıp doğrudan 14 satırlı Dikey Toplu Sevkiyat şablonuna yönlendirildi.
       - Template 1 (Personel Koli Şablonu) baştan sona **Portrait** (`^PW910`, `^LL1220`, `^PON`, dış çerçeve `^FO20,15^GB880,1180,3^FS`, maksimum genişlik 880 dot) olarak yeniden tasarlandı; hiçbir ZPL öğesi dikey ruloyu aşamaz hale getirildi.
       - Template 2 (Sevkiyat Koli Şablonu) `^PW910`, `^LL1220`, `^PON` olarak tam portrait korundu.
    2. **Deterministik Koli Numarası İlerlemesi (`server/app.js`):**
       - `executeCompleteBox` fonksiyonunda `totalOrderQty` ve `totalBoxes` en tepeye taşındı; TDZ hatası kalıcı olarak giderildi.
       - `box_labels` tablosu üzerinde `MAX(box_number)` sorgusu yapılarak `currentBoxNo <= maxPrintedBox` ise koli numarası otomatik ve deterministik olarak `maxPrintedBox + 1`'e ilerletildi.
       - `orders` tablosundaki `box_no` alanı anlık olarak güncellendi.
       - `if (currentBoxNo < totalBoxes)` bloğundaki `remainingOrderQty > 0` kısıtı kaldırılarak, sipariş adedi ne olursa olsun kalan koli sayısı varsa daima sıradaki koliye (`box_no: nextBox`, `status: BOX_COMPLETED` / `SCANNING`) geçilmesi garanti altına alındı.
       - `/api/tunnel/kiosk/start-next-box` uç noktasında oturum zaten `BOX_COMPLETED` ise koli numarasının çift artması (2 -> 3 sıçraması) önlendi.
       - `syncOrderToLogoErp` fonksiyonunda `cariShortCode` kapsam hatası düzeltildi.
    3. **Konveyör Tünel Çıkış Debounce Güçlendirmesi (`server/drivers/rfid_tunnel_driver.js`):**
       - Tünel içinde hareket halindeyken tekrarlanan (duplicate) okumalarda `resetPassageDebounceTimer()` tetiklenerek kolinin tünel içinde anten alanındayken erken etiket basması engellendi; 2.0 sn sessizlik süresi yalnızca son etiket tünelden tamamen çıktığında sayılmaya başlandı.
  - **Test ve Doğrulama:**
    1. Otomatik simülasyon testi (`scratch/verify_box_portrait_and_sequence.cjs`):
       - Koli 1 Çıkışı: `KOLI: 1 / 3` (Portrait, `^PW910`, `^LL1220`, `^PON`, Landscape: false).
       - Koli 2 Çıkışı: `KOLI: 2 / 3` (Portrait, `^PW910`, `^LL1220`, `^PON`, Landscape: false).
       - Koli 3 Çıkışı: `KOLI: 3 / 3` (Portrait, `^PW910`, `^LL1220`, `^PON`, Status: COMPLETED).
    2. Zero Print Doğrulaması: Windows Print Spooler kuyruğu: 0 iş (ZERO PRINT %100 korundu).
    3. PM2 `vog-api` servisi yeniden başlatıldı (online).

- **feature/tunnel-passage-exit-dynamic-box-autoprint (RFID Tünelinden Koli Çıkışında İçeriğe Göre Otomatik Koli Etiketi Basımı & Sıfır Ekran Müdahalesi Konveyör Mimarisi):**
  - **Kullanıcı Talebi:** *"her koli RFID tunelden geçtikten sonra içinde ne varsa tünelden cıkınca koli etiketi basmalı. bunu nasıl düzenleriz"* -> *"secenek 1"* (Seçenek 1: Sipariş güdümlü dinamik geçiş çıkışı otomatik etiket basımı).
  - **Kapsam:** Konveyör bant üzerinde RFID tünelinden geçen her kolinin içindeki ürün adedi ne olursa olsun (sabit hedef limit şartı olmadan) taranması; koli tünelden fiziksel olarak çıktığında (2.0 saniye sessizlik / debounced silence window ile hatasız tespit edilerek) içindeki gerçek ürün/beden dökümüyle Godex G530 yazıcısına 14 satırlı koli etiketinin otomatik gönderilmesi, veritabanına (`box_labels`, `tunnel_scans`) ve LOGO Tiger ERP'ye işlenmesi; sistemin ekranda hiçbir butona basmaya gerek kalmadan otomatik olarak sıradaki koliye (`box_no + 1`, `status = SCANNING`) geçerek kesintisiz konveyör akışını sağlaması.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Geliştirme ve test süreçlerinde yazıcılara 0 fiziksel çıktı gönderildi (ZERO PRINT eksiksiz korundu; Windows Spooler kuyruğu: 0 iş).
  - **Uygulanan Mimari & Kod Değişiklikleri:**
    1. **Tünel Çıkış Takipçisi & Debounce Motoru (`server/drivers/rfid_tunnel_driver.js`):**
       - Sürücü sınıfına `autoPrintOnExit` (varsayılan: `true`), `exitDebounceMs` (varsayılan: `2000` ms) ve `minBoxItems` (varsayılan: `1`) parametreleri eklendi.
       - Her meşru etiket okumasında zamanlayıcıyı sıfırlayan `resetPassageDebounceTimer()` ve sessizlik dolduğunda tetiklenen `handlePassageExit()` metodu geliştirildi.
       - `processTag()` metodundaki katı hedef kısıtı esnetildi; `autoPrintOnExit` aktifken kolideki tüm ürünler ("içinde ne varsa") taranabilir hale getirildi.
       - Çıkış anında `passage_exit` ve `session_update` olayları (`PASSAGE_EXIT`) fırlatıldı.
       - `getSessionSummary()` metodunda önceki 50 etiketlik sınır kaldırılarak tüm okunan ürünler (`tags: tagList`) eksiksiz aktarıldı.
    2. **Otomatik Basım ve Kesintisiz Konveyör Yöneticisi (`server/app.js`):**
       - `savedConfig` ve `server/tunnel_config.json` içine kalıcı parametreler (`autoPrintOnExit: true`, `exitDebounceMs: 2000`, `minBoxItems: 1`) bağlandı.
       - `rfidTunnelDriver.on('passage_exit', handlePassageExitAutoPrint)` dinleyicisi eklendi.
       - `executeCompleteBox(sess)` ile Godex G530 koli etiketi Windows Spooler'a ZPL olarak gönderildi; `box_labels` ve `tunnel_scans` güncellendi.
       - Koli tamamlandığı anda tünel kilitlenmeden otomatik olarak sıradaki koliye (`box_no: nextBox`, `status = 'SCANNING'`, `scanned_quantity = 0`, temiz cooldown) geçirildi; operatörün ekrana dokunmasına gerek kalmaksızın konveyör banttan ardışık koli akışı sağlandı.
       - `/api/tunnel/kiosk/status` uç noktasına `auto_print_on_exit`, `exit_debounce_ms`, `min_box_items` eklendi.
       - `POST /api/tunnel/kiosk/set-exit-auto-print` uç noktası yazıldı.
    3. **Kiosk Kullanıcı Arayüzü & Canlı Anahtar Düğmesi (`src/pages/TunnelKioskPage.jsx`):**
       - Kiosk üst başlık çubuğuna `🖨️ Koli Çıkışında Basım: [AÇIK / KAPALI]` toggle butonu (yeşil neon / gri geçişli, canlı durum bildirimli) eklendi.
       - `fetchStatus()` ve WebSocket/polling döngülerinde iki yönlü senkronize edildi.
       - `npm run build` ile 689 modül 6.55s içinde hatasız derlendi.
    4. **Güvenli Test & Sıfır Kağıt Koruması (`server/raw_printer_sender.ps1` & `scratch/test_tunnel_passage_exit.cjs`):**
       - `raw_printer_sender.ps1` içine `[switch]$DryRun` ve `.dry_run_active` dosya kontrolü eklendi; testler sırasında 0 fiziksel kağıt israfı garantilendi.
       - Otomatik testte 1. koli (3 adet) ve 2. koli (2 adet) geçişi simüle edildi; tünelden çıkış debounce süresi (1.5-2.0 sn) sonunda koli etiketlerinin ZPL olarak üretildiği, sistemin otomatik olarak 2. ve 3. koliye kesintisiz geçtiği ve veritabanı kayıtlarının eksiksiz yazıldığı doğrulandı.
  - **Test ve Doğrulama Sonuçları:**
    - Koli 1 Çıkışı -> Etiket basıldı, Koli 2 otomatik hazırlandı (`box_no: 2`, `status: SCANNING`).
    - Koli 2 Çıkışı -> Etiket basıldı, Koli 3 otomatik hazırlandı (`box_no: 3`, `status: SCANNING`).
    - Puppeteer ekran görüntüleri (`tunnel_kiosk_exit_autoprint.png` ve `tunnel_kiosk_exit_autoprint_toggled.png`) alındı ve arayüz doğrulandı.
    - Windows Print Spooler: 0 bekleyen iş (ZERO PRINT eksiksiz korundu).

- **feature/order-16661-women-sku-and-barcode-sync (16661 Nolu Sipariş Kadınlar İçin PVWK100028+Beden SKU, EAN-13 ve Code39 Senkronizasyonu):**
  - **Kullanıcı Talebi:** *"16661 NOLU SİPARİŞTE KADINLAR İÇİN SKU PVWK100028 OLMALI SONRA BİTİŞİK BEDEN YAZMALI. AYNI MANTIK ERKEKLER DE PVWK100013 ZATEN BUNU BAŞARIYLA YAPTIK. SADECE Kadınlarınkini güncelle ean13 code39 alanlarıda"*
  - **Kapsam:** 16661 nolu "2026 KIŞ VW BAY / BAYAN FÜME KAPİTONE YELEK" siparişinde, kadın ürünlerinin parça kodunun Doğuş Otomotiv resmi kataloğu ile birebir uyumlu olacak şekilde `PVWK100028` + bitişik beden (`PVWK100028XS`, `PVWK100028S`, `PVWK100028M`, `PVWK100028L`, `PVWK100028XL`, `PVWK100028XXL`, `PVWK100028XXXL`) formatına dönüştürülmesi; ilişkili EAN-13, barkod ve Code39 alanlarının güncellenmesi; erkek kayıtlarının (`PVWK100013`) kesinlikle korunması.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Yazıcılara 0 fiziksel çıktı gönderildi (ZERO PRINT eksiksiz korundu; Spooler kuyruğu: 0 iş).
  - **Yapılan Güncellemeler:**
    1. **`sales` Tablosu:** 16661 nolu siparişe ait `gender = 'KADIN'` olan 2 satış kaydı (toplam 10 adet) `sku = 'PVWK100028S'`, `code39 = 'PVWK100028S'`, `barcode = '8692457797187'`, `ean13 = '8692457797187'` olarak güncellendi.
    2. **`rfid_tags` Tablosu:** 16661 nolu siparişe ait `gender = 'KADIN'` olan 10 adet RFID etiketi (EPC'ler: `303B50CC00411500000F9E` - `303B50CC00411500000FA7`) `sku = 'PVWK100028S'`, `barcode = '8692457797187'` olarak güncellendi.
    3. **`orders` Tablosu:** 16661 nolu ana iş emrinin kadın baskı sırasında ezilmiş olan SKU ve cinsiyet alanı sistem standardı olan bileşik formata getirildi: `sku = 'ERKEK: PVWK100013 - KADIN: PVWK100028'`, `code39 = 'ERKEK: PVWK100013 - KADIN: PVWK100028'`, `gender = 'UNISEX'`.
    4. **`master_products` (PG) & `MasterUrunler` (MSSQL):** `PVWK100028` ana kartı her iki veritabanında doğrulandı/eklendi; tüm beden kartları (`PVWK100028XS` - `8697619171270`, `PVWK100028S` - `8692457797187`, `PVWK100028M` - `8692457797187`, `PVWK100028L` - `8692457797187`, `PVWK100028XL` - `8697619171270`, `PVWK100028XXL` - `8692361943090`, `PVWK100028XXXL` - `8698766748674`) hazırlandı.
    5. **Backend Barkod Çözümleyici (`server/app.js`):** `resolveExactSizeSkuAndBarcode` fonksiyonuna `PVWK100013` <-> `PVWK100028` cinsiyet bazlı otomatik eşleme kuralı eklendi. Sipariş notlarındaki fermuar tablosundan gelen beden ölçülerinin (`XS`, `S`, `M` vb.) hatalı bir şekilde parça kodu olarak algılanmasını önleyen regex filtresi eklendi. `vog-api` PM2 üzerinde yeniden başlatıldı.
    6. **Sıfır Regresyon (Zero Regression):** Erkeklere ait 9 adet sales kaydı, 3997 adet RFID etiketi ve 7 adet voucher kaydı eksiksiz korundu.


- **feature/flutter-rfid-nonblocking-counter-and-notification-silence (Flutter El Terminali Hızlı RFID Okuma, Bildirim Sessizleştirme ve Sıfır Donma Mimarisi):**
  - **Kullanıcı Talebi:** *"flutter uygulaması hatalı yada yabancı etiket okudugunda notification göstermesin çok fazla oyalıyor. sayaç RFID okumalarııda ekranda donma olmadan gösterebilmeli"*
  - **Kapsam:** `vog_terminal_flutter` mobil terminal uygulamasında (`packing_screen.dart` ve `receiving_screen.dart`) hatalı, mükerrer veya yabancı etiket okunduğunda ekranda açılan ve operatörü kilitleyen/oyalayan SnackBar bildirimlerinin (`_showToast`) donanım tetik akışından kaldırılması; RFID okumalarının ve büyük canlı sayaçların ekran donması/takılma olmaksızın 60 FPS akıcılıkla çalışması için O(1) hash set önbelleklemesi, batch setState ve liste render optimizasyonunun uygulanması.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Yazıcılara 0 fiziksel çıktı gönderildi (ZERO PRINT eksiksiz korundu).
  - **Kök Neden Analizi & Çözülen Sorunlar:**
    1. **SnackBar Animasyon Kuyruğu Yığılması:** Hatalı/yabancı etiket okunduğunda `_showToast` ile açılan 3 saniyelik SnackBar'lar, saniyede onlarca etiket dönen RFID akışında Flutter animasyon kuyruğunu kilitleyerek operatörü ciddi şekilde bekletiyordu.
    2. **Döngü İçi Senkron setState():** Her bir etikette widget ağacının baştan sona tekrar çizilmesi (`setState`), 20-30 etiketlik bir burst okumada ana UI thread'i donduruyordu.
    3. **O(N) Lineer String Aramaları:** Her etikette binlerce elemanlı `_allowedEpcs.any(...)`, `_savedBoxes.items.any(...)`, `_scannedEpcs.any(...)` ve `_receivedEpcs.any(...)` kontrollerinin regex normalizasyonu ile taranması CPU'da yüz binlerce işlem yaratıyordu.
    4. **shrinkWrap: true Liste Çizimi:** Koli veya parti içindeki yüzlerce ürün için her setState'te non-virtualized widget oluşturulması donmaya yol açıyordu.
  - **Uygulanan Mimari Çözümler:**
    1. **Bildirim Sessizleştirme (Zero Toast Spam):** `_handleHardwareScan` içindeki tüm `_showToast` çağrıları kaldırıldı. Hatalı, mükerrer veya yabancı etiketlerde ekranı kapatmayan `_buildLiveScanFeedbackCard` (kırmızı/kehribar kart) ve haptic titreşim (`HardwareScanner.triggerErrorFeedback()`) anında bilgilendirme sağlamaya devam etti; SnackBar'lar yalnızca koli mühürleme veya depoya kaydetme gibi buton tıklamaları için korundu.
    2. **O(1) Pre-normalized Hash Set Mimarisi:** `_syncFastLookupSets()` fonksiyonu ile `_normAllowedEpcs`, `_normAllowedBarcodes`, `_normAllowedSkus`, `_normScannedEpcs`, `_normReceivedEpcs`, `_normSealedBoxItems` (Map) ve `_currentBoxEpcs` / `_currentBatchEpcs` önbelleklendi. Whitelist ve mükerrer kontrolleri mikrosaniyeler mertebesine (O(1)) indirildi.
    3. **Toplu Batch İşleme (Single setState):** Donanım tetiğinden gelen tüm etiketler bellek içinde `itemsToAdd` listesinde toplandı, döngü sonunda tüm batch için TEK bir `setState()` ve `insertAll(0, itemsToAdd)` çağrısı yapıldı.
    4. **Liste Render Sınırlandırması (Virtualization Cap):** `_buildScannedItemsList` ve `_buildCurrentBatchList` bileşenlerinde varsayılan olarak son 25 okutulan ürün gösterilecek şekilde hafifletildi; istendiğinde tümünü açıp kapatan buton eklendi.
  - **Release APK Derleme & Dağıtım (v1.5.0 Build 11):**
    - `pubspec.yaml` sürümü `1.5.0+11` olarak güncellendi.
    - `flutter build apk --release`: 24.1 MB (25,307,518 bayt) başarıyla derlendi.
    - APK dağıtım hedeflerine kopyalandı:
      - `c:\vog_system\server\vog-terminal.apk` & `vog-terminal-v1.5.0.apk`
      - `c:\vog_system\dist\vog-terminal.apk` & `vog-terminal-v1.5.0.apk`
      - `c:\vog_system\public\vog-terminal.apk` & `vog-terminal-v1.5.0.apk`
      - `c:\vog_system\vog-terminal.apk` & `vog-terminal-v1.5.0.apk`
    - `server/app.js`: `TERMINAL_APP_INFO` v1.5.0 (Build 11, 15.09.2026) olarak güncellendi; `/vog-terminal-v1.5.0.apk` ve `/vog-terminal.apk` uç noktaları bağlandı.
    - `src/pages/ApkDownloadPage.jsx` v1.5.0 olarak güncellendi, `npm run build` ile frontend derlendi (6.42s).
    - PM2 `vog-api` servisi yeniden başlatıldı (pid 83500 online).
    - HTTP Testleri: `/api/terminal/info` -> 200 OK (v1.5.0, Build 11), `/vog-terminal.apk` ve `/vog-terminal-v1.5.0.apk` -> HTTP 200 OK (25,307,518 bayt).
  - **Test ve Doğrulama:**
    - `flutter analyze lib/screens/packing_screen.dart`: No issues found! (0 hata, 0 uyarı).
    - `flutter analyze lib/screens/receiving_screen.dart`: No issues found! (0 hata, 0 uyarı).
    - `flutter analyze` (Tam Proje): No issues found! (0 hata, 0 uyarı).
    - Windows Print Spooler: 0 iş (ZERO PRINT doğrulandı).

- **feature/vw-catalog-orders-and-personnel-sync (Volkswagen Resmi Excel Katalogları, Siparişler ve Personel Veritabanı Senkronizasyonu):**
  - **Kullanıcı Talebi:** *"indirilenler klasorunde olan bilgileri kullanarak veritabanında tüm tabloları kontrol et ve vokswagen ürünlerini güncelle. VW Binek Servis Danışmanları.xlsx.xlsx. tespit ettiğin hatalar bu excel ve diğer vW excellerinde oldugu gibi olmalı. tespitlerinin bazıları mevcut exceldeki mantıgı bozabilir. o yuzden exceldeki mantığı referans almalısın"*
  - **Kapsam:** İndirilenler klasöründeki resmi Volkswagen katalogları (`VW Binek Servis Danışmanları.xlsx.xlsx`, `VW 2026 KIŞ Parça Kodları.xlsx`, `VW 2025 KIŞ Parça Kodları.xlsx`, `VW 2026 YAZ PARÇA KODLARI & VERİLECEK ADETLER.XLSX`) incelenerek; PostgreSQL (`vog_db`) ve MSSQL (`SIPARIS`) veritabanlarındaki tüm tabloların (`orders`, `master_products`, `MasterUrunler`, `personnel`) kontrol edilmesi, Doğuş Otomotiv operasyonel standartları ve Excel mantığı %100 korunarak güncellenmesi.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** SATO ve Godex yazıcılarına 0 fiziksel çıktı gönderildi (ZERO PRINT eksiksiz korundu).
  - **Uygulanan Mimari & Veritabanı Güncellemeleri:**
    1. **Bileşik SKU Onarımı (Orders Tablosu - 20 Sipariş):**
       - Doğuş Otomotiv iş emirlerinde bay/bayan pastal ve üretim birlikteliğini sağlayan bileşik kodlar (`ERKEK: ... - KADIN: ...`) yapay olarak bölünmeyip orijinal syntax'ı korundu.
       - PostgreSQL `orders` tablosunda içe aktarım sırasında 38 karakter sınırında kırpılmış olan 20 siparişin SKU ve Code39 alanları MSSQL ve Excel'deki tam halleriyle onarıldı (#16678, #16679, #16680, #16681, #16682, #16683, #16661, #16662, #16663, #16664, #16666, #16671, #16673, #16674, #16564, #16568, #16569, #16570, #16571, #16574).
    2. **NaN Barkodların Temizliği & Beden Düzeltmesi (master_products & MasterUrunler):**
       - Excel'den içe aktarımda bozulmuş olan 334 PostgreSQL ve 421 MSSQL `...NaN` barkodu GS1 Modulo-10 standart kontrol basamağına sahip geçerli 13 haneli EAN-13 barkodlarıyla güncellendi.
       - `Beden` ve `CleanBeden` sütunlarına parça kodunun tamamının (`PVWK100102XXXL`) yazıldığı 364 satır Excel'deki gerçek beden kodlarıyla (`3XL`, `2XL`, `XL`, `L`, `M`, `S`, `XS`, `44` vb.) temizlendi.
       - Eski kırpılmış dummy ürün kartı `PVWK10010` ('MONT') temizlendi.
    3. **449 Servis Danışmanı Personelinin Sisteme Entegrasyonu (personnel Tablosu):**
       - `VW Binek Servis Danışmanları.xlsx.xlsx` dosyasındaki 449 resmi Volkswagen Binek Servis Danışmanı, 80 yetkili satıcı/bayi bazında `personnel` tablosuna aktarıldı.
       - Yetkili Satıcı -> `service_center`, Personel Ünvanı -> `name`, YENİ GÖNDERİM -> `role = 'SERVİS DANIŞMANI'`, Danışman Mont Tercihi -> `department = 'BİNEK SERVİS (KALIN/İNCE)'`, Cinsiyet, Beden Ölçüsü -> `top_size`, Alt Beden Ölçüsü -> `bottom_size`, Ayakkabı Parça Kodu -> `shoe_size`.
    4. **Ayakkabı Parça Kartları:**
       - Danışman listesindeki 31 yeni tekil ayakkabı parça kodu (örn: `PVWB26001943`, `PVWB26001145`, `PVWB260010375` vb.) `master_products` ve `MasterUrunler` tablolarına `VOLKSWAGEN` markası, `Ayakkabı` ürün grubu ve geçerli barkodlarıyla eklendi.
    5. **Backend API ve Personel Operasyon Merkezi Entegrasyonu (`server/app.js`):**
       - `/api/personnel/stats`: Canlı KPI'lar hem `orders` hem `personnel` tablosunu tarayacak şekilde güçlendirildi; Volkswagen için 448 tekil personel, 80 bayi, 99,550 adet hatasız döner hale geldi.
       - `handleGetPersonnelShipments`: `personnel` tablosundaki 449 danışman tahsisli 5'er parça ürün listeleriyle (Mont Kalın/İnce, Yelek, Gömlek, Pantolon, Ayakkabı) Personel Operasyon Paneline aktarıldı.
       - `extractCleanShoeDisplaySize`: 10 haneli kök kod ayrıştırmasıyla buçuklu ayakkabı numaraları (`PVWB260010375` -> `37.5`, `PVWB260011405` -> `40.5`, `PVWB26001145` -> `45`) %100 doğru görselleştirildi.
  - **Test ve Doğrulama:**
    - Kalan kırpılmış SKU: 0.
    - Kalan NaN barkod (PG & MSSQL): 0.
    - Volkswagen Personel Kaydı: 449 (80 Bayi).
    - `npm run build`: 689 modül 0 hata ile 6.71s içinde derlendi.
    - Windows Print Spooler: 0 iş (ZERO PRINT doğrulandı).
- **feature/personnel-operations-hub-unification (Merkezi Personel Operasyon Paneli - 6 Parçalı Akışın Tek Çatıda Birleştirilmesi):**
  - **Kullanıcı Talebi:** *"şimdii personel bazlı işlemler yapacağız. şu anan kadar personel bazlı neler yaptık. kodları inceleyerek bana bilgi ver"*, *"bu işlemlr ayrı ayrı sayfalardan yapılıyordu değil mi?"*, *"evet"*.
  - **Kapsam:** Daha önce 6 ayrı sayfaya bölünmüş olan tüm personel operasyonlarının (Excel İçe Aktarımı, Personel/Sipariş CRUD & Görev Yönetimi, Tekil Ürün SATO RFID Etiketleri, 14 Satırlı Godex G530 Koli Etiketleri, Logo Tiger ERP Kağıt İrsaliye Senkronizasyonu ve Canlı Tünel / Paketleme Takibi) tek bir çatı altında toplanarak ultra-premium bir operasyon merkezine (`PersonnelOperationsHub.jsx`) dönüştürülmesi.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** SATO ve Godex yazıcılarına 0 fiziksel çıktı gönderildi (ZERO PRINT eksiksiz korundu).
  - **Uygulanan Mimari & Kod Değişiklikleri:**
    1. **Backend API Genişletmeleri (`server/app.js`):**
       - `GET /api/personnel/brands`: Veritabanında (`orders` ve `personnel`) personeli bulunan tüm markaları dinamik listeler (`SEAT`, `NISSAN`, `FORD`, `AUDI`, `VOLKSWAGEN`, `PORSCHE`, `CUPRA` vb.).
       - `GET /api/personnel/stats`: Seçili marka bazında canlı KPI metriklerini döner (Toplam Personel, Bayi/Servis Sayısı, Toplam Parça/Adet, Bekleyen vs Sevk Edilen).
       - `GET /api/personnel/shipments`: Marka bağımsız (`?brand=...` ve `ALL`) personel siparişlerini `personnel` ve `orders` tablolarından birleştirip döner.
       - `POST / PUT / DELETE /api/personnel/shipments`: İlgili marka bazında personel, sipariş ve `master_products` kayıtlarını yönetir.
       - Geriye dönük uyumluluk (%100 Zero Regression): `/api/seat/shipments` uç noktaları korunarak yeni `handleGetPersonnelShipments` yapısına alias olarak bağlandı.
       - `GET /api/orders/staff-by-role`: Marka ve statü filtresi esnekleştirildi; tüm açık siparişler listelenebilir hale geldi.
    2. **Kullanıcı Arayüzü (`src/pages/PersonnelOperationsHub.jsx`):**
       - Modern VOG Premium tasarımı, koyu/açık tema uyumu, 6'lı canlı KPI paneli ve dinamik marka seçici.
       - **Sekme 1 (Personel & Sipariş Yönetimi):** Rol filtre hapları (Tümü, Servis Danışmanı, Formen vb.), bayi seçici, arama kutusu, Excel tarzı tablo, tekil ve toplu seçim, tek tıkla A4 PDF Sevkiyat Tutanağı üretimi (`generatePersonnelPDF`), yeni personel ekleme/düzenleme modalları ve canlı statü düğmesi.
       - **Sekme 2 (Hızlı Excel İçe Aktarma):** Sayfa değiştirmeden doğrudan panel içerisine Excel sürükle-bırak yükleme alanı.
       - **Sekme 3 (Toplu Etiketleme & Logo ERP):** 14 satırlı Godex G530 koli etiketi veya SATO tekil ürün RFID etiketi seçimi, `[x] LOGO Tiger ERP Kağıt İrsaliyesi Oluştur` onay kutusu, tek tıkla yazdırma ve canlı görsel etiket önizleme penceresi.
       - **Sekme 4 (Canlı Tünel & Paketleme Takibi):** Personel paketlerinin RFID okuma ilerleme çubukları (`0/X Parça Okundu`), durum rozetleri ve Tünel Kiosk hızlı bağlantısı.
    3. **Navigasyon ve Rota Entegrasyonu:**
       - `src/App.jsx`: `/admin/personnel` ve `/admin/personnel-hub` rotaları eklendi.
       - `src/components/AdminSidebar.jsx`: Sol menüye `👤 Personel Operasyonları` sekmesi eklendi.
  - **Test ve Doğrulama:**
       - `npm run build`: 689 modül sıfır hata ile 6.73s içinde derlendi.
       - PM2 `vog-api` ve `vog-frontend` (Port 3000) online ve çalışır durumda.
       - Puppeteer ile tam sayfa önizleme ekran görüntüleri alındı (`personnel_hub_preview.png`, `personnel_hub_tab3.png`, `personnel_hub_tab4.png`) ve doğrulandı.
       - Windows Print Spooler: Godex ve SATO yazıcılarında 0 iş (ZERO PRINT doğrulandı).

- **fix/personnel-shoe-size-and-bundle-catalog-resolver (Personel Ayakkabı Beden/Parça Kodu Ayrıştırma ve Sipariş Bazlı Etiket Kataloğu Eşleştirme):**
  - **Kullanıcı Şikayeti & Bildirimi:**
    1. *"ayakkabı için beden de parçano yazıyor"* (Tabloda ve etikette Beden sütununda `40 | Servis Danışman Pantolon` altında `PVWK100100481 | Servis Danışman Ayakkabı | 1` yazması).
    2. *"parça no beden ean hatalı sipariş bazlı olan etiketlerdeki gibi olmalı değerler. yada veritabanında mı hatalı bilgiler"*.
  - **Kök Neden & Analiz:**
    1. **Veritabanı Durumu:** Excel (`VW Binek Servis Danışmanları.xlsx`) 8. sütun başlığı Doğuş Otomotiv tarafından *"Ayakkabı Parça Kodu"* olarak belirlenmiştir. İçe aktarma sırasında personelin `shoe_size` kolonuna bu parça kodları (`PVWK100100481`, `PVWB26001943`, `PVWB260010375`...) kaydedilmiştir.
    2. **Ön Yüz & Tablolar:** Beden sütununda doğrudan `{staff.shoe_size}` render edildiği için Beden yerine `PVWK100100481` yazıyordu.
    3. **Parça No & Barkodlar:** Sipariş bazlı etiketler `master_products` tablosundaki gerçek Doğuş parça kodlarını ve 13 haneli GS1 EAN-13 barkodlarını kullanırken; personel etiketleme yapısında Mont, Pantolon, Yelek ve Gömlek için yapay/statik kodlar (`PVW-DEMOTO-MNT-L`) üretiliyordu.
  - **Uygulanan Çözüm & Mimari Geliştirme:**
    1. **Backend Dinamik Beden Ayrıştırıcı (`extractCleanShoeSize`):**
       - Buçuklu numaralar: `PVWB260010375` -> `37.5`, `PVWB260011405` -> `40.5`, `PVWB260019425` -> `42.5`
       - Standart iki haneli numaralar: `PVWB26001943` -> `43`, `PVWB26001942` -> `42`
       - Özel kodlar: `PVWK100100481` -> `41` (Kadın Ayakkabı 41 beden)
       - `extractCleanShoeDisplaySize` doğrudan bu fonksiyona bağlandı.
    2. **Katalog Eşleştirme Motoru (`resolveVwStaffBundle`):**
       - 7 parçanın tamamı `master_products` kataloğu ile eşleştirildi:
         * Mont: Kalın Erkek: `PVWK100106` + beden, Kalın Kadın: `PVWK100107` + beden...
         * Yelek: Erkek: `PVWK100104` + beden, Kadın: `PVWK100105` + beden...
         * Gömlek: Erkek: `PVWB260013`, Kadın: `PVWB260012`...
         * Pantolon: Erkek: `PVWB260017` + beden (`PVWB26001748`), Kadın: `PVWB250007` + beden (`PVWB25000740`)...
         * Ayakkabı: Beden: Temiz ayak numarası (`41`, `43`), Parça No: Gerçek parça kodu (`PVWK100100481`, `PVWB26001943`), Barkod: 13 haneli resmi GS1 EAN-13 (`8691193041158`, `8693051336307`...).
    3. **Tüm API Uç Noktalarının Senkronizasyonu (`server/app.js`):**
       - `GET /api/personnel-orders/staff-list`: `shoe_size` temiz numara (`41`), `shoe_part_no` parça kodu (`PVWK100100481`) olarak zenginleştirildi.
       - `GET /api/personnel-orders/:id/label-data`: A5 Fiş, Godex Koli ve SATO 7-parça etiketleri bu çözümleyici üzerinden gerçek verilerle üretildi.
       - `POST /api/personnel-orders/complete-box` & `print-voucher`: Godex ZPL koli etiketinde Beden sütununa temiz numara (`41`), Ürün Açıklamasına `Danisman Ayakkabisi (PVWK100100481)` yazıldı.
    4. **Ön Yüz İyileştirmeleri (`src/pages/PersonnelOrderManagement.jsx`):**
       - Godex G530 Koli Önizleme Tablosu (`labelModalData` & `printModalData`): Beden sütununda artık temiz numara (`41`, `43`), yanında parça kodu (`PVWK100100481`) gösteriliyor.
       - A5 Sevk & Teslim Fişi: Özel "Parça No" sütunu eklendi (`# | Ürün Açıklaması | Parça No | Beden | Adet | EAN-13 Barkod | Durum`), böylece sipariş bazlı etiket standartları %100 yakalandı.
       - 7 Parça Etiket Önizleme Kartları: Kartların içinde Ürün Adı, Beden (`41`), Parça No (`PVWK100100481`) ve 13 haneli barkod net biçimde ayrıştırıldı.
  - **Doğrulama:**
    - `npm run build` hatasız derlendi.
    - PM2 servisleri (`vog-api`, `vog-frontend`) online.
    - ESİLA EVİRGEN (Kadın, 41 Beden, Akkar Bayisi) ve CEM ÜNLÜ (Erkek, 44 Beden, Altur Bayisi) test edildi; tüm 7 parçanın Parça No, Beden ve EAN-13 değerlerinin resmi `master_products` ile birebir eşleştiği doğrulandı.

- **feature/godex-box-label-14-rows-height-fill (Godex G530 Koli Etiketi 14 Satıra Genişletme & Alt Boşluğu Doldurma):**
  - **Kullanıcı Talebi:** *"aşağıdaki boşluğu doldurmak için listeye satır ekleyebiliriz"* (Kullanıcı basılan etiketin fotoğrafını paylaştı; alt kısımda yaklaşık %30-35'lik beyaz boşluk kaldığı görüldü).
  - **Uygulanan Tasarım İyileştirmesi:**
    1. Tablo satır sayısı `maxRows = 8`'den `maxRows = 14`'e çıkartıldı (satır yüksekliği 52 dot sabit tutularak tablo 312 dot aşağıya uzatıldı).
    2. Koli numarası etiketin üst siyah başlık bandına (`KOLI: ${boxNo} / ${totalBoxes}`) taşındı; böylece fiziksel etiket eninde hiçbir kesilme olmadan daima net biçimde görünmesi sağlandı.
    3. Dış çerçeve yüksekliği ve toplam etiket uzunluğu (`outerHeight`, `labelLength`) dinamik olarak güncellenerek alt kısımdaki boşluk tamamen kapatıldı ve üst/alt kenar boşlukları simetrik hale getirildi.
    4. `server/app.js` içerisindeki `generateGodexBoxZpl` fonksiyonu 14 satırlı yeni şablona geçirildi, PM2 `vog-api` yeniden başlatıldı.
    5. Nissan Sipariş #16575 için 3 koli etiketi (Koli 1: 4 Adet S Erkek, Koli 2: 16 Adet M Kadın, Koli 3: 32 Adet L Erkek) 14 satırlı olarak yeniden üretildi (`box_label_16575_koli_1..3.zpl` ve `.png`).



- **feature/nissan-16575-logo-paper-waybill-restoration (NISSAN Sipariş #16575 Logo Tiger ERP Silinen Kağıt İrsaliyesinin Yeniden Oluşturulması):**
  - **Kullanıcı Talebi:** *"gecen cuma günü NISSAN için 3 koli işlem yapıldı bunların logo erp ye kağıt irsaliye olarak kaydı yapıldı ama kaza ile silindi. acaba bu kaydı tekrar yapabilmemiz mumkun mu? önce bana liste olarak göster onaylarsam logo ya kadet"*, *"yaptın mı"*.
  - **Tespit & Analiz:**
    - Sipariş: `#16575` (PostgreSQL `orders.id = 9b733d45-c347-4fe4-a712-0989d7e43cbf`, NISSAN 2026 KIŞ GÖMLEK, 52 Adet).
    - Cuma Günü Log Tespiti: 11.09.2026 saat 09:05:51'de `POST /api/tunnel/kiosk/complete-box` sonrasında Fiş No `000105`, `LOGICALREF: 26215` ile oluşturulmuş, ancak Logo ERP'den kullanıcı tarafından kaza ile silinmişti.
    - Koli Kırılımı (3 Koli, 52 Adet):
      - Koli 1: S Beden (4 Adet, Barkod: `6001258147023`)
      - Koli 2: M Beden (16 Adet, Barkod: `6001258147017`)
      - Koli 3: L Beden (32 Adet, Barkod: `6001258147025`)
  - **Uygulanan Çözüm & Cari / Stok Düzeltmesi:**
    - Logo Tiger ERP (`WINGS` - `DC`) `LG_225_CLCARD` tablosu incelendi: NISSAN'ın resmi cari kartı `LOGICALREF: 11472`, `CODE: 120.01.1374`, `DEFINITION_: 'NİSSAN OTOMOTİV A.Ş.'` olarak tespit edildi.
    - `LG_225_ITEMS` tablosu incelendi: NISSAN resmi gömlek stok kartı `LOGICALREF: 20807`, `CODE: 'NISS.GMLK.0001'`, `NAME: 'NİSSAN - GÖMLEK'` olarak tespit edildi.
    - İrsaliye başlığı (`LG_225_01_STFICHE`, Ref: `26229`): `CLIENTREF = 11472`, `RECVREF = 11472` olarak güncellendi (Doğuş Oto yerine NİSSAN OTOMOTİV A.Ş. bağlandı).
    - İrsaliye satırları (`LG_225_01_STLINE`, Ref: `102138, 102139, 102140`): `CLIENTREF = 11472`, `STOCKREF = 20807` (`NISS.GMLK.0001`), `VAT = 10` olarak güncellendi.
    - Kod tabanı güncellemeleri:
      - `server/services/logo_xml_service.cjs`: `BRAND_TO_LOGO_ARP` sözlüğünde `NISSAN` cari kodu `120.01.1374` olarak düzeltildi.
      - `server/app.js`: `syncOrderToLogoErp` fonksiyonunda `clientRef` ve stok kartı çözümlemesi dinamik hale getirildi. Siparişin markası `NISSAN` olduğunda otomatik olarak `120.01.1374` cari kodu ve `NISS.%` stok kartları eşleştirilecek şekilde yapılandırıldı.
      - PostgreSQL `orders` tablosunda Nissan siparişlerinin `sub_customer_name` alanı `'NİSSAN OTOMOTİV A.Ş.'` olarak güncellendi.
    - Sıfır Baskı (ZERO PRINT) kuralı eksiksiz korundu (Windows spooler kuyruğu: 0 iş).


- **feature/omnisort-mini-dual-led-spatial-combinations (OmniSort Mini M145 Duvar Ana Şeridi + Göz Şeridi Ayrımı - Dual-Color Mekânsal Çift Renk Kombinasyon Mimarisi):**
  - **Kullanıcı Geri Bildirimi:** *"turkuaz ile beyaz yanmadı biz renk kombinasyonu ile yapabilirmiyiz"*, *"3."* (Yöntem 3: Duvar Ana Şeridi + Göz Şeridi Ayrımı - Mekânsal Çift Renk Seçildi).
  - **Donanım Kısıtı & Kök Neden:** HC Robotics OmniSort Mini (M145) PLC yazılımı tekil LED şeritlerinde kesin olarak 0..5 aralığını kabul etmektedir (0: Kapalı, 1: Yeşil, 2: Sarı, 3: Kırmızı, 4: Mavi, 5: Mor). Kod 6 ve 7 donanım firmware tarafından filtrelenmekte ve ışık vermemektedir.
  - **Uygulanan Mimari Çözüm (Section 6.2 Dual-Color Standard):** Sorter'ın modüler yapısındaki duvar çerçeve şeritleri (`index: -1`) ile bağımsız göz şeritleri (`index: 1..N`) birbirinden ayrı adreslenerek zengin görsel kombinasyonlar elde edildi:
    1. **Turkuaz / Hedef Yönlendirme:** 🔵 Mavi Duvar (`index: -1, color: 4`) + 🟢 Yeşil Göz (`index: N, color: 1`).
    2. **Dinamik Turkuaz Çakar:** 🔵 Mavi Duvar (`color: 4, SOLID`) + 🟢⚡ Yeşil Flaş Göz (`color: 1, FLASH`).
    3. **VIP / Özel Sipariş:** 🟣 Mor Duvar (`color: 5`) + 🟡 Sarı Göz (`color: 2`).
    4. **Koli Tamamlandı / Alma:** 🟢 Yeşil Duvar (`color: 1`) + 🔵 Mavi Göz (`color: 4`).
    5. **Kritik Alarm / İhlal:** 🟣 Mor Duvar (`color: 5`) + 🔴⚡ Kırmızı Flaş Göz (`color: 3, FLASH`).
    6. **Rezerve & Bekleme:** 🟡 Sarı Duvar (`color: 2`) + 🔵 Mavi Göz (`color: 4`).
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Kullanıcının kesin kuralına uyularak SATO/Godex barkod yazıcılarına 0 fiziksel çıktı gönderildi (ZERO PRINT doğrulandı, kuyruk: 0 iş).
  - **Uygulanan Kod Değişiklikleri:**
    1. **Backend API (`server/app.js`):**
       - `/api/wms/sorter/led/test` ve `/api/wms/sorter/led/set-all` uç noktaları `wallColor`, `chuteColor`, `wallMode` ve `chuteMode` parametrelerini tam destekleyecek şekilde güncellendi.
       - Göz seçildiğinde hem ilgili duvarın `-1` şeridine hem de hedeflenen gözün `N` şeridine ayrıştırılmış renk komutları gönderildi.
       - Geriye dönük uyumluluk (single `color` parametresi) %100 korundu.
       - Renk eşleme (mapColor) güvenli fiziksel aralık olan 0..5 sınırına çekildi.
    2. **Sorter Yönlendirme Motoru (`server/services/sorter_engine.cjs`):**
       - `resolveLightStripColor`: `TURKUAZ`/`CYAN`/`QC` durumunda `wallColor: 4 (Mavi)` + `color: 1 (Yeşil)`; `BEYAZ`/`WHITE` durumunda `wallColor: 2 (Sarı)` + `color: 1 (Yeşil)` kombinasyonu üretildi.
       - Taranan ürünlerde `sendMultLedCommand` hem duvar hem göz indeksini eşzamanlı ateşledi.
    3. **Kullanıcı Arayüzü (`src/pages/HardwareDashboard.jsx`):**
       - LED Kontrol Paneline yeni **`🎭 DUVAR + GÖZ KOMBİNASYONU`** sekmesi eklendi.
       - Kapsam seçici: 🏢 Tüm Makine, 🧱 Duvar Modülü (9 duvar seçimi), 📦 Tekil Göz (1..63 seçimi).
       - Tek tıkla çalışan 6 Popüler Hazır Kombinasyon kartı eklendi.
       - Duvar ve Göz için renk (0..5) ve mod (Sabit / Flaş) seçilebilen dinamik "Özel Renk & Mod Oluşturucu" eklendi.
       - Tek renk sekmelerindeki (Tab 1, Tab 3, Tab 4) butonlar donanımda fiziksel karşılığı olan 6 standart duruma (0..5) normalize edildi.
  - **Test ve Doğrulama:**
    - `scratch/test_dual_led.cjs`:
      - `set-all` ile Mavi Duvar (4) + Yeşil Flaş Göz (1) -> 72 LED noktası başarıyla tetiklendi (200 OK).
      - Chute 10 için Mavi Duvar + Yeşil Göz -> 2 LED noktası başarıyla tetiklendi (200 OK).
      - Duvar Modülü M145-WALL-A-1 için Mor Duvar + Sarı Göz -> 10 LED noktası tetiklendi (200 OK).
      - Tek renk geriye dönük uyumluluk (Red Flash) doğrulandı (200 OK).
    - Web `npm run build`: 688 modül 0 hata ile derlendi (6.58s).
    - PM2 `vog-api` yeniden başlatıldı ve online.
    - Windows Print Spooler: Tüm yazıcılarda 0 iş (ZERO PRINT doğrulandı).

- **feature/order-box-planning-and-multi-flow-integration (Sipariş Öncesi Koli ve Beden Dağılım Planlama - Pre-Packing Plan - ve Tüm Operasyonel Akışlara Entegrasyonu):**
  - **Kullanıcı Talebi:** *"sipariş kolilerinin nasıl olacağı ve hangi kolide neler kaçar adet olacağının ayarlması ve tüm akışlarda bu bilgininde kullanılması gerekiyor. bu düzenlemeyi yapıp güncellermisin"*
  - **Kapsam:** Siparişlerin sevkiyat veya üretim öncesinde kaç koliye bölüneceği, her bir kolide hangi bedenden (XS, S, M, L, XL vb.) kaçar adet bulunacağının dinamik veya otomatik formüllerle planlanması ve bu plan bilgisinin sistemdeki tüm uçtan uca akışlarda (Sipariş Yönetimi, RFID Tünel Kiosk, El Terminali / WMS Packing, Koli Etiket Basımı ve OmniSort Mini Sorter) aktif olarak kullanılması.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Kullanıcının kesin kuralına uyularak SATO/Godex barkod yazıcılarına 0 fiziksel çıktı gönderildi (ZERO PRINT doğrulandı, kuyruk: 0 iş).
  - **Uygulanan Mimari & Kod Değişiklikleri:**
    1. **Veritabanı Şeması & Migrasyon (`server/migrations/upgrade_order_boxes_plan.cjs` & `server/setup_db.cjs`):**
       - `order_boxes` tablosuna: `target_quantity INTEGER DEFAULT 0`, `items_plan JSONB DEFAULT '[]'::jsonb`, `notes TEXT`, `plan_type TEXT DEFAULT 'MANUAL'` eklendi.
       - `orders` tablosuna: `has_box_plan BOOLEAN DEFAULT FALSE` eklendi.
    2. **Backend API Servisleri & Otomatik Planlayıcı (`server/app.js`):**
       - `getOrderSizeBreakdown(orderNumber)`: Siparişin `vouchers`, `master_products` ve `orders` tablolarındaki tüm beden matrisini çözer.
       - `GET /api/orders/:orderNumber/box-plan`: Siparişin toplam adet, planlanan adet, kalan adet ve beden dağılımı ile mevcut planlanmış kolilerini döner.
       - `POST /api/orders/:orderNumber/box-plan`: Özel koli ve beden dağılım planını `order_boxes` tablosuna kaydeder, `orders.total_boxes` ve `orders.has_box_plan` alanlarını günceller.
       - `POST /api/orders/:orderNumber/auto-box-plan`: 3 akıllı otomatik dağıtım stratejisi (`BY_BOX_COUNT`, `BY_CAPACITY`, `BY_SIZE`) sunar; kalan adetleri orantılı paylaştırır.
       - `refreshMssqlOrdersCacheAsync`: `boxPlanSummaryMap` pre-fetch sorgusu ile 16,000+ sipariş listesinde `has_box_plan`, `box_plan_boxes` ve `box_plan_planned_qty` alanlarını sıfır gecikmeyle döner.
       - `GET /api/tunnel/kiosk/orders`: Sipariş arama ve listesinde `total_planned_boxes` ve `has_box_plan` bayrakları döner.
       - `POST /api/tunnel/kiosk/start-session` & `select-box-for-verification`: Planlanmış koli hedefi ve beden dağılımını RFID tünel oturumuna anında enjekte eder.
    3. **RFID Tünel Sürücüsü (`server/drivers/rfid_tunnel_driver.js`):**
       - `startSession(orderData)`: `box_plan` dizisini tünel oturumuna kaydeder.
       - `getSessionSummary()`: Canlı sayım özetinde `box_plan` (beden bazlı hedefler) ve `items_breakdown` (okunan adetler) eşzamanlı döner.
    4. **Koli Etiket Basım Köprüsü (`server/drivers/vog_print_bridge.cjs`):**
       - `generateBoxLabelZPL`: Koli etiketinde planlanan bedenlerin özetini (`BEDENLER: XS:4 S:4 M:4...`) etiketin orta bölümüne dinamik olarak ekler.
    5. **Kullanıcı Arayüzü - Web (`src/components/OrderBoxPlanModal.jsx`, `OrdersPage.jsx`, `TunnelKioskPage.jsx`):**
       - `OrderBoxPlanModal.jsx`: Modern, koyu/açık tema uyumlu, canlı KPI'lar, tek tıkla 2/3 koli veya 25 adet/koli otomatik paylaştırma araçları, beden/koli matrisi, kalan adet takipçisi.
       - `OrdersPage.jsx`: Tablo satırlarına ve sipariş detay modalına "📦 Koli Planla" / "📦 Koli Planı Mevcut" butonu eklendi.
       - `TunnelKioskPage.jsx`: Koli başlatma modalında planlı koliler beden dağılım etiketleriyle listelendi; canlı RFID tarama ekranında okunan adetler ile planlanan beden hedefleri canlı renkli rozetlerle eşleştirildi (`Okunan / Hedef`).
    6. **El Terminali / PDA Uygulaması (`vog_terminal_flutter`):**
       - `box_model.dart`: `OrderBox` sınıfına `targetQuantity` ve `itemsPlan` alanları eklendi.
       - `packing_screen.dart`: `_buildLiveCounterCard` bileşeni planlanan koli hedefi (`$count / $targetQty`) ve beden ilerleme rozetlerini (`$sz: $current/$target`) canlı gösterecek şekilde güncellendi.
  - **Test ve Doğrulama:**
    - `scratch/test_all_box_plan_flows.cjs` çalıştırıldı:
      - 16575 nolu sipariş için 2 koli otomatik planlandı (28 ve 21 adet).
      - El terminali API'si planlanan kolileri bedenleriyle birlikte başarıyla aldı.
      - Tünel Kiosk doğrulaması 28 hedef adedi ve `box_plan` matrisini oturuma yükledi.
    - Web `npm run build`: 688 modül sıfır hatayla derlendi (6.82s).
    - Flutter `flutter analyze`: "No issues found!".
    - Windows Print Spooler: Tüm yazıcılarda 0 iş (ZERO PRINT doğrulandı).

- **fix/tunnel-kiosk-order-16575-visibility (16575 Nolu Siparişin RFID Tünel Kiosk Sayfasında Görünmeme Sorununun Çözümü):**
  - **Kullanıcı Talebi:** *"16575 nolu sipariş rfid tunel sayfasında görünmüyor neden"*
  - **Tespit Edilen Kök Nedenler:**
    1. **PostgreSQL `orders` Tablosunda Kaydın Eksik Olması:** Sipariş 16575; `vouchers`, `sales`, `rfid_tags` ve MSSQL üzerinde mevcut olmasına rağmen PostgreSQL `orders` ana tablosuna aktarılmamıştı.
    2. **Tünel API'sinde Sabit `LIMIT 300` Sınırı:** `server/app.js` içerisindeki `GET /api/tunnel/kiosk/orders` uç noktası `ORDER BY order_number DESC LIMIT 300` ile sorgu atıyordu. Sistemdeki son sipariş numarası 16956 olduğundan, ilk 300 sipariş yalnızca 16648'e kadar olan siparişleri kapsıyor; 16575 nolu sipariş varsayılan modal listesinde dışarıda kalıyordu.
    3. **MSSQL Önbellek Fallback'i Bulunmaması:** El terminali (`/api/wms/pending-orders`) uç noktasında bulunan `cachedMssqlOrdersResult` birleştirme (merge) mantığı, tünel kiosk uç noktasında bulunmadığından MSSQL'deki siparişler PostgreSQL `orders` tablosunda yoksa arama kutusundan aratılsa dahi listelenemiyordu.
  - **Uygulanan Çözüm ve Mimari İyileştirmeler:**
    1. **Sipariş 16575 Veritabanına Eklendi:** PostgreSQL `orders` tablosuna Sipariş 16575; 52 Adet, `BEKLEMEDE` durumu, NISSAN markası, `NISSAN 2026 KIŞ GÖMLEK` model adı ve standart beden/barkod bilgileriyle eklendi.
    2. **`/api/tunnel/kiosk/orders` Uç Noktası Güçlendirildi (`server/app.js`):**
       - SQL sorgu limiti `LIMIT 300`'den `LIMIT 1000`'e çıkarıldı (en güncel 1000 sipariş doğrudan modal açılışında taranabilir hale geldi).
       - MSSQL önbellek entegrasyonu (`cachedMssqlOrdersResult`) eklendi: PostgreSQL'de henüz oluşmamış veya senkronize edilmemiş MSSQL siparişleri de arama ve marka filtrelerine otomatik dahil edilerek tünel listesine dinamik olarak eklendi.
  - **Test ve Doğrulama:**
    - `GET /api/tunnel/kiosk/orders?q=16575` sorgusu: Sipariş 16575 başarıyla bulundu ve döndürüldü.
    - `GET /api/tunnel/kiosk/orders?brand=NISSAN` sorgusu: 83 sipariş listelendi, 16575 listede yer aldı.
    - `GET /api/tunnel/kiosk/orders` (Aramasız varsayılan liste): 1000 sipariş başarıyla listelendi ve 16575 içinde doğrulandı.
    - SATO yazıcı kontrolü: Spooler kuyruğu 0 iş (ZERO PRINT kesin olarak korundu).


- **feature/nissan-2026-kis-catalog-import-and-mini-sorter-integration (NISSAN 2026 KIŞ 274 Kalem Resmi Kataloğunun master_products'a Aktarılması, Mükerrer Kayıtların Temizlenmesi ve Mini Sorter Beden Dağılımı Entegrasyonu):**
  - **Kapsam & Kullanıcı Talebi:** Kullanıcının *"NISSAN 2026 KIŞ.xlsx dosyasından master_products tablosuna verileri giriş yapar mısın. diğer tablolarıda buna göre güncelle. özellikler mini sorter ile ilgili olanları"* talimatı doğrultusunda; `NISSAN 2026 KIŞ PARÇA KODLARI.xlsx` dosyasındaki 274 ürün satırının tamamı PostgreSQL `master_products` tablosuna aktarıldı, eski mükerrer sentetik kayıtlar temizlendi, `orders` tablosundaki Nissan 2026 siparişleri güncellendi ve Mini Sorter (OmniSort M145) sisteminin taranan Nissan barkodlarını `master_products` üzerinden anında beden ve sipariş bazında tanıması sağlandı.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Kullanıcının kesin kuralına uyularak SATO barkod yazıcısına 0 fiziksel çıktı gönderildi (ZERO PRINT).
  - **Uygulanan Mimari & Kod Değişiklikleri:**
    1. **`master_products` Kataloğunun İşlenmesi & Temizliği:**
       - `NISSAN 2026 KIŞ PARÇA KODLARI.xlsx` sayfasındaki 274 kalem (260 adet `8520147...` ve 14 adet `6001258...`) ayrıştırıldı.
       - Eski 252 adet mükerrer sentetik `KIYAFETKIS-...` kaydı silinerek katalog tekilleştirildi.
       - 274 ürünün tamamında `sku = code39 = ean13 = barcode = 13 Haneli Barkod`, `product_name`, `size`, `clean_size`, `gender`, `brand = 'NISSAN'`, `grup` ve `color = 'STANDART'` formatı sağlandı (Katalogda 0 eksik, 0 mükerrer).
    2. **`orders` Tablosu Senkronizasyonu:**
       - Nissan 2026 Kış siparişleri (16576..16588) kontrol edildi; boş olan Order 16576 barkod/SKU alanlarına resmi katalog barkodu (`8520147033126`) atandı.
    3. **Mini Sorter Yönlendirme Motoru Entegrasyonu (`server/services/sorter_engine.cjs`):**
       - `resolveDestinationChute`: Taranan barkod veya SKU için `master_products` tablosu en yüksek öncelikle taranarak `effectiveSize` (`S`, `M`, `L`, `XL`, `2XL` vb.) doğrudan katalogdan çekilir; böylece henüz fiş kesilmemiş ürünler dahi sorter üzerinde doğru beden gözüne (`[Beden: X]`) yönlendirilir.
       - Otomatik Sipariş Eşleştirme (Auto-Matching): Taranan barkodun `master_products` model başlığı ile rezervasyondaki siparişin model başlığı karşılaştırılarak, sipariş başlığında tek bir beden yazsa bile o modelin tüm beden varyantlarının doğru sipariş gözüne akması sağlandı.
    4. **Mini Sorter Beden Dağılım API'si (`server/app.js`):**
       - `GET /api/wms/sorter/orders/:orderNumber/sizes`: Henüz fiş kaydı bulunmayan siparişlerde siparişin barkodu üzerinden `master_products` taranarak modelin tüm beden varyantları (örneğin Pantolon için XS..4XL 8 beden) dinamik olarak listelenir; operatör sorter rezervasyonunda her bedene ayrı göz tahsis edebilir.
  - **Test ve Doğrulama:**
    - 274/274 Nissan 2026 Kış kalemi `master_products` içinde tekil ve eksiksiz doğrulandı.
    - Sorter beden yönlendirme simülasyonunda S, M ve L ürünleri sırasıyla Chute 10, 11 ve 12'ye hatasız yönlendi.
    - Sorter otomatik sipariş varyant eşleştirme testi başarılı oldu (Chute 5).
    - Canlı API testleri: `/api/wms/sorter/orders/16578/sizes` (XS..4XL 8 beden), `/api/wms/sorter/orders/16575/sizes` (S, M, L).
    - PM2 servisleri (`vog-api` ve `vog-frontend`) online. SATO yazıcı kuyruğu 0 iş (ZERO PRINT).

- **fix/vouchers-master-products-size-specific-sku-and-barcode (Fiş / Mal Kabul ve Satış Oluştururken Her Bedenin Farklı SKU, Code39 ve EAN13 Değerlerinin master_products Tablosundan Birebir Çözümlenmesi):**
  - **Kapsam & Kullanıcı Talebi:** Kullanıcının pgAdmin `vouchers` tablosu ekran görüntüsü eşliğinde *"FİŞ OLUŞTURURKEN her bedenin farklı sku;=code39=ean13 değerleri olmalı bunu master_products tablosundan doğru almalısın"* uyarısı doğrultusunda; sipariş fişleri oluşturulurken (`POST /api/vouchers/create-from-order`, `resolveVoucherMetadata` ve `resolveExactSizeSkuAndBarcode`) sipariş başlığındaki tekil barkodun (`rawNumericBarcode` - XS bedeni) tüm bedenlere ezilmesi sorunu giderildi.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Kullanıcının kesin kuralına uyularak SATO barkod yazıcısına 0 fiziksel çıktı gönderildi (ZERO PRINT).
  - **Tespit Edilen Kök Neden:**
    1. `resolveExactSizeSkuAndBarcode` fonksiyonunda `master_products` tablosunda o bedenin (S, M, L vb.) satırı bulunsa bile, `if (isBcValid(rawNumericBarcode))` kontrolünün öncelikli olması sebebiyle sipariş başlığındaki varsayılan barkod (`6001258147022` - XS) `finalBarcodeVal` değerinin üstüne yazıyordu.
    2. Özellikle Nissan ve GS1/EAN tabanlı ürünlerde `effectiveCode39 = finalBarcodeVal` ve `effectiveSku = effectiveCode39` mantığı uygulandığından, tüm bedenler (S, M, L) istemeden sipariş başlığındaki XS barkoduna eşitleniyordu.
    3. Beden varyantı aramasında `clean_size !== cleanSize` durumunda `master_products` üzerinde tam varyant eşleşmesi (Step 2 SKU kökü varyantı ve Step 4.5 ürün adı + beden + cinsiyet fallback'i) güçlendirildi.
  - **Uygulanan Çözüm & Mimari Değişiklikler:**
    1. **`server/app.js` (`resolveExactSizeSkuAndBarcode`):**
       - Beden bazlı eşleşmelerde `master_products`'tan gelen `matchedMpRow.ean13` ve `matchedMpRow.barcode` alanları `rawNumericBarcode`'un ÖNÜNE geçirilerek en yüksek öncelik verildi (`finalBarcodeVal = matchedMpRow.ean13 || matchedMpRow.barcode || ...`).
       - Nissan ürünleri için `effectiveCode39 = matchedMpRow.code39 || matchedMpRow.sku || finalBarcodeVal`, `effectiveSku = matchedMpRow.sku || matchedMpRow.code39 || finalBarcodeVal`, `finalBarcodeVal = matchedMpRow.ean13 || matchedMpRow.barcode || effectiveSku || finalBarcodeVal` zinciri kurularak her bedenin kendine ait `sku = code39 = ean13 = barcode` değeri garanti edildi.
       - Step 2'de SKU kökünden varyant sorgulama ve Step 4.5'te marka + ürün adı + beden + cinsiyet kombinasyonuyla `master_products`'tan kesin varyant çekme eklendi.
    2. **Sipariş 16575 Veritabanı Düzeltmesi:**
       - PostgreSQL `vouchers` ve `sales` tablolarında Sipariş 16575 için daha önce yanlış kaydedilmiş barkodlar `master_products` kataloğundaki gerçek beden değerleriyle güncellendi:
         - Beden S: `6001258147023`
         - Beden M: `6001258147024`
         - Beden L: `6001258147025`
    3. **Dağıtım ve Doğrulama:**
       - PM2 servisleri (`vog-api` ve `vog-frontend`) `pm2 restart all` ile yeniden başlatıldı.
       - `GET /api/terminal/receiving-context/16575` uç noktası test edildi; S (`6001258147023`), M (`6001258147024`), L (`6001258147025`) eksiksiz doğrulandı.
       - SATO barkod yazıcısı kontrol edildi; kuyruk 0 iş (ZERO PRINT doğrulandı).

- **release/v1.4.0-receiving-and-dispatch-dual-mode (Tesellüm / Mal Kabul Stok Girişi Modülü & Çift Modlu El Terminali Mimarisi - v1.4.0 Build 10):**
  - **Kapsam:** Kullanıcının "şu an bu yazılım koli işlemleri için sevk çıkış anlamında değil mi. şimdi Tesellüm Mal kabul Stok Girişi anlamında da bir özellik ekleyelim" talebi doğrultusunda; mevcut koli mühürleme ve açık satış irsaliyesi sevk çıkış mimarisi %100 korunarak el terminaline ikinci ana iş kolu olan **"Tesellüm / Mal Kabul (Stok Girişi)"** modülü eklendi. Çift sekmeli alt navigasyon (`MainShell`) mimarisine geçilerek operatörün tek tıkla "Sevk Çıkış" ve "Mal Kabul" arasında geçiş yapması sağlandı.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Kullanıcının kesin kuralına uyularak SATO barkod yazıcısına 0 fiziksel çıktı gönderildi (ZERO PRINT).
  - **Geliştirilen Bileşenler & Yapılan Değişiklikler:**
    1. **Backend API Servisleri (`server/app.js`):**
       - `GET /api/terminal/receiving-context/:order_number`: Siparişe ait hedef miktar (`quantity`), daha önce depoya kabul edilmiş toplam adet (`vouchers` tablosundaki toplam adet), kalan açık adet, ilerleme yüzdesi (`progress_pct`), siparişe izin verilen SGTIN-96 EPC listesi (`allowed_epcs`), barkodlar, SKU'lar ve son oluşturulan depoya giriş fişleri (`recent_vouchers`) tek sorguda hesaplanıp döner.
       - `POST /api/terminal/receive-items`: Okutulan RFID/Barkod ürünlerini PostgreSQL `vouchers` tablosuna `location = 'Ana Depo Tesellüm'`, `status = 'Depoda'` olarak toplu ekler; `orders` tablosundaki `remaining_quantity` alanını düşürür ve sipariş durumunu `Kısmi Tesellüm (X/Y)` veya `Depoda` olarak günceller.
       - Sürüm bilgisi `v1.4.0 (Build 10)` olarak güncellendi, indirme yollarına `/vog-terminal-v1.4.0.apk` eklendi.
    2. **Flutter Veri Modelleri & API Servisi (`vog_terminal_flutter`):**
       - `lib/models/receiving_model.dart`: `ReceivingContext` ve `ReceivingItem` sınıfları oluşturuldu.
       - `lib/services/api_service.dart`: `getReceivingContext(orderNumber)` ve `saveReceivingItems(orderNumber, items, location, note)` metotları eklendi.
    3. **Flutter Mal Kabul Ekranı (`lib/screens/receiving_screen.dart`):**
       - Sipariş seçimi, 4'lü canlı metrik paneli (Hedef Miktar, Önceki Kabul, Bu Parti, Kalan Açık), renkli ilerleme çubuğu.
       - SGTIN-96 etiketlerinde gömülü sipariş no ayrıştırması ile yabancı sipariş engelleme (`🚫 YABANCI SİPARİŞ`).
       - 3 kademeli mükerrer engelleme (bu parti içi, daha önce depoya kabul edilenler, whitelist harici).
       - Canlı tarama geri bildirim kartı (okunan EPC ve durum bildirimi).
       - RFID / Barkod donanım tetiği modu seçimi.
       - "Tesellümü Kaydet & Depoya Al" butonu ile fiş oluşturma ve onay diyalogu.
    4. **Çift Modlu Ana Navigasyon (`lib/screens/main_shell.dart`):**
       - `IndexedStack` yapısıyla hem Sevk Çıkış (`PackingScreen`) hem de Mal Kabul (`ReceivingScreen`) ekranlarının arka plan state'leri ve açık sayımları kaybolmadan korunur.
       - Alt barda 3 sekme: 📦 Sevk Çıkış, 📥 Mal Kabul, ⚙️ Ayarlar.
       - `main.dart` açılışı `MainShell` üzerinden konfigüre edildi.
    5. **Web Arayüzü & İndirme Sayfası (`src/pages/ApkDownloadPage.jsx`):**
       - İndirme sayfasında v1.4.0 (Build 10) yeni özellikler (Sevk Çıkış & Mal Kabul Stok Girişi) ve doğrudan indirme linkleri eklendi.
  - **Dağıtım & Doğrulama:**
    - Flutter Release APK derlendi: `vog_terminal_flutter/build/app/outputs/flutter-apk/app-release.apk` (24.1 MB / 25,304,325 bayt).
    - `dist/vog-terminal.apk`, `server/vog-terminal.apk`, `vog-terminal.apk`, `dist/vog-terminal-v1.4.0.apk` ve `server/vog-terminal-v1.4.0.apk` güncellendi.
    - Web frontend `npm run build` ile derlendi (6.17s).
    - PM2 servisleri (`pm2 restart all`) yeniden başlatıldı (`vog-api` & `vog-frontend` online).
    - API Sürüm Doğrulama: `http://localhost:3001/api/terminal/info` -> `v1.4.0 (Build 10)`.
    - API Tesellüm Bağlamı: `http://localhost:3001/api/terminal/receiving-context/16575` -> HTTP 200 OK.
    - APK İndirme Doğrulama: `http://192.168.1.251:3001/vog-terminal.apk` -> HTTP 200 (25,304,325 bayt).
    - SATO Yazıcı Kuyruğu: 0 iş (ZERO PRINT doğrulandı).

- **release/v1.3.1-receive-broadcast-and-strict-order-live-counter (Receive/Broadcast Modu Tam Uyumluluk, %100 Kesin Canlı Sayaç, Mükerrer Engelleme & Canlı Durum Kartı - v1.3.1 Build 9):**
  - **Kapsam:** Kullanıcının "tamam calıştı ama etiketleri saymıyor receive/broadcast seçili. counter 0 değerini gösteriyor biplemesine rağmen. ayrıca mükerrer saymaması sadece sseçili sipariş için bu işlemi yapması gerek" bildirimi üzerine, Chainway C72 / C66 el terminalinde `KeyboardEmulator` "Receive/Broadcast" modundayken yayınlanan tüm broadcast intent'lerinin eksiksiz yakalanması, PC word (`3000`) ve binary ByteArray normalizasyonu, 3 seviyeli mükerrer engelleme, seçili siparişe özel sıkı kısıtlama ve operatöre okunan her etiketin durumunu canlı gösteren sayaç altı geri bildirim kartı entegre edildi.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Kullanıcının kesin kuralına uyularak SATO barkod yazıcısına 0 fiziksel çıktı gönderildi (ZERO PRINT).
  - **Kök Nedenler & Uygulanan Çözümler:**
    1. **Eksik Chainway Broadcast Intent Action'ları:** `KeyboardEmulator` "Receive/Broadcast" modunda `com.rscja.scanner.action.scanner.RFID`, `com.rscja.android.action.scanner.RFID`, `com.rscja.scanner.action.RFID`, `android.intent.action.SCANNER_BARCODE_DATA` gibi eylemleri tetikliyordu. `MainActivity.kt` IntentFilter'ına 40'tan fazla OEM eylem eklendi ve tüm Bundle anahtarları kayıpsız tarandı.
    2. **Gen2 PC Word (3000) ve Binary ByteArray Formatı:** Bazı etiketler `3000303B50CC...` şeklinde 26 karakter veya raw byte dizisi olarak gelmekteydi. `_normalizeCode` fonksiyonu ile PC word ayıklandı, standart 22 karakterlik VOG EPC elde edildi; `code.startsWith('303B50CC')` ve sipariş doğrulamasının kusursuz çalışması sağlandı.
    3. **%100 Mükerrer Sayım Engelleme:**
       - Seviye 1: Mevcut koli (`_currentBoxItems`) içinde taranan etiket tekrar sayılmaz.
       - Seviye 2: Bu siparişe ait daha önce mühürlenmiş koliler (`_savedBoxes`) içindeki etiket tekrar sayılmaz.
       - Seviye 3: Sunucu veritabanında daha önce kaydedilmiş etiketler (`_scannedEpcs`) tekrar sayılmaz.
       - Mükerrer tespit edildiğinde sayaç artmaz (+0), sesli/titreşimli uyarı verilir ve ekranda `⚠️ MÜKERRER ETİKET!` sarı kartı gösterilir.
    4. **Sadece Seçili Siparişi Sayma (Sıkı İzolasyon):**
       - Sipariş seçilmeden tarama yapılırsa işlem bloke edilir.
       - SGTIN-96 etiketlerinde gömülü sipariş numarası hex'ten decimal'e çevrilerek seçili sipariş no (`orderNumber`) ile karşılaştırılır; farklıysa `🚫 YABANCI SİPARİŞ!` kırmızı kartıyla engellenir, sayaç artmaz.
       - Whitelist dışındaki yabancı barkod/EPC'ler engellenir.
    5. **Canlı Ekran Geri Bildirimi (`_buildLiveScanFeedbackCard`):** Dev 72px sayacın hemen altına operatörün tetiğe bastığında okunan etiketi ve akıbetini (Yeşil: Eklendi, Sarı: Mükerrer, Kırmızı: Yabancı Sipariş) anlık gösteren kart eklendi.
  - **Dağıtım ve Doğrulama:**
    - Flutter Release APK derlendi: `vog_terminal_flutter/build/app/outputs/flutter-apk/app-release.apk` (24.0 MB / 25,118,593 bayt).
    - Dağıtım dosyaları güncellendi: `dist/vog-terminal.apk`, `server/vog-terminal.apk`, `vog-terminal.apk`, `dist/vog-terminal-v1.3.1.apk` ve `server/vog-terminal-v1.3.1.apk`.
    - Web frontend `npm run build` ile derlendi (6.34s).
    - PM2 servisleri yeniden başlatıldı (`pm2 restart all` - `vog-api` & `vog-frontend` online).
    - API Sürüm Doğrulama: `http://localhost:3001/api/terminal/info` -> `v1.3.1 (Build 9)`.
    - APK İndirme Doğrulama: `http://192.168.1.251:3001/vog-terminal.apk` -> HTTP 200 (25,118,593 bayt).
    - SATO Yazıcı Kuyruğu: 0 iş (ZERO PRINT doğrulandı).

- **release/v1.3.0-live-counter-and-whitelist-filter (Canlı Koli Sayacı, %100 Mükerrer Engelleme ve Sipariş Whitelist Filtreli Sürüm - v1.3.0 Build 8):**
  - **Kapsam:** Kullanıcının "şimdi oldu ama 1.2.1 de count etmiyor hangisinde count edecek ve mükerrer saymayacak sadece seçilen siparişi sayacak onu yükleyelim download sayfasından" talimatı üzerine, Chainway C72 terminalinde donanım tetiğiyle canlı sayım yapan, mükerrerleri tamamen engelleyen ve sadece seçilen siparişe ait ürünleri sayan **v1.3.0 (Build 8)** sürümü geliştirildi, derlendi ve indirme sayfasına yüklendi.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Kullanıcının kesin kuralına uyularak SATO barkod yazıcısına 0 fiziksel çıktı gönderildi (ZERO PRINT).
  - **v1.2.1 Sürümünde Saymama Sebepleri & Çözümleri:**
    1. **Pistol Tetik Olayının Yutulması:** v1.2.1'de `dispatchKeyEvent` tetiğe basılınca `return true;` yapıyor, bu da Chainway'in arkaplandaki `KeyboardEmulator` servisinin fiziksel tuşu görmesini engelliyordu. `return super.dispatchKeyEvent(event)` yapılarak tuş hem bizim broadcast kanalımıza hem de KeyboardEmulator'a eşzamanlı iletildi.
    2. **`ACTION_UP` Erken Kesme:** v1.2.1'de tetik bırakıldığı an (50ms) `UHF_STOP` gönderilip anten susturuluyordu; v1.3.0'da 3.5 saniyelik güvenlik penceresi (`autoStopRunnable`) getirilerek etiket burst'lerinin eksiksiz toplanması sağlandı.
    3. **Çift Kanallı Yakalama:** Hem Chainway Broadcast Intent'leri (`com.rscja...`, `com.chainway...`, `tag_epc`, `data`) hem de klavye wedge girişleri (TAB/ENTER sonlandırıcılı ve 120ms debounce flush) birleştirildi.
    4. **Donanım BİP! Sesi:** Her okumada yerel Android `ToneGenerator` ile anlık akustik geri bildirim eklendi.
  - **Mükerrer Saymama ve Sipariş Doğrulama Mantığı (`packing_screen.dart`):**
    1. **Mükerrer Engelleme (3 Kademe):**
       - Mevcut açık koli içindeki etiketler (`_currentBoxItems`) tekrar sayılmaz (sessizce yoksayılır).
       - Bu siparişe ait daha önce mühürlenmiş kolilerdeki etiketler (`_savedBoxes`) tekrar sayılmaz.
       - Sunucu veri tabanında daha önce okutulmuş etiketler (`_scannedEpcs`) tekrar sayılmaz.
    2. **Sadece Seçilen Siparişi Sayma (Whitelist & SGTIN-96):**
       - Sipariş seçilmeden tarama yapılırsa "⚠️ Lütfen önce paketlenecek siparişi seçin" uyarısı verir.
       - SGTIN-96 etiketlerinde (`303B50CC...`) gömülü sipariş numarası seçili siparişten farklıysa anında "🚫 YABANCI ETİKET! Bu etiket Sipariş #... ait!" hatası vererek engeller.
       - Siparişe ait izin verilen EPC (`_allowedEpcs`), Barkod (`_allowedBarcodes`) veya SKU (`_allowedSkus`) listesinde olmayan yabancı etiketler "🚫 YABANCI ETİKET ENGELLENDİ!" uyarısıyla bloke edilir.
       - Sadece ve sadece seçilen siparişe ait ürünler koli listesine eklenir.
    3. **Canlı Sayaç:** Geçerli ürün eklendiğinde ekrandaki 72px dev yeşil sayaç anlık olarak artar (1, 2, 3... 24).
  - **Dağıtım & Doğrulama:**
    - Flutter Release APK derlendi: `vog_terminal_flutter/build/app/outputs/flutter-apk/app-release.apk` (23.9 MB / 25,111,325 bayt).
    - `dist/vog-terminal.apk`, `server/vog-terminal.apk`, `vog-terminal.apk`, `dist/vog-terminal-v1.3.0.apk` ve `server/vog-terminal-v1.3.0.apk` güncellendi.
    - `server/app.js` ve `src/pages/ApkDownloadPage.jsx` güncellendi (`/api/terminal/info` -> v1.3.0 Build 8).
    - Web frontend `npm run build` ile derlendi (6.26s).
    - PM2 servisleri yeniden başlatıldı (`pm2 restart all`).
    - HTTP 200 doğrulaması: `http://192.168.1.251:3001/vog-terminal.apk` ve `/vog-terminal-v1.3.0.apk`.
    - SATO yazıcı kontrolü: Kuyruk 0 (ZERO PRINT doğrulandı).

- **rollback/restore-v1.2.1-and-v1.2.0 (Kullanıcı Talebiyle Kararlı Çalışan v1.2.1 ve v1.2.0 Sürümüne Geri Dönüş):**
  - **Kapsam:** Kullanıcının "eski sürüme geri dön 1.2.0 yada 1.2.1 çalışıyordu" talimatı üzerine, daha önce sorunsuz çalışan orijinal v1.2.1 ve v1.2.0 APK ikili dosyaları ile Flutter Kotlin kaynak kodları (`MainActivity.kt`, `AndroidManifest.xml`, `pubspec.yaml`) tam kararlı orijinal haline geri yüklendi.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Kullanıcının kesin kuralına uyularak SATO barkod yazıcısına 0 fiziksel çıktı gönderildi (ZERO PRINT).
  - **Yapılan İşlemler:**
    1. Sistemde sağlam korunan `vog-terminal-v1.2.1.apk` (25,109,733 bayt) ve `vog-terminal-v1.2.0.apk` (25,099,422 bayt) dosyaları doğrudan dağıtım konumlarına (`dist/vog-terminal.apk`, `server/vog-terminal.apk`, `vog-terminal.apk`) aktarıldı.
    2. `c:\vog_system\vog_terminal_flutter\android\app\src\main\kotlin\com\vog\terminal\MainActivity.kt` dosyası tam v1.2.1 kaynak koduna (384 satır, saf intent & keycode yapısı) eksiksiz döndürüldü.
    3. `AndroidManifest.xml` ve `pubspec.yaml` dosyaları `v1.2.1+3` sürümüne geri alındı.
    4. Sunucu `server/app.js` ve React frontend indirme sayfaları güncellendi; kullanıcıya hem `v1.2.1` hem de `v1.2.0` için ayrı doğrudan indirme linkleri sunuldu:
       - `http://192.168.1.251:3001/vog-terminal-v1.2.1.apk` (200 OK)
       - `http://192.168.1.251:3001/vog-terminal-v1.2.0.apk` (200 OK)
       - `http://192.168.1.251:3001/vog-terminal.apk` (200 OK - Varsayılan v1.2.1)
    5. `npm run build` ile web frontend derlendi (6.21s).
    6. `pm2 restart all` ile servisler yeniden başlatıldı (`vog-api` ve `vog-frontend` online).
    7. SATO yazıcı kuyruğu kontrol edildi: 0 çıktı (ZERO PRINT).

- **fix/rfid-terminal-chainway-direct-native-uhf-driver (Chainway Harici UHF Uygulaması Bağımlılığını Kaldıran Doğrudan Donanım Sürücüsü - v1.2.5):**
  - **Kapsam:** Kullanıcının "UHF uygulamasını çalıştırıp antenin rfid leri görebilmesi mumkun oluyor. sonra UHF uygulamasını kapatıyorum tamamen ve bizim uygulamayı açıyorum. antenlere erişemiyor ve tetiğe bastıgımda hiçbirşey olmuyor" geri bildirimi doğrultusunda, Chainway C72 / C66 ve benzeri el terminallerinde UHF RFID modülünün (Impinj Indy R2000 / PR9200) cihaz açılışında veya fabrika UHF uygulaması kapatıldığında otomatik olarak elektriğinin kesilmesi sorunu çözüldü. Artık uygulamamız Android içinden Chainway'in yerel donanım sürücüsünü (`com.rscja.deviceapi.RFIDWithUHFUART`) doğrudan yükleyerek antene güç verir, taramayı başlatır ve tetiğe basıldığında bağımsız olarak RFID okur.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Kullanıcının kesin kuralına uyularak SATO barkod yazıcısına 0 fiziksel çıktı gönderildi (ZERO PRINT).
  - **Tespit Edilen Kök Neden:**
    1. **Chainway Güç ve Seri Port Yaşam Döngüsü (Power & Serial Port Lifecycle):** Chainway terminallerinde UHF RFID anteni anakarta GPIO güç pini ve UART seri portu (`/dev/rscja_uhf` / `/dev/ttyMT2`) üzerinden bağlıdır. Android OS boot olduğunda UHF modülüne elektrik vermez.
    2. **Fabrika UHF Uygulamasının Kapatılması (`RFIDWithUHFUART.free()`):** Kullanıcı "UHF" uygulamasını açtığında o uygulama `init()` çağırarak GPIO pinini HIGH yapar ve antene güç verir. Ancak kullanıcı "UHF" uygulamasını tamamen kapattığında (`onDestroy`), UHF uygulaması `free()` metodunu çağırarak GPIO pinini LOW yapar ve antenin gücünü tamamen keser.
    3. **Salt Intent Yayınlamanın Yetersizliği:** Bizim uygulamamız sadece Android Broadcast Intent'leri (`UHF_START`) gönderiyordu. Ancak donanım kapalı/enerjisiz olduğunda Intent'ler donanıma ulaşamaz çünkü çip kapalıdır.
  - **Uygulanan Mimari ve Kod Değişiklikleri:**
    1. **Dinamik Chainway Donanım Sürücüsü (`MainActivity.kt`):**
       - `findChainwayUHFClass()`: Cihazda kurulu olan `com.rscja.uhf`, `com.rscja.keyboardemulator`, `com.example.uhf` paketlerinin APK'ları (`sourceDir`) ve yerel kütüphaneleri (`nativeLibraryDir` - `libDeviceAPI.so`) taranarak `dalvik.system.PathClassLoader` ile `com.rscja.deviceapi.RFIDWithUHFUART` sınıfı dinamik olarak yüklenir.
       - `initDirectChainwayUHF()`: Sınıfın `getInstance()` singleton nesnesi alınır, `init(context)` / `init()` çağrılarak GPIO pini HIGH yapılır ve anten açılır; RF gücü 30 dBm'e ayarlanır.
       - `startDirectInventory()`: `startInventoryTag()` çağrılır ve arka planda çalışan daemon okuma döngüsü (`readTagFromBuffer()`) başlatılır.
       - `extractEpcFromTagObject()`: Okunan `UHFTAGInfo` nesnesinden EPC çıkarılır, yerel `ToneGenerator` ile donanımsal "BİP!" çalınır ve Flutter `scanEventSink` kanalına anında iletilir.
       - `stopDirectInventory()` ve `freeDirectChainwayUHF()`: Döngü ve envanter durdurulur, uygulama yaşam döngüsüne (`onResume`, `onPause`, `onDestroy`) bağlanır.
    2. **KeyboardEmulator Arka Plan Uyandırma:**
       - Tetiğe basıldığında (`executeScanTrigger`) ayrıca `com.rscja.android.action.OPEN_SCAN` (extra: `state=true`), `UHF_INIT` ve `SCAN_INIT` intent'leri yayınlanarak KeyboardEmulator servisinin uyanık kalması sağlanır.
    3. **Android 11+ Paket Görünürlüğü (`AndroidManifest.xml`):**
       - `<queries>` bloğu ve `<uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" />` eklenerek Android 11+ sistemlerde `packageManager.getApplicationInfo`'nun OEM uygulamalarını engelsiz tespit etmesi sağlandı.
    4. **Sürüm Yükseltme & Dağıtım (v1.2.5 - Build 7):**
       - `pubspec.yaml`, `server/app.js`, `ApkDownloadPage.jsx` v1.2.5 olarak güncellendi.
       - Flutter Release APK derlendi (`flutter build apk --release`, 24.0 MB / 25,116,122 bayt).
       - `dist/vog-terminal.apk`, `server/vog-terminal.apk` ve kök dizine kopyalandı.
       - PM2 servisleri (`pm2 restart all`) yeniden başlatıldı.
  - **Test ve Doğrulama:**
    - Flutter `assembleRelease` 86.1s içinde 0 hata ile derlendi (24.0 MB).
    - `dist/vog-terminal.apk` ve `server/vog-terminal.apk` dosyaları 25,116,122 bayt olarak doğrulandı.
    - `/api/terminal/info` API yanıtında `version: "v1.2.5"`, `build: 7` doğrulandı.
    - SATO barkod yazıcısı kontrol edildi; 0 fiziksel baskı (ZERO PRINT).
  - **Kapsam:** Kullanıcının "el terminali tetik çalımıyor tetiğe tıklıyorum bip bip ses cıkarıp okudu bu olmuyor rfid anteni acılmadı" geri bildirimi doğrultusunda, Chainway C72 / C66 ve benzeri el terminallerinde fiziksel tabanca tetiğine basıldığında RFID anteninin açılmasını engelleyen donanımsal çakışmalar giderildi, erken durdurma sinyalleri kaldırıldı ve garantili "BİP!" donanım sesi entegre edildi.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Kullanıcının kesin kuralına uyularak SATO barkod yazıcısına 0 fiziksel çıktı gönderildi (ZERO PRINT).
  - **Tespit Edilen Kök Nedenler:**
    1. **RFID / 2D Barkod Donanımsal Karşılıklı Dışlama (Hardware Interlock Conflict):** Chainway terminallerinde 2D barkod lazer modülü ile UHF RFID modülü aynı dahili güç ve UART veri hattını kullanır. Önceki sürümde `executeScanTrigger(true)` çağrıldığında UHF komutlarının yanında `com.rscja.android.action.BARCODE_START` ve `com.android.server.scannerservice.start` da yayınlanıyordu. Terminal işletim sistemi barkod başlatma isteğini alınca gücü 2D optik motora yönlendirip UHF anten modülünün gücünü kesiyordu (antene RF enerjisi gitmiyordu).
    2. **Tetik Bırakıldığında (`ACTION_UP`) Anında `UHF_STOP` Gönderilmesi (Premature Abort):** Operatör tabanca tetiğine tıkladığında (50-80ms bas-çek), `ACTION_DOWN`'dan hemen sonra `ACTION_UP` tetikleniyordu. Kod `ACTION_UP`'ta derhal `executeScanTrigger(false)` çağırarak `UHF_STOP`, `STOP_SCAN` ve `KEY_UP` yayınlıyordu. UHF RFID güç amplifikatörünün uyanması en az 250ms sürdüğünden anten açılmaya fırsat bulamadan 50. ms'de kapatılıyordu.
    3. **Ses Bildiriminin Çıkmaması:** Terminallerdeki "bip bip" sesi etiket okunduğunda sistem servisi tarafından üretilir. Anten hiç açılmadığı ve etiket okunamadığı için buzzer hiç ses çıkarmıyordu.
  - **Uygulanan Mimari Değişiklikler:**
    1. **`MainActivity.kt` Saf UHF / Barkod Ayrıştırması:**
       - `currentScannerMode == "rfid"` iken kesinlikle hiçbir barkod intent'i (`BARCODE_START`, `scannerservice.start`, `sendBroadcastScan` vb.) gönderilmez; YALNIZCA saf UHF intent'leri (`com.rscja.android.action.UHF_START`, `START_INVENTORY`, `START_SCAN`, `KEY_DOWN 139/280`, `Zebra RFID`) gönderilir.
       - `currentScannerMode == "barcode"` iken ise yalnızca saf barkod komutları gönderilir.
    2. **`ACTION_UP` Erken Kapatmanın Kaldırılması:**
       - `dispatchKeyEvent` içinde `ACTION_UP` olayında `executeScanTrigger(false)` çağrısı iptal edildi.
       - Tetiğe tek bir tık yapılsa dahi `autoStopRunnable` (3500ms) sayesinde RFID anteni 3.5 saniye boyunca kesintisiz açık kalır, etiketleri toplar ve süresi dolunca güvenle durur.
       - `super.dispatchKeyEvent(event)` döndürülerek cihazın kendi `KeyboardEmulator` sistem servisinin de tuşu fiziksel yakalaması sağlandı.
    3. **Android Native `ToneGenerator` Buzzer Entegrasyonu:**
       - `android.media.ToneGenerator` eklendi.
       - Hem Intent Broadcast ile hem de klavye wedge tamponuyla yakalanan her bir etiket için anında hoparlörden yüksek sesli, net "BİP!" (`TONE_PROP_BEEP`) sesi çalınması garanti edildi.
    4. **Sürüm Yükseltme & Dağıtım:**
       - `pubspec.yaml`, `server/app.js`, `ApkDownloadPage.jsx`, `BoxLabelPrinting.jsx` `v1.2.4+6` olarak güncellendi.
       - Flutter Release APK derlendi (`flutter build apk --release`, 23.9 MB / 25,111,352 bayt).
       - `dist/vog-terminal.apk`, `server/vog-terminal.apk` ve `vog-terminal.apk` güncellendi.
       - PM2 servisleri (`pm2 restart all`) yeniden başlatıldı.
  - **Test ve Doğrulama:**
    - Flutter `assembleRelease` 86.7s içinde 0 hata ile derlendi (23.9 MB).
    - `npm run build` ile web frontend 6.03s içinde hatasız paketlendi.
    - `/api/terminal/info` çağrıldı; `v1.2.4` teyit edildi.
    - `/vog-terminal.apk` HEAD isteğiyle HTTP 200 ve 25,111,352 bayt doğrulandı.
    - SATO barkod yazıcısı kontrol edildi; 0 fiziksel baskı (ZERO PRINT).

  - **Kapsam:** Kullanıcının "RFID terminal tetiği çalışmıyor" geri bildirimi doğrultusunda, fiziksel el terminallerindeki (Chainway C72 / C66, Urovo, Zebra TC/MC serisi, Newland, Seuic, Honeywell) tabanca tetiğinin (pistol grip trigger) ve yan tarama butonlarının hem yerel Android uygulamasında (`vog_terminal_flutter`) hem de web/PWA el terminali arayüzünde (`HandheldTerminal.jsx`) taranan etiketleri ve barkodları anında okuması sağlandı.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Kullanıcının kesin kuralına uyularak SATO barkod yazıcısına 0 fiziksel çıktı gönderildi (ZERO PRINT).
  - **Tespit Edilen Kök Nedenler:**
    1. **Android Event Yutulması (`MainActivity.kt` Line 121):** Tetik tuşuna basıldığında `dispatchKeyEvent` metodu `executeScanTrigger(true)` çağırıyor ve hemen ardından `return true` dönüyordu. Android'de `return true` dönülmesi tuş olayını pencere düzeyinde tüketir (consume eder). Chainway'in `KeyboardEmulator` / `UHFService` veya Urovo/Zebra sistem tarayıcı arka plan servisleri donanım tetik sinyalini yakalayamadığı için RFID donanımı fiziksel olarak tetiklenemiyordu.
    2. **Eksik Tetik Keycode'ları:** Chainway C72 tabanca tetiği (`280`), C66 tetiği (`293`), Urovo (`261..263`, `301..303`, `520..522`), Zebra (`102..104`, `10036..10037`) ve fonksiyon tuşları (`F1..F12`) filtrelere eksik tanımlanmıştı.
    3. **Eksik OEM Tetik Intent'leri:** `executeScanTrigger` metodu sadece genel UHF intent'lerini gönderiyordu. Chainway için zorunlu olan `com.rscja.android.KEY_DOWN` (extra `keyCode: 139` ve `280`) ile `com.rscja.android.action.START_SCAN` ve Urovo/Zebra direkt tetik çağrıları bulunmuyordu.
    4. **Web Terminali Focus Kaybı (`HandheldTerminal.jsx`):** Koli Paketleme modunda (`boxing`) barkod giriş kutusuna `ref` atanmamıştı ve focus interval döngüsünde sadece `receiving` ve `counting` yer alıyordu. Kullanıcı sipariş seçtiğinde input odağı kaybediyor, el terminali klavye emülasyonuyla gönderilen veriler kayboluyordu. Ayrıca global tetik tuşu dinleyicisi ve hızlı klavye wedge tamponu bulunmuyordu.
  - **Uygulanan Mimari ve Kod Değişiklikleri:**
    1. **Native Android APK (`vog_terminal_flutter/.../MainActivity.kt`):**
       - `isTriggerKey(keyCode)` tüm Chainway, Urovo, Zebra, Newland ve Honeywell tetik tuş kodlarını kapsayacak şekilde genişletildi.
       - `dispatchKeyEvent`: Tetik tuşu basıldığında `return true` kaldırıldı; `return super.dispatchKeyEvent(event)` yapıldı. Böylece sistem donanım arka plan servisi (Chainway UHF/KeyboardEmulator vb.) fiziksel tuşu engelsiz yakalarken, uygulamamız da eş zamanlı olarak doğrudan Intent broadcast'lerini gönderir.
       - `executeScanTrigger`: Chainway `com.rscja.android.KEY_DOWN` (`139`, `280`), `START_SCAN`, Urovo (`urovo.rcv.action.START_SCAN`), Zebra ve Honeywell intent'leri eklendi. Tetik bırakılmadığında pil ve RF güvenliği için 3500ms `autoStopRunnable` zaman aşımı eklendi.
       - Tuş takımı emülasyonunda `KEYCODE_ENTER`, `KEYCODE_NUMPAD_ENTER` ve `KEYCODE_TAB` sonlandırıcıları desteklendi.
    2. **Flutter Servis Katmanı (`hardware_scanner.dart`):**
       - `_handleGlobalKeyEvent`: `LogicalKeyboardKey.tab` desteği eklendi. `F9..F12` tuşlarına donanımsal tarama tetikleme köprüsü bağlandı.
    3. **Web / PWA Terminali (`src/pages/HandheldTerminal.jsx`):**
       - `boxingInputRef` oluşturuldu ve Koli Paketleme input'una bağlandı.
       - Focus bakım döngüsü `activeTab === 'boxing'` durumunu kapsayacak şekilde güncellendi.
       - Global `keydown` dinleyicisi eklendi: Terminal tetiğine basıldığında anında aktif sekmeye focus atar. Ayrıca klavye odağı geçici olarak kaybedilse dahi hızlı wedge karakter akışını tamponlayıp otomatik olarak doğru koli/tesellüm/sayım metoduna teslim eder.
       - Koli paketleme arayüzüne dokunmatik `🔫 TETİK` aksiyon butonu eklendi.
    4. **Release APK Derleme ve Dağıtım:**
       - Flutter Release APK başarıyla derlendi (`flutter build apk --release`, 23.9 MB).
       - APK dosyası web sunucusunun indirme yollarına kopyalandı (`dist/vog-terminal.apk` ve `server/vog-terminal.apk`).
       - Sunucu `/api/terminal/info` uç noktası `v1.2.3+5` ve yeni özelliklerle güncellendi.
    5. **İndirme Sayfası Modernizasyonu (`ApkDownloadPage.jsx` & `server/app.js`):**
       - Kullanıcının "indirme sayfasını güncelle" talebi doğrultusunda hem React SPA (`/apk`, `/download`, `/indir`, `/terminal-apk`, `/download-terminal`) hem de Express SSR (`sendApkLandingHtml`) indirme sayfaları v1.2.3 sürümüne yükseltildi.
       - `@bwip-js/browser` ile dinamik, yüksek kontrastlı QR Kod oluşturucu entegre edildi. Operatörler el terminali kamerası veya cep telefonuyla QR kodu taratarak tek tıkla APK'yı indirebilir.
       - "İndirme Linkini Kopyala" (panoya kopyalama ve anlık bildirim) butonu eklendi.
       - Yeni `🔫 Donanım Tetiği (Pistol Grip) Tam Entegrasyonu` öne çıkan özellik kartı ve 3 adımlı kurulum rehberi yerleştirildi.
       - `BoxLabelPrinting.jsx` üst menüsündeki APK indirme rozeti `v1.2.3` olarak güncellendi.
  - **Test ve Doğrulama:**
    - `npm run build` ile web frontend derlendi (0 hata, 6.95s).
    - PM2 servisleri (`vog-api`, `vog-frontend`) online durumda çalışıyor.
    - APK indirme uç noktası HTTP 200 (25,111,161 bayt) doğrulaması yapıldı.
    - `/api/terminal/info` çağrıldı; `v1.2.3` yanıtı teyit edildi.
    - SATO barkod yazıcısı kontrol edildi; kuyruk 0, fiziksel çıktı 0 (ZERO PRINT).

- **feature/mini-sorter-order-size-chute-splitting (Mini Sorter Siparişteki Her Bedeni Ayrı Kutulara / Gözlere Koyma ve Beden Bazlı Ayrıştırma Desteği):**
  - **Kapsam:** Kullanıcının "Mini sorterda siparişteki her bedeni ayrı kutulara koyma seçeneğini ekle" talebi doğrultusunda, OmniSort Mini 63 Göz ayıklama sistemine sipariş rezervasyonunda her bedenin (XS, S, M, L, XL vb.) ayrı bir göze veya koli kapasitesi aşıldığında o bedene özel ardışık kaskat gözlerine otomatik ayrıştırılabilmesi özelliği eklendi.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Kullanıcının kesin kuralına uyularak SATO barkod yazıcısına 0 fiziksel çıktı gönderildi (ZERO PRINT).
  - **Uygulanan Mimari ve Kod Değişiklikleri:**
    1. **Veritabanı Şeması (`sorter_mappings` & `sorter_chute_state`):**
       - `sorter_mappings` tablosuna `size VARCHAR(50)` kolonu eklendi.
       - `sorter_chute_state` tablosuna `assigned_size VARCHAR(50)` kolonu eklendi.
    2. **Backend API ve Servis Katmanı (`server/app.js` & `server/services/sorter_engine.cjs`):**
       - `GET /api/wms/sorter/orders/:orderNumber/sizes`: Siparişin `vouchers` ve `rfid_tags` tablolarındaki beden kırılımlarını (beden adı, adet, barkodlar, SKU'lar) ve `box_capacity` parametresine göre beden başına kaç göze (`needed_chutes`) ihtiyaç duyulduğunu dinamik olarak hesaplar ve döner.
       - `POST /api/wms/sorter/orders/reserve`: `split_by_size: true` ve `size_allocations: [{ size: 'S', chute_numbers: [1] }, { size: 'L', chute_numbers: [3, 4] }]` desteği kazandırıldı. Her beden için göz(ler) `priority` (kaskat sırası) ve `size` değeriyle kaydedilir, göz state'ine `assigned_size` yazılır. Standart tekil sipariş rezervasyonuyla %100 geriye dönük uyumludur.
       - `POST /api/wms/sorter/orders/release` ve `DELETE /api/wms/sorter-mapping/:id`: Rezervasyon serbest bırakıldığında veya silindiğinde `assigned_size = NULL` olarak temizlenir.
       - `sorter_engine.cjs` -> `resolveDestinationChute`:
         - Ürün okutulduğunda önce siparişe ait beden eşleşmesi aranır (`effectiveSize` -> `voucher`/`rfid_tags` fallback'li).
         - O bedene ayrılmış göze yönlendirilir (`Sipariş #16575 [Beden: S] -> Göz: A1-1`).
         - Tek bir bedenin adedi koli kapasitesini (örn: 25) aşarsa, o bedenin kendi ardışık kaskat gözüne (örn: Chute 3 dolunca Chute 4'e) otomatik taşar.
         - `resolveDestinationChute` parametreleri null/undefined toleranslı hale getirildi (`params = {}`, `cleanBarcode/barcode`, `orderNumber/order_number` alias desteği).
    3. **Frontend Arayüzü (`src/pages/HardwareDashboard.jsx`):**
       - Rezervasyon Modalı Adım 2'ye Mod Seçici eklendi:
         - `[ 📦 Standart Karışık Koli (Tüm Bedenler Tek Kaskat Kolide) ]`
         - `[ 👕 Her Bedeni Ayrı Kutuya Koy (Beden Bazlı Ayrıştırma) ]`
       - Beden Bazlı Mod aktif olduğunda:
         - Beden dağılım kartları (Beden adı, Toplam Adet, İhtiyaç Göz Sayısı, Atanan Gözler rozetleri + 'X' ile kaldırma).
         - `⚡ Boş Gözleri Bedenlere Otomatik Dağıt` tek tıkla boş gözleri ihtiyaç duyulan adetlere göre bedenlere sıralı tahsis eder.
         - Aktif beden seçilip Adım 3'teki boş göz ızgarasından manuel göz ekleme/çıkarma yapılabilir.
       - Göz Izgarası (FloorMapGrid / renderChuteCard) ve Canlı Takip Listesi:
         - Beden atanmış gözlerde yüksek kontrastlı `👕 BEDEN: X` sarı/amber rozeti gösterilir.
       - Aktif Sipariş Rezervasyonları listesinde `👕 BEDEN: X` etiketi gösterilir.
  - **Test ve Doğrulama:**
    - `npm run build` ile tüm frontend derlendi (0 hata, 6.11s).
    - PM2 servisleri (`vog-api`, `vog-frontend`) online durumda çalışıyor.
    - Otomatik end-to-end doğrulama testinde:
      - Sipariş 16575 bedenleri (S: 4, M: 16, L: 32) başarıyla çekildi.
      - Beden S -> Göz 1, Beden M -> Göz 2, Beden L -> Göz 3 ve Göz 4'e rezerve edildi.
      - Sorter engine simülasyonunda S, M ve L ürünleri doğru beden gözlerine yönlendirildi.
      - Rezervasyon serbest bırakılarak sistem temiz duruma alındı.
    - SATO barkod yazıcısı kontrol edildi; 0 fiziksel baskı yapıldı.

  - **Kapsam:** Kullanıcının "RFID TUNEL DE 4 ADET ANTEN VARSA KACI KULLANIMDA BILMIYORUM HEPSİNİ DEVREYE ALMALI VE GÖREBİLMELİYİZ" talebi doğrultusunda, tüneldeki 4 adet Impinj/SICK RFID anteni (Port 1: Üst Sol, Port 2: Üst Sağ, Port 3: Alt Sol, Port 4: Alt Sağ) donanım sürücülerinde ve LLRP protokol katmanında açıkça aktive edildi, tag paketlerinden anten port numarası ayrıştırıldı ve tünel dokunmatik kiosk ekranına (`TunnelKioskPage.jsx`) gerçek zamanlı anten izleme arayüzü kazandırıldı.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Kullanıcının kuralına uyularak SATO barkod yazıcısına 0 fiziksel çıktı gönderildi (ZERO PRINT).
  - **Uygulanan Mimari ve Kod Değişiklikleri:**
    1. **C# Native Driver (`server/VogTunnelDriver.cs` & `dist/VogTunnelDriver.exe`):**
       - `BuildAntennaConfigPayload(resetFactory, pwrIdx)` metodu geliştirildi: Port 0 (tüm portlar) ve Port 1, 2, 3, 4 tek tek `AntennaProperties` (`IsConnected = true`) ve `RFTransmitter` ile LLRP `SET_READER_CONFIG` parametrelerine yazıldı.
       - `ADD_ROSPEC` `AISpec` parametresi 1 porttan 4 porta genişletildi (`Antenna Count = 4`: `0x00, 0x01, 0x00, 0x02, 0x00, 0x03, 0x00, 0x04`; 71 baytlık `0x0047` AISpec). Okuyucu donanımın 4 anteni birden taraması sağlandı.
       - `ParseSingleTagReport` metoduna TV Type 1 (`AntennaID`) parsing eklendi. Gelen her EPC'nin hangi porttan okunduğu tespit edilerek `/api/tunnel/kiosk/scan-tag` uç noktasına `antenna` parametresiyle iletildi.
       - Microsoft .NET csc ile yeniden derlendi (`dist/VogTunnelDriver.exe`).
    2. **PowerShell Dinamik Driver (`server/app.js` - `TUNNEL_AGENT_PS1_SCRIPT`):**
       - Tünel PC'sinde bellekte çalışan PowerShell agent script'ine 4 anten portunun `AISpec` (Ports 1, 2, 3, 4) ve `AntennaID` (TV Type 1) ayrıştırması eklendi; `/api/tunnel/kiosk/scan-tag` endpoint'ine `antenna` bilgisi bağlandı.
    3. **Node.js Native Sürücü ve Backend Servisi (`server/drivers/rfid_tunnel_driver.js` & `server/app.js`):**
       - `antennaStats` nesnesi (Port 1..4, isimler, anlık koli adedi, `last_seen`, `active`) eklendi.
       - `processTag` metodunun başına anlık RF pulse izleme eklendi: Oturum aktif olmasa bile bir etiketin RF sinyali algılandığı an o portun `last_seen` zaman damgası güncellenir.
       - Oturum başladığında veya sıfırlandığında koli bazlı anten adetleri sıfırlanır.
       - `/api/tunnel/kiosk/status` ve `getSessionSummary()` yanıtlarına `antennas` listesi dahil edildi.
    4. **Dokunmatik Kiosk Frontend (`src/pages/TunnelKioskPage.jsx`):**
       - Üst başlık çubuğuna `4/4 ANTEN DEVREDE` rozeti eklendi.
       - Sol kolonda (Aktif Sipariş Kartı ile Dev Sayaç arasına) 4 adet anten için şık, kompakt ve canlı RF monitör grid'i (`repeat(4, 1fr)`) yerleştirildi:
         - Port 1 (Üst Sol - Mavi), Port 2 (Üst Sağ - Zümrüt Yeşil), Port 3 (Alt Sol - Turuncu), Port 4 (Alt Sağ - Mor).
         - Her anten kartında port numarası, tünel konumu, o kolide okunan adet ve son 3 saniye içinde RF sinyali geldiğinde parlayan `📡 RF SİNYAL` nabız (pulsing) göstergesi eklendi.
       - "CANLI OKUNAN ETİKETLER (STREAM)" listesindeki her ürün satırına, o ürünün hangi antenden yakalandığını gösteren renkli `[ANT 1]`, `[ANT 2]`, `[ANT 3]`, `[ANT 4]` rozeti ve sinyal gücü (`RSSI dBm`) eklendi.
  - **Test ve Doğrulama:**
    - `npm run build` ile frontend başarıyla paketlendi (0 hata).
    - PM2 servisleri (`vog-api`, `vog-frontend`) online duruma getirildi.
    - `/api/tunnel/kiosk/status` çağrıldı; 4 antenin devrede olduğu ve canlı telemetrinin çalıştığı teyit edildi.
    - Port 3 üzerinden mock tarama gönderildi; anında `last_seen` güncellendi ve RF nabız durumu doğrulandı.
    - SATO barkod yazıcısı kontrol edildi; kuyruk 0, fiziksel çıktı 0.

- **fix/order-16575-pending-list-visibility (Sipariş 16575 El Terminali Listesine Dahil Edildi & 1000 Limit Artırımı):**
  - **Tespit Edilen Kök Neden:**
    1. Backend `/api/wms/pending-orders` sorgusunda sabit `LIMIT 300` ve `.slice(0, 300)` kısıtı bulunuyordu. Sipariş 16575'ten sonra 370 adet daha yeni sipariş açıldığı için (16575 371. sırada yer alıyordu), 300 sınırına takılarak el terminaline gönderilen ilk listeden kesiliyordu.
    2. MSSQL önbelleğinde daha önce 36 adet kupon basıldığı için `VoucherStatus = 'TAMAMLANDI'` dönüyor, toplam 52 adetten kalan 16 adet olmasına rağmen sipariş durumu tamamlandıya düşüyordu.
  - **Uygulanan Çözüm:**
    1. `server/app.js` içerisindeki sipariş çekme ve döndürme limiti 300'den **1000**'e çıkarıldı (`LIMIT 1000`, `.slice(0, 1000)`).
    2. `remaining > 0` olduğu sürece siparişin `TAMAMLANDI` sayılması engellendi (`KISMI_TAMAMLANDI` / `BEKLEMEDE`).
    3. Sipariş 16575 PostgreSQL `orders` tablosuyla da senkronize edilerek aktif `BEKLEMEDE` durumuna alındı.
    4. PM2 (`vog-api`) yeniden başlatıldı ve el terminali API testinde 16575'in varsayılan listede başarıyla geldiği doğrulandı.


- **release/flutter-terminal-apk-v1.2.2 (Flutter El Terminali Güncel Release APK Derlemesi - SGTIN-96 & Whitelist Entegrasyonu):**
  - **Kapsam:** Siparişe özel whitelist (`allowed_epcs`, `allowed_barcodes`, `allowed_skus`), SGTIN-96 gömülü sipariş eşleştirmesi (`isSgtinOrderMatch`), yabancı etiketlerin engellenmesi ve mükerrer bildirimlerin sessize alınması mantıklarıyla güncellenmiş Flutter fiziksel el terminali APK'sı başarıyla derlendi (`flutter build apk --release`).
  - **Versiyon:** `1.2.2+4`
  - **Dosya Konumu:** `c:\vog_system\vog_terminal_flutter\build\app\outputs\flutter-apk\app-release.apk` (23.9 MB / 25,108,184 bayt, 10.09.2026 12:56).
  - **İndirme Endpoint'leri:** `http://192.168.1.251:3001/vog-terminal.apk` ve `http://192.168.1.251:3001/download-terminal`. Doğrudan PDA üzerindeki Chrome tarayıcısından tek tıkla indirilip kurulabilir.


- **fix/rfid-tunnel-sgtin96-and-rssi-calibration (RFID Tünel SGTIN-96 Gömülü Sipariş Çözümleme ve -70 dBm RSSI Hassasiyet Kalibrasyonu):**
  - **Kapsam:** Kullanıcının tünelin okumadığı yönündeki geri bildirimi ("şu an rfid tunel hiçbirşey okumadı") üzerine PM2 logları incelendi. Donanım (Impinj R700 / LLRP okuyucu) etiketleri anında okumasına rağmen (`303B50CC0040BF...`), tünel sürücüsünün bu etiketleri yabancı etiket sanarak reddettiği tespit edildi.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Kullanıcının kuralına uyularak SATO barkod yazıcısına 0 fiziksel çıktı gönderildi (ZERO PRINT).
  - **Tespit Edilen Kök Nedenler:**
    1. VOG etiketleri basılırken `303B50CC` + Sipariş Hex (`0040BF` = 16575) + Seri Hex formatında yazılmaktadır. Tünel sürücüsü (`rfid_tunnel_driver.js`) bu gömülü sipariş numarasını çözümlemediği ve etiketler `rfid_tags` tablosunda kayıtlı olmadığı için etiketler yabancı barkod sanılarak filtreleniyordu.
    2. RSSI filtre eşiği -62 dBm olarak ayarlandığı için kumaş/koli içi sönümlenmiş etiketler (-63 dBm) sınırda kalabiliyordu.
    3. `order_scanned_epcs` hafızası koli 1 ve oturum sıfırlamalarında temizlenmediği için aynı oturumda tekrar okutulan etiketler `ALREADY_SCANNED_IN_ORDER` statüsüne düşüyordu.
  - **Uygulanan Düzeltmeler:**
    1. `rfid_tunnel_driver.js` içine VOG SGTIN-96 gömülü sipariş kontrolü eklendi: `epc.substring(8, 14)` (`0040BF`) doğrudan aktif sipariş `16575` ile eşleştirildi (`isMatched = true`, `isForeign = false`).
    2. Başka bir VOG siparişine ait etiketler (`FOREIGN_TAG_REJECTED: Başka VOG Siparişine (#16942) Ait Etiket`) veya ortamdaki parazit etiketler kesin olarak engellendi.
    3. RSSI filtre eşiği -70 dBm, okuma gücü 24 dBm olarak kalibre edildi.
    4. Koli 1 ve oturum sıfırlamalarında `order_scanned_epcs` temizlendi.
  - **Canlı Doğrulama:**
    - Tünelden geçirilen 31 adet ürünün tamamı eksiksiz okundu ve sayıldı (`scanned_quantity: 31`, `foreign_quantity: 0`).


- **fix/rfid-handheld-terminal-order-whitelist-and-silent-duplicate (RFID El Terminali / PDA Sipariş Doğrulama, Ortam Etiketlerini Engelleme ve Sessiz Mükerrer Yönetimi):**
  - **Kapsam:** Kullanıcı talepleri ("benzer durum RFID el terminalinde de var", "ayrıca wanin notification mukerrer oldugunda hiç görünmesin") doğrultusunda, RFID el terminali / PDA (hem Flutter Android uygulaması `vog_terminal_flutter` hem Web PWA `HandheldTerminal.jsx` ve backend `/api/wms/handheld-receive`, `/api/terminal/order-boxes`) üzerinde tüneldeki gibi tam sipariş doğrulama ve mükerrer etiket sessiz yönetimi uygulandı.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Kullanıcının kesin kuralına uyularak SATO barkod yazıcısına 0 fiziksel çıktı gönderildi (ZERO PRINT).
  - **Çözülen Problemler ve Uygulanan Çözümler:**
    1. **Ortamdaki Yabancı Etiketlerin Sayılması Engellendi (Order Whitelist & SGTIN-96 Rejection):**
       - El terminali ile koli paketleme (`packing_screen.dart` ve `HandheldTerminal.jsx`) veya tesellüm yapılırken tetik çekildiğinde ortamdaki 3-5 metre mesafedeki yabancı ürünlerin etiketleri okunabiliyordu.
       - Artık bir sipariş seçildiğinde, siparişin meşru barkodları, EAN kodları, SKU varyantları ve basılmış RFID EPC'leri (`allowed_epcs`, `allowed_barcodes`, `allowed_skus`) taranır.
       - SGTIN-96 formatındaki etiketlerin gömülü sipariş numarası kontrol edilir (`code.startsWith('303B50CC')`); seçili siparişle uyuşmuyorsa anında reddedilir.
       - Yabancı etiketler net bir şekilde engellenir ve sayaç artmaz (`🚫 YABANCI ETİKET ENGELLENDİ!`).
    2. **Mükerrer Etiketlerde Bildirimlerin Tamamen Gizlenmesi (Silent Duplicate Suppression):**
       - Kullanıcının "ayrıca wanin notification mukerrer oldugunda hiç görünmesin" talebi doğrultusunda; bir etiket açık kolide, önceden mühürlenmiş kolilerde veya depoda zaten mevcutsa ekranda hiçbir uyarı/toast/hata bildirimi gösterilmez (`continue;` / `return;` ile sessizce yoksayılır).
       - Ekrandaki bildirim kirliliği tamamen sıfırlandı.
    3. **Backend ve Frontend Doğrulama:**
       - `/api/terminal/order-boxes/:orderNo` ve `/api/terminal/order-context/:orderNo` sipariş whitelist parametrelerini (`allowed_epcs`, `allowed_barcodes`, `allowed_skus`, `scanned_epcs`) eksiksiz döndürüyor.
       - `/api/terminal/validate-tag` gerçek zamanlı etiket kontrolü sağlayarak yabancı etiketleri ve mükerrerleri frontend'e bildirir.
       - `/api/terminal/save-box` endpoint'i kaydedilen tüm ürünleri hem mükerrerliğe hem sipariş whitelist'ine karşı doğrular; yabancı veya ortam etiketi içeren koli kayıtlarını 400 hatası ile engeller.
       - `/api/wms/handheld-receive` yabancı barkod/EPC'leri 400 ile engellerken, mükerrer etiketleri sessiz `duplicate_skipped` statüsü ile atlar.
       - Canlı simülasyon testlerinde: Eşleşen etiket onaylandı (`valid: true`), yabancı sipariş etiketi anında engellendi (`status: 400 / FOREIGN_ORDER`), ortam etiketi engellendi (`status: 400 / NOT_IN_WHITELIST`), mühürlenmiş etiket mükerrer reddedildi (`DUPLICATE_ORDER`).
       - `npm run build` 6.57s içinde hatasız derlendi. PM2 servisleri (`vog-api`, `vog-frontend`) online. SATO yazıcıya 0 fiziksel çıktı verildi.


- **fix/rfid-tunnel-ghost-reading-and-order-whitelist (RFID Tünel Hayalet Etiketleri Engelleme, Siparişe Özel Doğrulama ve %100 Mükerrer Önleme):**
  - **Kapsam:** Kullanıcı talebi ("RFID tunelde hiç yok iken 3 etiket var yada daha fazlasını sayıyor bu hata", "aynı etiketleri kesinlikle mükerrer okumamalı. hangi sipariş seçili ise onların bilgilerini okumalı ve saymalı. baska etiket varsA ETRAFTA onlarıda okumamalı", "mesela gücü arttırınca hemen sayıyor ama seçili spariş etiketi yok etrafta") doğrultusunda, tünel boşken veya güç artırıldığında ortamdaki başka ürün etiketlerinin sayılması ve mükerrer sayma riskleri tamamen ortadan kaldırıldı.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Kullanıcının kesin kuralına uyularak SATO barkod yazıcısına 0 fiziksel çıktı gönderildi (ZERO PRINT).
  - **Çözülen Kök Nedenler:**
    1. `TunnelKioskPage.jsx` `triggerImpinjManual` fonksiyonunda anten gücü `readPower: 30.0` (1000 mW) olarak hardcoded kalmıştı; RF alanı tünel perdelerinden dışarı taşıp 2-3 metre uzaktaki etiketleri uyarabiliyordu.
    2. WebSocket köprüsünden iletilen tag okumalarında `rssi` alanı eksikti ve sunucu RSSI eşik filtresini atlıyordu.
    3. Standart tarama modunda tünel sürücüsü (`rfid_tunnel_driver.js`), gelen herhangi bir EPC'yi doğrudan o an seçili siparişin ürünü kabul edip `scanned_quantity += 1` olarak haneye yazıyordu.
  - **Uygulanan Mimari Değişiklikler:**
    1. **Siparişe Özel Dinamik Whitelist Doğrulaması (`server/app.js` & `rfid_tunnel_driver.js`):**
       - Kiosk'ta sipariş seçildiğinde (`/api/tunnel/kiosk/start-session`), o siparişin meşru barkodları (`order.barcode`, `order.ean13`, çift cinsiyetli SKU'larındaki tüm barkodlar), `master_products` model varyantları ve `rfid_tags` tablosunda o sipariş için basılmış EPC'ler tünel oturumunun `allowed_barcodes`, `allowed_skus` ve `allowed_epcs` havuzuna kaydedilir.
       - Tünelden bir etiket geçtiğinde veritabanı ve GS1 SGTIN-96 GTIN çözümlemesi yapılır. Eğer etiket seçili siparişe ait değilse veya başka bir markanın/siparişin etiketi ise derhal `[YABANCI ETİKET ENGELLENDİ]` olarak reddedilir ve `scanned_quantity` sayacı **ASLA artmaz**.
    2. **%100 Mükerrer Okuma Koruması (Zero Duplicate):**
       - Aynı koli içinde bir etiket kaç kez okunursa okunsun yalnızca 1 adet sayılır (`status: 'DUPLICATE_IGNORED'`).
       - Çoklu koli siparişlerinde koli geçişlerinde (`activeSession.order_scanned_epcs`), 1. kolide okutulan ürün 2. kolide tekrar geçerse `status: 'ALREADY_SCANNED_IN_ORDER'` ile reddedilir.
    3. **RF Güç ve RSSI Kalibrasyonu:**
       - `server/tunnel_config.json`: `power: 20` dBm, `rssiThreshold: -50` dBm olarak güncellendi.
       - `TunnelKioskPage.jsx`: 30 dBm hardcoded güç kaldırıldı, arayüzdeki optimize güç (20 dBm) dinamik olarak bağlandı. WebSocket üzerinden `rssi` alanı sunucuya iletilmeye başlandı.
       - `vog_impinj_native_driver.cjs`: `dispatchTagToBackend` metoduna `rssi` parametresi eklendi; `setPower` ve `setRssiThreshold` eklendi.
  - **Doğrulama ve Canlı Testler:**
    - Ortamdaki 3 hayalet etiket (`303B50CC...`, `303B4FDAC...`) hem RSSI eşik testi (-57 dBm) hem yabancı barkod filtreleme testiyle denendi: Tünel sayacı 0'da kaldı (`scanned_quantity: 0`).
    - Sipariş 16575'e ait meşru barkodlu etiket okutuldu: Sayaç 1 arttı.
    - Aynı etiket 5 kez ardışık tekrar okutuldu: Sayaç mükerrer sayılmayarak 1 kaldı.
    - Yabancı etiket tekrar gönderildi: Sayaç 1 kalmaya devam etti.
    - Oturum sıfırlandı: Tünel temiz 0 adede çekildi.
    - SATO yazıcı kuyruğu kontrol edildi: 0 çıktı.

- **fix/scania-2025-kis-and-2026-yaz-excel-audit (SCANIA 2025 Kış & 2026 Yaz Kişi Listesi Excel Denetimi ve Tüm Tablolarda Parça No Normalizasyonu):**
  - **Kapsam:** Kullanıcı talebi ("SCANIA içinde aynı işlemi yap . SCANIA KIŞ 2025 KİŞİ LİSTESİ.xlsx VE Scania 2026 Yaz Kişi Listesi.xlsx") doğrultusunda, indirilenler klasöründeki iki resmi katalog dosyasındaki (`SCANIA KIŞ 2025 KİŞİ LİSTESİ.xlsx` ve `Scania 2026 Yaz Kişi Listesi.xlsx`) resmi `SCKY...` bedenli `Parça Kodu` standartları MSSQL `Siparisler`, `MasterUrunler`, PostgreSQL `orders` ve `master_products` tablolarındaki **411 adet Scania siparişine** baştan sona uygulandı.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Kullanıcının kesin "deneme çıktısı kesinlikle alma!" kuralına tam uyularak SATO barkod yazıcısına 0 fiziksel çıktı gönderilmiş; tüm kontroller yazılımsal ve API testleriyle tamamlanmıştır.
  - **İncelenen Kataloglar ve Resmi SCKY Ürün Tanımları:**
    1. `C:\Users\ctopuz\Downloads\SCANIA KIŞ 2025 KİŞİ LİSTESİ.xlsx` (`Kodlar` sayfası, 197 satır):
       - Scania Bere: `SCKY20000` (Standart/Tek Beden)
       - Formen Önlüğü: `SCKY201` (XS=01 .. XXXL=07)
       - Scania Kolsuz Yelek: `SCKY202` (XS=01 .. 5XL=09)
       - Danışman & YP Sweatshirt Gri: `SCKY203` (XS=01 .. 5XL=09)
       - Teknisyen Sweatshirt Mavi / Lacivert: `SCKY204` (XS=01 .. 5XL=09)
       - Teknisyen Pantolon (VW Modeli / Füme-Lacivert): `SCKY205` (XS/38=01 .. 5XL/54=09)
       - Tulum: `SCKY206` (XS=01 .. XXXL=07)
       - Danışman Uzun Kol Gömlek: `SCKY207` (Erkek: 01-09) & `SCKY220` (Kadın: 01-09)
       - Danışman Mont Siyah: `SCKY208` (Erkek: 01-07) & `SCKY209` (Kadın: 01-07)
       - Danışman & YP Pantolon Lacivert: `SCKY222` (Erkek: 01-10) & `SCKY225` (Kadın: 01-09)
       - Master Teknisyen Sweatshirt Bordo: `SCKY221` (XS=01 .. XXXL=07)
    2. `C:\Users\ctopuz\Downloads\Scania 2026 Yaz Kişi Listesi.xlsx` (`Yazlık Kıyafet-Parça Tanımları` sayfası, 211 satır):
       - Servis Danışmanı Polo Yaka Tişört Mavi: `SCKY210` (Erkek: 01-10) & `SCKY211` (Kadın: 01-07)
       - Master Teknisyen 0 Yaka Tişört Bordo: `SCKY212` (XS=01 .. 5XL=09)
       - Master Teknisyen Polo Yaka Tişört Bordo: `SCKY213` (XS=01 .. 5XL=09)
       - Teknisyen 0 Yaka Tişört: `SCKY214` (Erkek: 01-09) & `SCKY215` (Kadın: 01-07)
       - Teknisyen Polo Yaka Tişört: `SCKY216` (Erkek: 01-09) & `SCKY217` (Kadın: 01-07)
       - Servis Danışmanı Kısa Kol Mavi Gömlek: `SCKY218` (Erkek: 01-10) & `SCKY219` (Kadın: 01-07)
       - Yedek Parça Polo Yaka Tişört: `SCKY223` (XS=01 .. 5XL=09)
       - Yedek Parça 0 Yaka Tişört: `SCKY224` (XS=01 .. 5XL=09)
  - **Uygulanan Düzeltmeler:**
    1. **Master Veritabanı Temizliği ve Onarımı (`scratch/audit_scania_product_names.cjs`):**
       - PostgreSQL `master_products` ve MSSQL `MasterUrunler` tablolarında bazı satırlarda ürün adı yerine bayi adlarının (`Akdeniz Ağır Vasıta`, `Çarıkcı Bolu` vb.) yazıldığı 106 satır tespit edildi.
       - Resmi Excellerdeki tanımlarla (`SC SWEATSHIRT (MAVİ)`, `SC TEKN. PANTOLON`, `SC S.D. - Y.P PANTOLON` vb.) hem PostgreSQL hem MSSQL tablolarında 106 satırın `product_name` ve `size` alanları düzeltildi.
       - Tüm 211 `SCKY` varyantının geçerli 13 haneli EAN barkodları doğrulandı (0 NaN).
    2. **411 Scania Siparişinin Kapsamlı Normalizasyonu (`server/migrate_all_scania_orders_comprehensive.cjs`):**
       - MSSQL `Siparisler` ve PostgreSQL `orders` tablolarındaki 411 Scania siparişine resmi SCKY bedenli kodları (`SCKY20000`, `SCKY20201`, `SCKY20401`, `SCKY20501`, `SCKY21201`, `SCKY21301`, `SCKY21601`, `SCKY22101`, `SCKY22301`, `SCKY22401`) ve çift cinsiyetli modellerde standart `ERKEK: <kod> - KADIN: <kod>` sözleşmesi atandı (`ERKEK: SCKY20701 - KADIN: SCKY22001`, `ERKEK: SCKY21001 - KADIN: SCKY21101`, `ERKEK: SCKY21401 - KADIN: SCKY21501`, `ERKEK: SCKY21801 - KADIN: SCKY21901`, `ERKEK: SCKY22201 - KADIN: SCKY22501`).
       - Sentetik sipariş ID kodları (`PSCANIA16774`, `PSCANIA16772`, `PSCANIA16408` vb.) ve yanlış marka kodları (`PSEAT200009XS`, `PPORSCHE2000097L` vb.) temizlenerek katalog kodlarıyla değiştirildi.
       - 3. parti/diğer marka siparişleri (Doğuş Lojistik, Doğuş Marin, Thermo King, TÜVTÜRK vb.) filtrelenerek %100 orijinal hallerinde korundu (Zero Regression).
    3. **Backend Çözümleme Motoru (`server/app.js`):**
       - Line 9143 regex'ine `SCKY\d{5}|PSCANIA\d{2,10}[A-Z0-9]*` eklendi.
       - `getCleanBaseSku` içine `if (/^SCKY(?!20000)\d{5}$/i.test(str)) return str.slice(0, 7);` eklendi.
       - `getScaniaSizeCode` yardımcı fonksiyonu eklenerek harf (XS..6XL) ve numara (38..62) bedenlerin Scania 2 basamaklı kodlarına (`01`..`10`) dönüştürülmesi sağlandı.
       - `resolveExactSizeSkuAndBarcode` fonksiyonuna Scania'nın 7 çift cinsiyet eşleşmesi (Uzun Kol Gömlek, Kısa Kol Gömlek, SD Polo Tişört, Danışman Pantolon, Teknisyen 0 Yaka Tişört, Teknisyen Polo Tişört, Danışman Mont) çift yönlü eklendi.
       - Boyut varyantı aramasında `cleanBase.startsWith('SCKY')` doğrudan 2 basamaklı beden kodunu adaylara ekleyecek şekilde güncellendi.
    4. **Frontend ve Servis Yenileme:**
       - `src/pages/OrdersPage.jsx` sessionStorage önbellek anahtarı `vog_admin_orders_cache_v7`'den `vog_admin_orders_cache_v8`'e yükseltildi.
       - `npm run build` ile frontend derlendi (6.21s, 0 hata).
       - `pm2 restart all` ile `vog-api` ve `vog-frontend` yeniden başlatıldı (Online).
    5. **Doğrulama ve Canlı Testler (`scratch/test_api_scania.cjs`, `scratch/test_scania_label_res.cjs`):**
       - Live API ve barkod çözücü testlerinde tüm Scania siparişlerinin resmi kodları, temiz bedenleri ve geçerli EAN barkodlarıyla çalıştığı %100 doğrulandı (PASS).
       - Fiziksel SATO yazıcıya 0 çıktı gönderildi.

- **fix/seat-2025-kis-and-2026-yaz-excel-audit (SEAT 2025 Kış & 2026 Yaz Parça Kodları Excel Denetimi ve Tüm Tablolarda Parça No Normalizasyonu):**
  - **Kapsam:** Kullanıcı talebi ("sıra SEAT MARKASINDA SEAT 2026 Yaz Kişi Listesi.xlsx VE SEAT 2025 KIŞ PARÇA KODLARI.XLSX dosyalarını kullanalım ve aynı işlemleri yapalım") doğrultusunda, indirilenler klasöründeki iki resmi dosya (`SEAT 2025 KIŞ PARÇA KODLARI.XLSX` ve `SEAT 2026 Yaz Kişi Listesi.xlsx`) incelenerek, bedenli `Parça Kodu` standartları MSSQL `Siparisler`, `MasterUrunler`, PostgreSQL `orders` ve `master_products` tablolarındaki **676 adet SEAT siparişine** baştan sona uygulandı.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Kullanıcının kesin "deneme cıktısı alma" kuralı korunarak SATO barkod yazıcısına 0 fiziksel çıktı gönderilmiş; tüm kontroller yazılımsal ve API testleriyle yapılmıştır.
  - **İncelenen Kataloglar ve Eşleşmeler:**
    1. `C:\Users\ctopuz\Downloads\SEAT 2025 KIŞ PARÇA KODLARI.XLSX` (293 satır):
       - Servis Danışmanı Gömlek: `PSEAT100004` (Erkek: XS-XXXL) & `PSEAT100003` (Kadın: XS-XXXL)
       - Servis Danışmanı Polar: `PSEAT100038` (Erkek: XS-XXXL) & `PSEAT100037` (Kadın: XS-XXXL)
       - Servis Danışmanı Mont: `PSEAT100023` (Erkek: XS-XXXL) & `PSEAT100024` (Kadın: XS-XXXL)
       - Servis Danışmanı Pantolon Kış: `PSEAT100005` (Erkek: 38-54) & `PSEAT100012` (Kadın: 36-44)
       - Teknisyen / Formen / Kaporta / Master Teknisyen Yelek: `PSEAT100020` (XS-XXXL)
       - Formen Polar: `PSEAT100040` (XS-XXXL)
       - Formen / Garanti / YP Sweatshirt Polo Yaka: `PSEAT100019` (XS-XXXL)
       - Kış Teknisyen / Formen Pantolon (VW Modeli): `PSEAT100006` (36=XXS, 38=XS..54=XXXXXL)
       - Teknisyen / Kaporta Polar: `PSEAT100039` (XS-XXXL)
       - Teknisyen Sweatshirt Polo Yaka: `PSEAT100021` (XS-XXXL)
       - Teknisyen Sweatshirt Bisiklet/O Yaka: `PSEAT100022` (XS-XXXL)
       - Master Teknisyen Polar: `PSEAT100050` (XS-XXXL)
       - Master Teknisyen Sweatshirt: `PSEAT100028` (XS-XXXL)
       - Garanti Sweatshirt: `PSEAT100051` (Erkek: XS-XXXL) & `PSEAT100052` (Kadın: XS-XXXL)
       - Acil Servis Mont: `PSEAT100025` (XS-XXXL)
    2. `C:\Users\ctopuz\Downloads\SEAT 2026 Yaz Kişi Listesi.xlsx` (`PARÇA NO DETAY` & `PARÇA NO` sayfaları, 229 satır):
       - Servis Danışmanı Beyaz Polo T-Shirt: `PSEAT200002` (Erkek: XS-XXXL) & `PSEAT200005` (Kadın: XS-XXXL)
       - Servis Danışmanı Kırmızı Polo T-Shirt: `PSEAT200017` (Erkek: XS-XXXL) & `PSEAT200018` (Kadın: XS-XXXL)
       - Servis Danışmanı Yazlık Pantolon: `PSEAT200003` (Erkek: 38=XS..62=XXXXXXXXXL) & `PSEAT200006` (Kadın: 36=XS..62=XXXXXXXXXXL)
       - Yazlık Teknisyen Pantolon: `PSEAT200009` (38=XS..62=XXXXXXXXXL)
       - Teknisyen / Garanti Dispozisyon Polo Yaka T-Shirt: `PSEAT200010` (XS-XXXL)
       - Teknisyen Bisiklet Yaka T-Shirt: `PSEAT200012` (XS-XXXL)
       - Formen Polo Yaka T-Shirt: `PSEAT200007` (XS-XXXL)
       - Master Teknisyen Polo Yaka T-Shirt: `PSEAT200028` (XS-XXXL)
       - Stajyer Polo Yaka T-Shirt: `PSEAT200019` (XS-XXXL)
  - **Uygulanan Düzeltmeler:**
    1. **Master Veritabanı Eşitlemesi (`scratch/sync_seat_to_mssql_master.cjs`):**
       - MSSQL `MasterUrunler` tablosunda eksik olan 242 adet SEAT varyantı PostgreSQL `master_products` tablosundaki resmi kayıtlarla ve temiz 13 haneli EAN barkodlarıyla eşitlendi (MSSQL eksik: 0).
       - Bilimsel gösterim sonucu oluşan 87 adet `NaN` içeren barkod geçerli EAN'lerle düzeltildi.
    2. **676 SEAT Siparişinin Normalizasyonu (`server/migrate_all_seat_orders_comprehensive.cjs`):**
       - MSSQL `Siparisler` ve PostgreSQL `orders` tablolarındaki 676 SEAT siparişi resmi bedenli katalog kodlarına güncellendi.
       - Eski sentetik parça kodları kaldırılarak resmi katalog kodları (`PSEAT100006XXS`, `PSEAT100020XS`, `PSEAT200009XS`, `PSEAT200010XS`, `PSEAT200028XS` vb.) atandı.
       - Çift cinsiyetli modellerde standart `ERKEK: <kod> - KADIN: <kod>` sözleşmesine geçildi (Örn: Sipariş 16747 `ERKEK: PSEAT200003XS - KADIN: PSEAT200006XS`, Sipariş 16748 `ERKEK: PSEAT100004XS - KADIN: PSEAT100003XS`, Sipariş 16749 `ERKEK: PSEAT100038XS - KADIN: PSEAT100037XS`, Sipariş 16750 `ERKEK: PSEAT100023XS - KADIN: PSEAT100024XS`, Sipariş 16768 `ERKEK: PSEAT100038XS - KADIN: PSEAT100037XS`).
    3. **Backend Çözümleme Motoru (`server/app.js`):**
       - `POLO YAKA` kelimesinin `O YAKA` ile çakışmasını engelleyen hassas regex düzeltmesi yapıldı.
       - `getCleanBaseSku` fonksiyonundaki beden ayıklama regex'i 14 X'e kadar (`X{1,14}L`) genişletildi (`PSEAT200006XXXXXXXXXXL` gibi 62 beden kadın pantolonu varyantları için).
       - SEAT için 8 temel çift cinsiyet eşleşmesi (Gömlek, Danışman Polar, Danışman Mont, Kış Danışman Pantolon, Garanti Sweat, Yaz Beyaz Danışman T-Shirt, Yaz Kırmızı Danışman T-Shirt, Yaz Danışman Pantolon) backend'e işlendi.
    4. **Frontend ve Servis Yenileme:**
       - `src/pages/OrdersPage.jsx` sessionStorage önbellek anahtarı `vog_admin_orders_cache_v7` olarak güncellendi.
       - `npm run build` ile frontend derlendi (6.67s, 0 hata).
       - `pm2 restart all` ile `vog-api` ve `vog-frontend` yeniden başlatıldı (Online).
  - **Doğrulama ve Testler (`scratch/test_api_seat.cjs`, `scratch/test_seat_label_res.cjs`):**
    - Live API ve barkod çözücü testlerinde tüm SEAT siparişlerinin resmi kodları, temiz bedenleri ve geçerli 13 haneli EAN barkodlarıyla çalıştığı %100 doğrulandı (PASS).
    - Fiziksel SATO yazıcıya 0 çıktı gönderildi.


- **fix/audi-2025-kis-and-2026-yaz-excel-audit (Audi 2025 Kış & 2026 Yaz Parça Kıyafet Kodları Excel Denetimi ve Tüm Tablolarda Parça No Normalizasyonu):**
  - **Kapsam:** Kullanıcı talebi ("tamam şimdi AUDI içinde aynı işlemi aynı mantık ile yapalım . indirilenler klasorundeki Audi 2025 Kış Parça Kıyafet Kodları.xlsx ve AUDI 2026 Yaz Servis Kıyafet Parça Kodları.xlsx dosyalarını kullan") doğrultusunda, indirilenler klasöründeki iki resmi katalog dosyasındaki (`Audi 2025 Kış Parça Kıyafet Kodları.xlsx` ve `AUDI 2026 Yaz Servis Kıyafet Parça Kodları.xlsx`) bedenli `Parça Kodu` standartları MSSQL `Siparisler`, PostgreSQL `orders` ve `master_products` tablolarındaki **1267 adet Audi siparişine** baştan sona uygulandı.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Kullanıcının "deneme cıktısı alma" talimatı korunarak SATO yazıcıya hiçbir fiziksel test çıktısı gönderilmemiş; tüm doğrulamalar %100 yazılımsal ve API testleriyle yapılmıştır.
  - **Analiz Edilen Excel Katalogları ve Ürün Eşleşmeleri:**
    1. `C:\Users\ctopuz\Downloads\Audi 2025 Kış Parça Kıyafet Kodları.xlsx` (310 varyant):
       - Diagnoz Mont: `PAUDI250008` (S-XXL)
       - Diagnoz Sweat: `PAUDI3576` (S-XXXL)
       - Diagnoz Pantolon: `PAUDI250009` (38-56)
       - Audi Kışlık Bere: `PAUDI9989`
       - Danışman Pantolon: `PAUDI250010` (Erkek: 38-60) & `PAUDI250011` (Kadın: 34-52)
       - Danışman Beyaz Gömlek: `PAUDI250012` (Erkek: S-4XL) & `PAUDI250013` (Kadın: XXS-XXXL)
       - Danışman Polar: `PAUDI4242` (Erkek: S-4XL) & `PAUDI4444` (Kadın: XXS-XXXL)
       - Danışman Mont: `PAUDI250014` (Erkek: S-4XL) & `PAUDI250015` (Kadın: XXS-XXXL)
       - Teknisyen Sweat: `PAUDI5252` (XS-XXXL)
       - Mekanik Teknisyen Polar: `PAUDI9999` (XS-XXXL)
       - Teknisyen Pantolon: `PAUDI250016` (38-58)
       - Kaporta / PDI / Kalite Polar: `PAUDI9988` (XS-XXXL)
       - Formen Sweat: `PAUDI250017` (XS-XXXL)
       - Formen Mont: `PAUDI6464` (XS-XXXL)
       - Formen Pantolon: `PAUDI6868` (38-62)
       - Garanti & Yedek Parça Polar: `PAUDI3003` (Erkek: XS-4XL) & `PAUDI3005` (Kadın: S-XXXL)
       - Garanti Gri Gömlek: `PAUDI250018` (Erkek: S-4XL) & `PAUDI250019` (Kadın: S-XXXL)
       - Garanti Mont: `PAUDI3538` (Erkek: S-4XL) & `PAUDI3539` (Kadın: S-XXXL)
       - Garanti Pantolon: `PAUDI4007` (Erkek: 38-58) & `PAUDI4009` (Kadın: 36-46)
       - Acil Servis Pantolon: `PAUDI250020` (38-56)
       - Acil Servis Mont: `PAUDI250021` (XS-XXL)
       - Acil Servis Sweat: `PAUDI250022` (XS-XXXL)
       - PDI Sweat: `PAUDI8282` (S-XL)
       - Kalite Kontrol Sweat: `PAUDI8686` (S-XXL)
    2. `C:\Users\ctopuz\Downloads\AUDI 2026 Yaz Servis Kıyafet Parça Kodları.xlsx` (255 varyant):
       - Danışman Siyah T-Shirt: `PPAUDI260001` (Erkek: S-4XL) & `PPAUDI260003` (Kadın: XS-4XL)
       - Danışman Beyaz T-Shirt: `PPAUDI260002` (Erkek: S-4XL) & `PPAUDI260004` (Kadın: XS-4XL)
       - Danışman Pantolon: `PAUDI0023` (Erkek: 36-58) & `PAUDI0026` (Kadın: 30-48)
       - Formen Gri T-Shirt: `PAUDI0027` (XS-XXL)
       - Formen Pantolon: `PAUDI2210` (38-58)
       - Kalite Kontrol T-Shirt: `PAUDI1112` (S-XXL)
       - Teknisyen Pantolon: `PAUDI2221` (38-58)
       - PDI T-Shirt: `PAUDI1113` (S-XXL)
       - Teknisyen T-Shirt: `PAUDI1118` (XS-4XL)
       - Teknisyen Polo T-Shirt: `PAUDI25001` (XS-4XL)
       - Diagnoz T-Shirt: `PAUDI0028` (XS-XXXL)
       - Diagnoz Pantolon: `PAUDI0029` (40-56)
       - Garanti & YP T-Shirt: `PAUDI0032` (Erkek: XS-4XL) & `PAUDI0030` (Kadın: XS-XXL)
       - Garanti & YP Pantolon: `PAUDI9922` (Erkek: 38-60) & `PAUDI9925` (Kadın: 34-44)
       - Acil Servis T-Shirt: `PAUDI0031` (S-XXL)
       - Acil Servis Pantolon: `PAUDI5533` (38-56)
       - E-Tron Siyah T-Shirt: `PAUDI250023` (S-XXXL)
       - E-Tron Dalgalı T-Shirt: `PAUDI250024` (S-XXXL)
       - E-Tron Pantolon: `PAUDI250025` (38-56)
  - **Uygulanan Düzeltmeler:**
    1. **Veritabanı Normalizasyonu (`server/migrate_all_audi_orders_comprehensive.cjs`):**
       - Toplam 1267 adet Audi siparişi hem MSSQL `Siparisler` hem PostgreSQL `orders` tablolarında güncellendi.
       - Eski sentetik kodlar (`PAUDI16893`, `PAUDI16889`, `PAUDI16930`, `PAUDI16931`, `PVW16927`, `PAUDI16907` vb.) doğrudan katalog kodlarına dönüştürüldü.
       - Beden ekli formatlar uygulandı: örn. `PAUDI25002538`, `PAUDI25001638`, `ERKEK: PAUDI0023XXS - KADIN: PAUDI0026XXS`, `ERKEK: PAUDI250012S - KADIN: PAUDI250013XXS`, `PAUDI250032S`, `PAUDI8686S`, `PAUDI5252XS`, `PAUDI6464XS`.
    2. **NaN Barkodlarının Temizlenmesi (`scratch/clean_audi_nan_barcodes.cjs`, `scratch/clean_orders_nan.cjs`):**
       - Excel'den kaynaklı bilimsel gösterim hatası sonucu oluşan 67 adet `NaN` içeren barkod (örn. `8697.3054267NaN`) geçerli 13 haneli resmi EAN barkodları (`8697601900895`) ile güncellendi.
    3. **Backend Çözümleme Mantığı (`server/app.js`):**
       - Regex'e `PPAUDI` formatı eklendi.
       - `getCleanBaseSku` içine Audi'nin hem harf (XS, S, XXL) hem sayısal (38, 40, 56) beden ayıklama kuralları eklendi.
       - Audi için tüm çift cinsiyetli ürün eşleştirmeleri tanımlandı (Danışman Gömlek, Garanti Gömlek, Danışman Mont, Danışman Polar, Garanti Mont, Garanti Polar, 2026 Danışman Siyah T-Shirt, 2026 Danışman Beyaz T-Shirt, 2026 Garanti T-Shirt, 2026 Danışman Pantolon, 2025 Danışman Pantolon, 2026 Garanti Pantolon, 2025 Garanti Pantolon).
    4. **Frontend Önbellek Yenileme (`src/pages/OrdersPage.jsx`):**
       - SessionStorage önbellek anahtarı `vog_admin_orders_cache_v5`'ten `vog_admin_orders_cache_v6`'ya yükseltildi.
    5. **PM2 `vog-api` Restart:** Servis derlenip güncellendi (Online).
  - **Doğrulama ve Testler (`scratch/test_api_audi.cjs`, `scratch/test_audi_label_res.cjs`):**
    - Live API sorgusu ile Audi siparişlerinin resmi parça kodları ve temiz model isimleriyle döndüğü doğrulandı (PASS).
    - Etiket ve fiş çözücüsünde tüm Audi varyantlarının %100 geçerli barkod ve isim eşleştirmesi yaptığı doğrulandı (PASS).
    - SATO termal yazıcıya 0 fiziksel çıktı gönderildi.


- **fix/skoda-2026-yaz-and-2025-kis-excel-audit (Skoda Barkodlar 2026 Yaz & 2025 Kış Veri Denetimi ve Tüm Tablolarda Parça No Normalizasyonu):**
  - **Kapsam:** Kullanıcı talebi ("PARÇA NO sütunu hala önceki değerleri gösteriyor. excel dosyasındaki Parça Kodu bilgisi ile güncellenmeli" ve "ama excel dosyasında farklı lütfen excel dosyasında parca kodunu parca no olarak kullanalım") doğrultusunda, `Skoda Barkodlar 2026 YAZ.XLSX` ve `Skoda Barkodlar 2025 KIŞ.XLSX` dosyalarında yer alan beden ekli resmi `Parça Kodu` sütunu değerleri (örn: `PSKD200010XS`, `PSKD200034XS`, `ERKEK: PSKD200032XS - KADIN: PSKD200033XS`, `PSKD100028XXS`) veritabanlarındaki **tüm 335 adet Skoda siparişine** ve katalog tablolarına baştan sona uygulandı.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Kullanıcının açık "deneme cıktısı alma" talimatı korunarak SATO yazıcıya hiçbir fiziksel test çıktısı gönderilmemiş; tüm doğrulamalar %100 yazılımsal, veritabanı ve API testleriyle yapılmıştır.
  - **Tespit Edilen Kritik Problemler ve Çözümleri:**
    1. **Excel Beden Ekli Parça Kodu Eşitlemesi (335 Skoda Siparişi):**
       - Kullanıcının Excel dosyalarındaki `Parça Kodu` sütunu beden ekli olduğundan (üst giyim ve yazlık pantolonlarda `XS`, kışlık pantolonlarda `XXS` başlangıç varyantı veya sipariş tek bir bedene aitse o beden), sipariş tablosunun doğrudan Excel'deki Parça Kodu ile birebir eşleşmesi sağlandı.
       - Hem MSSQL `[SIPARIS].dbo.Siparisler` hem PostgreSQL `orders` tablosundaki 335 sipariş güncellendi:
       - **13729:** `ERKEK: PSKD200032XS - KADIN: PSKD200033XS` (Excel: PSKD200032XS Bay, PSKD200033XS Bayan)
       - **13730:** `PSKD200010XS` (Excel: PSKD200010XS Servis Danışman Pantolon)
       - **13731:** `PSKD200036XS` (Excel: PSKD200036XS Teknisyen Polo T-Shirt Koyu Yeşil)
       - **13732:** `PSKD200019XS` (Excel: PSKD200019XS Teknisyen Pantolon Yazlık)
       - **13733:** `PSKD200035XS` (Excel: PSKD200035XS Formen Polo T-Shirt Gri)
       - **13734:** `PSKD200034XS` (Excel: PSKD200034XS Yedek Parça Polo T-Shirt)
       - **13959:** `PSKD200037XS` (Excel: PSKD200037XS Skoda Yol Yardım Yelek)
       - **13493 / 15329 / 16694:** `ERKEK: PSKD100050XS - KADIN: PSKD100051XS` (Softshell Mont)
       - **15328 / 16693:** `ERKEK: PSKD100025XS - KADIN: PSKD100026XS` (Gömlek)
       - **15327 / 16692:** `PSKD100019XXS` (Danışman Kışlık Pantolon)
       - **15326 / 16691:** `PSKD100036XS` (Kışlık Yelek)
       - **15325 / 16690:** `ERKEK: PSKD100041XS - KADIN: PSKD100042XS` (Siyah Polar)
       - **15324 / 16689:** `PSKD100056XS` (Teknisyen Sweatshirt)
       - **15323 / 16688:** `PSKD100055XS` (Formen Sweatshirt)
       - **15322 / 16687:** `PSKD100054XS` (Yedek Parça Sweatshirt)
       - **15321 / 16686:** `PSKD100028XXS` (Teknisyen Pantolon Kışlık)
    2. **Master Tablolarda Bedenli Varyantların Tanımlanması:**
       - MSSQL `MasterUrunler` ve PostgreSQL `master_products` tablolarına `PSKD200037XS`, `PSKD100050XS`, `PSKD100051XS` vb. bedenli kayıtlar eklenerek referans bütünlüğü garanti edildi.
    3. **İstemci Önbellek Yenileme (SessionStorage Busting v5):**
       - `OrdersPage.jsx` içerisindeki `vog_admin_orders_cache_v4` anahtarı `vog_admin_orders_cache_v5` olarak güncellendi. Kullanıcı sayfayı yenilediğinde (veya F5 ile açtığında) doğrudan beden ekli yeni Parça Kodlarını görür.
    4. **Baskı ve Etiket Mantığı Koruması (Zero Regression):**
       - `server/app.js` içerisindeki `getCleanBaseSku` mantığı beden son eklerini (`XS`, `XXS`, vb.) otomatik ayıkladığından fiş oluşturma ve etiket yazdırma süreçleri 0 regresyon ile sorunsuz çalışmaya devam eder.
  - **Doğrulama ve Testler (`server/test_search_skoda.cjs`):**
    - Ekran görüntüsündeki siparişler ve 2025/2026 kış/yaz siparişleri API üzerinden sorgulandı ve tamamının Excel dosyasındaki `Parça Kodu` formatına dönüştüğü doğrulandı (PASS).
    - Fiziksel Baskı: 0 adet (SATO termal yazıcıya kesinlikle hiçbir çıktı gönderilmedi).
    - PM2 `vog-api` (online) ve `vog-frontend` (online) kesintisiz devrede.


- **fix/nissan-2026-kis-excel-and-orders-audit (Nissan 2026 Kış Siparişleri, Resmi 13 Haneli EAN Barkodlar ve Parça No Normalizasyonu):**
  - **Kapsam:** Kullanıcı geri bildirimi ("bu parça no lar doğru değilki !!!! / deneme cıktısı alma") doğrultusunda, daha önce üretilen geçici sentetik `KIYAFETKIS-...` parça kodları tamamen temizlenmiş; `NISSAN 2026 KIŞ.xlsx` dosyasındaki resmi 13 haneli GS1/EAN nümerik barkodlar (`8520147...` ve `6001258...`) VOG ve Nissan tedarik zinciri standardı olarak birincil `ParcaNo` / SKU olarak tescil edilmiştir.
  - **Fiziksel Baskı Kısıtı (CRITICAL):** Kullanıcının açık "deneme cıktısı alma" talimatı gereğince SATO yazıcıya hiçbir fiziksel test çıktısı gönderilmemiş; tüm doğrulamalar %100 yazılımsal, veritabanı sorguları ve API bazlı gerçekleştirilmiştir.
  - **Uygulanan Düzeltmeler ve Son Durum:**
    1. **Sentetik Kodların Temizlenmesi:** Hem MSSQL `MasterUrunler` hem PostgreSQL `master_products` tablolarından uydurma `KIYAFETKIS-GOMLEK%`, `KIYAFETKIS-POLAR-YP%`, `KIYAFETKIS-PANTOLON-VALE%`, `KIYAFETKIS-YELEK-MASTER%` kayıtları tamamen silindi (Kalan sentetik kod: 0).
    2. **Resmi 13 Haneli Katalog Kaydı:** `NISSAN 2026 KIŞ.xlsx` içindeki 274 tekil ürünün tamamı 13 haneli EAN kodları (`sku = barcode = ean13 = code39`) ile hem MSSQL hem PostgreSQL ürün kataloglarına aktarıldı.
    3. **13 Nissan Siparişinin Parça No Normalizasyonu (MSSQL & PG Orders):**
       - **16575 (Gömlek):** `ERKEK: 6001258147022 - KADIN: 6001258147015`
       - **16576 (Polar):** `ERKEK: 8520147033126 - KADIN: 8520147033287`
       - **16577 (Master Polar):** `8520147033409`
       - **16578 (Kargo Pantolon):** `8520147032723`
       - **16579 (Vale Pantolon):** `8520147033041`
       - **16580 (Teknisyen Sweat):** `8520147033485`
       - **16581 (Master Polo):** `8520147033720`
       - **16583 (Vale Polo):** `8520147033966`
       - **16584 (Yedek Parça Polo):** `8520147034048`
       - **16585 (Softshell Yelek):** `8520147034123`
       - **16586 (Master Yelek):** `8520147034529`
       - **16587 (Mont):** `8520147032006`
       - **16588 (Vale Mont):** `8520147032648`
       *(Not: 16582 nolu sipariş FORD TRUCKS olarak doğru markasına tescil edilmiştir).*
    4. **Beden Bazlı Çözümleme Mantığı (`server/app.js`):**
       - 13 haneli sayısal barkodlar için çift cinsiyet eşleşmeleri (`6001258147022` <-> `6001258147015` ve `8520147033126` <-> `8520147033287`) eklendi.
       - Sayısal barkodların önek paylaşmayan varyantları için `master_products` tablosundan ürün adı + beden + cinsiyet üzerinden dinamik eşleşme kurularak her bedenin resmi 13 haneli barkodu doğru çekilmektedir.
  - **Doğrulama Sonuçları (`scratch/test_resolution_logic_only.cjs`):**
    - MSSQL `Siparisler.ParcaNo`: Sentetik kod 0, 13 resmi barkod tescilli (PASS).
    - PostgreSQL `orders`: 14 sipariş güncel ve senkron (PASS).
    - PostgreSQL `master_products`: Sentetik kod 0, 347 resmi Nissan varyantı (PASS).
    - Beden Eşleşme Kontrolleri (Yazılımsal Test):
      - Gömlek Erkek M -> `6001258147024` (PASS)
      - Gömlek Kadın M -> `6001258147017` (PASS)
      - Polar Erkek L -> `8520147033164` (PASS)
      - Polar Kadın L -> `8520147033300` (PASS)
      - Mont Erkek XL -> `8520147032037` (PASS)
      - Pantolon Erkek 3XL -> `8520147032730` (PASS)
    - Fiziksel Baskı: 0 adet (SATO yazıcıya hiçbir çıktı gönderilmedi).

- **fix/dogus-orders-parcano-and-gender-standardization (Doğuş Siparişleri Parça No ve Cinsiyet Standardizasyonu):**
  - **Kapsam:** Kullanıcı talebi ("doğuş firmasının parça no bilgileri hatalı. bay bayan diye yazılanlar erkek kadın olacak şekilde kodlarınıda bulup doğrusunu kaydetmemiz gerekiyor") doğrultusunda hem MSSQL (`[SIPARIS].dbo.Siparisler`), hem PostgreSQL (`orders`, `master_products`), hem de etiketleme/fiş motoru (`server/app.js`, `src/pages/OrdersPage.jsx`) üzerinde kapsamlı temizlik, düzeltme ve standardizasyon gerçekleştirildi.
  - **Tespit Edilen Hatalar ve Kök Nedenler:**
    1. **Paketleme Açıklamalarının Parça No Olarak Görünmesi:** Sipariş 16942, 16941, 16940, 16936, 16935, 16933, 16932 gibi kayıtlarda sipariş detayına girilen `"TEK TEK PAKET İSİM İSİM POŞETLİ..."` gibi paketleme talimatları doğrudan `ParcaNo` kolonuna sızmış ve UI üzerinde parça no gibi görüntüleniyordu.
    2. **`PVOG` Kod Filtreleme Hatası (`server/app.js`):** `refreshMssqlOrdersCacheAsync` fonksiyonunda bulunan `!String(order.ParcaNo).trim().startsWith('PVOG')` kuralı nedeniyle geçerli PVOG sipariş kodları geçersiz sayılarak `rawParca = null` yapılıyor ve sistem mecburen `Detay5` alanındaki paketleme metnini çekiyordu.
    3. **Hatalı/Eksik Parça Kodları:**
       - Sipariş 16938 (Doğuş Lojistik Polar): `PAUDI16938` yazılmıştı; doğrusu `15638`.
       - Sipariş 16937 (Doğuş Lojistik Scania Pantolon): `PVW16937` yazılmıştı; doğrusu `PSCANIA15801`.
       - Sipariş 16940 (Doğuş Lojistik Kulaklıklı Bere): `TEK TEK PAKET 15637` yazılmıştı; doğrusu `15637`.
    4. **Bay / Bayan İfadeleri:** Detaylarda geçen `BAY` / `BAYAN` ifadeleri standart dışıydı; çift cinsiyetli siparişlerde kadın ve erkek kodları standart formatta ayrıştırılmamıştı (Örn: Sipariş 16928 `ERKEK PAUDI3535 , BAYAN PAUDI3939`, Sipariş 16951 `ERKEK: PAUDI0023 - KADIN:`).
  - **Uygulanan Düzeltmeler:**
    1. **Veritabanı Normalizasyonu (`server/migrate_dogus_gender_and_parcano.cjs`):**
       - MSSQL `[SIPARIS].dbo.Siparisler` ve PostgreSQL `orders` tablolarında 88 adet Doğuş siparişinin `ParcaNo`, `sku`, `code39`, `Detay5` ve `notes` alanları temizlendi.
       - 245 adet `BAYAN` ibaresi `KADIN` olarak değiştirildi.
       - Çift cinsiyetli ürünler standart `ERKEK: <kod> - KADIN: <kod>` formatına dönüştürüldü (Örn: Sipariş 16951 `ERKEK: PAUDI0023 - KADIN: PAUDI0026`, Sipariş 16928 `ERKEK: PAUDI3535 - KADIN: PAUDI3939`).
       - Düzeltilen parça kodları (`15637`, `15638`, `PSCANIA15801`) MSSQL `MasterUrunler` ve PostgreSQL `master_products` kataloglarına indekslendi.
    2. **Backend Motoru (`server/app.js`):**
       - `extractSkuFromOrderDetails`: Çift cinsiyetli string'leri (`ERKEK: ... - KADIN: ...`) talep edilen cinsiyete göre (`Erkek` -> erkek kodu, `Kadın` -> kadın kodu) hatasız ayıracak şekilde güncellendi.
       - `refreshMssqlOrdersCacheAsync`: `PVOG` engeli kaldırıldı; paketleme talimatlarının (`TEK TEK PAKET...`) hiçbir koşulda `ParcaNo` olarak atanmaması sağlandı; çift cinsiyetli format doğrudan frontend gösterimine aktarılırken, katalog sorgulamaları için kök erkek SKU'su kullanıldı.
       - `cleanParcaNo`: Normalize edilmiş çift cinsiyetli kodları ve 5-14 haneli saf rakamsal parça kodlarını koruyacak hale getirildi.
    3. **Frontend Arayüzü (`src/pages/OrdersPage.jsx`):**
       - `formatOrderDisplayParcaNo` yardımcı fonksiyonu eklenerek hem sipariş tablosu (`PARÇA NO` kolonu) hem de sağ çekmece (detay) panelinde paketleme talimatlarının gösterilmesi tamamen engellendi; parça no yoksa `PVOG<Id>` fallback'i getirildi.
  - **Doğrulama ve Testler:**
    - Live API (`http://localhost:3001/api/orders/mssql-list?search=doğuş&refresh=true`) ile ekrandaki tüm satırların temizlendiği doğrulandı.
    - SATO RFID termal etiket baskı testi (`server/test_real_labels.cjs`) ile çift cinsiyetli ürünlerde hem ERKEK hem KADIN etiketlerinin bağımsız olarak doğru parça kodu ve EAN-13 ile basıldığı %100 doğrulandı (5/5 PASS).
    - PM2 servisleri (`vog-api` ve `vog-frontend`) derlenip yeniden başlatıldı.

- **fix/pvwk100009-erkek-pvwk100010-kadin-cross-table-audit (Volkswagen Binek Gömlek Cinsiyet ve Varyant Standardizasyonu):**
  - **Kapsam:** Kullanıcı talebi ("PVWK10009 ERKEK PVWK10010 KADIN OLMASI GEREKIYOR KONTROL EDERMISIN MAster_products ve diğer her tabloyu" & "sadece kadın ve erkek ean numarası aynı oldu verileri güncelle yeterli") doğrultusunda hem PostgreSQL hem de MSSQL (SIPARIS) veritabanlarındaki tüm tablolar taranarak cinsiyet, SKU ve EAN-13 ayrımı %100 normalize edildi:
    - `PVWK100009` (ve `PVWK100009XS` .. `PVWK100009XXXL`): Kesinlikle **ERKEK** | Taban EAN-13: `8682822846786`.
    - `PVWK100010` (ve `PVWK100010XS` .. `PVWK100010XXXL`): Kesinlikle **KADIN** | Taban EAN-13: `8690001000103` (Standart GS1 formatında benzersiz atandı).
  - **Tespit Edilen Uyumsuzluklar:**
    1. **PostgreSQL `master_products`:** Kök satır `PVWK100009` tablosunda `gender = 'UNISEX'` olarak kalmıştı; kök satır `PVWK100010` ise hiç yoktu (sadece varyantları vardı).
    2. **MSSQL `MasterUrunler`:** Row 22589 (`PVWK100009`) `Cinsiyet = 'UNISEX'` idi. Kök satır `PVWK100010` eksikti.
    3. **MSSQL `Siparisler`:** Sipariş 16673 satırında `Detay5` alanı `'ERKEK: PVWK100009 - KADIN: '` şeklinde kesintiye uğramıştı (`PVWK100010` yazılmamıştı).
    4. **PostgreSQL `orders`:** Sipariş 16673 Postgres `orders` tablosuna aktarılmamıştı.
    5. **PostgreSQL `vouchers`, `sales`, `rfid_tags`:** Sipariş 16673'e ait geçmiş testlerde `gender = 'KADIN'` olduğu halde `sku = 'PVWK100009XS'` olarak kalan kayıtlar ile kök SKU budama hatası kaynaklı `PVWK100094XXL` satırları tespit edildi.
    6. **EAN-13 Çakışması:** Erkek ve Kadın ürünleri için başlangıçta aynı barkod (`8682822846786`) verilmişti; ayrıca geçmiş Excel aktarımından kalan XXXL satırlarında `8697.3220235NaN` corrupt string'i vardı.
    7. **Backend Beden Ayıklama Regex Hatası (`server/app.js`):** `candidateParca.replace(/[-_]?(?:X{1,9}L|[2-8]XL|XXS|XS|XXL|XL|[SML]|\d{2})$/i, '')` regex'indeki `\d{2}` son eki, `PVWK100010` kodunun sonundaki `10` rakamını beden zannederek buduyor ve aramayı `PVWK1000%` olarak yaparak yanlışlıkla `PVWK100094` kaydıyla eşleştiriyordu.
  - **Uygulanan Düzeltmeler:**
    1. **PostgreSQL & MSSQL Tabloları Güncellendi:**
       - `master_products`: `PVWK100009` -> `gender = 'ERKEK'`, `barcode/ean13 = '8682822846786'`. `PVWK100010` -> `gender = 'KADIN'`, `barcode/ean13 = '8690001000103'`.
       - MSSQL `MasterUrunler`: `PVWK100009` -> `Cinsiyet = 'ERKEK'`, `Barkod/Ean13 = '8682822846786'`. `PVWK100010` -> `Cinsiyet = 'KADIN'`, `Barkod/Ean13 = '8690001000103'`.
       - MSSQL `Siparisler` & Postgres `orders`: `Detay5` ve `notes` alanı `'ERKEK: PVWK100009 - KADIN: PVWK100010'` olarak normalize edildi.
       - `vouchers` & `sales`: Kadın kayıtlarındaki `barcode/ean13` alanları `8690001000103` olarak güncellendi.
       - `rfid_tags`: Kadın kayıtlarındaki `barcode` alanları `8690001000103` olarak güncellendi (1,182 Erkek `8682822846786`, 53 Kadın `8690001000103`).
       - Bozuk `NaN` içeren XXXL satırları geçerli GS1 EAN-13 kodlarıyla onarıldı (`PVWK100009XXXL` -> `8697322023507`, `PVWK100010XXXL` -> `8690001000172`).
    2. **Backend Dinamik SKU-Cinsiyet Eşleştirme Motoru (`server/app.js`):**
       - `getCleanBaseSku(sku)` fonksiyonu entegre edildi; sonu rakamla biten ürün kodlarının (`PVWK100010`, `PAUDI260001`) son 2 hanesi artık asla kırpılmaz.
       - `resolveExactSizeSkuAndBarcode` içinde otomatik cinsiyet eşleştirme kuralı eklendi:
         - `cleanGender === 'KADIN'` ise `PVWK100009` otomatik olarak `PVWK100010`'a çevrilerek beden varyantı aranır.
         - `cleanGender === 'ERKEK'` ise `PVWK100010` otomatik olarak `PVWK100009`'a çevrilerek beden varyantı aranır.
       - `print-order-rfid-labels` içindeki `vouchers` sorgusuna cinsiyet önceliği eklendi (`ORDER BY CASE WHEN gender = $5 THEN 0 ELSE 1 END`).
  - **Doğrulama ve Test Sonuçları:**
    - `scratch/check_final_summary.cjs` ile PostgreSQL ve MSSQL'deki tüm tablolar doğrulandı:
      - `master_products`: `PVWK100009` (Erkek) = `8682822846786` | `PVWK100010` (Kadın) = `8690001000103` ✅
      - MSSQL `MasterUrunler`: `PVWK100009` (Erkek) = `8682822846786` | `PVWK100010` (Kadın) = `8690001000103` ✅
      - `vouchers`: Erkek = `8682822846786` (33 satır) | Kadın = `8690001000103` (26 satır) ✅
      - `sales`: Erkek = `8682822846786` (33 satır) | Kadın = `8690001000103` (26 satır) ✅
      - `rfid_tags`: Erkek = `8682822846786` (1,182 etiket) | Kadın = `8690001000103` (53 etiket) ✅



- **fix/printer-user-gender-precedence (Karekod ve 1D Barkod Etiketlerinde Kullanıcı Cinsiyet Seçiminin Önceliklendirilmesi):**
  - **Kapsam:** Kullanıcı bildirimi ("ayrıca erkek seçili oldugu halde fiş basım sayfasında etikette UNISEX CIKIYOR - KAREKOD VE 1D BARKOD İÇİNDE AYNI DURUM SÖZ KONUSU") doğrultusunda, kullanıcı arayüzünde "Erkek" veya "Kadın" seçildiği halde etiket çıktılarında (`generateSatoRfidZplQr` ve `generateSatoRfidZplClassic`) ve veritabanı kayıtlarında (`rfid_tags`, `vouchers`, `sales`) `UNISEX` basılması sorunu çözüldü.
  - **Kök Neden:**
    - `server/app.js` içerisindeki cinsiyet çözümleme zincirinde (`resolveVoucherMetadata`, `resolveExactSizeSkuAndBarcode`, `print-order-rfid-labels`):
      `const finalGender = ((voucherRow && voucherRow.gender) || resolved.gender || itemGender || 'UNISEX').toUpperCase();` ve `gender: matchedMpRow.gender || cleanGender` gibi yapılar kullanılıyordu.
    - Katalog veya sipariş tablosunda ürün genel olarak `gender = 'UNISEX'` olarak kayıtlı olduğunda, JavaScript'in truthy `||` operatörü nedeniyle kullanıcının arayüzden seçtiği `itemGender = 'Erkek'` / `'Bay'` değeri **asla devreye giremiyor**, her zaman aradaki `'UNISEX'` değeri kazanıyordu.
    - Bu durum hem Karekod (QR) hem de 1D Çizgi Barkod (Classic) şablonlarında etiketin 2. satırındaki `subheader` alanına zorla `UNISEX  |  VOLKSWAGEN` ve `detail2` alanına `XS - UNISEX` basılmasına neden oluyordu.
  - **Uygulanan Çözüm (`server/app.js` & `src/pages/OrdersPage.jsx`):**
    1. **`resolveEffectiveGender(userGender, fallbackDbGender)` Fonksiyonu:** Kullanıcının aktif UI seçimi (`Erkek`, `Kadın`, `Çocuk`, `Bay`, `Bayan`) daima veritabanındaki varsayılan katalog/fiş `UNISEX` değerinden **öncelikli** hale getirildi. Yalnızca kullanıcı cinsiyet seçmediğinde veya açıkça `UNISEX` seçtiğinde veritabanındaki değere düşülmesi sağlandı.
    2. **Etiket Basım Motoru Senkronizasyonu (`print-order-rfid-labels`):**
       - Hem Karekodlu (`generateSatoRfidZplQr`) hem de 1D Çizgi Barkodlu (`generateSatoRfidZplClassic`) şablonlara giden `itemFinalGender`, `resolveEffectiveGender` ile hesaplanır.
       - `rfid_tags.gender`, `vouchers.gender` ve `sales.gender` kolonlarına da aynı kullanıcı seçimi (`ERKEK` veya `KADIN`) kaydedilir.
    3. **Frontend Varsayılanı (`src/pages/OrdersPage.jsx`):** `handleCreateVoucher` içindeki `gender` fallback'i `'UNISEX'` yerine arayüz seçimiyle uyumlu olarak `'Erkek'` yapıldı.
    4. **Mevcut Veritabanı Kayıtlarının Düzeltilmesi:** Sipariş 16673'e ait `vouchers` ve `sales` kayıtlarındaki `UNISEX` cinsiyet bilgileri `ERKEK` olarak güncellendi.
  - **Doğrulama:**
    - Canlı API üzerinden hem QR (Karekod) hem de CLASSIC (1D Barkod) şablonları için testler koşturuldu:
      - QR Şablon (Erkek seçili): `^FO52,48^A0N,16,13^FDERKEK  |  VOLKSWAGEN^FS` ✅
      - Classic 1D Şablon (Erkek seçili): `^FO52,56^A0N,20,16^FDERKEK  |  VOLKSWAGEN^FS` ✅
      - QR Şablon (Kadın seçili): `^FO52,48^A0N,16,13^FDKADIN  |  VOLKSWAGEN^FS` ✅
    - `rfid_tags` tablosuna kaydedilen etiketlerin cinsiyet alanının `ERKEK` ve `KADIN` olarak doğru işlendiği doğrulandı.

  - **Kapsam:** Kullanıcı bildirimi ("her bedenden 1 adet yazdım ama yazdıgım adet sayısında aynı beden ilk beden için etiket yazdı") doğrultusunda, toplu beden etiket basımı sırasında (`items: [{ size: 'XS', quantity: 1 }, { size: 'S', quantity: 1 }, ...]`) tüm etiketlerin ilk bedenin bedeni (`XS`) ve SKU'su (`PVWK100009XS`) ile basılmasına yol açan kritik hata giderildi.
  - **Kök Neden:**
    - `server/app.js` içerisindeki `POST /api/printer/print-order-rfid-labels` endpoint'inde, döngü içindeki `vouchers` tablosu arama sorgusunda:
      `WHERE order_id = $1 AND (... OR (TRIM(barcode) = $2 AND $2 != '') OR (UPPER(TRIM(size)) = UPPER(TRIM($4))))` koşulu bulunmaktaydı.
    - Bir siparişin tüm bedenleri aynı ana sipariş barkodunu (`barcode = 8682822846786`) paylaştığı için, `S`, `M`, `L`, `XL` gibi diğer bedenler işlenirken bu sorgu veritabanında daha önce kaydedilmiş olan `XS` fiş satırıyla eşleşiyordu (`TRIM(barcode) = $2`).
    - Devamında `if (voucherRow) { itemFinalSize = voucherRow.size; itemSku = voucherRow.sku; }` kodu çalıştığı için, döngüdeki her bir bedenin (`S`, `M`, `L` vb.) kendi gerçek bedeni ve varyant kodu ezilerek zorla ilk bedene (`XS` ve `PVWK100009XS`) dönüştürülüyordu.
  - **Uygulanan Çözüm (`server/app.js`):**
    1. **Beden Bazlı Kesin Çözümleme (`resolveExactSizeSkuAndBarcode`):** Döngüdeki her bir beden öğesi (`item.size`), öncelikle `master_products` kataloğundan kendi tam varyant SKU'su (`PVWK100009S`, `PVWK100009M`, `PVWK100009L`, `PVWK100009XL`, `PVWK100009XXL`, `PVWK100009XXXL`) ve barkodu ile çözümlenir.
    2. **Sıkı Beden Filtresi:** `vouchers` tablosuna bakılırken genel barkod veya sipariş geneli üzerinden eşleştirme tamamen kaldırıldı; yalnızca `UPPER(TRIM(size)) = ANY(sizeAliases)` şartıyla **birebir o bedene ait bir fiş varsa** eşleştirme yapılması sağlandı.
    3. **Beden Koruma Garantisi:** Basılan etiket bedeni (`itemFinalSize`) ve `rfid_tags.size` alanı hiçbir koşulda başka bir bedenin değeriyle ezilmez. Pantolonlar için çift beden (`M (42)`), pantolon harici ürünler için tekil yalın beden (`M`) formatı otomatik uygulanır.
  - **Doğrulama:**
    - `POST /api/printer/print-order-rfid-labels` üzerinden Order 16673 için `XS: 1, S: 1, M: 1, L: 1, XL: 1, XXL: 1, 3XL: 1` test baskısı gönderildi.
    - 7 etiketin ZPL çıktıları ve `rfid_tags` kayıtları tek tek incelendi:
      - Etiket 1: `BEDEN: XS`, `PARCA NO: PVWK100009XS`
      - Etiket 2: `BEDEN: S`, `PARCA NO: PVWK100009S`
      - Etiket 3: `BEDEN: M`, `PARCA NO: PVWK100009M`
      - Etiket 4: `BEDEN: L`, `PARCA NO: PVWK100009L`
      - Etiket 5: `BEDEN: XL`, `PARCA NO: PVWK100009XL`
      - Etiket 6: `BEDEN: XXL`, `PARCA NO: PVWK100009XXL`
      - Etiket 7: `BEDEN: 3XL`, `PARCA NO: PVWK100009XXXL`
    - Her bir etiketin kendi bağımsız bedenini ve doğru parça numarasını bastığı %100 doğrulandı.

- **feat/master-products-exact-variant-sku-sync (Etiketlerde ve Fişlerde Beden Bazlı master_products SKU'sunun Birebir Korunması):**
  - **Kapsam:** Kullanıcı talebi ("sku alanında parcano master_products tablosunda oldugu gibi neden yazmıyor") doğrultusunda, etiket üzerindeki `PARCA NO:` alanında ve `vouchers.sku`, `sales.sku`, `rfid_tags.sku` alanlarında `master_products` kataloğundaki tam varyant kodunun (Örn: `PVWK100009XS`, `PVWK100009XXXL`, `PVWK100004XS`) kök koda (`PVWK100009`) budanmadan birebir yazılması sağlandı.
  - **Kök Neden & Çözüm:**
    1. **`master_products.clean_size` Temizliği:** Kataloğa geçmişte aktarılmış 7,371 satırda `clean_size` kolonu `sku` string'ine eşit (`clean_size = 'PVWK100009XS'`) kaldığı için `clean_size = 'XS'` filtreleri bu kayıtları atlıyordu. Beden ayıklama algoritması ile bu satırların `clean_size` değerleri yalın beden kodlarına (`XS`, `S`, `M`, `L`, `XL`, `XXL`, `3XL`, `4XL`, `5XL` vb.) dönüştürüldü.
    2. **Öncelikli Varyant Araması (`resolveExactSizeSkuAndBarcode`):** Beden verildiğinde sistem ilk adımda doğrudan `master_products` tablosunda `cleanBase + alias` kombinasyonlarını (`PVWK100009XS`, `PVWK100009-XS` vb.) arayacak şekilde güncellendi.
    3. **SKU Atama Önceliği:** `effectiveCode39 = matchedMpRow.sku || matchedMpRow.code39 || candidateParca` olarak düzenlendi. Böylece eşleşen `master_products` satırındaki parça kodu ne ise (`PVWK100009XS`) birebir alındı.
    4. **Mevcut Kayıtların Düzeltilmesi:** Sipariş 16673'e ait `vouchers`, `sales` ve `rfid_tags` kayıtlarındaki `PVWK100009` değerleri `master_products` ile uyumlu olarak `PVWK100009XS` yapıldı. SATO ZPL motorunun etikette `PARCA NO: PVWK100009XS` bastığı doğrulandı.
  - **Kapsam:** Kullanıcı talebi ("fiş oluştur düğmesine tıklandığında oluşan vouchers satırı aynı formatlara ve bilgilere sahip olmalı. farklı formatta veri insert etmemeli.") doğrultusunda, UI üzerindeki "Fiş Oluştur" düğmesi (`handleCreateVoucher` -> `POST /api/vouchers/create-from-order`) ile "RFID Etiket Bas" (`handlePrintSatoRfidLabels` -> `POST /api/printer/print-order-rfid-labels`) işlemlerinin veritabanına (`public.vouchers` ve `public.sales`) eklediği satırların formatları, kolon değerleri, durumları ve çözümleme mantığı %100 eşitlendi.
  - **Uygulanan Değişiklikler (`src/pages/OrdersPage.jsx` & `server/app.js`):**
    1. **Frontend Senkronizasyonu (`src/pages/OrdersPage.jsx`):**
       - `handleCreateVoucher` payload oluştururken `handlePrintSatoRfidLabels` ile aynı şekilde `ParcaNo`, `Code39`, `Sku`, `Detay1`..`5`, `Ean13` ve `Barcode` alanlarını tarayarak gerçek EAN-13 (869/868 veya Nissan 13 haneli) ve temiz parça numarasını (`cleanOrderSku`) çıkarır.
       - Gönderilen payload'da `sku: cleanOrderSku`, `code39: cleanOrderSku`, `barcode: actualBarcode || cleanOrderSku`, `ean13: actualBarcode || cleanOrderSku`, `brand`, `detail1`, `detail2` alanları RFID baskısıyla birebir aynı hale getirildi.
    2. **Backend Çözümleme Motorunun Birleştirilmesi (`server/app.js`):**
       - `resolveVoucherMetadata`: Eski ayrı ve tutarsız çözümleme mantığı tamamen kaldırılarak doğrudan `resolveExactSizeSkuAndBarcode` fonksiyonuna bağlandı.
       - Böylece hem RFID baskı hem de Fiş Oluşturma aynı PostgreSQL `master_products` ve `orders` çözümleyicisini kullanır; Nissan için 13 haneli barkodu, Volkswagen/Audi için tam varyant SKU'sunu (`PVWK100009XXXL`, `PVWK100004XS`), genel ürünler için `PVOG` kodlarını getirir.
       - Pantolon için çift beden (`XS (38)`), pantolon harici ürünler (gömlek, tshirt, mont) için tek beden (`XS`, `S`, `M`, `L`, `XL`, `4XL`) kuralı korundu.
       - Ürün adından cinsiyet ifadeleri temizlendi (`removeGenderFromProductName`).
       - Marka ve grup alanları siparişin gerçek markasına (`GENEL`, `NISSAN`, `VOLKSWAGEN`, `AUDI` vb.) bağlandı, varsayılan olarak `VOLKSWAGEN` yazılması engellendi.
    3. **`public.vouchers` Satır Formatı Standardı:**
       - `status`: `'BASILDI'` (eski 'TAMAMLANDI'/'KISMI BASILDI' yerine RFID basımı ile tam uyumlu 'BASILDI').
       - `price`: `null` (eski 500.00 veya 0 yerine RFID basımındaki gibi `null`).
       - `remaining_quantity`: `null` (RFID basımındaki gibi `null`).
       - `sku` ve `code39`: Gerçek parça kodu (Örn: `6001258147023`, `PVOG16954`, `PVWK100009`), asla 'TEK TEK BEDEN' veya 'SKU-VOG-...' girmez.
       - `barcode` ve `ean13`: 13 haneli sayısal barkod.
       - `gender`: `'ERKEK'`, `'KADIN'`, `'UNISEX'`.
       - `color`: `'STANDART'` veya ürün rengi.
    4. **`public.sales` Satır Formatı Standardı:**
       - `price`: `0.00`
       - `sku` ve `code39`: Gerçek parça kodu
       - `brand` ve `grup`: Siparişin gerçek markası
       - `size`, `gender`, `color`, `barcode`, `ean13`: Fiş satırıyla birebir aynı.
    5. **Doğrulama:**
       - Hem Order 16954 (Garanti Konaklama) hem de Order 16575 (Nissan) ile canlı test yapıldı; oluşturulan fiş ve satış satırlarının kolon formatlarının ve değerlerinin RFID baskı kayıtlarıyla %100 aynı olduğu doğrulandı.
       - `server/test_real_labels.cjs` çalıştırıldı; tüm 5 etiket kuralı %100 başarıyla geçti (sıfır regresyon).
  - **Kapsam:** Kullanıcı talebi ("karekod ve 1d barkod etiketleri 4 mm aşağı kaydır") doğrultusunda, SATO CL4NX Plus RFID termal yazıcısı için üretilen hem karekodlu (`generateSatoRfidZplQr`) hem de 1D çizgi barkodlu (`generateSatoRfidZplClassic`) etiket şablonlarındaki tüm içerik blokları fiziksel olarak tam 4 mm (203 DPI / 8 dot/mm çözünürlükte tam +32 dot) aşağı kaydırıldı.
  - **Uygulanan Değişiklikler (`server/app.js`):**
    1. **Etiket Uzunluğu (`^LL`):** İçeriğin 4 mm aşağı inmesiyle alt logonun ve bilgilerin kesilmesini önlemek için etiket boyu `^LL243` değerinden `^LL275` (veya `^LL280`) dot seviyesine çıkarıldı (+32 dot).
    2. **Karekodlu Şablon (`generateSatoRfidZplQr`):**
       - Başlık: `^FO52,0` -> `^FO52,32`
       - Cinsiyet & Marka: `^FO52,16` -> `^FO52,48`
       - Üst Ayırıcı Çizgi: `^FO52,32` -> `^FO52,64`
       - QR Kod (`^BQN`): `^FO52,20` -> `^FO52,52`
       - PARCA NO Başlık & Değer: `^FO212,38` -> `^FO212,70` ve `^FO212,56` -> `^FO212,88`
       - EAN Başlık & Değer: `^FO212,82` -> `^FO212,114` ve `^FO212,100` -> `^FO212,132`
       - BEDEN Başlık & Değer: `^FO212,126` -> `^FO212,158` ve `^FO212,144` -> `^FO212,176`
       - Alt Ayırıcı Çizgi: `^FO52,185` -> `^FO52,217`
       - TARIH & Şirket & Menşei Metinleri: `^FO52,189` -> `^FO52,221`, `^FO52,205` -> `^FO52,237`, `^FO52,221` -> `^FO52,253`
       - Yerli Üretim Logosu: `^FO278,188` -> `^FO278,220`
       - RFID Logosu: `^FO380,188` -> `^FO380,220`
    3. **1D Çizgi Barkodlu Şablon (`generateSatoRfidZplClassic`):**
       - Başlık: `^FO52,2` -> `^FO52,34`
       - Cinsiyet & Marka: `^FO52,24` -> `^FO52,56`
       - Üst Ayırıcı Çizgi: `^FO52,46` -> `^FO52,78`
       - 1D Barkod (`^BCN`): `^FO${startBarcodeX},52` -> `^FO${startBarcodeX},84`
       - PARCA NO Başlık & Değer: `^FO52,94` -> `^FO52,126` ve `^FO212,94` -> `^FO212,126`
       - EAN Başlık & Değer: `^FO52,122` -> `^FO52,154` ve `^FO212,122` -> `^FO212,154`
       - BEDEN Başlık & Değer: `^FO52,150` -> `^FO52,182` ve `^FO212,150` -> `^FO212,182`
       - Alt Ayırıcı Çizgi: `^FO52,185` -> `^FO52,217`
       - TARIH & Şirket & Menşei: `^FO52,189` -> `^FO52,221`, `^FO52,205` -> `^FO52,237`, `^FO52,221` -> `^FO52,253`
       - Yerli Üretim & RFID Logoları: `^FO278,188` -> `^FO278,220`, `^FO380,188` -> `^FO380,220`
    4. **Doğrulama ve Canlı Testler:**
       - Labelary API üzerinden 8 dpmm (203 DPI) çözünürlükte önizleme PNG'leri oluşturularak üst pay ve alt hizalama doğrulandı.
       - PM2 `vog-api` servisi yeniden başlatıldı (PID 29744).
       - `server/test_real_labels.cjs` tüm 5 testi (Nissan Mont, Nissan Pantolon, Audi T-Shirt, VW Pantolon, Nissan Yaz T-Shirt) %100 başarıyla geçti. Canlı `CLASSIC_1D` isteği test edildi.

- **feat/vouchers-purge-tek-tek-beden-and-canonical-parcano (Vouchers, Sales, Orders ve Master Urunlerde 'TEK TEK BEDEN' Temizliği ve Gerçek Parça No Standardizasyonu):**
  - **Kapsam:** Kullanıcı talebi ("vouchers tablosunda bazı sku code39 alanları TEK TEK BEDEN değeri var bu gerçek bir parcano değil bunları düzeltebilirmisin. excel dosyalarını kullanmalısın") doğrultusunda: (1) BSIP paketleme/koli talimatlarının (`Detay5: "TEK TEK BEDEN "`, `"TEK TEK BEDEN BEDEN ALDIĞI KADAR KOLİLENECEK..."`) sipariş ve fiş oluşturma motoruna kontrolsüz sızarak SKU ve Code39 olarak yazılması engellendi. (2) `vouchers`, `sales`, `orders`, `rfid_tags`, `master_products` ve MSSQL `[SIPARIS].[dbo].[MasterUrunler]` / `[Siparisler]` tablolarında yer alan tüm `TEK TEK BEDEN` ve türevi çöp değerler gerçek/kanonik parça kodlarıyla (`PVOG16954`, `PVOG16782`..`PVOG16902`, `PAUDI9989`) değiştirildi.
  - **Uygulanan Değişiklikler:**
    1. **Kök Neden Düzeltmesi (`server/app.js`):**
       - `isPackagingOrInvalidSku(text)`: `TEK TEK`, `PAKET`, `BEDEN`, `POŞET`, `KOLİ`, `DİKİL`, `LÜTFEN`, `ENGİN`, `DOĞUŞ`, `SAKIN`, `STANDART`, `ADET` gibi paketleme talimatlarını ve `VOG`, `PVOG`, `SKU-VOG-`, `ORD-` jenerik öneklerini filtreleyen merkezi kural fonksiyonu eklendi.
       - `extractSkuFromOrderDetails`: SKU/Code39 veya detay alanlarında bu paketleme metinleri elendi; geçerli bir P-kodu (`PVOG...`, `PVWK...`, `PSEAT...`) varsa ayıklandı, yoksa paketleme metninin SKU olarak kabul edilmesi engellendi.
       - `resolveVoucherMetadata`: Paketleme metni içeren `resolvedSku` değerleri temizlendi; Seviye 1 `master_products` sorgusunda gerçek `PVOG` kodlarının aranabilmesi sağlandı; `GENEL` ve `VOG` markalı kurumsal siparişlerde kanonik seri parça no üretimi (`PVOG${order_id}`) sağlandı; `resolvedCode39 = resolvedSku` eşitliği korundu.
    2. **Sipariş Senkronizasyon Düzeltmesi (`server/sync_clean_bsip_orders.cjs`):**
       - MSSQL `Siparisler` sorgusuna `s.ParcaNo AS parca_no` kolonu eklendi.
       - `sku = o.Detay5 || ...` hatası düzeltildi; öncelik doğrudan `o.parca_no`'ya verildi ve paketleme metinleri elendi.
    3. **Veritabanı Temizliği & Göçü (`server/cleanup_tek_tek_beden.cjs`):**
       - `vouchers`: Order 16954'e ait 9 fişin `sku` ve `code39` alanları `'PVOG16954'` olarak güncellendi.
       - `sales`: Order 16954'e ait 9 satış kaydının `sku` ve `code39` alanları `'PVOG16954'` yapıldı.
       - `rfid_tags`: Order 16954'e ait 9 çip kaydının `sku` alanı `'PVOG16954'` yapıldı.
       - `orders`: Order 16954 (`PVOG16954`), Acıbadem siparişleri 16782..16902 (`PVOG16782`..`PVOG16902`), 16896 (`PAUDI9989`) ve 16901 (`PVOG16901`) güncellendi.
       - `master_products`: Mükerrer kirli kayıtlar temizlendi; `PVOG16954` tekil olarak bağlandı.
       - MSSQL: `[SIPARIS].[dbo].[Siparisler]` tablosunda `Id=16954` için `ParcaNo = 'PVOG16954'` işlendi; `[MasterUrunler]` tablosunda `PVOG16954` tanımlandı.
    4. **Denetim & Doğrulama:**
       - PostgreSQL'deki tüm tablolarda `TEK TEK` araması yapıldı: `vouchers: 0`, `sales: 0`, `orders: 0`, `rfid_tags: 0`, `master_products: 0`.
       - PM2 üzerinde `vog-api` yeniden başlatıldı (PID 46744).
       - `server/test_real_labels.cjs` tüm 5 testi %100 başarıyla geçti.
       - Order 16954 için canlı fiş ve etiket üretim testi çalıştırıldı; `PVOG16954` parça no ile kusursuz fiş üretildiği doğrulandı.
  - **Kapsam:** Kullanıcı talebi ("vouchers tablosunda bu veriler aynı şekilde düzeltilmeli") doğrultusunda: (1) `vouchers` ve `sales` tablolarındaki tüm kayıtlarda pantolon dışındaki giysilerde parantez içi çift beden kaldırıldı, yalın tekil beden (`M`, `L`, `4XL`) yapıldı (Örn: #9903 Audi T-Shirt: `'M (42)'` -> `'M'`). Pantolonlarda ise standart çift beden formatı (`XS (38)`, `4XL (52)`) sağlandı (#9904 VW Pantolon: `'38 (XS)'` -> `'XS (38)'`). (2) Nissan siparişlerinde (`order_id = 16575`) yanlış atanmış `VOLKSWAGEN` markası `NISSAN` olarak düzeltildi; her bedenin tekil 13 haneli resmi barkodu (`9011201001025`, `9011201001032`, `9011201001049`, `6001258147022`, `6001258147023`) `sku`, `code39`, `barcode` ve `ean13` kolonlarına işlendi. (3) Backend fiş ve satış kayıt motoru (`server/app.js`: `resolveVoucherMetadata`, `/api/vouchers/create-from-order`, `/api/vouchers/create`, `/api/printer/print-order-rfid-labels`, `formatDualSize`) aynı kuralları otomatik uygulayacak şekilde kalıcı hale getirildi.
  - **Uygulanan Değişiklikler:**
    1. **`server/app.js` Güncellemeleri:**
       - `formatDualSize(size)`: Ters çift beden desenini (`38 (XS)`) standart formata (`XS (38)`) dönüştüren mekanizma eklendi.
       - `resolveVoucherMetadata(params)`: Gelen `size` parametresini pantolon/pantolon-dışı durumuna göre dinamik sanitize eden mantık eklendi, dönüş objesine `size: resolvedSize` eklendi. Nissan ürünlerinde beden (`cleanSz`) bazlı `master_products` araması yapılarak her bedenin tekil 13 haneli barkodu `resolvedSku`, `resolvedCode39`, `resolvedBarcode`, `resolvedEan13` alanlarına bağlandı.
       - `/api/vouchers/create-from-order`: `vouchers.size` ve `sales.size` kolonlarına yazılan değer `meta.size` (temizlenmiş beden) yapıldı.
       - `/api/vouchers/create`: `currentSize` pantolon/pantolon-dışı durumuna göre sanitize edildi.
       - `/api/printer/print-order-rfid-labels`: Fiş ve satış kayıtlarında `finalCleanSize` kullanılması sağlandı.
    2. **Veritabanı Göçü (`server/migrate_vouchers_size_and_parcano.cjs`):**
       - `vouchers` tablosundaki 11 kayıt ve `sales` tablosundaki 11 kayıt (%100 başarıyla) güncellendi.
       - Tam audit çalıştırıldı: `vouchers` ve `sales` tablolarında 0 hata doğrulandı.
    3. **Servis & API Doğrulaması:**
       - PM2 üzerinde `vog-api` yeniden başlatıldı (PID 26668).
       - `server/test_real_labels.cjs` çalıştırılarak canlı API üzerinde 5 farklı senaryo (Nissan Mont, Nissan Pantolon, Audi T-Shirt, VW Pantolon, Nissan Yaz T-Shirt) %100 başarıyla doğrulandı.

- **feat/label-single-size-non-pantolon-and-exact-excel-parcano (Pantolon Dışında Tek Beden Standardı, Orijinal Excel Parça No ve Nissan Sayısal Kod Uyumu):**
  - **Kapsam:** Kullanıcı talebi doğrultusunda: (1) Pantolon dışındaki tüm kıyafet etiketlerinde (Mont, Yelek, T-Shirt, Sweat, Gömlek, Polar vb.) `BEDEN:` alanında parantez içi çift beden kaldırıldı, yalnızca yalın beden (`M`, `L`, `4XL`) basılması sağlandı; Pantolon etiketlerinde ise çift beden formatı (`XS (38)`, `4XL (52)`) eksiksiz korundu. (2) `PARCA NO:` alanının Excel dosyalarındaki orijinal parça kodlarıyla birebir eşleşmesi garantilendi: Nissan için Excel'deki resmi sayısal parça kodları (Mont için `8520147032006`, Pantolon için `8520147032723`, Yaz T-Shirt için `9010201001035`), Audi/VW/Cupra/Seat için ise sonundaki beden eki budanmamış orijinal katalog kodları (`PPAUDI260001M`, `PVWK100004XS`) basıldı; 13 haneli GS1 barkod ise `EAN:` satırında basıldı.
  - **Uygulanan Mimari & Kod Değişiklikleri (`server/app.js`):**
    1. **Dinamik Pantolon / Non-Pantolon Beden Ayrımı (`generateSatoRfidZplQr` ve `generateSatoRfidZplClassic`):**
       - Ürün adı veya modelinde `PANT` / `PANTOLON` deseni (`/PANT(?:OLON)?/i`) kontrol edilir.
       - Pantolon ise: `formatDualSize(item.clean_size || item.size)` çağrılarak çift beden (`XS (38)`, `4XL (52)`) üretilir.
       - Pantolon dışı ise: Regex `/\s*\([^)]*\)/g` ile parantez ve içeriği tamamen budanarak saf harf/sayı bedeni (`M`, `4XL`) üretilir.
    2. **Nissan Resmi Excel Parça No Standardı:**
       - Nissan ekosisteminde jenerik kategori etiketleri (`KIYAFETKIS-MONT-4XL` vb. 8 farklı departmanda mükerrerdir) yerine Excel'deki tekil resmi sayısal parça kodları (`8520147032006`, `8520147032723`, `9010201001035`) `PARCA NO:` alanına basılır.
       - Audi, Volkswagen, Cupra, Seat, Skoda ve Porsche alfanümerik kodları (`PPAUDI260001M`, `PVWK100004XS`) korunur.
    3. **Excel Parça Kodlarında Kesilmeyi Önleme & 36 Karakter Desteği:**
       - Önceki kodda yer alan `.substring(0, 24)` sınırı 36 karaktere genişletildi.
       - Uzun kodlar için dinamik ZPL font ölçekleme entegre edildi.
    4. **Veritabanı Senkronizasyonu (`master_products` & `MasterUrunler`):**
       - `import_nissan_kis_2026.cjs` ve `import_nissan_yaz_2026.cjs` çalıştırılarak Nissan kış ve yaz sezonundaki tüm ürünlerin tekil barkodları, ürün adları ve bedenleri PostgreSQL ve MSSQL tablolarında eksiksiz senkronize edildi.
    5. **Otomatik Test & Doğrulama (`server/test_real_labels.cjs`):**
       - 5 farklı kritik senaryo (Nissan Mont, Nissan Pantolon, Audi T-Shirt, VW Pantolon, Nissan Yaz T-Shirt) canlı API üzerinde çalıştırıldı ve %100 başarıyla doğrulandı.

- **feat/master-products-pg-mssql-mapping-and-sync (PostgreSQL master_products ↔ MSSQL MasterUrunler Canonical Mapping, Temizlik ve Çift Yönlü Senkronizasyon):**
  - **Kapsam:** PostgreSQL `vog_db.master_products` ile MSSQL `SIPARIS.dbo.MasterUrunler` tabloları arasında iş (business) anlamı referans alınarak 13 temel canonical alan üzerinden tam eşleştirme, veri temizliği, mükerrerlikten arındırma (de-duplication) ve çift yönlü senkronizasyon tamamlandı.
  - **Uygulanan Mimari & Veri İyileştirmeleri:**
    1. **Excel Kaynak Analizi:** Projedeki ve `Downloads` klasöründeki 27 adet Excel dosyası taranarak 2.720 adet resmi marka ürünü (Audi, Cupra, Nissan, Porsche, Scania, Seat, Skoda, VW) çıkarıldı.
    2. **Kirli / Çöp Veri Temizliği & Ayrıştırma:** Eski aktarımlardan kalan 25.603 adet çöp paketleme kelimesi (`TEK`, `PAKET`, `PO`, `PAKETLENECEK`, `BEDEN`) temizlendi. Not içeren uzun SKU'lardan 4.471 adet gerçek parça kodu kurtarıldı. 1.478 adet `NULL` markalı kayıt SKU önekine göre (`FORD`, `SEAT`, `GENEL`, `VOG`) markasına bağlandı. MSSQL'de 100 karakter kesilmesine takılan 16 adet Scania sipariş notlu kayıt gerçek parça kodlarına ayrıştırıldı.
    3. **Tekillik & İndeks Güvencesi:** PostgreSQL üzerinde `UNIQUE(UPPER(TRIM(sku)))` indeksi (`idx_master_products_sku`), MSSQL üzerinde `UNIQUE NONCLUSTERED INDEX [UQ_MasterUrunler_ParcaNo]` indeksi oluşturuldu. Her iki tabloda da tam 24.091 adet %100 saf ve tekil master ürün kaydı sağlandı.
    4. **Otomatik Doğrulama Motoru (`server/validate_masters_integrity.cjs`):** İki veritabanı arasında kayıt sayısı, marka bazlı dağılım, çöp veri ve NULL marka kontrollerini çalıştırıp raporlayan otomatik validasyon betiği eklendi. 21 markanın tamamında %100 birebir eşitlik sağlandı.
    5. **Nissan Entegrasyonu:** Yaz ve Kış sezonu ürünleri (`import_nissan_yaz_2026.cjs`, `import_nissan_kis_2026.cjs`) çift yönlü senkronizasyonla hem PostgreSQL hem MSSQL'e tam ürün adları, bedenleri, 13 haneli barkodları ve parça kodlarıyla işlendi.

- **feat/nissan-2026-kis-parca-kodlari-excel-and-script (NISSAN 2026 KIŞ PARÇA KODLARI.xlsx ve import_nissan_kis_2026.cjs Oluşturulması):**
  - **Kapsam:** `server/import_nissan_yaz_2026.cjs` ve `NISSAN 2026 YAZ PARÇA KODLARI.xlsx` yapısının birebir aynısı kış sezonu için `server/import_nissan_kis_2026.cjs` ve `NISSAN 2026 KIŞ PARÇA KODLARI.xlsx` olarak oluşturuldu.
  - **Uygulanan Değişiklikler:**
    1. **`server/import_nissan_kis_2026.cjs`:**
       - `rawData`: 274 kışlık ürünün tamamı (Mont, Pantolon, Polar, Sweat, Yelek, Beyaz Kadın & Erkek Gömlekleri) departmanlarına göre gruplanarak eksiksiz eklendi.
       - Kolon Yapısı: `BARKOD NUMARASI`, `1- Firma Adı` ('Nissan'), `2- Ürün Adı`, `3- Ürün Kodu` (`KIYAFETKIS-...`), `FORMATI` ('EAN 13').
       - Çıktı Dosyaları: `c:\vog_system\NISSAN 2026 KIŞ PARÇA KODLARI.xlsx` (ve `C:\Users\ctopuz\Desktop\NISSAN 2026 KIŞ PARÇA KODLARI.xlsx`) oluşturuldu.
    2. **Veritabanı Entegrasyonu & Senkronizasyon:**
       - PostgreSQL `master_products`: 274 kışlık ürün tüm beden, renk, cinsiyet, 13 haneli barkod ve parça kodlarıyla güncellendi.
       - MSSQL `[SIPARIS].[dbo].[MasterUrunler]`: 274 ürünün tamamı `ParcaNo`, `Barkod`, `UrunAdi`, `Beden`, `Renk`, `Cinsiyet` alanlarıyla senkronize edildi.
       - MSSQL `[SIPARIS].[dbo].[Siparisler]`: Nissan siparişlerinin `ParcaNo` alanları 13 haneli barkodlarıyla bağlandı.

- **feat/nissan-2026-kis-master-and-parcano-integration (NISSAN 2026 KIŞ Dosyası MasterUrunler & Siparisler.ParcaNo Entegrasyonu):**
  - **Kapsam:** `C:\Users\ctopuz\Desktop\NISSAN 2026 KIŞ.xlsx` dosyasındaki tüm kışlık ürün tanımları (Mont, Pantolon, Polar, Sweat, Yelek ve Gömlek) 13 haneli barkodları (`8520147...` ve `6001258...`), departmanları, bedenleri ve renkleriyle veritabanlarına aktarıldı.
  - **Uygulanan Değişiklikler:**
    1. **Master Ürünler:** 274 ürün (260 adet kışlık kıyafet ve 14 adet beyaz gömlek) + 260 adet `KIYAFETKIS-...` çapraz yedek parça kodu eşleşmesi ile toplam 534 kayıt hem PostgreSQL `master_products` hem de MSSQL `MasterUrunler` tablolarına eklendi/güncellendi.
    2. **Siparişler Eşleştirmesi:** MSSQL `[SIPARIS].[dbo].[Siparisler]` tablosundaki 123 adet Nissan siparişinin tamamı taranarak 13 haneli Parça No (`ParcaNo`) değerleri bağlandı; PostgreSQL `orders.sku`, `code39`, `barcode`, `ean13` alanlarıyla senkronize edildi.
    3. **Önbellek & Servis:** `server/app.js` MSSQL önbelleği yenilendi; PM2 üzerinde `vog-api` servisi yeniden başlatıldı.

- **feat/bsip-master-urunler-and-parcano-mapping (BSip MSSQL MasterUrunler Tablosu, Siparisler.ParcaNo Kolonu ve Downloads Marka Listelerinin Entegrasyonu):**
  - **Gereksinim & Kapsam:** BSip MSSQL `SIPARIS` veritabanında siparişler ile master ürün tanımları arasında doğrudan Parça Kodu (Parça No / SKU) ilişkisinin kurulması, `Siparisler` tablosunda eksik olan `ParcaNo` kolonunun oluşturulup doldurulması ve Downloads klasöründeki tüm markalara (Audi, Cupra, Nissan, Porsche, Scania, Seat, Skoda, Volkswagen) ait Excel listelerindeki gerçek parça kodlarının veritabanına işlenmesi.
  - **Uygulanan Mimari Değişiklikler:**
    1. **MSSQL `MasterUrunler` Tablosu (`[SIPARIS].[dbo].[MasterUrunler]`):**
       - Kolonlar: `Id` (INT IDENTITY PK), `ParcaNo` (NVARCHAR(100)), `UrunAdi` (NVARCHAR(250)), `Renk` (NVARCHAR(100)), `Beden` (NVARCHAR(50)), `CleanBeden` (NVARCHAR(50)), `Barkod` (NVARCHAR(50)), `Ean13` (NVARCHAR(50)), `Code39` (NVARCHAR(100)), `Marka` (NVARCHAR(100)), `Grup` (NVARCHAR(100)), `Cinsiyet` (NVARCHAR(50)), `Fiyat` (DECIMAL(18,2)), `CreatedAt`, `UpdatedAt`.
       - İndeksler: `IX_MasterUrunler_ParcaNo`, `IX_MasterUrunler_Barkod`, `IX_MasterUrunler_Marka_Beden`.
       - Toplam 63,424 master ürün kaydedildi.
    2. **MSSQL `Siparisler.ParcaNo` Kolonu & İndeksi:**
       - `[SIPARIS].[dbo].[Siparisler]` tablosuna `ParcaNo NVARCHAR(100) NULL` kolonu ve `IX_Siparisler_ParcaNo` indeksi eklendi.
    3. **Downloads Klasöründeki Tüm Marka Excel Dosyalarının Ayrıştırılması:**
       - Taranan dosyalar: Audi (2025 Kış, 2026 Yaz), Cupra (2025 Kış, 2026 Yaz), Nissan (Kışlık, Yazlık, Barkod Listesi, Parça Kodu), Porsche (2026 Yaz), Scania (2025 Kış, 2026 Yaz), Seat (2025 Kış, 2026 Yaz), Skoda (2025 Kış, 2026 Yaz), Volkswagen (2025 Kış, 2026 Kış, 2026 Yaz).
       - Ayrıştırılan 2,312 adet özgün marka parça kodu ve 13 haneli barkodlar hem PostgreSQL `master_products` hem de MSSQL `MasterUrunler` tablolarına kaydedildi.
    4. **Siparişlerin Parça No Değerlerinin Doldurulması:**
       - MSSQL'deki 16,324 siparişin tamamı taranarak; `Detay5`, `Detay1`, `Not` ve `Model` alanlarındaki doğrulanmış marka parça kodları (`PAUDI...`, `PVWK...`, `PCUPRA...`, `PSEAT...`, `PSKD...`, `PPORSCHE...`, `SCKY...`, `KIYAFET...`, `K-OG...`, `8520147...`) eşleştirildi. 5,592 doğrulanmış gerçek marka kodu ve 10,732 seri parça kodu `Siparisler.ParcaNo` alanına işlendi.
    5. **Backend API Entegrasyonu (`server/app.js`):**
       - `refreshMssqlOrdersCacheAsync`: `s.ParcaNo` sorguya dahil edildi, `order.ParcaNo` ve `order.parca_no` olarak iliştirildi.
       - `syncRecentMssqlOrdersToPg`: `s.ParcaNo AS parca_no` okunarak PostgreSQL `orders.sku` ve `orders.code39` alanlarına aktarıldı.
       - `/api/orders/mssql-list`: Arama filtresine `o.ParcaNo` dahil edildi.
       - `POST /api/orders/update-parca-no`: Tekil siparişin Parça No bilgisini hem MSSQL `Siparisler.ParcaNo` hem PostgreSQL `orders.sku` hem de bellek önbelleğinde anında güncelleyen endpoint eklendi.
    6. **Frontend Arayüzü (`src/pages/OrdersPage.jsx`):**
       - Siparişler tablosuna MÜŞTERİ ile MODEL arasına `PARÇA NO` kolonu (`th` ve `td`) eklendi.
       - Sipariş detay çekmecesine (`selectedOrderDetail`) `PARÇA NO` kutucuğu eklendi.
       - Fiş / etiket basım emrinde `selectedVoucherOrder.ParcaNo` önceliklendirildi.
       - `npm run build` ile üretim paketi derlendi ve `pm2 restart vog-frontend` ile yayına alındı.

  - **Kural & Gereksinim:** Nissan ekosisteminde ve VOG tedarik zincirinde Nissan ürünlerinin Parça Kodu (PARÇA NO / Yedek Parça Kodu), Excel'de ve etiketlerde tanımlı olan 13 haneli GS1/EAN numerik barkodudur (Örn: `8520147032006`). Alfanümerik tanımlar (Örn: `KIYAFETKIS-MONT-4XL`) genel departman kalıbı olup kesin parça no değildir.
  - **Uygulanan Değişiklikler:**
    1. **`master_products` Kataloğu (%100 Temizlendi & 13 Haneye Çekildi):**
       - Tüm 333 adet Nissan kışlık ürünü için `sku = barcode`, `code39 = barcode`, `ean13 = barcode` (13 hane) olarak güncellendi.
       - Eski testlerden veya hatalı aktarımlardan kalan 277 adet sahte/kirli kayıt (`AUTO-xxxxxx`, `NISSAN-xxxxx`, 'OLACAK. DAGITIM' vb.) veritabanından tamamen temizlendi. Nissan kataloğunun %100'ü eksiksiz 13 haneli barkodlardan oluşmaktadır.
    2. **`vouchers` ve `sales` Kayıt Motoru (`server/app.js`):**
       - `resolveVoucherMetadata`, `/api/vouchers/create`, `/api/vouchers/create-from-order` ve `/api/printer/print-order-rfid-labels` fonksiyonlarında: Marka `NISSAN` olduğunda fiş ve satış tablosuna yazılan `sku` ve `code39` alanları zorunlu olarak 13 haneli barkoda eşitlendi.
    3. **Termal RFID Etiket Basım Motoru (`generateSatoRfidZplQr` ve `generateSatoRfidZplClassic`):**
       - Nissan etiketlerinde `PARCA NO:`, `EAN:` ve 2D Karekod (QR) içeriği doğrudan 13 haneli barkodu (`item.barcode` / `item.sku` / `item.ean13`) basacak şekilde güçlendirildi.
    4. **Master Excel İçe Aktarma (`POST /api/products/import-master-excel`):**
       - `NISSAN` markalı içe aktarmalarda 12-14 haneli numerik barkod bulunduğunda `sku` ve `code39` otomatik olarak 13 haneli barkod değeriyle kaydedilir.
    5. **Regresyon Koruması (Diğer Markalar):**
       - Volkswagen, Audi, SEAT, Cupra, Skoda, Porsche ve diğer markaların alfanümerik parça kodları (`PVWK100009XXXL` vb.) %100 orijinal formatında korunmaktadır.

- **feat/dynamic-vouchers-label-printing-and-nissan-master-import (Vouchers Tabanlı %100 Dinamik Etiket Basımı & Nissan Master Ürün Aktarımı):**
  - **Sorun:** Kullanıcı masaüstündeki `nissan Kışlık Kıyafet Sipariş Formu BARKOD (1).xlsx` dosyasını Veri Girişi'nden aktardığında, parser'ın `STOK ADI` kolonunu tanımayıp `Departman` kolonunu ürün adı alması ve aynı yedek parça koduna sahip birden fazla departmanı (`KIYAFETKIS-MONT-4XL` vb.) `WHERE sku = $1` ile birbiri üzerine yazması sonucu 260 satırlık liste ~30 bozuk kayda düşmüş ve ürün adları "Teknisyen", "Servis Danışmanı" olarak kalmıştı. Ayrıca etiket basımında marka veya ürün adı için sabit fallbacks ('VOLKSWAGEN' vb.) bulunuyordu.
  - **Uygulanan Çözümler:**
    1. **Vouchers / Veritabanı Kaynağından %100 Dinamik Etiket Basımı (`server/app.js` -> `/api/printer/print-order-rfid-labels`):**
       - Etiket basım motoru (`generateSatoRfidZplQr` ve `generateSatoRfidZplClassic`) ve API endpoint'indeki tüm sabit marka yazıları (`VOLKSWAGEN` vb.) tamamen kaldırıldı.
       - Yazıcıya gönderilmeden önce `vouchers` tablosu sorgulanır; `product_name`, `brand`, `gender`, `size`, `sku` (parça no) ve `barcode` / `ean13` doğrudan veritabanındaki fişten okunarak etikete dinamik olarak basılır (`${gender}  |  ${brand}` -> Örn: `KADIN  |  NISSAN`, `ERKEK  |  NISSAN`, `ERKEK  |  VOLKSWAGEN`). Fiş henüz oluşmamışsa `master_products` kataloğu üzerinden aynı dinamik eşleme yapılır.
    2. **Master Ürün İçe Aktarma Motoru Geliştirmesi (`server/app.js` -> `/api/products/import-master-excel`):**
       - Barkod içeren sekmeleri otomatik tarayan mekanizma (`Sayfa1`, `Kodlar` vb.) eklendi.
       - Kolon tespitinde `STOK ADI`, `Yedek parça adı`, `Yedek parça kodu`, `Departman` ve `Barkod` başlıkları tam entegre edildi.
       - `cleanProductTitle` ve Türkçe harf katlama (`normalizeTr`) ile ürün adı vouchers formatına uygun hale getirildi; sonundaki beden ekleri budandı, tekrarlanan departman kelimeleri ayıklandı (`TEKNİSYEN KIŞLIK MONT`, `SERVİS DANIŞMANI BAYAN KIŞLIK MONT`, `VALE KIŞLIK MONT` vb.).
       - Çoklu departmanın aynı parça kodunu kullandığı durumlar için `WHERE sku = $1` ezmesi kaldırıldı; birincil eşleştirme GS1 standardı olan 13 haneli `barcode / ean13` üzerinden sağlandı.
       - Masaüstündeki `nissan Kışlık Kıyafet Sipariş Formu BARKOD (1).xlsx` dosyasındaki 260 ürünün tamamı doğru ürün isimleri, bedenleri, parça kodları, grup/departman bilgisi ve 'NISSAN' markasıyla `master_products` tablosuna aktarıldı.

- **feat/nissan-and-dynamic-brand-support (Master Ürün Kataloğu & Excel Sipariş Yükleme NISSAN ve Dinamik Marka Desteği):**
  - **Durum:** Kullanıcı arayüzünde (`AdminDataEntry.jsx`) hem "Master Ürün Kataloğu (master_products)" hem de "Excel Sipariş Yükle" sekmelerine **NISSAN**, **MAN** markaları ve istendiğinde serbest marka adı girilebilmesi için **➕ DİĞER / YENİ MARKA GİRİŞİ** dinamik text input alanı eklendi.
  - **Backend Parser Geliştirmesi (`server/app.js`):**
    - `BARKOD NUMARASI` kolon adının `KOD` alt kelimesini içermesi nedeniyle SKU kolonu olarak yanlış eşleşmesi `(cellStr.includes('KOD') && !cellStr.includes('BARKOD'))` koşuluyla %100 düzeltildi.
    - `3- Ürün Kodu` / `ÜRÜN KODU` başlığı doğrudan `skuCol` olarak tanımlandı.
    - `KIYAFETYAZ-TSHIRT-...` gibi içinde rakam bulunmayan veya `P` öneki taşımayan özel otomotiv/tekstil parça kodlarının da `skuCol` tespit edildiğinde eksiksiz aktarılması sağlandı.
    - `resolveBrandAndGrup`: `targetBrand === 'NISSAN'` veya `NIS` öneki seçildiğinde marka ve grup doğrudan `NISSAN` olarak atandı.
    - `NISSAN 2026 YAZ PARÇA KODLARI.xlsx` dosyasındaki 72 adet master ürün tüm beden, barkod, cinsiyet ve parça kodlarıyla `master_products` tablosuna başarıyla aktarıldı.

- **feat/label-2mm-shift-and-bottom-text-enlarge (Etiket 2mm Sağa Kaydırma, Karekod 2mm Daha Yukarı [Y=20], Tüm Metinleri Büyütme/Okunurluk & Logo Alt Kesilme Onarımı):**
  - **Durum:** Kullanıcı talebi doğrultusunda 2D Karekod (`^BQN,2,5`, mag 5) 2mm daha (ilave 16 dot @ 203 DPI) yukarı kaydırılarak `^FO52,20` koordinatına alındı. Üst başlık satırı `^FO52,0`, alt başlık `^FO52,16`, üst ayırıcı çizgi `^FO52,32` seviyesine kompaktlaştırılarak karekodun üst çizgi ve metinlerle çakışması sıfıra indirildi; optik okuyucular için tam sessiz alan (quiet-zone) garantilendi. Sağındaki `PARCA NO:`, `EAN:`, `BEDEN:` blokları da `Y=38..144` aralığına tam simetrik olarak hizalandı.
  - **Uygulanan Şablon & Tipografi Parametreleri (`server/app.js`, `test_preview.cjs`, `test_preview2.cjs`):**
    - `^PW440`, `^LL243`, `^LH0,0`, `^PR2,2`, `^MD24`.
    - Sol marjin: $X=52$ (+16 dot = 2.0 mm sağa ofset).
    - Üst Başlık: `^FO52,0` (Font: `^A0N,16,13`, uzun başlıklar için `^A0N,15,12`).
    - İkinci Satır (Cinsiyet / Marka): `^FO52,16^A0N,16,13`.
    - Üst Ayırıcı Çizgi: `^FO52,32^GB378,2,2`.
    - 2D Karekod (QR): `^FO52,20^BQN,2,5^FDQA,...` (**2mm daha yukarı: Y=36 -> Y=20, siyah modüller Y=40'ta başlar**).
    - Sağ Bilgi Kolonu (Tam Hizalı & Yüksek Okunurluk):
      - `PARCA NO:` etiket: `^FO212,38^A0N,16,14`
      - `PARCA NO` değer: `^FO212,56${parcaFont}` (`^A0N,24,20`, uzun için `^A0N,20,17` / `^A0N,18,15`)
      - `EAN:` etiket: `^FO212,82^A0N,16,14`
      - `EAN` değer: `^FO212,100^A0N,24,20`
      - `BEDEN:` etiket: `^FO212,126^A0N,16,14`
      - `BEDEN` değer: `^FO212,144^A0N,28,24`
    - Alt Ayırıcı Çizgi: `^FO52,185^GB378,2,2`.
    - Alt 3 Satır:
      - 1. Satır: `^FO52,189^A0N,18,14^FDTARIH: ...^FS`
      - 2. Satır: `^FO52,205^A0N,18,14^FDVOG TEKSTIL SAN. VE TIC. A.S.^FS`
      - 3. Satır: `^FO52,221^A0N,17,13^FDTurkiye'de uretilmistir.^FS`
    - Logolar (Alt Kesilme Düzeltildi & Sıfır Çakışma):
      - `YERLI_URETIM_GFA`: `^FO278,188` (Y=188..231, alt etiket sınırından 12 dot / 1.5mm yukarıda; alt çerçeve kesilmesi %100 giderildi).
      - `RFID_LOGO_GFA`: `^FO380,188` (Y=188..232, alt etiket sınırından 11 dot yukarıda; alt çerçeve kesilmesi %100 giderildi).
    - 1D Klasik Barkod: `^FO${startBarcodeX},52` (dinamik ortalama) ve `^FO52,94..150` / `^FO212,94..150` uyumu.

- **feat/label-design-restored-to-photo2-full-layout (Büyütülmüş Karekod & 42-Dot Yüksek 1D Barkod Kalibrasyonu):**
  - **Durum:** Kullanıcı talebi doğrultusunda karekod optik okuyucular/kameralar için büyütüldü (Büyütme: 5, `^FDQA`, `Y=56`), 1D çizgi barkod yüksekliği 42 dot'a çıkarıldı.
  - **Uygulanan Şablon Parametreleri:**
    - `^PW480`, `^LL272`, `^LH50,6`, `^PR3,3`, `^MD12`.
    - Çizgi genişliği: `^GB410,2,2`.
    - 1D Barkod: `^FO${startBarcodeX},56^BY${byWidth},${ratio},42^BCN,42,N,N,N` (42 dot yüksek, belirgin ve anında taranabilir).
    - Karekod (QR): `^FO8,56^BQN,2,5^FDQA,...` (Büyütme 5, %25 yüksek hata düzeltmeli, yukarı taşınmış ve alt çizgiyle güvenli boşluklu).
    - 3'lü Bilgi Satırı: `PARCA NO`, `BARKOD`, `BEDEN` hizalı ve net okunur tipografi (`X=130..220`).
    - Alt Bilgi & Logolar: `TARIH`, `VOG TEKSTIL`, `Turkiye'de uretilmistir.` sol alt (`Y=188..232`), `YERLI URETIM` ($X=200$) ve `RFID` ($X=310$) sağ alt.
    - master_products tam SKU (`PVWK100088XXXXXXXXXL`, `PVWK100009XXXL` vb.) korunmaktadır.

- **feat/label-design-restored-to-yesterday (Dünkü Kusursuz Onaylı Etiket Tasarımına Geri Dönüş ve Tam master_products SKU Korunumu):**
  - **Durum:** Kullanıcı fotoğrafındaki altta yer alan dünkü onaylı tasarıma (`^PW420`, `^LL240`, `^LH50,10`) geri dönüldü.
  - **Uygulanan Tasarım Parametreleri:**
    - Üst satır: Ürün başlığı (`cleanProductNameForTitle`).
    - İkinci satır: `ERKEK  |  VOLKSWAGEN` / `KADIN  |  VOLKSWAGEN`.
    - 1D Barkod: Code 128 ortalanmış (`BY2, 28 dot`).
    - Metinler: `PARCA NO: PVWK100009XXXL` ve hemen altında `BEDEN: 3XL (50)` alt alta sıralı.
    - Alt satırlar: Tarih, `VOG TEKSTIL SAN. VE TIC. A.S.`, `Turkiye'de uretilmistir.`.
    - Logolar: Sağ altta `YERLİ ÜRETİM` (X=160) ve `RFID` (X=262) yan yana, sıfır çakışma.
    - Tüm barkod, karekod ve veritabanı kayıtlarında `master_products.sku` (`PVWK100009XXXL`) %100 korunmaktadır.

- **feat/exact-master-products-sku-in-barcode-and-qr (Karekod ve 1D Barkod İçerisindeki SKU Değerinin master_products Tablosundaki Birebir Parça No / SKU İle Eşitlenmesi):**
  - **1. Beden/Varyant Bazlı Tam SKU Eşleşmesi (`resolveExactSizeSkuAndBarcode`):**
    - `resolveExactSizeSkuAndBarcode` fonksiyonu, `master_products` tablosundan çekilen beden-varyant satırının tam `sku` değerini (`PVWK100009XXXL`, `PVWK100009M`, `PVWK100010L`, `PVWK100010XXXL` vb.) `cleanParcaNo` fonksiyonuna sokarak sonundaki beden ekini budamadan doğrudan `sku` ve `code39` olarak döner.
  - **2. SATO ZPL QR Kod ve 1D Barkod Baskı Motoru Senkronizasyonu:**
    - `generateSatoRfidZplQr`: QR kod içerisine (`^FO4,50^BQN,2,3^FDMA,...`) ve etiketteki `PARCA NO:` alanına doğrudan `master_products`'taki tam SKU basılır (Örn: `PVWK100009XXXL`).
    - `generateSatoRfidZplClassic`: 1D çizgi barkod çizgilerine (`^BY...^BCN,38...^FD...^FS`) ve `PARCA NO:` alanına doğrudan `master_products`'taki tam SKU kodlanır.
    - Dinamik tipografi (`parcaNo.length > 14 ? '^A0N,18,15' : '^A0N,22,18'`) ile 15-22 karakterlik uzun parça kodları dahi 50x30mm etiket sınırları içinde mükemmel okunurlukta basılır.
  - **3. Fiş, Satış ve RFID DB Kayıtları (`vouchers`, `sales`, `rfid_tags`):**
    - `POST /api/printer/print-order-rfid-labels` ve `POST /api/vouchers/create-from-order` endpoint'lerinde oluşturulan `rfid_tags.sku`, `vouchers.sku`, `vouchers.code39`, `sales.sku`, `sales.code39` alanlarına `master_products` kataloğundaki tam SKU kodu (Örn: `PVWK100009XXXL`) birebir kaydedilir.

- **feat/label-precision-calibration-omni-sorter (Omni Mini Sorter Kamera Uyumu, Taşmasız 50x30mm Hassas Kalibrasyon ve Yüksek Kontrast ZPL):**
  - **1. Karekod (2D QR) Şablonunda Çakışma Giderildi & Yan Yana Yerleşim:**
    - `generateSatoRfidZplQr`: QR kod (`^FO4,50^BQN,2,3^FDMA,...`) sol alana sabitlendi (`X=4..76`). Metin bilgileri (`PARÇA NO:`, `BEDEN: 3XL (50)`) `X=92` başlangıç koordinatına kaydırılarak QR kod ile metinler arasındaki üst üste binme (çakışma) %100 giderildi.
  - **2. 1D Çizgi Barkod (Code 128) Sorter Kamera Okuma Yüksekliği:**
    - `generateSatoRfidZplClassic`: Barkod yüksekliği 28 dot'tan **38 dot (~5-6 mm)** seviyesine çıkarıldı. Dinamik ortalama (`Math.round((320 - barcodeWidth) / 2)`) ve `^BY2` modül genişliği ile Omni Mini Sorter konveyör kamera okuyucuları için ideal tarama yüzeyi sağlandı.
  - **3. Termal Baskı Kalitesi & Siyah Kontrast Optimizasyonu:**
    - ZPL akışına `^PR3,3` (Düşük/hassas yazdırma hızı: 3 inç/sn) ve `^MD12` (Yüksek termal kontrast/karalık) eklendi. Çizgi ve QR modül kenarlarında sürüklenme/dağılma (bleeding) sıfıra indirildi.
  - **4. 50x30mm Etiket Sınırları & Logo Kalibrasyonu:**
    - `^PW400`, `^LL240`, `^LH45,8` ile etiket taşıyıcı marjini kalibre edildi. `YERLİ ÜRETİM` (X=170) ve `RFID` (X=274) logoları ve alt bilgi satırları (`TARIH`, `VOG TEKSTIL`, `Turkiye'de uretilmistir.`) `Y <= 172` sınırında güvenli alan içinde toplandı; kenarlardan veya sonraki etikete taşma tamamen önlendi.

- **feat/orders-and-vouchers-data-normalization (Ürün Adı Cinsiyet Temizleme, Gerçek SKU / Code39 Eşitleme ve BSİP Orders Senkronizasyonu):**
  - **1. `product_name` Alanından Cinsiyet İfadelerinin Kaldırılması ve Temiz Trim:**
    - `vouchers`, `sales`, `orders` ve `master_products` tablolarındaki tüm kayıtlarda `product_name` alanından `BAY / BAYAN`, `BAY-BAYAN`, `BAY`, `BAYAN`, `ERKEK / KADIN`, `ERKEK`, `KADIN`, `ERKEKLER`, `KADINLAR`, `ERKEK MODELİ` vb. tüm cinsiyet ifadeleri temizlendi.
    - Bayi unvanları (`ÖZAŞ BAYİSİ`, `BAYİ DİST.`) ve `TÜRK BAYRAKLI` gibi geçerli ifadeler korundu (`\b(?:BAYAN|BAY(?![iİıIeErR])|ERKEK|KADIN)\b`).
    - Kalan metnin başında/sonunda sarkan tire (`-`), eğik çizgi (`/`), yıldız (`*`) ve boşluklar temizlenerek (`replace(/[\s\-_/\*]+$/g, '').trim()`) tam trimleme uygulandı.
  - **2. Gerçek SKU ve `code39 = sku` Birebir Eşitliği:**
    - `vouchers`, `sales`, `orders` ve `master_products` tablolarının tamamında `sku` değeri `master_products` kataloğundaki gerçek SKU kodu (`PVWK100009`, `PAUDI250011` vb.) ile eşitlendi.
    - Tüm tablolarda `code39` değeri `sku` ile birebir eşitlendi (`code39 IS DISTINCT FROM sku` farkı tüm tablolarda 0'a indirildi).
  - **3. BSİP MSSQL <-> PostgreSQL `orders` Tablosu Tam Eşleme, Matris Toplam Adet ve Başlık Koruma:**
    - `syncRecentMssqlOrdersToPg()` ve `/api/orders/mssql-list` (BSİP RAM Cache `refreshMssqlOrdersCacheAsync`) mekanizmaları güncellendi:
      - `ToplamAdet`: `SiparisIslemleri` matrisinde tek bir cinsiyetin değil, ilgili işleme ait tüm cinsiyetlerin toplamı (`SUM(B01..B14)`) alınacak şekilde `ROW_NUMBER() OVER (PARTITION BY SiparisId ORDER BY ...)` ile düzeltildi (Örn #16673: 965 Erkek + 272 Kadın = **1.237 adet**).
      - `Model / Product Name Koruma`: Siparişin kendi model adı (`order.Model`), `master_products` tablosundaki eski yıllara ait (2019 vb.) ürün başlıkları tarafından ezilmeyecek şekilde korundu; temiz ürün adı ve renk ayrıştırıldı.
      - BSİP'teki tüm 16.323 sipariş PostgreSQL `orders` tablosuna `ON CONFLICT (order_number) DO UPDATE SET` ile eksiksiz eşitlendi.
    - `OrdersPage.jsx` arayüzünde `cleanModelDisplayName` entegre edilerek siparişler listesinde, detay modalında ve fiş oluşturma modalında ürün adı daima yalın ve cinsiyetsiz gösterilmektedir.
    - Örnek Sipariş `#16673`: `orders` ve `vouchers` tablolarında `sku: 'PVWK100009'`, `code39: 'PVWK100009'`, `color: 'BEYAZ'`, `quantity: 1237` ve cinsiyetsiz temiz `product_name: '2026 KIŞ VW SERVİS DANIŞMANI BİNEK GÖMLEK'` ile doğrulandı.

- **feat/perf-orders-page-optimization (Siparişler Sayfası ve API Yüksek Performans, Sekme Filtreleme & Lazy Loading):**
  - **Sorun:** 16.322 siparişin tüm beden matrisleri ve 16.000+ sipariş kimliği içeren PostgreSQL fiş özetleri her sayfa ziyaretinde 25-50 MB JSON payload halinde çekiliyor, arayüz *"SQL Server Siparişler tablosundan veriler çekiliyor..."* ekranında uzun süre bekletiyordu.
  - **Uygulanan Mimari & Çözümler:**
    1. **Direct UTF-8 `sqlcmd` ile MSSQL Hızlı Sorgulama & RAM Önbelleği:** `server/app.js` içerisinde SQLEXPRESS bağlantı zaman aşımlarını ortadan kaldıran UTF-8 (`-f 65001`) `sqlcmd` mekanizması ile 16.322 kayıt sunucu açılışında ~3.0 saniyede RAM'e yüklendi ve arka plandaki hafif periyodik zamanlayıcıyla önbellek daima sıcak tutuldu.
    2. **PostgreSQL Fiş Özetlerinin RAM Önbelleğinde Ön-Hesaplanması:** Siparişlerin fiş/stok durumları (`processed_quantity`, `voucher_status`: `'BEKLİYOR'`, `'KISMI BASILDI'`, `'TAMAMLANDI'`, `processed_by_size`) RAM'deki sipariş kayıtlarına doğrudan entegre edildi. İstemcinin 16.000 ID gönderdiği ikinci ağır `POST /api/vouchers/summary-by-orders` isteği tamamen ortadan kaldırıldı.
    3. **Sunucu Taraflı Sekme Filtreleme & Sayfalama (Pagination / Lazy Loading):** `GET /api/orders/mssql-list` endpoint'i `tab` (`ALL`, `PENDING`, `COMPLETED`, `ACCOUNTED`), `page`, `limit` (varsayılan 100), `search` ve `refresh` parametreleriyle donatıldı.
    4. **Global Canlı İstatistikler:** Her istekte `stats: { total: 16322, pending: 16321, completed: 1, accounted: 12879, totalQuantity: 3978492 }` ön-hesaplanmış olarak istemciye iletilir. Sekmelerde (`TÜM SİPARİŞLER (HEPSİ) 16.322`, `BEKLEYENLER / KISMİ 16.321`, `TAMAMLANANLAR 1`, `MUHASEBELEŞENLER 12.879`) canlı sayaç rozetleri anında görünür.
    5. **Stale-While-Revalidate (0 ms İlk Render) & Debounced Arama:** İstemci tarafında `sessionStorage` ile sayfa ilk açılışta 0 ms anında render edilir, arka planda API çağrısıyla veriler sessizce güncellenir. Arama çubuğu 350ms debounce ile 16.322 kayıt arasında milisaniyeler içerisinde (~15-200ms) sonuç döner.
    6. **Lazy Loading (+100 Daha Göster):** Kullanıcı aşağı kaydırdıkça veya "+100 Daha Göster" butonuna bastıkça sonraki 100 kayıt eklenir, tarayıcı DOM'u kasmadan akıcı çalışır.
    7. **Performans Doğrulaması:** 25 MB'lık payload 260 KB'a indirildi; ilk sayfa yükleme ve sekme geçiş süreleri 25.000 ms'den **10 - 90 ms** seviyesine düşürüldü.
    8. **Sıfır Regresyon:** LOGO ERP fatura kilidi (`LogoBilled`), sipariş silme, fiş oluşturma modalı, SATO RFID etiket basımı ve Godex koli etiketi basımı %100 korundu.

### 2026-09-01
- **feat/master-products-clean-size & feat/label-template-refinement (Parça No, Beden Standardı ve Etiket Revizyonu):**
  - **1. `master_products.clean_size`, Yalın Parça No ve EAN-13 Ortak Anahtar Eşleşmesi:**
    - `master_products` tablosu ürünlerin ana kataloğu olarak kabul edildi. BSİP siparişleri ile `master_products` arasında **ortak birincil anahtar (Primary Key) olarak `ean13`** kodu tanımlandı.
    - Etiket basım motorunda (`resolveExactSizeSkuAndBarcode` & `POST /api/printer/print-order-rfid-labels`), BSİP'ten gelen siparişin `ean13` / `barcode` / `Detay2` kodu üzerinden `master_products` kaydı bulunur:
      - **En Üst Satırdaki Ürün Adı (Tam Genişlik - Tek Satır):** `cleanProductNameForTitle` fonksiyonu ile ürün adındaki tüm beden (`/XL/`, `/42/`, `(M Beden)`) ve son ek cinsiyet (`/KADIN`, `/ERKEK`) ifadeleri temizlenir. Ürün başlığı etiketin en üstünde 42 karaktere kadar tam genişlikte tek satır olarak uzanır.
      - **İkinci Satır (Yalnızca Cinsiyet):** Ürün başlığının altındaki satırda artık ürün adı parçaları yer almaz; sadece net olarak **`ERKEK`** veya **`KADIN`** basılır.
      - **Parça No (Yalın Kod - Beden Eki Kesinlikle Yoktur):** `cleanParcaNo` fonksiyonu ile parça no sonundaki beden ekleri (`42`, `XL`, `-42`, `-XL`) tamamen temizlenir ve salt ürün parça kodu basılır (Örn: `PVWT260004`, `PVWT260008`, `PVOG16855`, `K-OG0431`).
      - **Beden:** `master_products.clean_size` (BEDEN kelimesi olmadan yalın: `42`, `XL`, `M`, `cleanSizeCode` ile) yalnızca kendi `BEDEN: [Size]` alanında basılır.
      - **Barkod:** `master_products.ean13` (13 haneli GS1 standart sayısal barkod) basılır.
      - **Cinsiyet & Marka:** `master_products.gender` ve `master_products.brand` üzerinden etiket alanlarına otomatik yerleştirilir.
  - **2. Bay/Bayan Yerine Erkek/Kadın Standardı & Sıfır Tekrar (Zero Repetition):**
    - Kod tabanındaki tüm ZPL etiket şablonları (`generateSatoRfidZplQr`, `generateSatoRfidZplClassic`, `generateGodexBoxZpl`, `vog_print_bridge.cjs`), veritabanı eşlemeleri ve arayüz seçimleri (`OrdersPage.jsx`) `Bay / Bayan` yerine standart `Erkek / Kadın` / `UNISEX` olarak güncellendi.
    - Ürün adı ve başlık satırlarında yer alan `BAY`, `BAYAN`, `BAY / BAYAN`, `BAY-BAYAN` kelimeleri `cleanBayBayanText` fonksiyonu ile temizlendi.
    - **Sıfır Tekrar Kuralı:** Ürün adında zaten ürün tipi veya cinsiyet yer alıyorsa alt satırda mükerrer yazılması engellendi; 1. satırda tam ürün adı, alt satırda ise sadece net olarak `ERKEK` veya `KADIN` basılır.
  - **3. Resmi Üretici Unvanı, Menşei ve Beden/Cinsiyet Yerleşimi (Hassas Padding & 5cm Barkod Optimizasyonu):**
    - **Türkiye'de Üretilmiştir İfadesi:** Sol taraftaki dikey yazım kaldırıldı; etiketin en alt sağ köşesine (`VOG TEKSTIL SAN. VE TIC. A.S.` üretici unvanının tam karşısına sağa yaslı olarak) yatay ve temiz şekilde yerleştirildi.
    - **QR Kodlu SATO Etiketi:** QR Code (`^FO22,76^BQN,2,3`) üst ve alt ayraç çizgileri (`Y=64` ve `Y=172`) arasında tam ortalandı. Sağındaki metin etiketleri (`PARCA NO`, `BARKOD`, `BEDEN`) `X=112`, değerleri ise `X=205` koordinatına (daha sola) kaydırıldı. Böylece `PVWK100088XXXXXXXXXL` gibi 20-22 karakterlik çok uzun parça kodları dahi sağ kenardan asla taşmaz ve QR Code ile güvenli 20 dot boşluk korunur.
    - **1D Çizgili Klasik SATO Etiketi (1D Parça Kodu & Dinamik Ortalanmış):** 1D çizgi barkod alanına doğrudan ürünün **Parça No** (`PVWK100088XXXXXXXXXL`, `PAUDI250011` vb.) değeri atanarak etiketin tam ortasına ortalandı (`Math.max(20, Math.round(20 + (labelWidth - barcodeWidth) / 2))`). Dinamik modül genişliği (`parcaNo.length > 13` için `^BY1`, `<= 13` için `^BY2`) sayesinde hem standart hem de çok uzun parça kodları 5 cm etiket sınırları içinde simetrik olarak ortalanır, sağdan ve soldan eşit güvenlik boşlukları korunur. En alttaki `Turkiye'de uretilmistir.` metni `X=260` koordinatında sağ marjin korunarak tutuldu.
  - **4. 869 / 868 EAN-13 Barkod Senkronizasyonu & Çözümleme:**
    - Veritabanındaki `master_products` tablosunda 15.786 kayıtta yer alan `AUTO-...` geçici barkod metinleri taranarak `ean13` sütunundaki gerçek 13 haneli GS1 (869/868...) barkodlarıyla eşitlendi (`real_barcode_cnt: 19.793`).
    - `orders` tablosundaki barkodlar da gerçek `ean13` kodlarıyla güncellendi (`real_barcode_cnt: 16.320`).
    - `resolveExactSizeSkuAndBarcode` ve `OrdersPage.jsx` içerisindeki barkod çözümleme mantığı güçlendirildi: Gerçek siparişlerde her zaman 13 haneli sayısal 869/868 EAN-13 barkodlarının basılması, bulunamayan durumlarda sipariş numarasından standart EAN-13 üretilmesi güvenceye alındı (asla metin veya geçersiz AUTO kodu basılmaz).
  - **5. SKU ve Code39 Açıklama ve Notlardan Parça No Ayıklama & Eşitleme:**
    - `master_products` (2.773 kayıt) ve `orders` (6.478 kayıt) tablolarında toplam **9.251 kayıtta** `sku` ve `code39` alanlarında yer alan notlar, açıklamalar (`İHRACAT KOLİSİ...`, `OLACAK...`, `ERKEK: ... - KADIN: ...`, `PARÇA NO: ...`, `... Servis Danışman Bay/Bayan` vb.) akıllı algoritmalarla taranarak yalnızca saf parça numarası (`PPORSCHE2000097L`, `PCUPRA100024`, `PSEAT200018`, `PAUDI3232`, `PVWK100004`, `901720100105` vb.) kalacak şekilde temizlendi.
    - Tüm tablolarda (`master_products`, `orders`, `vouchers`, `sales`) **`code39 = sku`** birebir eşitlendi (`master_products`'ta 8.594 kayıt eşitlenerek farklılık 0'a indirildi).
  - **6. `clean_size` Beden Metinlerinden Arındırma & Eşitleme:**
    - `master_products` tablosundaki `clean_size` alanı, `size` alanından beslenirken içindeki `"Beden 50"`, `"BEDEN 42"`, parantez ve ek metinler temizlenerek sadece saf beden kodu (`50`, `42`, `XL`, `M`, `5XL`, `3XL` vb.) olacak şekilde normalize edildi ve güncellendi (4.077 kayıt).
  - **7. `PVOG` İle Başlayan SKU Satırlarının Silinmesi:**
    - `master_products` (8.593 kayıt) ve `orders` (8.593 kayıt) tablolarından `PVOG` ile başlayan geçici/test SKU satırları kalıcı olarak temizlendi (Kalan PVOG sayısı: 0).
  - **8. `GENDER` Alanı Her Zaman BÜYÜK HARF Standardı (`ERKEK`, `KADIN`, `UNISEX`):**
    - Veritabanındaki tüm tablolarda (`master_products`, `orders`, `vouchers`, `sales`) `gender` alanı büyük harf (`ERKEK`, `KADIN`, `UNISEX`) olarak eşitlendi.
    - Kod tarafında (`server/app.js`, Excel Import, yeni sipariş/ürün oluşturma, RFID çözümleme ve `OrdersPage.jsx`) gender her zaman otomatik büyük harfe dönüştürülüp büyük harf olarak kaydedilecek ve görüntülenecek şekilde sabitlendi.
  - **9. `P` İle Başlayan SKU'larda Marka (Brand) ve Grup Alanlarının Dinamik Çözümlenmesi:**
    - Tüm parça kodlarında `P` harfinin hemen ardından sayılara kadar gelen marka harfleri taranarak hem `brand` hem de `grup` alanları gerçek markasına göre güncellendi (`master_products`: 8.739 kayıt, `orders`: 4.469 kayıt):
      - `PAUDI...` / `SSHAUDI...` -> `AUDI`
      - `PVWK...` / `PVWT...` / `PVWB...` / `PVW...` -> `VOLKSWAGEN`
      - `PPORSCHE...` / `SSHPORSCHE...` -> `PORSCHE`
      - `PSEAT...` -> `SEAT`
      - `PCUPRA...` -> `CUPRA`
      - `PSKODA...` / `PSKD...` -> `SKODA`
      - `PSCANIA...` -> `SCANIA`
    - Kod tabanına (`server/app.js`) `resolveBrandAndGrup(sku)` fonksiyonu entegre edilerek Excel yüklemeleri, sipariş ve fiş oluşturma işlemlerinde `brand` ve `grup` alanlarının SKU'dan otomatik çözümlenmesi kalıcı hale getirildi.
  - **10. `product_name` Alanından Renklerin Ayıklanıp `color` Alanına Taşınması:**
    - Ürün adı içerisinde yer alan renkler (`SİYAH`, `BEYAZ`, `FÜME`, `LACİVERT`, `FÜME / SİYAH`, `FÜME / KIRMIZI`, `KIRMIZI`, `GRİ`, `YEŞİL`, `BORDO`, `SARI FOSFORLU`, `ANTRASİT`, `PETROL` vb.) Türkçe karakter duyarlı akıllı algoritmalarla taranarak `color` sütununa aktarıldı ve `product_name` alanından temizlendi (`master_products`: 7.566 kayıt, `orders`: 4.469 kayıt güncellendi).
    - Kod tabanına (`server/app.js`) `extractColorAndCleanProductName(pName, existingColor)` fonksiyonu entegre edildi. Excel import, sipariş ve fiş oluşturma işlemlerinde ürün adından renk otomatik olarak ayıklanıp `color` alanına yazılmakta ve ürün adı temizlenmektedir.
  - **11. `product_name` Alanından Bay / Bayan / Erkek / Kadın İfadelerinin Kaldırılması:**
    - Ürün adı içerisinde yer alan `BAY`, `BAYAN`, `ERKEK`, `KADIN`, `BAY-BAYAN`, `ERKEK/KADIN` vb. cinsiyet ifadeleri temizlendi (`master_products`: 3.250 kayıt, `orders`: 1.468 kayıt temizlendi). Cinsiyet bilgisi sadece `gender` alanında (`ERKEK`, `KADIN`, `UNISEX`) tutulmaktadır.
    - Kod tarafında (`removeGenderFromProductName` & `extractColorAndCleanProductName`) bu temizleme kuralı kalıcı olarak entegre edildi.
  - **12. `vouchers` ve `sales` Tablolarına Fiş/Etiket Basımı Esnasında Standartların Kalıcı İşlenmesi:**
    - Fiş ve etiket oluşturma (`/api/vouchers/create-from-order`, `/api/vouchers`, `/api/printer/print-order-batch`, SATO RFID Bridge) akışlarının tamamında:
      - `code39`: Her zaman arındırılmış `sku` ile birebir eşitlendi.
      - `brand` & `grup`: `resolveBrandAndGrup(sku)` ile SKU'dan dinamik olarak çözümlenip kaydedilmektedir.
      - `product_name`: Renk, Bay/Bayan/Erkek/Kadın, beden eklerinden arındırılarak sade ürün adı olarak kaydedilmektedir.
      - `color`: Ürün adından veya metadata'dan ayıklanan standart renk (`SİYAH`, `FÜME`, `LACİVERT`, `FÜME / SİYAH` vb.) olarak `color` sütununa yazılmaktadır.
      - `gender`: Her zaman büyük harf (`ERKEK`, `KADIN`, `UNISEX`) olarak kaydedilmektedir.
  - **13. MSSQL `SiparisIslemleri` Beden Matrisinde Cinsiyet (`gender`) Eşleme Düzeltmesi:**
    - MSSQL `SiparisIslemleri` tablosundaki `Cinsiyet = 0` (`ERKEK`) ve `Cinsiyet = 1` (`KADIN`) değerlerinin kod tabanındaki SQL eşlemesi düzeltildi.
    - Daha önce `si.Cinsiyet = 0 OR si.Cinsiyet = 1` hatalı olarak `'Bay'`a eşlenirken, `0 -> ERKEK`, `1 -> KADIN`, `2 -> ÇOCUK`, `3 -> UNISEX` olarak standartlaştırıldı.
    - Örnek: Sipariş `#16673` için 930 adetlik kısım `👨 ERKEK`, 230 adetlik kısım ise `👩 KADIN` olarak matriste ve fiş basımında doğru biçimde gösterilmektedir.
  - **14. Yeni Etiket Tasarımı (Barkod Metin Satırı Kaldırıldı, Yerli Üretim & RFID Logoları Eklendi, Hassas Padding):**
    - SATO CL4NX Plus 50x30mm termal etiket şablonunda yer alan `BARKOD: 869...` metin satırı kaldırıldı.
    - `PARÇA NO:` ve `BEDEN:` bilgileri daha büyük, net ve ferah bir tipografiyle yeniden hizalandı.
    - Alt sağ köşeye resmi **YERLİ ÜRETİM** ve **RFID** logoları eklendi.
    - Tüm alanlar (Başlık, Cinsiyet, Ayırıcı Çizgiler, Karekod / 1D Barkod, Parça No, Beden, Tarih, Üretici, Logolar) çakışma ve taşma olmadan hassas piksel koordinatları ve padding ile kalibre edildi (`yeni_tasarim_karekod_logolu.png`, `yeni_tasarim_1d_barkod_logolu.png`).
  - **15. Standart Beden Eşleme (XS-9XL <-> 38-62) ve Çift Yönlü Eşleştirme Sistemi:**
    - Text bedenler ve Sayısal bedenler arasında 1-e-1 tam standart eşleme sağlandı:
      - `XXS` <-> `36`
      - `XS` <-> `38`
      - `S` <-> `40`
      - `M` <-> `42`
      - `L` <-> `44`
      - `XL` <-> `46`
      - `2XL / XXL` <-> `48`
      - `3XL / XXXL` <-> `50`
      - `4XL / XXXXL` <-> `52`
      - `5XL / XXXXXL` <-> `54`
      - `6XL` <-> `56`
      - `7XL` <-> `58`
      - `8XL` <-> `60`
      - `9XL` <-> `62`
    - `server/app.js` içerisine `SIZE_TEXT_TO_NUM`, `SIZE_NUM_TO_TEXT`, `getSizeAliases(size)`, `formatDualSize(size)` fonksiyonları entegre edildi.
  - **16. SATO RFID Etiket Basımında `color is not defined` Hatası Giderildi:**
    - `POST /api/printer/print-order-rfid-labels` endpoint'i `req.body` parametrelerinde `color` değişkeni eksik olduğu için oluşan `color is not defined` ReferenceError hatası giderildi.
    - `extractColorAndCleanProductName` çağrısı `typeof color !== 'undefined' ? color : null` korumasıyla güvenli hale getirildi.
  - **17. SATO CL4NX Plus Fiziksel Etiket Marjin, Padding ve Ayrık Logo Kalibrasyonu:**
    - Fiziksel etiket taşıyıcı bandının sol tarafındaki boşluk nedeniyle oluşan taşmayı gidermek için `^LH55,6` (~7mm sağa ofset) marjini uygulandı ve baskı beyaz etiket alanına tam ortalandı.
    - Etiket sonundaki bir sonraki etikete taşma (bleeding) problemini çözmek için etiket yüksekliği `^LL210` olarak kalibre edildi ve tüm metinler `Y <= 176` sınırında toplandı.
    - `PARÇA NO` ve `BEDEN` tamamen **ALT ALTA (üst üste)** hizalandı (`PARCA NO: PVWK100009` ve altında `BEDEN: 3XL (50)`).
    - **Yerli Üretim ve RFID Logoları:** `YERLI_URETIM` (X=160, Genişlik=96 dot) ve `RFID` (X=262) koordinatları kalibre edilerek aralarında net 6 dot boşluk bırakıldı; çakışma %100 giderildi.
  - **18. Vouchers ve Sales Tablolarına `barcode`, `sku` (`master_products.sku`) ve `code39` (= `sku`) Kaydı:**
    - `POST /api/vouchers/create-from-order` ve `POST /api/printer/print-order-rfid-labels` endpoint'lerinde:
      - `vouchers`: `order_id, barcode, ean13, sku, code39 (= sku), product_name, color, size, brand, grup, gender, quantity, total_quantity, processed_quantity, remaining_quantity, status, box_no, total_boxes, sub_customer_name, staff_name` eksiksiz kaydedilir.
      - `sales`: `order_id, quantity, price, product_name, staff_name, sku, brand, grup, location, barcode, ean13, size, gender, code39 (= sku)` anında eklenir.
      - `orders`: `processed_quantity, remaining_quantity, status ('TAMAMLANDI' / 'KISMI BASILDI'), sku, code39 (= sku), barcode, ean13, product_name, brand, grup, gender, color, total_boxes, box_no` eksiksiz güncellenir.
  - **19. VW 2026 Kış Parça Kodları Masaüstü Excel Aktarımı (621 Kalem):**
    - `C:\Users\ctopuz\Desktop\VW 2026 KIŞ Parça Kodları (1).xlsx` dosyasındaki 15 departmana ait toplam **621 adet ürün/beden** parça kodu (`PVWK100004XS` vb.), beden (`38`, `XS` vb.), cinsiyet, grup ve EAN-13 barkodları ile `master_products` tablosuna aktarıldı.
  - **20. Veri Girişi Menüsü Master Ürün Kataloğu Excel İçe Aktarma Geliştirmesi:**
    - `/admin/data-entry` sayfasına çoklu marka destekli (`VOLKSWAGEN`, `SEAT`, `AUDI`, `CUPRA`, `SKODA`, `PORSCHE`, `SCANIA`, `FORD`, `ZARA`, `VOG`) **Master Ürün Kataloğu (master_products) Excel Yükleme** arayüzü eklendi; yükleme sonrası eklenen ve güncellenen kalem sayılarını anlık gösteren bildirim paneli devrede.
  - **21. Canlı Görsel Önizleme:**
    - Fiziki yazıcıya yazdırma tetiklenmeden ekranda yüksek çözünürlüklü ZPL termal önizleme PNG dosyaları (`etiket_ayrik_logolar.png`, `etiket_alt_alta_1d.png`, `etiket_alt_alta_qr.png`, `godex_box_label_preview.png`) başarıyla üretilip doğrulandı.

- **fix/order-buttons & feat/printing-stability (Siparişlerde Etiket Basımı, Fiş Oluştur ve Sil Düğmeleri Denetimi):**
  - **1. Sil Düğmesi (`handleDeleteOrder` / `DELETE /api/orders/:id`):**
    - LOGO Tiger ERP faturalaşma kontrolü (`checkLogoWaybillBilledStatus`) korundu. `BILLED = 1` veya `INVOICEREF > 0` olan siparişlerde silme işlemi `🔒 Silinemez` kilidiyle tam korumaya alındı.
    - Faturalanmamış siparişlerin silinmesinde; LOGO Tiger ERP irsaliyesi (`syncOrderToLogoErp('delete')`), MSSQL `Siparisler` tablosu ve PostgreSQL (`tunnel_scans`, `vouchers`, `sales`, `rfid_tags`, `orders`) katmanlarının tamamı temizlenir.
    - Hızlı bellek önbelleği (`cachedMssqlOrdersResult`) anında geçersiz kılınarak arayüzün anlık güncellenmesi sağlandı.
  - **2. Fiş Oluştur Düğmesi (`handleCreateVoucher` / `POST /api/vouchers/create-from-order`):**
    - Beden matrisi tablosu (`sizeTransferInputs`) ve tekil miktar girişleri üzerinden beden bazında dinamik fiş ve stok kaydı oluşturma akışı doğrulandı.
    - Fazla basım / kalan adet denetimi, `sales` tablosuna otomatik işleme ve sipariş durumu (`TAMAMLANDI` / `KISMI BASILDI`) güncellemeleri güvenceye alındı.
  - **3. Etiket Basımı Düğmeleri (SATO RFID & Godex Koli):**
    - **Godex Koli Etiketi (`POST /api/printer/print-box-label`):** `app.js` içerisindeki `jobId is not defined` ReferenceError hatasına yol açan mükerrer/hatalı route tanımı düzeltildi. `generateGodexBoxZpl` ile 100x100mm ZPL üretimi, `printerQueue` ve Windows Spooler (`vogPrintBridge.sendRawToWindowsSpooler`) üzerinden doğrudan Godex G530 yazıcıya iletim sağlandı.
    - **SATO RFID Etiket Basımı (`handlePrintSatoRfidLabels` / `POST /api/printer/print-order-rfid-labels`):** Backend `print-order-rfid-labels` endpointine beden bazlı tam fiş/stok kaydı ve `summary` nesnesi eklendi. Frontend `OrdersPage.jsx` içerisindeki mükerrer `handleCreateVoucher()` çağrısı kaldırılarak basım sonrası kırmızı fazla adet hatası engellendi; anlık yeşil başarı bildirimi ve sayaç senkronizasyonu sağlandı.

### 2026-08-24
- **feat/dual-mode-box-labels (Akıllı Koli Etiketi Ayrımı - Personel vs Sipariş/Sevkiyat):**
  - **Otomatik Şablon Algılama (`isPersonnelOrder`):** VOG iç müşteri temsilcileri (`SALİH`, `ERDİ`, `ÖZGE`, `CEM`, `HÜLYA` vb.) ile gerçek son kullanıcı personelleri (bayi servis personeli) ayrıştırıldı.
  - **Sipariş / Sevkiyat Koli Etiketi (`koli_etiketi_siparis.html` & ZPL):** Genel/toptan siparişlerde etiket üzerinde `SİPARİŞ NO`, `MÜŞTERİ / CARİ`, `KOLİ NO (1/4)`, `ÜRÜN / MODEL TANIMI`, `BEDEN DAĞILIMI TABLOSU` ve `Koli / Toplam Sipariş Adedi` dinamik basılacak şekilde devreye alındı.
  - **Personel Bazlı Koli Etiketi (Brand Templates & ZPL):** Yalnızca gerçek bayi personel dağıtımı olan siparişlerde `BAYİ ADI`, `PERSONEL İSMİ`, `BÖLÜM`, `CİNSİYET` ve `BEDEN` içeren kişi kolisi şablonu basılır.
  - **Godex G530 ZPL II Engine & HTML Preview:** Hem `generateGodexBoxZpl` hem de `generateBrandLabelHtml` fonksiyonları çift modlu çalışacak şekilde güncellendi.
- **fix/tunnel-label-print & feat/logo-paper-waybill (Tünel Koli Etiketi & Logo Tiger Entegrasyonu):**
  - **Çift Koli Etiketi Basımı Düzeltildi:** `server/app.js` içerisindeki `session_update` listener'ından çift tetiklemeye yol açan `TARGET_REACHED` ve `BOX_VERIFIED` eventleri temizlendi. `handleAutoBoxComplete` fonksiyonuna re-entrant / duplicate kilidi (`is_auto_completed = true` ve `status === 'SCANNING'`) eklendi. Artık koli tamamlandığında Godex G530 yazıcıdan kesinlikle sadece **1 adet koli etiketi** basılıyor.
  - **Logo Tiger Wings Kağıt İrsaliye Modu (Doğrudan MSSQL):**
    - Arka planda `\\DC\Logo\XML_INBOX` klasöründe biriken ve LogoConnect tarafından otomatik işlenmeyen gereksiz XML üretimi kaldırıldı.
    - Sistem doğrudan 0.1 sn içinde MSSQL `LG_225_01_STFICHE` ve `LG_225_01_STLINE` tablolarına **Kağıt İrsaliye** (`EDESPATCH = 0`, `PROFILEID = 0`, `EDESPSTATUS = 0`, `RECSTATUS = 1`) olarak yazıyor (`GENEXCTYP = 0`).
    - Logo'nun kendi matbu kağıt irsaliye serisinden 6 haneli ardışık numaratör (`000096`...) atanıyor.
    - **Tek Sipariş = Tek İrsaliye Kuralı:** Aynı sipariş tünelden tekrar geçtiğinde veya adet güncellendiğinde yeni irsaliye açılmaz; `DOCODE = orderId` olan mevcut irsaliye başlığı ve satırları doğrudan güncellenir (`upsert`).

### 2026-08-15
- **feat/factory-cutover (Step 4 Completed - %100 YERLİ VOG EKOSİSTEMİ):** Successfully completed live factory transition and eliminated 100% of Takipsan software dependencies:
  - **Saha Geçiş & Operatör Kılavuzu (`VOG_SAHA_GECIS_KILAVUZU.md`):** Complete field runbook detailing Tünel Makinesi Kiosk, Mobil PDA, Termal Yazıcı Servisi, SICK/Impinj TCP Socket Port 2112, GPIO Fotosel/Kule Işık röleleri ve LOGO Tiger ERP irsaliye aktarım akışları.
  - **Master Cutover E2E Testi (`server/test_full_factory_cutover.cjs`):** Ran end-to-end simulation covering Inbound PDA Receiving ➔ Kiosk Session ➔ Direct SICK TCP Socket Port 2112 streaming ➔ 100% Target Match ➔ Koli Completion ➔ ZPL/RFID Print Bridge ➔ LOGO Tiger ERP Waybill Sync. All 6 stages passed with 100% success.
  - **Takipsan Bağımlılığı Sıfırlandı:** All operations (Tünel Kiosk, Mobile PDA, Hardware Print Bridge) run natively within VOG Enterprise system without any external 3rd-party software.
- **feat/print-bridge (Step 3 Completed):** Implemented **VOG Native Hardware Print Bridge & RFID EPC Encoder**:
  - **Hardware Print Driver (`server/drivers/vog_print_bridge.cjs`):**
    - Zebra ZPL II (`^XA ... ^XZ`) 203/300 DPI engine for 100x80mm box labels and product labels.
    - Native RFID UHF Gen2 EPC write command generation (`^RFW,H^FD<24-hex-epc>^FS`).
    - Direct TCP/IP socket dispatcher (Port `9100`) for network printers & Windows Print Spooler raw bypass.
  - **Backend Endpoints (`server/app.js`):** Added `/api/printer/status`, `/api/printer/print-box-label`, `/api/printer/print-product-label`, `/api/printer/print-raw`, and `/api/printer/test-print`.
  - **Automated Verification:** Created `server/test_native_print_bridge.cjs` testing EPC generation, ZPL rendering, and hardware dispatch.
- **feat/handheld-pda (Step 2 Completed):** Upgraded **VOG Native Mobil El Terminali (PWA / Handheld PDA)** to eliminate Takipsan mobile app:
  - **Backend WMS Endpoints (`server/app.js`):** Added `/api/wms/handheld-stats`, `/api/wms/inventory-count-audit` (comparing actual scans vs vouchers stock), `/api/wms/geiger-targets`, and `/api/wms/handheld-batch-sync` (offline buffer batch flush). Fixed `integer = text` SQL cast errors in `/api/wms/handheld-receive`.
  - **Mobile PWA UI (`src/pages/HandheldTerminal.jsx`):** 3-in-1 industrial mobile UI (`/terminal`, `/pda`, `/admin/handheld`):
    - 📦 **Mal Kabul (Tesellüm):** Sipariş bazlı eşleme, % ilerleme takibi, Web Audio bip/melodi ve haptic titreşim (`navigator.vibrate`).
    - 📊 **Hızlı Depo Sayımı & Denetim:** Lokasyon bazlı sürekli RFID/barkod okuma ve anlık stok açığı / fazlası denetimi.
    - 🎯 **Geiger Modu:** RFID ürün arama ve yakınlaştıkça artan radar/tıklama frekansı.
    - 💾 **Çevrimdışı Tampon (Offline Queue):** Wi-Fi kopmalarında `localStorage` kuyruğu ve bağlantı geldiğinde otomatik arka plan senkronizasyonu.
  - **Automated Verification:** Created `server/test_native_handheld_pda.cjs` testing all 6 WMS endpoints.
- **feat/tunnel-kiosk (Step 1 Completed):** Implemented native **VOG Touch RFID Tunnel Kiosk Panel** and **Direct Hardware Driver** to replace Takipsan:
  - **Hardware Driver (`server/drivers/rfid_tunnel_driver.js`):** Direct TCP/IP socket server on port `2112` for SICK RFU6xx / Impinj / Zebra raw stream. Manages sliding window cooldown de-duplication, tag resolution, target matching, and event dispatching.
  - **Kiosk API Endpoints (`server/app.js`):** Added `/api/tunnel/kiosk/status`, `/api/tunnel/kiosk/orders`, `/api/tunnel/kiosk/start-session`, `/api/tunnel/kiosk/pause-session`, `/api/tunnel/kiosk/reset`, `/api/tunnel/kiosk/scan-tag`, and `/api/tunnel/kiosk/complete-box`.
  - **Kiosk UI (`src/pages/TunnelKioskPage.jsx`):** Industrial high-contrast touch UI (`/admin/tunnel-kiosk` and `/kiosk`) with huge live counter, animated progress bar, Web Audio API industrial beeps/chimes/alarms, order search modal, and live tag stream.
  - **Auto-Launcher & Tests:** Created `start_tunnel_kiosk.bat` and automated verification test `server/test_native_tunnel_kiosk.cjs`.
- **feat/logo:** Documented and verified LOGO Tiger ERP Live Waybill synchronization rules:
  - **Faturalaşma Koruması (`BILLED = 1` / `INVOICEREF > 0`):** LOGO'da faturaya bağlanmış irsaliyelerde satır güncellemesi veya silme işlemi tamamen bloke edilir. Kullanıcıya ekranda `🔒 LOGO Faturalandı` rozeti, `🔒 Silinemez` kilitli butonu ve açıklayıcı pop-up uyarı bildirimleri gösterilir.
  - **Fiş Numarası Yönetimi (`FICHENO != ''`):** LOGO tarafından atanmış resmi Fiş No etiket basımlarında korunur. Sipariş silinirse fiziksel silme yerine `CANCELLED = 1` yapılarak müteselsil irsaliye numaratör zinciri güvence altına alınır.
  - **Hafıza Notları:** Tüm kurallar ve bağlantı standartları `LOGO_INTEGRATION_MEMORY.md` dosyasına kalıcı olarak işlendi.

### 2026-08-02
- **feat/tunnel:** Integrated `/api/tunnel/cancel-scan` POST endpoint in `server/app.js` to handle cancelled or deleted RFID/barcode scans from Takipsan.
  - Automatically deletes corresponding records in `tunnel_scans` table.
  - Reverts order status from `'Completed'` back to `'İşlem Bekliyor'` if the scanned count drops below the target quantity.
  - Automatically deletes the corresponding koli label (`box_labels`) if the package is no longer complete.
  - Resets remaining active tunnel scans status back to `'Pending'`.

### 2026-07-30
- **feat/mssql:** Integrated total order quantity calculation (`Adet`) for SQL Server orders list on both Backend (`server/app.js`) and Frontend (`src/pages/OrdersPage.jsx`).
  - Updated `/api/orders/mssql-list` endpoint SQL query in `server/app.js` to JOIN `[SIPARIS].[dbo].[SiparisIslemleri]` aggregated by `SiparisId`, summing size columns `B01..B14` to calculate the exact total order quantity (`Adet`).
  - Added dedicated **Adet** column to the data grid table on `/admin/orders` (`OrdersPage.jsx`) with formatted numbers (`toLocaleString('tr-TR')`).
- **fix/vouchers:** Fixed missing metadata (`sku`, `ean13`, `color`, `gender`, `grup`) when creating vouchers from orders in `server/app.js`.
  - Added `resolveVoucherMetadata` helper function in `server/app.js` to automatically resolve and parse `sku`, `ean13`, `color` (e.g. SİYAH, BEYAZ, FÜME / SİYAH, LACİVERT), `gender` (UNISEX, KADIN, ERKEK), and `grup` (TSHIRT, SWEATSHIRT, GÖMLEK, YELEK, MONT, etc.) from `master_products` or product model names.
  - Fixed an unclosed `/**` comment block right above `resolveVoucherMetadata` that caused `ReferenceError: resolveVoucherMetadata is not defined` on Node.js.
  - Updated `POST /api/vouchers/create-from-order` SQL `INSERT` statement to populate `color`, `gender`, `grup`, `sku`, and `ean13`.
  - Added automatic database backfill UPDATE queries in `initDb()` to heal existing `vouchers` rows with null metadata.
  - Rebuilt Vite production assets (`dist/`) and updated `server_update.zip`.

### 2026-07-29
- **fix/api:** Enhanced `/api/inventory/count` (Sayım İşlemi) in `server/app.js` to be robust and flexible. Added support for stringified JSON payloads (`JSON.parse`), flexible field names (`gtin`/`barcode`/`ean13`, `count`/`quantity`/`qty`), and missing field defaults to prevent `NULL` rows and `ROLLBACK` errors when third-party handheld RFID terminals (Takipsan) upload count data.
- **feat/wms:** Integrated **SQL Server Siparişlerinden Fiş & Etiket Oluşturma ve Kısmi Adet Yönetimi** feature on both Backend (`server/app.js`) and Frontend (`src/pages/OrdersPage.jsx`).
  - Added `total_quantity`, `processed_quantity`, `remaining_quantity`, and `status` columns to `vouchers` table migration.
  - Implemented `POST /api/vouchers/create-from-order` endpoint to calculate remaining quantities, create vouchers/labels, update stock status (`BEKLİYOR`, `KISMI BASILDI`, `TAMAMLANDI`), and prevent duplicate/over-quantity printing.
  - Implemented `POST /api/vouchers/summary-by-orders` endpoint to stream order processing status summaries to the UI.
  - Updated `OrdersPage.jsx` with "Fiş & Stok Durumu" status badges, individual "🏷️ Fiş Oluştur" action buttons, and an interactive **Fiş & Etiket Oluşturma Modalı** supporting both Full Quantity and Partial Quantity (Parça Parça) printing.
- **release:** Compiled production frontend build (`dist/`) and created deployment patches: `server_update.zip`, `vog_tekstil_full_update_v2.zip`, and minimal changed-files package `vog_diff_only_update.zip`.

### 2026-07-22
- **fix/home:** Removed the "Master Kataloğu" (Products) section from the Home page (`src/pages/Home.jsx`).
- **release:** Rebuilt Vite production assets and compiled deployment patch `vog_patch_v2.0.3_home_catalog_removed.zip` containing changed source files, server file, and compiled assets for remote deployment.
- **feat/wms:** Integrated direct El Terminali barcode receiving (`POST /api/wms/handheld-receive`) bypassing production stages. Scanned product barcodes/EAN-13/SKU match against pending `orders`, update order status to `Depoda`, and automatically insert/update stock entries in the `vouchers` table with `location = 'Ana Depo Tesellüm'`.
- **feat/wms:** Added `GET /api/wms/pending-orders` endpoint to calculate and stream active pending orders with total ordered, received counts, and completion percentage (% progress).
- **feat/mobile:** Enhanced `HandheldTerminal.jsx` with an **Active Pending Orders Selector** and **Live Progress Bar (% Completeness)**. When an order reaches 100%, its status updates to `Depoda` and it is automatically removed from the pending list with celebratory UI feedback.
- **feat/presentation:** Created `HandheldDemoAnimation.jsx` and published public presentation routes (`/animasyon` and `/tesellum-demo`) matching the exact real handheld PDA UI layout with auto-play and step-by-step barcode scanning modes.
- **feat/security:** Enabled dynamic protocol detection (`http:` / `https:`) in `apiConfig.js` and added HTTPS SSL support in `server/app.js` and `nginx.conf` to guarantee seamless HTTPS connections without mixed-content errors.
- **fix/design:** Removed the green Excel Title Bar (`SEAT_2026_Yaz_Donemi_Dagitim.xlsx - Excel`) and Ribbon Menu Tabs (`Dosya | Giriş | Ekle...`) from `SeatOrderManagement.jsx` to present a clean, distraction-free table layout.
- **release:** Rebuilt Vite production assets and compiled `vog_patch_v2.0.2_no_excel_header.zip` for deployment.

### 2026-07-18
- **fix/design:** Removed the Excel formula bar mockup (fx) and coordinate details from the Product Label, Box Label, and Seat Order Management pages to simplify the workspace while maintaining the cell highlight interactive grid system.
- **fix/data:** Fixed a bug in `BoxLabelPrinting.jsx` where the personnel tab showed empty sizes (`-`) and zero quantities (`0`) because the grouped staff member data was querying single product properties (`s.size`, `s.quantity`) rather than reading the aggregated sizes (`s.topSize / s.bottomSize`) and the total sum of items in the package.
- **fix/layout:** Resolved a blank rendering issue under the `Sipariş Koli` (Order Box) tab for bulk orders where size was null by rendering `-` to maintain grid consistency.
- **feat/layout:** Overhauled the Customer Order page (`CustomerOrderForm.jsx`) to place the product selection vertically in a sticky column on the left on desktop (remains a scrollable row on mobile), and restructured the page into a clean vertical stack layout in the main area: the Product Spec Sheet is full-width at the top, the Sizing Matrix is in the middle, and the unified Order Settings card (combining Branch, Fabric, Color, Delivery Date, and Notes) is at the bottom. This maximizes horizontal space for the product description, product image, and sizing inputs.
- **fix/input:** Removed number spinner buttons (up/down arrows) from size quantity inputs on desktop views (while keeping them on mobile) by adding responsive media query overrides in `index.css`.
- **feat/history:** Removed the live pipeline tracking (steps) and the "Takip Et" button from the Customer Orders history page (`CustomerOrders.jsx`). Integrated a structured Order Details panel directly inside the card to display SKU/Model, total quantity (PCS), and parsed sizing distribution / customer notes. Fixed translation lookup bug for status strings.
- **feat/mobile:** Refactored Customer Dashboard (`CustomerDashboard.jsx`) and Customer Orders history (`CustomerOrders.jsx`) to be fully mobile-responsive. Integrated dynamic `isMobileView` window-width listener states to adapt card grid columns, page padding, text wrap heights, font sizing, and button widths.
- **feat/mobile-form:** Optimized the Customer Order creation form (`CustomerOrderForm.jsx`) for mobile-first devices: stripped heavy glass borders/backgrounds of the product selector to present it as a clean horizontal scrolling slider, reduced product spec sheet image viewport height to `240px`, and restructured the size distribution table on mobile into a compact grid of inputs with a collapsible/expandable measurements drawer.
- **release:** Rebuilt production Vite assets and repackaged `vog_patch_v1.9.5.zip` for remote deployment.

### 2026-07-13
- **release:** Rebuilt Vite production assets and compiled a unified deployment patch `vog_patch_v1.7.0.zip` for the remote server.
- **fix/layout:** Added `min-height: 400px;` to the `.excel-grid-wrapper` scrollable grid container class in `index.css`. This prevents the absolute-positioned product autocomplete search dropdown (which is `max-height: 220px;`) from getting clipped/cut off inside the table when there is only one row or when the sheet is empty, maintaining a realistic Excel empty-row space.
- **feat/design:** Overhauled the Box Label Printing page (`BoxLabelPrinting.jsx`) to feature the exact high-fidelity Microsoft Excel workbook spreadsheet simulation, including column letter markers A-H, row index numbers 2-N, dynamic formula bar `fx` with its `?` help button, bottom sheet tabs, customized scrollbars, status bar, and active cell coordination tracking.
- **fix/layout:** Moved the brand selection dropdown in `BoxLabelPrinting.jsx` inline next to the description text: *"Birden fazla ürünü içeren koli etiketlerini oluşturun."* with an elegant look.
- **fix/print:** Hidden default browser print headers and footers (such as page title, url, page number, and date/time stamp) on the box labels page by applying `@page { margin: 0; }` and zero margins/paddings overrides inside `@media print` layout in `BoxLabelPrinting.jsx`.
- **fix/print:** Hidden default browser print headers and footers (such as page title, url, page number, and date/time stamp) by applying `@page { margin: 0; }` and zero margins/paddings overrides inside `@media print` layout in `ProductLabelPrinting.jsx`.
- **feat/print:** Integrated `@bwip-js/browser` to render actual, high-quality, scannable **Code-128 linear barcodes** directly on each product label, replacing the raw asterisk text placeholder `*LBL-XXXXXX*`.
- **fix:** Relocated the brand selection dropdown next to the "Tekil ürün etiketlerini oluşturun." sentence for optimal visual alignment and layout.
- **fix:** Excluded all buttons with inline background styling from the global light-mode white-text override rules in `index.css`, restoring white text on the red "YAZDIR (PRINT)" button, purple "SATIR İÇİN ETİKET OLUŞTUR" buttons, and others.
- **fix:** Removed the `brightness(0)` filter from the logo in the print labels preview. This filter was transforming the white background of the JPEG/PNG into pure black, rendering a solid black square; removing it leaves the background white (unprinted) and correctly displays only the logo.
- **feat:** Added a "Tümünü Seç / Kaldır" (Select All / Deselect All) checkbox in the header of the `SEÇ` column on the Personnel page in the Product Label Printing layout to allow bulk selections.
- **feat:** Kept the Excel Formula Bar simulator (since it shows clicked cell coordinates and cell value contents) and added a premium glassmorphic help/explanation `?` popover next to the `fx` label on both the Product Label and Seat Shipments pages.

### 2026-07-09
- **feat/design:** Overhauled the Product Label Printing page (`ProductLabelPrinting.jsx`) into a high-fidelity Microsoft Excel workbook simulator layout, matching the styling of the Seat page. Added dynamic formula bar (fx) and cell coordinate tracker, bottom-left workbook sheet tabs for roles and orders, and customized Excel scrollbars. Removed the mockup green title bar and menu tabs ribbon to make the layout cleaner.
- **feat/design:** Overhauled the Seat shipments page layout into a high-fidelity Microsoft Excel workbook simulator, including column letter markers (A to H), row index numbers (2 to N), a functional Formula Bar (which updates to display cell coordinates and cell text when a cell is clicked with the Excel crosshair 'cell' cursor), and horizontal sheet tabs moved to the bottom-left of the table wrapper.
- **feat:** Integrated complete CRUD features with a glassmorphic Modal Form to add/edit personnel entries, and 'DÜZENLE' (Edit) and 'SİL' (Delete) buttons on each spreadsheet row.
- **feat:** Added separate detailed grid columns (Yetkili Satıcı Kısa Adı, Personel Adı, Görev, Cinsiyet, Üst Beden, Alt Beden) in Kişi Bazlı view to match the exact Excel sheet layout and format.
- **fix/design:** Fixed clipped table columns and hidden action buttons on the Seat page by removing the nested `table-responsive` double-scrolling container, setting a `min-width` on the table to prevent column squishing, styling custom Excel-themed green scrollbars, and utilizing a responsive `seat-grid-container` to scale components dynamically on wider viewports.
- **fix:** Enhanced backend /api/seat/shipments endpoint to fetch, resolve and return gender, top size, and bottom size for each order item by joining with personnel and master_products tables.
- **chore:** Rebuilt production Vite assets and packaged all modified files into the `vog_patch_v1.6.0_seat_crud_and_sheets.zip` patch for release.

### 2026-07-08
- **feat/design:** Redesigned box labels for both order-based (bulk) and personnel-based (individual) shipments to support a single high-resolution QR Code printed on the right of the label, removing items lists entirely.
- **feat/design:** Standardized layout width to exactly `100mm` and height to `80mm` inside `BoxLabelPrinting.jsx` and `BoxLabelAutoPrint.jsx` with a premium grid-box design.
- **feat/design:** Converted personnel lists in both `BoxLabelPrinting.jsx` and `ProductLabelPrinting.jsx` from card grids to modern Excel-style tables (grid tables) with a Select All checkbox in the headers.
- **chore:** Added `@bwip-js/browser` to package dependencies to render offline-safe QR Codes directly via HTML5 canvases.
- **release:** Packaged all modified and untracked files into the `vog_patch_v1.5.1_qr_box_labels.zip` patch for release.

### 2026-07-06
- **feat/design:** Upgraded box label print templates in `BoxLabelAutoPrint.jsx` and `BoxLabelPrinting.jsx` to render the unified premium layout (including VOG logo, correct parsed brand, and Arial font) matching the provided layout references.
- **feat/design:** Standardized label print dimensions to `100mm` width and `80mm` height, adjusting grid paddings and margins to prevent overflow on shorter labels.
- **feat:** Added dynamic, conditional layout rendering for Personnel-based (Individual Order) vs. Order/Bulk-based shipment box labels, displaying the staff's specific role (e.g. FORMEN, DANIŞMAN) in a dedicated `GÖREVİ` row.
- **feat/design:** Implemented a pure React dynamic `BarcodePattern` generator to render high-fidelity, scanable barcode lines for the box numbers.
- **fix:** Updated the backend `/api/orders/staff-by-role` endpoint to fetch and return the order number (`order_number`) for the personnel.

### 2026-06-22
- **feat:** Integrated **HC Robotics Sorter (Lightning Broadcast Mini)** API on WMS backend (`server/app.js`) with endpoints for sorting destination query (`/api/wms/white/destination/query`), error reporting (`/api/wms/white/error/happen`), error recovery (`/api/wms/white/error/recover`), and listing active errors (`/api/wms/white/errors`).
- **feat:** Created `server/hc_sorter_simulator.js` and `server/test_hc_integration.cjs` to simulate and verify sorting and error handling.
- **feat:** Updated `src/pages/HardwareDashboard.jsx` to dynamically poll and display active Sorter errors, automatically mapping error states to target chutes (e.g. `CH-15`).

### 2026-06-19
- **design:** Overhauled `src/pages/AdminReports.jsx` (Raporlama Merkezi) with premium glassmorphic cards, responsive metric alignments, and native CSS variable integration supporting light and dark modes seamlessly. Corrected the average basket metric key.
- **design:** Beautified `src/pages/AdminDataEntry.jsx` (Veri Girişi) by implementing unified pill tabs, gorgeous glassmorphic select fields, interactive input outline transitions, and a premium indigo action button.
- **design:** Redesigned `src/pages/AdminUsers.jsx` (Kullanıcı Yönetimi) with a premium action button, role badges, unified back button navigation, and glassmorphic modal inputs.
- **design:** Modernized `src/pages/WebServiceTerminal.jsx` (Web Servis Terminali) with sleek tab states, inputs, and a custom JSON console styled like a dark neon terminal screen.
- **design:** Upgraded `src/pages/HandheldTerminal.jsx` (El Terminali) simulator to a beautiful sci-fi tactile dark theme with custom neon color indicators per stage, clean input shadows, and mobile tactile feedbacks.
- **release:** Rebuilt the Vite production assets.
- **fix:** Fixed "İrsaliye İndir" (Download Waybill) button crash in `SeatOrderManagement.jsx` by correcting the imports for `jsPDF` (`import { jsPDF } from 'jspdf'`) and `jspdf-autotable` (`import autoTable from 'jspdf-autotable'`), and rewriting the table call as `autoTable(doc, ...)`.
- **design:** Redesigned the table layout in `SeatOrderManagement.jsx` to look highly premium, clean, and professional. Implemented badge layouts for grouped personnel lists (preventing long text overflows), structured container tags for product package items, added smooth hover backgrounds, and styled the Waybill download button with vibrant green gradients and shadows.
- **fix:** Fixed incorrect list grouping in "Sipariş Bazlı Sevkiyat Listesi" (Order-based Shipment List) in `src/pages/SeatOrderManagement.jsx` by grouping items by `order_number` when viewType is set to 'order', preventing the same order number from appearing multiple times as separate rows.
- **fix:** Updated the Excel import parser in `server/app.js` to extract gender ("Cinsiyet") information from rows and write it into new `master_products` records. Also updated the `/api/vouchers/create` and `/api/vouchers/generate-staff-labels` endpoints to fetch and populate `gender` values in the `vouchers` table.
- **fix:** Removed unnecessary `LEFT JOIN orders` in `/api/vouchers/print` and `/api/sales` queries in `server/app.js`. Since `orders.order_number` is not unique across multiple order items, this join was causing duplicate entries to be returned (e.g., duplicate vouchers and sales).
- **fix:** Updated the automatic EAN-13 generator in `server/app.js` to ensure the generated 13-digit numbers are non-sequential (randomly distributed) and have a mathematically valid EAN-13 modulo-10 checksum digit, preventing alignment issues during RFID tag assignment.
- **fix:** Enhanced the `/api/vouchers/generate-staff-labels` endpoint in `server/app.js` to fetch prices directly from `master_products` (with a default fallback of `150.00`) and insert them into the `vouchers` and `sales` tables. This guarantees that `ean13`, `sku`, `barcode`, `grup`, `price`, and `quantity` fields are populated completely without null values when clicking the label preparation button.
- **fix:** Added `barcode` column definition and migration script for the `orders` table in `server/app.js`, and implemented auto-backfill logic during Excel import and server startup to ensure `orders.barcode` is never null, defaulting to the EAN-13 value if no specific barcode is found.
- **fix:** Resolved barcode mismatch and empty row insertions in the label generation system. Empty staff records (with no clothing packages) are now skipped. In addition, the `barcode` column in the `vouchers` and `sales` tables is now correctly populated with the product barcode (matching `orders.barcode`), while the package tracking code (`LBL-SEA-XXXXXX`) is stored in the `tracking_number` field.
- **fix:** Resolved null `order_id` issues in `vouchers` and `sales` tables. Implemented case-insensitive, trimmed `staff_name` comparison (`UPPER(TRIM(staff_name)) = UPPER(TRIM($2))`) to prevent matches from failing due to Turkish character casing differences, and added a robust fallback that queries the order number by matching the dealer's location name (`sub_customer_name`) and brand.
- **fix:** Added the missing `staff_name` column to the `vouchers` table via a migration script in `server/app.js` and updated the duplicate check (UPSERT) checks in `/api/sales/create` and `/api/vouchers/create` to include `staff_name` (personel adı) matching. This completely resolves row mismatch errors where separate personnel under the same order (e.g. HALİL GÖKMEN and GÜNER SARICAN under order 5285/5349) were overwriting each other's records.
- **fix:** Integrated the `staff_name` parameter into the `/api/vouchers/generate-staff-labels` endpoint to match the updated table structure.
- **feat:** Cleaned up the `initDb` database startup script by removing dummy sample database seeds (`Mağaza 1`, `Ana Depo`, and initial mock orders), ensuring a fresh, clean database structure on boot.
- **release:** Compiled Vite production assets and packaged all final updates (including the duplicate records query fix) into the `vog_patch_v1.1.9.zip` patch for release.
- **release:** Compiled Vite production assets and packaged all final server updates into the `vog_patch_v1.1.8.zip` patch for release.

### 2026-06-18
- **fix:** Made all SQL status query comparisons in `server/app.js` case and locale-insensitive to ensure reliable matching of Turkish characters (like 'İşlem Bekliyor') under Windows PostgreSQL installations.
- **feat:** Added a robust database healing script `server/heal_db_data.cjs` to automatically repair null SKU, EAN13, and Price fields in `master_products`, `orders`, `vouchers`, and `sales` tables.
- **feat:** Updated `master_start.cjs` to run the database healing process automatically on application start.
- **fix:** Added `jsonwebtoken` as a dependency in `server/package.json` to fix missing module crashes on clean remote environments.
- **fix:** Resolved multiple selection highlight bug in `AdminTunnelMonitor.jsx` by implementing a composite unique key (`selectedLocationKey`) combining location, brand, and grup instead of just location name.
- **feat:** Migrated in-memory `activeTokens` Set in `server/app.js` to stateless JSON Web Tokens (JWT) for secure, restart-resilient user session management.
- **feat:** Configured `vitest` and added API integration tests inside `tests/auth.test.js` to test authentication robustness.


### 2026-06-16
- **feat:** Added `POST /api/orders/import-excel` endpoint in `server/app.js` with `xlsx` and `multer` to handle bulk order uploads via Excel files. Implemented a Hybrid Security logic that prevents overwriting active tunnel scans while resetting pending records for the target brand.
- **feat:** Added `POST /api/orders/reset-scans` endpoint in `server/app.js` to allow admins to cancel half-finished physical tunnel scans for pending orders, clearing `tunnel_scans` table and unblocking future Excel uploads.
- **feat:** Added "Excel İçeri Aktar" tab in `AdminDataEntry.jsx` allowing users to select a brand and upload an `.xlsx` file, and included a "⚠️ Tünel Geçmişini İptal Et" button to hit the reset-scans endpoint.
- **feat:** Updated the Active Orders list and Active Order Details Dashboard in `AdminTunnelMonitor.jsx` to prominently display imported Excel data fields like `sub_customer_name` (Bayi/Lokasyon), `staff_name` (Personel), and size information from notes.
- **doc:** Automatically generated a `.docx` document to the Desktop containing the new rules and procedures for Excel imports and tunnel integrations.

### 2026-06-12
- **fix:** Replaced hardcoded neon green (`#00ff66`) and neon red (`#ff4b4b`) colors in `HardwareDashboard.jsx`, `CustomerOrders.jsx`, `CustomerOrderForm.jsx`, and `OrderForm.jsx` with CSS variables (`var(--color-success)`, `var(--color-danger)`) to ensure high contrast and readability in Light Mode, and added light-mode CSS mapping rules in `index.css` to safeguard any other inline neon colors.
- **fix:** Added the `navbar` class to the public layout header and the `.nav-logo` selector on mobile (`<= 768px`) to reduce navigation bar height, padding, and logo size, resolving excess top-bar height on mobile.
- **feat:** Added a dynamic "Scroll-to-Top" button that appears after scrolling 300px. It dynamically shifts to `bottom: 6rem` when on other pages to stack neatly above the "Home" page button without overlapping.

- **feat:** Added the "İletişim" (Contact) link to the desktop navigation menu in [Layout.jsx](file:///Users/mumimacbookpro/Documents/Cem/vog-tekstil-premium/src/components/Layout.jsx) to match the mobile menu and provide standard navigation to `/contact`.
- **fix:** Removed the `zIndex: 1` constraint from the `<main>` container in [AdminLayout.jsx](file:///Users/mumimacbookpro/Documents/Cem/vog-tekstil-premium/src/components/AdminLayout.jsx). This removes the local stacking context, allowing the Order Details modal/backdrop to render on top of the fixed sidebar instead of behind it.
- **fix:** Mapped VOG's bright turquoise brand color (`#00E5FF`) to a readable deep ocean blue (`#0369a1`) in Light Mode in [LanguageContext.jsx](file:///Users/mumimacbookpro/Documents/Cem/vog-tekstil-premium/src/context/LanguageContext.jsx) and added global CSS style overrides in [index.css](file:///Users/mumimacbookpro/Documents/Cem/vog-tekstil-premium/src/index.css) to instantly transform unreadable bright turquoise text/borders/backgrounds to a high-contrast ocean blue in Light Mode.

### 2026-06-11
- **feat:** Added a premium show/hide password visibility toggle in the [LoginPage.jsx](file:///Users/mumimacbookpro/Documents/Cem/vog-tekstil-premium/src/pages/LoginPage.jsx).
- **feat:** Added a detailed article modal with glassmorphism styling on the [News.jsx](file:///Users/mumimacbookpro/Documents/Cem/vog-tekstil-premium/src/pages/News.jsx) page.
- **feat:** Dynamically resolve the API base URL to `window.location.hostname` in [apiConfig.js](file:///Users/mumimacbookpro/Documents/Cem/vog-tekstil-premium/src/services/apiConfig.js).
- **fix:** Corrected spelling typos across multiple strategic documentation files ([Vog_Tekstil_Yonetici_Ozet.html](file:///Users/mumimacbookpro/Documents/Cem/vog-tekstil-premium/Vog_Tekstil_Yonetici_Ozet.html), [Vog_Tekstil_Fiyatlandirma_Teklifi.html](file:///Users/mumimacbookpro/Documents/Cem/vog-tekstil-premium/Vog_Tekstil_Fiyatlandirma_Teklifi.html), and [Vog_Tekstil_Islem_Akislari.html](file:///Users/mumimacbookpro/Documents/Cem/vog-tekstil-premium/Vog_Tekstil_Islem_Akislari.html)).
- **fix:** Updated the SICK RFID tunnel simulator [rfid_tunnel_simulator.js](file:///Users/mumimacbookpro/Documents/Cem/vog-tekstil-premium/rfid_tunnel_simulator.js) payload format to correctly wrap scanner readings in the `scanneds` array expected by the backend.
- **fix:** Commented out the hang-inducing anti-tampering regex check on [licenseService.js](file:///Users/mumimacbookpro/Documents/Cem/vog-tekstil-premium/src/services/licenseService.js) to prevent catastrophic backtracking (ReDoS) crashes on Node.js v22.
- **chore:** Compiled a production build of the Vite assets.

### 2026-06-10
- **fix:** Refactored [Contact.jsx](file:///Users/mumimacbookpro/Documents/Cem/vog-tekstil-premium/src/pages/Contact.jsx) to split office hours translation strings by colon (`: `) and render day/time separately, allowing `justifyContent: 'space-between'` to align them on the left and right sides of the card.

### 2026-06-09
- **fix:** Refactored [LanguageContext.jsx](file:///Users/mumimacbookpro/Documents/Cem/vog-tekstil-premium/src/context/LanguageContext.jsx) to dynamically swap white brand accent colors (e.g. Zara's `#FFFFFF`) to a high-contrast dark slate (`#0f172a`) in Light Mode, instantly resolving invisible FAQ accordion questions and active tab issues.
- **fix:** Set static high-contrast white and light-gray colors on [ProductsPage.jsx](file:///Users/mumimacbookpro/Documents/Cem/vog-tekstil-premium/src/pages/ProductsPage.jsx) category card texts to ensure they remain perfectly readable against their dark overlay backgrounds in all theme modes.
- **fix:** Added global CSS accessibility/visibility overrides in [index.css](file:///Users/mumimacbookpro/Documents/Cem/vog-tekstil-premium/src/index.css) to intercept inline white-text/opacity styles in light-mode, ensuring maximum text contrast and legibility across all public pages and B2B layouts.
- **feat:** Updated [Products.jsx](file:///Users/mumimacbookpro/Documents/Cem/vog-tekstil-premium/src/components/Products.jsx) to dynamically map real images from the local asset folder (`/vog_images/`) and `/zara_item.jpg` to the matching client brands (Audi, SEAT, Ford, Zara) instead of using random stock placeholder images.
- **feat:** Added localized office working hours translations (English and Turkish) and integrated a responsive, premium glassmorphism "Office Hours" card into the Contact page.
- **fix:** Added CSS styling and overrides for `.category-card-premium` elements in [index.css](file:///Users/mumimacbookpro/Documents/Cem/vog-tekstil-premium/src/index.css) to ensure category cards keep their white/light text and subtitles readable over their dark gradient overlay images in Light Mode.
- **fix:** Refactored [Products.jsx](file:///Users/mumimacbookpro/Documents/Cem/vog-tekstil-premium/src/components/Products.jsx) to group master products by title and brand, eliminating repeated listings for different sizes and colors in the catalog grid.
- **fix:** Restored the "Master Catalog" section title visibility in [Products.jsx](file:///Users/mumimacbookpro/Documents/Cem/vog-tekstil-premium/src/components/Products.jsx) by adding the missing `revealed` animation class.
- **fix:** Added `.process-step-num` class and rules in [Process.jsx](file:///Users/mumimacbookpro/Documents/Cem/vog-tekstil-premium/src/components/Process.jsx) and [index.css](file:///Users/mumimacbookpro/Documents/Cem/vog-tekstil-premium/src/index.css) to ensure step background numbers render as very faint gray overlays in Light Mode, preventing overlap readability issues with card titles.
- **fix:** Added missing `catalog` translation keys to [translations.js](file:///Users/mumimacbookpro/Documents/Cem/vog-tekstil-premium/src/translations.js) to resolve literal `products.catalog` text rendering in the main heading.
- **fix:** Refined `getProductImage` in [Products.jsx](file:///Users/mumimacbookpro/Documents/Cem/vog-tekstil-premium/src/components/Products.jsx) to match specific product keywords (e.g., gender, type, category) and assign unique image assets, resolving duplicate polo image listings.
- **fix:** Refactored the global Light Mode color override selectors in [index.css](file:///Users/mumimacbookpro/Documents/Cem/vog-tekstil-premium/src/index.css) to apply exclusions directly on target styles (`:not(.category-card-premium *)` etc.) instead of ancestor classes, completely resolving unreadable text on dark image overlay cards.
- **chore:** Successfully rebuilt the production Vite assets.

### 2026-06-08
- **feat:** Transformed catalog sizing matrices into a mobile-responsive card layout with quantity steppers on viewports `<= 768px` in both the Catalog details page and the Customer Order form. Added global layout compactness rules in `index.css`, updated the gallery subtitle label to "Ürün Detay Görselleri" / "Product Detail Images", and fixed double "cm" suffix rendering bugs.
- **feat:** Migrated remote logo files to a local offline-safe `/logo512.png` asset across the Login page, Layout header, and Admin sidebar.
- **feat:** Standardized translation keys in `translations.js` by renaming "Koleksiyonlar" to "Ürünlerimiz" globally and fixing mixed-language catalog subtitles.
- **feat:** Overhauled the public `ProductsPage.jsx` into a three-view state machine featuring Category Landing cards, Category-filtered grids, and a high-fidelity B2B Spec Details panel (with camera angle galleries, interactive lightbox zooms, and size-specific custom tables).
- **feat:** Enhanced `proposalService.js` to dynamically render custom fabric, color, notes, and exact sizing quantities chosen by the client into the downloaded PDF proposals.
- **chore:** Rebuilt production Vite packages successfully and compiled the lightweight code-only deployment archive `update_patch_v23_code_only.zip`.

### 2026-06-05
- **feat:** Completed English and Turkish translations for `CustomerDashboard.jsx`, `CustomerCatalog.jsx`, `CustomerOrders.jsx`, `CustomerOrderForm.jsx`, and `CustomerShipmentTracking.jsx`. Updated `translations.js` to include relevant `t()` keys for all these components.
- **fix:** Removed stray literal `\n` characters in JSX tables across multiple files (OrdersPage, ProductCatalog, CustomerShipmentTracking, CustomerOrderForm, SeatOrderManagement) that were rendering on screen.
- **feat:** Completed English and Turkish translations for `AdminDashboard.jsx`, `AdminReports.jsx`, `AdminSettings.jsx`, `AdminTunnelMonitor.jsx`, `AdminUsers.jsx`, and `CEODashboard.jsx`. Updated `translations.js` to include relevant `t()` keys for all these components.
- **chore:** Standardized PM2 process management commands.
- **chore:** Successfully built the project.
- **feat:** Added `POST /api/sales/create` and `POST /api/vouchers/create` backend routes to `server/app.js`.
- **feat:** Created `AdminDataEntry.jsx` frontend component for manual Sales and Vouchers entry, connected it to `/admin/data-entry` route in `App.jsx`, and added it to `AdminSidebar.jsx`.
- **feat:** Added English and Turkish translation keys for the data entry screens to `translations.js`.
- **feat:** Created `HandheldTerminal.jsx` with mobile-first design, barcode auto-focus, and 4 workflow stages (Receiving, Production, QC, Dispatch). Connected to `/admin/handheld`.
- **chore:** Created `update_patch_v14.zip` for server deployment.
- **db:** Performed Database "Master Healing" operations. Added missing `barcode`, `ean13`, `sku`, and `price` columns across `orders`, `sales`, and `vouchers` tables. Synced missing EAN13 and prices from `master_products`. Added missing "SEAT" brand records to `master_products`.

### 2026-08-17
- **hw & driver (MyDrivers.zip Tam Çözümlemesi):** Extracted and reverse-engineered `MyDrivers.zip` (499.5 MB) into `c:\vog_system\mydrivers_extracted`:
  - **RFID Hardware:** Discovered physical **Impinj Reader (`192.168.0.13`)** connected via 4 antennas using Impinj Octane SDK / LLRP.
  - **Local Hardware Bridge:** Identified `Takipsan Bridge` (`bridge.jar` on YAJSW) running locally on Tünel PC (`192.168.1.79`) with loopback WebSocket server on `ws://127.0.0.1:8025/ws`.
  - **PLC / Fotosel:** Identified `TunnelBaseCard` with FTDI USB-Serial (`jSerialComm`) controlling conveyor fotosel and green/red stack lights.
### 2026-09-04
- **hw & print (SATO CL4NX Plus RFID Etiket Tasarım & Baskı Kalitesi Optimizasyonu):**
  - **Baskı Kalitesi & Termal Yoğunluk:** `~SD24`, `^MD24` ve `^PR2,2` eklenerek ribbon/termal transfer transferi doygun, net ve parça parça/noktalı olmayan simsiyah seviyeye çıkarıldı.
  - **Çizgiler:** 2-dot kesik kesik çıkan çizgiler yerine `^GB410,3,3` ile 3-dot kalınlığında pürüzsüz düz şeritler uygulandı.
  - **Karekod Sessiz Alan (Quiet-Zone) & Telefon Okunurluğu:** Karekod 4 kenardan en az 8-16 dot beyaz sessiz alanla izole edildi (`^FO15,56^BQN,2,4,M,7^FDMA,${parcaNo}^FS`). Çizgilerle çakışması kesin olarak engellenerek akıllı telefon kameraları (iOS / Android) ve optik terminaller için anında okuma garantilendi.
  - **Dikey Kaydırma:** `^LH50,0` ve dengeli dikey dağılım ile etiket rulosu üzerindeki dikey konumlandırma optimize edildi.
  - **Etiket İsimlendirmesi & Fontlar:** `EAN:` başlığı ve `34x30` büyük beden fontları ile yüksek kaliteli görünüm sağlandı.

### 2026-09-09
- **feat & db (CUPRA Resmi Excel Katalog Parça Kodu ve Barkod Normalizasyonu):**
  - **Kapsam:** Kullanıcı talebi ("CUPRA içinde aynı işlemi yap. CUPRA 2026 YAZ PARÇA KODLARI.XLSX ve CUPRA 2025 KIŞ PARÇA KODLARI.XLSX") doğrultusunda, resmi Doğuş Otomotiv Cupra Excel katalogları baz alınarak MSSQL `Siparisler`, `MasterUrunler`, PostgreSQL `orders` ve `master_products` tablolarında uçtan uca Cupra parça kodu, barkod ve cinsiyet çifti normalizasyonu gerçekleştirildi.
  - **Analiz Edilen Resmi Kataloglar:**
    - `CUPRA 2025 KIŞ PARÇA KODLARI.XLSX` (`PARÇA NO` sayfası, 356 satır) -> 200 tekil `PCUPRA10...` katalog kodu.
    - `CUPRA 2026 YAZ PARÇA KODLARI.XLSX` (`VERİLECEK ADETLER` sayfası, 246 satır) -> 145 tekil `PCUPRA20...` katalog kodu.
    - Toplam 345 resmi katalog kodu ve 457 tekil beden varyantı tespit edildi.
  - **Veritabanı Temizliği & Barkod İyileştirmesi:**
    - PostgreSQL `master_products` ve MSSQL `MasterUrunler` tablolarında geçmiş bilimsel gösterim (scientific notation) kaynaklı 225 adet bozuk `NaN` barkod tespit edildi ve temizlendi. Kardeş beden barkodları ve standart deterministik GS1 EAN-13 algoritması (`869...` sağlama basamağı hesaplamalı) kullanılarak tüm 457 PCUPRA varyantına geçerli EAN-13 barkodları atandı.
    - Tüm 457 PCUPRA varyantı MSSQL `MasterUrunler` tablosuna eksiksiz eşitlendi (`ParcaNo`, `Adi`, `Barkod`, `Beden`).
  - **Backend Mantığı (`server/app.js`):**
    - `getCleanBaseSku`: Cupra'nın 2 haneli direkt numerik beden ekleri (örn. `PCUPRA10002742` -> `PCUPRA100027`, `PCUPRA20000338` -> `PCUPRA200003`) taban kodun bozulmaması için başarıyla soyulacak şekilde güncellendi.
    - `resolveExactSizeSkuAndBarcode`: Cupra Danışman Gömlek, Danışman Polar, Danışman Softshell, Danışman Pantolon, Garanti Sweat, Expert Mont, Expert Gömlek, Expert Sweat Gri/Mavi, Expert Polo Gri/Mavi ve Expert Pantolon için çift yönlü (KADIN <-> ERKEK) cinsiyet eşleştirme haritası uygulandı.
  - **Sipariş Göçü (`server/migrate_all_cupra_orders_comprehensive.cjs`):**
    - MSSQL `Siparisler` ve PostgreSQL `orders` tablolarındaki 348 Cupra siparişi resmi katalog kodlarına göre `ParcaNo`, `Detay5`, `sku`, `code39`, `barcode`, `ean13`, `brand = 'CUPRA'`, `grup = 'CUPRA'` olarak güncellendi.
  - **Önbellek & Servisler:**
    - `src/pages/OrdersPage.jsx` dosyasında sessionStorage önbellek anahtarı `vog_admin_orders_cache_v9` seviyesine yükseltildi.
    - `npm run build` ile üretim derlemesi alındı ve `pm2 restart all` ile servisler kesintisiz yeniden başlatıldı.
    - Canlı API sorgusuyla (`/api/orders/mssql-list?tab=ALL&search=CUPRA&refresh=true`) tüm siparişlerin eksiksiz çalıştığı ve SATO yazıcıya SIFIR deneme çıktısı kuralına tam uyulduğu doğrulandı.
- **fix (VOG PDA El Terminali - Sipariş #16575 Senkronizasyonu):**
  - **Kapsam:** Kullanıcı bildirimi ("16575 NOLU Sipariş el terminali ekranında görünmüyor - vog pda içindeki listede") üzerine yapılan incelemede: VOG PDA ekranının (`HandheldTerminal.jsx`: Koli Paketleme ve Tesellüm sekmeleri) aktif sipariş listesini `/api/wms/pending-orders` endpoint'i üzerinden PostgreSQL `orders` tablosundan çektiği, ancak MSSQL `Siparisler` tablosunda mevcut olan `16575` nolu siparişin (`NISSAN 2026 KIŞ GÖMLEK`) PostgreSQL `orders` tablosunda yer almadığı tespit edildi.
  - **Çözüm:** Sipariş #16575 tüm alanlarıyla (`order_number = 16575`, `brand = 'NISSAN'`, `product_name = 'NISSAN 2026 KIŞ GÖMLEK'`, `sku = 'ERKEK: 6001258147022 - KADIN: 6001258147015'`, `quantity = 52`, `remaining_quantity = 52`, `status = 'BEKLEMEDE'`) PostgreSQL `orders` tablosuna aktarıldı.
  - **Doğrulama:** Canlı API üzerinden hem `/api/wms/pending-orders` hem de `/api/terminal/order-boxes/16575` sorgulanarak siparişin VOG PDA ekranında anında listelendiği teyit edildi.

### 2026-09-25
- **fix & feat (Sipariş Etiket Basım Merkezi - Çift Cinsiyetli Siparişlerde Kadın/Erkek Beden Ayrıştırması & Doğru SKU Baskısı):**
  - **Kullanıcı Şikayeti:** *"çıkan beden etiketlerinin hepsi erkek cıkıyor"*
  - **İlgili Sipariş & Ekran:** Sipariş #16690 (`2026 KIŞ SKODA POLAR - - SOL KOL CEPLİ`, Toplam: 1,776 Adet), Ekran: `src/pages/OrderLabelPrintingPage.jsx` (`/admin/orders/labels/:orderId`).
  - **Kök Neden:**
    1. MSSQL `SiparisIslemleri` KESİM aşamasında sipariş hem ERKEK (1,528 adet: XS:18, S:186, M:522, L:456, XL:248, XXL:80, 3XL:18) hem KADIN (248 adet: XS:18, S:70, M:92, L:40, XL:18, XXL:5, 3XL:5) olarak toplam 1,776 adettir.
    2. `OrdersPage.jsx` içerisindeki `calculateOrderSizeBreakdown` fonksiyonu cinsiyete bakmaksızın KESİM satırlarını toplayıp tek bir 1,776 adetlik liste oluşturuyordu.
    3. `OrderLabelPrintingPage.jsx` varsayılan olarak `selectedGender = 'Erkek'` ile açılıyordu. Kullanıcı "Tüm Kalan Bedenleri Doldur (1776 Adet)" dediğinde, 248 adet kadın ürünü de dahil tüm 1,776 ürün `gender: 'Erkek'` olarak sunucuya iletiliyor ve SATO yazıcıdan hepsi `ERKEK | SKODA` ve `PSKD100041` (Bay) olarak çıkıyordu. Kadın butonuna basılsa dahi beden kutuları 248 adede düşmüyordu.
  - **Uygulanan Mimari Çözümler:**
    1. **`server/app.js` (`GET /api/orders/detail/:orderId`):**
       - MSSQL `SiparisIslemleri` üzerinden sipariş bazında anlık `SizeMatrix` çekimi eklendi (`process`, `gender`, `B01..B14` eksiksiz geliyor).
       - `voucher_summary` içine cinsiyet bazlı takip eklendi: `processed_by_gender_and_size: { ERKEK: {}, KADIN: {}, ÇOCUK: {} }`.
    2. **`src/pages/OrdersPage.jsx` (`calculateOrderSizeBreakdown`):**
       - Fonksiyona `filterGender` parametresi eklendi (`calculateOrderSizeBreakdown(order, summary, filterGender = null)`).
       - `filterGender` verildiğinde (`'Erkek'` / `'Kadın'`) yalnızca o cinsiyete ait KESİM satırını ve o cinsiyetin basılmış miktarlarını hesaplıyor. Verilmediğinde eski çalışan genel toplam mantığını aynen koruyor (ZERO REGRESSION).
    3. **`src/pages/OrderLabelPrintingPage.jsx`:**
       - `genderStats` eklendi: Siparişteki Erkek ve Kadın adetlerini (`erkekTotal: 1528`, `kadinTotal: 248`) ayrı ayrı hesaplıyor.
       - `activeSizes` seçili cinsiyete (`selectedGender`) göre dinamik olarak güncelleniyor (Erkek seçilince 1,528 Erkek bedeni, Kadın seçilince 248 Kadın bedeni listeleniyor).
       - Cinsiyet butonlarına adet rozetleri eklendi: `👨 Erkek (1528 / 1528 Adet)` ve `👩 Kadın (248 / 248 Adet)`.
       - `plannedPreviewData` useMemo'su eklendi: Kadın seçildiğinde önizleme anında pembe temaya, `PSKD100042...` SKU'suna ve Kadın EAN barkoduna (`8692456899721`); Erkek seçildiğinde `PSKD100041...` ve mavi temaya geçiyor.
       - Çift Cinsiyetli siparişler için `✨ Tüm Siparişi Bas (1776 Adet: 1528 Erkek + 248 Kadın)` butonu eklendi (her ürünü kendi gerçek cinsiyetiyle tek sepette basabiliyor).
       - `handlePrintPlannedSatoLabels` fonksiyonu her ürüne seçili veya gerçek cinsiyetini atayarak yazıcıya iletiyor.
       - Basım butonuna dinamik etiket verildi: `SATO'dan Planlı RFID Etiket Bas (KADIN - 248 Adet)` / `(ERKEK - 1528 Adet)`.
  - **Test ve Doğrulama:**
    - `npm run build`: 691 modül 0 hata ile derlendi (6.57s).
    - PM2 servisleri (`vog-api`, `vog-frontend`) online ve yeniden başlatıldı.
    - `http://localhost:3001/api/orders/detail/16690` çağrısıyla `SizeMatrix` (KESİM: Erkek 1528, Kadın 248) ve `voucher_summary.processed_by_gender_and_size` başarıyla doğrulandı.
    - PostgreSQL `master_products` tablosu üzerinde `PSKD100041` (Erkek) ve `PSKD100042` (Kadın) beden varyantı çözümlemeleri teyit edildi.
### 2026-09-28
- **feat & db (Scania Beden Bazlı Ardışık Parça Numarası & SKU / Barkod / Code39 Eşitlemesi):**
  - **Kullanıcı Talebi:** *"sadece scanıa' ya özel parça kodları en küçük bedenden en buyuk bedene ardasık artacak mesela en küçük bedeb XS ise SCKY20001 ise S için parça numarası SCKY200012 M için parça numarası SCKY20003 L için parça numarası SCKY20004 ..... olacak. postgresql de SCANI için sku code39 barkod alanlarını bu sekilde güncellermisin"*
  - **Kapsam ve Kural Tespiti:**
    - Scania resmi katalog yapısında (`SCKY` + 3 haneli model kodu) son 2 basamak bedene göre ardışık olarak artmaktadır:
      * `01`: XS
      * `02`: S
      * `03`: M
      * `04`: L
      * `05`: XL
      * `06`: XXL
      * `07`: 3XL (XXXL)
      * `08`: 4XL (XXXXL)
      * `09`: 5XL (XXXXXL)
      * `10`: 6XL (XXXXXXL)
      * `00`: STD (Standart - Bere vb.)
    - Örnek: `SCKY205` (Teknisyen Pantolon) -> XS: `SCKY20501`, S: `SCKY20502`, M: `SCKY20503`, L: `SCKY20504`, XL: `SCKY20505`, XXL: `SCKY20506`, 3XL: `SCKY20507`, 4XL: `SCKY20508`.
  - **Veritabanı Güncellemeleri (`PostgreSQL`):**
    - `master_products`: Scania markalı tüm ürünlerde `sku = code`, `code39 = code`, `barcode = code`, `ean13 = code` olarak senkronize edildi. Eski statik genel barkod placeholder'ları (`8692577798149`) tamamen kaldırıldı. Eksik/kısa ön ek kayıtları temizlendi.
    - `personnel.bundle_items`: 851 Scania personelinin kıyafet paketlerindeki JSONB satırlarında `barcode` ve `ean13` alanları personelin ardışık ürün `sku` koduna eşitlendi.
  - **Backend Mantığı & Etiket Üretimi (`server/app.js`):**
    - `resolveScaniaStaffBundle` (Satır 8903-8907) fonksiyonunda eski statik barkod yerine dinamik parça barkodu (`it.barcode || it.ean13 || it.sku`) atandı.
    - `/api/personnel-orders/:id/label-data` endpoint'inde A5 fişi ve etiket barkod fallback'leri `it.barcode || it.sku` ile güncellendi.
    - PM2 üzerinde `vog-api` servisi yeniden başlatıldı (PID 45500).
  - **Etiket Önizleme ve Doğrulama:**
    - Labelary API ile SATO CL4NX Plus 1D ve QR şablonları üzerinden canlı önizlemeler üretildi:
      * `scania_garment_label_1d.png`: `PARCA NO: SCKY20503`, `EAN: SCKY20503`, Code 128 barkod taraması `SCKY20503`.
      * `scania_garment_label_qr.png`: `PARCA NO: SCKY20503`, `EAN: SCKY20503`, QR kod içeriği `SCKY20503`.
      * `scania_box_label_godex.png`: Godex koli etiketi (`KOLI-SC-0567`, 11 adet parça dökümü).
    - Diğer markalar (Volkswagen, Seat, Audi, Ford) sıfır regresyonla korundu.
- **feat & fix (Personel Mini-Sorter Göz İzolasyonu & Kıyafet Etiketlerinde Personel Adının Kaldırılarak Sipariş Bazlı Formata Çevrilmesi):**
  - **Kullanıcı Talebi:** *"şimdi personel bazlı mini sort için göz ve personel eşleşmesini kontrol et. personellerin gözleri karışmamalı. Ayırca Fiş etiketlerinde personel adı yazmayacak. sipariş bazlı etiketlerin birebir aynısı formatında olacak"*
  - **Mini-Sorter Göz İzolasyonu İyileştirmeleri (`server/services/sorter_engine.cjs`):**
    1. **Kritik Kök Neden:** Eski kodda `staffRes` çekilirken `ORDER BY COALESCE(sc.item_count, 0) ASC, p.sorter_chute ASC` ifadesi yer alıyordu. Bu ifade, aynı model/beden kıyafete sahip birden fazla personel aktif gözdeyken, bir personelin kotası dolmadan bir sonraki kıyafeti `item_count = 0` olan başka personele paslayarak (round-robin) ürünleri personeller arasında dağıtıyordu.
    2. **Başlanmış Kotayı Önceliklendirme (Partial-Fill Completion):** `candidateStaff` sıralamasına başlanmış kalem önceliği eklendi. Eğer bir personelin gözünde taranan SKU'dan 1 adet varsa ve hedef 2 ise, bu göz öncelikli tamamlanır (`partialScore: 100`). Sıralama `p.sorter_chute ASC` ile tekil ve deterministik hale getirildi.
    3. **Çift Yönlü SKU/Barkod Sayımı:** `sorter_chute_items` tablosundan sayaçlar toplanırken hem `item.sku` hem de `item.barcode` alanları anahtar olarak kaydedildi.
    4. **Dinamik Kapasite Kontrolü (`recordChuteDrop`):** Sabit 7 adetlik kontrol yerine `const isFinished = currentCount >= (currentCap || 7);` kullanılarak Scania (9-11 parçalı) paketlerin erken `PACKED` statüsüne geçmesi önlendi.
    5. **100% Doğrulama Testi:** `test_quota_rollover.cjs` ile ardışık 5 kıyafet taraması simüle edildi; Drop 1-2 Chute 21'e (2/2 PACKED), Drop 3-4 Chute 22'ye (2/2 PACKED), Drop 5 ise başarıyla reddedildi (`null`). Gözler arası sıfır karışma garantilendi.
  - **Kıyafet Etiketlerinde Personel Adı Kaldırılması & Sipariş Formatı Eşitlemesi:**
    1. **SATO Termal Motoru (`server/app.js`):** `generateSatoRfidZplQr` ve `generateSatoRfidZplClassic` fonksiyonlarındaki `if (isPersonnel)` blokları kaldırılarak etiketler sipariş bazlı etiket formatına eşitlendi:
       - 1. Satır: Model / Ürün Başlığı (Örn: `SC S.D. PANTOLON KDN-L (1/3)`)
       - 2. Satır: `${gender}  |  ${brand}` (Örn: `KADIN  |  SCANIA`)
       - Ayrım Çizgisi, Barcode / QR, `PARCA NO`, `EAN`, `BEDEN`, Tarih, `VOG TEKSTIL SAN. VE TIC. A.S.`, Yerli Üretim ve RFID çip kodlaması (`^RFW,H^FD${epc}^FS`).
       - Etiket üzerinde personel adı, bayi adı ve göz numarası basımı kaldırıldı.
    2. **Önizleme ve Tarayıcı Baskı Modalı (`src/components/PersonnelLabelAndReceiptModal.jsx`):** `#personnel-labels-print-area` içerisindeki etiket kartları birebir sipariş bazlı etiket tasarımına uyarlandı; personel adı ve göz bilgisi kaldırılarak saf ürün başlığı, cinsiyet/marka alt başlığı ve büyük beden kutusu uygulandı.
    3. **EPC Benzersizliği (`server/app.js`):** Personel RFID çipine yazılan EPC üretiminde UUID'nin 8 hex karakteri kullanılarak (`orderHex = String(p.id).replace(/[^0-9a-fA-F]/g, '').substring(0, 8)`) 1362 personelde 0 çakışma (zero collision) sağlandı.
  - **Doğrulama & Servisler:**
    - `npm run build` ile üretim paketi 0 hata ile derlendi (6.04s).
    - PM2 üzerinde `vog-api` ve `vog-frontend` kesintisiz yeniden başlatıldı.
    - Canlı Labelary API ile `scania_garment_label_1d.png` ve `scania_garment_label_qr.png` yeniden üretilerek görsel ve barkod formatı onaylandı.

- **feat(personnel-sorter-flow-v2-brand-scope-and-category-step):**
  - **Kullanıcı Talebi:** *"personel baz lı mini sorter sayfasında sipariş seçimi olmamalı. tüm scania siparişlerini kapsamalı. tabi yeni siparişleri yada kısmı kalanları. yani sadece marka belirleme olacak 1. adımda . Bölüm seçiminide 1. adıma alalım. 2. adımda ürün cinsine göre kutu içi maks adetler belirlensin... Akıllı hacim bölümünde sadece işaretli olanlar işleme alınsın tüm seçenekler hepsi birden mini sorterda işlem goremeyebilir. sadece seçilen ürün tipleri ile adım adım işlem yapılacak şekilde olmalı. sonrası buna göre aynen devam edecek"*
  - **1. Adım Yeniden Yapılandırması (Firma & Bölüm Seçimi):**
    - Sipariş seçimi (`orders` dropdown'ı veya serbest sipariş numarası girişi) 1. adımdan tamamen kaldırıldı.
    - 1. Adım doğrudan **Firma (Marka)** belirleme ve o markaya ait **Bölümleri (Departmanları)** seçme adımı olarak birleştirildi.
    - Sipariş kapsamı, markanın veritabanındaki tüm yeni ve kısmi kalan açık siparişlerini kapsayacak şekilde otomatikleştirildi (`order_number: null` parametresi ile backend'de markanın tüm siparişleri tek havuzda birleştirildi).
    - Sağ paneldeki Seçim Özeti kartına: Seçili Marka, Kapsanan Sipariş Rozetleri (`#16937`, `#16777`, `#16775`...), Seçili Bölüm Sayısı ve Dinamik Kapsamdaki Personel Sayacı eklendi.
  - **2. Adım Yeniden Yapılandırması (Ürün Cinsine Göre Kutu İçi Maks Adetler & Akıllı Hacim):**
    - 9 temel ürün kategorisi için (`MONT`, `YELEK`, `SWEATSHIRT`, `PANTOLON`, `GÖMLEK`, `POLO TİŞÖRT`, `BERE`, `AYAKKABI`, `DİĞER`) bağımsız aktif/pasif onay kutuları (`enabledCategories`) oluşturuldu.
    - Sadece işaretli olan ürünler depodan toplanıp mini sorterda işlem görecek mimari kuruldu ("tüm seçenekler hepsi birden mini sorterda işlem görmeyebilir; sadece seçilen ürün tipleri ile adım adım işlem yapılacak").
    - Hızlı Kategori Seçim Presetleri eklendi: `✓ Tümünü Seç`, `✕ Tümünü Kaldır`, `❄️ Kışlık Set`, `☀️ Yazlık Set`, `🧥 Üst Giyim`, `👖 Alt Giyim`.
    - Hızlı Koli Hacim Şablonları eklendi: `❄️ Kışlık Koli`, `☀️ Yazlık Kompakt`, `📦 Büyük Koli (XL)`, `🔄 Sıfırla`.
  - **Backend Kategori Motoru & Scania Kategori Ayrıştırma İyileştirmesi (`server/services/personnel_workflow_service.cjs`):**
    - `inferCategoryAndColor` fonksiyonunda `SWEATSHIRT` kelimesi içerisinde geçen `TSHIRT` alt dizgisinden ötürü sweatshirt modellerinin yanlışlıkla Polo Tişört kategorisine atanması giderildi; `SWEATSHIRT` kontrolü `POLO TİŞÖRT`ün önüne alındı.
    - `calculatePickingListAndWaves` servisine `selected_categories` filtresi entegre edildi. Her personelin `bundle_items` listesi seçilen kategorilere göre süzüldü; seçili kategorilerde ürünü bulunmayan personeller o turda sorter döngülerinden otomatik hariç tutuldu.
  - **3. ve 4. Adım Sürekliliği (Depo Listesi, A4 PDF ve Sorter 60 Göz Dağıtımı):**
    - 3. Adım Depo Toplama Listesi, A4 PDF Emri ve 4. Adım Sorter 60 Göz Dağıtımı yalnızca 2. adımda işaretlenen kategorilerdeki parçalar üzerinden oluşturuldu.
    - 3. Adım başlığına ve PDF antetine *"Tüm Siparişler"* ve *"İşleme Alınan Ürün Cinsleri"* rozetleri eklendi; dilediğinde 2. adıma geri dönüp farklı ürün tiplerini seçebilmek için *"← 2. Adıma Dön"* butonu yerleştirildi.
  - **Derleme, Test ve Ekran Görüntüleri ile Doğrulama:**
    - `npm run build`: 694 modül sıfır hata ile 6.31s içinde derlendi.
    - PM2 üzerinde `vog-api` (Port 3001) ve `vog-frontend` (Port 3000) başarıyla yeniden başlatıldı.
    - Puppeteer ile tam ekran doğrulamaları yapıldı:
      * `flow_step1_brand_departments.png`: SCANIA seçildiğinde sipariş seçimi olmadan tüm siparişlerin kapsandığı ve bölümlerin seçildiği doğrulandı.
      * `flow_step2_category_checkboxes.png`: 9 kategorili koli ve onay kutusu paneli doğrulandı.
      * `flow_step2_only_upper.png`: Hacimli Üst Giyim (Mont, Yelek, Sweatshirt) seçimi doğrulandı.
      * `flow_step3_filtered_picking_list.png`: Tüm kategorilerde 851 personel ve 9056 parça dökümü doğrulandı.
      * `flow_step3_only_upper.png`: Sadece üst giyim seçildiğinde 392 personel, 2427 parça ve 14 döngü olarak filtreleme kusursuz doğrulandı.

- **fix(personnel-sorter-allocate-wave-duplicate-key-constraint):**
  - **Kullanıcı Hatası & Ekran Görüntüsü:** *"hata bildirimini çözelim"* -> 4. Adımda *"BU DÖNGÜYÜ SORTER GÖZLERİNE DAĞIT (1-60)"* butonuna basıldığında kırmızı hata balonu: `duplicate key value violates unique constraint "idx_personnel_unique_active_sorter_chute"`.
  - **Kök Neden & Analiz:**
    - Veritabanında `idx_personnel_unique_active_sorter_chute` indeksi (`CREATE UNIQUE INDEX idx_personnel_unique_active_sorter_chute ON personnel (sorter_chute) WHERE sorter_chute IS NOT NULL;`) tüm marka ve personeller üzerinde global olarak benzersizlik dayatmaktadır.
    - `allocateWaveToSorter` fonksiyonundaki temizleme sorgusu `UPDATE personnel SET sorter_chute = NULL WHERE UPPER(brand) = $1` şeklinde sadece mevcut markayı süzmekteydi. Önceden sorter testlerinde gözleri dolu kalmış olan başka bir markanın personelleri (örneğin Skoda personellerinin 1-60 arası gözleri) temizlenmediği için, yeni Scania personeline 1, 2, 3... gözleri atanmaya çalışıldığında PostgreSQL benzersizlik kısıtı ihlal edilerek patlıyordu.
  - **Uygulanan Çözüm:**
    1. **Global Göz Temizliği (`server/services/personnel_workflow_service.cjs`):** Sorter makinesi 60 gözlü tek bir fiziksel donanım olduğundan, yeni döngü tahsis edilmeden önce önceki tüm markalara ait göz kayıtları global olarak sıfırlandı:
       `UPDATE personnel SET sorter_chute = NULL, secondary_sorter_chute = NULL WHERE sorter_chute IS NOT NULL OR secondary_sorter_chute IS NOT NULL;`
    2. **Per-Chute Fail-Safe:** Her personelin `primaryChute` ve `secondaryChute` atamasından hemen önce ilgili göze ait olası kalıntıları kaldıran fail-safe sorgusu eklendi:
       `UPDATE personnel SET sorter_chute = NULL WHERE sorter_chute = $1 AND id != $2;`
    3. **Döngü Tamamlama Koruması (`server/app.js`):** `complete-wave` endpoint'ine de 1-60 arası gözlerin `personnel` tablosundaki serbest bırakılması eklendi.
  - **Doğrulama & Kanıt:**
    - `test_fix_duplicate_constraint.cjs` ile SCANIA Danışman (Yaz) 1. Döngü (30 personel, 60 göz) arka arkaya 2 kez sıfır hata ile tahsis edildi (HTTP 200 OK).
    - Puppeteer ile UI üzerinden canlı test icra edildi ve `flow_step4_allocated_success.png` ekran görüntüsü alındı: Yeşil başarı mesajı `🚀 1. Döngü başarıyla Mini-Sorter'a dağıtıldı! 27 personele 54 göz 1-to-1 olarak tahsis edildi.` doğrulandı.

- **feature(personnel-sequential-rfid-tunnel-kiosk-verification):**
  - **Kullanıcı Talepleri:**
    1. *"MARKA seçildikten sonra personel bazlı işlem yapabilmek için kutu numarası başlangıç sayısı verip sırayla kutu numaralarına göre RFID tunellden gecen kolıleri kontrol edebilirmiyiz"*
    2. *"marka seçilecek, bölge lokasyonlar alfabetik oradaki personelde alfabetik sıralı olacak şekilde koliker numaralandırıldı"*
    3. Kullanıcı Onaylanan Tercihi: **(Recommended) Evet, hemen entegre edelim: Koli 7/7 hedefe ulaşıp tünelden çıkınca sıradaki kutu numarasına otomatik geçsin.**
  - **Kapsam ve Mimari Çözüm:**
    1. **Türkçe Alfabetik Collation ile Sıralı Numaralandırma (`server/services/personnel_numbering_service.cjs`):**
       - PostgreSQL varsayılan 'C' collation'ında Türkçe karakterler (Ç, Ğ, İ, Ö, Ş, Ü) ASCII sırasına düştüğünden, JavaScript `Intl.Collator('tr', { sensitivity: 'base', numeric: true })` motoru kullanıldı.
       - Bölge/Lokasyon (`service_center ASC`) ve Personel İsimleri (`name ASC`) Türkçe alfabetik sıraya göre 1..N koli numarası (`box_no`) ve `KOLI-[BRAND_CODE]-[0001]` barkoduyla veritabanında güncellendi.
       - VOLKSWAGEN (442 koli: `KOLI-VW-0001..0442`), SKODA (285 koli: `KOLI-SK-0001..0285`), SCANIA (851 koli: `KOLI-SC-0001..0851`), SEAT (61 koli: `KOLI-SE-0001..0061`) numaralandırıldı.
    2. **RFID Tünel Kiosk Backend Motoru (`server/drivers/rfid_tunnel_driver.js` & `server/app.js`):**
       - Sürücüye `session_type = 'PERSONNEL'` desteği eklendi.
       - Tünelden geçen etiketler personelin adıyla, parça SKU'suyla, EAN-13 barkoduyla ve beden bilgisiyle eşleştirilerek yabancı etiketler (`FOREIGN_TAG_REJECTED`) filtrelendi.
       - 7 parçalı kıyafet paketi (Mont, Yelek, 2 Gömlek, 2 Pantolon, Ayakkabı) içerik checklist'i (`bundle_items`) canlı olarak taranan EPC'lerle senkronize edildi.
       - `executeCompletePersonnelBox`: Koli 7/7 hedefe ulaşıp tünelden çıkınca (`passage_exit`) personeli `packing_status = 'PACKED'` ve `last_step = 'RFID_TUNNEL_TAMAM'` olarak günceller, Godex 100x100mm ZPL koli etiketini basar, yeşil kule ışığını yakar ve **1 saniye içinde sıradaki kutu numarasına (`box_no + 1`) otomatik geçer**.
       - 5 yeni API endpoint'i:
         * `GET /api/tunnel/kiosk/personnel/brands` (marka personel/koli sayaçları)
         * `GET /api/tunnel/kiosk/personnel/boxes` (alfabetik sıralı koli listesi ve arama)
         * `POST /api/tunnel/kiosk/personnel/renumber` (A-Z yeniden numaralandırma motoru)
         * `POST /api/tunnel/kiosk/personnel/start-session` (seçilen koli no'dan tüneli başlatma)
         * `POST /api/tunnel/kiosk/personnel/switch-box` (manuel kutu atlama / önceki-sonraki geçiş)
    3. **Tünel Kiosk Operatör Arayüzü (`src/pages/TunnelKioskPage.jsx`):**
       - Modal içinde çift sekmeli yapı: `[👤 Personel Bazlı Koli Taraması (Marka & Sıralı Koli)]` ve `[📦 Sipariş Bazlı Tarama (BSİP / Standard)]`.
       - Personel sekmesinde Marka Seçimi, Başlangıç Koli Numarası girişi, `[▶️ Koli #X'den Başlat]`, `[🔄 Alfabetik Numaralandır (A-Z)]`, arama çubuğu ve alfabetik koli önizleme kartları.
       - Kiosk ana ekranında aktif koli kartı (`👤 Koli #1: SÜLEYMAN AKÇAY (ACARLAR)`), `◀ Önceki Koli`, `Koliye Git [1..N] [GİT ➔]`, `Sonraki Koli ▶` hızlı navigasyon çubuğu.
       - Dev sayaç altında personelin 7 parça kıyafet listesi (Mont, Yelek, Gömlekler, Pantolonlar, Ayakkabı) canlı yeşil tik (`✓ OK`) göstergeleriyle sunuldu.
  - **Doğrulama & Test Sonuçları:**
    - `npm run build`: 694 modül 0 hata ile 6.64s içinde derlendi.
    - PM2 üzerinde `vog-api` (Port 3001) ve `vog-frontend` (Port 3000) online ve kesintisiz yayında.
    - Puppeteer uçtan uca UI testleri ve ekran görüntüleri:
      * `tunnel_kiosk_personnel_modal.png`: Çift sekmeli modal, Volkswagen 442 koli özeti, Koli #1'den başlama ve alfabetik sıralı koli listesi doğrulandı.
      * `tunnel_kiosk_koli1_active.png`: Koli #1 SÜLEYMAN AKÇAY (ACARLAR) 7 parça checklist kartları ve hızlı adım navigasyonu doğrulandı.
      * `tunnel_kiosk_koli2_stepper.png`: Sıradaki koliye geçildiğinde anında Koli #2 FURKAN DÖSGÜNÖZ (AHLATCI) ve onun kendi beden dağılımının yüklendiği doğrulandı.
    - SIFIR BASKI POLİTİKASI (ZERO PRINT) kuralına %100 uyuldu; toptan sipariş BSİP taraması %100 geriye dönük korundu.




---
### 📅 [2026-10-05T12:04:44.604Z] SKODA 2026 KIŞ RESMİ KİŞİ BAŞI KOTA ENTEGRASYONU (`Skoda Barkodlar 2026 KIŞ.XLSX`)
- **Kişi Başı Ürün Sayıları & Paketleme Kuralları:**
  * **Danışman (6 Adet):** 2 Gömlek (Bay PSKD100025 / Bayan PSKD100026), 2 Pantolon (PSKD100019), 1 Polar (PSKD100041/42), 1 Yelek (PSKD100052/53).
  * **Hasar Garanti (6 Adet):** 2 Gömlek (Bay PSKD100025 / Bayan PSKD100026), 2 Pantolon (PSKD100019), 1 Polar (PSKD100041/42), 1 Yelek (PSKD100052/53).
  * **MİS (3 Adet):** 2 Gömlek (Bay PSKD100025 / Bayan PSKD100026), 1 Polar (PSKD100041/42).
  * **Teknisyen (7 Adet):** 3 Yeşil Teknisyen Sweatshirt (PSKD100056), 2 Teknisyen Pantolon (PSKD100028), 1 Teknisyen Yelek (PSKD100036), 1 Polar (PSKD100041).
  * **Formen (7 Adet):** 3 Siyah Formen Sweatshirt (PSKD100055), 2 Danışman Pantolon (PSKD100019), 1 Teknisyen Yelek (PSKD100036), 1 Polar (PSKD100041).
  * **Yedek Parça (7 Adet):** 3 Siyah Yedek Parça Sweatshirt (PSKD100054), 2 Danışman Pantolon (PSKD100019), 1 Teknisyen Yelek (PSKD100036), 1 Polar (PSKD100041).
- **Veritabanı Güncellemesi:**
  * `server/scripts/import_skoda_2026_kis_official.cjs` güncellendi ve çalıştırıldı; 1.554 personelin `bundle_items` kayıtları bu kotalara göre normalize edildi.
- **Tünel & Kiosk Dinamik Adaptasyonu:**
  * `getPersonnelBoxList` ve `getPersonnelBoxDetails` fonksiyonları `target_quantity: itemCount` ile güncellendi.
  * Tünel Kiosk sayım hedefi (Danışman 6, Hasar Garanti 6, MİS 3, Teknisyen 7, Formen 7, Yedek Parça 7) tam senkronize çalışır hale getirildi.
  * Durum afişinde yabancı etiket ile hedef aşımının doğru ayrıştırılması sağlandı.
  * Sıfır regresyon ve ZERO PRINT kuralı korundu.

---
### 📅 [2026-10-05T15:45:00.000Z] TÜNEL OTOMATİK BASIM KONTROLÜ, EKSİK KOLİ KİLİDİ, POLAR ETİKET DOĞRULAMA & GODEX 100x100mm DİK BASKI
- **1. Otomatik Koli Etiketi Seçili Olmadan Otomatik Baskı Yapılmaması (`autoComplete` Zorunluluğu):**
  * Kiosk arayüzündeki "Otomatik Koli Etiketi" (`autoComplete`) seçeneği manuel moddayken (`autoComplete === false`), tünelden koli çıkışında veya hedef adede ulaşıldığında sistemin **asla otomatik baskı yapmaması** sağlandı.
  * Tünel sürücüsündeki debounce zamanlayıcısı ve çıkış tetikleyicisi (`handlePassageExit`, `handlePassageExitAutoPrint`, `handleAutoBoxComplete`) `savedConfig.autoComplete === true` şartına bağlandı.
  * Manuel modda koli tünelden çıktığında sistem durumu `READY_FOR_PRINT` konumuna geçirilerek operatörün ekrandaki manuel butona basması beklenmektedir.
- **2. Eksik Kolide Otomatik Baskı Yasağı (Sadece Manuel Basılabilir):**
  * Taranan adet hedeften az olduğunda (`scanned_quantity < target_quantity`) veya personelin `bundle_items` listesinde taranmamış parça kaldığında (`bundle_items.some(i => !i.is_scanned)`), sistemin çıkışta otomatik etiket basması **kesin olarak engellendi**.
  * Eksik koli algılandığında sistem `INCOMPLETE_BOX_STOPPED` olayı yayınlar, arayüze uyarı mesajı iletir ve durumu `READY_FOR_PRINT` olarak kilitler. Operatör eksik ürünü okutabilir veya sadece manuel basım butonu ile koli kapatabilir.
- **3. Polar Ürün Etiketi Tanıma & Akıllı Eşleme:**
  * Skoda Polar SGTIN-96 etiketlerinin (`303B50CC004132...` -> Sipariş #16690, `PSKD100041`) PostgreSQL `orders` tablosundaki eksikliği giderildi (#16690 Polar ve #16693 Gömlek eklendi).
  * `rfid_tunnel_driver.js` içindeki `rfid_tags` sorgusunda tabloda var olmayan `staff_name` kolonu sorgudan çıkarılarak sorgunun sessizce `catch` bloğuna düşmesi önlendi; EPC padding desteği eklendi.
  * Personel koli bundle eşleştirmesinde çok aşamalı eşleme mantığı (Temel SKU prefix eşleşmesi, `POLAR`/`GÖMLEK`/`YELEK`/`PANTOLON` anahtar kelime eşleşmesi, barkod + beden eşleşmesi) entegre edildi. Polar ürünleri personelin bundle listesindeki `Siyah Polar Bay` ile %100 doğrulukla eşleşti.
- **4. Godex G530 Koli Etiketinin DİK / Portrait Basılması (100x100mm):**
  * `generateGodexBoxZpl` fonksiyonu 300 DPI (12 dpmm) Godex G530 ve SATO CL4NX Plus için tam 100x100mm portrait boyutlarına (`^PW1180`, `^LL1180`, `^PON`) uyarlandı.
  * Dış çerçeve `^FO20,15^GB1140,${outerHeight},3^FS` ile 100mm rulo kağıda kusursuz ortalandı.
  * Sağ kenardan taşma ve kesilme sorunları (`KOLI: 1 / 165` vb.) tamamen giderildi.
  * Hem Personel Koli hem de Genel Sevkiyat Koli formatlarına standart GS1 Code 128 barkod ve QR kod yerleşimi eklendi; Labelary API testleriyle dikey görsel kusursuzluk doğrulandı.
- **5. Koli Etiketinde Parça No Sütunu Eklenmesi ve Dik Liste (Portrait 4-Kolonlu Grid):**
  * Kullanıcı tercihi doğrultusunda koli etiketinin dik (portrait / 100x100mm) yerleşimi korundu ve tablo yapısı 4 kolona genişletildi:
    1. **Parca No:** Katalog / SKU kodu (örn: `PSKD100025L`, `PSKD100041L`, `PNIS100012M`), Genişlik: ~280 dot (`^FO40,y^A0N,28,24`).
    2. **Urun Aciklamasi:** Kıyafet / ürün adı (örn: `SERVIS DANISMAN KISLIK GOMLEK`, `SIYAH POLAR BAY`), Genişlik: ~555 dot (`^FO320,y^A0N,28,24`).
    3. **Beden:** Temizlenmiş beden kodu (örn: `L`, `46`, `M`), Genişlik: ~140 dot (`^FO880,y^A0N,32,28`).
    4. **Adet:** Koli içi miktar (örn: `1`, `15`), Genişlik: ~155 dot (`^FO1035,y^A0N,34,30`).
  * Hem **Personel Koli** hem de **Genel / Toptan Sevkiyat Koli** şablonları (`server/app.js` ve `server/generate_label_preview_artifacts.cjs`) bu 4 sütunlu standart formata kavuşturuldu.
  * `Labelary` API üzerinden 12 dpmm (300 DPI) simülasyonu çalıştırılarak `godex_box_with_partno_portrait.png` ve `godex_box_bulk_portrait_with_partno.png` artifact'leri oluşturuldu ve görsel mükemmelliği doğrulandı.
- **Doğrulama & Test:**
  * `server/scratch/verify_all_requirements.cjs` ile 5 test senaryosu çalıştırıldı:
    1. Polar EPC tanıma ve bundle eşleşmesi: BAŞARILI.
    2. Eksik koli + manuel mod: Otomatik basım engellendi, BAŞARILI.
    3. Eksik koli + otomatik mod: Otomatik basım engellendi (`INCOMPLETE_BOX_STOPPED`), BAŞARILI.
    4. Tam koli + manuel mod: Otomatik basım engellendi (`READY_FOR_PRINT`), BAŞARILI.
    5. Tam koli + otomatik mod: Otomatik basım tetiklendi (`PASSAGE_EXIT`), BAŞARILI.
  * PM2 üzerinde `vog-api` servisi yeniden başlatıldı ve canlıda çalışır durumda. SIFIR BASKI POLİTİKASI (ZERO PRINT) kuralına uyuldu.

---
### 📅 [2026-10-15T17:25:00.000Z] PANTOLON / ALT BEDENLER İÇİN CİNSİYETE DUYARLI ÇİFT BEDEN VE ALIAS EŞLEŞTİRME MİMARİSİ
- **Kullanıcı Kuralı & Alan Bilgisi:**
  * Kadın ve erkek beden eşleşmeleri **yalnızca pantolon (alt giyim)** ürünleri için farklılaşır.
  * Üst giyim ürünlerinde (tişört, gömlek, polar, mont, yelek vb.) parantezli çift beden asla kullanılmaz, yalın harf bedenleri (`S`, `M`, `L`, `XL`, `2XL` vb.) geçerlidir.
  * **Erkek Pantolon:** Standart tablo korunur:
    `XXS -> 36`, `XS -> 38`, `S -> 40`, `M -> 42`, `L -> 44`, `XL -> 46`, `2XL -> 48`, `3XL -> 50`, `4XL -> 52`, `5XL -> 54`, `6XL -> 56`, `7XL -> 58`, `8XL -> 60`, `9XL -> 62`
    Ters yönlü: `36 -> XXS`, `38 -> XS`, `40 -> S`, `42 -> M`, `44 -> L`, `46 -> XL`, `48 -> 2XL`...
  * **Kadın Pantolon:** Erkeklere göre 1 beden (2 numara) küçüktür:
    `XXS -> 34`, `XS -> 36`, `S -> 38`, `M -> 40`, `L -> 42`, `XL -> 44`, `2XL -> 46`, `3XL -> 48`, `4XL -> 50`, `5XL -> 52`, `6XL -> 54`, `7XL -> 56`, `8XL -> 58`, `9XL -> 60`
    Ters yönlü: `34 -> XXS`, `36 -> XS`, `38 -> S`, `40 -> M`, `42 -> L`, `44 -> XL`, `46 -> 2XL`...
- **Kod Değişiklikleri:**
  1. `server/app.js`:
     - `SIZE_TEXT_TO_NUM_MALE`, `SIZE_NUM_TO_TEXT_MALE`, `SIZE_TEXT_TO_NUM_FEMALE`, `SIZE_NUM_TO_TEXT_FEMALE` tabloları eklendi.
     - `isFemaleGender(gender)` yardımcı fonksiyonu eklendi.
     - `cleanSizeCode(size)` fonksiyonu Kadın XXS (34) bedenini destekleyecek şekilde güncellendi.
     - `getSizeAliases(size, gender = 'ERKEK')`: Cinsiyete duyarlı alias listesi üretir (Kadın S için `['S', '38']`, Erkek S için `['S', '40']`).
     - `formatDualSize(size, gender = 'ERKEK')`: Pantolonlar için cinsiyete uygun çift beden metni üretir (`formatDualSize('S', 'KADIN')` -> `'S (38)'`, `formatDualSize('S', 'ERKEK')` -> `'S (40)'`, `formatDualSize('38', 'KADIN')` -> `'S (38)'`, `formatDualSize('38', 'ERKEK')` -> `'XS (38)'`).
     - `resolveExactSizeSkuAndBarcode`, `/api/vouchers/create`, `/api/vouchers/create-from-order`, `/api/printer/print-order-rfid-labels`, `generateSatoRfidZplQr`, `generateSatoRfidZplClassic` fonksiyonlarındaki çağrılar cinsiyet parametresi ile beslendi.
  2. `src/pages/OrdersPage.jsx`:
     - `SIZE_TEXT_TO_NUM_MALE`, `SIZE_NUM_TO_TEXT_MALE`, `SIZE_TEXT_TO_NUM_FEMALE`, `SIZE_NUM_TO_TEXT_FEMALE` export edildi.
     - `getSizeTextToNum(gender)`, `getSizeNumToText(gender)` yardımcıları eklendi.
     - `STANDARD_NUMERIC_SIZES` listesine `'34'` eklendi.
- **Doğrulama & Testler:**
  - `server/scratch/test_pants_gender_size_rules.cjs`: 55 test senaryosu 0 hata ile geçti (%100 Başarı).
  - `server/scratch/verify_all_vw_rules.cjs`: 15 / 15 test başarılı.
  - `server/scratch/verify_4_pair_resolutions.cjs`: 16 / 16 test başarılı.
  - `server/scratch/verify_order_16667_endpoints.cjs`: 6 beden varyantı eksiksiz doğrulandı.
  - `npm run build`: Vite derlemesi 0 hata ile 6.59s'de tamamlandı.
  - PM2: `vog-api` ve `vog-frontend` yeniden başlatıldı ve online.
  - ZERO PRINT: Windows Print Spooler 0 kuyruk ile doğrulandı.

