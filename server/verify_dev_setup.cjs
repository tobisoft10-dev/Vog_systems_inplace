const fs = require('fs');
const path = require('path');

function verifySetup() {
    console.log('🔍 Verifying BSip Development Environment Setup...\n');

    const backupDir = 'D:\\VOG_SIPARIS2_BACKUP';
    const devDir = 'D:\\bsipdev';
    const solutionFile = 'D:\\bsipdev\\src\\solution.sln';
    const csprojFile = 'D:\\bsipdev\\src\\BSip\\BSip.csproj';

    console.log(`1. Backup Folder (${backupDir}): ${fs.existsSync(backupDir) ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`2. Dev Folder (${devDir}): ${fs.existsSync(devDir) ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`3. Solution File (${solutionFile}): ${fs.existsSync(solutionFile) ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`4. C# Project File (${csprojFile}): ${fs.existsSync(csprojFile) ? '✅ EXISTS' : '❌ MISSING'}`);

    if (fs.existsSync(path.join(devDir, 'src', 'BSip'))) {
        const files = fs.readdirSync(path.join(devDir, 'src', 'BSip'));
        console.log(`\n📁 C# Project directory contains ${files.length} top-level items (Forms, Models, UI, Repositories).`);
    }
}

verifySetup();
