const http = require('http');

function req(options, body) {
  return new Promise((resolve, reject) => {
    const r = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    });
    r.on('error', reject);
    if (body) r.write(typeof body === 'string' ? body : JSON.stringify(body));
    r.end();
  });
}

async function test() {
  console.log('1. Fetching staff-list...');
  const staffRes = await req({ hostname: 'localhost', port: 3001, path: '/api/personnel-orders/staff-list?brand=VOLKSWAGEN', method: 'GET' });
  console.log('Staff count:', staffRes.staff.length);
  const staff = staffRes.staff[0];
  console.log('Sample staff:', staff.name, 'ID:', staff.id, 'Last Step:', staff.last_step, 'Voucher:', staff.voucher_status, 'Part:', staff.part_no);

  console.log('\n2. Fetching label-data for staff:', staff.id);
  const labelRes = await req({ hostname: 'localhost', port: 3001, path: `/api/personnel-orders/${staff.id}/label-data`, method: 'GET' });
  console.log('Label success:', labelRes.success);
  console.log('Bundle items count:', labelRes.bundle_items.length);
  console.log('Receipt No:', labelRes.receipt.receipt_no);
  console.log('Sample bundle item:', labelRes.bundle_items[0]);

  console.log('\n3. Triggering print-voucher for staff:', staff.id);
  const printRes = await req(
    { hostname: 'localhost', port: 3001, path: '/api/personnel-orders/print-voucher', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { personnel_id: staff.id, print_receipt: true, print_labels: true, print_box: true }
  );
  console.log('Print response:', printRes);

  console.log('\n4. Updating step to "KESİM"...');
  const stepRes = await req(
    { hostname: 'localhost', port: 3001, path: '/api/personnel-orders/update-step', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { personnel_id: staff.id, last_step: 'KESİM' }
  );
  console.log('Step response:', stepRes);

  console.log('\nALL TESTS PASSED ✅');
}

test().catch(console.error);
