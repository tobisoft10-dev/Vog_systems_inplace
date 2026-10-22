const fs = require('fs');
const http = require('http');

const YERLI_URETIM_GFA = "^GFA,552,552,12,00000000000000000000000000000000000000000000000000000FFFFFFFFFFFFFFFFFFC00001FFFFFFFFFFFFFFFFFFC00007FFFFFFFFFFFFFFFFFFC0000F800000000000000000C0001F000000000000000000C0003C000000000000038000C000787E0000000000038000C000F0FE0000000000000000C000E1FF001C77F7F3838000C000E3C7801CE7F7FB838000C000FF83800EE7E7FB838000C000FF01C00FE7073B838000C000FE00E00FC7E73B838000C0000000F007C7E7FB838000C100000C700787E7F3838000C100001E38038707F3838000C187C00E3C0387E773FB8000C1CFE0071C0387F773FB8000C1FFE0C78E0387F73BFB8000C1FC70E38700000000000000C1F8F8F1C700000000000000C1E1FC70E700000000030000C1E3DC38FF0DC00000038000C1E78C1C7F04800000010000C1FF0F1E7F18C7C3F3F31830C1FE1F8E7F1CEFF3F7FBBC78C1FC3F87FF1CEFF3F7FBBC78C1FC7187FF1CEF7383F3BEF8C1FEE1C3FF1CEE7380E3BFF8C1FFC3F7FF1CEF73F0E3BFF8C1FF87FFFF1CEFF3F0E3BFF8C1FF8F7FFF1CEFE380E3BBB8C1FFDE3FFF1DEFE380E3B938C1FFFC3FFF1FEEF3F0E3B938C1FFF87FFF1FCE73F9E3B838C1FFF0FFFF0F8E73F0C39830C1FFF1FFFF00000000000000C1FFFFFFFF00000000000000C1FFFFFFFF00000000000001C1FFFFFFFFFFFFFFFFFFFFFFC1FFFFFFFFFFFFFFFFFFFFFFC1FFFFFFFFFFFFFFFFFFFFFFC000000000000000000000000000000000000000000000000";
const RFID_LOGO_GFA = "^GFA,322,322,7,0000000000000000000003FC00000000001FFF80000000007FFFC000000000FF0FE000000000F801F0000FFFF860F0F8001FFFF007FE3C001FFFE00FFF3E001C00001FFF9E001C00001E07CE001C00000C03CF001C000000E1E7001C000003F1E7001C000003F8E7001C000007F8E7801C000007F8E7801C000007F8E7001C000003F8E7001C000003F1E7001C000000E3CF001C00000003CF001C000000079E001C000000071E001C000000023C001C000000007C001C00000000F8001C00000000F0001C00000000E0001DFCFECFC000001DFEFCCFE000001D86C0CC6000001D8EE0CC6100001DFCFCCC3700001DF8E0CC2700001D9CC0CC6700001D8CC0CC6700001D86C0CFC700001C82404F0700001C0000000700001C0000000700001C0000000700001FFFFFFFFF00001FFFFFFFFF00000FFFFFFFFE000000000000000000";

function generateQrZpl(item) {
    const titleLine1 = item.title.substring(0, 32);
    const gender = item.gender;
    const brand = item.brand;
    const size = item.size;
    const epc = item.epc;
    const parcaNo = item.parcaNo.substring(0, 24);
    const dateStr = item.date;
    const fontZpl = titleLine1.length > 25 ? '^A0N,18,15' : '^A0N,20,17';
    const parcaFont = parcaNo.length > 16 ? '^A0N,18,15' : (parcaNo.length > 13 ? '^A0N,20,17' : '^A0N,22,18');

    return `^XA
^PW440
^LL272
^PON
^LH55,10
^PR3,3
^MD12
^RS8,,,1^FS
^RFW,H^FD${epc}^FS
^FO0,4${fontZpl}^FD${titleLine1}^FS
^FO0,26^A0N,18,16^FD${gender}  |  ${brand}^FS
^FO0,48^GB340,2,2^FS
^FO4,54^BQN,2,3^FDMA,${parcaNo}^FS
^FO85,54^A0N,16,14^FDPARCA NO:^FS
^FO85,72${parcaFont}^FD${parcaNo}^FS
^FO85,98^A0N,16,14^FDBEDEN:^FS
^FO85,116^A0N,30,26^FD${size}^FS
^FO0,154^GB340,2,2^FS
^FO0,162^A0N,15,13^FDTARIH: ${dateStr}^FS
^FO0,180^A0N,14,12^FDVOG TEKSTIL SAN. VE TIC. A.S.^FS
^FO0,198^A0N,13,11^FDTurkiye'de uretilmistir.^FS
^FO175,160${YERLI_URETIM_GFA}^FS
^FO280,160${RFID_LOGO_GFA}^FS
^XZ`;
}

