const XLSX = require('xlsx');

function checkSheets(filePath) {
  console.log('===', filePath, '===');
  const wb = XLSX.readFile(filePath);
  console.log('Sheets:', wb.SheetNames);
  for (const sName of wb.SheetNames) {
    const ws = wb.Sheets[sName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    console.log(`Sheet "${sName}": ${data.length} rows`);
    // Print first 5 rows
    data.slice(0, 5).forEach((r, i) => {
      console.log(`  [${i+1}]`, r.filter(x => x !== '').join(' | '));
    });
  }
}

checkSheets('C:\\Users\\ctopuz\\Downloads\\Skoda Barkodlar 2026 YAZ.XLSX');
checkSheets('C:\\Users\\ctopuz\\Downloads\\Skoda Barkodlar 2025 KIŞ.XLSX');
