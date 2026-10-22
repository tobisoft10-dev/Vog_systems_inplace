/**
 * VOG Tekstil - Personel Bazlı Mini-Sorter Çalışma Akışı & Toplama / Dağıtım Servisi
 * OmniSort Mini (HC Robotics) 60 Gözlü Konveyör Mimarisi
 * 
 * 1. Firma & Sipariş Seçimi
 * 2. Bölüm / Departman Seçimi
 * 3. Konsolide Depo Toplama Listesi & PDF Raporu
 * 4. 60 Gözlük Döngü (Wave) Mimarisi, Göz Dağıtımı & Koli Etiketleri
 */

// Ayakkabı beden kodundan temiz beden çıkarma (Örn: PVWB26001943 -> 43, 405 -> 40.5)
function extractCleanShoeSize(shoeCode) {
  if (!shoeCode) return 'STD';
  const raw = String(shoeCode).trim().toUpperCase();

  // Pattern: .5 endings (375 -> 37.5, 425 -> 42.5)
  const halfMatch = raw.match(/(\d{2})5$/);
  if (halfMatch && parseInt(halfMatch[1], 10) >= 35 && parseInt(halfMatch[1], 10) <= 48) {
    return `${halfMatch[1]}.5`;
  }

  // Standard 2-digit shoe size
  const twoDigit = raw.match(/(3[5-9]|4[0-9]|50)$/);
  if (twoDigit) {
    return twoDigit[1];
  }

  // Special cases like PVWK100100481 (41)
  const endMatch = raw.match(/(\d{2,3})$/);
  if (endMatch) {
    const val = endMatch[1];
    if (val.length === 3 && val.endsWith('1')) return '41';
    if (val.length === 3) return val.slice(1);
    return val;
  }

  return raw;
}

// Ürün adına göre standart kategori ve renk tahmini
function inferCategoryAndColor(productName, rawSku, brand) {
  const rawP = (productName || '').trim();
  const p = rawP.replace(/İ/g, 'I').replace(/ı/g, 'i').toUpperCase();
  const pOriginal = rawP.toUpperCase();
  let category = 'DİĞER';
  let color = 'STANDART';

  // Not: Sweatshirt, T-shirt'ten önce kontrol edilmelidir çünkü SWEATSHIRT içinde TSHIRT alt dizgisi bulunur!
  if (p.includes('MONT')) category = 'MONT';
  else if (p.includes('YELEK') || p.includes('POLAR')) category = 'YELEK';
  else if (p.includes('SWEAT') || p.includes('HIRKA')) category = 'SWEATSHIRT';
  else if (p.includes('GOMLEK') || pOriginal.includes('GÖMLEK')) category = 'GÖMLEK';
  else if (p.includes('PANTOLON') || p.includes('PANT ') || p.endsWith('PANT')) category = 'PANTOLON';
  else if (p.includes('POLO') || p.includes('TISORT') || pOriginal.includes('TİŞÖRT') || p.includes('TSHIRT') || p.includes('T-SHIRT')) category = 'POLO TİŞÖRT';
  else if (p.includes('BERE') || p.includes('SAPKA') || pOriginal.includes('ŞAPKA')) category = 'BERE';
  else if (p.includes('AYAKKABI') || p.includes('BOT') || (rawSku && rawSku.startsWith('PVWB26001'))) category = 'AYAKKABI';

  if (p.includes('LACIVERT') || pOriginal.includes('LACİVERT')) color = 'LACİVERT';
  else if (p.includes('MAVI') || pOriginal.includes('MAVİ')) color = 'MAVİ';
  else if (p.includes('GRI') || pOriginal.includes('GRİ')) color = 'GRİ';
  else if (p.includes('SIYAH') || pOriginal.includes('SİYAH')) color = 'SİYAH';
  else if (p.includes('BEYAZ')) color = 'BEYAZ';
  else if (p.includes('ANTRASIT') || pOriginal.includes('ANTRASİT')) color = 'ANTRASİT';
  else if (p.includes('KIRMIZI')) color = 'KIRMIZI';
  else if (p.includes('YESIL') || pOriginal.includes('YEŞİL')) color = 'YEŞİL';
  else if (p.includes('FUME') || pOriginal.includes('FÜME')) color = 'FÜME';

  return { category, color };
}

