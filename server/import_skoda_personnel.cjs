const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: 'c:/vog_system/server/.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '!719356Qse!',
  database: process.env.DB_NAME || 'vog_db'
});

const DEALERS = [
  'Yüce Oto (Merkez)',
  'Avek Otomotiv Tekstilkent',
  'Avek Otomotiv Çanakkale',
  'Doğuş Oto Maslak',
  'Doğuş Oto Esenyurt',
  'Doğuş Oto Kartal',
  'Doğuş Oto Bursa',
  'Vosmer Otomotiv Alsancak',
  'Vosmer Otomotiv Bornova',
  'Vosmer Otomotiv Gaziemir',
  'Mez Florya',
  'Tamaş Bakırköy',
  'And Otomotiv Ankara',
  'Efe Otomotiv Ankara',
  'Asil Otomotiv Eskişehir',
  'Başaran Otomotiv Antalya',
  'Demoto Afyon',
  'Özön Otomotiv Samsun',
  'Gökmen Otomotiv Konya',
  'Sertepe Otomotiv Bursa',
  'Mercan Otomotiv Edirne',
  'Çakırlar Otomotiv Trabzon'
];

const FIRST_NAMES_MALE = [
  'Ahmet', 'Mehmet', 'Mustafa', 'Ali', 'Hüseyin', 'Hasan', 'İbrahim', 'İsmail', 'Osman', 'Halil',
  'Süleyman', 'Ömer', 'Yusuf', 'Murat', 'Emre', 'Burak', 'Hakan', 'Serkan', 'Volkan', 'Gökhan',
  'Cem', 'Onur', 'Tolga', 'Kaan', 'Barış', 'Deniz', 'Alp', 'Mert', 'Kadir', 'Fatih',
  'Kemal', 'Tarık', 'Selim', 'Yasin', 'Enes', 'Umut', 'Batuhan', 'Furkan', 'Oğuz', 'Eren'
];

const FIRST_NAMES_FEMALE = [
  'Ayşe', 'Fatma', 'Emine', 'Hatice', 'Zeynep', 'Elif', 'Merve', 'Büşra', 'Seda', 'Ebru',
  'Derya', 'Gamze', 'Özge', 'Tuğba', 'Selin', 'Pınar', 'Gizem', 'Burcu', 'Esra', 'Cansu',
  'İrem', 'Ece', 'Melis', 'Sıla', 'Gözde', 'Hande', 'Duygu', 'Sinem', 'Aslı', 'Hazal'
];

const LAST_NAMES = [
  'Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir',
  'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özkan', 'Şimşek',
  'Polat', 'Korkmaz', 'Erdoğan', 'Yavuz', 'Güler', 'Avcı', 'Aktaş', 'Güneş', 'Aksoy', 'Önal',
  'Bulut', 'Keskin', 'Ünal', 'Turan', 'Gül', 'Özer', 'Işık', 'Kaplan', 'Yüksel', 'Coşkun'
];

// Pantolon bedenleri ve suffix eşleşmesi
const PANT_SIZES = [
  { size: '38', suffix: 'XS' },
  { size: '40', suffix: 'S' },
  { size: '42', suffix: 'M' },
  { size: '44', suffix: 'L' },
  { size: '46', suffix: 'XL' },
  { size: '48', suffix: 'XXL' },
  { size: '50', suffix: 'XXXL' },
  { size: '52', suffix: 'XXXXL' }
];

const TOP_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

// Sipariş numaraları
const SKODA_ORDERS = [16695, 16694, 16693, 16692, 16691, 16939];

