const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// Load app.js functions directly by creating mock environment
const appCode = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

const vm = require('vm');

const sandbox = {
    console,
    Date,
    Math,
    String,
    parseInt,
    Array,
    Map,
    Set,
    RegExp,
    path,
    fs,
    xlsx,
    require,
    __dirname,
    process: { env: {} }
};

vm.createContext(sandbox);

// Extract helper functions and label generators up to start of routes
const extractPart1 = appCode.substring(
    appCode.indexOf('// In-Memory Nissan Excel Part Code Map'),
    appCode.indexOf('const app = express();')
);

const startGfa = appCode.indexOf('const YERLI_URETIM_GFA =');
const extractPart2 = appCode.substring(
    startGfa,
    appCode.indexOf('// -------------------------------------------------------------', startGfa)
);

vm.runInContext(extractPart1, sandbox);
vm.runInContext(extractPart2, sandbox);

const { generateSatoRfidZplQr, generateSatoRfidZplClassic, formatDualSize, cleanParcaNo, extractParcaNo, cleanSizeCode, nissanExcelCodeMap } = sandbox;

console.log('=== TEST 1: Nissan Excel Code Map Loaded ===');
console.log(`Map size: ${nissanExcelCodeMap.size}`);
console.log('Barcode 8520147032006 ->', nissanExcelCodeMap.get('8520147032006'));
console.log('Barcode 9010201001018 ->', nissanExcelCodeMap.get('9010201001018'));

console.log('\n=== TEST 2: Nissan Mont (Non-pantolon) ===');
const nissanMontZpl = generateSatoRfidZplQr({
    product_name: 'TEKNİSYEN KISLIK MONT 4XL',
    brand: 'NISSAN',
    gender: 'Erkek',
    size: '4XL',
    clean_size: '4XL',
    barcode: '8520147032006',
    sku: '8520147032006',
    code39: 'KIYAFETKIS-MONT-4XL'
});

const nissanParcaMatch = nissanMontZpl.match(/\^FDPARCA NO:\^FS\s*\^FO\d+,\d+.*?\^FD([^\^]+)\^FS/);
const nissanEanMatch = nissanMontZpl.match(/\^FDEAN:\^FS\s*\^FO\d+,\d+.*?\^FD([^\^]+)\^FS/);
const nissanBedenMatch = nissanMontZpl.match(/\^FDBEDEN:\^FS\s*\^FO\d+,\d+.*?\^FD([^\^]+)\^FS/);

console.log('PARCA NO:', nissanParcaMatch ? nissanParcaMatch[1] : 'FAIL');
console.log('EAN:     ', nissanEanMatch ? nissanEanMatch[1] : 'FAIL');
console.log('BEDEN:   ', nissanBedenMatch ? nissanBedenMatch[1] : 'FAIL');

const t2Pass = nissanParcaMatch && nissanParcaMatch[1] === 'KIYAFETKIS-MONT-4XL' &&
               nissanEanMatch && nissanEanMatch[1] === '8520147032006' &&
               nissanBedenMatch && nissanBedenMatch[1] === '4XL';
console.log('Test 2 Result:', t2Pass ? '✅ PASS (No parenthesis on Mont, exact Excel part code)' : '❌ FAIL');

console.log('\n=== TEST 3: Nissan Pantolon (Pantolon) ===');
const nissanPantolonZpl = generateSatoRfidZplQr({
    product_name: 'TEKNİSYEN KISLIK PANTOLON 4XL',
    brand: 'NISSAN',
    gender: 'Erkek',
    size: '4XL',
    clean_size: '4XL',
    barcode: '8520147032723',
    sku: '8520147032723',
    code39: 'KIYAFETKIS-PANTOLON-4XL'
});

const pantParcaMatch = nissanPantolonZpl.match(/\^FDPARCA NO:\^FS\s*\^FO\d+,\d+.*?\^FD([^\^]+)\^FS/);
const pantBedenMatch = nissanPantolonZpl.match(/\^FDBEDEN:\^FS\s*\^FO\d+,\d+.*?\^FD([^\^]+)\^FS/);

console.log('PARCA NO:', pantParcaMatch ? pantParcaMatch[1] : 'FAIL');
console.log('BEDEN:   ', pantBedenMatch ? pantBedenMatch[1] : 'FAIL');

const t3Pass = pantParcaMatch && pantParcaMatch[1] === 'KIYAFETKIS-PANTOLON-4XL' &&
               pantBedenMatch && pantBedenMatch[1].includes('(');
console.log('Test 3 Result:', t3Pass ? '✅ PASS (Pantolon retains dual size parenthesis)' : '❌ FAIL');

console.log('\n=== TEST 4: VW Non-pantolon (T-Shirt / Mont) ===');
const vwMontZpl = generateSatoRfidZplQr({
    product_name: 'Atölye Personeli Mont Kışlık - Erkek',
    brand: 'VOLKSWAGEN',
    gender: 'Erkek',
    size: 'XS',
    clean_size: 'XS',
    barcode: '8692457797187',
    sku: 'PVWK100004XS',
    code39: 'PVWK100004XS'
});

const vwParcaMatch = vwMontZpl.match(/\^FDPARCA NO:\^FS\s*\^FO\d+,\d+.*?\^FD([^\^]+)\^FS/);
const vwBedenMatch = vwMontZpl.match(/\^FDBEDEN:\^FS\s*\^FO\d+,\d+.*?\^FD([^\^]+)\^FS/);

console.log('PARCA NO:', vwParcaMatch ? vwParcaMatch[1] : 'FAIL');
console.log('BEDEN:   ', vwBedenMatch ? vwBedenMatch[1] : 'FAIL');

const t4Pass = vwParcaMatch && vwParcaMatch[1] === 'PVWK100004XS' &&
               vwBedenMatch && vwBedenMatch[1] === 'XS';
console.log('Test 4 Result:', t4Pass ? '✅ PASS (PVWK100004XS preserved, Beden is pure XS without parenthesis)' : '❌ FAIL');

console.log('\n=== TEST 5: Audi T-Shirt with M (42) input ===');
const audiZpl = generateSatoRfidZplClassic({
    product_name: 'Siyah T-Shirt/M/Servis Danışmanı-AUDI/Erkek',
    brand: 'AUDI',
    gender: 'Erkek',
    size: 'M (42)',
    clean_size: 'M (42)',
    barcode: '8692600031335',
    sku: 'PPAUDI260001M',
    code39: 'PPAUDI260001M'
});

const audiParcaMatch = audiZpl.match(/\^FDPARCA NO:\^FS\s*\^FO\d+,\d+.*?\^FD([^\^]+)\^FS/);
const audiBedenMatch = audiZpl.match(/\^FDBEDEN:\^FS\s*\^FO\d+,\d+.*?\^FD([^\^]+)\^FS/);

console.log('PARCA NO:', audiParcaMatch ? audiParcaMatch[1] : 'FAIL');
console.log('BEDEN:   ', audiBedenMatch ? audiBedenMatch[1] : 'FAIL');

const t5Pass = audiParcaMatch && audiParcaMatch[1] === 'PPAUDI260001M' &&
               audiBedenMatch && audiBedenMatch[1] === 'M';
console.log('Test 5 Result:', t5Pass ? '✅ PASS (PPAUDI260001M preserved, Beden M has parenthesis stripped)' : '❌ FAIL');
