const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

const ips = ['192.168.1.250', '192.168.1.234', '192.168.1.100', '192.168.1.101', '192.168.1.200', '192.168.1.222', '192.168.1.225'];
const ports = [1433, 1434, 33082, 32001];

console.log("==========================================================================");
console.log("🔍 SCANNING NETWORK FOR LOGO SQL SERVER INSTANCES & PORTS");
console.log("==========================================================================\n");

function checkPort(ip, port) {
    return new Promise(resolve => {
        const socket = new net.Socket();
        socket.setTimeout(300);
        socket.on('connect', () => {
            socket.destroy();
            resolve({ ip, port, open: true });
        });
        socket.on('error', () => { socket.destroy(); resolve({ ip, port, open: false }); });
        socket.on('timeout', () => { socket.destroy(); resolve({ ip, port, open: false }); });
        socket.connect(port, ip);
    });
}

async function scan() {
    for (const ip of ips) {
        for (const port of ports) {
            const res = await checkPort(ip, port);
            if (res.open) {
                console.log(`🎯 OPEN PORT FOUND: IP ${ip} : PORT ${port}`);
            }
        }
    }
}

scan();