function generateClassicZpl(item) {
    const titleLine1 = item.title.substring(0, 32);
    const gender = item.gender;
    const brand = item.brand;
    const size = item.size;
    const epc = item.epc;
    const parcaNo = item.parcaNo.substring(0, 24);
    const dateStr = item.date;
    const fontZpl = titleLine1.length > 25 ? '^A0N,18,15' : '^A0N,20,17';
    const parcaFont = parcaNo.length > 16 ? '^A0N,18,15' : (parcaNo.length > 13 ? '^A0N,20,17' : '^A0N,22,18');
    const byWidth = parcaNo.length > 12 ? 1 : 2;
    const barcodeWidth = (parcaNo.length * 11 + 35) * byWidth;
    const startBarcodeX = Math.max(0, Math.round((340 - barcodeWidth) / 2));

    return `^XA
^PW440
^LL272
^PON
^LH55,10
^PR3,3
^MD12
^RS8,,,1^FS
^RFW,H^FD${epc}^FS
^FO0,4${fontZpl}^FD${titleLine1}^FS
^FO0,26^A0N,18,16^FD${gender}  |  ${brand}^FS
^FO0,48^GB340,2,2^FS
^FO${startBarcodeX},54^BY${byWidth},2,34^BCN,34,N,N,N^FD${parcaNo}^FS
^FO0,96^A0N,16,14^FDPARCA NO:^FS
^FO85,94${parcaFont}^FD${parcaNo}^FS
^FO0,122^A0N,16,14^FDBEDEN:^FS
^FO85,116^A0N,30,26^FD${size}^FS
^FO0,154^GB340,2,2^FS
^FO0,162^A0N,15,13^FDTARIH: ${dateStr}^FS
^FO0,180^A0N,14,12^FDVOG TEKSTIL SAN. VE TIC. A.S.^FS
^FO0,198^A0N,13,11^FDTurkiye'de uretilmistir.^FS
^FO175,160${YERLI_URETIM_GFA}^FS
^FO280,160${RFID_LOGO_GFA}^FS
^XZ`;
}

function renderLabel(zpl, filename) {
    const postData = zpl;
    const options = {
        hostname: 'api.labelary.com',
        port: 80,
        path: '/v1/printers/8dpmm/labels/2.165x1.338/0/',
        method: 'POST',
        headers: {
            'Accept': 'image/png',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                fs.writeFileSync(filename, buffer);
                console.log('Saved ' + filename + ' (' + buffer.length + ' bytes)');
                resolve();
            });
        });
        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

(async () => {
    const sample = {
        title: '2026 KIS VW GARANTI, FORMEN, ATO',
        gender: 'ERKEK',
        brand: 'VOLKSWAGEN',
        size: '9XL (62)',
        epc: '303B50CC00422E00000004',
        parcaNo: 'PVWK100088XXXXXXXXXL',
        date: '04.09.2026'
    };

    await renderLabel(generateQrZpl(sample), 'C:/Users/ctopuz/.gemini/antigravity-ide/brain/c34f4e10-3c55-40ab-b459-0ed82107b237/sato_55x34_calibrated_qr.png');
    await renderLabel(generateClassicZpl(sample), 'C:/Users/ctopuz/.gemini/antigravity-ide/brain/c34f4e10-3c55-40ab-b459-0ed82107b237/sato_55x34_calibrated_1d.png');
    console.log('Rendered both preview images successfully!');
})();
