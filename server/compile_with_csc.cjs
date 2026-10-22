const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath, callback);
        } else {
            callback(fullPath);
        }
    });
}

function compileWithCsc() {
    console.log('⚡ Compiling BSip.exe using csc.exe...\n');

    const srcDir = 'D:\\bsipdev\\src\\BSip';
    const outExe = 'D:\\bsipdev\\BSip.exe';
    const rspFile = 'D:\\bsipdev\\compile.rsp';

    const sources = [];
    walkDir(srcDir, filePath => {
        if (filePath.endsWith('.cs')) {
            sources.push(`"${filePath}"`);
        }
    });

    // Add all DLLs from D:\bsipdev
    const bsipDevDlls = fs.readdirSync('D:\\bsipdev')
        .filter(f => f.endsWith('.dll'))
        .map(f => path.join('D:\\bsipdev', f));

    const systemReferences = [
        'System.dll',
        'System.Data.dll',
        'System.Drawing.dll',
        'System.Windows.Forms.dll',
        'System.Xml.dll',
        'System.Core.dll',
        'System.ComponentModel.DataAnnotations.dll'
    ];

    const references = [...bsipDevDlls, ...systemReferences];

    let rspContent = `/target:winexe\n/out:"${outExe}"\n/optimize+\n`;
    references.forEach(ref => {
        rspContent += `/r:"${ref}"\n`;
    });
    sources.forEach(src => {
        rspContent += `${src}\n`;
    });

    fs.writeFileSync(rspFile, rspContent, 'utf8');

    const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
    console.log(`Running: ${cscPath} @"${rspFile}"`);

    try {
        const output = execSync(`"${cscPath}" @"${rspFile}"`, { encoding: 'utf8' });
        console.log(output);
        console.log('\n🎉🎉🎉 SUCCESS! BSip.exe successfully compiled to D:\\bsipdev\\BSip.exe!');
    } catch (err) {
        console.error('Compilation output:\n', err.stdout || err.stderr || err.message);
    }
}

compileWithCsc();
