const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function queryMssql(sqlText) {
  const tmpSql = path.join(__dirname, 'tmp_vw_q.sql');
  const tmpOut = path.join(__dirname, 'tmp_vw_out.txt');
  fs.writeFileSync(tmpSql, `SET NOCOUNT ON;\n${sqlText}`, 'utf8');
  try {
    execSync(`sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -d SIPARIS -f 65001 -s "|" -W -i "${tmpSql}" -o "${tmpOut}"`, { stdio: 'pipe' });
    if (fs.existsSync(tmpOut)) {
      const content = fs.readFileSync(tmpOut, 'utf8').trim();
      const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('--'));
      if (lines.length < 2) return [];
      const headers = lines[0].split('|');
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split('|');
        const obj = {};
        headers.forEach((h, idx) => {
          obj[h] = parts[idx] || '';
        });
        rows.push(obj);
      }
      return rows;
    }
  } catch(e) {
    console.error('MSSQL Error:', e.message);
  } finally {
    if (fs.existsSync(tmpSql)) fs.unlinkSync(tmpSql);
    if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
  }
  return [];
}

const shoesMssql = queryMssql(`
  SELECT ParcaNo, UrunAdi, Beden, CleanBeden, Barkod, Ean13, Code39, Cinsiyet, Marka
  FROM MasterUrunler 
  WHERE ParcaNo LIKE 'PVWB260011%' 
     OR ParcaNo LIKE 'PVWB260019%' 
     OR ParcaNo LIKE 'PVWB260010%' 
     OR ParcaNo LIKE 'PVWK100100%'
     OR ParcaNo LIKE 'PVWK200106%'
     OR ParcaNo LIKE 'PVWB260018%'
`);
console.log('=== MSSQL SHOE CODES (count: ' + shoesMssql.length + ') ===');
console.log(JSON.stringify(shoesMssql, null, 2));

// Also let's check all MasterUrunler with Mont, Yelek, Gomlek, Pantolon for VW
const vwAll = queryMssql(`
  SELECT ParcaNo, UrunAdi, Beden, CleanBeden, Barkod, Ean13, Code39, Cinsiyet
  FROM MasterUrunler
  WHERE Marka = 'VOLKSWAGEN' AND (UrunAdi LIKE '%MONT%' OR UrunAdi LIKE '%YELEK%' OR UrunAdi LIKE '%GOMLEK%' OR UrunAdi LIKE '%PANTOLON%')
`);
console.log('=== MSSQL VW CLOTHING (count: ' + vwAll.length + ') ===');
console.log(JSON.stringify(vwAll.slice(0, 30), null, 2));
