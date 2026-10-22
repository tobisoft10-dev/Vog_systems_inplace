const fs = require('fs');
const path = require('path');

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

function fixCompilerVariables() {
    console.log('⚡ Renaming compiler-generated $ variables (CS$<>...) to clean C# identifiers...\n');

    const baseDir = 'D:\\bsipdev\\src\\BSip';
    let fixedFilesCount = 0;

    walkDir(baseDir, filePath => {
        if (!filePath.endsWith('.cs')) return;

        let content = fs.readFileSync(filePath, 'utf8');

        if (content.includes('CS$') || content.includes('<>') || content.includes('$')) {
            // Replace CS$<>8__locals1 -> locals1
            content = content.replace(/CS\$<>8__locals(\d+)/g, 'locals$1');
            content = content.replace(/CS\$<>8__locals/g, 'locals');
            content = content.replace(/CS\$/g, 'compilerVar_');
            content = content.replace(/<>c__DisplayClass/g, 'DisplayClass_');
            content = content.replace(/<>9__\d+_\d+/g, 'closureField');

            fs.writeFileSync(filePath, content, 'utf8');
            fixedFilesCount++;
        }
    });

    console.log(`✅ Successfully cleaned compiler-generated variables in ${fixedFilesCount} files.`);
}

fixCompilerVariables();
