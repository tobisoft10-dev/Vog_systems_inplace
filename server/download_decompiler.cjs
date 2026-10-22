const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const request = https.get(url, { headers: { 'User-Agent': 'NodeJS' } }, response => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
            }
            if (response.statusCode !== 200) {
                return reject(new Error(`Failed to download: ${response.statusCode}`));
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', err => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

async function getDecompiler() {
    console.log('🚀 Downloading dnSpyEx decompiler for C# decompilation...\n');
    const zipPath = path.join(__dirname, 'dnSpy.zip');
    const extractPath = path.join(__dirname, 'dnSpy');

    const downloadUrl = 'https://github.com/dnSpyEx/dnSpy/releases/download/v6.4.0/dnSpy-netframework.zip';

    try {
        await downloadFile(downloadUrl, zipPath);
        console.log(`✅ Downloaded dnSpy.zip (${fs.statSync(zipPath).size} bytes)`);

        if (!fs.existsSync(extractPath)) fs.mkdirSync(extractPath, { recursive: true });

        execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractPath}' -Force"`);
        console.log(`✅ Extracted dnSpy to: ${extractPath}`);

        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

    } catch (err) {
        console.error('❌ Error downloading decompiler:', err.message);
    }
}

getDecompiler();
