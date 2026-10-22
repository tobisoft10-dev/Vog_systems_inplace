const XLSX = require('xlsx');
const fs = require('fs');

const file1 = 'C:\\Users\\ctopuz\\Downloads\\VW Binek Servis Danışmanları.xlsx.xlsx';
const file2 = 'C:\\Users\\ctopuz\\Downloads\\VW Binek Servis Danışmanları.xlsx';
const target = fs.existsSync(file1) ? file1 : file2;

const wb = XLSX.readFile(target);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

const shoeMap = {};
for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  if (!r || !r[1]) continue;
  const name = r[1];
  const gender = r[4];
  const top = r[5];
  const bottom = r[6];
  const shoe = r[7];
  if (!shoeMap[shoe]) shoeMap[shoe] = { count: 0, genders: new Set(), samples: [] };
  shoeMap[shoe].count++;
  shoeMap[shoe].genders.add(gender);
  if (shoeMap[shoe].samples.length < 3) shoeMap[shoe].samples.push({ name, gender, top, bottom });
}

console.log('=== ALL SHOE CODES IN EXCEL ===');
for (const [code, info] of Object.entries(shoeMap)) {
  console.log(`${code} | Count: ${info.count} | Genders: ${Array.from(info.genders).join(', ')} | Samples: ${info.samples.map(s => s.name + ' (' + s.gender + ')').join('; ')}`);
}
