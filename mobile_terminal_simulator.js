/**
 * VOG Tekstil Premium - Mobile EAN-13 Handheld Terminal Simulator
 * 
 * Simulates a warehouse handheld PDA scanner terminal interacting with B2B Web Services.
 */

const http = require('http');
const readline = require('readline');

const BACKEND_URL = 'http://localhost:3001';
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let sessionToken = 'VOG16546NNF5351ADD123123'; // Default fallback debug token
let userBrand = 'VOG';
let userRole = 'ADMIN';

function makeRequest(method, path, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BACKEND_URL);
        const dataStr = JSON.stringify(body);
        
        const options = {
            hostname: url.hostname,
            port: url.port || 80,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(dataStr)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', (err) => reject(err));
        req.write(dataStr);
        req.end();
    });
}

function showMenu() {
    console.log('\n========================================================');
    console.log(` 📱 HANDHELD PDA TERMINAL SIMULATOR - Brand: ${userBrand} (${userRole})`);
    console.log(` Token: ${sessionToken ? sessionToken.substring(0, 8) + '...' : 'NONE'}`);
    console.log('========================================================');
    console.log('[1] User Login (/api/auth/login)');
    console.log('[2] Scan & Query Product EAN-13 (/api/products/master-data)');
    console.log('[3] Perform Inventory Count - Sayım (/api/inventory/count)');
    console.log('[4] Query Print Vouchers (/api/vouchers/print)');
    console.log('[5] Query Orders (/api/orders/query)');
    console.log('[6] Exit');
    console.log('========================================================');
    rl.question('Select option: ', handleMenuOption);
}

async function handleMenuOption(option) {
    switch (option.trim()) {
        case '1':
            console.log('\n--- TERMINAL AUTH LOGIN ---');
            rl.question('Username (e.g. admin, zara, audi): ', (username) => {
                rl.question('Password: ', (password) => {
                    rl.question('Database Name (default: vog_db): ', async (dbName) => {
                        try {
                            const res = await makeRequest('POST', '/api/auth/login', {
                                username,
                                password,
                                database_name: dbName || 'vog_db'
                            });
                            if (res.body && res.body.success) {
                                sessionToken = res.body.token;
                                userBrand = res.body.brand || 'VOG';
                                userRole = res.body.role || 'CUSTOMER';
                                console.log('✅ Login Successful! Token updated.');
                            } else {
                                console.log(`❌ Login Failed: ${res.body.message || 'Invalid credentials'}`);
                            }
                        } catch (err) {
                            console.log(`❌ Connection Error: ${err.message}`);
                        }
                        showMenu();
                    });
                });
            });
            break;

        case '2':
            console.log('\n--- SCAN PRODUCT BARCODE / EAN-13 ---');
            console.log('Sample EAN-13s: 8680002000014 (SEAT), 8680003000013 (AUDI), 8680005000018 (ZARA)');
            rl.question('Scan or type product EAN-13 / Barcode: ', async (barcode) => {
                if (!barcode) {
                    console.log('❌ Empty input.');
                    showMenu();
                    return;
                }
                try {
                    const res = await makeRequest('POST', '/api/products/master-data', {
                        token: sessionToken,
                        barcode: barcode.trim()
                    });
                    if (Array.isArray(res.body) && res.body.length > 0) {
                        console.log('\n📦 PRODUCT DETAILS FOUND:');
                        console.table(res.body);
                    } else {
                        console.log('❌ Product not found or invalid barcode.');
                    }
                } catch (err) {
                    console.log(`❌ Request Error: ${err.message}`);
                }
                showMenu();
            });
            break;

        case '3':
            console.log('\n--- INVENTORY COUNTING (SAYIM) ---');
            rl.question('Enter Counting Session ID (e.g. 501): ', (countSessionId) => {
                rl.question('Enter product EAN-13/GTIN to count: ', (gtin) => {
                    rl.question('Enter quantity counted: ', async (qty) => {
                        const countingId = parseInt(countSessionId) || 1;
                        const quantity = parseInt(qty) || 1;
                        
                        try {
                            const res = await makeRequest('POST', '/api/inventory/count', {
                                token: sessionToken,
                                counting_id: countingId,
                                total_line_items: 1,
                                response_data: [
                                    { gtin: gtin.trim(), count: quantity }
                                ]
                            });
                            if (res.body && res.body.success) {
                                console.log('✅ Inventory count session uploaded successfully.');
                            } else {
                                console.log(`❌ Upload Failed: ${res.body.message}`);
                            }
                        } catch (err) {
                            console.log(`❌ Error: ${err.message}`);
                        }
                        showMenu();
                    });
                });
            });
            break;

        case '4':
            console.log('\n--- QUERY DISPATCH VOUCHERS ---');
            rl.question('Start Date (YYYY-MM-DD, e.g. 2026-05-01): ', (startDate) => {
                rl.question('End Date (YYYY-MM-DD, e.g. 2026-05-30): ', async (endDate) => {
                    try {
                        const res = await makeRequest('POST', '/api/vouchers/print', {
                            token: sessionToken,
                            start_date: startDate || '2026-05-01',
                            end_date: endDate || '2026-05-30'
                        });
                        if (Array.isArray(res.body)) {
                            console.log(`\n📋 Found ${res.body.length} vouchers:`);
                            console.table(res.body.map(v => ({
                                ID: v.Id,
                                OrderNum: v.order_id,
                                Brand: v.brand,
                                Product: v.product_name,
                                Size: v.size,
                                Qty: v.quantity,
                                BoxNo: `${v.box_no}/${v.total_boxes}`
                            })));
                        } else {
                            console.log(`❌ Query Failed: ${res.body.message}`);
                        }
                    } catch (err) {
                        console.log(`❌ Error: ${err.message}`);
                    }
                    showMenu();
                });
            });
            break;

        case '5':
            console.log('\n--- QUERY ORDERS ---');
            rl.question('Start Date (YYYY-MM-DD, e.g. 2026-05-01): ', (startDate) => {
                rl.question('End Date (YYYY-MM-DD, e.g. 2026-05-30): ', async (endDate) => {
                    try {
                        const res = await makeRequest('POST', '/api/orders/query', {
                            token: sessionToken,
                            start_date: startDate || '2026-05-01',
                            end_date: endDate || '2026-05-30'
                        });
                        if (res.body && res.body.success) {
                            console.log(`\n📋 Found ${res.body.total_records} orders:`);
                            console.table(res.body.data);
                        } else {
                            console.log(`❌ Query Failed: ${res.body.message}`);
                        }
                    } catch (err) {
                        console.log(`❌ Error: ${err.message}`);
                    }
                    showMenu();
                });
            });
            break;

        case '6':
            console.log('\nGoodbye!');
            rl.close();
            break;

        default:
            console.log('❌ Invalid option. Try again.');
            showMenu();
            break;
    }
}

showMenu();
