# VOG Tekstil Premium - Web Servis & API Entegrasyon Rehberi

Bu rehber, **VOG Tekstil Premium** backend platformuna entegre olacak dış sistemlerin (donanım ortağı Takipsan, ERP sistemleri, MSSQL `bsip` yazılımı ve el terminalleri) Postman, cURL, C#, Python, Node.js veya mobil istemciler üzerinden web servis entegrasyonlarını eksiksiz gerçekleştirebilmesi amacıyla tüm teknik ayrıntıları, alternatif endpoint isimlerini (alias), istek ve yanıt gövdeleriyle birlikte hazırlanmıştır.

---

## 1. Genel Mimari ve Bağlantı Kuralları

- **Base URL (Yerel / Geliştirme):** `http://localhost:3001`
- **Base URL (Canlı / Staging Sunucu):** `http://90.159.50.117:3001`
- **İçerik Tipi (Header):** `Content-Type: application/json`
- **Karakter Kodlaması:** UTF-8 (`-f 65001` / CP65001 Türkçe Karakter Desteği)
- **Kimlik Doğrulama (Auth Token):** Oturum açma endpoint'i (`/api/auth/login`) hariç, tüm korumalı uç noktalara atılan JSON istek gövdesinde `"token": "VOG16546NNF5351ADD123123"` parametresi veya Header alanında Authorization token eklenebilir.
- **Alternatif Endpoint (Alias) Mimarisi:** Dış sistemlerin (Takipsan, ERP vb.) kendi isimlendirme standartlarına uyum sağlayabilmesi için kritik endpoint'lerde Türkçe ve İngilizce alternatif takma adlar (alias) tanımlanmıştır. Her iki adres de arka planda birebir aynı işlevi yürütür.

---

## 2. API Uç Noktaları Detaylı Rehberi

### 2.1. Kimlik Doğrulama / Oturum Açma (Login)
- **HTTP Metodu:** `POST`
- **Endpoint:** `/api/auth/login`
- **Açıklama:** İstemcilerin sisteme giriş yaparak geçerli bir oturum token'ı almasını sağlar.

#### Örnek İstek (Request Payload):
```json
{
  "username": "VOG",
  "password": "Vog2026!Premium",
  "database_name": "vog_db"
}
```

#### Örnek Başarılı Yanıt (Response 200 OK):
```json
{
  "success": true,
  "message": "Giriş başarılı.",
  "token": "VOG16546NNF5351ADD123123",
  "user": {
    "username": "VOG",
    "role": "admin",
    "brand": "VOG",
    "database_name": "vog_db"
  }
}
```

---

### 2.2. Takipsan Veritabanı Senkronizasyon & Düzeltme Endpoint'i (Takipsan Sync & Correction)
- **HTTP Metodu:** `GET` veya `POST`
- **Uç Nokta Adları (Alternatif Alias Adresleri):** 
  - `POST /api/vouchers/takipsan-sync` *(Takipsan sistemine özel tanımlanmış doğrudan takma ad)*
  - `POST /api/vouchers/sync-order` *(Standart RESTful POST adresi)*
  - `GET /api/vouchers/sync-order/:order_id` *(URL parametresi ile hızlı GET sorgu adresi)*
- **💡 Entegrasyon Notu & İş Mantığı:**
  - Yukarıda listelenen 3 adres de arka planda **birebir aynı `handleTakipsanSync` fonksiyonuna bağlıdır** ve tamamen aynı çıktıyı verir.
  - **GET Kullanımı:** `order_id` URL'de gönderilerek o siparişe ait veritabanındaki tüm `vouchers` (fişler), `orders` (siparişler) ve `sales` (satışlar) kayıtları anında okunur.
  - **POST Kullanımı:** `order_id` body içerisinde gönderilebilir. Ayrıca veritabanında elle bir düzeltme yapıldığında veya Takipsan tarafından güncel bilgiler iletildiğinde gövdede `sku`, `code39`, `ean13`, `barcode`, `product_name`, `color`, `brand` parametreleri gönderilerek veritabanı satırları güncellenir ve güncel veri seti dönülür.

