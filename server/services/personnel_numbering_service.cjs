/**
 * VOG Tekstil Premium - Personnel Carton Numbering & Sequencing Service
 * 
 * Kural:
 * 1. Marka seçimi (VOLKSWAGEN, SCANIA, SKODA, SEAT vb.)
 * 2. Bölge lokasyonlar (service_center) Türkçe alfabetik sıralı (A -> Z)
 * 3. Oradaki personeller (name) Türkçe alfabetik sıralı (A -> Z)
 * 4. Koli numaraları (box_no) sequential 1..N ve barkod KOLI-[KOD]-[NO]
 */

const collator = new Intl.Collator('tr', { sensitivity: 'base', numeric: true });
const { resolveVwStaffBundle, resolveScaniaStaffBundle } = require('./personnel_bundle_service.cjs');

function getBrandCode(brand) {
    if (!brand) return 'GEN';
    const b = brand.toString().trim().toUpperCase();
    if (b.includes('VOLKSWAGEN') || b === 'VW') return 'VW';
    if (b.includes('SCANIA') || b === 'SC') return 'SC';
    if (b.includes('SKODA') || b === 'SK') return 'SK';
    if (b.includes('SEAT') || b === 'SE') return 'SE';
    if (b.includes('AUDI') || b === 'AU') return 'AU';
    if (b.includes('FORD') || b === 'FD') return 'FD';
    if (b.includes('CUPRA')) return 'CP';
    if (b.includes('PORSCHE')) return 'PO';
    if (b.includes('ZARA')) return 'ZR';
    return b.substring(0, 2);
}

/**
 * Personele ait kutuları alfabetik kurala göre sıralar ve veritabanında box_no & box_barcode günceller.
 * Eğer department verilmişse yalnızca o departmanı renumber eder.
 */
