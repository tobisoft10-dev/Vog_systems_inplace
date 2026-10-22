# Proje Kararları (Mimari Karar Kaydı - ADR)

Bu dosya VOG Premium projesinde kesinleşmiş ve gelecekteki çalışmaları bağlayan mimari kararları kaydeder.

| Tarih | Karar | Gerekçe | Durum | Etkilediği Alanlar |
|---|---|---|---|---|
| 2026-10-22 | **Modüler Context Mimarisi & Temiz Depo Standardı** | Token maliyetini %98 azaltmak, model doğruluğunu ve yanıt hızını artırmak için `benim projem` şablonuna geçildi. | Aktif | `context/`, `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` |
| 2026-10-22 | **GitHub Kurumsal Sürüm Kontrolü (`tobisoft10-dev/Vog_systems_inplace`)** | Projenin güvenli sürüm kontrolü ve yedeklenmesi için `tobisoft10-dev/Vog_systems_inplace` GitHub entegrasyonu tamamlandı. | Aktif | Git yapılandırması, `.gitignore` |
| 2026-10-20 | **VOG Ana Sayfa Mockup Birebir Uygulaması** | Marka kurumsal vitrini ve müşteri portal showroom erişimi için yüksek çözünürlüklü mockup tasarımı seçildi. | Aktif | `Home.jsx`, `Layout.jsx`, Hero, Vitrin |
| 2026-10-18 | **Scania 2026 Kış Aktarımı & 1..897 Koli Sıralaması** | Koli etiketlerinde lojistik bayii ve personel sıralaması için sequential numara standardı getirildi. | Aktif | `personnel_numbering_service.cjs`, WMS |
| 2026-10-15 | **Alt Bedenlerde Kadın 1 Beden Küçük Standardı** | Kadın ve erkek anatomi farkı nedeniyle alt giyimde kadın bedeni 2 numara (1 beden) küçük eşlendi (S->38 kadın, S->40 erkek). | Aktif | `OrdersPage.jsx`, `OrderLabelPrintingPage.jsx`, `app.js` |
| 2026-10-14 | **Üst Bedenlerde Yalnızca Harf Kodu Kuralı** | Polar, sweat, tişört vb. üst giyimde parça kodunun sonunun harfle bitmesi, sayısal eklerin sadece pantolona ayrılması sağlandı. | Aktif | `master_products`, parça çözümleme motoru |
| 2026-10-10 | **Sato CL4NX Plus 50x30mm RFID/Termal ZPL Standardı** | Giysi içine dikilen tekstil etiketleri için 203 DPI (`^PW400 ^LL240`) ZPL II standardı belirlendi. | Aktif | `vog-label-printing`, `server/app.js` |
| 2026-10-05 | **Godex G530 80x100mm Dikey Koli Etiketi Standardı** | Kolilerin üstüne yapıştırılan personel ve kıyafet detay listesi için portrait 300 DPI (`^PW945 ^LL1181`) ZPL yapısı oluşturuldu. | Aktif | `OrderLabelPrintingPage.jsx`, ZPL üreticisi |
| 2026-09-28 | **OmniSort Mini 63 Oluk Sorter PLC Entegrasyonu** | HC Robotics 8 panelli mini sorter için TCP 2000 soket üzerinden koli ataması ve çift renkli LED bildirimi benimsendi. | Aktif | `sorter_engine.cjs`, `OmniSort` donanımı |
| 2026-09-20 | **Impinj Speedway R420 LLRP Daemon Köprüsü** | 4 antenli RFID tünelinden saniyede yüzlerce tag okumasını backend'e aktarmak için C# `VogTunnelBridge.exe` köprüsü kuruldu. | Aktif | `VogTunnelBridge.exe`, `tunnel_daemon.cjs` |
| 2026-09-15 | **Logo Tiger 3 ERP İrsaliye Standardı (TRCODE 8)** | Toptan satış irsaliyesi oluştururken `LG_016_01_STFICHE` ve `STLINE` tablolarında doğrudan MSSQL yazımı ve XML yedeği seçildi. | Aktif | `server/logo_service.cjs`, MSSQL bağlantısı |
| 2026-09-01 | **PostgreSQL 17 Ana WMS & MSSQL Çift Veritabanı Mimarisi** | WMS operasyonel hızını PostgreSQL'de tutarken kurumsal muhasebeyi Logo Tiger 3 MSSQL üzerinde izole tutma kararı alındı. | Aktif | `server/db.js`, `server/mssql_pool.cjs` |

## Kullanım Kuralları
- Yeni bir mimari kural veya entegrasyon kararlaştırıldığında buraya tarih ve gerekçesiyle eklenir.
- Eski bir karar değişirse silinmez; durumu `değiştirildi` veya `iptal edildi` olarak güncellenir ve yeni karar eklenir.
