const { Pool } = require('pg');
require('dotenv').config({ path: 'c:/vog_system/server/.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'vog_system'
});

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE END-TO-END SCANIA TESTS');
  console.log('====================================================\n');

  // Test 1: Brands Endpoint
  console.log('1. Testing /api/personnel-orders/brands...');
  const brandRes = await fetch('http://localhost:3001/api/personnel-orders/brands');
  const brandData = await brandRes.json();
  if (!brandData.success) throw new Error('Brands endpoint failed: ' + brandData.error);
  const scaniaBrand = brandData.brands.find(b => b.brand === 'SCANIA');
  if (!scaniaBrand || parseInt(scaniaBrand.staff_count, 10) !== 897) {
    throw new Error('SCANIA brand missing or count incorrect: ' + JSON.stringify(scaniaBrand));
  }
  console.log(`   ✓ SCANIA brand found with ${scaniaBrand.staff_count} staff.`);

  // Test 2: Departments Endpoint for SCANIA
  console.log('2. Testing /api/personnel-orders/departments?brand=SCANIA...');
  const deptRes = await fetch('http://localhost:3001/api/personnel-orders/departments?brand=SCANIA');
  const deptData = await deptRes.json();
  if (!deptData.success) throw new Error('Departments endpoint failed: ' + deptData.error);
  console.log(`   ✓ Found ${deptData.departments.length} departments for Scania:`);
  deptData.departments.forEach(d => {
    console.log(`     - ${d.department}: ${d.staff_count} staff`);
  });

  // Test 3: Staff List for Scania
  console.log('\n3. Testing /api/personnel-orders/staff-list?brand=SCANIA...');
  const staffRes = await fetch('http://localhost:3001/api/personnel-orders/staff-list?brand=SCANIA');
  const staffData = await staffRes.json();
  if (!staffData.success || staffData.staff.length !== 897) {
    throw new Error(`Expected 897 staff, got ${staffData.staff?.length}`);
  }
  console.log(`   ✓ Successfully fetched all ${staffData.staff.length} Scania staff.`);

  // Test 4: Label Data for Different Scania Roles
  console.log('\n4. Testing Label Data for Scania Roles:');
  
  // 4a. Danışman
  const danisman = staffData.staff.find(s => s.department === 'Danışman (Yaz)');
  const dLabelRes = await fetch(`http://localhost:3001/api/personnel-orders/${danisman.id}/label-data`);
  const dLabel = await dLabelRes.json();
  console.log(`   ✓ Danışman (${danisman.name}):`);
  console.log(`     - Receipt: ${dLabel.receipt.receipt_no}, Total Items: ${dLabel.receipt.total_items} Adet`);
  console.log(`     - Box Barcode: ${dLabel.receipt.box_barcode}, Brand: ${dLabel.receipt.brand}`);
  console.log(`     - ZPL Item Labels: ${dLabel.item_labels.length} individual piece labels generated`);
  if (dLabel.item_labels.length !== dLabel.receipt.total_items) {
    throw new Error('Mismatch between total_items and generated item_labels');
  }

  // 4b. Teknisyen
  const teknisyen = staffData.staff.find(s => s.department === 'Teknisyen (Kış)');
  const tLabelRes = await fetch(`http://localhost:3001/api/personnel-orders/${teknisyen.id}/label-data`);
  const tLabel = await tLabelRes.json();
  console.log(`   ✓ Teknisyen (${teknisyen.name}):`);
  console.log(`     - Receipt: ${tLabel.receipt.receipt_no}, Total Items: ${tLabel.receipt.total_items} Adet`);
  console.log(`     - Items Breakdown:`);
  tLabel.receipt.items.forEach(it => {
    console.log(`       * ${it.name} (${it.size}) - ${it.qty} Adet [${it.part_no}]`);
  });
  console.log(`     - ZPL Item Labels: ${tLabel.item_labels.length} individual piece labels generated`);

  // Test 5: Sorter Engine Matching Simulation
  console.log('\n5. Testing Sorter Engine Custom Bundle Matching Simulation...');
  const sorterEngine = require('./services/sorter_engine.cjs');
  
  // Pick an active Scania person
  const testPerson = danisman;
  const testItem = testPerson.bundle_items[0]; // e.g. Pantolon
  console.log(`   Testing match for personnel: ${testPerson.name} (Chute: 45)`);
  console.log(`   Garment scan: SKU ${testItem.sku} / Barcode ${testItem.barcode}`);

  // Temporarily assign testPerson to chute 45
  await pool.query('UPDATE personnel SET sorter_chute = 45 WHERE id = $1', [testPerson.id]);
  await pool.query('DELETE FROM sorter_mappings WHERE chute_no = 45');
  await pool.query(`
    INSERT INTO sorter_mappings (destination_name, chute_no, match_type, priority, target_capacity, status)
    VALUES ($1, 45, 'PERSONNEL', 1, 9, 'ACTIVE')
  `, [`${testPerson.name} (${testPerson.service_center})`]);

  const matchResult = await sorterEngine.matchPersonnelForGarment(testItem.barcode, testItem.sku);
  
  // Clean up
  await pool.query('UPDATE personnel SET sorter_chute = NULL WHERE id = $1', [testPerson.id]);
  await pool.query('DELETE FROM sorter_mappings WHERE chute_no = 45');

  if (!matchResult || !matchResult.personnel || matchResult.personnel.id !== testPerson.id) {
    throw new Error('Sorter engine failed to match Scania personnel: ' + JSON.stringify(matchResult));
  }
  console.log(`   ✓ Sorter successfully matched: Person: ${matchResult.personnel.name}, Item: ${matchResult.item.name}, PartNo: ${matchResult.item.part_no}`);

  // Test 6: Zero Regression on Volkswagen
  console.log('\n6. Testing Zero-Regression on Volkswagen...');
  const vwRes = await fetch('http://localhost:3001/api/personnel-orders/staff-list?brand=VOLKSWAGEN');
  const vwData = await vwRes.json();
  if (vwData.staff.length !== 442) {
    throw new Error(`Expected 442 VW staff, got ${vwData.staff.length}`);
  }
  const vwSample = vwData.staff[0];
  if (vwSample.total_target !== 7 || vwSample.bundle_items.length !== 5) {
    throw new Error(`VW bundle corrupted: total_target=${vwSample.total_target}, items=${vwSample.bundle_items?.length}`);
  }
  console.log(`   ✓ Volkswagen intact: ${vwData.staff.length} staff, 7-piece advisor bundle fully preserved.`);

  console.log('\n====================================================');
  console.log('🎉 ALL TESTS PASSED WITH 100% SUCCESS!');
  console.log('====================================================');

  await pool.end();
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
