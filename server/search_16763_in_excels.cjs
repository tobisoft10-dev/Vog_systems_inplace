const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const files = [
    'C:\\Users\\ctopuz\\Downloads\\VW 2025 KIŞ Parça Kodları.xlsx',
    'C:\\Users\\ctopuz\\Downloads\\VW 2026 YAZ PARÇA KODLARI & VERİLECEK ADETLER.XLSX',
    'c:\\vog_system\\SEAT 2026 Yaz Kişi Listesi.xlsx',
    'c:\\vog_system\\SEAT 2026 Yaz Rapor.xlsx',
    'c:\\vog_system\\SEATSipariş_2026 Yazlık_.xlsx'
];

files.forEach(filePath => {
    if (!fs.existsSync(filePath)) return;
    try {
        const wb = xlsx.readFile(filePath);
        wb.SheetNames.forEach(sheetName => {
            const sheet = wb.Sheets[sheetName];
            const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
            rows.forEach((row, idx) => {
                const strRow = JSON.stringify(row);
                if (strRow.includes('16763')) {
                    console.log(`🎯 FOUND 16763 in ${path.basename(filePath)} -> Sheet "${sheetName}" -> Row ${idx+1}:`, row);
                }
            });
        });
    } catch (e) {
        console.error(`Error reading ${path.basename(filePath)}:`, e.message);
    }
});