// Ürün Cinsine Göre Varsayılan Kutu İçi Maksimum Adet & Hacim Katsayıları (1 Kutu = 100 Hacim Puanı)
const DEFAULT_CATEGORY_LIMITS = {
  MONT: { max_per_box: 2, volume_points: 45, label: 'Mont / Kaban', icon: '🧥' },
  YELEK: { max_per_box: 4, volume_points: 25, label: 'Yelek / Polar', icon: '🦺' },
  SWEATSHIRT: { max_per_box: 5, volume_points: 20, label: 'Sweatshirt / Hırka', icon: '🧶' },
  PANTOLON: { max_per_box: 6, volume_points: 16, label: 'Pantolon', icon: '👖' },
  GÖMLEK: { max_per_box: 8, volume_points: 12, label: 'Gömlek', icon: '👔' },
  'POLO TİŞÖRT': { max_per_box: 12, volume_points: 8, label: 'Polo / Tişört', icon: '👕' },
  BERE: { max_per_box: 25, volume_points: 4, label: 'Bere / Aksesuar', icon: '🧢' },
  AYAKKABI: { max_per_box: 1, volume_points: 50, label: 'Ayakkabı / Bot', icon: '👞' },
  DİĞER: { max_per_box: 10, volume_points: 10, label: 'Diğer Kıyafet', icon: '📦' }
};

// Kategori limitlerini güvenli bir şekilde normalize et
function normalizeCategoryLimits(customLimits = {}) {
  const merged = {};
  for (const [cat, def] of Object.entries(DEFAULT_CATEGORY_LIMITS)) {
    const cust = customLimits ? customLimits[cat] : null;
    if (cust !== undefined && cust !== null) {
      if (typeof cust === 'object') {
        merged[cat] = {
          ...def,
          ...cust,
          max_per_box: Math.max(1, parseInt(cust.max_per_box !== undefined ? cust.max_per_box : def.max_per_box, 10) || 1),
          volume_points: Math.max(1, parseInt(cust.volume_points !== undefined ? cust.volume_points : def.volume_points, 10) || 1)
        };
      } else if (typeof cust === 'number' || typeof cust === 'string') {
        const num = Math.max(1, parseInt(cust, 10) || def.max_per_box);
        merged[cat] = {
          ...def,
          max_per_box: num,
          volume_points: Math.min(100, Math.round(100 / num))
        };
      } else {
        merged[cat] = { ...def };
      }
    } else {
      merged[cat] = { ...def };
    }
  }
  return merged;
}

// Veritabanındaki güncel koli kapasitesi ve kategori limitlerini oku
async function getPersonnelBoxSettings(pool) {
  try {
    const res = await pool.query(`
      SELECT key, value FROM sorter_settings 
      WHERE key IN ('personnel_box_capacity', 'personnel_category_limits', 'personnel_selected_categories')
    `);
    let boxCapacity = 7;
    let categoryLimits = { ...DEFAULT_CATEGORY_LIMITS };
    let selectedCategories = null;

    for (const row of res.rows) {
      if (row.key === 'personnel_box_capacity') {
        const val = parseInt(row.value, 10);
        if (!isNaN(val) && val > 0) boxCapacity = val;
      } else if (row.key === 'personnel_category_limits') {
        try {
          const parsed = JSON.parse(row.value);
          if (parsed && typeof parsed === 'object') {
            categoryLimits = normalizeCategoryLimits(parsed);
          }
        } catch (e) {}
      } else if (row.key === 'personnel_selected_categories') {
        try {
          const parsed = JSON.parse(row.value);
          if (Array.isArray(parsed)) selectedCategories = parsed;
        } catch (e) {}
      }
    }

    return { boxCapacity, categoryLimits, selectedCategories };
  } catch (err) {
    console.warn('[Settings] Failed to fetch personnel box settings, using defaults:', err.message);
    return { boxCapacity: 7, categoryLimits: { ...DEFAULT_CATEGORY_LIMITS }, selectedCategories: null };
  }
}

