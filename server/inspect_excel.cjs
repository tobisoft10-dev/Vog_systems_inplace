const XLSX = require('xlsx');
const fs = require('fs');

const file1 = 'C:\\Users\\ctopuz\\Downloads\\VW Binek Servis Danışmanları.xlsx.xlsx';
const file2 = 'C:\\Users\\ctopuz\\Downloads\\VW Binek Servis Danışmanları.xlsx';

let target = fs.existsSync(file1) ? file1 : (fs.existsSync(file2) ? file2 : null);

console.log('Target file exists:', target);
if (target) {
  const wb = XLSX.readFile(target);
  console.log('Sheet names:', wb.SheetNames);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log('Header row:', rows[0]);
  console.log('Row 1:', rows[1]);
  console.log('Row 2:', rows[2]);

  // Esila Evirgen'in satırını bulalım
  const esila = rows.find(r => r && r[1] && r[1].toString().toUpperCase().includes('ESİLA'));
  console.log('Esila row in excel:', esila);

  // Dilara Aras veya Pınar Şerefli satırını bulalım
  const pinar = rows.find(r => r && r[1] && r[1].toString().toUpperCase().includes('PINAR'));
  console.log('Pinar row in excel:', pinar);
}
