const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const dir = 'C:\\Users\\ctopuz\\Downloads';

function parseAllBrandExcels() {
    const products = [];
    const seen = new Set();

    function addProd(item) {
        if (!item || !item.sku) return;
        const sku = String(item.sku).trim().toUpperCase();
        if (!sku || sku.length < 3 || seen.has(sku)) return;
        seen.add(sku);

        // Derive clean size
        let cleanSize = item.size ? String(item.size).trim().toUpperCase() : 'STD';
        cleanSize = cleanSize.replace(/BEDEN|SIZE/gi, '').trim();

        // Color extraction
        let color = item.color ? String(item.color).trim().toUpperCase() : 'STANDART';

        // Gender extraction
        let gender = item.gender ? String(item.gender).trim().toUpperCase() : 'UNISEX';
        const str = `${item.product_name || ''} ${cleanSize}`.toUpperCase();
        if (str.includes('BAYAN') || str.includes('KADIN')) gender = 'KADIN';
        else if (str.includes('BAY') || str.includes('ERKEK')) gender = 'ERKEK';

        products.push({
            sku,
            product_name: String(item.product_name || 'Tekstil Ürünü').trim(),
            color,
            size: cleanSize,
            clean_size: cleanSize,
            barcode: item.barcode ? String(item.barcode).trim() : (sku.match(/^\d{8,14}$/) ? sku : null),
            ean13: item.ean13 ? String(item.ean13).trim() : (item.barcode && /^\d{13}$/.test(item.barcode) ? item.barcode : null),
            code39: sku,
            brand: item.brand || 'GENEL',
            grup: item.brand || 'GENEL',
            gender,
            price: item.price || 500.00
        });
    }

    // 1. AUDI
    ['Audi 2025 Kış Parça Kıyafet Kodları.xlsx', 'AUDI 2026 Yaz Servis Kıyafet Parça Kodları.xlsx'].forEach(f => {
        const p = path.join(dir, f);
        if (!fs.existsSync(p)) return;
        const wb = xlsx.readFile(p);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
        data.forEach(r => {
            if (!r || !r[0] || !r[1]) return;
            const code = String(r[0]).trim();
            if (/^P[A-Z0-9_-]{5,30}$/i.test(code)) {
                const prodName = String(r[1]).trim();
                const parts = prodName.split('/');
                const sz = parts.length > 1 ? parts[1] : 'STD';
                addProd({
                    sku: code,
                    product_name: prodName,
                    size: sz,
                    brand: 'AUDI'
                });
            }
        });
    });

    // 2. CUPRA
    const cupraKis = path.join(dir, 'CUPRA 2025 KIŞ PARÇA KODLARI.XLSX');
    if (fs.existsSync(cupraKis)) {
        const wb = xlsx.readFile(cupraKis);
        const ws = wb.Sheets['PARÇA NO'] || wb.Sheets[wb.SheetNames[0]];
        if (ws) {
            const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
            data.forEach(r => {
                if (r && r[0] && r[1] && /^PCUPRA/i.test(String(r[1]).trim())) {
                    addProd({
                        sku: String(r[1]).trim(),
                        product_name: String(r[0]).trim(),
                        brand: 'CUPRA'
                    });
                }
            });
        }
    }

    const cupraYaz = path.join(dir, 'CUPRA 2026 YAZ PARÇA KODLARI.XLSX');
    if (fs.existsSync(cupraYaz)) {
        const wb = xlsx.readFile(cupraYaz);
        const ws = wb.Sheets['VERİLECEK ADETLER'] || wb.Sheets[wb.SheetNames[0]];
        if (ws) {
            const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
            data.forEach(r => {
                if (r && r[0] && r[1] && /^PCUPRA/i.test(String(r[0]).trim())) {
                    addProd({
                        sku: String(r[0]).trim(),
                        product_name: String(r[1]).trim(),
                        brand: 'CUPRA'
                    });
                }
            });
        }
    }

    // 3. NISSAN
    const nissanBarkod = path.join(dir, 'Nissan Ürün yaz Barkod Listesi (1).xlsx');
    if (fs.existsSync(nissanBarkod)) {
        const wb = xlsx.readFile(nissanBarkod);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
        data.forEach(r => {
            if (r && r[0] && r[2] && r[3]) {
                const bcode = String(r[0]).trim();
                const sku = String(r[3]).trim();
                if (/^\d{10,14}$/.test(bcode)) {
                    addProd({
                        sku: sku || bcode,
                        barcode: bcode,
                        ean13: bcode,
                        product_name: String(r[2]).trim(),
                        brand: 'NISSAN'
                    });
                }
            }
        });
    }

    const nissanParca = path.join(dir, 'parcakodu nissan.xlsx');
    if (fs.existsSync(nissanParca)) {
        const wb = xlsx.readFile(nissanParca);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
        data.forEach(r => {
            if (r && r[0] && r[1]) {
                const title = String(r[0]).trim();
                const sz = String(r[1]).trim();
                if (r[2] && /^KIYAFET/i.test(String(r[2]).trim())) {
                    addProd({ sku: String(r[2]).trim(), product_name: `${title} - ${sz}`, size: sz, brand: 'NISSAN' });
                }
                if (r[3] && /^KIYAFET/i.test(String(r[3]).trim())) {
                    addProd({ sku: String(r[3]).trim(), product_name: `${title} - ${sz}`, size: sz, brand: 'NISSAN' });
                }
            }
        });
    }

    // 4. PORSCHE
    const porscheYaz = path.join(dir, 'PORSCHE 2026 YAZ PARÇA KODLARI.XLSX');
    if (fs.existsSync(porscheYaz)) {
        const wb = xlsx.readFile(porscheYaz);
        const ws = wb.Sheets['PARÇA NO'] || wb.Sheets[wb.SheetNames[0]];
        if (ws) {
            const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
            data.forEach(r => {
                if (r && r[2] && /^PPORSCHE/i.test(String(r[2]).trim())) {
                    addProd({
                        sku: String(r[2]).trim(),
                        product_name: String(r[0] || 'Porsche Kıyafet').trim(),
                        size: String(r[1] || 'STD').trim(),
                        brand: 'PORSCHE'
                    });
                }
            });
        }
    }

    // 5. SCANIA
    ['SCANIA KIŞ 2025 KİŞİ LİSTESİ.xlsx', 'Scania 2026 Yaz Kişi Listesi.xlsx'].forEach(f => {
        const p = path.join(dir, f);
        if (!fs.existsSync(p)) return;
        const wb = xlsx.readFile(p);
        wb.SheetNames.forEach(sName => {
            const ws = wb.Sheets[sName];
            const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
            data.forEach(r => {
                if (!r) return;
                // Col 0: SCKY..., Col 1: Name, Col 2: Size
                if (r[0] && /^SCKY/i.test(String(r[0]).trim())) {
                    addProd({
                        sku: String(r[0]).trim(),
                        product_name: String(r[1] || 'Scania Kıyafet').trim(),
                        size: String(r[2] || 'STD').trim(),
                        brand: 'SCANIA'
                    });
                }
                // Check all cells for SCKY codes in person sheets
                r.forEach(c => {
                    if (typeof c === 'string' && /^SCKY\d{5,}$/i.test(c.trim())) {
                        addProd({
                            sku: c.trim(),
                            product_name: 'Scania Kıyafet',
                            brand: 'SCANIA'
                        });
                    }
                });
            });
        });
    });

    // 6. SEAT
    const seatKis = path.join(dir, 'SEAT 2025 KIŞ PARÇA KODLARI.XLSX');
    if (fs.existsSync(seatKis)) {
        const wb = xlsx.readFile(seatKis);
        const ws = wb.Sheets['PARÇA NO'] || wb.Sheets[wb.SheetNames[0]];
        if (ws) {
            const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
            data.forEach(r => {
                if (r && r[1] && /^PSEAT/i.test(String(r[1]).trim())) {
                    addProd({
                        sku: String(r[1]).trim(),
                        product_name: String(r[0] || 'Seat Kıyafet').trim(),
                        brand: 'SEAT'
                    });
                }
            });
        }
    }

    const seatYaz = path.join(dir, 'SEAT 2026 Yaz Kişi Listesi.xlsx');
    if (fs.existsSync(seatYaz)) {
        const wb = xlsx.readFile(seatYaz);
        ['PARÇA NO DETAY', 'PARÇA NO'].forEach(sName => {
            const ws = wb.Sheets[sName];
            if (ws) {
                const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
                data.forEach(r => {
                    if (r && r[1] && /^PSEAT/i.test(String(r[1]).trim())) {
                        addProd({
                            sku: String(r[1]).trim(),
                            product_name: String(r[0] || 'Seat Kıyafet').trim(),
                            brand: 'SEAT'
                        });
                    }
                });
            }
        });
    }

    // 7. SKODA
    ['Skoda Barkodlar 2025 KIŞ.XLSX', 'Skoda Barkodlar 2026 YAZ.XLSX'].forEach(f => {
        const p = path.join(dir, f);
        if (!fs.existsSync(p)) return;
        const wb = xlsx.readFile(p);
        wb.SheetNames.forEach(sName => {
            const ws = wb.Sheets[sName];
            const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
            data.forEach(r => {
                if (!r) return;
                r.forEach((c, idx) => {
                    if (typeof c === 'string' && /^PSKD/i.test(c.trim())) {
                        const title = r[0] ? String(r[0]).trim() : 'Skoda Kıyafet';
                        const sz = r[4] ? String(r[4]).trim() : 'STD';
                        addProd({
                            sku: c.trim(),
                            product_name: `${title} - ${sz}`,
                            size: sz,
                            brand: 'SKODA'
                        });
                    }
                });
            });
        });
    });

    // 8. VOLKSWAGEN
    ['VW 2025 KIŞ Parça Kodları.xlsx', 'VW 2026 KIŞ Parça Kodları.xlsx'].forEach(f => {
        const p = path.join(dir, f);
        if (!fs.existsSync(p)) return;
        const wb = xlsx.readFile(p);
        wb.SheetNames.forEach(sName => {
            const ws = wb.Sheets[sName];
            const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
            data.forEach(r => {
                if (!r) return;
                r.forEach((c, idx) => {
                    if (typeof c === 'string' && /^PVWK/i.test(c.trim())) {
                        const title = r[0] ? String(r[0]).trim() : 'VW Kıyafet';
                        const sz = r[4] ? String(r[4]).trim() : 'STD';
                        addProd({
                            sku: c.trim(),
                            product_name: `${title} - ${sz}`,
                            size: sz,
                            brand: 'VOLKSWAGEN'
                        });
                    }
                });
            });
        });
    });

    const vwYaz = path.join(dir, 'VW 2026 YAZ PARÇA KODLARI & VERİLECEK ADETLER.XLSX');
    if (fs.existsSync(vwYaz)) {
        const wb = xlsx.readFile(vwYaz);
        wb.SheetNames.forEach(sName => {
            const ws = wb.Sheets[sName];
            const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
            data.forEach(r => {
                if (r && r[1] && typeof r[1] === 'string' && /^PVW/i.test(r[1].trim())) {
                    addProd({
                        sku: r[1].trim(),
                        product_name: String(r[2] || 'VW Yaz Kıyafet').trim(),
                        brand: 'VOLKSWAGEN'
                    });
                }
            });
        });
    }

    return products;
}

const res = parseAllBrandExcels();
console.log('Successfully parsed', res.length, 'unique master products across all brands!');
const byBrand = {};
res.forEach(p => {
    byBrand[p.brand] = (byBrand[p.brand] || 0) + 1;
});
console.log('Breakdown by brand:', byBrand);
console.log('Sample product:', res[0]);
console.log('Sample product:', res[res.length - 1]);
