async function run() {
  const res = await fetch('http://localhost:3001/api/orders/mssql-list?tab=ALL&limit=all&search=skoda&refresh=true');
  const d = await res.json();
  console.log('Total matching:', d.filteredTotal);
  const screenshotCheck = [13959, 13929, 13734, 13733, 13732, 13731, 13730, 13729, 13550, 13493];
  const seasonCheck = [15330, 15329, 15328, 15327, 15326, 15325, 15324, 15323, 15322, 15321];
  const recentCheck = [16695, 16694, 16693, 16692, 16691, 16690, 16689, 16688, 16687, 16686];

  console.log('\n--- SCREENSHOT ORDERS VERIFICATION ---');
  d.data.forEach((x, i) => {
    if (screenshotCheck.includes(x.Id)) {
      console.log(`[${i}] ID: ${x.Id} | ParcaNo: ${x.ParcaNo} | Model: ${x.Model}`);
    }
  });

  console.log('\n--- 2025 KIŞ SEASON (15321-15330) VERIFICATION ---');
  d.data.forEach((x, i) => {
    if (seasonCheck.includes(x.Id)) {
      console.log(`[${i}] ID: ${x.Id} | ParcaNo: ${x.ParcaNo} | Model: ${x.Model}`);
    }
  });

  console.log('\n--- 2026 KIŞ SEASON (16686-16695) VERIFICATION ---');
  d.data.forEach((x, i) => {
    if (recentCheck.includes(x.Id)) {
      console.log(`[${i}] ID: ${x.Id} | ParcaNo: ${x.ParcaNo} | Model: ${x.Model}`);
    }
  });
}
run().catch(console.error);
