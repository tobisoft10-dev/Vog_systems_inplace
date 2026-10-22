const fs = require('fs');
const path = require('path');
const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    Header,
    Footer,
    HeadingLevel,
    AlignmentType,
    BorderStyle,
    WidthType,
    ShadingType,
    PageNumber,
    convertInchesToTwip
} = require('docx');

async function createBeautifulOperationsManual() {
    console.log('🎨 Generating executive-grade Operations Manual (.docx)...');

    // Premium Color Palette
    const cNavy = "0F172A";       // Slate 900
    const cNavyLight = "1E293B";  // Slate 800
    const cCrimson = "DC2626";    // Red 600
    const cBlue = "2563EB";       // Blue 600
    const cEmerald = "059669";    // Emerald 600
    const cAmber = "D97706";      // Amber 600
    const cPurple = "7C3AED";     // Purple 600
    const cTextMain = "1E293B";   // Text Primary
    const cTextMuted = "64748B";  // Text Muted
    const cBgLight = "F8FAFC";    // Slate 50
    const cBorder = "E2E8F0";     // Slate 200

    const cleanBorder = {
        top: { style: BorderStyle.SINGLE, size: 4, color: cBorder },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: cBorder },
        left: { style: BorderStyle.SINGLE, size: 4, color: cBorder },
        right: { style: BorderStyle.SINGLE, size: 4, color: cBorder },
    };

    const noBorder = {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
    };

    // Helper: Callout Box with Colored Left Border
    const createCalloutBox = (title, text, type = 'info') => {
        let borderColor = cBlue;
        let bgColor = "EFF6FF"; // Light blue
        let icon = "💡";

        if (type === 'warning') {
            borderColor = cCrimson;
            bgColor = "FEF2F2"; // Light red
            icon = "⚠️";
        } else if (type === 'success') {
            borderColor = cEmerald;
            bgColor = "F0FDF4"; // Light green
            icon = "✅";
        } else if (type === 'tip') {
            borderColor = cAmber;
            bgColor = "FFFBEB"; // Light amber
            icon = "📌";
        }

        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            margins: { top: 140, bottom: 140, left: 200, right: 160 },
            borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.SINGLE, size: 24, color: borderColor },
                right: { style: BorderStyle.NONE },
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            shading: { fill: bgColor, type: ShadingType.CLEAR },
                            children: [
                                new Paragraph({
                                    spacing: { before: 60, after: 40 },
                                    children: [
                                        new TextRun({ text: `${icon} ${title}`, bold: true, size: 22, color: borderColor })
                                    ]
                                }),
                                new Paragraph({
                                    spacing: { before: 0, after: 60 },
                                    children: [
                                        new TextRun({ text: text, size: 20, color: cTextMain })
                                    ]
                                })
                            ]
                        })
                    ]
                })
            ]
        });
    };

    // Helper: Scenario Card
    const createScenarioCard = (profileNum, title, code, icon, badgeColor, desc, configText, flowText, labelText) => {
        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            margins: { top: 160, bottom: 160, left: 180, right: 180 },
            borders: {
                top: { style: BorderStyle.SINGLE, size: 6, color: cBorder },
                bottom: { style: BorderStyle.SINGLE, size: 6, color: cBorder },
                left: { style: BorderStyle.SINGLE, size: 28, color: badgeColor },
                right: { style: BorderStyle.SINGLE, size: 6, color: cBorder },
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                            children: [
                                // Card Header
                                new Paragraph({
                                    spacing: { before: 60, after: 80 },
                                    children: [
                                        new TextRun({ text: `${icon} SENARYO / PROFİL ${profileNum}: `, bold: true, size: 24, color: badgeColor }),
                                        new TextRun({ text: title, bold: true, size: 24, color: cNavy }),
                                        new TextRun({ text: `  [Kod: ${code}]`, bold: true, size: 18, color: cTextMuted })
                                    ]
                                }),
                                new Paragraph({
                                    spacing: { before: 0, after: 100 },
                                    children: [
                                        new TextRun({ text: desc, italics: true, size: 20, color: cTextMuted })
                                    ]
                                }),
                                // Field: VOG Ayarı
                                new Paragraph({
                                    spacing: { before: 60, after: 40 },
                                    children: [
                                        new TextRun({ text: "⚙️ VOG Panelinde Yapılacak İşlem: ", bold: true, size: 20, color: cNavy }),
                                        new TextRun({ text: configText, size: 20, color: cTextMain })
                                    ]
                                }),
                                // Field: Makine Akışı
                                new Paragraph({
                                    spacing: { before: 40, after: 40 },
                                    children: [
                                        new TextRun({ text: "🔄 Sorter & Konveyör Çalışma Mantığı: ", bold: true, size: 20, color: cNavy }),
                                        new TextRun({ text: flowText, size: 20, color: cTextMain })
                                    ]
                                }),
                                // Field: Etiket Çıktısı
                                new Paragraph({
                                    spacing: { before: 40, after: 60 },
                                    children: [
                                        new TextRun({ text: "🏷️ Koli & Etiket Çıktısı: ", bold: true, size: 20, color: cNavy }),
                                        new TextRun({ text: labelText, size: 20, color: cTextMain })
                                    ]
                                })
                            ]
                        })
                    ]
                })
            ]
        });
    };

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: "Segoe UI",
                        size: 21, // 10.5 pt
                        color: cTextMain
                    },
                    paragraph: {
                        spacing: { line: 280, before: 80, after: 80 }
                    }
                }
            }
        },
        sections: [{
            properties: {
                page: {
                    margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 }
                }
            },
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                                new TextRun({ text: "VOG TEKSTİL LOJİSTİK VE OTOMASYON", size: 16, color: cTextMuted, bold: true }),
                                new TextRun({ text: "  |  Standart Operasyon El Kitabı (SOP)", size: 16, color: "94A3B8" })
                            ]
                        })
                    ]
                })
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.SPACE_BETWEEN,
                            children: [
                                new TextRun({ text: "VOG Enterprise Otomasyon Sistemi v6.0 © 2026", size: 16, color: cTextMuted, italics: true }),
                                new TextRun({ text: "Sayfa ", size: 16, color: cTextMuted }),
                                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: cNavy, bold: true }),
                                new TextRun({ text: " / ", size: 16, color: cTextMuted }),
                                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: cNavy, bold: true })
                            ]
                        })
                    ]
                })
            },
            children: [
                // -------------------------------------------------------------
                // EXECUTIVE TITLE BANNER
                // -------------------------------------------------------------
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    margins: { top: 240, bottom: 240, left: 240, right: 240 },
                    borders: noBorder,
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    shading: { fill: cNavy, type: ShadingType.CLEAR },
                                    children: [
                                        new Paragraph({
                                            alignment: AlignmentType.CENTER,
                                            spacing: { before: 100, after: 60 },
                                            children: [
                                                new TextRun({ text: "VOG TEKSTİL SANAYİ VE TİCARET A.Ş.", size: 24, bold: true, color: "94A3B8", letterSpacing: 20 })
                                            ]
                                        }),
                                        new Paragraph({
                                            alignment: AlignmentType.CENTER,
                                            spacing: { before: 40, after: 80 },
                                            children: [
                                                new TextRun({ text: "AKILLI LOJİSTİK VE OTOMASYON OPERASYON EL KİTABI", size: 32, bold: true, color: "FFFFFF" })
                                            ]
                                        }),
                                        new Paragraph({
                                            alignment: AlignmentType.CENTER,
                                            spacing: { before: 0, after: 100 },
                                            children: [
                                                new TextRun({ text: "SATO CL4NX Plus RFID Yazıcı, RFID Tünel İstasyonu, Otomatik Kolileme & HC Robotics Sorter 5 Çalışma Profili", size: 19, italics: true, color: "CBD5E1" })
                                            ]
                                        })
                                    ]
                                })
                            ]
                        })
                    ]
                }),

                new Paragraph({ spacing: { before: 120, after: 120 } }),

                // Meta Information Table
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    margins: { top: 80, bottom: 80, left: 120, right: 120 },
                    borders: cleanBorder,
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Doküman No:", bold: true, size: 18, color: cNavy })] })] }),
                                new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "VOG-SOP-2026-V1.5", size: 18 })] })] }),
                                new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Yayın Tarihi:", bold: true, size: 18, color: cNavy })] })] }),
                                new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "25 Ağustos 2026", size: 18 })] })] })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Sistem Kapsamı:", bold: true, size: 18, color: cNavy })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "RFID, Yazıcılar, ERP & Sorter", size: 18 })] })] }),
                                new TableCell({ shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Hedef Kitle:", bold: true, size: 18, color: cNavy })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Depo, Üretim, IT, Operatörler", size: 18 })] })] })
                            ]
                        })
                    ]
                }),

                new Paragraph({ spacing: { before: 200, after: 150 } }),

                // -------------------------------------------------------------
                // BÖLÜM 1: SATO CL4NX PLUS
                // -------------------------------------------------------------
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 240, after: 100 },
                    children: [new TextRun({ text: "1. SATO CL4NX PLUS RFID YAZICI OPERASYONU VE AYARLARI", bold: true, size: 26, color: cNavy })]
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "SATO CL4NX Plus, VOG üretim hattında tekstil ürünlerine dikilen veya asılan RFID UHF Gen2 etiketlerin hem üzerine barkod/grafik baskısı yapan hem de dahili çipine EPC kodlayan ana endüstriyel yazıcıdır. Cihazın fabrika açılışında boş etiket israfını önlemek ve kesme hizasında durmasını sağlamak için aşağıdaki adımlar uygulanır:" })
                    ]
                }),

                createCalloutBox("Açılışta 4 Boş Etiket Çıkmasını Kesin Engelleme Kuralı", 
                    "Yazıcı açıldığında veya kafa mandalı kilitlendiğinde SZPL emülasyonunun otomatik kalibrasyon yapması engellenmelidir. Yazıcı ekranından veya Web Arayüzünden SZPL ➔ Power Up Action ➔ 'NO MOTION' ve Head Close Action ➔ 'NO MOTION' seçilmelidir.", 
                    "warning"),

                new Paragraph({ spacing: { before: 100, after: 80 } }),

                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    margins: { top: 100, bottom: 100, left: 120, right: 120 },
                    borders: cleanBorder,
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ width: { size: 28, type: WidthType.PERCENTAGE }, shading: { fill: cNavy, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Ayar Adı", bold: true, color: "FFFFFF" })] })] }),
                                new TableCell({ width: { size: 32, type: WidthType.PERCENTAGE }, shading: { fill: cNavy, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Seçilecek Değer", bold: true, color: "FFFFFF" })] })] }),
                                new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, shading: { fill: cNavy, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Fonksiyonel Açıklama", bold: true, color: "FFFFFF" })] })] })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Web Arayüz Girişi", bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Kullanıcı: admin  |  Şifre: 0310", bold: true, color: cBlue })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Yazıcı IP'si tarayıcıya yazılarak girilir." })] })] })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "SZPL Power Up Action", bold: true })] })] }),
                                new TableCell({ shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "NO MOTION (Hareket Yok)", bold: true, color: cCrimson })] })] }),
                                new TableCell({ shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Açılışta 4 boş etiket atılmasını tamamen durdurur." })] })] })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Yazdırma Modu (Print Mode)", bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tear-Off (Yırtma Modu)", bold: true, color: cEmerald })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Baskı bittiğinde etiketi kesme bıçağında durdurur." })] })] })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Yırtma Ofseti (Offset)", bold: true })] })] }),
                                new TableCell({ shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "+10 mm ile +12 mm", bold: true })] })] }),
                                new TableCell({ shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Perfore çizgisinin tam kesme bıçağına oturması." })] })] })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Geri Çekme (Backfeed)", bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Before Print (Yazdırma Öncesi)", bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Sonraki baskıda etiketi içeri çeker, sıfır kayıp sağlar." })] })] })
                            ]
                        })
                    ]
                }),

                new Paragraph({ spacing: { before: 200, after: 150 } }),

                // -------------------------------------------------------------
                // BÖLÜM 2: RFID TÜNEL & OTOMATİK KOLİLEME
                // -------------------------------------------------------------
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 240, after: 100 },
                    children: [new TextRun({ text: "2. RFID OKUMA TÜNELİ VE OTOMATİK KOLİLEME STANDARTLARI", bold: true, size: 26, color: cNavy })]
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "RFID Okuma Tüneli, dikilmiş ve etiketlenmiş ürünlerin koli içindeyken 2 saniyede 4 antenli Impinj okuyucu ile sayıldığı ana istasyondur." })
                    ]
                }),

                createCalloutBox("Akıllı İki Kademeli Koli Etiketi ve Logo ERP Entegrasyonu",
                    "• Personel Koli Etiketi: Yetkili bayi çalışanlarının ismine özel hazırlanan siparişlerde devreye girer (Personel Adı, Bayi, Beden ve sağda tam boy dikey Code-128 koli barkodu).\n• Sipariş / Sevkiyat Koli Etiketi: Toptan siparişlerde devreye girer (Sipariş No, Müşteri Cari, Beden Dağılım Tablosu ve sağda dikey koli barkodu).\n• Logo Tiger Kağıt İrsaliyesi: Koli tamamlandığında 0.1 saniyede doğrudan Logo MSSQL veritabanına matbu Kağıt İrsaliye (TRCODE=8, EDESPATCH=0) olarak kaydedilir. Tek koliye kesinlikle tek etiket basılır.",
                    "success"),

                new Paragraph({ spacing: { before: 200, after: 150 } }),

                // -------------------------------------------------------------
                // BÖLÜM 3: HC ROBOTICS OMNISORT MINI AĞ & API YAPILANDIRMASI
                // -------------------------------------------------------------
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 240, after: 100 },
                    children: [new TextRun({ text: "3. HC ROBOTICS OMNISORT MINI ENTEGRASYON VE ADRESLEME REHBERİ", bold: true, size: 26, color: cNavy })]
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "HC Robotics OmniSort Mini, 4 Bölüm (Modül/Duvar) ve her bölümde 5 Sütun × 3 Kat olmak üzere toplam 60 göze (sepet) sahip yüksek hızlı otomatik ayrıştırma makinesidir. Sol tarafta 2 bölüm (A1 ve A2), ortada asansör (lift) ve sağ tarafta 2 bölüm (B1 ve B2) yer alır." })
                    ]
                }),

                createCalloutBox("Bağlantı Mimarisi & .env Yapılandırması",
                    "• HC_SORTER_API_URL: http://192.168.1.234 (Sorter PLC Bilgisayarı IP'si)\n• HC_SORTER_PORT: 4000 (Sorter API Portu)\n• HC_SORTER_SYSTEM_ID: M145 (Makine Seri Kodu)\n• HC_SORTER_SITE_ID: M145-SITE-1 (Tesis / Saha Kodu)\n• planWallId (Duvar Kodları): Makinenin 4 bölümü için M145-WALL-1, M145-WALL-2, M145-WALL-3 ve M145-WALL-4 olarak VOG tarafından dinamik yönlendirilir.\n• planIndexInWall: İlgili duvarın içindeki 1-15 arası sepet sıra numarasıdır.",
                    "info"),

                new Paragraph({ spacing: { before: 100, after: 80 } }),

                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    margins: { top: 100, bottom: 100, left: 120, right: 120 },
                    borders: cleanBorder,
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, shading: { fill: cNavy, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Fonksiyon / Arayüz", bold: true, color: "FFFFFF" })] })] }),
                                new TableCell({ width: { size: 45, type: WidthType.PERCENTAGE }, shading: { fill: cNavy, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Girilecek Tam URL", bold: true, color: "FFFFFF" })] })] }),
                                new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, shading: { fill: cNavy, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "İşlem Amacı", bold: true, color: "FFFFFF" })] })] })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "1. Heartbeat / Status", bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "http://192.168.1.251:3001/wms/common/status", size: 18 })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "3 sn'de bir canlılık sinyali gönderir." })] })] })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "2. Destination Query", bold: true })] })] }),
                                new TableCell({ shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "http://192.168.1.251:3001/wms/white/destination/query", size: 18 })] })] }),
                                new TableCell({ shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Barkod okununca hedef gözü sorgular." })] })] })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "3. Mission Finish", bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "http://192.168.1.251:3001/wms/white/mission/finish", size: 18 })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Ürün sepete düşünce koli sayacını artırır." })] })] })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "4. Error Happen", bold: true })] })] }),
                                new TableCell({ shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "http://192.168.1.251:3001/wms/white/error/happen", size: 18 })] })] }),
                                new TableCell({ shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Sıkışma veya arıza bildirimi." })] })] })
                            ]
                        })
                    ]
                }),

                new Paragraph({ spacing: { before: 200, after: 150 } }),

                // -------------------------------------------------------------
                // BÖLÜM 4: 5 ÇALIŞMA PROFİLİ VE SENARYO REHBERİ
                // -------------------------------------------------------------
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 240, after: 100 },
                    children: [new TextRun({ text: "4. SORTER 5 ÇALIŞMA PROFİLİ VE SAHA SENARYOLARI", bold: true, size: 26, color: cNavy })]
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "VOG sisteminde fabrikanın anlık iş yüküne göre tek tıkla geçiş yapılabilen 5 farklı operasyonel çalışma profili geliştirilmiştir. Her senaryonun detaylı uygulama adımları:" })
                    ]
                }),

                new Paragraph({ spacing: { before: 100, after: 80 } }),

                // CARD 1: PROFILE_BRAND_DEALER
                createScenarioCard(
                    1,
                    "Standart Marka / Bayi Ayrıştırma",
                    "PROFILE_BRAND_DEALER",
                    "🎯",
                    cBlue,
                    "En yaygın kullanılan standart dağıtım modudur. Her marka veya bayi tanımlı tekil sabit gözüne ayrıştırılır.",
                    "Hedef kutusuna 'FORD' yazıp A1-01 seçin. 'SEAT' yazıp A1-02 seçin. 'DOĞUŞ OTO' yazıp B1-01 seçin.",
                    "Barkod okunduğunda ürünün müşterisi bulunur. Ford ürünleri A1-01'e, Seat ürünleri A1-02'ye, Doğuş Oto ürünleri B1-01'e yönlendirilir.",
                    "Her gözde ilgili bayiye ait ürünler toplanır. Sepet dolduğunda operatör koli etiketini basar."
                ),

                new Paragraph({ spacing: { before: 140, after: 100 } }),

                // CARD 2: PROFILE_CASCADE_OVERFLOW
                createScenarioCard(
                    2,
                    "Otomatik Kaskad Taşma Modu (Yüksek Hacimli Siparişler)",
                    "PROFILE_CASCADE_OVERFLOW",
                    "🌊",
                    cEmerald,
                    "Bir bayinin siparişi 100-200 adet gibi tek sepete sığmayacak büyüklükte olduğunda kullanılır. Hat durmadan otomatik sıradaki koliye akar.",
                    "Aynı müşteriye birden fazla ardışık göz tanımlayın: 'DOĞUŞ OTO' ➔ A1-01 (Sıra 1, Kapasite: 25), 'DOĞUŞ OTO' ➔ A1-02 (Sıra 2, Kapasite: 25), 'DOĞUŞ OTO' ➔ A1-03 (Sıra 3, Kapasite: 25).",
                    "Sistem A1-01 sepetine 25 adet ürün düşürdükten sonra o gözü 'DOLU' işaretler. Okutulan 26. ürünü otomatik olarak A1-02 sepetine, o da dolunca A1-03 sepetine yönlendirir.",
                    "Her koli tam 25 adetlik paketler halinde kesintisiz tamamlanır (Koli 1/3, Koli 2/3, Koli 3/3)."
                ),

                new Paragraph({ spacing: { before: 140, after: 100 } }),

                // CARD 3: PROFILE_PRODUCT_SIZE_SPLIT
                createScenarioCard(
                    3,
                    "Ürün Modeli & Beden Ayrıştırma Modu",
                    "PROFILE_PRODUCT_SIZE_SPLIT",
                    "👕",
                    cPurple,
                    "Kolilerin içine mont ve pantolonun karışmasını engellemek veya bedenleri (S, M, L, XL) ayrı kolilere ayrıştırmak için kullanılır.",
                    "Hedef kutusuna ürün/beden tanımını seçin: 'SOFTSHELL MONT' ➔ A1-11, 'İŞ PANTOLONU' ➔ A1-12, 'L BEDEN' ➔ A1-13, 'XL BEDEN' ➔ A1-14.",
                    "Sistem ürünün model ve beden bilgisine bakar. Montlar sadece A1-11 sepetine, pantolonlar A1-12'ye, L bedenler A1-13 sepetine ayrışır.",
                    "Kolileme sonrası her kolide tek tip/beden ürün bulunması garanti edilir."
                ),

                new Paragraph({ spacing: { before: 140, after: 100 } }),

                // CARD 4: PROFILE_DYNAMIC_PACKING
                createScenarioCard(
                    4,
                    "Dinamik Koli Dolum & Otomatik Etiketleme",
                    "PROFILE_DYNAMIC_PACKING",
                    "📦",
                    cAmber,
                    "60 adet gözün gün boyu maksimum hızla dönmesini sağlamak için kullanılır. Sepet dolduğu anda otomatik koli etiketi tetiklenir.",
                    "Hedef müşteri ve hedef koli kapasitesi (örn: 25 adet) tanımlanır. Ekrandan 'Otomatik Koli Etiketi Bas' aktif edilir.",
                    "Sepete 25. ürün düştüğü anda ekrandaki göz kırmızı 'DOLU' durumuna geçer ve Godex/SATO yazıcıdan otomatik koli etiketi basılır. Operatör koliyi alıp butona basarak gözü sıfırlar.",
                    "Aynı göz sıfırlandığı anda yeni koli için hemen tekrar kullanılabilir hale gelir."
                ),

                new Paragraph({ spacing: { before: 140, after: 100 } }),

                // CARD 5: PROFILE_SMART_HYBRID
                createScenarioCard(
                    5,
                    "Akıllı Hibrit Mod (Smart Hybrid)",
                    "PROFILE_SMART_HYBRID",
                    "⚡",
                    cCrimson,
                    "Fabrikanın tüm kurallarını otonom birleştiren akıllı moddur.",
                    "Sistemde hem bayi hem ürün/beden eşleştirmeleri tanımlı bırakılır.",
                    "Sistem barkod okunduğunda önce ürün/beden kuralı varsa onu uygular; yoksa bayi kuralına geçer; çoklu sepet varsa kaskad taşma yapar.",
                    "Operatörün sürekli profil değiştirmesine gerek kalmadan en optimize ayrıştırma sağlanır."
                ),

                new Paragraph({ spacing: { before: 200, after: 150 } }),

                // -------------------------------------------------------------
                // BÖLÜM 5: ÇİNCE MÜHENDİSLİK TEKNİK BİLGİ FORMU
                // -------------------------------------------------------------
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 240, after: 100 },
                    children: [new TextRun({ text: "5. 🇨🇳 HC ROBOTICS 分拣机 WMS 接口技术配置表 (FOR CHINESE ENGINEERS)", bold: true, size: 24, color: cNavy })]
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "本章节为慧仓 (HC Robotics) 分拣机现场调试与接口配置说明，可直接提供给现场工程师：" })
                    ]
                }),

                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    margins: { top: 100, bottom: 100, left: 120, right: 120 },
                    borders: cleanBorder,
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, shading: { fill: cNavy, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "接口名称 (API Name)", bold: true, color: "FFFFFF" })] })] }),
                                new TableCell({ width: { size: 45, type: WidthType.PERCENTAGE }, shading: { fill: cNavy, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "完整 URL (Endpoint)", bold: true, color: "FFFFFF" })] })] }),
                                new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, shading: { fill: cNavy, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "功能描述 (Function)", bold: true, color: "FFFFFF" })] })] })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "心跳接口 (Heartbeat)", bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "http://192.168.1.251:3001/wms/common/status", size: 18 })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "上报分拣机在线状态 (每3秒)" })] })] })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "目的格口查询 (Query)", bold: true })] })] }),
                                new TableCell({ shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "http://192.168.1.251:3001/wms/white/destination/query", size: 18 })] })] }),
                                new TableCell({ shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "扫码返回 planWallId & planIndex" })] })] })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "落格完成确认 (Finish)", bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "http://192.168.1.251:3001/wms/white/mission/finish", size: 18 })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "包裹成功落入格口后上报确认" })] })] })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "故障报警上报 (Error)", bold: true })] })] }),
                                new TableCell({ shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "http://192.168.1.251:3001/wms/white/error/happen", size: 18 })] })] }),
                                new TableCell({ shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "卡件或机械故障异常上报" })] })] })
                            ]
                        })
                    ]
                }),

                new Paragraph({ spacing: { before: 200, after: 150 } }),

                // -------------------------------------------------------------
                // BÖLÜM 6: HIZLI ARIZA VE HATA GİDERME
                // -------------------------------------------------------------
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 240, after: 100 },
                    children: [new TextRun({ text: "6. HIZLI ARIZA VE HATA GİDERME MATRİSİ (TROUBLESHOOTING)", bold: true, size: 26, color: cNavy })]
                }),

                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    margins: { top: 100, bottom: 100, left: 120, right: 120 },
                    borders: cleanBorder,
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, shading: { fill: cNavy, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Gözlenen Problem", bold: true, color: "FFFFFF" })] })] }),
                                new TableCell({ width: { size: 35, type: WidthType.PERCENTAGE }, shading: { fill: cNavy, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Olası Nedeni", bold: true, color: "FFFFFF" })] })] }),
                                new TableCell({ width: { size: 35, type: WidthType.PERCENTAGE }, shading: { fill: cNavy, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Uygulanacak Kesin Çözüm", bold: true, color: "FFFFFF" })] })] })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "SATO açılışta 4 boş etiket atıyor", bold: true, color: cCrimson })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "SZPL Power Up Action ayarı Calibrate kalmıştır." })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "SZPL menüsünden Power Up Action ➔ NO MOTION yapın." })] })] })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "SATO kesme yerinde durmuyor", bold: true, color: cCrimson })] })] }),
                                new TableCell({ shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Yazdırma modu Sürekli (Continuous) kalmıştır." })] })] }),
                                new TableCell({ shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Print Mode ➔ Tear-Off ve Stop Offset ➔ +10mm yapın." })] })] })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Panelde 'CONNECTION LOST' kırmızı yanıyor", bold: true, color: cCrimson })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Sorter makinesinden son 10 sn heartbeat gelmemiştir." })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Sorter yazılımında WMS IP'nin http://192.168.1.251:3001 olduğunu ve ağ kablosunu kontrol edin." })] })] })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Ürünler yanlış göze düşüyor", bold: true, color: cCrimson })] })] }),
                                new TableCell({ shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Göz Eşleştirme tablosunda hedef adı hatalı yazılmıştır." })] })] }),
                                new TableCell({ shading: { fill: cBgLight, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Web panelinden [GÖZ EŞLEŞTİRME] menüsüne girip bayi veya ürün adını kontrol edin." })] })] })
                            ]
                        })
                    ]
                }),

                new Paragraph({ spacing: { before: 300, after: 100 } }),

                // -------------------------------------------------------------
                // KALİTE VE ONAY İMZASI
                // -------------------------------------------------------------
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    margins: { top: 140, bottom: 140, left: 180, right: 180 },
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 8, color: cNavy },
                        bottom: { style: BorderStyle.NONE },
                        left: { style: BorderStyle.NONE },
                        right: { style: BorderStyle.NONE }
                    },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            spacing: { before: 80, after: 40 },
                                            children: [
                                                new TextRun({ text: "VOG TEKSTİL BİLGİ İŞLEM VE OTOMASYON DİREKTÖRLÜĞÜ\n", bold: true, size: 20, color: cNavy }),
                                                new TextRun({ text: "Endüstri 4.0 Akıllı Depo & Fabrika Otomasyon Standartları  |  Sistem Versiyonu: VOG Enterprise v6.0", size: 18, color: cTextMuted })
                                            ]
                                        })
                                    ]
                                })
                            ]
                        })
                    ]
                })
            ]
        }]
    });

    const outputPath = path.join('c:\\vog_system', 'VOG_OTOMASYON_OPERASYON_EL_KITABI.docx');
    const buffer = await Packer.toBuffer(doc);
    try {
        fs.writeFileSync(outputPath, buffer);
        console.log(`✅ Executive Operations Manual (.docx) created successfully: ${outputPath}`);
    } catch (writeErr) {
        if (writeErr.code === 'EBUSY') {
            const altPath = path.join('c:\\vog_system', 'VOG_OTOMASYON_OPERASYON_EL_KITABI_YENI.docx');
            fs.writeFileSync(altPath, buffer);
            console.log(`⚠️ Word dosyası açık olduğu için alternatif isimle kaydedildi: ${altPath}`);
        } else {
            throw writeErr;
        }
    }

    // Also copy to artifact dir
    const artifactPath = path.join('C:\\Users\\ctopuz\\.gemini\\antigravity-ide\\brain\\169eb983-31aa-4750-aa24-b0b32dc83038', 'VOG_OTOMASYON_OPERASYON_EL_KITABI.docx');
    try {
        fs.writeFileSync(artifactPath, buffer);
    } catch (_) {}
}

createBeautifulOperationsManual().catch(err => {
    console.error('DOCX Beautify Error:', err);
});