#### Örnek İstek 1 (GET URL Sorgusu):
`GET http://localhost:3001/api/vouchers/sync-order/16763`

#### Örnek İstek 2 (POST Manuel Veritabanı Düzeltme Payload):
```json
{
  "order_id": 16763,
  "sku": "PSEAT100050",
  "code39": "PSEAT100050",
  "product_name": "SEAT 2026 KIŞ MASTER TEKNİSYEN BAY POLAR FÜME",
  "color": "FÜME",
  "brand": "SEAT"
}
```

#### Örnek Başarılı Yanıt (Response 200 OK):
```json
{
  "success": true,
  "message": "Sipariş #16763 için Takipsan senkronizasyon verisi başarıyla hazırlandı.",
  "order_id": 16763,
  "order": {
    "id": "dd3f6aba-ab99-4d3e-994d-f3ad3a801c6d",
    "order_number": 16763,
    "status": "TAMAMLANDI",
    "quantity": 8,
    "processed_quantity": 8,
    "remaining_quantity": 0,
    "customer_name": "DOĞUŞ OTOMOTİV SERVİS VE TİCARET A.Ş.",
    "sub_customer_name": "DOĞUŞ OTOMOTİV SERVİS VE TİCARET A.Ş.",
    "staff_name": "SALİH",
    "product_name": "SEAT 2026 KIŞ MASTER TEKNİSYEN BAY POLAR FÜME",
    "brand": "SEAT",
    "sku": "PSEAT100050",
    "code39": "PSEAT100050",
    "ean13": "8691676316766",
    "barcode": "PSEAT100050",
    "created_at": "2026-08-10T13:34:09.431Z",
    "updated_at": "2026-08-11T04:18:35.057Z"
  },
  "vouchers_count": 3,
  "total_voucher_quantity": 8,
  "vouchers": [
    {
      "id": "053b6630-be52-40a5-b0b5-203b8f34a765",
      "order_id": 16763,
      "location": "Ana Depo Tesellüm",
      "barcode": "PSEAT100050",
      "ean13": "8691676316766",
      "quantity": 6,
      "product_name": "SEAT 2026 KIŞ MASTER TEKNİSYEN BAY POLAR FÜME",
      "color": "FÜME",
      "size": "BEDEN L",
      "brand": "SEAT",
      "sku": "PSEAT100050",
      "code39": "PSEAT100050",
      "price": "500.00",
      "gender": "Bay",
      "box_no": 1,
      "total_boxes": 1,
      "sub_customer_name": "DOĞUŞ OTOMOTİV SERVİS VE TİCARET A.Ş.",
      "staff_name": "SALİH",
      "status": "TAMAMLANDI",
      "created_at": "2026-08-10T14:36:59.112Z",
      "updated_at": "2026-08-11T04:18:35.057Z"
    }
  ],
  "sales_count": 5,
  "sales": [
    {
      "id": "1e7f0030-65a3-4d82-8c05-d05089026dc4",
      "order_id": 16763,
      "location": "Ana Depo Tesellüm",
      "barcode": "PSEAT100050",
      "ean13": "8691676316766",
      "quantity": 6,
      "sku": "PSEAT100050",
      "code39": "PSEAT100050",
      "price": "500.00",
      "product_name": "SEAT 2026 KIŞ MASTER TEKNİSYEN BAY POLAR FÜME",
      "staff_name": "SALİH",
      "brand": "SEAT",
      "size": "BEDEN L",
      "created_at": "2026-08-10T13:45:36.381Z",
      "updated_at": "2026-08-11T04:18:35.057Z"
    }
  ],
  "synced_at": "2026-08-11T07:18:38.941Z"
}
```

---

