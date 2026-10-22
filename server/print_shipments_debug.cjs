const http = require('http');
const fs = require('fs');
const path = require('path');

http.get('http://localhost:3001/api/seat/shipments', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.success) {
        const outPath = path.join(__dirname, 'shipments_debug.json');
        fs.writeFileSync(outPath, JSON.stringify(parsed.data, null, 2));
        console.log("Written shipments debug to:", outPath);
      }
    } catch (err) {
      console.error(err);
    }
  });
});