// Veritabanına koli kapasitesi ve kategori limitlerini kaydet
async function savePersonnelBoxSettings({ boxCapacity, categoryLimits, selectedCategories }, pool) {
  try {
    const updates = [];
    if (boxCapacity !== undefined && boxCapacity !== null) {
      const capVal = Math.max(1, parseInt(boxCapacity, 10) || 7);
      updates.push(pool.query(`
        INSERT INTO sorter_settings (key, value, description, updated_at)
        VALUES ('personnel_box_capacity', $1, 'Personel siparişleri için varsayılan koli içi kapasitesi', NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `, [String(capVal)]));
    }

    if (categoryLimits && typeof categoryLimits === 'object') {
      const normalized = normalizeCategoryLimits(categoryLimits);
      updates.push(pool.query(`
        INSERT INTO sorter_settings (key, value, description, updated_at)
        VALUES ('personnel_category_limits', $1, 'Personel kıyafet ürün cinslerine göre kutu içi maks adet ve hacim katsayıları', NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `, [JSON.stringify(normalized)]));
    }

    if (selectedCategories && Array.isArray(selectedCategories)) {
      updates.push(pool.query(`
        INSERT INTO sorter_settings (key, value, description, updated_at)
        VALUES ('personnel_selected_categories', $1, 'Personel mini-sorterda aktif işleme alınan ürün cinsleri', NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `, [JSON.stringify(selectedCategories)]));
    }

    await Promise.all(updates);
    return { success: true };
  } catch (err) {
    console.error('[Settings] Failed to save personnel box settings:', err.message);
    return { success: false, error: err.message };
  }
}

// Ürün cinsine göre personelin kaç kutu gerektirdiğini hesaplayan hacim motoru
function calculateStaffBoxesNeeded(items, customLimits = {}, fallbackCapacity = 7) {
  const mergedLimits = normalizeCategoryLimits(customLimits);
  let totalVolumePoints = 0;
  let maxBoxesBySingleCategory = 1;
  let totalItemsCount = 0;

  for (const it of items) {
    const qty = parseInt(it.quantity || 1, 10);
    totalItemsCount += qty;
    const cat = it.category || 'DİĞER';
    const conf = mergedLimits[cat] || DEFAULT_CATEGORY_LIMITS[cat] || DEFAULT_CATEGORY_LIMITS.DİĞER;

    // Hacim puanı ekle (1 Kutu = 100 Puan)
    const pointsPerItem = conf.volume_points !== undefined ? conf.volume_points : 10;
    totalVolumePoints += pointsPerItem * qty;

    // Kategori içi adet sınırı (Örn: bir kutuya en fazla 2 mont konabilirse ve 3 mont varsa -> en az 2 kutu)
    if (conf.max_per_box && conf.max_per_box > 0) {
      const boxesForCat = Math.ceil(qty / conf.max_per_box);
      if (boxesForCat > maxBoxesBySingleCategory) {
        maxBoxesBySingleCategory = boxesForCat;
      }
    }
  }

  // 1 Kutu = 100 Hacim Puanı
  const boxesByVolume = Math.ceil(totalVolumePoints / 100);
  const boxesByTotalQty = Math.ceil(totalItemsCount / fallbackCapacity);

  const finalBoxes = Math.max(1, boxesByVolume, maxBoxesBySingleCategory, boxesByTotalQty);
  return {
    boxesNeeded: finalBoxes,
    totalVolumePoints: totalVolumePoints,
    volumePercentPerBox: Math.min(100, Math.round(totalVolumePoints / finalBoxes))
  };
}

