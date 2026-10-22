const XLSX = require('xlsx');

function dumpCatalog(filePath, yearLabel) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  
  const models = {};
  data.forEach((r, idx) => {
    // Look for rows where row has Parça Tanımı, Beden, Parça Kodu
    const desc = String(r[0] || '').trim();
    const beden = String(r[4] || '').trim();
    const code = String(r[5] || '').trim();
    if (code && code.startsWith('PSKD')) {
      // Find base code (without size suffix)
      const baseCode = code.replace(/(XS|S|M|L|XL|XXL|XXXL|XXXXL|XXXXXL|XXXXXXL|XXXXXXXL|XXXXXXXXL|XXXXXXXXXL|STD)$/, '');
      if (!models[baseCode]) {
        models[baseCode] = {
          baseCode,
          descriptions: new Set(),
          sampleCode: code,
          sizes: []
        };
      }
      models[baseCode].descriptions.add(desc);
      models[baseCode].sizes.push({ beden, code });
    }
  });

  console.log(`\n=================== ${yearLabel} (${filePath}) ===================`);
  Object.values(models).forEach(m => {
    console.log(`KÖK KOD: ${m.baseCode}`);
    console.log(`  Tanımlar: ${[...m.descriptions].join(' | ')}`);
    console.log(`  Beden Sayısı: ${m.sizes.length} (Örnek: ${m.sizes.map(s => s.code).slice(0, 4).join(', ')}...)`);
  });
}

dumpCatalog('C:\\Users\\ctopuz\\Downloads\\Skoda Barkodlar 2026 YAZ.XLSX', '2026 YAZ');
dumpCatalog('C:\\Users\\ctopuz\\Downloads\\Skoda Barkodlar 2025 KIŞ.XLSX', '2025 KIŞ');
