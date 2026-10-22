const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vog_db'
});

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

  // Special cases like PVWK100100481 (Kadın ayakkabı 41 beden veya 38 beden)
  const endMatch = raw.match(/(\d{2,3})$/);
  if (endMatch) {
    const val = endMatch[1];
    if (val.length === 3 && val.endsWith('1')) return '41';
    if (val.length === 3) return val.slice(1);
    return val;
  }

  return 'STD';
}

async function main() {
  try {
    const res = await pool.query("SELECT DISTINCT shoe_size FROM personnel WHERE shoe_size IS NOT NULL ORDER BY shoe_size");
    console.log('=== TEST ALL EXTRACTED SHOE SIZES ===');
    for (const r of res.rows) {
      const code = r.shoe_size;
      const clean = extractCleanShoeSize(code);
      console.log(`${code.padEnd(20)} => Beden: ${clean}`);
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

main();