### 2.3. MSSQL Canlı Sipariş & `bsip` Matris Listesi (MSSQL Live Orders)
- **HTTP Metodu:** `GET`
- **Endpoint:** `/api/orders/mssql-list`
- **Açıklama:** SQL Server `[SIPARIS].[dbo].[Siparisler]` ve `[SIPARIS].[dbo].[SiparisIslemleri]` (`bsip`) tablolarından canlı 16.200+ siparişi çeker. `Detay5` (Ütü/Paket Detayı) içerisinden ayıklanan **P-Kodu SKU değerlerini (`PSEAT100050` vb.)**, Türkçe UTF-8 karakterlerini ve `B01` - `B14` (`XXS` -> `9XL`) beden matrislerini döndürür. `Cinsiyet` 0 ve 1 değerleri otomatik olarak `Bay` olarak eşlenir.
- **💡 Entegrasyon Notu:** Bu endpoint, masaüstü ERP yazılımı (`bsip`) verilerini anlık olarak okur. `SizeMatrix` alanında işlem aşamalarına göre (`PLANLAMA`, `KESİM` vb.) Bay/Bayan ayrımıyla beden sayılarını verir.

#### Örnek İstek:
`GET http://localhost:3001/api/orders/mssql-list`

#### Örnek Başarılı Yanıt (Response 200 OK):
```json
{
  "success": true,
  "source": "mssql",
  "data": [
    {
      "Id": 16763,
      "Zaman": "2026-07-20T10:00:00.000Z",
      "TeslimZaman": "2026-09-01T00:00:00.000Z",
      "PersonelId": "SALİH",
      "MusteriAdi": "DOĞUŞ OTOMOTİV SERVİS VE TİCARET A.Ş.",
      "Model": "SEAT 2026 KIŞ MASTER TEKNİSYEN BAY POLAR FÜME",
      "BedenAdi": "BEDEN (XXS-9XL)",
      "IslemId": "KESİM",
      "Muhasebelesti": false,
      "Adet": 420,
      "Not": "Özel Koli Paket",
      "Detay1": "KESİM DETAYI: Standart Kesim",
      "Detay5": "TEK TEK PAKET Master Teknisyen Polar PSEAT100050",
      "Sku": "PSEAT100050",
      "sku": "PSEAT100050",
      "code39": "PSEAT100050",
      "SizeMatrix": [
        {
          "SiparisId": 16763,
          "process": "PLANLAMA",
          "gender": "Bay",
          "XXS": 0, "XS": 0, "S": 0, "M": 0, "L": 6, "XL": 0, "XXL": 0, "3XL": 0, "4XL": 0, "5XL": 0, "6XL": 0, "7XL": 0, "8XL": 0, "9XL": 0,
          "total": 6
        },
        {
          "SiparisId": 16763,
          "process": "KESİM",
          "gender": "Bay",
          "XXS": 0, "XS": 0, "S": 0, "M": 0, "L": 8, "XL": 0, "XXL": 0, "3XL": 0, "4XL": 0, "5XL": 0, "6XL": 0, "7XL": 0, "8XL": 0, "9XL": 0,
          "total": 8
        }
      ]
    }
  ]
}
```

---

### 2.4. Sipariş Adet Güncelleme - Fazla Üretim / Ek Etiket Basımı (Order Quantity Update)
- **HTTP Metodu:** `POST`
- **Uç Nokta Adları (Alternatif Alias Adresleri):**
  - `POST /api/orders/adet-guncelleme` *(Türkçe isimlendirme adresi)*
  - `POST /api/orders/update-quantity` *(İngilizce isimlendirme adresi)*
- **Açıklama:** Üretim esnasında sipariş miktarından fazla üretilen ürünler için siparişin toplam hedeflenen adedini günceller, basım limitini arttırır ve aynı etiketlerin basılabilmesini sağlar. Veritabanındaki `orders` ve `vouchers` tablolarını eşzamanlı günceller.
- **💡 Entegrasyon Notu:** İki endpoint de birebir aynı `handleAdetGuncelleme` fonksiyonunu tetikler. Ek miktar girmek için `"additional_quantity": 10` veya doğrudan yeni hedef miktarı belirlemek için `"new_quantity": 430` parametreleri kullanılabilir.

