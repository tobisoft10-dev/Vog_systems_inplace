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

function fixNamespaces() {
    console.log('⚡ Fixing decompiled namespace collisions in D:\\bsipdev\\src\\BSip...\n');

    const baseDir = 'D:\\bsipdev\\src\\BSip';
    let fixedFilesCount = 0;

    walkDir(baseDir, filePath => {
        if (!filePath.endsWith('.cs')) return;

        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // 1. Replace sub-namespaces in UI folders with namespace BSip.UI
        const nsRegex = /namespace\s+BSip\.UI\.(Siparis|Stok|Teklif|Urun|Beden|Islem|Musteri|Personel|Departman|Kullanici)/g;
        if (nsRegex.test(content)) {
            content = content.replace(nsRegex, 'namespace BSip.UI');
            modified = true;
        }

        // 2. Disambiguate Model types if needed
        const replacements = [
            { from: /\bSiparis\b(?!\s*\.)/g, to: 'BSip.Model.Siparis' },
            { from: /\bStok\b(?!\s*\.)/g, to: 'BSip.Model.Stok' },
            { from: /\bTeklif\b(?!\s*\.)/g, to: 'BSip.Model.Teklif' },
            { from: /\bUrun\b(?!\s*\.)/g, to: 'BSip.Model.Urun' },
            { from: /\bBeden\b(?!\s*\.)/g, to: 'BSip.Model.Beden' },
            { from: /\bIslem\b(?!\s*\.)/g, to: 'BSip.Model.Islem' }
        ];

        // Also check using statements
        if (content.includes('using BSip.UI.Siparis;')) {
            content = content.replace(/using\s+BSip\.UI\.(Siparis|Stok|Teklif|Urun|Beden|Islem|Musteri|Personel|Departman|Kullanici);/g, 'using BSip.UI;');
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            fixedFilesCount++;
        }
    });

    console.log(`✅ Successfully updated namespaces in ${fixedFilesCount} C# source files.`);
}

fixNamespaces();
