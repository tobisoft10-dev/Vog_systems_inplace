const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const zipFile = path.join(__dirname, 'dnSpy.zip');
const targetDir = path.join(__dirname, 'dnSpy');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

try {
    console.log('📦 Extracting dnSpy.zip using Windows tar / powershell...');
    execSync(`tar -xf "${zipFile}" -C "${targetDir}"`);
    console.log('✅ Extracted using tar!');
} catch (e) {
    console.log('Fallback to powershell expand-archive...');
    execSync(`powershell -Command "Expand-Archive -Path '${zipFile}' -DestinationPath '${targetDir}' -Force"`);
    console.log('✅ Extracted using Expand-Archive!');
}

console.log('\n📁 dnSpy directory contents:');
console.log(fs.readdirSync(targetDir));
