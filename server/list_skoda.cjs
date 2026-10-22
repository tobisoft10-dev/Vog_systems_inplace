const { execSync } = require('child_process');
const fs = require('fs');

fs.writeFileSync('tmp_q.sql', 'SET NOCOUNT ON; SELECT Id, Model, ParcaNo FROM [SIPARIS].[dbo].[Siparisler] WHERE Model LIKE \'%SKODA%\' ORDER BY Id DESC FOR JSON PATH');
execSync('sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -d SIPARIS -f 65001 -w 65535 -y 0 -i tmp_q.sql -o tmp_out.json', { stdio: 'pipe' });
const raw = fs.readFileSync('tmp_out.json', 'utf8').replace(/^\uFEFF/, '');
const list = JSON.parse(raw.replace(/[\u0000-\u001F]+/g, ' '));
console.log('Total Skoda orders in MSSQL:', list.length);
list.slice(0, 45).forEach(r => console.log(r.Id, '|', r.ParcaNo, '|', r.Model));

fs.unlinkSync('tmp_q.sql'); 
fs.unlinkSync('tmp_out.json');
