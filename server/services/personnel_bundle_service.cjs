/**
 * VOG Tekstil Premium - Personnel Staff Bundle Resolver Service
 * 
 * Personel bazlı kıyafet paketlerinin (Volkswagen 7 parça, Scania, Skoda vb.)
 * gerçek parça numaralarını (SKU), bedenlerini, EAN-13 barkodlarını ve adetlerini çözümler.
 */

function extractCleanShoeSize(raw) {
    if (!raw || typeof raw !== 'string') return 'STD';
    raw = raw.trim();

    // 1. Half sizes like 42.5 or 42,5
    const halfMatch = raw.match(/(\d{2})[.,]5/);
    if (halfMatch) {
        const base = parseInt(halfMatch[1], 10);
        if (base >= 35 && base <= 48) return `${base}.5`;
    }

    // 2. Standard 2-digit shoe size between 35 and 50
    const twoDigit = raw.match(/(3[5-9]|4[0-9]|50)$/);
    if (twoDigit) {
        return twoDigit[1];
    }

    // 3. Special case for 3-digit trailing ending (e.g., 481 -> 41)
    const endMatch = raw.match(/(\d{2,3})$/);
    if (endMatch) {
        const val = endMatch[1];
        if (val.length === 3 && val.endsWith('1')) {
            return '41';
        }
        if (val.length === 3) return val.slice(1);
        return val;
    }

    return 'STD';
}

// Volkswagen Personel 7 Parça Kıyafetleri için Gerçek Parça No (SKU), Beden ve GS1 EAN-13 Eşleştirici
async function resolveVwStaffBundle(p, dbPool) {
    const isFemale = (p.gender || '').toLowerCase().includes('kadın') || (p.gender || '').toLowerCase().includes('kadin');
    const gender = isFemale ? 'KADIN' : 'ERKEK';
    const montPref = (p.mont_preference || (p.department && p.department.includes('KALIN') ? 'KALIN' : 'İNCE')).toUpperCase();
    const top = (p.top_size || 'L').toUpperCase().trim();
    const bottom = (p.bottom_size || '48').toUpperCase().trim();
    const rawShoe = (p.shoe_size || '').trim();
    const cleanShoe = extractCleanShoeSize(rawShoe);

    // SKU Kod Ön Ekleri (Resmi MasterUrunler & Catalog Mimarisi):
    // 1. Mont: Kalın Erkek: PVWK100106, İnce Erkek: PVWK100102, Kalın Kadın: PVWK100107, İnce Kadın: PVWK100103
    const montPrefix = montPref === 'KALIN' ? (isFemale ? 'PVWK100107' : 'PVWK100106') : (isFemale ? 'PVWK100103' : 'PVWK100102');
    // 2. Yelek: Erkek: PVWK100104, Kadın: PVWK100105
    const yelekPrefix = isFemale ? 'PVWK100105' : 'PVWK100104';
    // 3. Gömlek: Erkek: PVWB260013, Kadın: PVWB260012
    const gomlekPrefix = isFemale ? 'PVWB260012' : 'PVWB260013';
    // 4. Pantolon: Erkek: PVWB260017, Kadın: PVWB250007
    const pantPrefix = isFemale ? 'PVWB250007' : 'PVWB260017';

    // Veritabanından gerçek EAN-13 ve SKU verilerini çek
    let mpRows = [];
    try {
        const qRes = await dbPool.query(`
            SELECT sku, code39, ean13, barcode, size, clean_size, product_name
            FROM master_products
            WHERE sku ILIKE $1 OR sku ILIKE $2 OR sku ILIKE $3 OR sku ILIKE $4 OR sku = $5 OR code39 = $5
        `, [
            `${montPrefix}%`,
            `${yelekPrefix}%`,
            `${gomlekPrefix}%`,
            `${pantPrefix}%`,
            rawShoe
        ]);
        mpRows = qRes.rows;
    } catch (e) {
        console.warn('[resolveVwStaffBundle] master_products sorgu uyarısı:', e.message);
    }

    const findMatch = (prefix, sz) => {
        let m = mpRows.find(r => r.sku && r.sku.toUpperCase() === `${prefix}${sz}`.toUpperCase());
        if (!m) m = mpRows.find(r => r.sku && r.sku.toUpperCase().startsWith(prefix) && (r.clean_size === sz || r.size === sz));
        if (!m) m = mpRows.find(r => r.sku && r.sku.toUpperCase().startsWith(prefix));
        return m;
    };

    const ensurePartNoWithSize = (matchedObj, prefix, sz) => {
        let pNo = matchedObj ? (matchedObj.code39 || matchedObj.sku) : `${prefix}${sz}`;
        if (!pNo) pNo = `${prefix}${sz}`;
        const upper = pNo.toUpperCase();
        if (upper === prefix.toUpperCase()) {
            pNo = `${prefix}${sz}`;
        }
        return pNo;
    };

    const montMatch = findMatch(montPrefix, top);
    const yelekMatch = findMatch(yelekPrefix, top);
    const gomlekMatch = findMatch(gomlekPrefix, top);
    const pantMatch = findMatch(pantPrefix, bottom);
    const shoeMatch = mpRows.find(r => (r.sku && r.sku.toUpperCase() === rawShoe.toUpperCase()) || (r.code39 && r.code39.toUpperCase() === rawShoe.toUpperCase()));

    return [
        {
            id: 'mont',
            index: 1,
            name: `Servis Danışman Montu (${montPref})`,
            short_name: `Mont (${montPref})`,
            size: top,
            part_no: ensurePartNoWithSize(montMatch, montPrefix, top),
            barcode: montMatch ? (montMatch.ean13 || montMatch.barcode) : '8692457797187',
            quantity: 1,
            sorter_chute: p.sorter_chute || null,
            target_printer: 'SATO CL4NX Plus'
        },
        {
            id: 'yelek',
            index: 2,
            name: 'Servis Danışman Yelek',
            short_name: 'Yelek',
            size: top,
            part_no: ensurePartNoWithSize(yelekMatch, yelekPrefix, top),
            barcode: yelekMatch ? (yelekMatch.ean13 || yelekMatch.barcode) : '8692457797187',
            quantity: 1,
            sorter_chute: p.sorter_chute || null,
            target_printer: 'SATO CL4NX Plus'
        },
        {
            id: 'gomlek_1',
            index: 3,
            name: 'Servis Danışman Gömlek (1/2)',
            short_name: 'Gömlek (1/2)',
            size: top,
            part_no: ensurePartNoWithSize(gomlekMatch, gomlekPrefix, top),
            barcode: gomlekMatch ? (gomlekMatch.ean13 || gomlekMatch.barcode) : '8684072311659',
            quantity: 1,
            sorter_chute: p.sorter_chute || null,
            target_printer: 'SATO CL4NX Plus'
        },
        {
            id: 'gomlek_2',
            index: 4,
            name: 'Servis Danışman Gömlek (2/2)',
            short_name: 'Gömlek (2/2)',
            size: top,
            part_no: ensurePartNoWithSize(gomlekMatch, gomlekPrefix, top),
            barcode: gomlekMatch ? (gomlekMatch.ean13 || gomlekMatch.barcode) : '8684072311659',
            quantity: 1,
            sorter_chute: p.sorter_chute || null,
            target_printer: 'SATO CL4NX Plus'
        },
        {
            id: 'pantolon_1',
            index: 5,
            name: 'Servis Danışman Pantolon (1/2)',
            short_name: 'Pantolon (1/2)',
            size: bottom,
            part_no: ensurePartNoWithSize(pantMatch, pantPrefix, bottom),
            barcode: pantMatch ? (pantMatch.ean13 || pantMatch.barcode) : '8692600174476',
            quantity: 1,
            sorter_chute: p.sorter_chute || null,
            target_printer: 'SATO CL4NX Plus'
        },
        {
            id: 'pantolon_2',
            index: 6,
            name: 'Servis Danışman Pantolon (2/2)',
            short_name: 'Pantolon (2/2)',
            size: bottom,
            part_no: ensurePartNoWithSize(pantMatch, pantPrefix, bottom),
            barcode: pantMatch ? (pantMatch.ean13 || pantMatch.barcode) : '8692600174476',
            quantity: 1,
            sorter_chute: p.sorter_chute || null,
            target_printer: 'SATO CL4NX Plus'
        },
        {
            id: 'ayakkabi',
            index: 7,
            name: 'Servis Danışman Ayakkabı',
            short_name: 'Ayakkabı',
            size: cleanShoe,
            part_no: rawShoe || (isFemale ? 'PVWB260010' : 'PVWB260019'),
            barcode: shoeMatch ? (shoeMatch.ean13 || shoeMatch.barcode) : '8693051336284',
            quantity: 1,
            sorter_chute: p.sorter_chute || null,
            target_printer: 'SATO CL4NX Plus'
        }
    ];
}

