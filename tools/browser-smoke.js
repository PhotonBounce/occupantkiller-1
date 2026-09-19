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

const t0 = Date.now();
const el = () => ((Date.now() - t0) / 1000).toFixed(1) + 's';

(async () => {
  console.log('[' + el() + '] variant=' + name + '  args=' + args.join(' '));
  const b = await chromium.launch({ headless: true, args, timeout: 60000 });
  console.log('[' + el() + '] launched: ' + b.version());
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  console.log('[' + el() + '] context');
  const pg = await ctx.newPage();
  console.log('[' + el() + '] page');
  await pg.goto('about:blank');
  console.log('[' + el() + '] about:blank');

  // Does WebGL actually come up? This is what the game needs and what a
  // software rasteriser is most likely to stall on.
  const gl = await pg.evaluate(() => {
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
  console.log('[' + el() + '] PASS variant=' + name);
  process.exit(0);
})().catch(e => {
  console.log('[' + el() + '] FAIL variant=' + name + ': ' + e.message);
  process.exit(1);
});
