const fs = require('fs');
const http = require('http');
const path = require('path');

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

async function test() {
    const rawZpl = fs.readFileSync('C:/vog_system/server/temp_box_complete.zpl', 'utf8');
    
    // Test 1: As is on 4x4 (100x100mm) at 12 dpmm (300 DPI)
    await renderZpl(rawZpl, '12', '4', '4', 'C:/vog_system/server/scratch_label_as_is_4x4.png');
    console.log('Test 1 done');

    // Test 2: As is on 4x3 (100x80mm approx 4x3.15in) at 12 dpmm
    await renderZpl(rawZpl, '12', '4', '3.15', 'C:/vog_system/server/scratch_label_as_is_4x3.png');
    console.log('Test 2 done');

    // Test 3: With ^POR (rotated 90 degrees)
    const porZpl = rawZpl.replace('^PON', '^POR');
    await renderZpl(porZpl, '12', '4', '4', 'C:/vog_system/server/scratch_label_por_4x4.png');
    console.log('Test 3 done');

    // Test 4: With ^POR on 4x3.15
    await renderZpl(porZpl, '12', '4', '3.15', 'C:/vog_system/server/scratch_label_por_4x3.png');
    console.log('Test 4 done');
}

test().catch(console.error);
