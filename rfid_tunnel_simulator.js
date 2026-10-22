/**
 * VOG Tekstil Premium - RFID SICK RFU630 Tunnel Simulator
 * 
 * This script simulates physical garment batches moving on a conveyor belt 
 * through a SICK RFU630 RFID Tunnel, streaming reads to the VOG backend API.
 */

const http = require('http');
const readline = require('readline');

const BACKEND_URL = 'http://localhost:3001';
const DEBUG_TOKEN = 'VOG16546NNF5351ADD123123';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Helper to make HTTP requests
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

// Generate unique mock EPC RFID Tag
function generateEPC(barcode) {
    const hexTime = Date.now().toString(16).toUpperCase().padStart(8, '0');
    const hexRand = Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0');
    // Standard 24-char hex RFID EPC
    return `30395D${barcode ? barcode.padEnd(10, '0').substring(0, 10) : '0000000000'}${hexTime}${hexRand}`.substring(0, 24);
}

async function startSimulator() {
    console.clear();
    console.log('========================================================');
    console.log('       VOG TEKSTIL - SICK RFID TUNNEL SIMULATOR v2.0    ');
    console.log('========================================================');
    console.log(`Connecting to Backend: ${BACKEND_URL}`);
    
    try {
        // Fetch active orders
        console.log('Fetching active B2B orders from database...');
        const { body: response } = await makeRequest('GET', '/api/orders/list', {});
        
        if (!response || !response.success || !response.data || response.data.length === 0) {
            console.log('❌ No active orders found in the database. Please create an order first.');
            rl.close();
            return;
        }

        const orders = response.data;
        console.log('\nSelect an order to simulate RFID scanning:');
        orders.forEach((order, index) => {
            console.log(`[${index + 1}] Order No: ${order.order_number} | Brand: ${order.brand} | Product: ${order.product_name} | Qty: ${order.quantity} | Status: ${order.status}`);
        });

        rl.question('\nEnter option number (or q to exit): ', async (answer) => {
            if (answer.toLowerCase() === 'q') {
                rl.close();
                return;
            }

            const selectionIndex = parseInt(answer) - 1;
            if (isNaN(selectionIndex) || selectionIndex < 0 || selectionIndex >= orders.length) {
                console.log('❌ Invalid selection. Restarting...');
                setTimeout(startSimulator, 1500);
                return;
            }

            const selectedOrder = orders[selectionIndex];
            console.log(`\nSelected Order: No ${selectedOrder.order_number} (${selectedOrder.product_name})`);
            
            rl.question('How many units do you want to scan? ', async (scanQtyInput) => {
                let scanQty = parseInt(scanQtyInput);
                if (isNaN(scanQty) || scanQty <= 0) {
                    scanQty = selectedOrder.quantity;
                }

                console.log(`\n🚀 Starting conveyor belt simulation. Scanning ${scanQty} items...`);
                console.log('Press Ctrl+C at any time to stop.\n');

                let scannedCount = 0;
                const barcode = selectedOrder.sku || 'VOG868001';

                const interval = setInterval(async () => {
                    if (scannedCount >= scanQty) {
                        clearInterval(interval);
                        console.log('\n========================================================');
                        console.log(`🎉 Simulation Finished! Successfully scanned ${scannedCount} items.`);
                        console.log('========================================================');
                        rl.close();
                        return;
                    }

                    scannedCount++;
                    const epc = generateEPC(barcode);
                    
                    try {
                        // POST to specialized tunnel scan endpoint
                        const payload = {
                            token: DEBUG_TOKEN,
                            order_id: selectedOrder.order_number,
                            scanneds: [
                                { rfid_tag: epc, barcode: barcode }
                            ]
                        };

                        const res = await makeRequest('POST', '/api/tunnel/scan', payload);
                        if (res.body.success) {
                            console.log(`[SCAN ${scannedCount}/${scanQty}] Tag: ${epc} | SKU: ${barcode} -> [OK]`);
                        } else {
                            console.log(`[SCAN ${scannedCount}/${scanQty}] Tag: ${epc} -> Failed: ${res.body.message}`);
                        }
                    } catch (err) {
                        console.log(`[SCAN ${scannedCount}/${scanQty}] Tag: ${epc} -> Connection Error: ${err.message}`);
                    }
                }, 500); // 500ms between items (simulating conveyor speed)
            });
        });

    } catch (error) {
        console.error('❌ Connection Error: Ensure server is running on port 3001.', error.message);
        rl.close();
    }
}

startSimulator();