// Scania / Skoda / Özel Personel Kıyafetleri için Gerçek Parça No (SKU), Beden ve EAN-13 Eşleştirici
async function resolveScaniaStaffBundle(p, dbPool) {
    let items = p.bundle_items;
    if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch (e) { items = []; }
    }
    if (!Array.isArray(items) || items.length === 0) {
        return [];
    }

    const expandedPieces = [];
    let currentIdx = 1;

    for (const it of items) {
        const qty = parseInt(it.qty || it.quantity || 1, 10);
        const sku = (it.sku || it.part_no || '').trim();
        const barcode = (it.barcode || it.ean13 || sku).trim();
        const name = it.name || it.short_name || `${(p.brand || 'Personel').toUpperCase()} Kıyafeti`;
        const shortName = it.short_name || it.name || 'Kıyafet';
        const size = it.size || p.top_size || 'STD';

        for (let k = 1; k <= qty; k++) {
            expandedPieces.push({
                id: `${sku}_${k}`,
                index: currentIdx++,
                name: qty > 1 ? `${name} (${k}/${qty})` : name,
                short_name: qty > 1 ? `${shortName} (${k}/${qty})` : shortName,
                size: size,
                part_no: sku,
                barcode: barcode,
                quantity: 1,
                sorter_chute: p.sorter_chute || null,
                target_printer: 'SATO CL4NX Plus'
            });
        }
    }

    return expandedPieces;
}

module.exports = {
    extractCleanShoeSize,
    resolveVwStaffBundle,
    resolveScaniaStaffBundle
};
