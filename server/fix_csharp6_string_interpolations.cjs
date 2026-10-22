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

function convertInterpolatedStrings() {
    console.log('⚡ Converting C# 6.0 string interpolations ($"...") for MSBuild v4.0 compatibility...\n');

    const baseDir = 'D:\\bsipdev\\src\\BSip';
    let fixedFilesCount = 0;

    walkDir(baseDir, filePath => {
        if (!filePath.endsWith('.cs')) return;

        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Replace $"string {expr} ..." -> string.Format("string {0} ...", expr) or simple concats
        if (/\$"(.*?)"/g.test(content)) {
            content = content.replace(/\$"(.*?)"/g, (match, p1) => {
                let argIndex = 0;
                const args = [];
                const fmtString = p1.replace(/\{([^}]+)\}/g, (m, expr) => {
                    args.push(expr);
                    return `{${argIndex++}}`;
                });

                if (args.length === 0) {
                    return `"${fmtString}"`;
                } else {
                    return `string.Format("${fmtString}", ${args.join(', ')})`;
                }
            });

            fs.writeFileSync(filePath, content, 'utf8');
            fixedFilesCount++;
        }
    });

    console.log(`✅ Successfully converted C# 6.0 string interpolations in ${fixedFilesCount} files.`);
}

convertInterpolatedStrings();
