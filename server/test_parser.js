const xlsx = require('xlsx');

const workbook = xlsx.readFile('../SEATSipariş_2026 Yazlık_.xlsx');
let jobToProducts = {};

// 1. Build Package Map if "PAKETLER" exists
if (workbook.SheetNames.includes('PAKETLER')) {
    const pkgs = xlsx.utils.sheet_to_json(workbook.Sheets['PAKETLER']);
    let currentRole = null;
    for (const row of pkgs) {
        const possibleRole = row['__EMPTY'] || row['Görev'] || row['Personel'] || row['Role'];
        if (possibleRole && typeof possibleRole === 'string' && possibleRole.trim() !== '') {
            if (possibleRole !== 'Ürün' && possibleRole !== 'Adet' && possibleRole !== 'PAKETLER') {
                currentRole = possibleRole.trim();
            }
        }
        
        const product = row['Ürün'] || row['Model'] || row['Parça'];
        const qty = parseInt(row['Adet'] || row['Miktar'] || row['Quantity']);
        
        if (currentRole && product && !isNaN(qty)) {
            if (!jobToProducts[currentRole]) jobToProducts[currentRole] = [];
            jobToProducts[currentRole].push({ product: product.trim(), qty: qty });
        }
    }
}

// 2. Scan Data Sheets
let orders = [];
const hasPackages = Object.keys(jobToProducts).length > 0;

for (const sheetName of workbook.SheetNames) {
    if (sheetName === 'PAKETLER' || sheetName === 'BAŞLIK') continue; // skip definition sheets
    
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    for (const row of data) {
        const staffName = row['Personel Adı'] || row['Personel'] || row['Müşteri'] || row['Kişi'] || row['İsim Soyisim'];
        const job = row['Görev'] || row['Bölüm'] || row['Pozisyon'];
        
        if (!staffName) continue; 
        
        const subCustomerName = row['Yetkili Satıcı Kısa Adı'] || row['Bayi'] || row['Lokasyon'] || row['Servis'] || row['Şube'] || 'Merkez';
        const upperSize = row['Üst Beden'] || row['Size'] || row['Ölçü'] || row['Beden'] || 'Standart';
        const lowerSize = row['Alt Beden'] || row['Beden'] || 'Standart';
        const gender = row['Cinsiyet'] || '';
        
        // Match job either by the specific sheet name OR the row's job title
        let matchedJob = null;
        if (hasPackages) {
            if (jobToProducts[sheetName.trim()]) {
                matchedJob = sheetName.trim();
            } else if (job && jobToProducts[job.trim()]) {
                matchedJob = job.trim();
            } else {
                // Try fuzzy match on sheetName to jobToProducts keys (e.g. "Master Teknisyen" vs "MasterTeknisyen")
                const normalizedSheet = sheetName.replace(/\s+/g, '').toLowerCase();
                const possibleKey = Object.keys(jobToProducts).find(k => k.replace(/\s+/g, '').toLowerCase() === normalizedSheet);
                if (possibleKey) matchedJob = possibleKey;
            }
        }
        
        if (matchedJob) {
            const productsForJob = jobToProducts[matchedJob];
            for (const pkg of productsForJob) {
                const pName = pkg.product.toLowerCase();
                const isLowerBody = pName.includes('pantolon') || pName.includes('etek') || pName.includes('şort') || pName.includes('sort') || pName.includes('tulum');
                const finalSize = isLowerBody ? lowerSize : upperSize;
                
                orders.push({
                    staffName: staffName,
                    subCustomerName: subCustomerName,
                    productName: pkg.product,
                    qty: pkg.qty,
                    size: finalSize,
                    notes: `Görev: ${matchedJob}`
                });
            }
        } else {
            const keys = Object.keys(row);
            const productExact = keys.find(k => {
                const l = k.toLowerCase().trim();
                return ['ürün', 'urun', 'ürün adı', 'urun adi', 'model', 'parça', 'parca', 'cinsi'].includes(l);
            });
            const productKey = productExact || keys.find(k => {
                const l = k.toLowerCase().trim();
                return l.includes('ürün') || l.includes('urun') || l.includes('model') || l.includes('parça') || l.includes('parca') || l.includes('malzeme') || l.includes('cinsi');
            });
            const productStr = productKey ? row[productKey] : 'Belirsiz Ürün';

            const qtyExact = keys.find(k => {
                const l = k.toLowerCase().trim();
                return ['adet', 'miktar', 'qty', 'quantity', 'toplam'].includes(l);
            });
            const qtyKey = qtyExact || keys.find(k => {
                const l = k.toLowerCase().trim();
                return l.includes('adet') || l.includes('miktar') || l.includes('qty') || l.includes('quantity') || l.includes('toplam');
            });
            const qtyVal = parseInt(qtyKey ? row[qtyKey] : 1) || 1;

            const pName = productStr.toLowerCase();
            const isLowerBody = pName.includes('pantolon') || pName.includes('etek') || pName.includes('şort');
            const finalSize = isLowerBody ? lowerSize : upperSize;
            
            orders.push({
                staffName: staffName,
                subCustomerName: subCustomerName,
                productName: productStr,
                qty: qtyVal,
                size: finalSize,
                notes: `Excel'den aktarıldı`
            });
        }
    }
}

console.log("JobToProducts keys:", Object.keys(jobToProducts));
const matchedOrders = orders.filter(o => o.productName !== 'Belirsiz Ürün');
console.log("Total matched orders generated:", matchedOrders.length);
console.log("Sample of 3 matched orders:", matchedOrders.slice(0, 3));
