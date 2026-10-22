async function probeR700() {
    const baseUrl = 'http://192.168.0.13/api/v2';
    console.log('🔍 Querying Impinj R700 REST API details...');

    const endpoints = [
        '/system',
        '/profiles/active',
        '/inventory/status',
        '/event-reporting/webhook',
        '/event-reporting/http-stream'
    ];

    for (const ep of endpoints) {
        try {
            const res = await fetch(baseUrl + ep);
            if (res.ok) {
                const json = await res.json();
                console.log(`\n=== Endpoint: ${ep} ===`);
                console.log(JSON.stringify(json, null, 2));
            } else {
                console.log(`⚠️ Endpoint ${ep} returned status: ${res.status}`);
            }
        } catch (e) {
            console.error(`❌ Error querying ${ep}:`, e.message);
        }
    }
}

probeR700();