#### Örnek İstek (Request Payload):
```json
{
  "order_id": 16763,
  "additional_quantity": 10
}
```

#### Örnek Başarılı Yanıt (Response 200 OK):
```json
{
  "success": true,
  "message": "Sipariş #16763 adeti başarıyla güncellendi! Yeni Toplam: 430 Adet (Kalan Basılabilir: 422 Adet)",
  "order_id": 16763,
  "previous_quantity": 420,
  "new_total_quantity": 430,
  "processed_quantity": 8,
  "remaining_quantity": 422,
  "status": "KISMI BASILDI"
}
```

---

### 2.5. Siparişten Fiş / Etiket Oluşturma (Create Voucher From Order)
- **HTTP Metodu:** `POST`
- **Endpoint:** `/api/vouchers/create-from-order`
- **Açıklama:** Seçili bir siparişten etiket veya fiş kaydı oluşturur. Sipariş detayından ayıklanan SKU (`PSEAT100050`) ile `master_products` ana kataloğunu sorgulayıp basılan etiket verisini `vouchers`, `sales` ve `orders` tablolarına `master_products` referansıyla yazar.
- **💡 Entegrasyon Notu:** Eğer basılmak istenen miktar kalan miktarı aşarsa sunucu uyarı verir. Fazla etiket basılabilmesi için istekte `"allow_over_print": true` parametresi gönderilebilir.

#### Örnek İstek (Request Payload):
```json
{
  "order_id": 16763,
  "total_quantity": 420,
  "quantity": 8,
  "sub_customer_name": "DOĞUŞ OTOMOTİV SERVİS VE TİCARET A.Ş.",
  "staff_name": "SALİH",
  "product_name": "SEAT 2026 KIŞ MASTER TEKNİSYEN BAY POLAR FÜME",
  "size": "BEDEN L",
  "gender": "Bay",
  "brand": "SEAT",
  "sku": "PSEAT100050",
  "code39": "PSEAT100050",
  "box_no": 1,
  "total_boxes": 1,
  "location": "Ana Depo Tesellüm",
  "split_by_piece": false
}
```

#### Örnek Başarılı Yanıt (Response 200 OK):
```json
{
  "success": true,
  "message": "Sipariş #16763 için 1 beden kaleminde toplam 8 adet fiş/etiket kaydı başarıyla oluşturuldu.",
  "count": 1,
  "total_quantity": 420,
  "processed_quantity": 8,
  "remaining_quantity": 412,
  "status": "KISMI BASILDI",
  "vouchers": [
    {
      "id": "053b6630-be52-40a5-b0b5-203b8f34a765",
      "order_id": 16763,
      "location": "Ana Depo Tesellüm",
      "barcode": "PSEAT100050",
      "ean13": "8691676316766",
      "quantity": 8,
      "product_name": "SEAT 2026 KIŞ MASTER TEKNİSYEN BAY POLAR FÜME",
      "color": "FÜME",
      "size": "BEDEN L",
      "brand": "SEAT",
      "sku": "PSEAT100050",
      "code39": "PSEAT100050",
      "price": "500.00",
      "gender": "Bay",
      "status": "KISMI BASILDI"
    }
  ],
  "summary": {
    "processed_quantity": 8,
    "total_quantity": 420,
    "remaining_quantity": 412,
    "status": "KISMI BASILDI"
  }
}
```

---

### 2.6. Tünel RFID Geçiş Kaydı - Tekli & Toplu Okuma (Tunnel Scan)
- **HTTP Metodu:** `POST`
- **Endpoint:** `/api/tunnel/scan`
- **Açıklama:** RFID tünelinden geçen koli ve ürün etiket okumalarını (tekli veya Takipsan donanım toplu dizisi `scanneds`) veritabanına kaydeder.

#### Örnek İstek (Request Payload - Takipsan Toplu Okuma Dizisi):
```json
{
  "order_id": 16763,
  "reader_id": "ST_TUNNEL_01",
  "scanneds": [
    { "rfid_tag": "303B50CC0028B40000000026", "barcode": "PSEAT100050" },
    { "rfid_tag": "303B50CC0028B40000000027", "barcode": "PSEAT100050" }
  ]
}
```

