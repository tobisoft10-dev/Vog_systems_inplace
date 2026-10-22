const fs = require('fs');
const path = require('path');

const extractDir = "c:\\vog_system\\mydrivers_extracted\\jar_dump";
const appFile = path.join(extractDir, 'com/takipsan/bridge/App.class');
const buf = fs.readFileSync(appFile);
const str = buf.toString('latin1');

const strings = str.match(/[\x20-\x7E]{2,}/g) || [];
console.log('App.class tüm metinler:\n', strings.join('\n'));
