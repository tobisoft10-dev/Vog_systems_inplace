const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vog_db'
});

// Ayakkabı kodundan temiz beden ve parça no çıkarma
function extractCleanShoeSize(shoeCode) {
  if (!shoeCode) return 'STD';
  const raw = String(shoeCode).trim().toUpperCase();

  // Pattern: .5 endings (e.g. 375 -> 37.5, 365 -> 36.5, 405 -> 40.5, 425 -> 42.5, 475 -> 47.5)
  const halfMatch = raw.match(/(\d{2})5$/);
  if (halfMatch && parseInt(halfMatch[1], 10) >= 35 && parseInt(halfMatch[1], 10) <= 48) {
    return `${halfMatch[1]}.5`;
  }

  // Pattern: standard 2-digit shoe size between 35 and 50
  const twoDigit = raw.match(/(3[5-9]|4[0-9]|50)$/);
  if (twoDigit) {
    return twoDigit[1];
  }

  // Special cases like PVWK100100481 (e.g., 41 or 48)
  const endMatch = raw.match(/(\d{2,3})$/);
  if (endMatch) {
    const val = endMatch[1];
    if (val.length === 3) {
      // 481 -> Kadın ayakkabısında 41 veya 38; eğer 481 ise son iki hane 41 veya 48
      if (val.endsWith('1')) return val.slice(1); // 81 -> ? or 41
      return val.slice(1);
    }
    return val;
  }

  return 'STD';
}

async function resolveStaffBundle(staff) {
  const isFemale = (staff.gender || '').toLowerCase().includes('kadın') || (staff.gender || '').toLowerCase().includes('kadin');
  const gender = isFemale ? 'KADIN' : 'ERKEK';
  const montPref = (staff.mont_preference || (staff.department && staff.department.includes('KALIN') ? 'KALIN' : 'İNCE')).toUpperCase();
  const top = (staff.top_size || 'L').toUpperCase().trim();
  const bottom = (staff.bottom_size || '48').toUpperCase().trim();
  const rawShoe = (staff.shoe_size || '').trim();
  const cleanShoe = extractCleanShoeSize(rawShoe);

  // 1. Mont SKU Prefix: Kalın Erkek: PVWK100106, İnce Erkek: PVWK100102, Kalın Kadın: PVWK100107, İnce Kadın: PVWK100103
  let montPrefix = '';
  if (montPref === 'KALIN') {
    montPrefix = isFemale ? 'PVWK100107' : 'PVWK100106';
  } else {
    montPrefix = isFemale ? 'PVWK100103' : 'PVWK100102';
  }

  // 2. Yelek SKU Prefix: Erkek: PVWK100104, Kadın: PVWK100105
  const yelekPrefix = isFemale ? 'PVWK100105' : 'PVWK100104';

  // 3. Gomlek SKU Prefix: Erkek: PVWB260013, Kadın: PVWB260012
  const gomlekPrefix = isFemale ? 'PVWB260012' : 'PVWB260013';

  // 4. Pantolon SKU Prefix: Erkek: PVWB260017 (veya PVWB260009), Kadın: PVWB250007 (veya PVWK100008)
  const pantPrefix = isFemale ? 'PVWB250007' : 'PVWB260017';

  // Veritabanından gerçek EAN ve Parça No eşleştirmeleri çek
  const queries = await pool.query(`
    SELECT sku, code39, ean13, barcode, size, clean_size, product_name
    FROM master_products
    WHERE sku ILIKE $1 OR sku ILIKE $2 OR sku ILIKE $3 OR sku ILIKE $4 OR sku = $5
  `, [
    `${montPrefix}%`,
    `${yelekPrefix}%`,
    `${gomlekPrefix}%`,
    `${pantPrefix}%`,
    rawShoe
  ]);

  const mpRows = queries.rows;

  // Helper matcher
  const findMatch = (prefix, sz) => {
    // Exact SKU match e.g. PVWK100106L
    let m = mpRows.find(r => r.sku.toUpperCase() === `${prefix}${sz}`.toUpperCase());
    if (!m) m = mpRows.find(r => r.sku.toUpperCase().startsWith(prefix) && (r.clean_size === sz || r.size === sz));
    if (!m) m = mpRows.find(r => r.sku.toUpperCase().startsWith(prefix));
    return m;
  };

  const montMatch = findMatch(montPrefix, top);
  const yelekMatch = findMatch(yelekPrefix, top);
  const gomlekMatch = findMatch(gomlekPrefix, top);
  const pantMatch = findMatch(pantPrefix, bottom);
  const shoeMatch = mpRows.find(r => r.sku.toUpperCase() === rawShoe.toUpperCase());

  const items = [
    {
      id: 1,
      name: `Danışman Montu (${montPref})`,
      part_no: montMatch ? montMatch.code39 || montMatch.sku : `${montPrefix}${top}`,
      ean13: montMatch ? montMatch.ean13 || montMatch.barcode : '8692457797187',
      size: top,
      qty: 1
    },
    {
      id: 2,
      name: 'Danışman Yeleği',
      part_no: yelekMatch ? yelekMatch.code39 || yelekMatch.sku : `${yelekPrefix}${top}`,
      ean13: yelekMatch ? yelekMatch.ean13 || yelekMatch.barcode : '8692457797187',
      size: top,
      qty: 1
    },
    {
      id: 3,
      name: 'Danışman Gömlek (1/2)',
      part_no: gomlekMatch ? gomlekMatch.code39 || gomlekMatch.sku : `${gomlekPrefix}${top}`,
      ean13: gomlekMatch ? gomlekMatch.ean13 || gomlekMatch.barcode : '8684072311659',
      size: top,
      qty: 1
    },
    {
      id: 4,
      name: 'Danışman Gömlek (2/2)',
      part_no: gomlekMatch ? gomlekMatch.code39 || gomlekMatch.sku : `${gomlekPrefix}${top}`,
      ean13: gomlekMatch ? gomlekMatch.ean13 || gomlekMatch.barcode : '8684072311659',
      size: top,
      qty: 1
    },
    {
      id: 5,
      name: 'Danışman Pantolon (1/2)',
      part_no: pantMatch ? pantMatch.code39 || pantMatch.sku : `${pantPrefix}${bottom}`,
      ean13: pantMatch ? pantMatch.ean13 || pantMatch.barcode : '8692600174476',
      size: bottom,
      qty: 1
    },
    {
      id: 6,
      name: 'Danışman Pantolon (2/2)',
      part_no: pantMatch ? pantMatch.code39 || pantMatch.sku : `${pantPrefix}${bottom}`,
      ean13: pantMatch ? pantMatch.ean13 || pantMatch.barcode : '8692600174476',
      size: bottom,
      qty: 1
    },
    {
      id: 7,
      name: 'Danışman Ayakkabısı',
      part_no: rawShoe || (isFemale ? 'PVWB260010' : 'PVWB260019'),
      ean13: shoeMatch ? shoeMatch.ean13 || shoeMatch.barcode : '8693051336284',
      size: cleanShoe,
      qty: 1
    }
  ];

  return {
    staff_name: staff.name,
    gender,
    montPref,
    clean_shoe_size: cleanShoe,
    raw_shoe_code: rawShoe,
    items
  };
}

async function test() {
  const cem = await pool.query("SELECT * FROM personnel WHERE name ILIKE '%CEM OĞUZ%' LIMIT 1");
  if (cem.rows.length > 0) {
    const res = await resolveStaffBundle(cem.rows[0]);
    console.log('=== RESOLVED BUNDLE FOR CEM OĞUZ ===');
    console.log(JSON.stringify(res, null, 2));
  }
  pool.end();
}

test();
