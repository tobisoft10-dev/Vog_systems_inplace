const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, 'templates');
const skodaPath = path.join(templatesDir, 'koli_etiketi_skoda.html');

const skodaTemplate = fs.readFileSync(skodaPath, 'utf8');

const brandConfigs = [
    { filename: 'koli_etiketi_vw.html', title: 'Koli Etiketi - VOLKSWAGEN', logo: 'VOG TEKSTİL &bull; VOLKSWAGEN' },
    { filename: 'koli_etiketi_ford.html', title: 'Koli Etiketi - FORD', logo: 'VOG TEKSTİL &bull; FORD' },
    { filename: 'koli_etiketi_acibadem.html', title: 'Koli Etiketi - ACİBADEM', logo: 'VOG TEKSTİL &bull; ACİBADEM' },
    { filename: 'koli_etiketi_borusan.html', title: 'Koli Etiketi - BORUSAN', logo: 'VOG TEKSTİL &bull; BORUSAN' },
    { filename: 'koli_etiketi_seat.html', title: 'Koli Etiketi - SEAT', logo: 'VOG TEKSTİL &bull; SEAT' },
    { filename: 'koli_etiketi_scania.html', title: 'Koli Etiketi - SCANIA', logo: 'VOG TEKSTİL &bull; SCANIA' },
    { filename: 'koli_etiketi.html', title: 'Koli Etiketi', logo: 'VOG TEKSTİL' },
];

for (const cfg of brandConfigs) {
    let content = skodaTemplate;
    content = content.replace('<title>Koli Etiketi - SKODA</title>', `<title>${cfg.title}</title>`);
    content = content.replace('<div class="logo">VOG TEKSTİL &bull; SKODA</div>', `<div class="logo">${cfg.logo}</div>`);

    const destPath = path.join(templatesDir, cfg.filename);
    fs.writeFileSync(destPath, content, 'utf8');
    console.log(`✅ Synced ${cfg.filename} to match 16706 (SKODA) template perfectly!`);
}

console.log("🎉 ALL TEMPLATES ARE NOW 100% IDENTICAL TO ORDER 16706 (SKODA) TEMPLATE!");
