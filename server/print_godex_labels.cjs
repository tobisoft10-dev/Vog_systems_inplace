const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { execSync } = require('child_process');

const ARTIFACT_DIR = 'C:\\Users\\ctopuz\\.gemini\\antigravity-ide\\brain\\b7a09eb5-11f7-4b67-bdf6-0a7e0e765408';
const pdfPath = path.join(__dirname, 'nissan_3_koli_labels.pdf');

async function generateAndPrintPdf() {
    console.log('1. Creating 100x100mm PDF for 3 Box Labels...');

    // 100mm in points: 100 * 72 / 25.4 = 283.4645 points
    const sizePt = 100 * 72 / 25.4;

    const doc = new PDFDocument({
        size: [sizePt, sizePt],
        margins: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    const images = [
        path.join(ARTIFACT_DIR, 'box_label_16575_koli_1.png'),
        path.join(ARTIFACT_DIR, 'box_label_16575_koli_2.png'),
        path.join(ARTIFACT_DIR, 'box_label_16575_koli_3.png')
    ];

    images.forEach((img, idx) => {
        if (idx > 0) doc.addPage({ size: [sizePt, sizePt], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
        doc.image(img, 0, 0, { width: sizePt, height: sizePt });
    });

    doc.end();

    await new Promise((resolve) => writeStream.on('finish', resolve));
    console.log('✅ PDF created successfully at:', pdfPath);

    // 2. Find active Godex Printer Name in Windows
    const psGetPrinter = `powershell -NoProfile -Command "(Get-Printer | Where-Object { $_.Name -like '*Godex*' } | Select-Object -First 1).Name"`;
    const godexName = execSync(psGetPrinter, { encoding: 'utf8' }).trim();
    console.log(`2. Found Godex printer: "${godexName}"`);

    if (!godexName) {
        throw new Error('No Godex printer found in Windows printers!');
    }

    // 3. Print via msedge.exe to redirected printer
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const printCmd = `"${edgePath}" --headless --no-pdf-header-footer --print-to="${godexName}" "${path.resolve(pdfPath)}"`;
    console.log('3. Executing Edge print command to Godex...');
    execSync(printCmd, { stdio: 'inherit' });
    console.log('🎉 Print job successfully dispatched to Godex G530 via Edge Spooler!');
}

generateAndPrintPdf().catch(console.error);
