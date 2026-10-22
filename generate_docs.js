import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import fs from "fs";

const doc = new Document({
    creator: "VOG Enterprise",
    title: "Veri Girişi Kullanım Kılavuzu",
    sections: [
        {
            properties: {},
            children: [
                new Paragraph({
                    text: "VOG ENTERPRISE - VERİ GİRİŞİ KULLANIM KILAVUZU",
                    heading: HeadingLevel.TITLE,
                    alignment: "center",
                    spacing: { after: 400 },
                }),
                
                new Paragraph({
                    text: "Giriş",
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 400, after: 200 },
                }),
                new Paragraph({
                    text: "Bu belge, VOG Enterprise portalı içerisine yeni eklenen 'Veri Girişi' (Admin Data Entry) modülünün nasıl çalıştığını ve nasıl kullanılacağını detaylandırmaktadır. Ekran genel olarak iki sekmeden oluşmaktadır: Satış Girişi ve İrsaliye Girişi.",
                    spacing: { after: 200 },
                }),
                
                new Paragraph({
                    text: "1. Satış Girişi (Sales Entry)",
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 400, after: 200 },
                }),
                new Paragraph({
                    text: "Satış Girişi sekmesi, mevcut bir siparişe veya perakende bir satışa istinaden ürün çıkışlarını kaydetmek için kullanılır. Buradan girilen veriler sistemin 'Satış Raporları' sayfasına doğrudan yansır.",
                    spacing: { after: 200 },
                }),
                new Paragraph({
                    text: "Doldurulması Gereken Alanlar:",
                    heading: HeadingLevel.HEADING_3,
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    bullet: { level: 0 },
                    text: "Sipariş Seçin: İlgili satışın ait olduğu siparişi seçmenizi sağlar (Opsiyonel).",
                }),
                new Paragraph({
                    bullet: { level: 0 },
                    text: "Barkod: Satışı yapılan ürünün benzersiz barkodu.",
                }),
                new Paragraph({
                    bullet: { level: 0 },
                    text: "EAN13: Ürüne ait uluslararası barkod numarası.",
                }),
                new Paragraph({
                    bullet: { level: 0 },
                    text: "Miktar: Kaç adet satış gerçekleştiği girilmelidir.",
                }),
                new Paragraph({
                    bullet: { level: 0 },
                    text: "Lokasyon: Satışın veya çıkışın yapıldığı depo veya mağaza konumu.",
                }),
                new Paragraph({
                    text: "Kullanım: Tüm bilgileri doldurduktan sonra 'KAYDI KAYDET' butonuna basarak işlemi tamamlayabilirsiniz. İşlem sonrası veritabanına kayıt atılır ve stok hareketleri işlenir.",
                    spacing: { before: 200, after: 200 },
                }),

                new Paragraph({
                    text: "2. İrsaliye Girişi (Voucher/Dispatch Entry)",
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 400, after: 200 },
                }),
                new Paragraph({
                    text: "İrsaliye Girişi sekmesi, depoya giren yeni ürünlerin kaydı veya toptan çıkış irsaliyelerinin sisteme işlenmesi için kullanılır. Bu sayfada ürün özelliklerini daha detaylı belirtebilirsiniz. Eklenen veriler 'İrsaliye Arşivi' raporlarında görüntülenir.",
                    spacing: { after: 200 },
                }),
                new Paragraph({
                    text: "Doldurulması Gereken Ek Alanlar:",
                    heading: HeadingLevel.HEADING_3,
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    bullet: { level: 0 },
                    text: "Ürün Adı: Ürünün sistemsel adı.",
                }),
                new Paragraph({
                    bullet: { level: 0 },
                    text: "Renk / Beden / Marka: Ürünün varyant özelliklerini belirtir.",
                }),
                new Paragraph({
                    text: "Kullanım: Gerekli detayları girdikten sonra 'KAYDI KAYDET' butonuna basmanız yeterlidir.",
                    spacing: { before: 200, after: 200 },
                }),

                new Paragraph({
                    text: "Raporlar ve Sonuç",
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 400, after: 200 },
                }),
                new Paragraph({
                    text: "Bu ekranlar aracılığıyla girdiğiniz 'Satış' ve 'İrsaliye' miktarları anlık olarak VOG Veritabanına işlenmektedir. Sistemin sol menüsündeki 'Raporlar' bölümüne geçtiğinizde, girdiğiniz miktarları (Örn: 5 adet satış veya 100 adet irsaliye girişi) eksiksiz olarak rapor tablolarında listelenmiş ve Excel'e dışa aktarılabilir şekilde görebilirsiniz.",
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("Veri_Girisi_Kullanim_Kilavuzu.docx", buffer);
    console.log("Belge başarıyla oluşturuldu.");
});
