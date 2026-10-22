const fs = require('fs');

const csprojPath = 'D:\\bsipdev\\src\\BSip\\BSip.csproj';
let content = fs.readFileSync(csprojPath, 'utf8');

// Replace HintPath ..\..\..\VOG_SIPARIS2\ with ..\..\..\bsipdev\
content = content.replace(/<HintPath>\.\.\\\.\.\\\.\.\\VOG_SIPARIS2\\/g, '<HintPath>..\\..\\..\\bsipdev\\');

fs.writeFileSync(csprojPath, content, 'utf8');
console.log('✅ Updated BSip.csproj HintPaths to D:\\bsipdev\\!');
