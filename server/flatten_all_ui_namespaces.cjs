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

function flattenAllUiNamespaces() {
    console.log('⚡ Replacing all sub-namespaces BSip.UI.xxx with namespace BSip.UI across entire project...\n');

    const baseDir = 'D:\\bsipdev\\src\\BSip';
    let fixedFilesCount = 0;

    walkDir(baseDir, filePath => {
        if (!filePath.endsWith('.cs')) return;

        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;

        // Replace using BSip.UI.xxx -> using BSip.UI;
        content = content.replace(/using\s+BSip\.UI\.(Siparis|Stok|Teklif|Urun|Beden|Islem|Musteri|Personel|Departman|Kullanici|Base);/g, 'using BSip.UI;');

        // Replace namespace BSip.UI.xxx -> namespace BSip.UI
        content = content.replace(/namespace\s+BSip\.UI\.(Siparis|Stok|Teklif|Urun|Beden|Islem|Musteri|Personel|Departman|Kullanici|Base)/g, 'namespace BSip.UI');

        // Replace qualified type references BSip.UI.xxx.frm -> BSip.UI.frm
        content = content.replace(/BSip\.UI\.(Siparis|Stok|Teklif|Urun|Beden|Islem|Musteri|Personel|Departman|Kullanici|Base)\./g, 'BSip.UI.');

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            fixedFilesCount++;
        }
    });

    console.log(`✅ Successfully flattened all UI sub-namespaces across ${fixedFilesCount} C# files.`);
}

flattenAllUiNamespaces();
