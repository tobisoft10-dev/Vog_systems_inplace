const path = require('path');
const fs = require('fs');

let ExcelJS = null;
try {
  ExcelJS = require('exceljs');
} catch (e) {
  try {
    ExcelJS = require(path.join(__dirname, 'node_modules', 'exceljs'));
  } catch (err) {
    ExcelJS = null;
  }
}

let XLSX = null;
try {
  XLSX = require('xlsx');
} catch (e) {
  try {
    XLSX = require(path.join(__dirname, 'node_modules', 'xlsx'));
  } catch (err) {
    XLSX = null;
  }
}

function normalizeKey(val) {
  if (!val) return '';
  return val.toString().replace(/İ/g, 'I').replace(/i/g, 'I').toUpperCase().trim();
}

/**
 * SEAT 2026 Yaz Raporu Birebir Şablon ve Biçimlendirme Üreticisi
 */
async function generateSeatReport(inputFile, outputFile) {
  const workspaceDir = path.join(__dirname, '..');
  const input = inputFile || path.join(workspaceDir, 'SEAT 2026 Yaz Kişi Listesi.xlsx');
  const output = outputFile || path.join(workspaceDir, 'SEAT_2026_Yaz_Rapor_Generated.xlsx');
  const template = path.join(workspaceDir, 'SEAT 2026 Yaz Rapor.xlsx');

  if (!fs.existsSync(input)) {
    throw new Error(`Girdi dosyası bulunamadı: ${input}`);
  }

  // 1. ExcelJS yüklüyse şablon ve biçim korumalı ExcelJS motorunu çalıştır
  if (ExcelJS) {
    try {
      return await generateSeatReportExcelJS(input, output, template);
    } catch (err) {
      console.error('⚠️ ExcelJS çalıştırma hatası, JS motoruna devrediliyor:', err.message);
    }
  }

  // 2. ExcelJS yoksa veya hata verirse XLSX JS motoruna devret
  console.log('⚠️ ExcelJS bulunamadı, XLSX JS motoru ile 12 sayfa üretiliyor...');
  return generateSeatReportJS(input, output);
}

