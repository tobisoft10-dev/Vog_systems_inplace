const { execSync } = require('child_process');
const fs = require('fs');

fs.writeFileSync('tmp_q.sql', 'SET NOCOUNT ON; SELECT TOP 35 Id, Model, ParcaNo, Detay5 FROM [SIPARIS].[dbo].[Siparisler] WHERE ParcaNo IS NOT NULL AND ParcaNo != \'\' AND ParcaNo NOT LIKE \'%PVOG%\' ORDER BY Id DESC FOR JSON PATH');
execSync('sqlcmd -S .\\SQLEXPRESS -U sa -P "150609%M" -d SIPARIS -f 65001 -w 65535 -y 0 -i tmp_q.sql -o tmp_out.json', { stdio: 'pipe' });
const raw = fs.readFileSync('tmp_out.json', 'utf8').replace(/^\uFEFF/, '');
const data = JSON.parse(raw);
data.forEach(r => console.log(r.Id, '|', r.ParcaNo, '|', r.Model));
try { fs.unlinkSync('tmp_q.sql'); fs.unlinkSync('tmp_out.json'); } catch(e){}







