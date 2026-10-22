const fs = require('fs');
const http = require('http');

function renderZpl(zpl, dpmm, w, h, outPath) {
    return new Promise((resolve, reject) => {
        const url = `http://api.labelary.com/v1/printers/${dpmm}dpmm/labels/${w}x${h}/0/`;
        const req = http.request(url, {
            method: 'POST',
            headers: {
                'Accept': 'image/png',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }, (res) => {
            if (res.statusCode !== 200) {
                let err = '';
                res.on('data', d => err += d);
                res.on('end', () => reject(new Error(`Labelary error ${res.statusCode}: ${err}`)));
                return;
            }
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                const buf = Buffer.concat(chunks);
                fs.writeFileSync(outPath, buf);
                resolve(outPath);
            });
        });
        req.on('error', reject);
        req.write(zpl);
        req.end();
    });
}

// Find a SATO zpl in server/
async function testSato() {
    const satoZpl = fs.readFileSync('C:/vog_system/scratch/sato_label_16575_koli_1.zpl', 'utf8');
    await renderZpl(satoZpl, '8', '2', '1.2', 'C:/vog_system/server/scratch_sato.png');
    console.log('SATO done');
}
testSato().catch(console.error);
