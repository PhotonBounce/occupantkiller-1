// Isolated weapon-model inspector: renders each gun mesh centered on a neutral
// background via a separate offscreen renderer, captured through toDataURL.
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OUT = path.join(__dirname, 'screenshots', 'wpninspect');
fs.mkdirSync(OUT, { recursive: true });
const ONLY = process.env.ONLY ? process.env.ONLY.split(',').map(Number) : null;

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'] });
  const p = await b.newPage();
  await p.setViewport({ width: 640, height: 420 });
  const noAuto = process.env.NOAUTO === '1', noUnify = process.env.NOUNIFY === '1';
  await p.evaluateOnNewDocument((na, nu) => { window.__QA_MODE = true; if (na) window.__noAutoDetail = true; if (nu) window.__noUnify = true; }, noAuto, noUnify);
  const SUF = process.env.SUF || '';
  await p.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
  for (let i = 0; i < 60 && !(await p.evaluate(() => typeof window.GameManager !== 'undefined')); i++) await sleep(300);
  await p.evaluate(() => { Object.defineProperty(document, 'pointerLockElement', { get: () => document.body, configurable: true }); if (window.forceStartGame) window.forceStartGame(); });
  await sleep(3500);

  // build the isolated inspector inside the page
  await p.evaluate(() => {
    window.__insp = (function () {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x202428);
      const cam = new THREE.PerspectiveCamera(35, 640 / 420, 0.01, 100);
      const hemi = new THREE.HemisphereLight(0xffffff, 0x606060, 2.0); scene.add(hemi);
      const key = new THREE.DirectionalLight(0xffffff, 2.6); key.position.set(2, 3, 4); scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 1.4); fill.position.set(-2, 1, 3); scene.add(fill);
      const rim = new THREE.DirectionalLight(0x88aaff, 1.2); rim.position.set(-3, 1, -2); scene.add(rim);
      const amb = new THREE.AmbientLight(0xffffff, 0.5); scene.add(amb);
      const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 420;
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
      renderer.setSize(640, 420);
      let holder = new THREE.Group(); scene.add(holder);
      return {
        show: function (mesh) {
          holder.clear();
          const m = mesh.clone(true);
          m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); m.scale.set(1, 1, 1);
          holder.add(m);
          // frame it
          const box = new THREE.Box3().setFromObject(m);
          const c = box.getCenter(new THREE.Vector3());
          const sz = box.getSize(new THREE.Vector3());
          m.position.sub(c); // center at origin
          const radius = Math.max(sz.x, sz.y, sz.z) * 0.5 || 0.3;
          // 3/4 view
          holder.rotation.set(0.18, -0.7, 0);
          const dist = radius / Math.tan((35 * Math.PI / 180) / 2) * 1.5;
          cam.position.set(0, radius * 0.25, dist);
          cam.lookAt(0, 0, 0);
          renderer.render(scene, cam);
          return canvas.toDataURL('image/jpeg', 0.9);
        }
      };
    })();
  });

  const wc = await p.evaluate(() => { try { if (!window.GameManager.isGodMode()) window.GameManager.toggleGodMode(); } catch (e) {} return window.Weapons.getWeaponCount(); });
  for (let i = 0; i < wc; i++) {
    if (ONLY && ONLY.indexOf(i) < 0) continue;
    const data = await p.evaluate((idx) => {
      try {
        window.Weapons.switchTo(idx);
        const cam = window.GameManager.getCamera();
        // find the visible gun mesh child carrying muzzlePos
        let gm = cam.children.filter(c => c.visible && c.userData && c.userData.muzzlePos);
        let mesh = gm.length ? gm[gm.length - 1] : null;
        if (!mesh) { // fallback: any visible group child
          mesh = cam.children.filter(c => c.visible && c.type === 'Group').pop();
        }
        if (!mesh) return { err: 'no mesh', name: window.Weapons.getCurrentName() };
        return { img: window.__insp.show(mesh), name: window.Weapons.getCurrentName() };
      } catch (e) { return { err: e.message }; }
    }, i);
    if (data && data.img) {
      const b64 = data.img.replace(/^data:image\/jpeg;base64,/, '');
      const fn = String(i).padStart(2, '0') + '-' + (data.name || 'w').replace(/[^a-z0-9]/gi, '').slice(0, 16) + SUF + '.jpg';
      fs.writeFileSync(path.join(OUT, fn), Buffer.from(b64, 'base64'));
      process.stdout.write(i + ':' + (data.name || '') + ' ');
    } else {
      process.stdout.write(i + ':ERR(' + (data && data.err) + ') ');
    }
  }
  console.log('\nINSPECT done');
  await b.close();
})().catch(e => console.log('INSPERR', e.message));
