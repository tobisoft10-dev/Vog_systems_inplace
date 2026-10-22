# Kaynak Sistemi (VOG Premium)

Bu klasör, proje bağlamının dayandığı müşteri ve marka tarafından sağlanan ham kaynakları saklar ve yönetir.

## Klasörler

| Konum | İçeriği |
|---|---|
| `belgeler/` | Teknik şartnameler, PDF kullanım kılavuzları, donanım spesifikasyonları |
| `veriler/` | Doğuş Otomotiv ve Scania Excel listeleri, parça katalogları, CSV/XML veri setleri |
| `gorseller/` | UI mockup'ları, etiket baskı numuneleri, donanım diyagramları |
| `ses-ve-video/` | Sorter ve tünel test kayıtları, eğitim videoları |
| `baglantilar.md` | API dokümantasyonları ve harici servis bağlantıları |
| `kaynak-indeksi.md` | Bütün gerçek kaynakların kayıt ve açıklama listesi |

## Kaynak Ekleme Süreci
1. Kaynağın orijinal dosyasını uygun klasöre yerleştir (`belgeler/` veya `veriler/`).
2. Açıklayıcı dosya adı kullan.
3. Kaynağı `kaynak-indeksi.md` dosyasına kaydet.
4. Kaynağın nereden geldiğini, hangi sezona/markaya ait olduğunu ve amacını belirt.
5. Kullanıcı “kaynakları denetle” dediğinde `proje-hafizasi` becerisiyle denetim gerçekleştirilir.
