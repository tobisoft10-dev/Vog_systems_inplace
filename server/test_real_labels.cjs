const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'vog_db',
    password: process.env.DB_PASSWORD || '150609',
    port: process.env.DB_PORT || 5432,
});

async function testPrinterApi() {
    console.log('🧪 Testing /api/printer/print-order-rfid-labels on running vog-api...\n');

    // Clean up test order vouchers before running to ensure fresh resolution
    await pool.query("DELETE FROM vouchers WHERE order_id IN (9901, 9902, 9903, 9904, 9905)");
    await pool.query("DELETE FROM sales WHERE order_id IN (9901, 9902, 9903, 9904, 9905)");

    const testPayloads = [
        {
            name: '1. NISSAN MONT (Non-pantolon: TEKNİSYEN KISLIK MONT 4XL)',
            payload: {
                order_id: '9901',
                brand: 'NISSAN',
                product_name: 'TEKNİSYEN KISLIK MONT 4XL',
                sku: '8520147032006',
                barcode: '8520147032006',
                gender: 'Erkek',
                items: [
                    { size: '4XL', quantity: 1, barcode: '8520147032006', sku: '8520147032006', product_name: 'TEKNİSYEN KISLIK MONT 4XL' }
                ],
                label_template: 'QR'
            },
            expectedParca: '8520147032006',
            expectedEan: '8520147032006',
            expectedBeden: '4XL',
            shouldHaveParen: false
        },
        {
            name: '2. NISSAN PANTOLON (Pantolon: TEKNİSYEN KISLIK PANTOLON 4XL)',
            payload: {
                order_id: '9902',
                brand: 'NISSAN',
                product_name: 'TEKNİSYEN KISLIK PANTOLON 4XL',
                sku: '8520147032723',
                barcode: '8520147032723',
                gender: 'Erkek',
                items: [
                    { size: '4XL', quantity: 1, barcode: '8520147032723', sku: '8520147032723', product_name: 'TEKNİSYEN KISLIK PANTOLON 4XL' }
                ],
                label_template: 'QR'
            },
            expectedParca: '8520147032723',
            expectedEan: '8520147032723',
            shouldHaveParen: true
        },
        {
            name: '3. AUDI T-SHIRT (Non-pantolon: Siyah T-Shirt/M/Servis Danışmanı-AUDI/Erkek)',
            payload: {
                order_id: '9903',
                brand: 'AUDI',
                product_name: 'Siyah T-Shirt/M/Servis Danışmanı-AUDI/Erkek',
                sku: 'PPAUDI260001M',
                barcode: '8692600011030',
                gender: 'Erkek',
                items: [
                    { size: 'M (42)', quantity: 1, barcode: '8692600011030', sku: 'PPAUDI260001M', product_name: 'Siyah T-Shirt/M/Servis Danışmanı-AUDI/Erkek' }
                ],
                label_template: 'QR'
            },
            expectedParca: 'PPAUDI260001M',
            expectedEan: '8692600011030',
            expectedBeden: 'M',
            shouldHaveParen: false
        },
        {
            name: '4. VOLKSWAGEN PANTOLON (Pantolon: Atölye Personeli Pantolon Kışlık - Erkek)',
            payload: {
                order_id: '9904',
                brand: 'VOLKSWAGEN',
                product_name: 'Atölye Personeli Pantolon Kışlık - Erkek',
                sku: 'PVWK100004XS',
                barcode: '8697619171270',
                gender: 'Erkek',
                items: [
                    { size: '38 (XS)', quantity: 1, barcode: '8697619171270', sku: 'PVWK100004XS', product_name: 'Atölye Personeli Pantolon Kışlık - Erkek' }
                ],
                label_template: 'QR'
            },
            expectedParca: 'PVWK100004XS',
            expectedEan: '8697619171270',
            shouldHaveParen: true
        },
        {
            name: '5. NISSAN YAZ T-SHIRT (Non-pantolon: Servis Danışmanı Tshirt - Erkek-M)',
            payload: {
                order_id: '9905',
                brand: 'NISSAN',
                product_name: 'Servis Danışmanı Tshirt - Erkek-M',
                sku: '9010201001035',
                barcode: '9010201001035',
                gender: 'Erkek',
                items: [
                    { size: 'M', quantity: 1, barcode: '9010201001035', sku: '9010201001035', product_name: 'Servis Danışmanı Tshirt - Erkek-M' }
                ],
                label_template: 'QR'
            },
            expectedParca: '9010201001035',
            expectedEan: '9010201001035',
            expectedBeden: 'M',
            shouldHaveParen: false
        }
    ];

    let allPassed = true;

    for (const tc of testPayloads) {
        console.log(`--------------------------------------------------`);
        console.log(`Testing: ${tc.name}`);

        const res = await fetch('http://localhost:3001/api/printer/print-order-rfid-labels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tc.payload)
        });

        const data = await res.json();
        if (!data.success || !data.zpl) {
            console.error('❌ Request failed or no ZPL in response:', data);
            allPassed = false;
            continue;
        }

        const zpl = data.zpl;

        // Parse fields from ZPL
        const parcaMatch = zpl.match(/\^FDPARCA NO:\^FS\s*\^FO\d+,\d+.*?\^FD([^\^]+)\^FS/);
        const eanMatch = zpl.match(/\^FDEAN:\^FS\s*\^FO\d+,\d+.*?\^FD([^\^]+)\^FS/);
        const bedenMatch = zpl.match(/\^FDBEDEN:\^FS\s*\^FO\d+,\d+.*?\^FD([^\^]+)\^FS/);

        const parcaVal = parcaMatch ? parcaMatch[1].trim() : '';
        const eanVal = eanMatch ? eanMatch[1].trim() : '';
        const bedenVal = bedenMatch ? bedenMatch[1].trim() : '';

        console.log(`  Output PARCA NO : "${parcaVal}"`);
        console.log(`  Output EAN      : "${eanVal}"`);
        console.log(`  Output BEDEN    : "${bedenVal}"`);

        let testOk = true;

        if (tc.expectedParca && parcaVal !== tc.expectedParca) {
            console.error(`  ❌ PARCA NO mismatch! Expected "${tc.expectedParca}", Got "${parcaVal}"`);
            testOk = false;
        }

        if (tc.expectedEan && eanVal !== tc.expectedEan) {
            console.error(`  ❌ EAN mismatch! Expected "${tc.expectedEan}", Got "${eanVal}"`);
            testOk = false;
        }

        if (tc.expectedBeden && bedenVal !== tc.expectedBeden) {
            console.error(`  ❌ BEDEN mismatch! Expected "${tc.expectedBeden}", Got "${bedenVal}"`);
            testOk = false;
        }

        if (tc.shouldHaveParen === false && bedenVal.includes('(')) {
            console.error(`  ❌ BEDEN contains parenthesis forbidden on non-pants! Got "${bedenVal}"`);
            testOk = false;
        }

        if (tc.shouldHaveParen === true && !bedenVal.includes('(')) {
            console.error(`  ❌ Pantolon BEDEN expected to have dual size format! Got "${bedenVal}"`);
            testOk = false;
        }

        if (testOk) {
            console.log(`  ✅ PASSED`);
        } else {
            allPassed = false;
        }

        // Save sample ZPL for preview render
        if (tc.name.includes('NISSAN MONT')) {
            fs.writeFileSync('C:/vog_system/server/nissan_mont_sample.zpl', zpl);
        } else if (tc.name.includes('NISSAN PANTOLON')) {
            fs.writeFileSync('C:/vog_system/server/nissan_pantolon_sample.zpl', zpl);
        } else if (tc.name.includes('AUDI T-SHIRT')) {
            fs.writeFileSync('C:/vog_system/server/audi_tshirt_sample.zpl', zpl);
        } else if (tc.name.includes('VOLKSWAGEN PANTOLON')) {
            fs.writeFileSync('C:/vog_system/server/vw_pantolon_sample.zpl', zpl);
        }
    }

    console.log(`\n==================================================`);
    console.log(allPassed ? '🎉 ALL 5 LABEL RULES TESTS PASSED WITH 100% SUCCESS!' : '❌ SOME TESTS FAILED');
    await pool.end();
}

testPrinterApi().catch(console.error);
