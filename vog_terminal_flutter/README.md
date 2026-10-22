# 📱 VOG Tekstil - Chainway RFID & Barkod Android El Terminali Uygulaması (Flutter)

Bu proje, fotoğraftaki **Chainway RFID & 2D Barkod Android El Terminali** (C72 / C66 UHF) cihazlarında doğrudan çalışacak şekilde tasarlanmış yerel **Flutter Android** uygulamasıdır.

---

## 🎯 Özellikler

1. **Chainway Donanım Tetikleyicisi (Gun Trigger):**
   * Cihazın tabanca tetiğine basıldığında donanımsal barkod ve UHF RFID okumaları Android `BroadcastReceiver` (`com.rscja.android.KEY_DOWN`, `com.scanner.broadcast`, `android.intent.ACTION_DECODE_DATA`) üzerinden anında yakalanır.
   * Aynı koli içindeki mükerrer (duplicate) EPC okumaları otomatik olarak engellenir.
2. **Koli Yönetimi & Mühürleme (Mod B):**
   * Arama destekli sipariş seçimi (`#16902 - ACIBADEM`).
   * Dinamik Koli Numarası (`Koli 1`, `Koli 2`).
   * Dev boyutta yüksek görünürlüklü canlı sayaç (`📦 24 ADET`).
   * **"📦 KOLİYİ KAPAT & MÜHÜRLE"** butonu ile tek dokunuşla sunucuya (`/api/terminal/save-box`) aktarım.
   * Paketlenmiş kolileri anlık listeleme ve takip.
3. **Dinamik Sunucu Bağlantısı:**
   * Cihaz el terminali WiFi ağına bağlandığında sunucu IP'si (`http://192.168.1.100:3001` vb.) Ayarlar ekranından kolayca girilebilir ve test edilebilir.
4. **Sesli & Titreşimli Geri Bildirim:**
   * Her etiket okunduğunda donanımsal titreşim ve ses.
   * Koli kapatıldığında başarı melodisi.

---

## 📁 Proje Dizin Yapısı

```
c:\vog_system\vog_terminal_flutter\
├── pubspec.yaml                        # Flutter & Paket Tanımları
├── android/                            # Android Gradle, Manifest ve Kotlin Kodları
│   ├── app/src/main/
│   │   ├── AndroidManifest.xml         # Ağ & Donanım İzinleri
│   │   └── kotlin/com/vog/terminal/MainActivity.kt  # Chainway BroadcastReceiver Köprüsü
├── lib/
│   ├── main.dart                       # Uygulama Girişi & Endüstriyel Dark/Amber Tema
│   ├── config/
│   │   └── api_config.dart             # Sunucu IP/Port Ayarları (Kalıcı SharedPreferences)
│   ├── models/
│   │   ├── order_model.dart            # Sipariş Modeli
│   │   └── box_model.dart              # Koli & Okunan Etiket Modeli
│   ├── services/
│   │   ├── api_service.dart            # VOG API İstemcisi
│   │   └── hardware_scanner.dart       # Donanım Tetikleyici & EventChannel Dinleyicisi
│   └── screens/
│       ├── packing_screen.dart         # Ana Koli Paketleme Ekranı
│       ├── order_selection_dialog.dart # Anlık Arama Destekli Sipariş Seçim Penceresi
│       └── settings_screen.dart        # Sunucu IP ve Bağlantı Test Ekranı
```

---

## 🔨 APK Derleme ve Cihaza Yükleme Adımları

### 1. Yöntem: Flutter CLI ile APK Derleme
Flutter kurulu herhangi bir bilgisayarda (veya VS Code / Android Studio ortamında):
```bash
cd c:\vog_system\vog_terminal_flutter
flutter pub get
flutter build apk --release
```
Derlenen APK dosyası şu konumda oluşur:
👉 `build/app/outputs/flutter-apk/app-release.apk`

### 2. Yöntem: Cihaza USB ile Doğrudan Yükleme
El terminalini USB kablosuyla bilgisayara bağlayın (Cihazda `Geliştirici Seçenekleri -> USB Hata Ayıklama` açık olmalıdır):
```bash
flutter run --release
```
veya derlenen APK'yı cihaza kopyalayıp dosya yöneticisinden dokunarak yükleyebilirsiniz.

---

## ⚙️ Chainway Cihaz Ayarları (KeyboardEmulator / UHF)

Chainway el terminalinde donanım tetiğinin uygulamaya veri gönderebilmesi için cihazın dahili uygulamasını yapılandırabilirsiniz:

1. **KeyboardEmulator (2D Barkod) Ayarları:**
   * Cihazdaki **"KeyboardEmulator"** uygulamasını açın.
   * `Function` sekmesine gidin.
   * **Barcode2D** seçeneğinin açık olduğunu doğrulayın.
   * `Release key scan` veya `Focus scan` modunu aktif edebilirsiniz.
2. **UHF RFID Uygulaması (RFID With UHF):**
   * Cihazdaki **"UHF"** uygulamasını açın.
   * `Settings` sekmesinde `Power` ayarını yapın (Örn: 26 - 30 dBm).
   * Tetik tuşunun UHF veya Barkod okumasını sağlamak için `Key Scan` bölümünü etkinleştirin.

---

## 🚀 Kullanım Kılavuzu

1. **Ayarlar:**
   * Uygulamayı açın, sağ üstteki **⚙️ Ayarlar** simgesine dokunun.
   * VOG Sunucu IP adresini girin (Örn: `http://192.168.1.50:3001`).
   * **"🔌 Bağlantıyı Test Et"** butonuna basarak yeşil onay alın ve kaydedin.
2. **Sipariş Seçimi:**
   * Ana ekranda **"📦 PAKETLENECEK SİPARİŞİ SEÇİN"** kutusuna dokunun.
   * Arama kutusuna sipariş numarasını (`16902`), markayı (`Acıbadem`) veya ürün adını yazın.
   * Siparişe dokunarak seçin.
3. **Ürün Okutma (Koli Doldurma):**
   * `Koli 1` için koli içine koyduğunuz ürünleri cihazın tetiğine basarak RFID ile okutun.
   * Ekranda anlık sayaç (`1, 2, 3... 24`) ve okunan etiket listesi artacaktır.
4. **Mühürleme:**
   * Koli dolduğunda alttaki yeşil **"📦 1. KOLİYİ KAPAT & MÜHÜRLE (24 ADET)"** butonuna basın.
   * Koli sunucuya kaydedilir, mühürlenir ve sistem otomatik olarak `Koli 2`'ye geçer.
5. **Tünel Kontrolü:**
   * Mühürlenen koli RFID Tüneline konur ve kiosk ekranında `Koli 1` seçilerek %100 doğrulama ve etiketleme yapılır.