// Personelin kıyafet listesini çözen yardımcı fonksiyon
function resolveStaffBundleItems(p) {
  const top = p.top_size || 'L';
  const bottom = p.bottom_size || '48';
  const rawShoe = (p.shoe_size || '').trim();
  const cleanShoe = extractCleanShoeSize(rawShoe);
  const isFemale = (p.gender || '').toLowerCase().includes('kadın') || (p.gender || '').toLowerCase().includes('kadin');
  const montType = p.mont_preference || (p.department && p.department.includes('KALIN') ? 'KALIN' : 'İNCE');

  let items = [];

  let rawBundle = p.bundle_items;
  if (typeof rawBundle === 'string') {
    try { rawBundle = JSON.parse(rawBundle); } catch (e) { rawBundle = []; }
  }

  if (Array.isArray(rawBundle) && rawBundle.length > 0) {
    items = rawBundle.map((it, idx) => {
      const qty = parseInt(it.qty || it.quantity || it.target || 1, 10);
      const sku = it.sku || it.part_no || it.barcode || `SKU-${idx + 1}`;
      const name = it.name || it.short_name || 'Kıyafet';
      const size = it.size || top;
      const { category, color } = inferCategoryAndColor(name, sku, p.brand);

      return {
        id: it.id || `item_${idx + 1}`,
        sku: sku,
        name: name,
        short_name: it.short_name || name,
        size: size,
        quantity: qty,
        target: qty,
        category: category,
        color: it.color || color,
        barcode: it.barcode || it.ean13 || sku
      };
    });
  } else {
    // Standart 7 Parça Volkswagen Danışman Paketi
    const shoePartNo = rawShoe || (isFemale ? 'PVWB260010' : 'PVWB260019');
    items = [
      { id: 'mont', sku: `PVWM-${montType}-${top}`, name: `Servis Danışman Montu (${montType})`, size: top, quantity: 1, target: 1, category: 'MONT', color: 'LACİVERT', barcode: `PVWM-${montType}-${top}` },
      { id: 'yelek', sku: `PVWY-${top}`, name: 'Servis Danışman Yelek', size: top, quantity: 1, target: 1, category: 'YELEK', color: 'LACİVERT', barcode: `PVWY-${top}` },
      { id: 'gomlek', sku: `PVWG-${top}`, name: 'Servis Danışman Gömlek (2 Adet)', size: top, quantity: 2, target: 2, category: 'GÖMLEK', color: 'AÇIK MAVİ', barcode: `PVWG-${top}` },
      { id: 'pantolon', sku: `PVWP-${bottom}`, name: 'Servis Danışman Pantolon (2 Adet)', size: bottom, quantity: 2, target: 2, category: 'PANTOLON', color: 'LACİVERT', barcode: `PVWP-${bottom}` },
      { id: 'ayakkabi', sku: shoePartNo, name: `Servis Danışman Ayakkabı (${shoePartNo})`, size: cleanShoe, quantity: 1, target: 1, category: 'AYAKKABI', color: 'SİYAH', barcode: shoePartNo }
    ];
  }

  const totalItems = items.reduce((acc, it) => acc + (it.quantity || 0), 0);
  return { items, totalItems };
}

/**
 * 1. Firma Sipariş Numaralarını Getir
 */
async function getOrdersByBrand(brand, pool) {
  const cleanBrand = (brand || 'VOLKSWAGEN').trim().toUpperCase();

  // Hem personnel tablosundaki order_number'ları hem de orders tablosundaki order_number'ları çekip birleştir
  const [pOrders, oOrders] = await Promise.all([
    pool.query(`
      SELECT 
        COALESCE(order_number, 0) as order_number,
        COUNT(*) as staff_count,
        COUNT(DISTINCT department) as dept_count,
        COUNT(DISTINCT service_center) as dealer_count
      FROM personnel
      WHERE UPPER(brand) = $1 AND order_number IS NOT NULL AND order_number > 0
      GROUP BY order_number
      ORDER BY order_number DESC
    `, [cleanBrand]),
    pool.query(`
      SELECT 
        DISTINCT order_number,
        COUNT(*) as item_count,
        MAX(created_at) as created_at
      FROM orders
      WHERE UPPER(COALESCE(brand, '')) = $1 AND order_number IS NOT NULL
      GROUP BY order_number
      ORDER BY order_number DESC
      LIMIT 50
    `, [cleanBrand])
  ]);

  const map = new Map();

  // Personnel tablosundakiler (Öncelikli)
  for (const r of pOrders.rows) {
    const on = parseInt(r.order_number, 10);
    map.set(on, {
      order_number: on,
      staff_count: parseInt(r.staff_count, 10),
      dept_count: parseInt(r.dept_count, 10),
      dealer_count: parseInt(r.dealer_count, 10),
      source: 'PERSONNEL'
    });
  }

  // Orders tablosundakiler
  for (const r of oOrders.rows) {
    const on = parseInt(r.order_number, 10);
    if (!map.has(on)) {
      map.set(on, {
        order_number: on,
        staff_count: 0,
        dept_count: 0,
        dealer_count: 0,
        source: 'ORDERS',
        erp_item_count: parseInt(r.item_count, 10)
      });
    }
  }

  // Eğer hiç sipariş yoksa varsayılan sipariş no öner
  if (map.size === 0) {
    const defaultNo = cleanBrand === 'SCANIA' ? 16770 : (cleanBrand === 'SKODA' ? 16695 : (cleanBrand === 'VOLKSWAGEN' ? 16472 : 16000));
    map.set(defaultNo, {
      order_number: defaultNo,
      staff_count: 0,
      dept_count: 0,
      dealer_count: 0,
      source: 'DEFAULT'
    });
  }

  return Array.from(map.values()).sort((a, b) => b.order_number - a.order_number);
}

