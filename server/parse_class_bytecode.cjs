const fs = require('fs');
const path = require('path');

const extractDir = "c:\\vog_system\\mydrivers_extracted\\jar_dump";

function dumpClassConstants(relPath) {
    const fullPath = path.join(extractDir, relPath);
    if (!fs.existsSync(fullPath)) return;
    const buf = fs.readFileSync(fullPath);

    console.log(`\n==============================================`);
    console.log(`🔍 ANALİZ: ${relPath} (${buf.length} bytes)`);
    console.log(`==============================================`);

    // Let's find all numbers between 1000 and 65535 in 2-byte integers in the buffer
    const numbers = new Set();
    for (let i = 0; i < buf.length - 2; i++) {
        const val = buf.readUInt16BE(i);
        if (val >= 1000 && val <= 65535) {
            // Check if preceded by sipush (0x11)
            if (i > 0 && buf[i-1] === 0x11) {
                numbers.add(`SIPUSH -> ${val}`);
            } else if (i > 0 && buf[i-1] === 0x10) {
                // bipush
                numbers.add(`BIPUSH -> ${buf[i]}`);
            }
        }
    }
    console.log('Bulunan Port/Sayı Değerleri:', Array.from(numbers));

    // Find all strings
    const str = buf.toString('latin1');
    const strings = str.match(/[\x20-\x7E]{3,}/g) || [];
    console.log('Metinler (İlk 40):', strings.slice(0, 40));
}

dumpClassConstants('com/takipsan/bridge/App.class');
dumpClassConstants('com/takipsan/bridge/WebSocketServer.class');
dumpClassConstants('com/takipsan/basecards/TunnelBaseCard.class');
dumpClassConstants('com/takipsan/rfidreader/ImpinjReader.class');
