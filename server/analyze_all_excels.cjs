const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const dirs = [
    'c:\\vog_system',
    'C:\\Users\\ctopuz\\Desktop',
    'C:\\Users\\ctopuz\\Downloads'
];

const foundFiles = [];
for (const dir of dirs) {
    if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        for (const f of files) {
            if (f.toLowerCase().endsWith('.xlsx') || f.toLowerCase().endsWith('.xls')) {
                if (!f.startsWith('~$')) { // ignore lock files
                    foundFiles.push(path.join(dir, f));
                }
            }
        }
    }
}

console.log(`Found ${foundFiles.length} Excel files across directories.\n`);

const summary = [];

for (const filePath of foundFiles) {
    try {
        const wb = xlsx.readFile(filePath);
        const fileInfo = {
            fileName: path.basename(filePath),
            fullPath: filePath,
            sheets: []
        };

        for (const sheetName of wb.SheetNames) {
            const ws = wb.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
            const totalRows = data.length;
            let headerRow = [];
            let sampleRows = [];

            // Find first non-empty row as header
            for (let r = 0; r < Math.min(10, data.length); r++) {
                if (data[r] && data[r].filter(Boolean).length > 2) {
                    headerRow = data[r].map(c => String(c !== undefined && c !== null ? c : '').trim());
                    sampleRows = data.slice(r + 1, r + 4).map(row => (row || []).slice(0, 10));
                    break;
                }
            }

            fileInfo.sheets.push({
                sheetName,
                totalRows,
                headers: headerRow.slice(0, 15),
                samplePreview: sampleRows
            });
        }
        summary.push(fileInfo);
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err.message);
    }
}

fs.writeFileSync(
    path.join(__dirname, 'excel_analysis_report.json'),
    JSON.stringify(summary, null, 2),
    'utf8'
);
console.log(`Wrote excel_analysis_report.json with ${summary.length} analyzed files.`);

// Print summary
for (const s of summary) {
    console.log(`\n📄 [${s.fileName}]`);
    for (const sh of s.sheets) {
        console.log(`   └─ Sheet: "${sh.sheetName}" (${sh.totalRows} rows) | Headers: ${sh.headers.filter(Boolean).join(', ')}`);
    }
}