/**
 * 2. Siparişin Bağlı Olduğu Bölümleri (Departmanları) Getir
 */
async function getDepartmentsByOrder(brand, orderNumber, pool) {
  const cleanBrand = (brand || 'VOLKSWAGEN').trim().toUpperCase();
  const on = orderNumber ? parseInt(orderNumber, 10) : null;

  // Önce seçili sipariş numarasıyla filtrelemeyi dene
  let query = `
    SELECT 
      COALESCE(department, 'GENEL') as department,
      COUNT(*) as staff_count,
      COUNT(DISTINCT service_center) as dealer_count,
      COUNT(CASE WHEN packing_status = 'PACKED' THEN 1 END) as packed_count,
      COUNT(CASE WHEN sorter_chute IS NOT NULL THEN 1 END) as on_sorter_count
    FROM personnel
    WHERE UPPER(brand) = $1
  `;
  const params = [cleanBrand];

  if (on && on > 0) {
    params.push(on);
    query += ` AND order_number = $2 `;
  }

  query += ` GROUP BY department ORDER BY department ASC `;

  let result = await pool.query(query, params);

  // Eğer bu sipariş numarasına bağlı personel henüz bulunamadıysa, markanın tüm departmanlarını döndür (kullanıcı seçip atayabilsin)
  if (result.rows.length === 0) {
    const fallbackRes = await pool.query(`
      SELECT 
        COALESCE(department, 'GENEL') as department,
        COUNT(*) as staff_count,
        COUNT(DISTINCT service_center) as dealer_count,
        COUNT(CASE WHEN packing_status = 'PACKED' THEN 1 END) as packed_count,
        COUNT(CASE WHEN sorter_chute IS NOT NULL THEN 1 END) as on_sorter_count
      FROM personnel
      WHERE UPPER(brand) = $1
      GROUP BY department 
      ORDER BY department ASC
    `, [cleanBrand]);
    result = fallbackRes;
  }

  // Her departman için toplam tahmini parça ve ortalama koli hesabı ekle
  const enriched = result.rows.map(d => {
    const staffCount = parseInt(d.staff_count, 10);
    const avgPieces = cleanBrand === 'SCANIA' ? 9 : 7;
    const estimatedPieces = staffCount * avgPieces;
    const estimatedBoxes = Math.ceil(estimatedPieces / 7);

    return {
      department: d.department,
      staff_count: staffCount,
      dealer_count: parseInt(d.dealer_count, 10),
      packed_count: parseInt(d.packed_count, 10),
      on_sorter_count: parseInt(d.on_sorter_count, 10),
      estimated_pieces: estimatedPieces,
      estimated_boxes: estimatedBoxes
    };
  });

  return enriched;
}

/**
 * 3. Konsolide Depo Toplama Listesi & 60 Gözlük Döngü (Wave) Planı
 */
