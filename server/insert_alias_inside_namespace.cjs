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

function insertAliasesInsideNamespace() {
    console.log('⚡ Inserting type aliases INSIDE namespace BSip.UI in D:\\bsipdev\\src\\BSip...\n');

    const baseDir = 'D:\\bsipdev\\src\\BSip\\UI';
    let fixedFilesCount = 0;

    const innerAliases = `
\tusing Siparis = BSip.Model.Siparis;
\tusing Stok = BSip.Model.Stok;
\tusing Teklif = BSip.Model.Teklif;
\tusing Urun = BSip.Model.Urun;
\tusing Beden = BSip.Model.Beden;
\tusing Islem = BSip.Model.Islem;
\tusing Personel = BSip.Model.Personel;
\tusing Musteri = BSip.Model.Musteri;
\tusing Departman = BSip.Model.Departman;
`;

    walkDir(baseDir, filePath => {
        if (!filePath.endsWith('.cs')) return;

        let content = fs.readFileSync(filePath, 'utf8');

        // Clean any top-level usings added previously
        content = content.replace(/using Siparis = BSip\.Model\.Siparis;\r?\n/g, '');
        content = content.replace(/using Stok = BSip\.Model\.Stok;\r?\n/g, '');
        content = content.replace(/using Teklif = BSip\.Model\.Teklif;\r?\n/g, '');
        content = content.replace(/using Urun = BSip\.Model\.Urun;\r?\n/g, '');
        content = content.replace(/using Beden = BSip\.Model\.Beden;\r?\n/g, '');
        content = content.replace(/using Islem = BSip\.Model\.Islem;\r?\n/g, '');
        content = content.replace(/using Personel = BSip\.Model\.Personel;\r?\n/g, '');
        content = content.replace(/using Musteri = BSip\.Model\.Musteri;\r?\n/g, '');
        content = content.replace(/using Departman = BSip\.Model\.Departman;\r?\n/g, '');

        if (!content.includes('using Siparis = BSip.Model.Siparis;')) {
            content = content.replace(/(namespace\s+BSip\.UI\s*\{)/g, `$1${innerAliases}`);
            fs.writeFileSync(filePath, content, 'utf8');
            fixedFilesCount++;
        }
    });

    console.log(`✅ Successfully updated ${fixedFilesCount} UI files with inner type aliases.`);
}

insertAliasesInsideNamespace();