#### Örnek Başarılı Yanıt (Response 200 OK):
```json
{
  "success": true,
  "message": "2 adet tünel geçiş okuması kaydedildi.",
  "count": 2,
  "order_id": 16763
}
```

---

### 2.7. Tünel RFID Geçiş İptal / Silme Kaydı (Cancel Tunnel Scan)
- **HTTP Metodu:** `POST`
- **Endpoint:** `/api/tunnel/cancel-scan`
- **Açıklama:** RFID tünelinden geçen ve sonradan silinen veya iptal edilen ürün/etiket okumalarını sunucudan temizler.

#### Örnek İstek (Request Payload):
```json
{
  "order_id": 16763,
  "rfid_tags": [
    "303B50CC0028B40000000026"
  ]
}
```

#### Örnek Başarılı Yanıt (Response 200 OK):
```json
{
  "success": true,
  "message": "1 adet tünel okuma kaydı iptal edildi.",
  "removed_count": 1
}
```

---

### 2.8. Canlı RFID Tünel Okuma Listesi (Get RFID Reads)
- **HTTP Metodu:** `GET`
- **Endpoint:** `/api/rfid/reads`
- **Açıklama:** Tünel monitörü ve canlı takip ekranları için gerçekleşen son RFID okuma verilerini getirir.

#### Örnek İstek:
`GET http://localhost:3001/api/rfid/reads`

#### Örnek Başarılı Yanıt (Response 200 OK):
```json
{
  "success": true,
  "data": [
    {
      "rfid_tag": "303B50CC0028B40000000026",
      "order_id": "16763",
      "reader_id": "ST_TUNNEL_01",
      "timestamp": "2026-08-11T07:15:00.000Z",
      "status": "Scanned"
    }
  ],
  "total_today": 48
}
```

---

### 2.9. Aktif Sevkiyat Grupları ve Siparişler (Active Shipments)
- **HTTP Metodu:** `GET`
- **Endpoint:** `/api/shipments/active?brand=All`
- **Açıklama:** Tünel takip ekranı için sevk bekleyen aktif lokasyon ve sipariş gruplarını getirir.

#### Örnek İstek:
`GET http://localhost:3001/api/shipments/active?brand=SEAT`

#### Örnek Başarılı Yanıt (Response 200 OK):
```json
{
  "success": true,
  "data": [
    {
      "location_name": "DOĞUŞ OTOMOTİV SERVİS VE TİCARET A.Ş.",
      "brand": "SEAT",
      "grup": "MASTER TEKNİSYEN",
      "target_quantity": "420",
      "scanned_quantity": "8",
      "items": [
        {
          "order_number": 16763,
          "staff_name": "SALİH",
          "product_name": "SEAT 2026 KIŞ MASTER TEKNİSYEN BAY POLAR FÜME",
          "size": "L",
          "quantity": 8
        }
      ]
    }
  ]
}
```

---

### 2.10. Fiş Basım Kayıtları ve Tarih Sorgulama (Vouchers Print History)
- **HTTP Metodu:** `POST`
- **Endpoint:** `/api/vouchers/print`
- **Açıklama:** Sevk kutusu etiket basım verilerini tarih aralığı bazında sorgular.

#### Örnek İstek (Request Payload):
```json
{
  "start_date": "2026-08-01",
  "end_date": "2026-08-30"
}
```