async function generateSeatReportExcelJS(input, output, template) {
  console.log(`📖 ExcelJS ile Şablon Okunuyor: ${template}`);
  if (!fs.existsSync(template)) {
    throw new Error(`Şablon dosyası bulunamadı: ${template}`);
  }

  const wbInput = new ExcelJS.Workbook();
  await wbInput.xlsx.readFile(input);

  const wbOut = new ExcelJS.Workbook();
  await wbOut.xlsx.readFile(template);

  // Excel açıldığında 1. sayfayı (BAŞLIK) göster ve sekme çubuğunu en sola çek
  wbOut.views = [
    {
      x: 0,
      y: 0,
      width: 29040,
      height: 15840,
      visibility: 'visible',
      activeTab: 0,
      firstSheet: 0
    }
  ];

  // SKU Haritası
  const wsParca = wbInput.getWorksheet('PARÇA NO DETAY');
  const skuMap = {};
  if (wsParca) {
    wsParca.eachRow((row) => {
      const v0 = row.getCell(1).value;
      const v1 = row.getCell(2).value;
      if (v0 && v1 && v1.toString().startsWith('PSEAT')) {
        skuMap[normalizeKey(v0)] = v1.toString().trim();
      }
    });
  }

  const roleSheets = [
    { sheet: 'Diğer Servis Danışmanı', roleName: 'Diğer Servis Danışman' },
    { sheet: 'Formen', roleName: 'Formen' },
    { sheet: 'GarantiDispozisyon', roleName: 'Garanti/Dispozisyon' },
    { sheet: 'Kaporta Teknisyen', roleName: 'Kapota Teknisyen ' },
    { sheet: 'Master Teknisyen', roleName: 'Master Teknisyen' },
    { sheet: 'Mekanik Teknisyen', roleName: 'Mekanik Teknisyen' },
    { sheet: 'Servis Danışmanı', roleName: 'Servis Danışmanı' }
  ];

  const allBolums = [
    'Diğer Servis Danışman',
    'Formen',
    'Garanti/Dispozisyon',
    'Kapota Teknisyen ',
    'Master Teknisyen',
    'Mekanik Teknisyen',
    'Servis Danışmanı'
  ];

  const allProducts = [
    'Formen Polo Yaka T_Shirt',
    'Master Teknisyen Polo Yaka T_Shirt',
    'Servis Danışman Pantolon Bay',
    'Servis Danışman Polo Yaka T_Shİrt Bay',
    'Servis Danışman Polo Yaka T_Shİrt Bay Kırmızı',
    'Teknisyen Bisiklet Yaka T_Shirt',
    'Teknisyen Pantolon',
    'Teknisyen Polo Yaka T_Shİrt'
  ];

  const detayRecords = [];
  const ozetRecords = [];
  const koliRecords = [];

  const bolumTotals = {};
  const bolumUrunMatrix = {};
  const dealerAdetMatrix = {};
  const dealerKoliMatrix = {};
  const dealerSequence = {};

  allBolums.forEach(b => {
    bolumTotals[b] = 0;
    bolumUrunMatrix[b] = {};
    allProducts.forEach(p => bolumUrunMatrix[b][p] = 0);
  });

  let grandTotalQty = 0;

  roleSheets.forEach(({ sheet, roleName }) => {
    const wsRole = wbInput.getWorksheet(sheet);
    if (!wsRole) return;

    let headers = [];
    wsRole.getRow(1).eachCell((cell, colNum) => {
      headers[colNum] = cell.value ? cell.value.toString().trim() : '';
    });

    wsRole.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const getVal = (colName) => {
        const colIdx = headers.findIndex(h => h && h.replace(/\s+/g, ' ').trim() === colName.replace(/\s+/g, ' ').trim());
        if (colIdx > 0) return row.getCell(colIdx).value;
        return '';
      };

      const dealer = (getVal('Yetkili Satıcı Kısa Adı') || '').toString().trim().replace(' - ', ' ');
      const rawName = (getVal('Personel Adı') || '').toString();
      const cleanName = rawName.trim();
      const gender = (getVal('Cinsiyet') || '').toString().trim();
      const topSize = (getVal('Üst Beden') || getVal('Üst\r\nBeden') || '').toString().trim();
      const bottomSize = (getVal('Alt Beden') || getVal('Alt\r\nBeden') || '').toString().trim();

      if (!cleanName || !dealer) return;

      const personKey = `${rawName}-${roleName}`;
      let totalPersonItems = 0;
      const personItems = [];

      if (roleName === 'Servis Danışmanı') {
        const isBayan = gender.toUpperCase().includes('BAYAN') || gender.toUpperCase().includes('KADIN');
        const p1Model = `Servis Danışman Pantolon ${isBayan ? 'Bayan' : 'Bay'} - ${bottomSize}`;
        personItems.push({ prodName: 'Servis Danışman Pantolon Bay', labelDesc: 'Pantolon 2 Adet', sku: skuMap[normalizeKey(p1Model)] || '', qty: 2 });

        const p2Model = `SERVİS DANIŞMAN POLO YAKA T-SHIRT ${isBayan ? 'BAYAN' : 'BAY'} - ${topSize}`;
        personItems.push({ prodName: 'Servis Danışman Polo Yaka T_Shİrt Bay', labelDesc: 'T_Shirt (1) 2 Adet', sku: skuMap[normalizeKey(p2Model)] || '', qty: 2 });

        const p3Model = `SERVİS DANIŞMAN POLO YAKA T-SHIRT ${isBayan ? 'BAYAN' : 'BAY'} KIRMIZI - ${topSize}`;
        personItems.push({ prodName: 'Servis Danışman Polo Yaka T_Shİrt Bay Kırmızı', labelDesc: 'T_Shirt (2) 2 Adet', sku: skuMap[normalizeKey(p3Model)] || '', qty: 2 });

      } else if (roleName === 'Diğer Servis Danışman') {
        const isBayan = gender.toUpperCase().includes('BAYAN') || gender.toUpperCase().includes('KADIN');
        const p1Model = `SERVİS DANIŞMAN PANTOLON ${isBayan ? 'BAYAN' : 'BAY'} - ${bottomSize}`;
        personItems.push({ prodName: 'Servis Danışman Pantolon Bay', labelDesc: 'Pantolon 1 Adet', sku: skuMap[normalizeKey(p1Model)] || '', qty: 1 });

        const p2Model = `SERVİS DANIŞMAN POLO YAKA T-SHIRT ${isBayan ? 'BAYAN' : 'BAY'} - ${topSize}`;
        personItems.push({ prodName: 'Servis Danışman Polo Yaka T_Shİrt Bay', labelDesc: 'T_Shirt (1) 1 Adet', sku: skuMap[normalizeKey(p2Model)] || '', qty: 1 });

        const p3Model = `SERVİS DANIŞMAN POLO YAKA T-SHIRT ${isBayan ? 'BAYAN' : 'BAY'} KIRMIZI - ${topSize}`;
        personItems.push({ prodName: 'Servis Danışman Polo Yaka T_Shİrt Bay Kırmızı', labelDesc: 'T_Shirt (2) 2 Adet', sku: skuMap[normalizeKey(p3Model)] || '', qty: 2 });

      } else if (roleName === 'Formen') {
        const p1Model = `FORMEN POLO YAKA T-SHIRT - ${topSize}`;
        personItems.push({ prodName: 'Formen Polo Yaka T_Shirt', labelDesc: 'T_Shirt (1) 4 Adet', sku: skuMap[normalizeKey(p1Model)] || '', qty: 4 });

        const p2Model = `TEKNİSYEN PANTOLON - ${bottomSize}`;
        personItems.push({ prodName: 'Teknisyen Pantolon', labelDesc: 'Pantolon 2 Adet', sku: skuMap[normalizeKey(p2Model)] || '', qty: 2 });

      } else if (roleName === 'Mekanik Teknisyen') {
        const p1Model = `TEKNİSYEN PANTOLON - ${bottomSize}`;
        personItems.push({ prodName: 'Teknisyen Pantolon', labelDesc: 'Pantolon 2 Adet', sku: skuMap[normalizeKey(p1Model)] || '', qty: 2 });

        const p2Model = `TEKNİSYEN POLO YAKA T-SHIRT - ${topSize}`;
        personItems.push({ prodName: 'Teknisyen Polo Yaka T_Shİrt', labelDesc: 'T_Shirt (1) 4 Adet', sku: skuMap[normalizeKey(p2Model)] || '', qty: 4 });

      } else if (roleName.includes('Kapota') || roleName.includes('Kaporta')) {
        const p1Model = `TEKNİSYEN PANTOLON - ${bottomSize}`;
        personItems.push({ prodName: 'Teknisyen Pantolon', labelDesc: 'Pantolon 2 Adet', sku: skuMap[normalizeKey(p1Model)] || '', qty: 2 });

        const p2Model = `TEKNİSYEN BİSİKLET YAKA T-SHIRT - ${topSize}`;
        personItems.push({ prodName: 'Teknisyen Bisiklet Yaka T_Shirt', labelDesc: 'T_Shirt (1) 4 Adet', sku: skuMap[normalizeKey(p2Model)] || '', qty: 4 });

      } else if (roleName === 'Master Teknisyen') {
        const p1Model = `MASTER TEKNİSYEN POLO YAKA T-SHIRT - ${topSize}`;
        personItems.push({ prodName: 'Master Teknisyen Polo Yaka T_Shirt', labelDesc: 'T_Shirt (1) 4 Adet', sku: skuMap[normalizeKey(p1Model)] || '', qty: 4 });

        const p2Model = `TEKNİSYEN PANTOLON - ${bottomSize}`;
        personItems.push({ prodName: 'Teknisyen Pantolon', labelDesc: 'Pantolon 2 Adet', sku: skuMap[normalizeKey(p2Model)] || '', qty: 2 });

      } else if (roleName === 'Garanti/Dispozisyon') {
        const p1Model = `TEKNİSYEN POLO YAKA T-SHIRT - ${topSize}`;
        personItems.push({ prodName: 'Teknisyen Polo Yaka T_Shİrt', labelDesc: 'T_Shirt (1) 3 Adet', sku: skuMap[normalizeKey(p1Model)] || '', qty: 3 });
      }

      if (!dealerAdetMatrix[dealer]) {
        dealerAdetMatrix[dealer] = {};
        dealerKoliMatrix[dealer] = {};
        allBolums.forEach(b => {
          dealerAdetMatrix[dealer][b] = 0;
          dealerKoliMatrix[dealer][b] = 0;
        });
      }

      dealerKoliMatrix[dealer][roleName] = (dealerKoliMatrix[dealer][roleName] || 0) + 1;

      personItems.forEach(item => {
        detayRecords.push([dealer, roleName, personKey, item.sku, item.prodName, item.qty]);
        totalPersonItems += item.qty;
        grandTotalQty += item.qty;

        bolumTotals[roleName] = (bolumTotals[roleName] || 0) + item.qty;
        bolumUrunMatrix[roleName][item.prodName] = (bolumUrunMatrix[roleName][item.prodName] || 0) + item.qty;
        dealerAdetMatrix[dealer][roleName] = (dealerAdetMatrix[dealer][roleName] || 0) + item.qty;
      });

      ozetRecords.push([roleName, dealer, personKey, totalPersonItems]);

      dealerSequence[dealer] = (dealerSequence[dealer] || 0) + 1;
      const seq = dealerSequence[dealer];

      let u1 = ' ', u2 = ' ', u3 = ' ';
      let p1 = null, p2 = null, p3 = null;

      if (roleName === 'Garanti/Dispozisyon') {
        u2 = personItems[0] ? personItems[0].labelDesc : ' ';
        p2 = personItems[0] ? personItems[0].sku : '';
      } else {
        u1 = personItems[0] ? personItems[0].labelDesc : ' ';
        u2 = personItems[1] ? personItems[1].labelDesc : ' ';
        u3 = personItems[2] ? personItems[2].labelDesc : ' ';
        p1 = personItems[0] ? personItems[0].sku : '';
        p2 = personItems[1] ? personItems[1].sku : '';
        p3 = personItems[2] ? personItems[2].sku : '';
      }

      koliRecords.push([seq, dealer, cleanName, roleName, gender, u1, u2, u3, p1, p2, p3]);
    });
  });

  // Koli Etiketi
  const wsKoli = wbOut.getWorksheet('Koli Etiketi');
  if (wsKoli) {
    while (wsKoli.rowCount > 1) {
      wsKoli.spliceRows(2, 1);
    }
    koliRecords.forEach(rdata => {
      const row = wsKoli.addRow(rdata);
      row.eachCell(cell => {
        cell.font = { name: 'Calibri', size: 10 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
        };
      });
    });
  }

  // Detay
  const wsDetay = wbOut.getWorksheet('Detay');
  if (wsDetay) {
    while (wsDetay.rowCount > 2) {
      wsDetay.spliceRows(3, 1);
    }
    detayRecords.forEach(rdata => wsDetay.addRow(rdata));
    const totDetayRow = wsDetay.addRow(['Genel Toplam', null, null, null, null, grandTotalQty]);
    totDetayRow.getCell(1).font = { name: 'Arial', bold: true };
    totDetayRow.getCell(6).font = { name: 'Arial', bold: true };
  }

  // Özet
  const wsOzet = wbOut.getWorksheet('Özet');
  if (wsOzet) {
    while (wsOzet.rowCount > 2) {
      wsOzet.spliceRows(3, 1);
    }
    ozetRecords.forEach(rdata => wsOzet.addRow(rdata));
    const totOzetRow = wsOzet.addRow(['Genel Toplam', null, null, grandTotalQty]);
    totOzetRow.getCell(1).font = { name: 'Arial', bold: true };
    totOzetRow.getCell(4).font = { name: 'Arial', bold: true };
  }

  // Bölüm İcmal
  const wsBicmal = wbOut.getWorksheet('Bölüm İcmal');
  if (wsBicmal) {
    while (wsBicmal.rowCount > 2) {
      wsBicmal.spliceRows(3, 1);
    }
    allBolums.forEach(b => wsBicmal.addRow([b, bolumTotals[b]]));
    const totBicmal = wsBicmal.addRow(['Genel Toplam', grandTotalQty]);
    totBicmal.getCell(1).font = { name: 'Arial', bold: true };
    totBicmal.getCell(2).font = { name: 'Arial', bold: true };
  }

  // Bölüm Ürün İcmal
  const wsBurun = wbOut.getWorksheet('Bölüm Ürün İcmal');
  if (wsBurun) {
    while (wsBurun.rowCount > 2) {
      wsBurun.spliceRows(3, 1);
    }
    const prodColumnTotals = {};
    allProducts.forEach(p => prodColumnTotals[p] = 0);

    allBolums.forEach(b => {
      let rSum = 0;
      const r = [b];
      allProducts.forEach(p => {
        const val = bolumUrunMatrix[b][p] || null;
        r.push(val);
        if (val) {
          rSum += val;
          prodColumnTotals[p] += val;
        }
      });
      r.push(rSum);
      wsBurun.addRow(r);
    });
    const prodTotRow = ['Genel Toplam'];
    allProducts.forEach(p => prodTotRow.push(prodColumnTotals[p]));
    prodTotRow.push(grandTotalQty);
    const rProdTot = wsBurun.addRow(prodTotRow);
    rProdTot.eachCell(c => c.font = { name: 'Arial', bold: true });
  }

  // Yetkili Servis Adet İcmal
  const wsDealerAdet = wbOut.getWorksheet('Yetkili Servis Adet İcmal');
  if (wsDealerAdet) {
    while (wsDealerAdet.rowCount > 2) {
      wsDealerAdet.spliceRows(3, 1);
    }
    const sortedDealers = Object.keys(dealerAdetMatrix).sort();
    const bolumAdetColTotals = {};
    allBolums.forEach(b => bolumAdetColTotals[b] = 0);

    sortedDealers.forEach(d => {
      let dSum = 0;
      const r = [d];
      allBolums.forEach(b => {
        const val = dealerAdetMatrix[d][b] || null;
        r.push(val);
        if (val) {
          dSum += val;
          bolumAdetColTotals[b] += val;
        }
      });
      r.push(dSum);
      wsDealerAdet.addRow(r);
    });
    const dAdetTotRow = ['Genel Toplam'];
    allBolums.forEach(b => dAdetTotRow.push(bolumAdetColTotals[b]));
    dAdetTotRow.push(grandTotalQty);
    const rDAdetTot = wsDealerAdet.addRow(dAdetTotRow);
    rDAdetTot.eachCell(c => c.font = { name: 'Arial', bold: true });
  }

  // Yetkili Servis Koli İcmal
  const wsDealerKoli = wbOut.getWorksheet('Yetkili Servis Koli İcmal');
  if (wsDealerKoli) {
    while (wsDealerKoli.rowCount > 2) {
      wsDealerKoli.spliceRows(3, 1);
    }
    const sortedDealers = Object.keys(dealerKoliMatrix).sort();
    const bolumKoliColTotals = {};
    allBolums.forEach(b => bolumKoliColTotals[b] = 0);
    let grandTotalBoxes = 0;

    sortedDealers.forEach(d => {
      let kSum = 0;
      const r = [d];
      allBolums.forEach(b => {
        const val = dealerKoliMatrix[d][b] || null;
        r.push(val);
        if (val) {
          kSum += val;
          bolumKoliColTotals[b] += val;
          grandTotalBoxes += val;
        }
      });
      r.push(kSum);
      wsDealerKoli.addRow(r);
    });
    const dKoliTotRow = ['Genel Toplam'];
    allBolums.forEach(b => dKoliTotRow.push(bolumKoliColTotals[b]));
    dKoliTotRow.push(grandTotalBoxes);
    const rDKoliTot = wsDealerKoli.addRow(dKoliTotRow);
    rDKoliTot.eachCell(c => c.font = { name: 'Arial', bold: true });
  }

  const allowedReportSheets = [
    'Bölüm İcmal',
    'Bölüm Ürün İcmal',
    'Yetkili Servis Adet İcmal',
    'Yetkili Servis Koli İcmal',
    'Özet',
    'Detay',
    'Koli Etiketi'
  ];

  // Sadece 7 rapor sayfasını tut, diğer sayfaları kaldır
  const sheetsToRemove = wbOut.worksheets.filter(ws => !allowedReportSheets.includes(ws.name));
  sheetsToRemove.forEach(ws => {
    wbOut.removeWorksheet(ws.id);
  });

  const outDir = path.dirname(output);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  await wbOut.xlsx.writeFile(output);
  console.log(`🎉 ExcelJS ile 7 Sayfalık Birebir Rapor (#002060 Lacivert Başlıklar) Oluşturuldu: ${output}`);
  return true;
}

