const XLSX = require('xlsx');

function dumpAll(filePath) {
  console.log('====================================================');
  console.log('FILE:', filePath);
  const wb = XLSX.readFile(filePath);
  for (const sName of wb.SheetNames) {
    const ws = wb.Sheets[sName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    console.log(`Sheet "${sName}": ${data.length} rows`);
    data.slice(0, 135).forEach((r, idx) => {
      const rowStr = r.filter(c => c !== '').join(' | ');
      if (rowStr) {
        console.log(`R${idx + 1}: ${rowStr}`);
      }
    });
  }
}

dumpAll('C:\\Users\\ctopuz\\Downloads\\Skoda Barkodlar 2025 KIŞ.XLSX');
