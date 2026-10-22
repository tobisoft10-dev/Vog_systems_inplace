const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function setupBsipDev() {
    console.log('🚀 Setting up BSip Development Environment (bsipdev)...\n');

    const sourceDir = 'D:\\VOG_SIPARIS2';
    const backupDir = 'D:\\VOG_SIPARIS2_BACKUP';
    const devDir = 'D:\\bsipdev';
    const srcOutputDir = path.join(devDir, 'src');
    const dnSpyConsole = 'C:\\vog_system\\dnSpy\\dnSpy.Console.exe';

    // 1. Create Backup Folder D:\VOG_SIPARIS2_BACKUP
    if (!fs.existsSync(backupDir)) {
        console.log(`📂 Creating backup directory: ${backupDir}`);
        execSync(`powershell -Command "Copy-Item -Path '${sourceDir}' -Destination '${backupDir}' -Recurse -Force"`);
        console.log(`✅ Backup successfully created at: ${backupDir}`);
    } else {
        console.log(`✔️ Backup directory already exists at: ${backupDir}`);
    }

    // 2. Create Dev Directory D:\bsipdev
    if (!fs.existsSync(devDir)) {
        console.log(`📂 Creating dev directory: ${devDir}`);
        fs.mkdirSync(devDir, { recursive: true });
    }

    // Copy runtime DLLs and configs to D:\bsipdev
    console.log(`📋 Copying runtime assemblies & configs to: ${devDir}...`);
    execSync(`powershell -Command "Copy-Item -Path '${sourceDir}\\*' -Destination '${devDir}' -Recurse -Force"`);
    console.log(`✅ Files copied to ${devDir}.`);

    // 3. Decompile BSip.exe to full C# source project using dnSpy.Console.exe
    if (fs.existsSync(dnSpyConsole)) {
        console.log(`\n⚙️ Decompiling BSip.exe into full C# project at: ${srcOutputDir}...`);

        try {
            execSync(`"${dnSpyConsole}" -o "${srcOutputDir}" "${path.join(sourceDir, 'BSip.exe')}"`, { stdio: 'inherit' });
            console.log(`\n🎉 SUCCESS! BSip.exe decompiled into full C# project at: ${srcOutputDir}`);
        } catch (e) {
            console.error('❌ Decompilation error:', e.message);
        }
    } else {
        console.error('❌ dnSpy.Console.exe not found at:', dnSpyConsole);
    }
}

setupBsipDev();
