const fs = require('fs');
const path = require('path');

const extractDir = "c:\\vog_system\\mydrivers_extracted\\jar_dump";

function searchPortInFiles() {
    const wsFile = path.join(extractDir, 'com/takipsan/bridge/WebSocketServer.class');
    const appFile = path.join(extractDir, 'com/takipsan/bridge/App.class');
    
    [wsFile, appFile].forEach(f => {
        if (!fs.existsSync(f)) return;
        const buf = fs.readFileSync(f);
        const str = buf.toString('latin1');
        
        // Find numbers and urls
        const matches = str.match(/888\d|808\d|707\d|900\d|800\d|300\d|ws:\/\/[^\x00"']+/g) || [];
        console.log(`Port / WS matches in ${path.basename(f)}:`, matches);
    });
}

searchPortInFiles();
