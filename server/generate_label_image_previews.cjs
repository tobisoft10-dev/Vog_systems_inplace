const fs = require('fs');
const https = require('http');

async function renderZplPreview(zpl, filename) {
    return new Promise((resolve, reject) => {
        const req = https.request('http://api.labelary.com/v1/printers/8dpmm/labels/4x3/0/', {
            method: 'POST',
            headers: {
                'Accept': 'image/png',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }, (res) => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                fs.writeFileSync(filename, buffer);
                console.log(`✅ Saved preview image to ${filename}`);
                resolve();
            });
        });
        req.on('error', reject);
        req.write(zpl);
        req.end();
    });
}

const r01Zpl = `^XA
^PW800
^LL600
^PON
^FO20,20^GB760,560,4,B,1^FS
^FO20,20^GB760,80,80,B,0^FS
^FO40,45^A0N,36,36^FR^FDVOG OTOMASYON - TASIMA ARABASI^FS

^FO40,130^A0N,105,105^FB720,1,0,C^FDR01^FS

^FO60,260^BY4,3,170
^BCN,170,Y,N,N
^FDR01^FS

^FO40,490^A0N,32,32^FB720,1,0,C^FDTASIMA ARABASI - R01^FS
^FO40,530^A0N,22,22^FB720,1,0,C^FDVOG TEKSTIL LOJISTIK MERKEZI^FS
^XZ`;

const wallZpl = `^XA
^PW800
^LL600
^PON
^FO20,20^GB760,560,4,B,1^FS
^FO20,20^GB760,80,80,B,0^FS
^FO40,45^A0N,34,34^FR^FDVOG OMNISORT - DUVAR MODULU^FS

^FO30,135^A0N,55,55^FB740,1,0,C^FDM145-WALL-A-1^FS

^FO50,230^BY3,3,180
^BCN,180,Y,N,N
^FDM145-WALL-A-1^FS

^FO40,480^A0N,30,30^FB720,1,0,C^FDBOLUM 1 (SOL DIS) - Z-A1-1 [9 GOZ]^FS
^FO40,525^A0N,24,24^FB720,1,0,C^FDHC ROBOTICS M145 OMNISORT MINI^FS
^XZ`;

async function run() {
    await renderZplPreview(r01Zpl, 'C:/Users/ctopuz/.gemini/antigravity-ide/brain/169eb983-31aa-4750-aa24-b0b32dc83038/cart_r01_preview.png');
    await renderZplPreview(wallZpl, 'C:/Users/ctopuz/.gemini/antigravity-ide/brain/169eb983-31aa-4750-aa24-b0b32dc83038/wall_a1_preview.png');
}

run().catch(console.error);