function generateSeatReportJS(inputFile, outputFile) {
  if (!XLSX) {
    throw new Error('Ne ExcelJS ne de XLSX kütüphanesi bulunamadı!');
  }

  const wbInput = XLSX.readFile(inputFile);

  // SKU Map
  const parcaDetayData = XLSX.utils.sheet_to_json(wbInput.Sheets['PARÇA NO DETAY'], { header: 1 });
  const skuMap = {};
  parcaDetayData.forEach(row => {
    if (row && row[0] && row[1] && typeof row[1] === 'string' && row[1].startsWith('PSEAT')) {
      skuMap[normalizeKey(row[0])] = row[1].trim();
    }
  });

  const roleSheets = [
    { sheet: 'Diğer Servis Danışmanı', roleName: 'Diğer Servis Danışman' },
    { sheet: 'Formen', roleName: 'Formen' },
    { sheet: 'GarantiDispozisyon', roleName: 'Garanti/Dispozisyon' },
    { sheet: 'Kaporta Teknisyen', roleName: 'Kapota Teknisyen ' },
    { sheet: 'Master Teknisyen', roleName: 'Master Teknisyen' },
    { sheet: 'Mekanik Teknisyen', roleName: 'Mekanik Teknisyen' },
    { sheet: 'Servis Danışmanı', roleName: 'Servis Danışmanı' }
  ];

  const detayRows = [['Yetkili Servis', 'Bölüm', 'Adı, Soyadı-Bölümü', 'Stok', 'Ürün', 'Adet'], []];
  const koliEtiketiRows = [['Sıra', 'Yetkili Servis', ' Adı, Soyadı', 'Bölümü', 'Cinsiyet', 'Ürün_1', 'Ürün_2', 'Ürün_3', 'P_1', 'P_2', 'P_3']];
  const ozetRows = [['Bölüm', 'Yetkili Servis', 'Adı, Soyadı-Bölümü', 'Adet'], []];

  const bolumTotals = {};
  const bolumUrunMatrix = {};
  const dealerAdetMatrix = {};
  const dealerKoliMatrix = {};
  const dealerSequence = {};

  const allBolumList = [
    'Diğer Servis Danışman',
    'Formen',
    'Garanti/Dispozisyon',
    'Kapota Teknisyen ',
    'Master Teknisyen',
    'Mekanik Teknisyen',
    'Servis Danışmanı'
  ];

  const allProductList = [
    'Formen Polo Yaka T_Shirt',
    'Master Teknisyen Polo Yaka T_Shirt',
    'Servis Danışman Pantolon Bay',
    'Servis Danışman Polo Yaka T_Shİrt Bay',
    'Servis Danışman Polo Yaka T_Shİrt Bay Kırmızı',
    'Teknisyen Bisiklet Yaka T_Shirt',
    'Teknisyen Pantolon',
    'Teknisyen Polo Yaka T_Shİrt'
  ];

  allBolumList.forEach(b => {
    bolumTotals[b] = 0;
    bolumUrunMatrix[b] = {};
    allProductList.forEach(p => bolumUrunMatrix[b][p] = 0);
  });

  let grandTotalQty = 0;

  roleSheets.forEach(({ sheet, roleName }) => {
    if (!wbInput.Sheets[sheet]) return;
    const rows = XLSX.utils.sheet_to_json(wbInput.Sheets[sheet]);

    rows.forEach(person => {
      const dealer = (person['Yetkili Satıcı Kısa Adı'] || '').toString().trim().replace(' - ', ' ');
      const rawName = (person['Personel Adı'] || '').toString();
      const cleanName = rawName.trim();
      const gender = (person['Cinsiyet'] || '').toString().trim();
      const topSize = (person['Üst \r\nBeden'] || person['Üst Beden'] || '').toString().trim();
      const bottomSize = (person['Alt \r\nBeden'] || person['Alt Beden'] || '').toString().trim();

      if (!cleanName || !dealer) return;

      const personKey = `${rawName}-${roleName}`;
      let totalPersonItems = 0;
      const personItems = [];

      if (roleName === 'Servis Danışmanı') {
        const isBayan = gender.toUpperCase().includes('BAYAN') || gender.toUpperCase().includes('KADIN');
        const p1Model = `Servis Danışman Pantolon ${isBayan ? 'Bayan' : 'Bay'} - ${bottomSize}`;
        personItems.push({ prodName: 'Servis Danışman Pantolon Bay', labelDesc: 'Pantolon 2 Adet', sku: skuMap[normalizeKey(p1Model)] || '', qty: 2 });

        const p2Model = `SERVİS DANIŞMAN POLO YAKA T-SHIRT ${isBayan ? 'BAYAN' : 'BAY'} - ${topSize}`;
        personItems.push({ prodName: 'Servis Danışman Polo Yaka T_Shİrt Bay', labelDesc: 'T_Shirt (1) 2 Adet', sku: skuMap[normalizeKey(p2Model)] || '', qty: 2 });

        const p3Model = `SERVİS DANIŞMAN POLO YAKA T-SHIRT ${isBayan ? 'BAYAN' : 'BAY'} KIRMIZI - ${topSize}`;
        personItems.push({ prodName: 'Servis Danışman Polo Yaka T_Shİrt Bay Kırmızı', labelDesc: 'T_Shirt (2) 2 Adet', sku: skuMap[normalizeKey(p3Model)] || '', qty: 2 });

      } else if (roleName === 'Diğer Servis Danışman') {
        const isBayan = gender.toUpperCase().includes('BAYAN') || gender.toUpperCase().includes('KADIN');
        const p1Model = `SERVİS DANIŞMAN PANTOLON ${isBayan ? 'BAYAN' : 'BAY'} - ${bottomSize}`;
        personItems.push({ prodName: 'Servis Danışman Pantolon Bay', labelDesc: 'Pantolon 1 Adet', sku: skuMap[normalizeKey(p1Model)] || '', qty: 1 });

        const p2Model = `SERVİS DANIŞMAN POLO YAKA T-SHIRT ${isBayan ? 'BAYAN' : 'BAY'} - ${topSize}`;
        personItems.push({ prodName: 'Servis Danışman Polo Yaka T_Shİrt Bay', labelDesc: 'T_Shirt (1) 1 Adet', sku: skuMap[normalizeKey(p2Model)] || '', qty: 1 });

        const p3Model = `SERVİS DANIŞMAN POLO YAKA T-SHIRT ${isBayan ? 'BAYAN' : 'BAY'} KIRMIZI - ${topSize}`;
        personItems.push({ prodName: 'Servis Danışman Polo Yaka T_Shİrt Bay Kırmızı', labelDesc: 'T_Shirt (2) 2 Adet', sku: skuMap[normalizeKey(p3Model)] || '', qty: 2 });

      } else if (roleName === 'Formen') {
        const p1Model = `FORMEN POLO YAKA T-SHIRT - ${topSize}`;
        personItems.push({ prodName: 'Formen Polo Yaka T_Shirt', labelDesc: 'T_Shirt (1) 4 Adet', sku: skuMap[normalizeKey(p1Model)] || '', qty: 4 });

        const p2Model = `TEKNİSYEN PANTOLON - ${bottomSize}`;
        personItems.push({ prodName: 'Teknisyen Pantolon', labelDesc: 'Pantolon 2 Adet', sku: skuMap[normalizeKey(p2Model)] || '', qty: 2 });

      } else if (roleName === 'Mekanik Teknisyen') {
        const p1Model = `TEKNİSYEN PANTOLON - ${bottomSize}`;
        personItems.push({ prodName: 'Teknisyen Pantolon', labelDesc: 'Pantolon 2 Adet', sku: skuMap[normalizeKey(p1Model)] || '', qty: 2 });

        const p2Model = `TEKNİSYEN POLO YAKA T-SHIRT - ${topSize}`;
        personItems.push({ prodName: 'Teknisyen Polo Yaka T_Shİrt', labelDesc: 'T_Shirt (1) 4 Adet', sku: skuMap[normalizeKey(p2Model)] || '', qty: 4 });

      } else if (roleName.includes('Kapota') || roleName.includes('Kaporta')) {
        const p1Model = `TEKNİSYEN PANTOLON - ${bottomSize}`;
        personItems.push({ prodName: 'Teknisyen Pantolon', labelDesc: 'Pantolon 2 Adet', sku: skuMap[normalizeKey(p1Model)] || '', qty: 2 });

        const p2Model = `TEKNİSYEN BİSİKLET YAKA T-SHIRT - ${topSize}`;
        personItems.push({ prodName: 'Teknisyen Bisiklet Yaka T_Shirt', labelDesc: 'T_Shirt (1) 4 Adet', sku: skuMap[normalizeKey(p2Model)] || '', qty: 4 });

      } else if (roleName === 'Master Teknisyen') {
        const p1Model = `MASTER TEKNİSYEN POLO YAKA T-SHIRT - ${topSize}`;
        personItems.push({ prodName: 'Master Teknisyen Polo Yaka T_Shirt', labelDesc: 'T_Shirt (1) 4 Adet', sku: skuMap[normalizeKey(p1Model)] || '', qty: 4 });

        const p2Model = `TEKNİSYEN PANTOLON - ${bottomSize}`;
        personItems.push({ prodName: 'Teknisyen Pantolon', labelDesc: 'Pantolon 2 Adet', sku: skuMap[normalizeKey(p2Model)] || '', qty: 2 });

      } else if (roleName === 'Garanti/Dispozisyon') {
        const p1Model = `TEKNİSYEN POLO YAKA T-SHIRT - ${topSize}`;
        personItems.push({ prodName: 'Teknisyen Polo Yaka T_Shİrt', labelDesc: 'T_Shirt (1) 3 Adet', sku: skuMap[normalizeKey(p1Model)] || '', qty: 3 });
      }

      if (!dealerAdetMatrix[dealer]) {
        dealerAdetMatrix[dealer] = {};
        dealerKoliMatrix[dealer] = {};
        allBolumList.forEach(b => {
          dealerAdetMatrix[dealer][b] = 0;
          dealerKoliMatrix[dealer][b] = 0;
        });
      }

      dealerKoliMatrix[dealer][roleName] = (dealerKoliMatrix[dealer][roleName] || 0) + 1;

      personItems.forEach(item => {
        detayRows.push([dealer, roleName, personKey, item.sku, item.prodName, item.qty]);
        totalPersonItems += item.qty;
        grandTotalQty += item.qty;

        bolumTotals[roleName] = (bolumTotals[roleName] || 0) + item.qty;
        bolumUrunMatrix[roleName][item.prodName] = (bolumUrunMatrix[roleName][item.prodName] || 0) + item.qty;
        dealerAdetMatrix[dealer][roleName] = (dealerAdetMatrix[dealer][roleName] || 0) + item.qty;
      });

      ozetRows.push([roleName, dealer, personKey, totalPersonItems]);

      dealerSequence[dealer] = (dealerSequence[dealer] || 0) + 1;
      const seq = dealerSequence[dealer];

      let u1 = ' ', u2 = ' ', u3 = ' ';
      let p1 = null, p2 = null, p3 = null;

      if (roleName === 'Garanti/Dispozisyon') {
        u2 = personItems[0] ? personItems[0].labelDesc : ' ';
        p2 = personItems[0] ? personItems[0].sku : '';
      } else {
        u1 = personItems[0] ? personItems[0].labelDesc : ' ';
        u2 = personItems[1] ? personItems[1].labelDesc : ' ';
        u3 = personItems[2] ? personItems[2].labelDesc : ' ';
        p1 = personItems[0] ? personItems[0].sku : '';
        p2 = personItems[1] ? personItems[1].sku : '';
        p3 = personItems[2] ? personItems[2].sku : '';
      }

      koliEtiketiRows.push([seq, dealer, cleanName, roleName, gender, u1, u2, u3, p1, p2, p3]);
    });
  });

  detayRows.push([]);
  detayRows.push(['Genel Toplam', null, null, null, null, grandTotalQty]);

  ozetRows.push([]);
  ozetRows.push(['Genel Toplam', null, null, grandTotalQty]);

  // İcmaller
  const bolumIcmalRows = [['Bölüm', 'Toplam Adet'], []];
  allBolumList.forEach(b => bolumIcmalRows.push([b, bolumTotals[b] || 0]));
  bolumIcmalRows.push([]);
  bolumIcmalRows.push(['Genel Toplam', grandTotalQty]);

  const bolumUrunRows = [['Bölüm / Ürün', ...allProductList, 'Genel Toplam'], []];
  const prodColumnTotals = {};
  allProductList.forEach(p => prodColumnTotals[p] = 0);

  allBolumList.forEach(b => {
    let rowSum = 0;
    const row = [b];
    allProductList.forEach(p => {
      const val = bolumUrunMatrix[b][p] || null;
      row.push(val);
      if (val) {
        rowSum += val;
        prodColumnTotals[p] += val;
      }
    });
    row.push(rowSum);
    bolumUrunRows.push(row);
  });
  bolumUrunRows.push([]);
  const prodTotalRow = ['Genel Toplam'];
  allProductList.forEach(p => prodTotalRow.push(prodColumnTotals[p]));
  prodTotalRow.push(grandTotalQty);
  bolumUrunRows.push(prodTotalRow);

  const dealerAdetRows = [['Yetkili Servis / Bölüm', 'Diğer Servis Danışman', 'Formen', 'Garanti / Dispozisyon', 'Kapota Teknisyen ', 'Master Teknisyen', 'Mekanik Teknisyen', 'Servis Danışmanı', 'Genel Toplam'], []];
  const sortedDealers = Object.keys(dealerAdetMatrix).sort();
  const bolumAdetColTotals = {};
  allBolumList.forEach(b => bolumAdetColTotals[b] = 0);

  sortedDealers.forEach(d => {
    let dSum = 0;
    const row = [d];
    allBolumList.forEach(b => {
      const val = dealerAdetMatrix[d][b] || null;
      row.push(val);
      if (val) {
        dSum += val;
        bolumAdetColTotals[b] += val;
      }
    });
    row.push(dSum);
    dealerAdetRows.push(row);
  });
  dealerAdetRows.push([]);
  const dealerAdetTotalRow = ['Genel Toplam'];
  allBolumList.forEach(b => dealerAdetTotalRow.push(bolumAdetColTotals[b]));
  dealerAdetTotalRow.push(grandTotalQty);
  dealerAdetRows.push(dealerAdetTotalRow);

  const dealerKoliRows = [['Yetkili Servis / Bölüm', 'Diğer Servis Danışman', 'Formen', 'Garanti / Dispozisyon', 'Kapota Teknisyen ', 'Master Teknisyen', 'Mekanik Teknisyen', 'Servis Danışmanı', 'Genel Toplam'], []];
  const bolumKoliColTotals = {};
  allBolumList.forEach(b => bolumKoliColTotals[b] = 0);
  let grandTotalBoxes = 0;

  sortedDealers.forEach(d => {
    let kSum = 0;
    const row = [d];
    allBolumList.forEach(b => {
      const val = dealerKoliMatrix[d][b] || null;
      row.push(val);
      if (val) {
        kSum += val;
        bolumKoliColTotals[b] += val;
        grandTotalBoxes += val;
      }
    });
    row.push(kSum);
    dealerKoliRows.push(row);
  });
  dealerKoliRows.push([]);
  const dealerKoliTotalRow = ['Genel Toplam'];
  allBolumList.forEach(b => dealerKoliTotalRow.push(bolumKoliColTotals[b]));
  dealerKoliTotalRow.push(grandTotalBoxes);
  dealerKoliRows.push(dealerKoliTotalRow);

  // Workbook kur - Sadece 7 rapor sayfası
  const wbOutput = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wbOutput, XLSX.utils.aoa_to_sheet(bolumIcmalRows), 'Bölüm İcmal');
  XLSX.utils.book_append_sheet(wbOutput, XLSX.utils.aoa_to_sheet(bolumUrunRows), 'Bölüm Ürün İcmal');
  XLSX.utils.book_append_sheet(wbOutput, XLSX.utils.aoa_to_sheet(dealerAdetRows), 'Yetkili Servis Adet İcmal');
  XLSX.utils.book_append_sheet(wbOutput, XLSX.utils.aoa_to_sheet(dealerKoliRows), 'Yetkili Servis Koli İcmal');
  XLSX.utils.book_append_sheet(wbOutput, XLSX.utils.aoa_to_sheet(ozetRows), 'Özet');
  XLSX.utils.book_append_sheet(wbOutput, XLSX.utils.aoa_to_sheet(detayRows), 'Detay');
  XLSX.utils.book_append_sheet(wbOutput, XLSX.utils.aoa_to_sheet(koliEtiketiRows), 'Koli Etiketi');

  const outDir = path.dirname(outputFile);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  XLSX.writeFile(wbOutput, outputFile);
  console.log(`🎉 XLSX Motoru ile 7 Sayfalık Rapor Başarıyla Oluşturuldu: ${outputFile}`);

  return true;
}

if (require.main === module) {
  generateSeatReport();
}

module.exports = { generateSeatReport };
