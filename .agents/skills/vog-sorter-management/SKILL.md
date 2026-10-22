---
name: vog-sorter-management
description: OmniSort Mini (HC Robotics) 63-chute sorting system, PLC physical wall mappings, LED light colors, destination routing profiles, chute drop logging, and chute reset/clearing workflows. Use when working on sorter chute assignment, personnel sorter allocation, chute state debugging, or PLC light control.
---

# VOG Sorter Management Skill (OmniSort Mini)

Bu skill, VOG Tekstil Premium Sorter (OmniSort Mini / HC Robotics) sisteminin 63 gözlü konveyör mimarisini, PLC duvar haritalamasını, LED ışık kurallarını ve göz sıfırlama/atamaları yönetmek için kullanılır.

## 1. Donanım & Modül Haritası (63 Göz)
- **Toplam Göz Sayısı:** 63 Göz (1-60 standart ürün gözü, 61-63 asansör arkası hata & kontrol gözü).
- **Fiziksel Duvarlar (Walls):**
  - **A Hattı Sol (Wall A1):** Göz 1-9 (`Z-A1-1`, index 1-9) + Göz 10-15 (`Z-A0-1`, index 1-6).
  - **A Hattı Sağ (Wall A2):** Göz 16-24 (`Z-A3-1`, index 1-9) + Göz 25-30 (`Z-A4-1`, index 1-6).
  - **B Hattı Sol (Wall B1):** Göz 31-39 (`Z-B1-1`, index 1-9) + Göz 40-45 (`Z-B0-1`, index 1-6).
  - **B Hattı Sağ (Wall B2):** Göz 46-54 (`Z-B3-1`, index 1-9) + Göz 55-60 (`Z-B4-1`, index 1-6).
  - **A2 Asansör Arkası:** Göz 61-63 (`Z-A2-1`, index 1-3). Hata veya okunamayan ürünler buraya yönlendirilir.

## 2. PLC LED Işık Renkleri
Sorter gözlerinin üzerindeki LED indikatör renk kodları:
- `0`: KAPALI (Off)
- `1`: YEŞİL (Normal / Ürün bekleniyor veya başarılı düşüş)
- `2`: SARI (Kapasite uyarısı / Doluma yakın)
- `3`: KIRMIZI (Koli dolu / Hata / Göz doldu, boşaltılmalı)
- `4`: MAVİ (Özel yönlendirme / Personel tamamlandı)
- `5`: BEYAZ (Genel aydınlatma / Boşta)

## 3. Çalışma Profilleri (`PROFILES`)
`sorter_engine.cjs` içinde 6 adet profil desteklenir:
1. `PROFILE_BRAND_DEALER`: Her marka/bayi tekil sabit gözüne ayrıştırılır.
2. `PROFILE_CASCADE_OVERFLOW`: Koli dolunca otomatik kaskad sıradaki göze taşar.
3. `PROFILE_PRODUCT_SIZE_SPLIT`: Mont, pantolon veya beden (S, M, L, XL) ayrımı yapılır.
4. `PROFILE_DYNAMIC_PACKING`: Hedef adede ulaşınca otomatik koli etiketi tetiklenir.
5. `PROFILE_SMART_HYBRID`: Sipariş büyüklüğü ve çeşitliliğine göre hibrit kural.
6. `PROFILE_PERSONNEL`: Personel bazlı sipariş modu. Her personel tekil bir göze atanır, seti tamamlanınca etiket basılır.

## 4. Kritik Veritabanı Tabloları
- `sorter_mappings`: `(id, destination_name, chute_no, match_type, priority, target_capacity)`
- `sorter_chute_state`: `(chute_no, status, current_count, target_count, current_brand, destination, light_color, is_locked, updated_at)`
- `sorter_chute_items`: `(id, chute_no, barcode, product_name, dropped_at, status)`
- `personnel`: `(id, name, registration_number, service_center, brand, sorter_chute)`
- `personnel_orders` & `personnel_order_items`: Personel sipariş atamaları ve kalan adet takibi.

## 5. Kritik API Uç Noktaları
- `GET /api/wms/sorter/chutes/status` -> 63 gözün anlık durumu, dolulukları, kilitleri.
- `GET /api/wms/sorter/chute/:chuteNo/items` -> İlgili gözdeki düşen ürünlerin listesi.
- `POST /api/wms/sorter/chute-reset/:chuteNo` -> Tekil gözün state ve item'larını sıfırlar, LED'i yeşil/boş moda çeker.
- `POST /api/wms/sorter/chutes-reset-all` -> Tüm 63 gözü tek hamlede sıfırlar.
- `POST /api/sorter/resolve-destination` -> Barkod/ürün için hedef gözü belirler ve PLC komutunu oluşturur.

## 6. Sıfırlama (Reset) & Güvenlik Kuralları
- **Kalan Adet Sıfırsa Otomatik Temizlik:** Bir personelin veya siparişin kalan adedi 0'a ulaştığında, göz otomatik olarak boşaltılmalı (`current_count: 0`, `current_brand: null`, `destination: null`), ve LED söndürülmeli/yeşile dönmelidir.
- **Kilitli Göz Kontrolü:** `is_locked = true` olan gözlere yeni sipariş atanmamalıdır.