async function calculatePickingListAndWaves({ brand, orderNumber, departments, boxCapacity = 7, categoryLimits = {}, selectedCategories = null }, pool) {
  const cleanBrand = (brand || 'VOLKSWAGEN').trim().toUpperCase();
  const on = orderNumber ? parseInt(orderNumber, 10) : null;
  const capacity = Math.max(1, parseInt(boxCapacity, 10) || 7);
  const effectiveLimits = normalizeCategoryLimits(categoryLimits);

  const depts = Array.isArray(departments) ? departments.filter(Boolean) : (departments ? [departments] : []);

  let query = `
    SELECT 
      p.*,
      sc.item_count as chute_item_count,
      sc.status as chute_status
    FROM personnel p
    LEFT JOIN sorter_chute_state sc ON p.sorter_chute = sc.chute_no
    WHERE UPPER(p.brand) = $1
  `;
  const params = [cleanBrand];
  let idx = 2;

  if (depts.length > 0 && !depts.includes('ALL') && !depts.includes('TÜMÜ')) {
    params.push(depts);
    query += ` AND p.department = ANY($${idx++}) `;
  }

  query += ` ORDER BY p.service_center ASC, p.name ASC `;

  const staffRes = await pool.query(query, params);
  const staffRows = staffRes.rows;

  // İsteğe bağlı seçilen ürün kategorilerini normalize et
  const allowedCategories = Array.isArray(selectedCategories) && selectedCategories.length > 0 
    ? selectedCategories.map(c => String(c).toUpperCase().trim()) 
    : null;

  // 1. Her personelin kıyafetlerini çöz ve seçili kategorilere göre filtrele
  let totalPiecesAll = 0;
  let totalBoxesAll = 0;
  const enrichedStaff = [];

  for (const p of staffRows) {
    let { items, totalItems } = resolveStaffBundleItems(p);

    // Kullanıcı sadece belirli ürün tiplerini (kategorilerini) seçtiyse filtrele
    if (allowedCategories && allowedCategories.length > 0) {
      items = items.filter(it => allowedCategories.includes((it.category || 'DİĞER').toUpperCase()));
      totalItems = items.reduce((sum, it) => sum + (parseInt(it.quantity || 1, 10)), 0);
    }

    // Eğer bu personelin seçilen ürün tiplerinde hiç kıyafeti yoksa bu turda sorter'a dahil etme
    if (items.length === 0) {
      continue;
    }

    totalPiecesAll += totalItems;

    // Ürün cinsine göre kutu içindeki kapladığı alan ve maks adet hesaplaması
    const { boxesNeeded, totalVolumePoints, volumePercentPerBox } = calculateStaffBoxesNeeded(items, effectiveLimits, capacity);
    totalBoxesAll += boxesNeeded;

    enrichedStaff.push({
      id: p.id,
      name: p.name,
      service_center: p.service_center,
      department: p.department,
      brand: p.brand,
      order_number: on || p.order_number,
      role: p.role,
      gender: p.gender,
      top_size: p.top_size,
      bottom_size: p.bottom_size,
      shoe_size: p.shoe_size,
      sorter_chute: p.sorter_chute,
      packing_status: p.packing_status || 'PENDING',
      bundle_items: items,
      total_items: totalItems,
      boxes_needed: boxesNeeded,
      volume_points: totalVolumePoints,
      volume_percent_per_box: volumePercentPerBox,
      assigned_wave: null,
      assigned_chutes: []
    });
  }

  // 2. Konsolide Depo Toplama Listesi (Picking Items Agregasyonu)
  // SKU, Beden, Renk, Ürün Adı bazında tekilleştirme ve toplama
  const pickingMap = new Map();

  for (const st of enrichedStaff) {
    for (const it of st.bundle_items) {
      const key = `${it.sku}__${it.size}__${it.color || 'STD'}`.toUpperCase();
      if (!pickingMap.has(key)) {
        pickingMap.set(key, {
          sku: it.sku,
          product_name: it.name,
          category: it.category,
          color: it.color || 'STANDART',
          size: it.size || 'STD',
          total_quantity: 0,
          barcode: it.barcode || it.sku,
          service_centers: new Set(),
          staff_names: []
        });
      }
      const entry = pickingMap.get(key);
      entry.total_quantity += (it.quantity || 1);
      if (st.service_center) entry.service_centers.add(st.service_center);
      if (entry.staff_names.length < 5) entry.staff_names.push(st.name);
    }
  }

  const consolidatedPickingList = Array.from(pickingMap.values())
    .map((item, idx) => ({
      row_no: idx + 1,
      sku: item.sku,
      product_name: item.product_name,
      category: item.category,
      color: item.color,
      size: item.size,
      total_quantity: item.total_quantity,
      barcode: item.barcode,
      dealer_count: item.service_centers.size,
      sample_staff: item.staff_names.join(', ')
    }))
    .sort((a, b) => {
      // Önce kategori, sonra ürün adı, sonra beden sıralaması
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      if (a.product_name !== b.product_name) return a.product_name.localeCompare(b.product_name);
      return a.size.localeCompare(b.size);
    });

  // 3. 60 Gözlük Döngü (Wave) Mimarisi
  // OmniSort Mini'de 1-60 arası toplam 60 göz vardır.
  // Her döngüde maksimum 60 göz doldurulabilir.
  // Bir personel boxes_needed kadar göz kaplar.
  const waves = [];
  let currentWaveNo = 1;
  let currentWaveChutesUsed = 0;
  let currentWaveStaff = [];
  let currentWavePickingMap = new Map();

  for (const st of enrichedStaff) {
    const needed = Math.max(1, st.boxes_needed || 1);

    // Eğer mevcut döngüye bu personel sığmıyorsa (60'ı aşıyorsa) yeni döngüye geç
    if (currentWaveChutesUsed + needed > 60 && currentWaveStaff.length > 0) {
      waves.push({
        wave_no: currentWaveNo,
        title: `${currentWaveNo}. Döngü (1-${currentWaveChutesUsed} Göz)`,
        total_chutes: currentWaveChutesUsed,
        staff_count: currentWaveStaff.length,
        staff_list: currentWaveStaff,
        total_pieces: currentWaveStaff.reduce((acc, s) => acc + s.total_items, 0),
        picking_items: Array.from(currentWavePickingMap.values())
      });

      currentWaveNo++;
      currentWaveChutesUsed = 0;
      currentWaveStaff = [];
      currentWavePickingMap = new Map();
    }

    // Bu personelin bu döngüdeki göz numaraları
    const startChute = currentWaveChutesUsed + 1;
    const endChute = currentWaveChutesUsed + needed;
    const assignedChutes = [];
    for (let c = startChute; c <= endChute; c++) {
      assignedChutes.push(c);
    }

    st.assigned_wave = currentWaveNo;
    st.assigned_chutes = assignedChutes;

    currentWaveChutesUsed += needed;
    currentWaveStaff.push(st);

    // Döngüye özel picking listesi ekle
    for (const it of st.bundle_items) {
      const key = `${it.sku}__${it.size}__${it.color || 'STD'}`.toUpperCase();
      if (!currentWavePickingMap.has(key)) {
        currentWavePickingMap.set(key, {
          sku: it.sku,
          product_name: it.name,
          category: it.category,
          color: it.color || 'STANDART',
          size: it.size || 'STD',
          quantity: 0,
          barcode: it.barcode || it.sku
        });
      }
      currentWavePickingMap.get(key).quantity += (it.quantity || 1);
    }
  }

  // Son döngüyü ekle
  if (currentWaveStaff.length > 0) {
    waves.push({
      wave_no: currentWaveNo,
      title: `${currentWaveNo}. Döngü (1-${currentWaveChutesUsed} Göz)`,
      total_chutes: currentWaveChutesUsed,
      staff_count: currentWaveStaff.length,
      staff_list: currentWaveStaff,
      total_pieces: currentWaveStaff.reduce((acc, s) => acc + s.total_items, 0),
      picking_items: Array.from(currentWavePickingMap.values())
    });
  }

  return {
    summary: {
      brand: cleanBrand,
      order_number: on || 'TÜMÜ',
      selected_departments: depts,
      box_capacity: capacity,
      total_staff: enrichedStaff.length,
      total_pieces: totalPiecesAll,
      total_boxes_needed: totalBoxesAll,
      total_waves: waves.length,
      distinct_sku_count: consolidatedPickingList.length,
      category_limits: effectiveLimits,
      selected_categories: allowedCategories
    },
    consolidated_picking_list: consolidatedPickingList,
    waves: waves,
    all_staff: enrichedStaff
  };
}

