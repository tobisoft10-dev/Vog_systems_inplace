const fs = require('fs');
const http = require('http');
const path = require('path');

const samples = [
    { zplFile: 'C:/vog_system/server/nissan_mont_sample.zpl', outFile: 'C:/vog_system/server/nissan_mont_preview.png', artName: 'nissan_mont_preview.png' },
    { zplFile: 'C:/vog_system/server/nissan_pantolon_sample.zpl', outFile: 'C:/vog_system/server/nissan_pantolon_preview.png', artName: 'nissan_pantolon_preview.png' },
    { zplFile: 'C:/vog_system/server/audi_tshirt_sample.zpl', outFile: 'C:/vog_system/server/audi_tshirt_preview.png', artName: 'audi_tshirt_preview.png' },
    { zplFile: 'C:/vog_system/server/vw_pantolon_sample.zpl', outFile: 'C:/vog_system/server/vw_pantolon_preview.png', artName: 'vw_pantolon_preview.png' }
];

const artifactDir = 'C:/Users/ctopuz/.gemini/antigravity-ide/brain/e2553408-1fe3-4649-bcd5-29248f1a387a';

function renderZpl(zpl, outPath) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.labelary.com',
            port: 80,
            path: '/v1/printers/8dpmm/labels/2.16535x1.19566/0/',
            method: 'POST',
            headers: {
                'Accept': 'image/png',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        const req = http.request(options, (res) => {
            let chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                fs.writeFileSync(outPath, buffer);
                resolve(buffer);
            });
        });

        req.on('error', reject);
        req.write(zpl);
        req.end();
    });
}

async function main() {
    console.log('Rendering label samples via Labelary API...\n');
    for (const s of samples) {
        if (!fs.existsSync(s.zplFile)) {
            console.log(`Skipping ${s.zplFile} (not found)`);
            continue;
        }
        const zpl = fs.readFileSync(s.zplFile, 'utf8');
        await renderZpl(zpl, s.outFile);
        console.log(`✅ Saved: ${s.outFile}`);
        // Also copy to artifacts dir
        const artPath = path.join(artifactDir, s.artName);
        fs.copyFileSync(s.outFile, artPath);
        console.log(`   Copied to artifact: ${artPath}`);
    }
    console.log('\nAll previews rendered successfully!');
}

main().catch(console.error);
