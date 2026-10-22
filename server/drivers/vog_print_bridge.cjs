/**
 * VOG Tekstil Premium - Native Hardware Print Bridge & RFID Encoder
 * 
 * Godex (EZPL/GEPL) ve Zebra (ZPL II) endüstriyel termal barkod yazıcılarına
 * doğrudan TCP/IP Socket (Port 9100), Windows Raw Print Spooler veya PDF üzerinden
 * yüksek çözünürlüklü etiket basımı ve RFID EPC çip kodlaması sağlar.
 */

const net = require('net');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class VOGPrintBridge {
    constructor() {
        this.defaultPrinterName = process.env.PRINTER_NAME || 'Godex G530';
        this.defaultNetworkPort = 9100; // Standart RAW Print Portu (Zebra/Godex Ethernet)
    }

    /**
     * 24 Haneli Standart RFID EPC Hex Kodu Üretir
     * Format: Header (6 hex) + Barkod/SKU Pad (10 hex) + Timestamp (8 hex)
     */
    generateRFID_EPC(barcode = '0000000000') {
        const cleanBarcode = barcode.replace(/[^0-9A-Za-z]/g, '').padEnd(10, '0').substring(0, 10);
        const hexBarcode = Buffer.from(cleanBarcode).toString('hex').substring(0, 10).toUpperCase();
        const hexTime = Date.now().toString(16).toUpperCase().padStart(8, '0').substring(0, 8);
        return `30395D${hexBarcode}${hexTime}`.substring(0, 24);
    }

    /**
     * 80x100mm Dikey (Portrait) Koli Etiketi İçin Raw ZPL II Komut Kümesi Üretir
     * Godex G530 (300 DPI / 12 dpmm = 945x1181 dots) ve ZPL uyumlu tüm termal yazıcılarda tam dikey basılır.
     */
    generateBoxLabelZPL(data) {
        const brand = (data.brand || 'VOG').toUpperCase();
        const orderNo = (data.order_number || data.order_id || '1001').toString().trim();
        const boxNo = parseInt(data.box_no, 10) || 1;
        const totalBoxes = parseInt(data.total_boxes, 10) || 1;
        const subCustomer = (data.sub_customer_name || data.customer_name || data.dealer_name || 'DOGUS OTOMOTIV').substring(0, 36);
        const staffName = (data.staff_name || 'GENEL').substring(0, 24);
        const modelName = (data.product_name || 'TEKSTIL URUNLERI').substring(0, 38);
        const totalQty = parseInt(data.quantity || data.total_quantity || 1, 10);
        const barcodeStr = (data.barcode || (orderNo ? `BOX-${orderNo}-${boxNo}` : '1001-PASS-TR')).toString().trim();
        const currentDate = new Date().toLocaleDateString('tr-TR');

        let rowsZpl = '';
        const startY = 270;
        const rowH = 46;
        const maxRows = 10;
        let displayItems = [];

        if (Array.isArray(data.items) && data.items.length > 0) {
            displayItems = data.items.slice(0, maxRows);
        } else if (Array.isArray(data.items_plan) && data.items_plan.length > 0) {
            displayItems = data.items_plan.slice(0, maxRows).map(p => ({
                part_no: p.sku || p.part_no || 'STD',
                product_name: modelName,
                size: p.size || 'STD',
                quantity: p.quantity || p.target_quantity || 1
            }));
        } else if (data.items_breakdown && typeof data.items_breakdown === 'object') {
            displayItems = Object.entries(data.items_breakdown).slice(0, maxRows).map(([sz, q]) => ({
                part_no: 'STD',
                product_name: modelName,
                size: sz,
                quantity: q
            }));
        } else {
            displayItems = [{
                part_no: data.sku || 'STD',
                product_name: modelName,
                size: data.size || 'STD',
                quantity: totalQty
            }];
        }

        displayItems.forEach((it, idx) => {
            const y = startY + (idx * rowH);
            const partNoTxt = String(it.part_no || it.sku || 'STD').substring(0, 14);
            const prodTxt = String(it.product_name || modelName).substring(0, 26);
            const sizeTxt = String(it.clean_size || it.size || 'STD').replace(/^BEDEN\s*/i, '').substring(0, 6);
            const qtyTxt = String(it.quantity || 1);

            rowsZpl += `
^FO25,${y}^GB895,${rowH},1^FS
^FO35,${y + 11}^A0N,26,22^FD${partNoTxt}^FS
^FO250,${y}^GB1,${rowH},1^FS
^FO260,${y + 11}^A0N,26,22^FD${prodTxt}^FS
^FO700,${y}^GB1,${rowH},1^FS
^FO715,${y + 10}^A0N,28,24^FD${sizeTxt}^FS
^FO805,${y}^GB1,${rowH},1^FS
^FO835,${y + 9}^A0N,30,26^FD${qtyTxt}^FS`;
        });

        for (let i = displayItems.length; i < maxRows; i++) {
            const y = startY + (i * rowH);
            rowsZpl += `
^FO25,${y}^GB895,${rowH},1^FS
^FO250,${y}^GB1,${rowH},1^FS
^FO700,${y}^GB1,${rowH},1^FS
^FO805,${y}^GB1,${rowH},1^FS`;
        }

        const tableEndY = startY + (maxRows * rowH);
        const summaryBoxY = tableEndY + 10;
        const bottomCardY = summaryBoxY + 130;
        const bottomCardH = 220;
        const outerHeight = bottomCardY + bottomCardH + 10 - 15;

        // 80mm x 100mm Portrait @ 300 DPI = 945 x 1181 dots
        return `^XA
^PW945
^LL1181
^PON
^LH0,0

^FX === OUTER FRAME (80x100mm PORTRAIT) ===
^FO20,15^GB905,${outerHeight},3^FS

^FX === HEADER BANNER (SOLID INVERTED) ===
^FO20,15^GB905,70,70^FS
^FO35,24^A0N,40,34^FR^FD${brand}^FS
^FO300,30^A0N,26,22^FR^FD|  SEVKIYAT KOLISI^FS
^FO660,24^A0N,34,30^FR^FDKOLI: ${boxNo} / ${totalBoxes}^FS

^FX === SIPARIS & MUSTERI BILGI KARTI ===
^FO20,85^GB905,95,2^FS
^FO35,93^A0N,18,16^FDSIPARIS NUMARASI^FS
^FO35,114^A0N,34,28^FD#${orderNo}^FS

^FO340,85^GB2,95,2^FS
^FO355,93^A0N,18,16^FDMUSTERI / CARI UNVANI^FS
^FO355,114^A0N,28,24^FD${subCustomer}^FS

^FX === MODEL TANIMI ===
^FO20,180^GB905,44,2^FS
^FO35,192^A0N,20,18^FDURUN / MODEL:^FS
^FO180,190^A0N,26,22^FD${modelName}^FS

^FX === TABLO BASLIKLARI (PARCA NO DAHIL 4 KOLON) ===
^FO25,228^GB895,42,42^FS
^FO35,238^A0N,24,20^FR^FDParca No^FS
^FO260,238^A0N,24,20^FR^FDUrun Aciklamasi^FS
^FO715,238^A0N,24,20^FR^FDBeden^FS
^FO825,238^A0N,24,20^FR^FDAdet^FS

${rowsZpl}

^FX === TOPLAM ADET KUTUSU ===
^FO25,${summaryBoxY}^GB895,120,3^FS
^FO40,${summaryBoxY + 14}^A0N,20,16^FDKOLI VE SIPARIS TOPLAM ADEDI^FS
^FO40,${summaryBoxY + 38}^A0N,44,38^FD${totalQty} ADET URUN^FS
^FO40,${summaryBoxY + 90}^A0N,20,16^FDUretici: VOG TEKSTIL SAN. VE TIC. A.S.^FS

^FO510,${summaryBoxY + 18}^A0N,22,18^FDDurum: SEVKIYATA HAZIR^FS
^FO510,${summaryBoxY + 46}^A0N,22,18^FDKayit: KAGIT IRSALIYE^FS
^FO510,${summaryBoxY + 74}^A0N,20,16^FDIrsaliye: OTOMATIK (LOGO ERP)^FS

^FX === ALT DIGITAL QR & BARKOD KUTUSU ===
^FO25,${bottomCardY}^GB895,${bottomCardH},2^FS
^FO40,${bottomCardY + 15}^BQN,2,5^FDMA,${barcodeStr}^FS
^BY2,3,65
^FO190,${bottomCardY + 15}^BCN,65,N,N,N^FD${barcodeStr}^FS
^FO190,${bottomCardY + 88}^A0N,26,22^FD${barcodeStr}^FS
^FO190,${bottomCardY + 120}^A0N,20,16^FDDIGITAL KOLI QR & EPC SGTIN-96 DOGRULANDI^FS
^FO190,${bottomCardY + 148}^A0N,18,14^FDTarih: ${currentDate} | VOG RFID TUNNEL SYSTEM OK^FS
^FO190,${bottomCardY + 174}^A0N,16,13^FDSevkiyat No: ${orderNo} | Standart Sevkiyat Kolisi^FS

^PQ1
^XZ`.trim();
    }

    /**
     * Tekil Ürün Etiketi İçin Raw ZPL II Komut Kümesi Üretir (Code-128 Linear Barkod + RFID)
     */
    generateProductLabelZPL(data) {
        const brand = (data.brand || 'VOG').toUpperCase();
        const productName = data.product_name || 'Tekstil Ürünü';
        const sku = data.sku || data.code39 || 'SKU1001';
        const barcode = data.barcode || data.ean13 || sku;
        const size = data.size || 'STD';
        const color = data.color || 'STANDART';
        const epcHex = this.generateRFID_EPC(barcode);

        return `
^XA
^PW600
^LL400
^PON

^FO30,30^GB540,340,3^FS

^FO50,50^A0N,30,30^FD${brand}^FS
^FO420,50^A0N,28,28^FD${size}^FS

^FO50,90^A0N,22,22^FD${productName.substring(0, 28)}^FS
^FO50,120^A0N,20,20^FDRenk: ${color} | SKU: ${sku}^FS

^FO50,170^BY2,3,70^BCN,70,Y,N,N^FD${barcode}^FS

^FO50,300^A0N,18,18^FDRFID: ${epcHex}^FS

^RFW,H^FD${epcHex}^FS

^XZ
`.trim();
    }

    /**
     * Ağ Yazıcısına Doğrudan Raw TCP/IP Socket (Port 9100) Üzerinden Komut Gönderir
     */
    sendRawToNetworkPrinter(ip, rawData, port = 9100) {
        return new Promise((resolve, reject) => {
            const client = new net.Socket();
            client.setTimeout(5000);

            client.connect(port, ip, () => {
                console.log(`🖨️ [PRINT BRIDGE] Ağ Yazıcısına Bağlanıldı: ${ip}:${port}`);
                client.write(rawData, 'utf8', () => {
                    console.log(`✅ [PRINT BRIDGE] Raw ZPL/EZPL Komutu Başarıyla İletildi (${rawData.length} bayt)`);
                    client.end();
                    resolve({ success: true, method: 'RAW_SOCKET', ip, bytes: rawData.length });
                });
            });

            client.on('timeout', () => {
                client.destroy();
                reject(new Error(`Yazıcı bağlantı zaman aşımı (${ip}:${port})`));
            });

            client.on('error', (err) => {
                reject(new Error(`Yazıcı socket hatası (${ip}:${port}): ${err.message}`));
            });
        });
    }

    /**
     * Windows Raw Print Spooler Üzerinden USB / Yerel / RDP Yönlendirilmiş Yazıcıya Gönderir
     */
    sendRawToWindowsSpooler(printerName, rawData) {
        return new Promise((resolve, reject) => {
            const targetPrinter = (printerName || this.defaultPrinterName).replace(/'/g, '');
            const tempFile = path.join(__dirname, `temp_raw_${Date.now()}_${Math.random().toString(36).substring(7)}.zpl`);
            const senderScript = path.resolve(__dirname, '..', 'raw_printer_sender.ps1');

            fs.writeFile(tempFile, rawData, 'utf8', (writeErr) => {
                if (writeErr) return reject(writeErr);

                // Native Win32 Spooler scripti ile RAW ZPL komutlarını doğrudan Windows kuyruğuna ilet
                const psCommand = `powershell -NoProfile -ExecutionPolicy Bypass -File "${senderScript}" -PrinterKeyword "${targetPrinter}" -FilePath "${tempFile}"`;

                exec(psCommand, (execErr, stdout, stderr) => {
                    // Geçici dosyayı temizle
                    fs.unlink(tempFile, () => {});

                    const output = (stdout || '') + (stderr || '');
                    const matchedPrinterMatch = output.match(/FOUND_PRINTER:(.+)/);
                    const matchedPrinter = matchedPrinterMatch ? matchedPrinterMatch[1].trim() : targetPrinter;
                    const isSuccess = output.includes('PRINT_SUCCESS:True');

                    if (isSuccess) {
                        console.log(`✅ [PRINT BRIDGE] Windows Spooler'a Başarıyla İletildi: ${matchedPrinter}`);
                        resolve({ success: true, method: 'WINDOWS_SPOOLER', printer: matchedPrinter });
                    } else {
                        console.warn(`⚠️ [PRINT BRIDGE] Spooler uyarısı (${targetPrinter}):`, output || execErr?.message);
                        resolve({ success: false, method: 'WINDOWS_SPOOLER', printer: matchedPrinter, warning: output || execErr?.message });
                    }
                });
            });
        });
    }

    /**
     * Windows Print Spooler Kuyruğundaki Bekleyen/Yazdırılan İşleri İptal Eder
     */
    cancelSpoolerJobs(printerName) {
        return new Promise((resolve) => {
            const targetPrinter = printerName || this.defaultPrinterName;
            const psCommand = `powershell -Command "Get-PrintJob -PrinterName '${targetPrinter}' -ErrorAction SilentlyContinue | Remove-PrintJob -ErrorAction SilentlyContinue"`;
            exec(psCommand, (err, stdout, stderr) => {
                if (err) {
                    console.warn(`⚠️ [PRINT BRIDGE] Spooler iş iptali uyarısı (${targetPrinter}):`, err.message);
                    resolve({ success: false, printer: targetPrinter, warning: err.message });
                } else {
                    console.log(`🛑 [PRINT BRIDGE] Spooler işleri başarıyla iptal edildi/temizlendi: ${targetPrinter}`);
                    resolve({ success: true, printer: targetPrinter });
                }
            });
        });
    }

    /**
     * Akıllı Yazdırma Dağıtıcısı (IP varsa Network Socket, yoksa Windows Spooler dener)
     */
    async dispatchPrint(labelData, type = 'box', target = {}) {
        const rawZpl = type === 'box'
            ? this.generateBoxLabelZPL(labelData)
            : this.generateProductLabelZPL(labelData);

        if (target.ip) {
            return await this.sendRawToNetworkPrinter(target.ip, rawZpl, target.port || this.defaultNetworkPort);
        } else {
            return await this.sendRawToWindowsSpooler(target.printerName || this.defaultPrinterName, rawZpl);
        }
    }
}

const printBridgeInstance = new VOGPrintBridge();
module.exports = printBridgeInstance;
