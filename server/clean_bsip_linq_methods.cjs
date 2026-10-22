const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath, callback);
        } else {
            callback(fullPath);
        }
    });
}

function cleanAll() {
    // 1. Fix all Migrations files
    const migrationsDir = 'D:/bsipdev/src/BSip/Migrations';
    if (fs.existsSync(migrationsDir)) {
        walkDir(migrationsDir, filePath => {
            if (!filePath.endsWith('.cs')) return;
            let content = fs.readFileSync(filePath, 'utf8');
            content = content.replace(/\(<>[fF]__AnonymousType\d+<[^>]+>\s*t\)/g, 't');
            content = content.replace(/base\.DropTable\(([^,)]+),\s*null\);/g, 'base.DropTable($1);');
            fs.writeFileSync(filePath, content, 'utf8');
        });
        console.log('✅ Fixed Migrations files!');
    }

    // 2. Fix KeyChecker.cs
    const keyCheckerFile = 'D:/bsipdev/src/BSip/Library/KeyChecker.cs';
    if (fs.existsSync(keyCheckerFile)) {
        let content = fs.readFileSync(keyCheckerFile, 'utf8');
        content = content.replace(/Logger\.GetErrorMessage\(ex,\s*false\)/g, 'Logger.GetErrorMessage(ex)');
        fs.writeFileSync(keyCheckerFile, content, 'utf8');
        console.log('✅ Fixed KeyChecker.cs!');
    }

    // 3. Fix Util.cs
    const utilFile = 'D:/bsipdev/src/BSip/Library/Util.cs';
    if (fs.existsSync(utilFile)) {
        let content = fs.readFileSync(utilFile, 'utf8');
        content = content.replace(/<PrivateImplementationDetails>\.ComputeStringHash/g, 'Util.ComputeStringHash');
        if (!content.includes('public static uint ComputeStringHash')) {
            const hashMethod = `
		public static uint ComputeStringHash(string s)
		{
			if (s == null) return 0;
			uint num = 2166136261U;
			for (int i = 0; i < s.Length; i++)
			{
				num = (s[i] ^ num) * 16777619U;
			}
			return num;
		}
`;
            content = content.replace('public static string GetErrorMsg', hashMethod + '\n\t\tpublic static string GetErrorMsg');
        }
        fs.writeFileSync(utilFile, content, 'utf8');
        console.log('✅ Fixed Util.cs!');
    }
}

cleanAll();
