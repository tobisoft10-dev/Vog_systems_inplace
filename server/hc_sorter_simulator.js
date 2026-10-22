/**
 * VOG Tekstil Premium - HC Robotics Sorter (Lightning Broadcast Mini) Simulator
 * 
 * This script simulates the Sorter PLC calling the WMS API to:
 * 1. Query destinations/chutes for scanned barcodes.
 * 2. Report mechanical/conveyor errors.
 * 3. Report recovery events when issues are resolved.
 */

const http = require('http');
const readline = require('readline');

const BACKEND_URL = 'http://localhost:3001';
const SYSTEM_ID = 'sort001';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

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

// Global state to track active error simulation
let activeError = null;

async function showMainMenu() {
    console.clear();
    console.log('========================================================');
    console.log('    HC ROBOTICS - LIGHTNING BROADCAST MINI SIMULATOR    ');
    console.log('========================================================');
    console.log(`Backend Server: ${BACKEND_URL}`);
    console.log(`Sorter Status:  ${activeError ? '🔴 ERROR: ' + activeError.errorCode : '🟢 OPERATIONAL'}`);
    console.log('========================================================');
    console.log('[1] Simulate Package Scan & Chute Query');
    console.log('[2] Trigger Sorter Error (e.g. Parcel Lost)');
    console.log('[3] Resolve Sorter Error (Send Recovery)');
    console.log('[q] Exit');
    console.log('========================================================');
    
    rl.question('Select an option: ', async (choice) => {
        switch(choice.trim()) {
            case '1':
                await simulateScan();
                break;
            case '2':
                await triggerError();
                break;
            case '3':
                await resolveError();
                break;
            case 'q':
                rl.close();
                process.exit(0);
                break;
            default:
                console.log('Invalid selection.');
                setTimeout(showMainMenu, 1000);
        }
    });
}

async function simulateScan() {
    console.log('\n--- Barcode Scan / Chute Routing Query ---');
    try {
        // Fetch active orders to select a valid barcode
        const { body: res } = await makeRequest('GET', '/api/orders/list', {});
        let barcodeToQuery = '8680010000018'; // Fallback barcode

        if (res && res.success && res.data && res.data.length > 0) {
            console.log('Select a product barcode from active orders:');
            res.data.slice(0, 5).forEach((order, idx) => {
                console.log(`  [${idx + 1}] Brand: ${order.brand} | Order: ${order.order_number} | SKU: ${order.sku} | Barcode: ${order.barcode}`);
            });
            
            const selection = await new Promise(resolve => rl.question('Enter number or press ENTER for default: ', resolve));
            const idx = parseInt(selection) - 1;
            if (idx >= 0 && idx < res.data.length) {
                barcodeToQuery = res.data[idx].barcode || res.data[idx].sku;
            }
        } else {
            console.log('No active orders found in the database. Using fallback barcode.');
        }

        console.log(`\nSending routing query for Barcode: ${barcodeToQuery}...`);
        const queryRes = await makeRequest('POST', '/api/wms/white/destination/query', {
            systemId: SYSTEM_ID,
            barcode: barcodeToQuery
        });

        if (queryRes.body.success) {
            console.log('\n🌟 --- ROUTING RESULT --- 🌟');
            console.log(`👉 Destination Chute: CH-${queryRes.body.chuteNo.toString().padStart(2, '0')}`);
            console.log(`📦 Destination:       ${queryRes.body.destination}`);
            console.log(`👕 Product Name:      ${queryRes.body.productName}`);
            console.log('===========================\n');
        } else {
            console.log(`❌ Query Failed: ${queryRes.body.msg || queryRes.body.errorCode}`);
        }
    } catch (err) {
        console.error('❌ Connection error:', err.message);
    }
    
    rl.question('Press Enter to return to main menu...', () => showMainMenu());
}

async function triggerError() {
    console.log('\n--- Trigger Sorter Error ---');
    const uniqueId = Date.now();
    const errorCode = 'CONVEYOR_PARCEL_LOST';
    const recoverCode = 'CONVEYOR_RECOVER';
    const level = 'B';
    const deviceType = 'CONVEYOR';
    const deviceId = 'sort001-SITE-1-CONVEYOR';

    activeError = { uniqueId, errorCode };

    try {
        const res = await makeRequest('POST', '/api/wms/white/error/happen', {
            systemId: SYSTEM_ID,
            errorCode,
            recoverCode,
            level,
            uniqueId,
            deviceType,
            deviceId
        });

        if (res.body.success) {
            console.log(`🟢 Error reported successfully to WMS! (ID: ${uniqueId})`);
        } else {
            console.log('❌ Failed to report error:', res.body.msg);
            activeError = null;
        }
    } catch (err) {
        console.error('❌ Connection error:', err.message);
        activeError = null;
    }
    
    rl.question('Press Enter to return to main menu...', () => showMainMenu());
}

async function resolveError() {
    console.log('\n--- Resolve Sorter Error ---');
    if (!activeError) {
        console.log('No active error currently simulated. Checking database for unresolved errors...');
        try {
            const { body: errList } = await makeRequest('GET', '/api/wms/white/errors', {});
            if (errList && errList.success && errList.data && errList.data.length > 0) {
                activeError = {
                    uniqueId: errList.data[0].unique_id,
                    errorCode: errList.data[0].error_code
                };
                console.log(`Found active error: ${activeError.errorCode} (ID: ${activeError.uniqueId})`);
            } else {
                console.log('No active errors found. Nothing to resolve.');
                rl.question('Press Enter to return to main menu...', () => showMainMenu());
                return;
            }
        } catch (err) {
            console.error('Error fetching unresolved errors:', err.message);
            rl.question('Press Enter to return to main menu...', () => showMainMenu());
            return;
        }
    }

    try {
        console.log(`Sending recovery signal for Error ID: ${activeError.uniqueId}...`);
        const res = await makeRequest('POST', '/api/wms/white/error/recover', {
            systemId: SYSTEM_ID,
            errorCode: activeError.errorCode,
            uniqueId: activeError.uniqueId
        });

        if (res.body.success) {
            console.log('🟢 Recovery reported successfully! Sorter is back to operational state.');
            activeError = null;
        } else {
            console.log('❌ Failed to report recovery:', res.body.msg);
        }
    } catch (err) {
        console.error('❌ Connection error:', err.message);
    }

    rl.question('Press Enter to return to main menu...', () => showMainMenu());
}

// Start CLI
showMainMenu();
