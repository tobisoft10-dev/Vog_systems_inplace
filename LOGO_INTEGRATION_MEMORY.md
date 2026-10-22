# LOGO TIGER ERP ENTEGRASYONU VE SİSTEM ÇALIŞMA MEMORY NOTLARI 📝

> **Son Güncelleme:** 24 Ağustos 2026  
> **Konu:** VOG Tekstil Koli Etiketi RFID, Logo Tiger Wings Kağıt İrsaliye Modu (0.1 sn Doğrudan MSSQL), Tünel Çift Etiket Engelleme & Tek Sipariş = Tek İrsaliye Kuralı

---

## 1. Merkezi LOGO ERP Sunucu & Veritabanı Bilgileri

- **SQL Server:** `DC` *(veya IP: `192.168.1.250`)*
- **Veritabanı Adı:** `WINGS`
- **Firma / Dönem:** `225` / `01` (`LG_225_01_STFICHE` & `LG_225_01_STLINE`)
- **SQL Kullanıcı Adı:** `deporfid`
- **SQL Şifresi:** `!1235!`
- **Merkez Depo Kodu:** `0` (`SOURCEINDEX = 0`)
- **Varsayılan Cari (CLIENTREF):** `196` (*DOĞUŞ OTO PAZARLAMA VE TİCARET A.Ş.* / `120.01.0191`)
- **Sistem Kullanıcısı (CAPIBLOCK_CREATEDBY & MODIFIEDBY):** `10` / `11` (*deporfid*)
- **Yazma Yöntemi:** **0.1 sn Doğrudan MSSQL Upsert** (`GENEXCTYP = 0`). LogoConnect XML Import klasör bağımlılığı kaldırılmıştır; tüm işlemler doğrudan Logo veritabanına yazılır.

---

## 2. LOGO Tiger Wings Kağıt İrsaliye Standartları

1. **Kağıt İrsaliye Yapılandırması (`EDESPATCH` & `TRCODE`)**:
   - `TRCODE = 8` (Toptan Satış İrsaliyesi)
   - `EDESPATCH = 0` (Kağıt / Matbu İrsaliye)
   - `EDESPSTATUS = 0`
   - `PROFILEID = 0`
   - `EINVOICE = 0` & `EINVOICETYP = 0`
   - **`RECSTATUS = 1`** (Logo Tiger Wings v3.04 Standart Aktif Kayıt)
   - **`GENEXCTYP = 1`** & **`LINEEXCTYP = 0`** (Logo Standart Program İçi Giriş; `GENEXCTYP = 2` Logo tarafından "Program Harici Giriş" olarak algılandığından kesinlikle kullanılmamalıdır)
   - **`STLINE.RECSTATUS = 1`** (Satır seviyesinde standart aktif kayıt)
   - **`EINVOICE = 1`** (Logo v3.04 native kağıt irsaliyeler bile EINVOICE=1 kullanır)
   - `CREATEWHERE = 0`, `FROMTRANSFER = 0`, `FROMINTEGTYPE = 0`, `FROMINTEGREF = 0`, `ORGLOGOID = ''`, `SITEID = 0`
   - `STATUS = 0`, `BILLED = 0`, `CANCELLED = 0`, `INVOICEREF = 0`, `INVNO = ''` (Tamamen açık ve düzenlenebilir)
