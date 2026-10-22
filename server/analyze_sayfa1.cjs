const xlsx = require('xlsx');
const wb = xlsx.readFile('C:/Users/ctopuz/Downloads/nissan Kışlık Kıyafet Sipariş Formu BARKOD (1).xlsx');
const sheet = wb.Sheets['Sayfa1'];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

const depts = new Set();
const items = [];
for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  if (!r || r.length === 0) continue;
  depts.add(r[0] + ' | ' + r[1]);
  items.push({
    dept: r[0],
    sku: r[2],
    itemName: r[3],
    size: r[4],
    stokAdi: r[5],
    barkod: r[6]
  });
}
console.log('Total items in Sayfa1:', items.length);
console.log('Departments:', Array.from(depts));
console.log('Sample 10 items:');
console.table(items.slice(0, 10));
