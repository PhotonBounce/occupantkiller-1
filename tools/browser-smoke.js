#!/usr/bin/env node
/*
  browser-smoke.js — can a browser start on this runner at all?

  Isolates one variable. Capture and usability jobs have hung inside
  chromium.launch() for 24-59 minutes while printing nothing, with both my own
  120s deadline AND Playwright's internal 30s launch timeout failing to fire.
  Two independent timers that never fire means the event loop is blocked, so no
  in-script timeout can help and no conclusion about the GAME can be drawn —
  the browser never got far enough to load it.

  This launches with one flag set, opens about:blank, prints the browser
  version, and exits. No game, no WebGL, no server. If this hangs too, the
  problem is the runner or the flags; if it passes, the game page is back in
  scope. Either way it answers in seconds instead of an hour.

  FLAGS=<name> picks the variant. Run under the shell's `timeout` so a blocked
  loop cannot outlive the step.
*/
let chromium;
try { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
catch (e) { ({ chromium } = require('playwright')); }

const VARIANTS = {
  // What the capture and usability tools use today.
  current: ['--use-gl=swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage', '--mute-audio', '--no-sandbox'],
  // Same minus --ignore-gpu-blocklist, which forces GPU paths a software
  // rasteriser may not be ready for.
  noblocklist: ['--use-gl=swiftshader', '--disable-dev-shm-usage', '--mute-audio', '--no-sandbox'],
  // ANGLE over SwiftShader — the combination Chrome itself ships for software
  // WebGL, rather than the raw GL passthrough.
  angle: ['--use-gl=angle', '--use-angle=swiftshader', '--disable-dev-shm-usage', '--mute-audio', '--no-sandbox'],
  // No GPU flags at all; let Chromium choose.
  plain: ['--no-sandbox', '--disable-dev-shm-usage', '--mute-audio'],
  // Absolute minimum.
  bare: ['--no-sandbox'],
};

const name = process.env.FLAGS || 'current';
const args = VARIANTS[name];
if (!args) { console.log('unknown FLAGS=' + name); process.exit(2); }

/* MODE adds back, one at a time, what the real capture tools do around the
   launch — because a bare launch with these exact flags takes 0.1s here while
   the capture tools hang at the same call for tens of minutes.

     blank   launch, about:blank                       (the passing baseline)
     server  start the static server FIRST and launch
             from inside its listen callback, as the
             capture tools do                           <- prime suspect
     game    server + launch + load the real game page

   Whichever mode first stops finishing is the cause. */
const MODE = process.env.MODE || 'blank';
const PORT = parseInt(process.env.PORT || '4955', 10);

const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

const t0 = Date.now();
const el = () => ((Date.now() - t0) / 1000).toFixed(1) + 's';
const say = m => { console.log('[' + el() + '] ' + m); };

function startServer() {
  return new Promise(resolve => {
    const server = http.createServer((q, s) => {
      let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
      const fp = path.join(ROOT, p);
      if (!fp.startsWith(ROOT)) { s.writeHead(403); return s.end(); }
      fs.readFile(fp, (e, d) => {
        if (e) { s.writeHead(404); return s.end('404'); }
        s.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' }); s.end(d);
      });
    });
    server.listen(PORT, () => resolve(server));
  });
}

async function run() {
  say('variant=' + name + ' mode=' + MODE + '  args=' + args.join(' '));

  let server = null;
  if (MODE !== 'blank') {
    server = await startServer();
    say('static server listening on :' + PORT);
  }

  const b = await chromium.launch({ headless: true, args, timeout: 60000 });
  say('launched: ' + b.version());
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  say('context');
  const pg = await ctx.newPage();
  say('page');

  if (MODE === 'game') {
    pg.on('pageerror', e => say('  pageerror: ' + e.message));
    await pg.goto('http://localhost:' + PORT + '/index.html', { waitUntil: 'commit', timeout: 60000 });
    say('navigated to the game');
    await pg.waitForFunction(() => typeof window.GameManager !== 'undefined', null, { timeout: 240000 })
      .then(() => say('GameManager present'))
      .catch(() => say('[warn] GameManager never appeared'));
    await pg.waitForFunction(() => {
      const p = document.getElementById('boot-preloader');
      return !p || p.style.opacity === '0' || getComputedStyle(p).display === 'none';
    }, null, { timeout: 240000 }).then(() => say('boot bar finished')).catch(() => say('[warn] boot bar never finished'));
  } else {
    await pg.goto('about:blank');
    say('about:blank');
  }

  // Does WebGL actually come up? This is what the game needs and what a
  // software rasteriser is most likely to stall on.
  const gl = MODE === 'game' ? { skipped: true } : await pg.evaluate(() => {
    try {
      const c = document.createElement('canvas');
      const g = c.getContext('webgl2') || c.getContext('webgl');
      if (!g) return { ok: false, why: 'no context' };
      const d = g.getExtension('WEBGL_debug_renderer_info');
      return { ok: true, renderer: d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER) };
    } catch (e) { return { ok: false, why: String(e) }; }
  });
  console.log('[' + el() + '] webgl: ' + JSON.stringify(gl));

  await b.close();
  if (server) server.close();
  say('PASS variant=' + name + ' mode=' + MODE);
  process.exit(0);
}

run().catch(e => {
  say('FAIL variant=' + name + ' mode=' + MODE + ': ' + e.message);
  process.exit(1);
});
