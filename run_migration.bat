@echo off
echo ====================================================
echo VOG Tekstil Premium - Veritabanı UUID Güncelleme Aracı
echo ====================================================
echo.
echo Bu işlem veritabanı şemasını UUID (GUID) yapısına dönüştürecektir.
echo Lütfen bağlantı bilgilerinizin server/.env veya .env dosyasında
echo doğru tanımlandığından emin olun.
echo.
pause
echo.
echo [1/1] Güncelleme işlemi başlatılıyor...
node server\run_migration.cjs
echo.
if %errorlevel% neq 0 (
    echo.
    echo [HATA] Güncelleme başarısız oldu! Yukarıdaki hata mesajını inceleyin.
) else (
    echo.
    echo [BAŞARILI] Veritabanı UUID güncellemesi tamamlandı.
)
echo.
pause
