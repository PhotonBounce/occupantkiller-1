#!/usr/bin/env node
/*
  build-showcase-gallery.js — turn captured shots + shard manifests into a
  self-contained public gallery.

  Reads every manifest-*.json under IN, groups the shots into MISSIONS (per
  stage, in play order, so each stage reads as a short sequence) and ARSENAL
  (per weapon), and writes index.html + manifest.json into OUT alongside the
  images.

  Env: IN=dir (default showcase-out)  OUT=dir (default showcase-gallery)
*/
const fs = require('fs'), path = require('path');

const IN = process.env.IN || path.resolve(__dirname, '..', 'showcase-out');
const OUT = process.env.OUT || path.resolve(__dirname, '..', 'showcase-gallery');
const INTERVAL = parseInt(process.env.INTERVAL_MS || '5000', 10) / 1000;

fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });

// When every capture shard fails or is cancelled, download-artifact creates no
// directory at all and this used to die on an ENOENT stack trace, which reads
// like a bug in the gallery rather than what it is: nothing was captured.
if (!fs.existsSync(IN)) {
  console.error('no capture output at ' + IN + ' — every capture shard failed or was cancelled, so there is nothing to build a gallery from.');
  process.exit(1);
}
const entries = fs.readdirSync(IN);
const manifests = entries.filter(f => /^manifest-.*\.json$/.test(f));

let all = [];
for (const m of manifests) {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(IN, m), 'utf8'));
    (j.shots || []).forEach(s => all.push(s));
  } catch (e) { console.error('bad manifest ' + m + ': ' + e.message); }
}

/* Recover frames that no manifest describes.
 *
 * The gallery is rebuilt from every frame ever captured, merged across runs,
 * but frames and manifests have not always been kept together — 182 images
 * from earlier runs exist with no manifest at all. Building from manifests
 * alone silently dropped all of them and produced a gallery of three images,
 * which is exactly the sort of quiet loss that looks like it worked.
 *
 * The filenames are structured, so the metadata can be rebuilt from them:
 *   stage-007-outer-moscow-f003.jpg  ->  stage 7, frame 3
 *   wpn-065-bgm-71-tow-atgm.jpg      ->  weapon 65
 * The display name is reconstructed from the slug, so it is close to the
 * original rather than exactly it. Words containing a digit, and short words,
 * are upper-cased, because weapon names are mostly models and acronyms.
 */
const described = new Set(all.map(s => path.basename(s.file)));
const prettify = slug => slug.split('-').filter(Boolean).map(w =>
  (/\d/.test(w) || w.length <= 3) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)
).join(' ');

let recovered = 0;
for (const f of entries) {
  if (!/\.jpg$/i.test(f) || described.has(f)) continue;
  let m = f.match(/^stage-(\d+)-(.+)-f(\d+)\.jpg$/i);
  if (m) {
    const frame = parseInt(m[3], 10);
    all.push({ file: f, kind: 'stage', stage: parseInt(m[1], 10), stageName: prettify(m[2]),
               frame, tSec: frame * INTERVAL, recovered: true });
    recovered++; continue;
  }
  m = f.match(/^wpn-(\d+)-(.+)\.jpg$/i);
  if (m) {
    all.push({ file: f, kind: 'weapon', weaponIdx: parseInt(m[1], 10), weapon: prettify(m[2]),
               recovered: true });
    recovered++; continue;
  }
  console.error('unrecognised image name, skipped: ' + f);
}
if (recovered) console.log('  recovered ' + recovered + ' frame(s) from filenames (no manifest)');

if (!all.length) { console.error('no shots found in ' + IN); process.exit(1); }
// Copy the images that actually exist; a shard that died mid-run must not
// leave the gallery pointing at files that were never written.
const kept = [];
for (const s of all) {
  const src = path.join(IN, s.file);
  if (!fs.existsSync(src)) { console.error('missing image, dropped: ' + s.file); continue; }
  fs.copyFileSync(src, path.join(OUT, 'shots', path.basename(s.file)));
  s.file = 'shots/' + path.basename(s.file);
  kept.push(s);
}

const missions = kept.filter(s => s.kind === 'stage')
  .sort((a, b) => (a.stage - b.stage) || (a.frame - b.frame));
const arsenal = kept.filter(s => s.kind === 'weapon')
  .sort((a, b) => a.weaponIdx - b.weaponIdx);

const byStage = new Map();
for (const s of missions) {
  if (!byStage.has(s.stage)) byStage.set(s.stage, { stage: s.stage, name: s.stageName || ('STAGE ' + s.stage), shots: [] });
  byStage.get(s.stage).shots.push(s);
}
const stages = [...byStage.values()].sort((a, b) => a.stage - b.stage);

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const tile = (s, label, sub) => `
      <figure class="shot" data-full="${esc(s.file)}">
        <img src="${esc(s.file)}" alt="${esc(label)}" loading="lazy" width="1280" height="720">
        <figcaption><b>${esc(label)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</figcaption>
      </figure>`;

const missionHtml = stages.map(st => `
    <section class="mission" id="stage-${st.stage}">
      <h3><span class="num">${String(st.stage).padStart(2, '0')}</span> ${esc(st.name)}
        <small>${st.shots.length} frames · ${INTERVAL}s apart</small></h3>
      <div class="grid">${st.shots.map(s =>
  tile(s, `+${(s.tSec != null ? s.tSec : 0)}s`, s.weapon || '')).join('')}
      </div>
    </section>`).join('');

