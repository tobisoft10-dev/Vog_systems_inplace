const fs = require('fs');
const path = require('path');

const cfgPath = 'C:/TIGERWINGS/LOGOSET.CFG';

console.log("==========================================================================");
console.log("🔍 DECODING LOGO TIGER LOGOSET.CFG FILE FOR EXACT SQL SERVER NAME");
console.log("==========================================================================\n");

if (fs.existsSync(cfgPath)) {
    const buf = fs.readFileSync(cfgPath);
    console.log(`Buffer Size: ${buf.length} bytes`);
    
    // Printable strings
    const strList = [];
    let cur = '';
    for (let i = 0; i < buf.length; i++) {
        const b = buf[i];
        if (b >= 32 && b <= 126) {
            cur += String.fromCharCode(b);
        } else {
            if (cur.length >= 3) strList.push(cur);
            cur = '';
        }
    }
    if (cur.length >= 3) strList.push(cur);

    console.log("📄 Extracted ASCII Strings from LOGOSET.CFG:");
    console.log(strList.join('  |  '));

    // Try XOR keys (0x01 to 0xFF)
    for (let key = 1; key <= 255; key++) {
        let dec = '';
        for (let i = 0; i < buf.length; i++) {
            const b = buf[i] ^ key;
            if (b >= 32 && b <= 126) dec += String.fromCharCode(b);
            else dec += ' ';
        }
        const words = dec.split(/\s+/).filter(w => w.length >= 4);
        const hit = words.find(w => w.toLowerCase().includes('sql') || w.toLowerCase().includes('server') || w.toLowerCase().includes('logo') || w.toLowerCase().includes('tiger') || w.includes('192.'));
        if (hit) {
            console.log(`\n🔑 [XOR KEY 0x${key.toString(16).toUpperCase()}] Found Keyword '${hit}':`);
            console.log(words.slice(0, 20).join(' '));
            break;
        }
    }
} else {
    console.log("LOGOSET.CFG not found at C:/TIGERWINGS/LOGOSET.CFG");
}
