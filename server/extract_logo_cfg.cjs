const fs = require('fs');
const path = require('path');

const tigerDir = 'C:/TIGERWINGS';

function extractStrings(buffer, minLen = 4) {
    const strList = [];
    let current = '';

    for (let i = 0; i < buffer.length; i++) {
        const byte = buffer[i];
        if (byte >= 32 && byte <= 126) {
            current += String.fromCharCode(byte);
        } else {
            if (current.length >= minLen) {
                strList.push(current);
            }
            current = '';
        }
    }
    if (current.length >= minLen) {
        strList.push(current);
    }
    return strList;
}

const filesToScan = fs.readdirSync(tigerDir).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ['.cfg', '.cfp', '.xml', '.ini', '.dat', '.trg', '.txt', '.config'].includes(ext);
});

console.log("==========================================================");
console.log("🔍 SCANNING LOGO TIGER WINGS CONFIG FILES FOR SQL SETTINGS");
console.log("==========================================================\n");

for (const file of filesToScan) {
    const filePath = path.join(tigerDir, file);
    try {
        const buf = fs.readFileSync(filePath);
        const strings = extractStrings(buf, 4);

        const keywords = ['server', 'database', 'datasource', 'sql', 'catalog', 'user', 'password', 'pwd', 'lg_', 'tiger', 'logo', '192.', '10.', '172.', 'sqlexpress'];
        const matched = strings.filter(s => {
            const lower = s.toLowerCase();
            return keywords.some(k => lower.includes(k));
        });

        if (matched.length > 0) {
            console.log(`\n📄 [FILE: ${file}] (${buf.length} bytes) - MATCHED STRINGS:`);
            console.log(matched.slice(0, 30).join('\n'));
        }
    } catch (e) {
        // ignore read error
    }
}
