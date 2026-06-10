// Fast weapon inspector: builds the in-game meshes via Weapons.createGunMesh on
// a throwaway camera WITHOUT starting the heavy game loop, renders each side-on.
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OUT = path.join(__dirname, 'screenshots', 'wpnfast');
fs.mkdirSync(OUT, { recursive: true });
const ONLY = process.env.ONLY ? process.env.ONLY.split(',').map(Number) : null;

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'] });
  const p = await b.newPage();
  await p.setViewport({ width: 720, height: 400 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  for (let i = 0; i < 60 && !(await p.evaluate(() => typeof window.Weapons !== 'undefined' && typeof THREE !== 'undefined')); i++) await sleep(200);

  const info = await p.evaluate(() => {
    const cam = new THREE.PerspectiveCamera(40, 1, 0.01, 100);
    window.Weapons.createGunMesh(cam);
    const meshes = cam.children.filter(c => c.userData && c.userData.muzzlePos);
    // isolated renderer
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x3a4048);
    const rc = new THREE.PerspectiveCamera(32, 720 / 400, 0.01, 100);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x555555, 1.45));
    const k = new THREE.DirectionalLight(0xffffff, 1.5); k.position.set(2.5, 2, 1.5); scene.add(k);
    const f = new THREE.DirectionalLight(0xcfe0ff, 0.8); f.position.set(2, 0.5, -1.5); scene.add(f);
    const canvas = document.createElement('canvas'); canvas.width = 720; canvas.height = 400;
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true }); r.setSize(720, 400);
    const holder = new THREE.Group(); scene.add(holder);
    window.__shoot = function (idx) {
      holder.clear();
      const src = meshes[idx]; if (!src) return null;
      const m = src.clone(true); m.visible = true; m.traverse(o => o.visible = true);
      m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); m.scale.set(1, 1, 1);
      holder.add(m);
      const box = new THREE.Box3().setFromObject(m);
      const c = box.getCenter(new THREE.Vector3()); const s = box.getSize(new THREE.Vector3());
      m.position.sub(c);
      const radius = Math.max(s.z, s.y) * 0.5 || 0.2;
      const dist = radius / Math.tan((32 * Math.PI / 180) / 2) * 1.3;
      rc.position.set(dist, 0, 0); rc.up.set(0, 1, 0); rc.lookAt(0, 0, 0);
      r.render(scene, rc);
      return canvas.toDataURL('image/jpeg', 0.92);
    };
    return { count: meshes.length, names: window.Weapons.getAllWeapons ? null : null };
  });

  const count = info.count;
  for (let i = 0; i < count; i++) {
    if (ONLY && ONLY.indexOf(i) < 0) continue;
    const data = await p.evaluate((idx) => {
      let name = 'w' + idx;
      try { name = (window.Weapons.getWeaponInfo ? window.Weapons.getWeaponInfo(idx).name : ('w' + idx)); } catch (e) {}
      return { img: window.__shoot(idx), name: name };
    }, i);
    if (data && data.img) {
      fs.writeFileSync(path.join(OUT, String(i).padStart(2, '0') + '-' + (data.name || 'w').replace(/[^a-z0-9]/gi, '').slice(0, 16) + '.jpg'), Buffer.from(data.img.replace(/^data:image\/jpeg;base64,/, ''), 'base64'));
      process.stdout.write(i + ' ');
    }
  }
  console.log('\nFAST done count=' + count + ' errs=' + errs.length + (errs.length ? ' :: ' + errs.slice(0, 3).join(' | ') : ''));
  await b.close();
})().catch(e => console.log('FASTERR', e.message));
