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

function fixNamespaceDeclarations() {
    console.log('⚡ Flattening UI sub-namespaces to namespace BSip.UI in D:\\bsipdev\\src\\BSip...\n');

    const baseDir = 'D:\\bsipdev\\src\\BSip\\UI';
    let fixedFilesCount = 0;

    walkDir(baseDir, filePath => {
        if (!filePath.endsWith('.cs')) return;

        let content = fs.readFileSync(filePath, 'utf8');
        
        // Change "namespace BSip.UI.xxxx" -> "namespace BSip.UI"
        if (/namespace\s+BSip\.UI\.[A-Za-z0-9_]+/g.test(content)) {
            content = content.replace(/namespace\s+BSip\.UI\.[A-Za-z0-9_]+/g, 'namespace BSip.UI');
            fs.writeFileSync(filePath, content, 'utf8');
            fixedFilesCount++;
        }
    });

    console.log(`✅ Successfully flattened namespaces in ${fixedFilesCount} UI files.`);
}

fixNamespaceDeclarations();
