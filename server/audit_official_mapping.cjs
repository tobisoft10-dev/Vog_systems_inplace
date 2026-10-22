const { execSync } = require('child_process');
const fs = require('fs');

function q(sql) {
  const tmp = 'server/tmp_audit_mapping.json';
  const cleanSql = sql.replace(/\r?\n/g, ' ');
  execSync(`sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -d SIPARIS -f 65001 -w 65535 -y 0 -o "${tmp}" -Q "SET NOCOUNT ON; ${cleanSql} FOR JSON PATH"`, { stdio: 'pipe' });
  const raw = fs.readFileSync(tmp, 'utf8').trim();
  fs.unlinkSync(tmp);
  const sanitized = raw.replace(/[\u0000-\u001F]+/g, (m) => (m === '\r' || m === '\n' || m === '\t') ? ' ' : '');
  return JSON.parse(sanitized);
}

function resolveOfficialParcaNo(order) {
  const model = (order.Model || '').toUpperCase();
  const notText = (order.Not || '').toUpperCase();
  const detay5 = (order.Detay5 || '').toUpperCase();
  const id = order.Id;

  // Specific high priority overrides based on exact order notes/types
  // 1. Gömlek (Servis Danışman & MİS / Hasar Gömlek)
  if (model.includes('GÖMLEK') || model.includes('GOMLEK')) {
    if (model.includes('201') || model.includes('2018') || model.includes('2017') || model.includes('2016')) {
      // old historical orders
      return 'ERKEK: PSKD100025 - KADIN: PSKD100026';
    }
    return 'ERKEK: PSKD100025 - KADIN: PSKD100026';
  }

  // 2. Polar (Siyah Polar)
  if (model.includes('POLAR') && !model.includes('YELEK')) {
    return 'ERKEK: PSKD100041 - KADIN: PSKD100042';
  }

  // 3. Mont (Softshell Mont)
  if (model.includes('MONT') || model.includes('SOFT SHELL MONT') || model.includes('SOFTSHELL MONT')) {
    if (model.includes('LOJİSTİK') || model.includes('LOJISTIK')) {
      return `PSKODA${id}`; // Clean without '0'
    }
    if (model.includes('VALE')) {
      return 'PSKD200040';
    }
    return 'ERKEK: PSKD100050 - KADIN: PSKD100051';
  }

  // 4. Polo T-shirt: Check role
  if (model.includes('POLO') || model.includes('T-SHIRT') || model.includes('TSHIRT') || model.includes('POLOSHIRT')) {
    if (model.includes('İKRAM') || model.includes('IKRAM')) {
      if (model.includes('KADIN') || model.includes('BAYAN')) return 'PSKD200039';
      if (model.includes('ERKEK') || model.includes('BAY')) return 'PSKD200038';
      return 'ERKEK: PSKD200038 - KADIN: PSKD200039';
    }
    if (model.includes('YEDEK PARÇA') || model.includes('YEDEK PARCA') || model.includes('FÜME MELANJ')) {
      return 'PSKD200034';
    }
    if (model.includes('FORMEN') || model.includes('GRİ')) {
      return 'PSKD200035';
    }
    if (model.includes('TEKNİSYEN') || model.includes('TEKNISYEN') || model.includes('KOYU YEŞİL')) {
      return 'PSKD200036';
    }
    if (model.includes('DANIŞMAN') || model.includes('DANISMAN') || model.includes('HASAR') || model.includes('GARANTİ') || model.includes('MİS') || model.includes('AÇIK YEŞİL')) {
      return 'ERKEK: PSKD200032 - KADIN: PSKD200033';
    }
    if (model.includes('OVERSIZE')) {
      return 'PSKODA16842';
    }
    return 'ERKEK: PSKD200032 - KADIN: PSKD200033';
  }

  // 5. Sweatshirt: Check role
  if (model.includes('SWEAT') || model.includes('SWEATSHIRT')) {
    if (model.includes('TEKNİSYEN') || model.includes('TEKNISYEN') || model.includes('YEŞİL')) {
      return 'PSKD100056';
    }
    if (model.includes('FORMEN') || model.includes('SİYAH')) {
      return 'PSKD100055';
    }
    if (model.includes('YEDEK PARÇA') || model.includes('YEDEK PARCA')) {
      return 'PSKD100054';
    }
    return 'PSKD100056';
  }

  // 6. Yelek: Check role
  if (model.includes('YELEK')) {
    if (model.includes('DANIŞMAN') || model.includes('DANISMAN') || model.includes('MEGANE')) {
      return 'ERKEK: PSKD100052 - KADIN: PSKD100053';
    }
    if (model.includes('YOL YARDIM')) {
      return 'PSKD200037';
    }
    if (model.includes('TEKNİSYEN') || model.includes('FORMEN') || model.includes('YEDEK PARÇA')) {
      return 'PSKD100036';
    }
    return 'PSKD100036';
  }

  // 7. Pantolon: Check role & season
  if (model.includes('PANTOLON')) {
    if (model.includes('TEKNİSYEN') || model.includes('VOLVO')) {
      if (model.includes('YAZ') || model.includes('YAZLIK')) {
        return 'PSKD200019';
      }
      return 'PSKD100028';
    }
    if (model.includes('DANIŞMAN') || model.includes('DANISMAN') || model.includes('HASAR') || model.includes('GARANTİ') || model.includes('FORMEN') || model.includes('MİS')) {
      if (model.includes('KIŞ') || model.includes('KIS') || model.includes('KIŞLIK')) {
        return 'PSKD100019';
      }
      return 'PSKD200010';
    }
    return 'PSKD100028';
  }

  // 8. Önlük
  if (model.includes('ÖNLÜK') || model.includes('ONLUK')) {
    return 'PSKD200038STD';
  }

  // 9. Aksesuarlar (Kılıf, Şapka vs.)
  if (model.includes('KILIF') || model.includes('ŞAPKA') || model.includes('SAPKA')) {
    return `PSKODA${id}`;
  }

  return null;
}

const orders = q(`
  SELECT s.Id, s.Model, s.ParcaNo, s.Detay5, s.[Not]
  FROM Siparisler s
  WHERE s.Id >= 10000 
    AND (
      s.Model LIKE '%SKODA%' 
      OR s.ParcaNo LIKE '%SKD%' 
      OR s.ParcaNo LIKE '%SKODA%'
      OR s.Detay5 LIKE '%SKD%'
      OR s.Detay5 LIKE '%SKODA%'
      OR s.[Not] LIKE '%PSKD%'
      OR s.[Not] LIKE '%PSKODA%'
    )
  ORDER BY s.Id DESC
`);

let diffCount = 0;
console.log(`Analyzing ${orders.length} orders >= 10000...`);
orders.forEach(o => {
  const target = resolveOfficialParcaNo(o);
  const current = (o.ParcaNo || '').trim();
  if (target && target !== current) {
    diffCount++;
    console.log(`[ID ${o.Id}]`);
    console.log(`  Model:   ${o.Model}`);
    console.log(`  Mevcut:  "${current}"`);
    console.log(`  HEDEF:   "${target}"`);
    console.log('--------------------------------------------------');
  }
});
console.log(`Toplam Güncellenecek Sipariş Sayısı: ${diffCount}`);
