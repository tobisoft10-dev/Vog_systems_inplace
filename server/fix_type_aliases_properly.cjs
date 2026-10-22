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

function fixTypeAliases() {
    console.log('⚡ Adding model type aliases to UI files to resolve namespace conflicts...\n');

    const uiDir = 'D:\\bsipdev\\src\\BSip\\UI';
    let fixedCount = 0;

    walkDir(uiDir, filePath => {
        if (!filePath.endsWith('.cs')) return;

        let content = fs.readFileSync(filePath, 'utf8');

        // Check if file has namespace BSip.UI.xxx
        const match = content.match(/namespace\s+(BSip\.UI\.[A-Za-z0-9_]+)/);
        if (match) {
            const nsName = match[1];
            const aliasBlock = `
using Siparis = BSip.Model.Siparis;
using Stok = BSip.Model.Stok;
using Teklif = BSip.Model.Teklif;
using Urun = BSip.Model.Urun;
using Beden = BSip.Model.Beden;
using Islem = BSip.Model.Islem;
using Musteri = BSip.Model.Musteri;
using Personel = BSip.Model.Personel;
using Departman = BSip.Model.Departman;
using Kullanici = BSip.Model.Kullanici;
`;
            if (!content.includes('using Siparis = BSip.Model.Siparis;')) {
                content = content.replace(nsName + '\n{', nsName + '\n{' + aliasBlock);
                content = content.replace(nsName + '\r\n{', nsName + '\r\n{' + aliasBlock);
                fs.writeFileSync(filePath, content, 'utf8');
                fixedCount++;
            }
        }
    });

    console.log(`✅ Successfully added model type aliases to ${fixedCount} UI files.`);
}

fixTypeAliases();
