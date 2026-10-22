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

function addTypeAliases() {
    const baseDir = 'D:\\bsipdev\\src\\BSip\\UI';
    const aliasHeader = `using Siparis = BSip.Model.Siparis;
using Stok = BSip.Model.Stok;
using Teklif = BSip.Model.Teklif;
using Urun = BSip.Model.Urun;
using Beden = BSip.Model.Beden;
using Islem = BSip.Model.Islem;
using Personel = BSip.Model.Personel;
using Musteri = BSip.Model.Musteri;
using Departman = BSip.Model.Departman;
`;

    walkDir(baseDir, filePath => {
        if (!filePath.endsWith('.cs')) return;

        let content = fs.readFileSync(filePath, 'utf8');

        // Remove any inner aliases
        content = content.replace(/using Siparis = BSip\.Model\.Siparis;\r?\n/g, '');
        content = content.replace(/using Stok = BSip\.Model\.Stok;\r?\n/g, '');
        content = content.replace(/using Teklif = BSip\.Model\.Teklif;\r?\n/g, '');
        content = content.replace(/using Urun = BSip\.Model\.Urun;\r?\n/g, '');
        content = content.replace(/using Beden = BSip\.Model\.Beden;\r?\n/g, '');
        content = content.replace(/using Islem = BSip\.Model\.Islem;\r?\n/g, '');
        content = content.replace(/using Personel = BSip\.Model\.Personel;\r?\n/g, '');
        content = content.replace(/using Musteri = BSip\.Model\.Musteri;\r?\n/g, '');
        content = content.replace(/using Departman = BSip\.Model\.Departman;\r?\n/g, '');

        content = aliasHeader + '\n' + content;
        fs.writeFileSync(filePath, content, 'utf8');
    });

    console.log('✅ Top-level type aliases applied!');
}

addTypeAliases();