#### Örnek Başarılı Yanıt (Response 200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "053b6630-be52-40a5-b0b5-203b8f34a765",
      "order_id": 16763,
      "sku": "PSEAT100050",
      "barcode": "PSEAT100050",
      "ean13": "8691676316766",
      "quantity": 8,
      "product_name": "SEAT 2026 KIŞ MASTER TEKNİSYEN BAY POLAR FÜME",
      "created_at": "2026-08-10T14:36:59.112Z"
    }
  ]
}
```

---

### 2.11. Ürün Ana Verisi Sorgulama (Master Data Query)
- **HTTP Metodu:** `POST`
- **Endpoint:** `/api/products/master-data`
- **Açıklama:** Barkod, SKU veya EAN-13 üzerinden ürün tanımlarını sorgular.

#### Örnek İstek (Request Payload):
```json
{
  "barcode": "PSEAT100050"
}
```

#### Örnek Başarılı Yanıt (Response 200 OK):
```json
{
  "success": true,
  "product": {
    "sku": "PSEAT100050",
    "product_name": "SEAT 2026 KIŞ MASTER TEKNİSYEN BAY POLAR FÜME",
    "brand": "SEAT",
    "color": "FÜME",
    "size": "BEDEN (XXS-9XL)",
    "gender": "Bay",
    "ean13": "8691676316766",
    "barcode": "PSEAT100050",
    "code39": "PSEAT100050",
    "price": 500.00
  }
}
```

---

### 2.12. El Terminali Sayım Gönderimi (Inventory Count)
- **HTTP Metodu:** `POST`
- **Endpoint:** `/api/inventory/count`
- **Açıklama:** El terminalinde yapılan sayım sonuçlarını sunucuya kaydeder.

#### Örnek İstek (Request Payload):
```json
{
  "counting_id": 4272,
  "total_line_items": 1,
  "response_data": [
    { "gtin": "PSEAT100050", "count": 20 }
  ]
}
```

#### Örnek Başarılı Yanıt (Response 200 OK):
```json
{
  "success": true,
  "message": "Sayım verileri başarıyla sunucuya kaydedildi.",
  "records_processed": 1
}
```

---

### 2.13. Sunucu Canlılık & Yeniden Başlatma (System Health & Reload)
- **HTTP Metodu:** `GET` veya `POST`
- **Endpoint:** `/api/system/reload-server`
- **Açıklama:** Backend API sunucusunu canlıda yeniden başlatır.

#### Örnek Başarılı Yanıt (Response 200 OK):
```json
{
  "success": true,
  "message": "Backend yeniden başlatılıyor..."
}
```

---

### 2.14. Ana Ürün Kataloğu Excel İçe Aktarma & Güncelleme (Master Products UPSERT)
- **HTTP Metodu:** `POST`
- **Endpoint:** `/api/products/import-master-excel`
- **Açıklama:** `SEAT 2025 KIŞ PARÇA KODLARI.XLSX` gibi ana ürün kataloğu Excel dosyalarını yükler. Dosya içerisindeki Parça No / SKU, Ürün Adı, Renk, Beden ve Barkod verilerini okur. **Olmayan ürünleri veritabanına yeni ekler (INSERT), var olan ürünlerin bilgilerini günceller (UPDATE).**

#### Örnek İstek (Multipart Form Data):
- `file`: `SEAT 2025 KIŞ PARÇA KODLARI.XLSX`
- `brand`: `SEAT`

#### Örnek Başarılı Yanıt (Response 200 OK):
```json
{
  "success": true,
  "message": "'SEAT 2025 KIŞ PARÇA KODLARI.XLSX' dosyasından toplam 142 adet master ürün işlendi. (120 Yeni Eklendi, 22 Var Olan Güncellendi)",
  "brand": "SEAT",
  "inserted": 120,
  "updated": 22,
  "total": 142
}
```

---

## 3. İstemci Entegrasyon İpuçları (Postman, cURL & Kod Örnekleri)

### cURL İle Örnek Takipsan Sync İsteği:
```bash
curl -X POST http://localhost:3001/api/vouchers/takipsan-sync \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": 16763,
    "sku": "PSEAT100050"
  }'
```

### Postman Test Adımları:
1. HTTP Metodunu **POST** veya **GET** olarak seçin.
2. `Headers` sekmesinde `Content-Type` alanını `application/json` olarak ayarlayın.
3. `Body` sekmesinden **raw -> JSON** formatını seçip yukarıdaki tam payload örneklerini yapıştırın.