2. **Fiş Numarası (`FICHENO`) & Belge No (`DOCODE`) Formatı**:
   - Format kuralı: `carikod-uruntipi-siranumarasi`
   - `carikod`: Cari kartındaki kısa kod / özel kod (`LG_225_CLCARD.SPECODE`, örn: NİSSAN için `NIS`, yoksa cari kodunun son kısmı örn: `1374`).
   - `urun tipi`: Malzeme kartı tanımlarındaki `SPECODE4` alanından otomatik alınır (Örn: `GÖMLEK`, `MONT`, `PANTOLON`).
   - `FICHENO` (Maks 17 Karakter): `shortCari-urunTipi-seq` (Örn: `NIS-GÖMLEK-001`).
   - `DOCODE` (Maks 33 Karakter): `fullCari-urunTipi-seq` (Örn: `120.01.1374-GÖMLEK-001`).
   - `SPECODE`: `KAĞIT İRS` (Logo fiş listesinde hemen ayırt edilir).
   - **Gerçekleşen Başarılı Örnek (14.09.2026):** Sipariş #16575 için `NIS-GOMLEK-001` (LOGICALREF: `26239`, Tarih: `11.09.2026`, Cari: `120.01.1374 - NİSSAN OTOMOTİV A.Ş.`, 52 Adet Gömlek, KDV %10, RECHASH Logo motoru tarafından imzalanmış, açık kağıt irsaliye olarak Logo'ya kaydedildi).
   - **Koli Etiketleri (14.09.2026):** İrsaliye satırlarına uygun 3 koli etiketi (Koli 1/3: Erkek S - 4 Adet, Koli 2/3: Kadın M - 16 Adet, Koli 3/3: Erkek L - 32 Adet) Godex G530 yazıcısına basıldı ve PostgreSQL WMS veritabanı güncellendi.
3. **Tek Sipariş = Tek İrsaliye Kuralı (`upsert`)**:
   - Aynı sipariş tünelden tekrar geçtiğinde veya adet güncellendiğinde **yeni irsaliye AÇILMAZ**.
   - `DOCODE = orderId` ile eşleşen mevcut irsaliye başlığı (`STFICHE`) ve satırları (`STLINE`) doğrudan güncellenir (`upsert`).
   - `BILLED = 0` (Faturalaşmamış — LOGO Tiger Wings arayüzünde tüm kullanıcılar tarafından açılabilir, satırları düzenlenebilir, yazdırılabilir).
   - **Faturalaşma Koruması:** `BILLED = 1` olan irsaliyelerde değişiklik yapılması engellenir.
5. **LOGO Arayüz Görünürlük Kuralı (`IOCODE` & `DATE_`)**:
   - `IOCODE = 3` (Stok Çıkış) — *Stok çıkış yapılmazsa LOGO Satış İrsaliyeleri gridinde görünmez.*
   - `DATE_`, `DOCDATE` ve `SHIPDATE`: Gece yarısı tarih formatı (`CONVERT(datetime, CONVERT(date, GETDATE()))` -> `YYYY-MM-DD 00:00:00.000`).

---

## 3. Tünel Makinesi Koli Tamamlama & Etiket Basım Kuralları

1. **Tek Koli = Tek Koli Etiketi (Çift Baskı Koruması)**:
   - `handleAutoBoxComplete` fonksiyonuna re-entrant kilidi (`is_auto_completed = true` ve `status === 'SCANNING'`) konuldu.
   - `session_update` listener'ından `TARGET_REACHED` ve `BOX_VERIFIED` eventleri temizlendi (zaten direct event'ler üzerinden tetikleniyor).
   - Koli tamamlandığında Godex G530 yazıcıya kesinlikle sadece **1 adet etiket** gönderilir.
2. **Otomatik Senkronizasyon (0.1 sn)**:
   - Koli tamamlandığı anda sistem 0.1 sn içinde hem Godex G530'a ZPL basım emri gönderir hem de Logo Tiger Wings MSSQL veritabanına irsaliyeyi yazar/günceller.

---

## 4. Kritik Dosyalar

- [c:/vog_system/server/app.js](file:///c:/vog_system/server/app.js) — `syncOrderToLogoErp`, `handleAutoBoxComplete`, `executeCompleteBox`, `POST /api/logo/sync-box-dispatch`.
- [c:/vog_system/vog_terminal_flutter/lib/services/hardware_scanner.dart](file:///c:/vog_system/vog_terminal_flutter/lib/services/hardware_scanner.dart) — Donanım tarayıcı ve klavye wedge servisi.
- [c:/vog_system/vog_terminal_flutter/lib/screens/packing_screen.dart](file:///c:/vog_system/vog_terminal_flutter/lib/screens/packing_screen.dart) — PDA Koli paketleme ekranı.
