const fs = require('fs');
const path = require('path');

const brandFiles = [
    'koli_etiketi_ford.html',
    'koli_etiketi_seat.html',
    'koli_etiketi_skoda.html',
    'koli_etiketi_vw.html',
    'koli_etiketi_borusan.html',
    'koli_etiketi_scania.html',
    'koli_etiketi_acibadem.html'
];

const templateBase = fs.readFileSync(path.join(__dirname, 'templates', 'koli_etiketi.html'), 'utf8');

for (const f of brandFiles) {
    const filePath = path.join(__dirname, 'templates', f);
    fs.writeFileSync(filePath, templateBase, 'utf8');
    console.log(`Updated ${f}`);
}
