// Times VoxelWorld.generateLevel() for each level id so we can see which levels
// are pathologically slow to build. Level build is synchronous, so a slow level
// freezes the tab — on a weak device that is a multi-minute hang at stage start.
// Usage: PORT=4600 node tools/level-profile.js [id,id,...]
const http = require('http'), fs = require('fs'), path = require('path');
let chromium;
try { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
catch (e) { ({ chromium } = require('playwright')); }
const ROOT = __dirname.replace(/\/tools$/, '');
const PORT = parseInt(process.env.PORT || '4600', 10);
const ONLY = (process.argv[2] || '').split(',').filter(Boolean);
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const server = http.createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const fp = path.join(ROOT, p);
  if (!fp.startsWith(ROOT)) { s.writeHead(403); return s.end(); }
  fs.readFile(fp, (e, d) => {
    if (e) { s.writeHead(404); return s.end('404'); }
    s.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' }); s.end(d);
  });
});
server.listen(PORT, async () => {
  const b = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] });
  const pg = await (await b.newContext({ viewport: { width: 400, height: 300 } })).newPage();
  await pg.goto('http://localhost:' + PORT + '/index.html', { waitUntil: 'commit', timeout: 30000 });
  await pg.waitForFunction(() => typeof window.VoxelWorld !== 'undefined' && !!VoxelWorld.generateLevel && typeof window.GameManager !== 'undefined', { timeout: 90000 });
  // VoxelWorld needs a scene before it can build.
  await pg.evaluate(() => {
    if (!window.__profScene) {
      window.__profScene = new THREE.Scene();
      try { VoxelWorld.init(window.__profScene); } catch (e) { window.__initErr = e.message; }
    }
  });
  const ids = ONLY.length ? ONLY : await pg.evaluate(() => {
    const out = []; for (let i = 0; i < 20; i++) { try { const d = VoxelWorld.getLevelDef(i); if (d && d.id) out.push(d.id); } catch (e) { } }
    return out;
  });
  console.log('profiling ' + ids.length + ' levels');
  for (const id of ids) {
    let r;
    try {
      r = await pg.evaluate((lid) => {
        const t = performance.now();
        try { VoxelWorld.generateLevel(lid); } catch (e) { return { id: lid, err: String(e.message || e).slice(0, 90) }; }
        const ms = Math.round(performance.now() - t);
        // Unique materials drive shader-program compiles, which dominate the
        // first frame on a software/weak GPU. Unique geometries drive memory.
        let meshes = 0; const mats = new Set(), geos = new Set();
        window.__profScene.traverse(function (o) {
          if (!o.isMesh) return; meshes++;
          const mm = Array.isArray(o.material) ? o.material : [o.material];
          mm.forEach(function (m) { if (m) mats.add(m.uuid); });
          if (o.geometry) geos.add(o.geometry.uuid);
        });
        return { id: lid, ms: ms, meshes: meshes, materials: mats.size, geometries: geos.size };
      }, id);
    } catch (e) { r = { id: id, err: 'evaluate failed/timeout' }; }
    console.log((r.ms != null ? String(r.ms).padStart(6) + 'ms' : '     ?ms')
      + '  meshes=' + String(r.meshes == null ? '?' : r.meshes).padStart(5)
      + '  materials=' + String(r.materials == null ? '?' : r.materials).padStart(5)
      + '  geos=' + String(r.geometries == null ? '?' : r.geometries).padStart(5)
      + '  ' + r.id + (r.err ? '  ERR ' + r.err : ''));
  }
  await b.close(); server.close(); process.exit(0);
});
