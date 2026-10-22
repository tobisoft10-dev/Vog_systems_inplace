# Proje Bağlamı Haritası (VOG Premium)

Bu dosya `context/` klasörünün ana haritasıdır. Proje bağlamını tek başına tekrar etmez; hangi bilginin nerede olduğunu ve ne zaman okunacağını göstererek token tüketimini minimuma indirir.

## Okuma Düzeni

### Her Görevde Oku (Zorunlu & Hafif)
- `proje-ozeti.md`: Projenin ne olduğunu, kapsamını ve mevcut durumunu anlamak için.
- `kurallar-ve-sinirlar.md`: Sıfır regresyon, sıfır kurgu, beden kuralları ve güvenlik yasaklarını uygulamak için.

### Göreve Göre Oku (İhtiyaç Anında)
- `hedefler.md`: Planlama, önceliklendirme veya başarı değerlendirmesi yapılırken.
- `kararlar.md`: Yeni mimari karar alınırken, önceki kararlar sorgulanırken veya çelişki ihtimalinde.
- `mimari-ve-sistemler.md`: Sorter, RFID tünel, Logo Tiger 3 ERP, SATO/Godex etiketleme veya veritabanı ile çalışırken.
- `kaynaklar/README.md`: Yeni bir Excel/PDF kaynağı eklenirken veya dayanak aranırken.
- `kaynaklar/kaynak-indeksi.md`: Marka Excel listeleri (Scania, VW, Audi, Seat, vb.) veya donanım kılavuzları aranırken.
- `gecmis-hafiza-arsivi.md`: Geçmiş sprint kayıtları veya eski hata çözümleri detaylı incelenmek istendiğinde.

---

## Mevcut Bağlam Haritası

| Konum | İçeriği | Ne zaman okunmalı? |
|---|---|---|
| `proje-ozeti.md` | Proje tanımı, amacı, kapsamı ve aktif durumu | Her görevde |
| `kurallar-ve-sinirlar.md` | Kalıcı kurallar, beden kuralları, yasaklar ve yetki sınırları | Her görevde |
| `hedefler.md` | Aktif hedefler, marka takvimleri ve başarı ölçütleri | Planlama ve önceliklendirmede |
| `kararlar.md` | Kesinleşmiş mimari kararlar (ADR), gerekçeleri ve etkileri | Karar veya değişiklik öncesinde |
| `mimari-ve-sistemler.md` | Sorter, RFID, Logo ERP, ZPL yazıcılar, portlar ve daemon'lar | Donanım ve servis geliştirmelerinde |
| `kaynaklar/README.md` | Kaynak sisteminin kullanım ve düzenleme kuralları | Kaynak işlemlerinde |
| `kaynaklar/kaynak-indeksi.md` | Projedeki gerçek kaynakların (Excel, PDF vb.) envanteri | Kanıt veya kaynak aranırken |
| `kaynaklar/baglantilar.md` | Dış bağlantılar, tünel ve API referansları | Dış servis bağlantılarında |
| `gecmis-hafiza-arsivi.md` | Geçmiş 3000+ satırlık sprint ve hata giderme günlüğü | Geçmiş detay araştırmalarında |

---

## Yeni Bağlam Dosyası Ekleme

Yeni bir bağlam dosyası eklendiğinde:
1. Dosyaya açık ve anlaşılır bir ad ver (örn. `sorter-protokol-detaylari.md`).
2. Dosyanın başında amacını belirt.
3. Dosyayı bu haritaya ekle ve ne zaman okunacağını yaz.
4. Dosya taşınır, yeniden adlandırılır veya silinirse haritayı aynı işlemde güncelle.

## Haritalama ve Güncelleme İlkeleri
- `context/` içindeki her anlamlı bağlam dosyası bu ana haritadan doğrudan ulaşılabilir olmalıdır.
- Ham Excel ve PDF dosyaları ana haritada listelenmez; `kaynaklar/kaynak-indeksi.md` içinde tutulur.
- Çelişkili veya eski bilgi fark edilirse sessizce değiştirilmemeli; kullanıcıya bildirilmelidir.
- Kullanıcı “hafızayı güncelle”, “bağlamı denetle” veya “kaynakları denetle” dediğinde `.agents/skills/proje-hafizasi/SKILL.md` becerisini kullan.
