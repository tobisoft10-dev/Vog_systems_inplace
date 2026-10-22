const fs = require('fs');
const path = require('path');

const extractDir = "c:\\vog_system\\mydrivers_extracted\\jar_dump";
const wsFile = path.join(extractDir, 'com/takipsan/bridge/WebSocketServer.class');
const buf = fs.readFileSync(wsFile);
const str = buf.toString('latin1');

const strings = str.match(/[\x20-\x7E]{3,}/g) || [];
console.log('=== 🔌 WEBSOCKETSERVER TÜM METİNLER VE KOMUTLAR ===\n');
console.log(strings.filter(s => 
    !s.startsWith('Ljava') && 
    !s.startsWith('java/') && 
    !s.startsWith('(L') &&
    s.length > 3
).join('\n'));
