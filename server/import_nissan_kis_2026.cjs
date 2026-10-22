const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { execSync } = require('child_process');
require('dotenv').config({ path: __dirname + '/.env' });

let XLSX;
try {
    XLSX = require('xlsx');
} catch (e) {
    console.log('xlsx module not found, installing if needed...');
}

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'vog_db',
    password: process.env.DB_PASSWORD || '150609',
    port: process.env.DB_PORT || 5432,
});

function runSqlcmd(sqlQuery) {
    const tmpSql = path.join(__dirname, `tmp_nissan_kis_${Date.now()}_${Math.floor(Math.random() * 10000)}.sql`);
    fs.writeFileSync(tmpSql, sqlQuery, 'utf8');
    const cmd = `sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -f 65001 -w 65535 -y 0 -i "${tmpSql}"`;
    try {
        const out = execSync(cmd, { encoding: 'utf8', windowsHide: true });
        try { fs.unlinkSync(tmpSql); } catch (_) {}
        return out;
    } catch (err) {
        try { fs.unlinkSync(tmpSql); } catch (_) {}
        throw err;
    }
}

function esc(val, maxLen) {
    if (val === null || val === undefined) return 'NULL';
    let s = String(val).replace(/'/g, "''").trim();
    if (maxLen && s.length > maxLen) s = s.substring(0, maxLen);
    return `N'${s}'`;
}

const rawData = [
    // 1. TEKNİSYEN
    { barcode: "8520147032006", brand: "Nissan", name: "TEKNİSYEN KISLIK MONT 4XL", code: "KIYAFETKIS-MONT-4XL" },
    { barcode: "8520147032013", brand: "Nissan", name: "TEKNİSYEN KISLIK MONT 3XL", code: "KIYAFETKIS-MONT-3XL" },
    { barcode: "8520147032020", brand: "Nissan", name: "TEKNİSYEN KISLIK MONT 2XL", code: "KIYAFETKIS-MONT-2XL" },
    { barcode: "8520147032037", brand: "Nissan", name: "TEKNİSYEN KISLIK MONT XL", code: "KIYAFETKIS-MONT-XL" },
    { barcode: "8520147032044", brand: "Nissan", name: "TEKNİSYEN KISLIK MONT L", code: "KIYAFETKIS-MONT-L" },
    { barcode: "8520147032051", brand: "Nissan", name: "TEKNİSYEN KISLIK MONT M", code: "KIYAFETKIS-MONT-M" },
    { barcode: "8520147032068", brand: "Nissan", name: "TEKNİSYEN KISLIK MONT S", code: "KIYAFETKIS-MONT-S" },
    { barcode: "8520147032075", brand: "Nissan", name: "TEKNİSYEN KISLIK MONT XS", code: "KIYAFETKIS-MONT-XS" },
    { barcode: "8520147032723", brand: "Nissan", name: "TEKNİSYEN KISLIK PANTOLON 4XL", code: "KIYAFETKIS-PANTOLON-4XL" },
    { barcode: "8520147032730", brand: "Nissan", name: "TEKNİSYEN KISLIK PANTOLON 3XL", code: "KIYAFETKIS-PANTOLON-3XL" },
    { barcode: "8520147032747", brand: "Nissan", name: "TEKNİSYEN KISLIK PANTOLON 2XL", code: "KIYAFETKIS-PANTOLON-2XL" },
    { barcode: "8520147032754", brand: "Nissan", name: "TEKNİSYEN KISLIK PANTOLON XL", code: "KIYAFETKIS-PANTOLON-XL" },
    { barcode: "8520147032761", brand: "Nissan", name: "TEKNİSYEN KISLIK PANTOLON L", code: "KIYAFETKIS-PANTOLON-L" },
    { barcode: "8520147032778", brand: "Nissan", name: "TEKNİSYEN KISLIK PANTOLON M", code: "KIYAFETKIS-PANTOLON-M" },
    { barcode: "8520147032785", brand: "Nissan", name: "TEKNİSYEN KISLIK PANTOLON S", code: "KIYAFETKIS-PANTOLON-S" },
    { barcode: "8520147032792", brand: "Nissan", name: "TEKNİSYEN KISLIK PANTOLON XS", code: "KIYAFETKIS-PANTOLON-XS" },
    { barcode: "8520147033485", brand: "Nissan", name: "TEKNİSYEN KISLIK SWEAT 4XL", code: "KIYAFETKIS-SWEAT--4XL" },
    { barcode: "8520147033492", brand: "Nissan", name: "TEKNİSYEN KISLIK SWEAT 3XL", code: "KIYAFETKIS-SWEAT--3XL" },
    { barcode: "8520147033508", brand: "Nissan", name: "TEKNİSYEN KISLIK SWEAT 2XL", code: "KIYAFETKIS-SWEAT--2XL" },
    { barcode: "8520147033515", brand: "Nissan", name: "TEKNİSYEN KISLIK SWEAT XL", code: "KIYAFETKIS-SWEAT--XL" },
    { barcode: "8520147033522", brand: "Nissan", name: "TEKNİSYEN KISLIK SWEAT L", code: "KIYAFETKIS-SWEAT--L" },
    { barcode: "8520147033539", brand: "Nissan", name: "TEKNİSYEN KISLIK SWEAT M", code: "KIYAFETKIS-SWEAT--M" },
    { barcode: "8520147033546", brand: "Nissan", name: "TEKNİSYEN KISLIK SWEAT S", code: "KIYAFETKIS-SWEAT--S" },
    { barcode: "8520147033553", brand: "Nissan", name: "TEKNİSYEN KISLIK SWEAT XS", code: "KIYAFETKIS-SWEAT--XS" },
    { barcode: "8520147034123", brand: "Nissan", name: "TEKNİSYEN KISLIK YELEK 4XL", code: "KIYAFETKIS-YELEK-4XL" },
    { barcode: "8520147034130", brand: "Nissan", name: "TEKNİSYEN KISLIK YELEK 3XL", code: "KIYAFETKIS-YELEK-3XL" },
    { barcode: "8520147034147", brand: "Nissan", name: "TEKNİSYEN KISLIK YELEK 2XL", code: "KIYAFETKIS-YELEK-2XL" },
    { barcode: "8520147034154", brand: "Nissan", name: "TEKNİSYEN KISLIK YELEK XL", code: "KIYAFETKIS-YELEK-XL" },
    { barcode: "8520147034161", brand: "Nissan", name: "TEKNİSYEN KISLIK YELEK L", code: "KIYAFETKIS-YELEK-L" },
    { barcode: "8520147034178", brand: "Nissan", name: "TEKNİSYEN KISLIK YELEK M", code: "KIYAFETKIS-YELEK-M" },
    { barcode: "8520147034185", brand: "Nissan", name: "TEKNİSYEN KISLIK YELEK S", code: "KIYAFETKIS-YELEK-S" },
    { barcode: "8520147034192", brand: "Nissan", name: "TEKNİSYEN KISLIK YELEK XS", code: "KIYAFETKIS-YELEK-XS" },

    // 2. FORMEN
    { barcode: "8520147032082", brand: "Nissan", name: "FORMEN KISLIK MONT 4XL", code: "KIYAFETKIS-MONT-4XL" },
    { barcode: "8520147032099", brand: "Nissan", name: "FORMEN KISLIK MONT 3XL", code: "KIYAFETKIS-MONT-3XL" },
    { barcode: "8520147032105", brand: "Nissan", name: "FORMEN KISLIK MONT 2XL", code: "KIYAFETKIS-MONT-2XL" },
    { barcode: "8520147032112", brand: "Nissan", name: "FORMEN KISLIK MONT XL", code: "KIYAFETKIS-MONT-XL" },
    { barcode: "8520147032129", brand: "Nissan", name: "FORMEN KISLIK MONT L", code: "KIYAFETKIS-MONT-L" },
    { barcode: "8520147032136", brand: "Nissan", name: "FORMEN KISLIK MONT M", code: "KIYAFETKIS-MONT-M" },
    { barcode: "8520147032143", brand: "Nissan", name: "FORMEN KISLIK MONT S", code: "KIYAFETKIS-MONT-S" },
    { barcode: "8520147032150", brand: "Nissan", name: "FORMEN KISLIK MONT XS", code: "KIYAFETKIS-MONT-XS" },
    { barcode: "8520147032808", brand: "Nissan", name: "FORMEN KISLIK PANTOLON 4XL", code: "KIYAFETKIS-PANTOLON-4XL" },
    { barcode: "8520147032815", brand: "Nissan", name: "FORMEN KISLIK PANTOLON 3XL", code: "KIYAFETKIS-PANTOLON-3XL" },
    { barcode: "8520147032822", brand: "Nissan", name: "FORMEN KISLIK PANTOLON 2XL", code: "KIYAFETKIS-PANTOLON-2XL" },
    { barcode: "8520147032839", brand: "Nissan", name: "FORMEN KISLIK PANTOLON XL", code: "KIYAFETKIS-PANTOLON-XL" },
    { barcode: "8520147032846", brand: "Nissan", name: "FORMEN KISLIK PANTOLON L", code: "KIYAFETKIS-PANTOLON-L" },
    { barcode: "8520147032853", brand: "Nissan", name: "FORMEN KISLIK PANTOLON M", code: "KIYAFETKIS-PANTOLON-M" },
    { barcode: "8520147032860", brand: "Nissan", name: "FORMEN KISLIK PANTOLON S", code: "KIYAFETKIS-PANTOLON-S" },
    { barcode: "8520147032877", brand: "Nissan", name: "FORMEN KISLIK PANTOLON XS", code: "KIYAFETKIS-PANTOLON-XS" },
    { barcode: "8520147033560", brand: "Nissan", name: "FORMEN KISLIK SWEAT 4XL", code: "KIYAFETKIS-SWEAT--4XL" },
    { barcode: "8520147033577", brand: "Nissan", name: "FORMEN KISLIK SWEAT 3XL", code: "KIYAFETKIS-SWEAT--3XL" },
    { barcode: "8520147033584", brand: "Nissan", name: "FORMEN KISLIK SWEAT 2XL", code: "KIYAFETKIS-SWEAT--2XL" },
    { barcode: "8520147033591", brand: "Nissan", name: "FORMEN KISLIK SWEAT XL", code: "KIYAFETKIS-SWEAT--XL" },
    { barcode: "8520147033607", brand: "Nissan", name: "FORMEN KISLIK SWEAT L", code: "KIYAFETKIS-SWEAT--L" },
    { barcode: "8520147033614", brand: "Nissan", name: "FORMEN KISLIK SWEAT M", code: "KIYAFETKIS-SWEAT--M" },
    { barcode: "8520147033621", brand: "Nissan", name: "FORMEN KISLIK SWEAT S", code: "KIYAFETKIS-SWEAT--S" },
    { barcode: "8520147033638", brand: "Nissan", name: "FORMEN KISLIK SWEAT XS", code: "KIYAFETKIS-SWEAT--XS" },
    { barcode: "8520147034208", brand: "Nissan", name: "FORMEN KISLIK YELEK 4XL", code: "KIYAFETKIS-YELEK-4XL" },
    { barcode: "8520147034215", brand: "Nissan", name: "FORMEN KISLIK YELEK 3XL", code: "KIYAFETKIS-YELEK-3XL" },
    { barcode: "8520147034222", brand: "Nissan", name: "FORMEN KISLIK YELEK 2XL", code: "KIYAFETKIS-YELEK-2XL" },
    { barcode: "8520147034239", brand: "Nissan", name: "FORMEN KISLIK YELEK XL", code: "KIYAFETKIS-YELEK-XL" },
    { barcode: "8520147034246", brand: "Nissan", name: "FORMEN KISLIK YELEK L", code: "KIYAFETKIS-YELEK-L" },
    { barcode: "8520147034253", brand: "Nissan", name: "FORMEN KISLIK YELEK M", code: "KIYAFETKIS-YELEK-M" },
    { barcode: "8520147034260", brand: "Nissan", name: "FORMEN KISLIK YELEK S", code: "KIYAFETKIS-YELEK-S" },
    { barcode: "8520147034277", brand: "Nissan", name: "FORMEN KISLIK YELEK XS", code: "KIYAFETKIS-YELEK-XS" },

    // 3. MASTER TEKNİSYEN
    { barcode: "8520147032167", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK MONT 4XL", code: "KIYAFETKIS-MONT-4XL" },
    { barcode: "8520147032174", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK MONT 3XL", code: "KIYAFETKIS-MONT-3XL" },
    { barcode: "8520147032181", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK MONT 2XL", code: "KIYAFETKIS-MONT-2XL" },
    { barcode: "8520147032198", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK MONT XL", code: "KIYAFETKIS-MONT-XL" },
    { barcode: "8520147032204", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK MONT L", code: "KIYAFETKIS-MONT-L" },
    { barcode: "8520147032211", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK MONT M", code: "KIYAFETKIS-MONT-M" },
    { barcode: "8520147032228", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK MONT S", code: "KIYAFETKIS-MONT-S" },
    { barcode: "8520147032235", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK MONT XS", code: "KIYAFETKIS-MONT-XS" },
    { barcode: "8520147032884", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK PANTOLON 4XL", code: "KIYAFETKIS-PANTOLON-4XL" },
    { barcode: "8520147032891", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK PANTOLON 3XL", code: "KIYAFETKIS-PANTOLON-3XL" },
    { barcode: "8520147032907", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK PANTOLON 2XL", code: "KIYAFETKIS-PANTOLON-2XL" },
    { barcode: "8520147032914", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK PANTOLON XL", code: "KIYAFETKIS-PANTOLON-XL" },
    { barcode: "8520147032921", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK PANTOLON L", code: "KIYAFETKIS-PANTOLON-L" },
    { barcode: "8520147032938", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK PANTOLON M", code: "KIYAFETKIS-PANTOLON-M" },
    { barcode: "8520147032945", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK PANTOLON S", code: "KIYAFETKIS-PANTOLON-S" },
    { barcode: "8520147032952", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK PANTOLON XS", code: "KIYAFETKIS-PANTOLON-XS" },
    { barcode: "8520147033409", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK MASTER TEKNISYEN POLAR 4XL", code: "KIYAFETKIS-MAST.POLAR-4XL" },
    { barcode: "8520147033416", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK MASTER TEKNISYEN POLAR 3XL", code: "KIYAFETKIS-MAST.POLAR-3XL" },
    { barcode: "8520147033423", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK MASTER TEKNISYEN POLAR 2XL", code: "KIYAFETKIS-MAST.POLAR-2XL" },
    { barcode: "8520147033430", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK MASTER TEKNISYEN POLAR XL", code: "KIYAFETKIS-MAST.POLAR-XL" },
    { barcode: "8520147033447", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK MASTER TEKNISYEN POLAR L", code: "KIYAFETKIS-MAST.POLAR-L" },
    { barcode: "8520147033454", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK MASTER TEKNISYEN POLAR M", code: "KIYAFETKIS-MAST.POLAR-M" },
    { barcode: "8520147033461", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK MASTER TEKNISYEN POLAR S", code: "KIYAFETKIS-MAST.POLAR-S" },
    { barcode: "8520147033478", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK MASTER TEKNISYEN POLAR XS", code: "KIYAFETKIS-MAST.POLAR-XS" },
    { barcode: "8520147033720", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK SWEAT MASTER 4XL", code: "KIYAFETKIS-SWEAT-MASTER-4XL" },
    { barcode: "8520147033737", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK SWEAT MASTER 3XL", code: "KIYAFETKIS-SWEAT-MASTER-3XL" },
    { barcode: "8520147033744", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK SWEAT MASTER 2XL", code: "KIYAFETKIS-SWEAT-MASTER-2XL" },
    { barcode: "8520147033751", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK SWEAT MASTER XL", code: "KIYAFETKIS-SWEAT-MASTER-XL" },
    { barcode: "8520147033768", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK SWEAT MASTER L", code: "KIYAFETKIS-SWEAT-MASTER-L" },
    { barcode: "8520147033775", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK SWEAT MASTER M", code: "KIYAFETKIS-SWEAT-MASTER-M" },
    { barcode: "8520147033782", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK SWEAT MASTER S", code: "KIYAFETKIS-SWEAT-MASTER-S" },
    { barcode: "8520147033799", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK SWEAT MASTER XS", code: "KIYAFETKIS-SWEAT-MASTER-XS" },
    { barcode: "8520147034529", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK MASTER TEKNISYEN YELEK 4XL", code: "KIYAFETKIS-MAST.YELEK-4XL" },
    { barcode: "8520147034536", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK MASTER TEKNISYEN YELEK 3XL", code: "KIYAFETKIS-MAST.YELEK-3XL" },
    { barcode: "8520147034543", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK MASTER TEKNISYEN YELEK 2XL", code: "KIYAFETKIS-MAST.YELEK-2XL" },
    { barcode: "8520147034550", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK MASTER TEKNISYEN YELEK XL", code: "KIYAFETKIS-MAST.YELEK-XL" },
    { barcode: "8520147034567", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK MASTER TEKNISYEN YELEK L", code: "KIYAFETKIS-MAST.YELEK-L" },
    { barcode: "8520147034574", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK MASTER TEKNISYEN YELEK M", code: "KIYAFETKIS-MAST.YELEK-M" },
    { barcode: "8520147034581", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK MASTER TEKNISYEN YELEK S", code: "KIYAFETKIS-MAST.YELEK-S" },
    { barcode: "8520147034598", brand: "Nissan", name: "MASTER TEKNİSYEN KISLIK MASTER TEKNISYEN YELEK XS", code: "KIYAFETKIS-MAST.YELEK-XS" },

    // 4. YIKAMACI
    { barcode: "8520147032242", brand: "Nissan", name: "YIKAMACI KISLIK MONT 4XL", code: "KIYAFETKIS-MONT-4XL" },
    { barcode: "8520147032259", brand: "Nissan", name: "YIKAMACI KISLIK MONT 3XL", code: "KIYAFETKIS-MONT-3XL" },
    { barcode: "8520147032266", brand: "Nissan", name: "YIKAMACI KISLIK MONT 2XL", code: "KIYAFETKIS-MONT-2XL" },
    { barcode: "8520147032273", brand: "Nissan", name: "YIKAMACI KISLIK MONT XL", code: "KIYAFETKIS-MONT-XL" },
    { barcode: "8520147032280", brand: "Nissan", name: "YIKAMACI KISLIK MONT L", code: "KIYAFETKIS-MONT-L" },
    { barcode: "8520147032297", brand: "Nissan", name: "YIKAMACI KISLIK MONT M", code: "KIYAFETKIS-MONT-M" },
    { barcode: "8520147032303", brand: "Nissan", name: "YIKAMACI KISLIK MONT S", code: "KIYAFETKIS-MONT-S" },
    { barcode: "8520147032310", brand: "Nissan", name: "YIKAMACI KISLIK MONT XS", code: "KIYAFETKIS-MONT-XS" },
    { barcode: "8520147032969", brand: "Nissan", name: "YIKAMACI KISLIK PANTOLON 4XL", code: "KIYAFETKIS-PANTOLON-4XL" },
    { barcode: "8520147032976", brand: "Nissan", name: "YIKAMACI KISLIK PANTOLON 3XL", code: "KIYAFETKIS-PANTOLON-3XL" },
    { barcode: "8520147032983", brand: "Nissan", name: "YIKAMACI KISLIK PANTOLON 2XL", code: "KIYAFETKIS-PANTOLON-2XL" },
    { barcode: "8520147032990", brand: "Nissan", name: "YIKAMACI KISLIK PANTOLON XL", code: "KIYAFETKIS-PANTOLON-XL" },
    { barcode: "8520147033003", brand: "Nissan", name: "YIKAMACI KISLIK PANTOLON L", code: "KIYAFETKIS-PANTOLON-L" },
    { barcode: "8520147033010", brand: "Nissan", name: "YIKAMACI KISLIK PANTOLON M", code: "KIYAFETKIS-PANTOLON-M" },
    { barcode: "8520147033027", brand: "Nissan", name: "YIKAMACI KISLIK PANTOLON S", code: "KIYAFETKIS-PANTOLON-S" },
    { barcode: "8520147033034", brand: "Nissan", name: "YIKAMACI KISLIK PANTOLON XS", code: "KIYAFETKIS-PANTOLON-XS" },
    { barcode: "8520147033645", brand: "Nissan", name: "YIKAMACI KISLIK SWEAT 4XL", code: "KIYAFETKIS-SWEAT--4XL" },
    { barcode: "8520147033652", brand: "Nissan", name: "YIKAMACI KISLIK SWEAT 3XL", code: "KIYAFETKIS-SWEAT--3XL" },
    { barcode: "8520147033669", brand: "Nissan", name: "YIKAMACI KISLIK SWEAT 2XL", code: "KIYAFETKIS-SWEAT--2XL" },
    { barcode: "8520147033676", brand: "Nissan", name: "YIKAMACI KISLIK SWEAT XL", code: "KIYAFETKIS-SWEAT--XL" },
    { barcode: "8520147033683", brand: "Nissan", name: "YIKAMACI KISLIK SWEAT L", code: "KIYAFETKIS-SWEAT--L" },
    { barcode: "8520147033690", brand: "Nissan", name: "YIKAMACI KISLIK SWEAT M", code: "KIYAFETKIS-SWEAT--M" },
    { barcode: "8520147033706", brand: "Nissan", name: "YIKAMACI KISLIK SWEAT S", code: "KIYAFETKIS-SWEAT--S" },
    { barcode: "8520147033713", brand: "Nissan", name: "YIKAMACI KISLIK SWEAT XS", code: "KIYAFETKIS-SWEAT--XS" },

    // 5. YEDEK PARCA
    { barcode: "8520147032327", brand: "Nissan", name: "YEDEK PARCA KISLIK MONT 4XL", code: "KIYAFETKIS-MONT-4XL" },
    { barcode: "8520147032334", brand: "Nissan", name: "YEDEK PARCA KISLIK MONT 3XL", code: "KIYAFETKIS-MONT-3XL" },
    { barcode: "8520147032341", brand: "Nissan", name: "YEDEK PARCA KISLIK MONT 2XL", code: "KIYAFETKIS-MONT-2XL" },
    { barcode: "8520147032358", brand: "Nissan", name: "YEDEK PARCA KISLIK MONT XL", code: "KIYAFETKIS-MONT-XL" },
    { barcode: "8520147032365", brand: "Nissan", name: "YEDEK PARCA KISLIK MONT L", code: "KIYAFETKIS-MONT-L" },
    { barcode: "8520147032372", brand: "Nissan", name: "YEDEK PARCA KISLIK MONT M", code: "KIYAFETKIS-MONT-M" },
    { barcode: "8520147032389", brand: "Nissan", name: "YEDEK PARCA KISLIK MONT S", code: "KIYAFETKIS-MONT-S" },
    { barcode: "8520147032396", brand: "Nissan", name: "YEDEK PARCA KISLIK MONT XS", code: "KIYAFETKIS-MONT-XS" },
    { barcode: "8520147033126", brand: "Nissan", name: "YEDEK PARCA KISLIK  POLAR 4XL", code: "KIYAFETKIS-POLAR-4XL" },
    { barcode: "8520147033133", brand: "Nissan", name: "YEDEK PARCA KISLIK  POLAR 3XL", code: "KIYAFETKIS-POLAR-3XL" },
    { barcode: "8520147033140", brand: "Nissan", name: "YEDEK PARCA KISLIK  POLAR 2XL", code: "KIYAFETKIS-POLAR-2XL" },
    { barcode: "8520147033157", brand: "Nissan", name: "YEDEK PARCA KISLIK  POLAR XL", code: "KIYAFETKIS-POLAR-XL" },
    { barcode: "8520147033164", brand: "Nissan", name: "YEDEK PARCA KISLIK  POLAR L", code: "KIYAFETKIS-POLAR-L" },
    { barcode: "8520147033171", brand: "Nissan", name: "YEDEK PARCA KISLIK  POLAR M", code: "KIYAFETKIS-POLAR-M" },
    { barcode: "8520147033188", brand: "Nissan", name: "YEDEK PARCA KISLIK  POLAR S", code: "KIYAFETKIS-POLAR-S" },
    { barcode: "8520147033195", brand: "Nissan", name: "YEDEK PARCA KISLIK  POLAR XS", code: "KIYAFETKIS-POLAR-XS" },
    { barcode: "8520147033287", brand: "Nissan", name: "YEDEK PARCA KISLIK BAYAN  POLAR 2XL", code: "KIYAFETKIS-BYN.POLAR-2XL" },
    { barcode: "8520147033294", brand: "Nissan", name: "YEDEK PARCA KISLIK BAYAN  POLAR XL", code: "KIYAFETKIS-BYN.POLAR-XL" },
    { barcode: "8520147033300", brand: "Nissan", name: "YEDEK PARCA KISLIK BAYAN  POLAR L", code: "KIYAFETKIS-BYN.POLAR-L" },
    { barcode: "8520147033317", brand: "Nissan", name: "YEDEK PARCA KISLIK BAYAN  POLAR M", code: "KIYAFETKIS-BYN.POLAR-M" },
    { barcode: "8520147033324", brand: "Nissan", name: "YEDEK PARCA KISLIK BAYAN  POLAR S", code: "KIYAFETKIS-BYN.POLAR-S" },
    { barcode: "8520147033331", brand: "Nissan", name: "YEDEK PARCA KISLIK BAYAN  POLAR XS", code: "KIYAFETKIS-BYN.POLAR-XS" },
    { barcode: "8520147034048", brand: "Nissan", name: "YEDEK PARCA KISLIK SWEAT YP 4XL", code: "KIYAFETKIS-SWEAT-YP-4XL" },
    { barcode: "8520147034055", brand: "Nissan", name: "YEDEK PARCA KISLIK SWEAT YP 3XL", code: "KIYAFETKIS-SWEAT-YP-3XL" },
    { barcode: "8520147034062", brand: "Nissan", name: "YEDEK PARCA KISLIK SWEAT YP 2XL", code: "KIYAFETKIS-SWEAT-YP-2XL" },
    { barcode: "8520147034079", brand: "Nissan", name: "YEDEK PARCA KISLIK SWEAT YP XL", code: "KIYAFETKIS-SWEAT-YP-XL" },
    { barcode: "8520147034086", brand: "Nissan", name: "YEDEK PARCA KISLIK SWEAT YP L", code: "KIYAFETKIS-SWEAT-YP-L" },
    { barcode: "8520147034093", brand: "Nissan", name: "YEDEK PARCA KISLIK SWEAT YP M", code: "KIYAFETKIS-SWEAT-YP-M" },
    { barcode: "8520147034109", brand: "Nissan", name: "YEDEK PARCA KISLIK SWEAT YP S", code: "KIYAFETKIS-SWEAT-YP-S" },
    { barcode: "8520147034116", brand: "Nissan", name: "YEDEK PARCA KISLIK SWEAT YP XS", code: "KIYAFETKIS-SWEAT-YP-XS" },
    { barcode: "8520147034284", brand: "Nissan", name: "YEDEK PARCA KISLIK YELEK 4XL", code: "KIYAFETKIS-YELEK-4XL" },
    { barcode: "8520147034291", brand: "Nissan", name: "YEDEK PARCA KISLIK YELEK 3XL", code: "KIYAFETKIS-YELEK-3XL" },
    { barcode: "8520147034307", brand: "Nissan", name: "YEDEK PARCA KISLIK YELEK 2XL", code: "KIYAFETKIS-YELEK-2XL" },
    { barcode: "8520147034314", brand: "Nissan", name: "YEDEK PARCA KISLIK YELEK XL", code: "KIYAFETKIS-YELEK-XL" },
    { barcode: "8520147034321", brand: "Nissan", name: "YEDEK PARCA KISLIK YELEK L", code: "KIYAFETKIS-YELEK-L" },
    { barcode: "8520147034338", brand: "Nissan", name: "YEDEK PARCA KISLIK YELEK M", code: "KIYAFETKIS-YELEK-M" },
    { barcode: "8520147034345", brand: "Nissan", name: "YEDEK PARCA KISLIK YELEK S", code: "KIYAFETKIS-YELEK-S" },
    { barcode: "8520147034352", brand: "Nissan", name: "YEDEK PARCA KISLIK YELEK XS", code: "KIYAFETKIS-YELEK-XS" },

    // 6. SERVİS DANISMANI
    { barcode: "8520147032402", brand: "Nissan", name: "SERVİS DANISMANI KISLIK MONT 4XL", code: "KIYAFETKIS-MONT-4XL" },
    { barcode: "8520147032419", brand: "Nissan", name: "SERVİS DANISMANI KISLIK MONT 3XL", code: "KIYAFETKIS-MONT-3XL" },
    { barcode: "8520147032426", brand: "Nissan", name: "SERVİS DANISMANI KISLIK MONT 2XL", code: "KIYAFETKIS-MONT-2XL" },
    { barcode: "8520147032433", brand: "Nissan", name: "SERVİS DANISMANI KISLIK MONT XL", code: "KIYAFETKIS-MONT-XL" },
    { barcode: "8520147032440", brand: "Nissan", name: "SERVİS DANISMANI KISLIK MONT L", code: "KIYAFETKIS-MONT-L" },
    { barcode: "8520147032457", brand: "Nissan", name: "SERVİS DANISMANI KISLIK MONT M", code: "KIYAFETKIS-MONT-M" },
    { barcode: "8520147032464", brand: "Nissan", name: "SERVİS DANISMANI KISLIK MONT S", code: "KIYAFETKIS-MONT-S" },
    { barcode: "8520147032471", brand: "Nissan", name: "SERVİS DANISMANI KISLIK MONT XS", code: "KIYAFETKIS-MONT-XS" },

    // 7. SERVİS DANISMANI BAYAN
    { barcode: "8520147032488", brand: "Nissan", name: "SERVİS DANISMANI BAYAN KISLIK MONT 4XL", code: "KIYAFETKIS-MONT-4XL" },
    { barcode: "8520147032495", brand: "Nissan", name: "SERVİS DANISMANI BAYAN KISLIK MONT 3XL", code: "KIYAFETKIS-MONT-3XL" },
    { barcode: "8520147032501", brand: "Nissan", name: "SERVİS DANISMANI BAYAN KISLIK MONT 2XL", code: "KIYAFETKIS-MONT-2XL" },
    { barcode: "8520147032518", brand: "Nissan", name: "SERVİS DANISMANI BAYAN KISLIK MONT XL", code: "KIYAFETKIS-MONT-XL" },
    { barcode: "8520147032525", brand: "Nissan", name: "SERVİS DANISMANI BAYAN KISLIK MONT L", code: "KIYAFETKIS-MONT-L" },
    { barcode: "8520147032532", brand: "Nissan", name: "SERVİS DANISMANI BAYAN KISLIK MONT M", code: "KIYAFETKIS-MONT-M" },
    { barcode: "8520147032549", brand: "Nissan", name: "SERVİS DANISMANI BAYAN KISLIK MONT S", code: "KIYAFETKIS-MONT-S" },
    { barcode: "8520147032556", brand: "Nissan", name: "SERVİS DANISMANI BAYAN KISLIK MONT XS", code: "KIYAFETKIS-MONT-XS" },
    { barcode: "8520147032563", brand: "Nissan", name: "SERVİS DANISMANI BAYAN KISLIK MONT 4XL", code: "KIYAFETKIS-MONT-4XL" },
    { barcode: "8520147032570", brand: "Nissan", name: "SERVİS DANISMANI BAYAN KISLIK MONT 3XL", code: "KIYAFETKIS-MONT-3XL" },
    { barcode: "8520147032587", brand: "Nissan", name: "SERVİS DANISMANI BAYAN KISLIK MONT 2XL", code: "KIYAFETKIS-MONT-2XL" },
    { barcode: "8520147032594", brand: "Nissan", name: "SERVİS DANISMANI BAYAN KISLIK MONT XL", code: "KIYAFETKIS-MONT-XL" },
    { barcode: "8520147032600", brand: "Nissan", name: "SERVİS DANISMANI BAYAN KISLIK MONT L", code: "KIYAFETKIS-MONT-L" },
    { barcode: "8520147032617", brand: "Nissan", name: "SERVİS DANISMANI BAYAN KISLIK MONT M", code: "KIYAFETKIS-MONT-M" },
    { barcode: "8520147032624", brand: "Nissan", name: "SERVİS DANISMANI BAYAN KISLIK MONT S", code: "KIYAFETKIS-MONT-S" },
    { barcode: "8520147032631", brand: "Nissan", name: "SERVİS DANISMANI BAYAN KISLIK MONT XS", code: "KIYAFETKIS-MONT-XS" },

    // 8. VALE
    { barcode: "8520147032648", brand: "Nissan", name: "VALE KISLIK MONT VALE 4XL", code: "KIYAFETKIS-MONT VALE -4XL" },
    { barcode: "8520147032655", brand: "Nissan", name: "VALE KISLIK MONT VALE 3XL", code: "KIYAFETKIS-MONT VALE-3XL" },
    { barcode: "8520147032662", brand: "Nissan", name: "VALE KISLIK MONT VALE 2XL", code: "KIYAFETKIS-MONT VALE-2XL" },
    { barcode: "8520147032679", brand: "Nissan", name: "VALE KISLIK MONT VALE XL", code: "KIYAFETKIS-MONT VALE-XL" },
    { barcode: "8520147032686", brand: "Nissan", name: "VALE KISLIK MONT VALE L", code: "KIYAFETKIS-MONT VALE-L" },
    { barcode: "8520147032693", brand: "Nissan", name: "VALE KISLIK MONT VALE M", code: "KIYAFETKIS-MONT VALE-M" },
    { barcode: "8520147032709", brand: "Nissan", name: "VALE KISLIK MONT VALE S", code: "KIYAFETKIS-MONT VALE-S" },
    { barcode: "8520147032716", brand: "Nissan", name: "VALE KISLIK MONT VALE XS", code: "KIYAFETKIS-MONT VALE-XS" },
    { barcode: "8520147033041", brand: "Nissan", name: "VALE KISLIK PANTOLON VALE 4XL", code: "KIYAFETKIS-PANTOLON VALE-4XL" },
    { barcode: "8520147033058", brand: "Nissan", name: "VALE KISLIK PANTOLON VALE 3XL", code: "KIYAFETKIS-PANTOLON VALE-3XL" },
    { barcode: "8520147033065", brand: "Nissan", name: "VALE KISLIK PANTOLON VALE 2XL", code: "KIYAFETKIS-PANTOLON VALE-2XL" },
    { barcode: "8520147033072", brand: "Nissan", name: "VALE KISLIK PANTOLON VALE XL", code: "KIYAFETKIS-PANTOLON VALE-XL" },
    { barcode: "8520147033089", brand: "Nissan", name: "VALE KISLIK PANTOLON VALE L", code: "KIYAFETKIS-PANTOLON VALE-L" },
    { barcode: "8520147033096", brand: "Nissan", name: "VALE KISLIK PANTOLON VALE M", code: "KIYAFETKIS-PANTOLON VALE-M" },
    { barcode: "8520147033102", brand: "Nissan", name: "VALE KISLIK PANTOLON VALE S", code: "KIYAFETKIS-PANTOLON VALE-S" },
    { barcode: "8520147033119", brand: "Nissan", name: "VALE KISLIK PANTOLON VALE XS", code: "KIYAFETKIS-PANTOLON VALE-XS" },
    { barcode: "8520147033966", brand: "Nissan", name: "VALE KISLIK SWEAT VALE 3XL", code: "KIYAFETKIS-SWEAT-VALE-3XL" },
    { barcode: "8520147033973", brand: "Nissan", name: "VALE KISLIK SWEAT VALE 4XL", code: "KIYAFETKIS-SWEAT-VALE-4XL" },
    { barcode: "8520147033980", brand: "Nissan", name: "VALE KISLIK SWEAT VALE 2XL", code: "KIYAFETKIS-SWEAT-VALE-2XL" },
    { barcode: "8520147033997", brand: "Nissan", name: "VALE KISLIK SWEAT VALE L", code: "KIYAFETKIS-SWEAT-VALE-L" },
    { barcode: "8520147034000", brand: "Nissan", name: "VALE KISLIK SWEAT VALE M", code: "KIYAFETKIS-SWEAT-VALE-M" },
    { barcode: "8520147034017", brand: "Nissan", name: "VALE KISLIK SWEAT VALE S", code: "KIYAFETKIS-SWEAT-VALE-S" },
    { barcode: "8520147034024", brand: "Nissan", name: "VALE KISLIK SWEAT VALE XL", code: "KIYAFETKIS-SWEAT-VALE-XL" },
    { barcode: "8520147034031", brand: "Nissan", name: "VALE KISLIK SWEAT VALE XS", code: "KIYAFETKIS-SWEAT-VALE-XS" },

    // 9. SERVİS DANIŞMANI BAYAN
    { barcode: "8520147033201", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK  POLAR 4XL", code: "KIYAFETKIS-POLAR-4XL" },
    { barcode: "8520147033218", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK  POLAR 3XL", code: "KIYAFETKIS-POLAR-3XL" },
    { barcode: "8520147033225", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK  POLAR 2XL", code: "KIYAFETKIS-POLAR-2XL" },
    { barcode: "8520147033232", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK  POLAR XL", code: "KIYAFETKIS-POLAR-XL" },
    { barcode: "8520147033249", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK  POLAR L", code: "KIYAFETKIS-POLAR-L" },
    { barcode: "8520147033256", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK  POLAR M", code: "KIYAFETKIS-POLAR-M" },
    { barcode: "8520147033263", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK  POLAR S", code: "KIYAFETKIS-POLAR-S" },
    { barcode: "8520147033270", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK  POLAR XS", code: "KIYAFETKIS-POLAR-XS" },
    { barcode: "8520147033348", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK BAYAN  POLAR 2XL", code: "KIYAFETKIS-BYN.POLAR-2XL" },
    { barcode: "8520147033355", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK BAYAN  POLAR XL", code: "KIYAFETKIS-BYN.POLAR-XL" },
    { barcode: "8520147033362", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK BAYAN  POLAR L", code: "KIYAFETKIS-BYN.POLAR-L" },
    { barcode: "8520147033379", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK BAYAN  POLAR M", code: "KIYAFETKIS-BYN.POLAR-M" },
    { barcode: "8520147033386", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK BAYAN  POLAR S", code: "KIYAFETKIS-BYN.POLAR-S" },
    { barcode: "8520147033393", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK BAYAN  POLAR XS", code: "KIYAFETKIS-BYN.POLAR-XS" },
    { barcode: "8520147033881", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK SWEAT SRVDANBYN 4XL", code: "KIYAFETKIS-SWEAT-SRVDANBYN-4XL" },
    { barcode: "8520147033898", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK SWEAT SRVDANBYN 3XL", code: "KIYAFETKIS-SWEAT-SRVDANBYN-3XL" },
    { barcode: "8520147033904", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK SWEAT SRVDANBYN 2XL", code: "KIYAFETKIS-SWEAT-SRVDANBYN-2XL" },
    { barcode: "8520147033911", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK SWEAT SRVDANBYN XL", code: "KIYAFETKIS-SWEAT-SRVDANBYN-XL" },
    { barcode: "8520147033928", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK SWEAT SRVDANBYN L", code: "KIYAFETKIS-SWEAT-SRVDANBYN-L" },
    { barcode: "8520147033935", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK SWEAT SRVDANBYN M", code: "KIYAFETKIS-SWEAT-SRVDANBYN-M" },
    { barcode: "8520147033942", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK SWEAT SRVDANBYN S", code: "KIYAFETKIS-SWEAT-SRVDANBYN-S" },
    { barcode: "8520147033959", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK SWEAT SRVDANBYN XS", code: "KIYAFETKIS-SWEAT-SRVDANBYN-XS" },
    { barcode: "8520147034444", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK BAYAN YELEK 4XL", code: "KIYAFETKIS-BYN.YELEK-4XL" },
    { barcode: "8520147034451", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK BAYAN YELEK 3XL", code: "KIYAFETKIS-BYN.YELEK-3XL" },
    { barcode: "8520147034468", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK BAYAN YELEK 2XL", code: "KIYAFETKIS-BYN.YELEK-2XL" },
    { barcode: "8520147034475", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK BAYAN YELEK XL", code: "KIYAFETKIS-BYN.YELEK-XL" },
    { barcode: "8520147034482", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK BAYAN YELEK L", code: "KIYAFETKIS-BYN.YELEK-L" },
    { barcode: "8520147034499", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK BAYAN YELEK M", code: "KIYAFETKIS-BYN.YELEK-M" },
    { barcode: "8520147034505", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK BAYAN YELEK S", code: "KIYAFETKIS-BYN.YELEK-S" },
    { barcode: "8520147034512", brand: "Nissan", name: "SERVİS DANIŞMANI BAYAN KISLIK BAYAN YELEK XS", code: "KIYAFETKIS-BYN.YELEK-XS" },

    // 10. SERVİS DANIŞMANI
    { barcode: "8520147033805", brand: "Nissan", name: "SERVİS DANIŞMANI KISLIK SWEAT SRVDAN 4XL", code: "KIYAFETKIS-SWEAT-SRVDAN-4XL" },
    { barcode: "8520147033812", brand: "Nissan", name: "SERVİS DANIŞMANI KISLIK SWEAT SRVDAN 3XL", code: "KIYAFETKIS-SWEAT-SRVDAN-3XL" },
    { barcode: "8520147033829", brand: "Nissan", name: "SERVİS DANIŞMANI KISLIK SWEAT SRVDAN 2XL", code: "KIYAFETKIS-SWEAT-SRVDAN-2XL" },
    { barcode: "8520147033836", brand: "Nissan", name: "SERVİS DANIŞMANI KISLIK SWEAT SRVDAN XL", code: "KIYAFETKIS-SWEAT-SRVDAN-XL" },
    { barcode: "8520147033843", brand: "Nissan", name: "SERVİS DANIŞMANI KISLIK SWEAT SRVDAN L", code: "KIYAFETKIS-SWEAT-SRVDAN-L" },
    { barcode: "8520147033850", brand: "Nissan", name: "SERVİS DANIŞMANI KISLIK SWEAT SRVDAN M", code: "KIYAFETKIS-SWEAT-SRVDAN-M" },
    { barcode: "8520147033867", brand: "Nissan", name: "SERVİS DANIŞMANI KISLIK SWEAT SRVDAN S", code: "KIYAFETKIS-SWEAT-SRVDAN-S" },
    { barcode: "8520147033874", brand: "Nissan", name: "SERVİS DANIŞMANI KISLIK SWEAT SRVDAN XS", code: "KIYAFETKIS-SWEAT-SRVDAN-XS" },
    { barcode: "8520147034369", brand: "Nissan", name: "SERVİS DANIŞMANI KISLIK YELEK 4XL", code: "KIYAFETKIS-YELEK-4XL" },
    { barcode: "8520147034376", brand: "Nissan", name: "SERVİS DANIŞMANI KISLIK YELEK 3XL", code: "KIYAFETKIS-YELEK-3XL" },
    { barcode: "8520147034383", brand: "Nissan", name: "SERVİS DANIŞMANI KISLIK YELEK 2XL", code: "KIYAFETKIS-YELEK-2XL" },
    { barcode: "8520147034390", brand: "Nissan", name: "SERVİS DANIŞMANI KISLIK YELEK XL", code: "KIYAFETKIS-YELEK-XL" },
    { barcode: "8520147034406", brand: "Nissan", name: "SERVİS DANIŞMANI KISLIK YELEK L", code: "KIYAFETKIS-YELEK-L" },
    { barcode: "8520147034413", brand: "Nissan", name: "SERVİS DANIŞMANI KISLIK YELEK M", code: "KIYAFETKIS-YELEK-M" },
    { barcode: "8520147034420", brand: "Nissan", name: "SERVİS DANIŞMANI KISLIK YELEK S", code: "KIYAFETKIS-YELEK-S" },
    { barcode: "8520147034437", brand: "Nissan", name: "SERVİS DANIŞMANI KISLIK YELEK XS", code: "KIYAFETKIS-YELEK-XS" },

    // 11. SERVIS DANISMANI
    { barcode: "6001258147015", brand: "Nissan", name: "GOMLEK BEYAZ KADIN", code: "KIYAFETKIS-GOMLEK-SRVDANBYN-XS" },
    { barcode: "6001258147016", brand: "Nissan", name: "GOMLEK BEYAZ KADIN", code: "KIYAFETKIS-GOMLEK-SRVDANBYN-S" },
    { barcode: "6001258147017", brand: "Nissan", name: "GOMLEK BEYAZ KADIN", code: "KIYAFETKIS-GOMLEK-SRVDANBYN-M" },
    { barcode: "6001258147018", brand: "Nissan", name: "GOMLEK BEYAZ KADIN", code: "KIYAFETKIS-GOMLEK-SRVDANBYN-L" },
    { barcode: "6001258147019", brand: "Nissan", name: "GOMLEK BEYAZ KADIN", code: "KIYAFETKIS-GOMLEK-SRVDANBYN-XL" },
    { barcode: "6001258147020", brand: "Nissan", name: "GOMLEK BEYAZ KADIN", code: "KIYAFETKIS-GOMLEK-SRVDANBYN-2XL" },
    { barcode: "6001258147021", brand: "Nissan", name: "GOMLEK BEYAZ KADIN", code: "KIYAFETKIS-GOMLEK-SRVDANBYN-3XL" },
    { barcode: "6001258147022", brand: "Nissan", name: "GOMLEK BEYAZ ERKEK", code: "KIYAFETKIS-GOMLEK-SRVDAN-XS" },
    { barcode: "6001258147023", brand: "Nissan", name: "GOMLEK BEYAZ ERKEK", code: "KIYAFETKIS-GOMLEK-SRVDAN-S" },
    { barcode: "6001258147024", brand: "Nissan", name: "GOMLEK BEYAZ ERKEK", code: "KIYAFETKIS-GOMLEK-SRVDAN-M" },
    { barcode: "6001258147025", brand: "Nissan", name: "GOMLEK BEYAZ ERKEK", code: "KIYAFETKIS-GOMLEK-SRVDAN-L" },
    { barcode: "6001258147026", brand: "Nissan", name: "GOMLEK BEYAZ ERKEK", code: "KIYAFETKIS-GOMLEK-SRVDAN-XL" },
    { barcode: "6001258147027", brand: "Nissan", name: "GOMLEK BEYAZ ERKEK", code: "KIYAFETKIS-GOMLEK-SRVDAN-2XL" },
    { barcode: "6001258147028", brand: "Nissan", name: "GOMLEK BEYAZ ERKEK", code: "KIYAFETKIS-GOMLEK-SRVDAN-3XL" },
];


function deriveColor(name) {
    const s = String(name || '').toUpperCase();
    if (s.includes('BEYAZ')) return 'BEYAZ';
    if (s.includes('KIRMIZI') && s.includes('SİYAH')) return 'SİYAH / KIRMIZI';
    if (s.includes('KIRMIZI') && s.includes('FÜME')) return 'FÜME / KIRMIZI';
    if (s.includes('FÜME') && s.includes('SİYAH')) return 'FÜME / SİYAH';
    if (s.includes('FÜME')) return 'FÜME';
    if (s.includes('SİYAH')) return 'SİYAH';
    if (s.includes('GRİ')) return 'GRİ';
    if (s.includes('LACİVERT')) return 'LACİVERT';
    return 'STANDART';
}

function deriveMetadata(item) {
    const code = item.code;
    const name = item.name;

    const szMatch = (code + ' ' + name).match(/\b(XS|S|M|L|XL|2XL|3XL|4XL|5XL|6XL|36|38|40|42|44|46|48)\b/i);
    const size = szMatch ? szMatch[1].toUpperCase() : 'STANDART';

    let gender = 'UNISEX';
    if (name.includes('Kadın') || name.includes('KADIN') || name.includes('BAYAN') || code.includes('BYN')) gender = 'KADIN';
    else if (name.includes('Erkek') || name.includes('ERKEK') || code.includes('ERK')) gender = 'ERKEK';

    // Calculate EAN-13 check digit if barcode is 12 digits
    let barcode13 = String(item.barcode).trim();
    if (/^\d{12}$/.test(barcode13)) {
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            const digit = parseInt(barcode13[i], 10);
            sum += (i % 2 === 0) ? digit : digit * 3;
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        barcode13 = `${barcode13}${checkDigit}`;
    }

    return {
        sku: barcode13,
        product_name: name,
        color: deriveColor(name),
        size: size,
        clean_size: size,
        ean13: barcode13,
        barcode: barcode13,
        code39: item.code,
        brand: 'NISSAN',
        gender: gender,
        price: 650.00
    };
}

async function runImport() {
    console.log('🚀 Starting Nissan Kış 2026 Excel creation and master products synchronization...\n');

    // 1. Create Excel file (exact same format as NISSAN 2026 YAZ PARÇA KODLARI.xlsx)
    if (XLSX) {
        const excelRows = rawData.map(r => ({
            'BARKOD NUMARASI': r.barcode,
            '1- Firma Adı': r.brand,
            '2- Ürün Adı': r.name,
            '3- Ürün Kodu': r.code,
            'FORMATI': 'EAN 13'
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelRows);
        XLSX.utils.book_append_sheet(wb, ws, 'NISSAN KIŞ 2026');

        const excelPath = path.join(__dirname, '..', 'NISSAN 2026 KIŞ PARÇA KODLARI.xlsx');
        XLSX.writeFile(wb, excelPath);
        console.log(`✅ Excel file generated: ${excelPath}`);

        // Also copy to desktop if available
        const desktopPath = 'C:\\Users\\ctopuz\\Desktop\\NISSAN 2026 KIŞ PARÇA KODLARI.xlsx';
        try {
            XLSX.writeFile(wb, desktopPath);
            console.log(`✅ Excel copy created on Desktop: ${desktopPath}`);
        } catch (_) {}
    }

    // Ensure PostgreSQL columns exist
    try {
        await pool.query('ALTER TABLE master_products ADD COLUMN IF NOT EXISTS grup VARCHAR(100)');
        await pool.query('ALTER TABLE master_products ADD COLUMN IF NOT EXISTS brand VARCHAR(100)');
        await pool.query('ALTER TABLE master_products ADD COLUMN IF NOT EXISTS gender VARCHAR(50)');
        await pool.query('ALTER TABLE master_products ADD COLUMN IF NOT EXISTS code39 TEXT');
    } catch (e) {}

    // 2. Ingest into PostgreSQL master_products
    console.log('📦 2. Ingesting into PostgreSQL master_products...');
    let pgInserted = 0;
    let pgUpdated = 0;

    for (const item of rawData) {
        const meta = deriveMetadata(item);
        try {
            const checkRes = await pool.query('SELECT id FROM master_products WHERE sku = $1', [meta.sku]);
            if (checkRes.rows.length > 0) {
                await pool.query(`
                    UPDATE master_products SET
                        product_name = $2,
                        color = $3,
                        size = $4,
                        clean_size = $5,
                        ean13 = $6,
                        barcode = $7,
                        code39 = $8,
                        brand = $9,
                        gender = $10,
                        price = $11,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE sku = $1
                `, [
                    meta.sku, meta.product_name, meta.color, meta.size, meta.clean_size,
                    meta.ean13, meta.barcode, meta.code39, meta.brand, meta.gender, meta.price
                ]);
                pgUpdated++;
            } else {
                await pool.query(`
                    INSERT INTO master_products (
                        sku, product_name, color, size, clean_size, ean13, barcode, code39, brand, gender, price, created_at, updated_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                    )
                `, [
                    meta.sku, meta.product_name, meta.color, meta.size, meta.clean_size,
                    meta.ean13, meta.barcode, meta.code39, meta.brand, meta.gender, meta.price
                ]);
                pgInserted++;
            }
        } catch (err) {
            console.error(`❌ Error importing SKU ${meta.sku} to PG:`, err.message);
        }
    }

    console.log(`   ✅ PG master_products: ${pgInserted} new inserts, ${pgUpdated} updates.`);

    // 3. Ingest into MSSQL [SIPARIS].[dbo].[MasterUrunler]
    console.log('📦 3. Ingesting into MSSQL [SIPARIS].[dbo].[MasterUrunler]...');
    try {
        let mssqlSql = `
        USE [SIPARIS];
        SET NOCOUNT ON;
        `;

        let chunkCount = 0;
        for (const item of rawData) {
            const meta = deriveMetadata(item);
            mssqlSql += `
            IF EXISTS (SELECT 1 FROM [MasterUrunler] WHERE [ParcaNo] = ${esc(meta.sku, 100)})
                UPDATE [MasterUrunler] SET
                    [UrunAdi] = ${esc(meta.product_name, 255)},
                    [Renk] = ${esc(meta.color, 100)},
                    [Beden] = ${esc(meta.size, 50)},
                    [CleanBeden] = ${esc(meta.clean_size, 50)},
                    [Barkod] = ${esc(meta.barcode, 100)},
                    [Ean13] = ${esc(meta.ean13, 50)},
                    [Code39] = ${esc(meta.code39, 100)},
                    [Marka] = N'NISSAN',
                    [Grup] = N'KIŞ',
                    [Cinsiyet] = ${esc(meta.gender, 50)},
                    [Fiyat] = ${meta.price},
                    [UpdatedAt] = GETDATE()
                WHERE [ParcaNo] = ${esc(meta.sku, 100)};
            ELSE
                INSERT INTO [MasterUrunler] (
                    [ParcaNo], [UrunAdi], [Renk], [Beden], [CleanBeden],
                    [Barkod], [Ean13], [Code39], [Marka], [Grup], [Cinsiyet], [Fiyat],
                    [CreatedAt], [UpdatedAt]
                ) VALUES (
                    ${esc(meta.sku, 100)}, ${esc(meta.product_name, 255)}, ${esc(meta.color, 100)},
                    ${esc(meta.size, 50)}, ${esc(meta.clean_size, 50)}, ${esc(meta.barcode, 100)},
                    ${esc(meta.ean13, 50)}, ${esc(meta.code39, 100)}, N'NISSAN', N'KIŞ',
                    ${esc(meta.gender, 50)}, ${meta.price}, GETDATE(), GETDATE()
                );
            `;
            chunkCount++;
            if (chunkCount >= 100) {
                runSqlcmd(mssqlSql);
                mssqlSql = `USE [SIPARIS]; SET NOCOUNT ON; `;
                chunkCount = 0;
            }
        }
        if (chunkCount > 0) {
            runSqlcmd(mssqlSql);
        }
        console.log(`   ✅ MSSQL MasterUrunler synchronized with ${rawData.length} items.`);
    } catch (err) {
        console.error('❌ MSSQL sync error:', err.message);
    }

    // 4. Update MSSQL Siparisler.ParcaNo and PG orders for Nissan
    console.log('🔄 4. Updating Nissan orders with official 13-digit ParcaNo...');
    try {
        const updateSql = `
        USE [SIPARIS];
        SET NOCOUNT ON;

        -- Match Nissan orders by MasterUrunler Barkod/ParcaNo
        UPDATE s
        SET s.[ParcaNo] = m.[ParcaNo]
        FROM [dbo].[Siparisler] s
        INNER JOIN [dbo].[MasterUrunler] m
            ON m.[Marka] = N'NISSAN'
            AND (
                s.[Barkod] = m.[Barkod]
                OR s.[Barkod] = m.[ParcaNo]
                OR s.[ParcaNo] = m.[Barkod]
            )
        WHERE s.[ParcaNo] IS NULL OR s.[ParcaNo] <> m.[ParcaNo];

        SELECT @@ROWCOUNT AS UpdatedCount;
        `;
        runSqlcmd(updateSql);
        console.log('   ✅ MSSQL Siparisler updated successfully.');
    } catch (err) {
        console.error('❌ Siparisler update error:', err.message);
    }

    console.log(`\n🎉 Successfully processed ${rawData.length} NISSAN 2026 KIŞ items!\n`);
    await pool.end();
}

runImport().catch(console.error);
