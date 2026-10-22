const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const jarPath = "c:\\vog_system\\mydrivers_extracted\\Takipsan bridge\\Bridge\\bridge.jar";
const extractDir = "c:\\vog_system\\mydrivers_extracted\\jar_dump";

if (!fs.existsSync(extractDir)) fs.mkdirSync(extractDir, { recursive: true });

execSync(`tar -xf "${jarPath}" -C "${extractDir}"`);

console.log('✅ JAR dosyası başarıyla açıldı.');

// Inspect WebSocketServer and ImpinjReader strings
function searchStringsInClass(classRelPath) {
    const fullPath = path.join(extractDir, classRelPath);
    if (!fs.existsSync(fullPath)) return;
    const buf = fs.readFileSync(fullPath);
    const str = buf.toString('latin1');
    
    // Find readable strings (alphanumeric >= 4 chars)
    const matches = str.match(/[\x20-\x7E]{4,}/g) || [];
    console.log(`\n=== 📜 ${classRelPath} İÇİNDEKİ KRİTİK METİNLER ===`);
    console.log(matches.filter(m => 
        m.includes('ws://') || 
        m.includes('http') || 
        m.includes('port') || 
        m.includes('Port') || 
        m.includes('192.168') || 
        m.includes('7070') || 
        m.includes('8080') || 
        m.includes('9000') ||
        m.includes('impinj') || 
        m.includes('reader') ||
        m.includes('read') ||
        m.includes('tag') ||
        m.includes('epc') ||
        m.includes('connect') ||
        m.includes('fotocell') ||
        m.includes('gpio')
    ).slice(0, 50).join('\n'));
}

searchStringsInClass('com/takipsan/bridge/WebSocketServer.class');
searchStringsInClass('com/takipsan/bridge/App.class');
searchStringsInClass('com/takipsan/rfidreader/ImpinjReader.class');
searchStringsInClass('com/takipsan/basecards/TunnelBaseCard.class');
searchStringsInClass('com/takipsan/gpio/Ral2.class');