async function renumberPersonnelCartons(pool, brand, startBoxNo = 1, department = null) {
    if (!brand) throw new Error('Marka belirtilmelidir.');
    const startNum = Math.max(1, parseInt(startBoxNo, 10) || 1);
    const brandCode = getBrandCode(brand);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let sql = 'SELECT id, name, service_center, department, brand, box_no, box_barcode, packing_status FROM personnel WHERE UPPER(brand) = UPPER($1)';
        const params = [brand.trim()];
        if (department && department !== 'ALL') {
            sql += ' AND department = $2';
            params.push(department.trim());
        }

        const res = await client.query(sql, params);

        if (res.rows.length === 0) {
            await client.query('ROLLBACK');
            return { success: false, message: `${brand} markasında kayıtlı personel bulunamadı.`, count: 0 };
        }

        // Kural: Bölge lokasyonlar alfabetik, ardından personel ismi alfabetik
        const sorted = [...res.rows].sort((a, b) => {
            const scComp = collator.compare(a.service_center || '', b.service_center || '');
            if (scComp !== 0) return scComp;
            return collator.compare(a.name || '', b.name || '');
        });

        const totalCount = sorted.length;

        // Batch update
        for (let i = 0; i < sorted.length; i++) {
            const p = sorted[i];
            const currentBoxNo = startNum + i;
            const deptSlug = (p.department || '').toUpperCase().includes('DAN') ? 'DAN'
                : (p.department || '').toUpperCase().includes('FRM') || (p.department || '').toUpperCase().includes('FORM') ? 'FRM'
                : (p.department || '').toUpperCase().includes('HAS') || (p.department || '').toUpperCase().includes('GAR') ? 'HAS'
                : (p.department || '').toUpperCase().includes('MIS') || (p.department || '').toUpperCase().includes('MİS') ? 'MIS'
                : (p.department || '').toUpperCase().includes('TEK') ? 'TEK'
                : (p.department || '').toUpperCase().includes('YED') || (p.department || '').toUpperCase().includes('PAR') ? 'YDP'
                : '';
            const bcPrefix = deptSlug ? `KOLI-${brandCode}-${deptSlug}` : `KOLI-${brandCode}`;
            const currentBoxBarcode = `${bcPrefix}-${String(currentBoxNo).padStart(4, '0')}`;

            await client.query(
                `UPDATE personnel 
                 SET box_no = $1, 
                     box_barcode = $2, 
                     updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $3`,
                [currentBoxNo, currentBoxBarcode, p.id]
            );
        }

        await client.query('COMMIT');

        console.log(`✅ [PERSONNEL NUMBERING] ${brand} (${department || 'Tümü'}) markasında ${totalCount} koli başarıyla numaralandırıldı (${startNum} .. ${startNum + totalCount - 1}).`);

        return {
            success: true,
            brand: brand.toUpperCase(),
            brand_code: brandCode,
            department: department || null,
            total_count: totalCount,
            start_box_no: startNum,
            end_box_no: startNum + totalCount - 1
        };
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ [PERSONNEL NUMBERING ERROR]:', err);
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Belirli bir markadaki departmanları ve koli durumlarını getirir.
 */
async function getPersonnelDepartments(pool, brand) {
    if (!brand) return [];
    try {
        const res = await pool.query(
            `SELECT department, 
                    COUNT(*) as total_count,
                    COUNT(*) FILTER (WHERE packing_status = 'PACKED' OR last_step = 'RFID_TUNNEL_TAMAM') as packed_count
             FROM personnel
             WHERE UPPER(brand) = UPPER($1) AND department IS NOT NULL AND department != ''
             GROUP BY department
             ORDER BY department`,
            [brand.trim()]
        );
        return res.rows.map(r => ({
            department: r.department,
            total_count: parseInt(r.total_count, 10) || 0,
            packed_count: parseInt(r.packed_count, 10) || 0,
            remaining_count: (parseInt(r.total_count, 10) || 0) - (parseInt(r.packed_count, 10) || 0)
        }));
    } catch (e) {
        console.error('getPersonnelDepartments error:', e.message);
        return [];
    }
}

/**
 * Belirli bir markadaki personellerin koli listesini döndürür.
 * Eğer department verilmişse yalnızca o departmanı listeler.
 */
async function getPersonnelBoxList(pool, brand, startBox = 1, department = null, search = '') {
    if (!brand) return [];
    const brandCode = getBrandCode(brand);

    let query = `
        SELECT id, name, service_center, department, gender, brand, 
               box_no, box_barcode, packing_status, last_step, 
               bundle_items, sorter_chute, updated_at
        FROM personnel 
        WHERE UPPER(brand) = UPPER($1)
    `;
    const params = [brand.trim()];

    if (department && department !== 'ALL') {
        params.push(department.trim());
        query += ` AND department = $${params.length}`;
    }

    if (search && search.trim()) {
        params.push(`%${search.trim().toLowerCase()}%`);
        query += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(service_center) LIKE $${params.length} OR LOWER(box_barcode) LIKE $${params.length})`;
    }

    const res = await pool.query(query, params);

    if (res.rows.length === 0) return [];

    // box_no'ya göre sırala
    const sorted = [...res.rows].sort((a, b) => {
        if (a.box_no !== null && b.box_no !== null && a.box_no !== undefined && b.box_no !== undefined) {
            return a.box_no - b.box_no;
        }
        const scComp = collator.compare(a.service_center || '', b.service_center || '');
        if (scComp !== 0) return scComp;
        return collator.compare(a.name || '', b.name || '');
    });

    return sorted.map((p, idx) => {
        const computedBoxNo = p.box_no || (idx + 1);
        const computedBarcode = p.box_barcode || `KOLI-${brandCode}-${String(computedBoxNo).padStart(4, '0')}`;
        
        let itemCount = 7; // Varsayılan VW danışman paketi
        if (p.bundle_items) {
            let b = p.bundle_items;
            if (typeof b === 'string') {
                try { b = JSON.parse(b); } catch (_) { b = []; }
            }
            if (Array.isArray(b) && b.length > 0) {
                itemCount = b.reduce((sum, it) => sum + parseInt(it.qty || it.quantity || 1, 10), 0);
            }
        }

        return {
            id: p.id,
            box_no: computedBoxNo,
            box_barcode: computedBarcode,
            name: p.name,
            service_center: p.service_center,
            department: p.department || 'Servis',
            gender: p.gender || 'Erkek',
            item_count: itemCount,
            target_quantity: itemCount,
            packing_status: p.packing_status || 'PENDING',
            last_step: p.last_step || null,
            sorter_chute: p.sorter_chute || null,
            has_assigned_box_no: p.box_no !== null && p.box_no !== undefined
        };
    });
}

/**
 * Belirli bir koli numarasına (box_no) ve opsiyonel departmana karşılık gelen personelin detayını getirir.
 */
async function getPersonnelBoxDetails(pool, brand, boxNo, department = null, resolveVwStaffBundleFn, resolveScaniaStaffBundleFn) {
    if (!brand || !boxNo) return null;
    const boxNum = parseInt(boxNo, 10);
    const brandCode = getBrandCode(brand);

    let p = null;

    // 1. Departman belirtildiyse box_no + department ile ara (Türkçe karakter ve büyük/küçük harf duyarsız)
    if (department && department !== 'ALL') {
        const cleanDept = String(department).trim();
        const pDeptRes = await pool.query(
            `SELECT * FROM personnel 
             WHERE UPPER(brand) = UPPER($1) 
               AND box_no = $2 
               AND (
                   UPPER(department) = UPPER($3) 
                   OR department ILIKE $3 
                   OR REPLACE(REPLACE(REPLACE(REPLACE(UPPER(department),'İ','I'),'Ş','S'),'Ğ','G'),'Ü','U') ILIKE REPLACE(REPLACE(REPLACE(REPLACE(UPPER($3),'İ','I'),'Ş','S'),'Ğ','G'),'Ü','U')
               )
             LIMIT 1`,
            [brand.trim(), boxNum, cleanDept]
        );
        p = pDeptRes.rows[0];
    }

    // 2. Bulunamadıysa sadece box_no ile dene
    if (!p) {
        const pRes = await pool.query(
            `SELECT * FROM personnel WHERE UPPER(brand) = UPPER($1) AND box_no = $2 LIMIT 1`,
            [brand.trim(), boxNum]
        );
        p = pRes.rows[0];
    }

    // 3. Hala bulunamadıysa (örneğin henüz box_no atanmamışsa), alfabetik sıralamadan index ile bul
    if (!p) {
        let query = `SELECT * FROM personnel WHERE UPPER(brand) = UPPER($1)`;
        const params = [brand.trim()];
        if (department && department !== 'ALL') {
            params.push(String(department).trim());
            query += ` AND (
                UPPER(department) = UPPER($2) 
                OR department ILIKE $2 
                OR REPLACE(REPLACE(REPLACE(REPLACE(UPPER(department),'İ','I'),'Ş','S'),'Ğ','G'),'Ü','U') ILIKE REPLACE(REPLACE(REPLACE(REPLACE(UPPER($2),'İ','I'),'Ş','S'),'Ğ','G'),'Ü','U')
            )`;
        }

        const allRes = await pool.query(query, params);
        if (allRes.rows.length === 0) return null;

        const sorted = [...allRes.rows].sort((a, b) => {
            const scComp = collator.compare(a.service_center || '', b.service_center || '');
            if (scComp !== 0) return scComp;
            return collator.compare(a.name || '', b.name || '');
        });

        if (boxNum >= 1 && boxNum <= sorted.length) {
            p = sorted[boxNum - 1];
        }
    }

    if (!p) return null;

    // Toplam koli sayısı (bölüm bazlı veya genel marka bazlı)
    let countSql = `SELECT COUNT(*) as total FROM personnel WHERE UPPER(brand) = UPPER($1)`;
    const countParams = [brand.trim()];
    const activeDept = p.department || department;
    if (activeDept && activeDept !== 'ALL') {
        const cleanActiveDept = String(activeDept).trim();
        countParams.push(cleanActiveDept);
        countSql += ` AND (
            UPPER(department) = UPPER($2) 
            OR department ILIKE $2 
            OR REPLACE(REPLACE(REPLACE(REPLACE(UPPER(department),'İ','I'),'Ş','S'),'Ğ','G'),'Ü','U') ILIKE REPLACE(REPLACE(REPLACE(REPLACE(UPPER($2),'İ','I'),'Ş','S'),'Ğ','G'),'Ü','U')
        )`;
    }

    const countRes = await pool.query(countSql, countParams);
    const totalBoxes = parseInt(countRes.rows[0]?.total, 10) || 1;

    // Parça listesini çözümle
    const brandUpper = (p.brand || brand).toUpperCase();
    const isCustomBrand = brandUpper === 'SCANIA' || brandUpper === 'SKODA' || (p.bundle_items && Array.isArray(p.bundle_items) && p.bundle_items.length > 0);
    
    let resolvedPieces = [];
    const scaniaResolver = resolveScaniaStaffBundleFn || resolveScaniaStaffBundle;
    const vwResolver = resolveVwStaffBundleFn || resolveVwStaffBundle;

    if (isCustomBrand && scaniaResolver) {
        resolvedPieces = await scaniaResolver(p, pool);
    } else if (vwResolver) {
        resolvedPieces = await vwResolver(p, pool);
    }

    // Beklenen barkod ve SKU listesi
    const allowedBarcodes = new Set();
    const allowedSkus = new Set();
    const allowedEpcs = new Set();

    resolvedPieces.forEach(pc => {
        if (pc.barcode) {
            allowedBarcodes.add(String(pc.barcode).trim());
            allowedBarcodes.add(String(pc.barcode).trim().replace(/^0+/, ''));
        }
        if (pc.part_no) allowedSkus.add(String(pc.part_no).trim().toUpperCase());
        if (pc.sku) allowedSkus.add(String(pc.sku).trim().toUpperCase());
    });

    // İlgili personelin daha önce basılmış RFID etiketleri varsa (rfid_tags)
    try {
        const tagRes = await pool.query(
            `SELECT epc, barcode, sku FROM rfid_tags WHERE staff_name = $1 OR order_id = $2`,
            [p.name, String(p.id)]
        );
        tagRes.rows.forEach(t => {
            if (t.epc) allowedEpcs.add(String(t.epc).trim().toUpperCase());
            if (t.barcode) allowedBarcodes.add(String(t.barcode).trim());
            if (t.sku) allowedSkus.add(String(t.sku).trim().toUpperCase());
        });
    } catch (_) {}

    const targetQty = resolvedPieces.length > 0 ? resolvedPieces.length : 7;
    const computedBarcode = p.box_barcode || `KOLI-${brandCode}-${String(boxNum).padStart(4, '0')}`;

    return {
        personnel_id: p.id,
        box_no: boxNum,
        total_boxes: totalBoxes,
        box_barcode: computedBarcode,
        name: p.name,
        service_center: p.service_center,
        department: p.department || 'Servis',
        gender: p.gender || 'Erkek',
        target_quantity: targetQty,
        packing_status: p.packing_status || 'PENDING',
        bundle_items: resolvedPieces,
        allowed_barcodes: Array.from(allowedBarcodes),
        allowed_skus: Array.from(allowedSkus),
        allowed_epcs: Array.from(allowedEpcs)
    };
}

module.exports = {
    getBrandCode,
    renumberPersonnelCartons,
    getPersonnelDepartments,
    getPersonnelBoxList,
    getPersonnelBoxDetails
};