/**
 * 4. Döngüyü Mini-Sorter'a Dağıt (1-60 Göz Tahsisi & 1-to-1 İzolasyon)
 */
async function allocateWaveToSorter({ brand, orderNumber, waveNo, staffList, boxCapacity = 7 }, pool, sorterEngine) {
  const cleanBrand = (brand || 'VOLKSWAGEN').trim().toUpperCase();
  const capacity = Math.max(1, parseInt(boxCapacity, 10) || 7);
  const targetWaveNo = parseInt(waveNo, 10) || 1;

  if (!Array.isArray(staffList) || staffList.length === 0) {
    throw new Error('Döngüde atanacak personel bulunamadı.');
  }

  // Önce 1-60 gözleri bu parti için temizle (Sorter tek bir fiziksel donanım olduğundan önceki tüm marka atamaları temizlenmelidir)
  await pool.query('UPDATE personnel SET sorter_chute = NULL, secondary_sorter_chute = NULL WHERE sorter_chute IS NOT NULL OR secondary_sorter_chute IS NOT NULL');
  await pool.query('DELETE FROM sorter_mappings WHERE chute_no BETWEEN 1 AND 60');
  await pool.query("UPDATE sorter_chute_state SET item_count = 0, status = 'STANDBY', assigned_destination = NULL, match_type = NULL, last_barcode = NULL, updated_at = NOW() WHERE chute_no BETWEEN 1 AND 60");
  await pool.query('DELETE FROM sorter_chute_items WHERE chute_no BETWEEN 1 AND 60');

  const allocations = [];
  let currentChute = 1;

  for (const st of staffList) {
    if (currentChute > 60) break;

    const staffId = st.id;
    const staffName = st.name;
    const dealerName = st.service_center || 'GENEL';
    const totalItems = parseInt(st.total_items || 7, 10);
    const boxesNeeded = Math.max(1, parseInt(st.boxes_needed, 10) || Math.ceil(totalItems / capacity));

    const primaryChute = currentChute++;
    let secondaryChute = null;

    if (boxesNeeded > 1 && currentChute <= 60) {
      secondaryChute = currentChute++;
    }

    // Fail-safe: Benzersizlik indeksi (idx_personnel_unique_active_sorter_chute) ihlal edilmemesi için hedef gözleri temizle
    await pool.query('UPDATE personnel SET sorter_chute = NULL WHERE sorter_chute = $1 AND id != $2', [primaryChute, staffId]);
    if (secondaryChute) {
      await pool.query('UPDATE personnel SET sorter_chute = NULL WHERE sorter_chute = $1 AND id != $2', [secondaryChute, staffId]);
    }

    // 1. Personel tablosunu güncelle (Döngü için filtrelenen kıyafetleri ve kutu sayısını kaydet)
    const bundleJson = Array.isArray(st.bundle_items) && st.bundle_items.length > 0
      ? JSON.stringify(st.bundle_items)
      : null;

    await pool.query(`
      UPDATE personnel 
      SET 
        sorter_chute = $1, 
        secondary_sorter_chute = $2, 
        wave_no = $3,
        order_number = COALESCE($4, order_number),
        total_boxes_needed = $5,
        bundle_items = COALESCE($6::jsonb, bundle_items),
        packing_status = 'PENDING',
        last_step = 'SORTER_ATANDI',
        updated_at = NOW()
      WHERE id = $7
    `, [primaryChute, secondaryChute, targetWaveNo, orderNumber, boxesNeeded, bundleJson, staffId]);

    // Aktif sorter markasını kaydet
    await pool.query(`
      INSERT INTO sorter_settings (key, value, description, updated_at)
      VALUES ('active_sorter_brand', $1, 'Mini-sorterda aktif dagitilmis marka', NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `, [cleanBrand]);

    // 2. Primary Göz (sorter_mappings & sorter_chute_state)
    const primTarget = boxesNeeded > 1 ? capacity : totalItems;
    await pool.query(`
      INSERT INTO sorter_mappings (destination_name, chute_no, match_type, priority, target_capacity, status)
      VALUES ($1, $2, 'PERSONNEL', 1, $3, 'ACTIVE');
    `, [`${staffName} (Koli 1/${boxesNeeded})`, primaryChute, primTarget]);

    await pool.query(`
      UPDATE sorter_chute_state
      SET 
        assigned_destination = $1,
        match_type = 'PERSONNEL',
        target_capacity = $2,
        item_count = 0,
        status = 'ASSIGNED',
        updated_at = NOW()
      WHERE chute_no = $3;
    `, [staffName, primTarget, primaryChute]);

    // 3. Varsa Secondary Göz
    if (secondaryChute) {
      const secTarget = totalItems - capacity;
      await pool.query(`
        INSERT INTO sorter_mappings (destination_name, chute_no, match_type, priority, target_capacity, status)
        VALUES ($1, $2, 'PERSONNEL', 1, $3, 'ACTIVE');
      `, [`${staffName} (Koli 2/${boxesNeeded})`, secondaryChute, secTarget]);

      await pool.query(`
        UPDATE sorter_chute_state
        SET 
          assigned_destination = $1,
          match_type = 'PERSONNEL',
          target_capacity = $2,
          item_count = 0,
          status = 'ASSIGNED',
          updated_at = NOW()
        WHERE chute_no = $3;
      `, [staffName, secTarget, secondaryChute]);
    }

    allocations.push({
      staff_id: staffId,
      staff_name: staffName,
      dealer: dealerName,
      primary_chute: primaryChute,
      secondary_chute: secondaryChute,
      boxes_needed: boxesNeeded,
      total_items: totalItems
    });
  }

  return {
    success: true,
    allocated_count: allocations.length,
    chutes_used: currentChute - 1,
    allocations: allocations
  };
}

module.exports = {
  getOrdersByBrand,
  getDepartmentsByOrder,
  calculatePickingListAndWaves,
  allocateWaveToSorter,
  resolveStaffBundleItems,
  extractCleanShoeSize,
  calculateStaffBoxesNeeded,
  normalizeCategoryLimits,
  getPersonnelBoxSettings,
  savePersonnelBoxSettings,
  DEFAULT_CATEGORY_LIMITS
};