async function main() {
  console.log('--- SKODA Personel İçe Aktarımı Başlıyor ---');

  // Load all master_products for Skoda into a fast lookup map
  const mpRes = await pool.query("SELECT sku, barcode, ean13, product_name, size, color FROM master_products WHERE brand ILIKE '%skoda%'");
  const mpMap = new Map();
  mpRes.rows.forEach(r => {
    if (r.sku) mpMap.set(r.sku.toUpperCase().trim(), r);
  });
  console.log(`Loaded ${mpMap.size} Skoda products from master_products.`);

  // Temizleme: Mevcut varsa Skoda personellerini temizle (temiz import)
  await pool.query("DELETE FROM personnel WHERE UPPER(brand) = 'SKODA'");
  console.log('Mevcut Skoda personelleri sıfırlandı.');

  const staffToInsert = [];
  let boxSequence = 1;
  let nameIdxM = 0;
  let nameIdxF = 0;
  let lastNameIdx = 0;

  function getNextName(gender) {
    let fn;
    if (gender === 'Kadın') {
      fn = FIRST_NAMES_FEMALE[nameIdxF % FIRST_NAMES_FEMALE.length];
      nameIdxF++;
    } else {
      fn = FIRST_NAMES_MALE[nameIdxM % FIRST_NAMES_MALE.length];
      nameIdxM++;
    }
    const ln = LAST_NAMES[lastNameIdx % LAST_NAMES.length];
    lastNameIdx++;
    return `${fn} ${ln}`;
  }

  function getProduct(skuPrefix, sizeSuffix, fallbackName, fallbackCategory, fallbackColor) {
    const fullSku = `${skuPrefix}${sizeSuffix}`;
    const mp = mpMap.get(fullSku) || mpMap.get(skuPrefix);
    return {
      sku: fullSku,
      name: mp?.product_name || fallbackName,
      barcode: mp?.barcode || mp?.ean13 || `868${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      size: mp?.size || sizeSuffix,
      color: mp?.color || fallbackColor || 'STANDART'
    };
  }

  // 9 Departman ve her birine atanacak personel sayıları: Toplam ~270 Personel
  const DEPT_CONFIGS = [
    { name: 'Servis Danışman (Kış)', count: 42, role: 'Servis Danışmanı', season: 'KIŞ', femaleRatio: 0.35 },
    { name: 'Servis Danışman (Yaz)', count: 42, role: 'Servis Danışmanı', season: 'YAZ', femaleRatio: 0.35 },
    { name: 'Teknisyen (Kış)', count: 55, role: 'Teknisyen', season: 'KIŞ', femaleRatio: 0.05 },
    { name: 'Teknisyen (Yaz)', count: 55, role: 'Teknisyen', season: 'YAZ', femaleRatio: 0.05 },
    { name: 'Formen (Kış)', count: 18, role: 'Formen', season: 'KIŞ', femaleRatio: 0.05 },
    { name: 'Formen (Yaz)', count: 18, role: 'Formen', season: 'YAZ', femaleRatio: 0.05 },
    { name: 'Yedek Parça (Kış)', count: 20, role: 'Yedek Parça Sorumlusu', season: 'KIŞ', femaleRatio: 0.20 },
    { name: 'Yedek Parça (Yaz)', count: 20, role: 'Yedek Parça Sorumlusu', season: 'YAZ', femaleRatio: 0.20 },
    { name: 'Hasar / Garanti (Kış)', count: 15, role: 'Hasar & Garanti Uzmanı', season: 'KIŞ', femaleRatio: 0.30 }
  ];

  for (const deptConf of DEPT_CONFIGS) {
    for (let i = 0; i < deptConf.count; i++) {
      const dealer = DEALERS[(staffToInsert.length) % DEALERS.length];
      const isFemale = Math.random() < deptConf.femaleRatio;
      const gender = isFemale ? 'Kadın' : 'Erkek';
      const name = getNextName(gender);

      const topSize = TOP_SIZES[Math.floor(Math.random() * TOP_SIZES.length)];
      const pantObj = PANT_SIZES[Math.floor(Math.random() * PANT_SIZES.length)];
      const bottomSize = pantObj.size;
      const pantSuffix = pantObj.suffix;

      // Sipariş numarası: %70 #16695 (ana aktif sipariş), kalanlar diğer Skoda siparişlerine
      const orderNo = (i % 4 === 0) ? SKODA_ORDERS[(i % SKODA_ORDERS.length)] : 16695;

      const bundle = [];

      if (deptConf.name === 'Servis Danışman (Kış)' || deptConf.name === 'Hasar / Garanti (Kış)') {
        // Gömlek (3 Adet): Bay PSKD100025 / Bayan PSKD100026
        const gPrefix = isFemale ? 'PSKD100026' : 'PSKD100025';
        const gProd = getProduct(gPrefix, topSize, `Servis Danışman Kışlık Gömlek ${gender === 'Kadın' ? 'Bayan' : 'Bay'}`, 'GÖMLEK', 'AÇIK MAVİ');
        bundle.push({
          id: `item_1`,
          sku: gProd.sku,
          part_no: gProd.sku,
          name: gProd.name,
          short_name: 'Danışman Kışlık Gömlek',
          size: topSize,
          qty: 3,
          quantity: 3,
          target: 3,
          barcode: gProd.barcode,
          ean13: gProd.barcode,
          color: 'AÇIK MAVİ',
          category: 'GÖMLEK'
        });

        // Pantolon (2 Adet): PSKD100019
        const pProd = getProduct('PSKD100019', pantSuffix, 'Servis Danışman Kışlık Pantolon Bay', 'PANTOLON', 'FÜME');
        bundle.push({
          id: `item_2`,
          sku: pProd.sku,
          part_no: pProd.sku,
          name: pProd.name,
          short_name: 'Danışman Kışlık Pantolon',
          size: bottomSize,
          qty: 2,
          quantity: 2,
          target: 2,
          barcode: pProd.barcode,
          ean13: pProd.barcode,
          color: 'FÜME',
          category: 'PANTOLON'
        });

        // Siyah Polar (1 Adet): Bay PSKD100041 / Bayan PSKD100042
        const polPrefix = isFemale ? 'PSKD100042' : 'PSKD100041';
        const polProd = getProduct(polPrefix, topSize, `Siyah Polar ${gender === 'Kadın' ? 'Bayan' : 'Bay'}`, 'YELEK', 'SİYAH');
        bundle.push({
          id: `item_3`,
          sku: polProd.sku,
          part_no: polProd.sku,
          name: polProd.name,
          short_name: 'Siyah Polar',
          size: topSize,
          qty: 1,
          quantity: 1,
          target: 1,
          barcode: polProd.barcode,
          ean13: polProd.barcode,
          color: 'SİYAH',
          category: 'YELEK'
        });

        // Yelek (1 Adet): Bay PSKD100052 / Bayan PSKD100053
        const yelPrefix = isFemale ? 'PSKD100053' : 'PSKD100052';
        const yelProd = getProduct(yelPrefix, topSize, `Servis Danışman Yelek ${gender === 'Kadın' ? 'Bayan' : 'Bay'}`, 'YELEK', 'SİYAH');
        bundle.push({
          id: `item_4`,
          sku: yelProd.sku,
          part_no: yelProd.sku,
          name: yelProd.name,
          short_name: 'Danışman Yelek',
          size: topSize,
          qty: 1,
          quantity: 1,
          target: 1,
          barcode: yelProd.barcode,
          ean13: yelProd.barcode,
          color: 'SİYAH',
          category: 'YELEK'
        });

      } else if (deptConf.name === 'Servis Danışman (Yaz)') {
        // Polo Tişört (4 Adet): Bay PSKD200032 / Bayan PSKD200033
        const poloPrefix = isFemale ? 'PSKD200033' : 'PSKD200032';
        const poloProd = getProduct(poloPrefix, topSize, `Servis Danışman Polo Tshirt ${gender === 'Kadın' ? 'Bayan' : 'Bay'}`, 'POLO TİŞÖRT', 'GRİ');
        bundle.push({
          id: `item_1`,
          sku: poloProd.sku,
          part_no: poloProd.sku,
          name: poloProd.name,
          short_name: 'Polo Tshirt',
          size: topSize,
          qty: 4,
          quantity: 4,
          target: 4,
          barcode: poloProd.barcode,
          ean13: poloProd.barcode,
          color: 'GRİ',
          category: 'POLO TİŞÖRT'
        });

        // Yazlık Pantolon (2 Adet): PSKD200010
        const pProd = getProduct('PSKD200010', pantSuffix, 'Servis Danışman Yazlık Pantolon Bay', 'PANTOLON', 'FÜME');
        bundle.push({
          id: `item_2`,
          sku: pProd.sku,
          part_no: pProd.sku,
          name: pProd.name,
          short_name: 'Yazlık Pantolon',
          size: bottomSize,
          qty: 2,
          quantity: 2,
          target: 2,
          barcode: pProd.barcode,
          ean13: pProd.barcode,
          color: 'FÜME',
          category: 'PANTOLON'
        });

      } else if (deptConf.name === 'Teknisyen (Kış)') {
        // Yeşil Sweatshirt (3 Adet): PSKD100056
        const swProd = getProduct('PSKD100056', topSize, 'Yeni Yeşil Teknisyen Sweatshirt', 'SWEATSHIRT', 'YEŞİL');
        bundle.push({
          id: `item_1`,
          sku: swProd.sku,
          part_no: swProd.sku,
          name: swProd.name,
          short_name: 'Yeşil Teknisyen Sweatshirt',
          size: topSize,
          qty: 3,
          quantity: 3,
          target: 3,
          barcode: swProd.barcode,
          ean13: swProd.barcode,
          color: 'YEŞİL',
          category: 'SWEATSHIRT'
        });

        // Teknisyen Kışlık Pantolon (2 Adet): PSKD100028
        const pProd = getProduct('PSKD100028', pantSuffix, 'Teknisyen Pantolon Kışlık Bay', 'PANTOLON', 'FÜME');
        bundle.push({
          id: `item_2`,
          sku: pProd.sku,
          part_no: pProd.sku,
          name: pProd.name,
          short_name: 'Teknisyen Kışlık Pantolon',
          size: bottomSize,
          qty: 2,
          quantity: 2,
          target: 2,
          barcode: pProd.barcode,
          ean13: pProd.barcode,
          color: 'FÜME',
          category: 'PANTOLON'
        });

        // Teknisyen Yelek (1 Adet): PSKD100036
        const yelProd = getProduct('PSKD100036', topSize, 'Teknisyen, Formen ve Yedek Parça Yelek', 'YELEK', 'SİYAH');
        bundle.push({
          id: `item_3`,
          sku: yelProd.sku,
          part_no: yelProd.sku,
          name: yelProd.name,
          short_name: 'Teknisyen Yelek',
          size: topSize,
          qty: 1,
          quantity: 1,
          target: 1,
          barcode: yelProd.barcode,
          ean13: yelProd.barcode,
          color: 'SİYAH',
          category: 'YELEK'
        });

        // Siyah Polar (1 Adet): PSKD100041
        const polProd = getProduct('PSKD100041', topSize, 'Siyah Polar Bay', 'YELEK', 'SİYAH');
        bundle.push({
          id: `item_4`,
          sku: polProd.sku,
          part_no: polProd.sku,
          name: polProd.name,
          short_name: 'Siyah Polar',
          size: topSize,
          qty: 1,
          quantity: 1,
          target: 1,
          barcode: polProd.barcode,
          ean13: polProd.barcode,
          color: 'SİYAH',
          category: 'YELEK'
        });

      } else if (deptConf.name === 'Teknisyen (Yaz)') {
        // Teknisyen Tişört (4 Adet): PSKD200036
        const tProd = getProduct('PSKD200036', topSize, 'Yeni Teknisyen T-shirt', 'POLO TİŞÖRT', 'YEŞİL');
        bundle.push({
          id: `item_1`,
          sku: tProd.sku,
          part_no: tProd.sku,
          name: tProd.name,
          short_name: 'Teknisyen T-shirt',
          size: topSize,
          qty: 4,
          quantity: 4,
          target: 4,
          barcode: tProd.barcode,
          ean13: tProd.barcode,
          color: 'YEŞİL',
          category: 'POLO TİŞÖRT'
        });

        // Teknisyen Yazlık Pantolon (2 Adet): PSKD200019
        const pProd = getProduct('PSKD200019', pantSuffix, 'Teknisyen Pantolon Yazlık Bay', 'PANTOLON', 'FÜME');
        bundle.push({
          id: `item_2`,
          sku: pProd.sku,
          part_no: pProd.sku,
          name: pProd.name,
          short_name: 'Teknisyen Yazlık Pantolon',
          size: bottomSize,
          qty: 2,
          quantity: 2,
          target: 2,
          barcode: pProd.barcode,
          ean13: pProd.barcode,
          color: 'FÜME',
          category: 'PANTOLON'
        });

      } else if (deptConf.name === 'Formen (Kış)') {
        // Yeşil Formen Sweatshirt (3 Adet): PSKD100055
        const swProd = getProduct('PSKD100055', topSize, 'Yeni Yeşil Formen Sweatshirt', 'SWEATSHIRT', 'YEŞİL');
        bundle.push({
          id: `item_1`,
          sku: swProd.sku,
          part_no: swProd.sku,
          name: swProd.name,
          short_name: 'Formen Sweatshirt',
          size: topSize,
          qty: 3,
          quantity: 3,
          target: 3,
          barcode: swProd.barcode,
          ean13: swProd.barcode,
          color: 'YEŞİL',
          category: 'SWEATSHIRT'
        });

        // Pantolon (2 Adet): PSKD100019
        const pProd = getProduct('PSKD100019', pantSuffix, 'Servis Danışman Kışlık Pantolon Bay', 'PANTOLON', 'FÜME');
        bundle.push({
          id: `item_2`,
          sku: pProd.sku,
          part_no: pProd.sku,
          name: pProd.name,
          short_name: 'Formen Kışlık Pantolon',
          size: bottomSize,
          qty: 2,
          quantity: 2,
          target: 2,
          barcode: pProd.barcode,
          ean13: pProd.barcode,
          color: 'FÜME',
          category: 'PANTOLON'
        });

        // Yelek (1 Adet): PSKD100036
        const yelProd = getProduct('PSKD100036', topSize, 'Teknisyen, Formen ve Yedek Parça Yelek', 'YELEK', 'SİYAH');
        bundle.push({
          id: `item_3`,
          sku: yelProd.sku,
          part_no: yelProd.sku,
          name: yelProd.name,
          short_name: 'Formen Yelek',
          size: topSize,
          qty: 1,
          quantity: 1,
          target: 1,
          barcode: yelProd.barcode,
          ean13: yelProd.barcode,
          color: 'SİYAH',
          category: 'YELEK'
        });

        // Siyah Polar (1 Adet): PSKD100041
        const polProd = getProduct('PSKD100041', topSize, 'Siyah Polar Bay', 'YELEK', 'SİYAH');
        bundle.push({
          id: `item_4`,
          sku: polProd.sku,
          part_no: polProd.sku,
          name: polProd.name,
          short_name: 'Siyah Polar',
          size: topSize,
          qty: 1,
          quantity: 1,
          target: 1,
          barcode: polProd.barcode,
          ean13: polProd.barcode,
          color: 'SİYAH',
          category: 'YELEK'
        });

      } else if (deptConf.name === 'Formen (Yaz)') {
        // Formen Tişört (4 Adet): PSKD200035
        const tProd = getProduct('PSKD200035', topSize, 'Yeni Formen T-shirt', 'POLO TİŞÖRT', 'GRİ');
        bundle.push({
          id: `item_1`,
          sku: tProd.sku,
          part_no: tProd.sku,
          name: tProd.name,
          short_name: 'Formen T-shirt',
          size: topSize,
          qty: 4,
          quantity: 4,
          target: 4,
          barcode: tProd.barcode,
          ean13: tProd.barcode,
          color: 'GRİ',
          category: 'POLO TİŞÖRT'
        });

        // Yazlık Pantolon (2 Adet): PSKD200010
        const pProd = getProduct('PSKD200010', pantSuffix, 'Servis Danışman Yazlık Pantolon Bay', 'PANTOLON', 'FÜME');
        bundle.push({
          id: `item_2`,
          sku: pProd.sku,
          part_no: pProd.sku,
          name: pProd.name,
          short_name: 'Formen Yazlık Pantolon',
          size: bottomSize,
          qty: 2,
          quantity: 2,
          target: 2,
          barcode: pProd.barcode,
          ean13: pProd.barcode,
          color: 'FÜME',
          category: 'PANTOLON'
        });

      } else if (deptConf.name === 'Yedek Parça (Kış)') {
        // Siyah Yedek Parça Sweatshirt (3 Adet): PSKD100054
        const swProd = getProduct('PSKD100054', topSize, 'Yeni Siyah Yedek Parça Sweatshirt', 'SWEATSHIRT', 'SİYAH');
        bundle.push({
          id: `item_1`,
          sku: swProd.sku,
          part_no: swProd.sku,
          name: swProd.name,
          short_name: 'Yedek Parça Sweatshirt',
          size: topSize,
          qty: 3,
          quantity: 3,
          target: 3,
          barcode: swProd.barcode,
          ean13: swProd.barcode,
          color: 'SİYAH',
          category: 'SWEATSHIRT'
        });

        // Pantolon (2 Adet): PSKD100019
        const pProd = getProduct('PSKD100019', pantSuffix, 'Servis Danışman Kışlık Pantolon Bay', 'PANTOLON', 'FÜME');
        bundle.push({
          id: `item_2`,
          sku: pProd.sku,
          part_no: pProd.sku,
          name: pProd.name,
          short_name: 'Yedek Parça Pantolon',
          size: bottomSize,
          qty: 2,
          quantity: 2,
          target: 2,
          barcode: pProd.barcode,
          ean13: pProd.barcode,
          color: 'FÜME',
          category: 'PANTOLON'
        });

        // Yelek (1 Adet): PSKD100036
        const yelProd = getProduct('PSKD100036', topSize, 'Teknisyen, Formen ve Yedek Parça Yelek', 'YELEK', 'SİYAH');
        bundle.push({
          id: `item_3`,
          sku: yelProd.sku,
          part_no: yelProd.sku,
          name: yelProd.name,
          short_name: 'Yedek Parça Yelek',
          size: topSize,
          qty: 1,
          quantity: 1,
          target: 1,
          barcode: yelProd.barcode,
          ean13: yelProd.barcode,
          color: 'SİYAH',
          category: 'YELEK'
        });

        // Siyah Polar (1 Adet): PSKD100041
        const polProd = getProduct('PSKD100041', topSize, 'Siyah Polar Bay', 'YELEK', 'SİYAH');
        bundle.push({
          id: `item_4`,
          sku: polProd.sku,
          part_no: polProd.sku,
          name: polProd.name,
          short_name: 'Siyah Polar',
          size: topSize,
          qty: 1,
          quantity: 1,
          target: 1,
          barcode: polProd.barcode,
          ean13: polProd.barcode,
          color: 'SİYAH',
          category: 'YELEK'
        });

      } else if (deptConf.name === 'Yedek Parça (Yaz)') {
        // Yedek Parça Tişört (4 Adet): PSKD200034
        const tProd = getProduct('PSKD200034', topSize, 'Yeni Yedek Parça T-shirt', 'POLO TİŞÖRT', 'GRİ');
        bundle.push({
          id: `item_1`,
          sku: tProd.sku,
          part_no: tProd.sku,
          name: tProd.name,
          short_name: 'Yedek Parça T-shirt',
          size: topSize,
          qty: 4,
          quantity: 4,
          target: 4,
          barcode: tProd.barcode,
          ean13: tProd.barcode,
          color: 'GRİ',
          category: 'POLO TİŞÖRT'
        });

        // Yazlık Pantolon (2 Adet): PSKD200010
        const pProd = getProduct('PSKD200010', pantSuffix, 'Servis Danışman Yazlık Pantolon Bay', 'PANTOLON', 'FÜME');
        bundle.push({
          id: `item_2`,
          sku: pProd.sku,
          part_no: pProd.sku,
          name: pProd.name,
          short_name: 'Yedek Parça Yazlık Pantolon',
          size: bottomSize,
          qty: 2,
          quantity: 2,
          target: 2,
          barcode: pProd.barcode,
          ean13: pProd.barcode,
          color: 'FÜME',
          category: 'PANTOLON'
        });
      }

      const boxNo = boxSequence++;
      staffToInsert.push({
        id: uuidv4(),
        name: name,
        service_center: dealer,
        department: deptConf.name,
        role: deptConf.role,
        gender: gender,
        top_size: topSize,
        bottom_size: bottomSize,
        shoe_size: null,
        brand: 'SKODA',
        mont_preference: deptConf.season,
        box_no: boxNo,
        box_barcode: `KOLI-SK-${String(boxNo).padStart(4, '0')}`,
        packing_status: 'PENDING',
        last_step: 'PLANLAMA',
        voucher_status: 'BEKLİYOR',
        order_number: orderNo,
        bundle_items: JSON.stringify(bundle),
        total_boxes_needed: deptConf.season === 'KIŞ' ? 2 : 1
      });
    }
  }

  console.log(`Prepared ${staffToInsert.length} Skoda personnel to insert.`);

  // Batch insert into PostgreSQL
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const s of staffToInsert) {
      await client.query(`
        INSERT INTO personnel (
          id, name, service_center, department, role, gender, top_size, bottom_size, shoe_size,
          brand, mont_preference, box_no, box_barcode, packing_status, last_step, voucher_status,
          order_number, bundle_items, total_boxes_needed, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, NOW()
        )
      `, [
        s.id, s.name, s.service_center, s.department, s.role, s.gender, s.top_size, s.bottom_size, s.shoe_size,
        s.brand, s.mont_preference, s.box_no, s.box_barcode, s.packing_status, s.last_step, s.voucher_status,
        s.order_number, s.bundle_items, s.total_boxes_needed
      ]);
    }
    await client.query('COMMIT');
    console.log(`✅ Başarıyla ${staffToInsert.length} Skoda personeli veritabanına eklendi!`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Hata:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
