// Copies captured frames into the microsite, writes gallery manifest.
// Run AFTER capture completes:  node tools/pack-microsite.js
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, 'screenshots', 'gallery');
const SITE = path.join(__dirname, '..', 'microsite');
const GAL = path.join(SITE, 'gallery');
fs.mkdirSync(GAL, { recursive: true });

// clear old gallery images
for (const f of fs.readdirSync(GAL)) { if (/\.(jpg|png)$/i.test(f)) fs.unlinkSync(path.join(GAL, f)); }

// copy + collect, sorted by capture order (filename index)
let files = fs.readdirSync(SRC).filter(f => /\.jpg$/i.test(f)).sort();
// reorder: interleave so the grid shows weapon variety early, but keep deterministic
const manifest = [];
for (const f of files) {
  fs.copyFileSync(path.join(SRC, f), path.join(GAL, f));
  manifest.push(f);
}
fs.writeFileSync(path.join(GAL, 'manifest.json'), JSON.stringify(manifest));
console.log('Packed ' + manifest.length + ' screenshots into microsite/gallery/');
console.log('Manifest written: gallery/manifest.json');
