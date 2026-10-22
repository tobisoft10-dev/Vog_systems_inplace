const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("==========================================================================");
console.log("🚀 TRIGGERING LIVE LOGO DISPATCH SYNC TEST (ORDER #16861)");
console.log("==========================================================================\n");

try {
    const app = require('./app.js');
    console.log("Calling syncOrderToLogoErp for Order #16861...");
} catch(e) {
    console.log("Trigger log:", e.message);
}