const arsenalHtml = arsenal.length ? `
    <section class="mission" id="arsenal">
      <h3><span class="num">★</span> ARSENAL <small>${arsenal.length} weapons, live fire</small></h3>
      <div class="grid">${arsenal.map(s =>
  tile(s, s.weapon || ('Weapon ' + s.weaponIdx), s.stageName || '')).join('')}
      </div>
    </section>` : '';

const nav = stages.map(st =>
  `<a href="#stage-${st.stage}">${String(st.stage).padStart(2, '0')} ${esc(st.name)}</a>`).join('')
  + (arsenal.length ? '<a href="#arsenal">★ ARSENAL</a>' : '');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Occupant Killer — Gameplay Gallery</title>
<meta name="description" content="Gameplay captures from every mission in Occupant Killer, plus the full arsenal in live fire.">
<style>
  :root{--bg:#0b0e0c;--panel:#121714;--ink:#dfe7e0;--dim:#8fa094;--acc:#c8ff4d;--line:#222b25}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);
       font:15px/1.5 "Segoe UI",system-ui,-apple-system,sans-serif}
  header{padding:38px 22px 20px;border-bottom:1px solid var(--line);
         background:linear-gradient(180deg,#151b16,#0b0e0c)}
  h1{margin:0;font-size:30px;letter-spacing:2px;text-transform:uppercase}
  h1 span{color:var(--acc)}
  .tag{color:var(--dim);margin-top:8px;max-width:70ch}
  .stat{display:flex;gap:26px;margin-top:16px;flex-wrap:wrap}
  .stat div{font-size:13px;color:var(--dim)}
  .stat b{display:block;font-size:22px;color:var(--acc)}
  nav{position:sticky;top:0;z-index:5;display:flex;gap:6px;overflow-x:auto;
      padding:10px 16px;background:rgba(11,14,12,.94);border-bottom:1px solid var(--line);
      backdrop-filter:blur(6px)}
  nav a{flex:0 0 auto;color:var(--dim);text-decoration:none;font-size:12px;
        padding:6px 10px;border:1px solid var(--line);border-radius:5px;white-space:nowrap}
  nav a:hover{color:var(--acc);border-color:var(--acc)}
  main{padding:22px 16px 60px;max-width:1500px;margin:0 auto}
  .mission{margin:0 0 42px}
  .mission h3{display:flex;align-items:center;gap:12px;margin:0 0 14px;
              font-size:17px;letter-spacing:1.5px;text-transform:uppercase;
              border-left:3px solid var(--acc);padding-left:12px}
  .num{color:var(--acc);font-variant-numeric:tabular-nums}
  .mission small{margin-left:auto;color:var(--dim);font-size:12px;
                 letter-spacing:.4px;text-transform:none}
  .grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(310px,1fr))}
  .shot{margin:0;background:var(--panel);border:1px solid var(--line);border-radius:7px;
        overflow:hidden;cursor:zoom-in;transition:border-color .15s,transform .15s}
  .shot:hover{border-color:var(--acc);transform:translateY(-2px)}
  .shot img{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;background:#000}
  figcaption{padding:8px 10px;font-size:12px;display:flex;justify-content:space-between;gap:8px}
  figcaption b{color:var(--acc);font-weight:600}
  figcaption span{color:var(--dim);text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  footer{border-top:1px solid var(--line);padding:22px;color:var(--dim);font-size:12px;text-align:center}
  #lb{position:fixed;inset:0;background:rgba(0,0,0,.93);display:none;
      align-items:center;justify-content:center;z-index:50;cursor:zoom-out;padding:20px}
  #lb img{max-width:100%;max-height:100%;border:1px solid var(--line);border-radius:6px}
  @media (max-width:620px){h1{font-size:22px}.grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<header>
  <h1>Occupant <span>Killer</span> — Gameplay Gallery</h1>
  <p class="tag">Captured from real play, not posed scenes: the camera tracks live enemies and
     pulls the actual trigger. Mission frames are ${INTERVAL} seconds apart.</p>
  <div class="stat">
    <div><b>${stages.length}</b>missions</div>
    <div><b>${missions.length}</b>gameplay frames</div>
    <div><b>${arsenal.length}</b>weapons</div>
    <div><b>${kept.length}</b>captures total</div>
  </div>
</header>
<nav>${nav}</nav>
<main>
${missionHtml}
${arsenalHtml}
</main>
<footer>Occupant Killer · generated ${new Date().toISOString().slice(0, 10)}</footer>
<div id="lb"><img alt=""></div>
<script>
  var lb = document.getElementById('lb'), lbImg = lb.querySelector('img');
  document.addEventListener('click', function (e) {
    var f = e.target.closest('.shot');
    if (f) { lbImg.src = f.dataset.full; lb.style.display = 'flex'; return; }
    if (e.target === lb || e.target === lbImg) { lb.style.display = 'none'; lbImg.src = ''; }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { lb.style.display = 'none'; lbImg.src = ''; }
  });
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(OUT, 'index.html'), html);
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({
  generated: new Date().toISOString(),
  missions: stages.length, frames: missions.length, weapons: arsenal.length, total: kept.length,
  intervalSec: INTERVAL, shots: kept,
}, null, 1));

console.log(`gallery -> ${OUT}`);
console.log(`  ${stages.length} missions, ${missions.length} gameplay frames, ${arsenal.length} weapons, ${kept.length} images`);
