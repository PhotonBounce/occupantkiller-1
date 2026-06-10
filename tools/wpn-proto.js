// Standalone weapon-model PROTOTYPES for review. Clean, few-part builders
// focused on each weapon's iconic side-profile silhouette. Rendered side-on
// with bright even lighting. Not wired into the game — review only.
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OUT = path.join(__dirname, 'screenshots', 'proto');
fs.mkdirSync(OUT, { recursive: true });

// Builders run in the browser (THREE is global). Long axis = X (muzzle toward -X),
// up = Y, thickness = Z. Side profile is viewed down the +Z axis.
const BUILDERS = `
window.PROTO = {};
function M(hex, opts){ return new THREE.MeshStandardMaterial(Object.assign({color:hex, metalness:0.45, roughness:0.55}, opts||{})); }
function box(w,h,d,mat){ return new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat); }
function cyl(r,len,mat,seg){ const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,seg||16), mat); m.rotation.z=Math.PI/2; return m; } // long axis -> X
function at(o,x,y,z){ o.position.set(x,y,z); return o; }

// palette
const GUNMETAL = 0x2b2d31, BLACK = 0x191a1d, WOOD = 0x6e4a2b, PLUM = 0x7a3b2a, TAN = 0xb89b6e, STEEL = 0x4a4d52, POLY = 0x232327;

// ── AK-74M ──────────────────────────────────────────
window.PROTO.ak = function(){
  const g = new THREE.Group();
  const wood = M(PLUM, {roughness:0.7, metalness:0.1});
  const metal = M(GUNMETAL);
  g.add(at(box(0.30,0.075,0.05, metal), 0.02, 0, 0));                 // receiver
  g.add(at(box(0.16,0.055,0.052, wood), -0.18, 0.005, 0));            // lower handguard (wood)
  g.add(at(box(0.13,0.030,0.030, wood), -0.165, 0.05, 0));            // upper handguard
  g.add(at(cyl(0.013,0.34, metal), -0.34, 0.015, 0));                 // barrel
  g.add(at(cyl(0.008,0.36, M(STEEL)), -0.34, -0.022, 0));             // cleaning rod under barrel
  g.add(at(cyl(0.020,0.05, metal), -0.30, 0.05, 0));                  // gas block
  g.add(at(cyl(0.020,0.06, metal), -0.515, 0.015, 0));               // muzzle brake
  g.add(at(box(0.018,0.05,0.045, metal), -0.135, 0.055, 0));          // front sight block
  g.add(at(box(0.025,0.025,0.045, metal), 0.16, 0.05, 0));            // rear sight
  // curved magazine (3 angled segments) — the AK signature
  const mk = M(PLUM,{roughness:0.6,metalness:0.15});
  const m1 = at(box(0.045,0.07,0.04, mk), 0.0, -0.075, 0); m1.rotation.z = 0.12;
  const m2 = at(box(0.040,0.07,0.038, mk), -0.055, -0.13, 0); m2.rotation.z = 0.34;
  const m3 = at(box(0.035,0.05,0.036, mk), -0.10, -0.175, 0); m3.rotation.z = 0.52;
  g.add(m1,m2,m3);
  const grip = at(box(0.035,0.09,0.04, M(POLY)), 0.085,-0.075,0); grip.rotation.z = 0.32; g.add(grip);
  g.add(at(box(0.20,0.06,0.045, wood), 0.27, 0.005, 0));              // wood stock
  return g;
};

// ── M4A1 ────────────────────────────────────────────
window.PROTO.m4 = function(){
  const g = new THREE.Group();
  const metal = M(BLACK,{metalness:0.5,roughness:0.45});
  g.add(at(box(0.26,0.07,0.05, metal), 0.0, 0, 0));                   // upper+lower receiver
  g.add(at(box(0.16,0.022,0.05, metal), 0.0, 0.05, 0));              // flat-top picatinny rail
  g.add(at(cyl(0.030,0.16, metal,18), -0.21, 0.005, 0));             // round ribbed handguard
  g.add(at(cyl(0.011,0.30, M(STEEL)), -0.34, 0.005, 0));             // barrel
  g.add(at(cyl(0.018,0.05, metal), -0.50, 0.005, 0));                // A2 birdcage flash hider
  g.add(at(cyl(0.016,0.04, metal,3), -0.30, 0.055, 0));              // triangular front sight (low-seg cyl)
  // straight STANAG mag (slight curve)
  const mk = M(0x33352b,{roughness:0.6});
  const m1 = at(box(0.040,0.10,0.04, mk), 0.04, -0.085, 0); m1.rotation.z = 0.08;
  g.add(m1);
  const grip = at(box(0.034,0.085,0.04, M(POLY)), 0.105,-0.07,0); grip.rotation.z = 0.30; g.add(grip);
  // collapsible stock: buffer tube + butt
  g.add(at(cyl(0.018,0.13, metal,14), 0.21, 0.005, 0));              // buffer tube
  g.add(at(box(0.085,0.07,0.05, M(POLY)), 0.255, -0.005, 0));        // collapsible butt
  return g;
};

// ── Glock 17 ────────────────────────────────────────
window.PROTO.glock = function(){
  const g = new THREE.Group();
  const poly = M(POLY,{roughness:0.6,metalness:0.2}), slideMat = M(0x232428,{metalness:0.55,roughness:0.4});
  g.add(at(box(0.165,0.040,0.034, slideMat), -0.02, 0.02, 0));        // slide
  g.add(at(box(0.150,0.018,0.030, poly), -0.02, -0.008, 0));          // frame
  g.add(at(cyl(0.008,0.03, M(STEEL)), -0.115, 0.018, 0));            // muzzle peek
  const grip = at(box(0.030,0.085,0.034, poly), 0.055,-0.06,0); grip.rotation.z = 0.18; g.add(grip);
  g.add(at(box(0.030,0.006,0.034, poly), 0.012,-0.045,0));            // trigger guard bottom
  g.add(at(box(0.006,0.030,0.030, poly), -0.02,-0.045,0));            // trigger guard front
  g.add(at(box(0.005,0.012,0.006, M(0x999999)), 0.0,-0.04,0));        // trigger
  g.add(at(box(0.010,0.006,0.006, slideMat), -0.10, 0.044, 0));       // front sight
  g.add(at(box(0.014,0.008,0.024, slideMat), 0.055, 0.044, 0));       // rear sight
  return g;
};

// ── RPG-7 ───────────────────────────────────────────
window.PROTO.rpg = function(){
  const g = new THREE.Group();
  const tube = M(0x35372f,{metalness:0.4,roughness:0.6}), wood = M(WOOD,{metalness:0.1,roughness:0.8});
  g.add(at(cyl(0.030,0.62, tube,18), 0.0, 0, 0));                     // main tube
  g.add(at(cyl(0.045,0.10, tube,18), 0.34, 0, 0));                    // flared rear venturi (cone-ish)
  g.add(at(cyl(0.050,0.09, wood,16), -0.07, 0, 0));                   // front wood heat shield
  g.add(at(cyl(0.050,0.09, wood,16), 0.10, 0, 0));                    // rear wood heat shield
  // PG-7 warhead at the muzzle — the icon: cylindrical body + pointed cone
  const wh = M(0x4a4233,{metalness:0.4,roughness:0.6});
  g.add(at(cyl(0.034,0.10, wh,16), -0.40, 0, 0));                     // warhead body
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.034,0.10,16), wh); cone.rotation.z = Math.PI/2; g.add(at(cone,-0.49,0,0));
  g.add(at(cyl(0.014,0.10, M(STEEL)), -0.30, 0, 0));                 // warhead stem into tube
  const grip = at(box(0.035,0.09,0.04, M(POLY)), 0.0,-0.075,0); grip.rotation.z = 0; g.add(grip);
  g.add(at(box(0.02,0.07,0.03, M(BLACK)), -0.18, 0.06, 0));           // front iron sight
  return g;
};

// ── SVD Dragunov ────────────────────────────────────
window.PROTO.svd = function(){
  const g = new THREE.Group();
  const metal = M(GUNMETAL), wood = M(WOOD,{metalness:0.1,roughness:0.8});
  g.add(at(box(0.24,0.055,0.045, metal), 0.04, 0, 0));               // receiver
  g.add(at(cyl(0.030,0.20, wood,14), -0.18, 0, 0));                  // ventilated handguard
  g.add(at(cyl(0.010,0.46, M(STEEL)), -0.40, 0, 0));                 // long thin barrel
  g.add(at(cyl(0.018,0.05, metal), -0.62, 0, 0));                    // flash hider
  // PSO-1 scope
  g.add(at(cyl(0.018,0.16, M(0x111114),14), 0.02, 0.07, 0));         // scope tube
  g.add(at(box(0.03,0.05,0.03, M(0x111114)), 0.06, 0.045, 0));       // scope mount
  // skeleton wood stock (with thumbhole gap → two struts + cheek)
  g.add(at(box(0.10,0.018,0.04, wood), 0.18, 0.03, 0));              // top strut
  g.add(at(box(0.12,0.018,0.04, wood), 0.20, -0.05, 0));             // bottom strut
  g.add(at(box(0.05,0.075,0.04, wood), 0.265, -0.01, 0));            // butt
  g.add(at(box(0.05,0.02,0.04, wood), 0.165, 0.05, 0));              // cheek riser
  const mk = M(0x2a2c24,{roughness:0.6});
  const m1 = at(box(0.035,0.085,0.038, mk), 0.06, -0.075, 0); m1.rotation.z = 0.12; g.add(m1);
  const grip = at(box(0.032,0.08,0.038, wood), 0.12,-0.06,0); grip.rotation.z = 0.30; g.add(grip);
  return g;
};
`;

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'] });
  const p = await b.newPage();
  await p.setViewport({ width: 720, height: 420 });
  await p.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  // load THREE from the served file, then our builders
  await p.evaluate(() => { /* THREE already loaded by game page */ });
  for (let i = 0; i < 40 && !(await p.evaluate(() => typeof THREE !== 'undefined')); i++) await sleep(200);
  await p.evaluate(BUILDERS);

  const setup = await p.evaluate(() => {
    window.__pr = (function () {
      const scene = new THREE.Scene(); scene.background = new THREE.Color(0x3a4048);
      const cam = new THREE.PerspectiveCamera(30, 720 / 420, 0.01, 100);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x555555, 1.4));
      const k = new THREE.DirectionalLight(0xffffff, 1.6); k.position.set(0.5, 1.5, 3); scene.add(k);
      const f = new THREE.DirectionalLight(0xcfe0ff, 0.8); f.position.set(-1, 0.5, 2); scene.add(f);
      const canvas = document.createElement('canvas'); canvas.width = 720; canvas.height = 420;
      const r = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
      r.setSize(720, 420);
      const holder = new THREE.Group(); scene.add(holder);
      return {
        render: function (name) {
          holder.clear();
          const mesh = window.PROTO[name](); holder.add(mesh);
          const box = new THREE.Box3().setFromObject(mesh);
          const c = box.getCenter(new THREE.Vector3()); const s = box.getSize(new THREE.Vector3());
          mesh.position.sub(c);
          const radius = Math.max(s.x, s.y) * 0.5;
          const dist = radius / Math.tan((30 * Math.PI / 180) / 2) * 1.25;
          cam.position.set(0, 0, dist); cam.lookAt(0, 0, 0);
          r.render(scene, cam);
          return canvas.toDataURL('image/jpeg', 0.92);
        }
      };
    })();
    return Object.keys(window.PROTO);
  });

  for (const name of setup) {
    const data = await p.evaluate((n) => window.__pr.render(n), name);
    fs.writeFileSync(path.join(OUT, name + '.jpg'), Buffer.from(data.replace(/^data:image\/jpeg;base64,/, ''), 'base64'));
    process.stdout.write(name + ' ');
  }
  console.log('\nPROTO done: ' + setup.join(','));
  await b.close();
})().catch(e => console.log('PROTOERR', e.message));
