const fs = require('fs');
const path = require('path');

const extractDir = "c:\\vog_system\\mydrivers_extracted\\jar_dump";
const wsFile = path.join(extractDir, 'com/takipsan/bridge/WebSocketServer.class');
const buf = fs.readFileSync(wsFile);
const str = buf.toString('latin1');

// Find ServerEndpoint value
const endpointMatch = str.match(/Ljavax\/websocket\/server\/ServerEndpoint;\s*value\s*([^\x00]+)/);
console.log('ServerEndpoint value match:', endpointMatch);

// Print all occurrences of "/" followed by word characters
const pathMatches = str.match(/\/[a-zA-Z0-9_\-\/]+/g) || [];
console.log('Path matches in WebSocketServer.class:', pathMatches);
