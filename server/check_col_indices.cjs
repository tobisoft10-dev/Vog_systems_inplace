const XLSX = require('xlsx');

const wb2 = XLSX.readFile('C:\\Users\\ctopuz\\Downloads\\Skoda Barkodlar 2025 KIŞ.XLSX');
const ws2 = wb2.Sheets[wb2.SheetNames[0]];
const data2 = XLSX.utils.sheet_to_json(ws2, { header: 1, defval: '' });
console.log('2025 KIŞ Row 3 headers:', data2[2]);
console.log('2025 KIŞ Row 4 data:', data2[3]);
