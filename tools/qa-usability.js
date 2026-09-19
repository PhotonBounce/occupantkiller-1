#!/usr/bin/env node
/*
  qa-usability.js — measures how the game actually READS to a new player.

  This exists because a single real gameplay frame showed the problem no
  functional test could: the game was almost invisible behind its own
  interface, and the HUD was printing "Morale: NaN%" across it. Both are
  commercial problems — someone deciding whether to buy looks at the screen,
  not at the test suite — and neither shows up in a pass/fail probe that only
  asks "is state === playing and does a canvas exist".

  So this measures the screen, in numbers that can be tracked over time:

    hudCoverage      % of the viewport covered by HUD panels
    centreClear      % of the central box (where the player aims) left clear
    panelCount       how many positioned overlays are visible at once
    overlaps         pairs of panels drawn on top of each other
    tinyText         panels with text below a legible size
    nanOnScreen      any visible element printing NaN / undefined / null
    bootMs           time from navigation to playable

  Counts are trusted here; timings are not. CI and the dev sandbox render via
  SwiftShader, where frame times have shown a 34-62x spread on identical code
  (see AGENTS.md). bootMs is reported for tracking, never as a verdict.

  Env: STAGE, VW/VH, PORT, OUT, SETTLE_MS, CLEAN_HUD=1 to measure with the
  Clean HUD (F8) mode on instead of the default HUD.

  Exit code is 0 unless the run could not produce a measurement — this is a
  measuring instrument, not a gate. Thresholds are reported as VERDICT lines
  so a human decides what is acceptable.
*/
const http = require('http'), fs = require('fs'), path = require('path');
let chromium;
try { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
catch (e) { ({ chromium } = require('playwright')); }

const ROOT = process.env.OK_ROOT || path.resolve(__dirname, '..');
const STAGE = parseInt(process.env.STAGE || '0', 10);
const VW = parseInt(process.env.VW || '1280', 10);
const VH = parseInt(process.env.VH || '720', 10);
const PORT = parseInt(process.env.PORT || '4933', 10);
const OUT = process.env.OUT || path.join(ROOT, 'usability-out');
const SETTLE_MS = parseInt(process.env.SETTLE_MS || '15000', 10);
const CLEAN_HUD = process.env.CLEAN_HUD === '1';

// The box a player actually looks at while aiming. Anything drawn in here
// competes directly with the game.
const CENTRE_FRAC = 0.5;

fs.mkdirSync(OUT, { recursive: true });
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

const T0 = Date.now();
const log = m => process.stdout.write('[' + ((Date.now() - T0) / 1000).toFixed(1) + 's] ' + m + '\n');

// Same reasoning as the capture tool: newContext()/newPage() take no timeout
// and can hang forever when the browser wedges bringing up SwiftShader, which
// cost four CI jobs an hour each in silence. Name every wait.
function deadline(p, ms, label) {
  let t;
  return Promise.race([p, new Promise((_, rej) => {
    t = setTimeout(() => rej(new Error('timed out after ' + ms + 'ms in: ' + label)), ms);
  })]).finally(() => clearTimeout(t));
}

server.listen(PORT, async () => {
  let browser = null;
  try {
    log('launching');
    browser = await deadline(chromium.launch({
      headless: true,
      // ANGLE over SwiftShader, NOT raw --use-gl=swiftshader. Measured, not
      // guessed: with '--use-gl=swiftshader --ignore-gpu-blocklist' the game
      // page deadlocks creating its WebGL context and the process hangs
      // forever — no timeout fires, not ours and not Playwright's own. With
      // ANGLE the identical page boots in 4.1s. A bare about:blank WebGL probe
      // passes on BOTH, so only the real context exposes it.
      args: ['--use-gl=angle', '--use-angle=swiftshader', '--disable-dev-shm-usage', '--mute-audio', '--no-sandbox'],
    }), 120000, 'launch');
    const ctx = await deadline(browser.newContext({ viewport: { width: VW, height: VH } }), 90000, 'newContext');
    await deadline(ctx.addInitScript(() => { try { localStorage.setItem('ok_has_played', '1'); } catch (e) {} }), 30000, 'addInitScript');
    const pg = await deadline(ctx.newPage(), 90000, 'newPage');
    const pageErrors = [];
    pg.on('pageerror', e => pageErrors.push(e.message));

    const tNav = Date.now();
    await deadline(pg.goto('http://localhost:' + PORT + '/index.html', { waitUntil: 'commit', timeout: 60000 }), 75000, 'goto');
    await pg.waitForFunction(() => typeof window.GameManager !== 'undefined' && typeof window.Weapons !== 'undefined',
      null, { timeout: 180000 }).catch(() => log('[warn] globals never appeared'));
    await pg.waitForFunction(() => {
      const p = document.getElementById('boot-preloader');
      return !p || p.style.opacity === '0' || getComputedStyle(p).display === 'none';
    }, null, { timeout: 240000 }).catch(() => log('[warn] boot bar wait timed out'));
    log('booted');

    await deadline(pg.evaluate((s) => {
      window.__chosenStartStage = s;
      try { GameManager.startGame(); } catch (e) { window.__startErr = String(e); }
    }, STAGE), 240000, 'startGame');
    await pg.waitForFunction(() => GameManager.getState && GameManager.getState() === 'playing',
      null, { timeout: 120000 }).catch(() => log('[warn] never reached playing'));
    const bootMs = Date.now() - tNav;

    // Let the HUD fully populate. Several of the busiest panels (streaks,
    // challenges, bounties) only appear once play is genuinely under way, so
    // measuring immediately would flatter the result.
    await pg.waitForTimeout(SETTLE_MS);

    if (CLEAN_HUD) {
      await pg.evaluate(() => { try { window.Cinematic && window.Cinematic.set(true); } catch (e) {} });
      await pg.waitForTimeout(1200);
    }

    const rep = await deadline(pg.evaluate((cfg) => {
      const vw = innerWidth, vh = innerHeight;
      const screenArea = vw * vh;
      const cw = vw * cfg.centreFrac, ch = vh * cfg.centreFrac;
      const centre = { l: (vw - cw) / 2, t: (vh - ch) / 2, r: (vw + cw) / 2, b: (vh + ch) / 2 };
      const centreArea = cw * ch;

      const panels = [];
      document.querySelectorAll('body *').forEach(el => {
        let cs; try { cs = getComputedStyle(el); } catch (e) { return; }
        if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return;
        if (cs.position !== 'fixed' && cs.position !== 'absolute') return;
        if (el.tagName === 'CANVAS' && el.id !== 'minimap-canvas' && el.id !== 'tactical-map-canvas') return;
        const r = el.getBoundingClientRect();
        if (r.width < 8 || r.height < 8) return;
        if (r.right < 0 || r.bottom < 0 || r.left > vw || r.top > vh) return;
        // Report leaf-ish panels only: a wrapper and its child would otherwise
        // both count and double the coverage figure.
        const text = (el.innerText || '').trim().replace(/\s+/g, ' ');
        if (el.children.length > 0 && !text) return;
        panels.push({
          id: el.id || null,
          cls: (typeof el.className === 'string' && el.className) ? el.className.split(' ')[0] : null,
          x: Math.round(r.left), y: Math.round(r.top),
          w: Math.round(r.width), h: Math.round(r.height),
          pct: +((r.width * r.height) / screenArea * 100).toFixed(2),
          fontPx: Math.round(parseFloat(cs.fontSize) || 0),
          text: text.slice(0, 70) || null,
        });
      });

      // Union coverage via a coarse occupancy grid. Summing rectangles
      // double-counts everywhere panels overlap, which is exactly where this
      // HUD is worst, and would report well over 100%.
      const GX = 160, GY = 90;
      const grid = new Uint8Array(GX * GY);
      const cgrid = new Uint8Array(GX * GY);
      panels.forEach(p => {
        const x0 = Math.max(0, Math.floor(p.x / vw * GX)), x1 = Math.min(GX - 1, Math.floor((p.x + p.w) / vw * GX));
        const y0 = Math.max(0, Math.floor(p.y / vh * GY)), y1 = Math.min(GY - 1, Math.floor((p.y + p.h) / vh * GY));
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) grid[y * GX + x] = 1;
      });
      for (let y = 0; y < GY; y++) for (let x = 0; x < GX; x++) {
        const px = (x + 0.5) / GX * vw, py = (y + 0.5) / GY * vh;
        if (px >= centre.l && px <= centre.r && py >= centre.t && py <= centre.b && grid[y * GX + x]) cgrid[y * GX + x] = 1;
      }
      let covered = 0; for (let i = 0; i < grid.length; i++) if (grid[i]) covered++;
      let centreCells = 0, centreCovered = 0;
      for (let y = 0; y < GY; y++) for (let x = 0; x < GX; x++) {
        const px = (x + 0.5) / GX * vw, py = (y + 0.5) / GY * vh;
        if (px >= centre.l && px <= centre.r && py >= centre.t && py <= centre.b) {
          centreCells++; if (cgrid[y * GX + x]) centreCovered++;
        }
      }

      let overlaps = 0;
      for (let i = 0; i < panels.length; i++) for (let j = i + 1; j < panels.length; j++) {
        const a = panels[i], b = panels[j];
        if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) overlaps++;
      }

      const badNumber = /\b(NaN|undefined|null|Infinity)\b/;
      const nanOnScreen = panels.filter(p => p.text && badNumber.test(p.text))
        .map(p => ({ id: p.id || p.cls, text: p.text }));
      const tinyText = panels.filter(p => p.text && p.fontPx > 0 && p.fontPx < 11)
        .map(p => ({ id: p.id || p.cls, fontPx: p.fontPx, text: p.text }));

      let engine = {};
      try {
        const r = GameManager.getRenderer();
        engine = { drawCalls: r.info.render.calls, triangles: r.info.render.triangles, programs: r.info.programs ? r.info.programs.length : null };
      } catch (e) {}

      return {
        viewport: { vw, vh },
        hudCoveragePct: +(covered / (GX * GY) * 100).toFixed(1),
        centreClearPct: +(100 - (centreCovered / Math.max(1, centreCells) * 100)).toFixed(1),
        panelCount: panels.length,
        overlaps, nanOnScreen, tinyText, engine,
        biggest: panels.slice().sort((a, b) => b.pct - a.pct).slice(0, 15),
        panels,
      };
    }, { centreFrac: CENTRE_FRAC }), 60000, 'measure');

    rep.bootMs = bootMs;
    rep.cleanHud = CLEAN_HUD;
    rep.stage = STAGE;
    rep.pageErrors = pageErrors.slice(0, 8);

    // A picture of exactly what was measured, so the numbers are checkable.
    try {
      const durl = await deadline(pg.evaluate(() => {
        const r = GameManager.getRenderer(), sc = GameManager.getScene(), cam = GameManager.getCamera();
        r.render(sc, cam);
        return r.domElement.toDataURL('image/jpeg', 0.82);
      }), 30000, 'frame');
      if (durl) fs.writeFileSync(path.join(OUT, 'frame' + (CLEAN_HUD ? '-clean' : '') + '.jpg'), Buffer.from(durl.split(',')[1], 'base64'));
    } catch (e) { log('frame capture failed: ' + e.message); }
    try {
      await pg.screenshot({ path: path.join(OUT, 'page' + (CLEAN_HUD ? '-clean' : '') + '.jpg'), type: 'jpeg', quality: 80, timeout: 10000 });
    } catch (e) { /* the page screenshot is a nicety; the renderer frame is the record */ }

    fs.writeFileSync(path.join(OUT, 'usability' + (CLEAN_HUD ? '-clean' : '') + '.json'), JSON.stringify(rep, null, 1));

    log('');
    log('USABILITY — stage ' + STAGE + (CLEAN_HUD ? ' (CLEAN HUD)' : ' (default HUD)') + ' @ ' + rep.viewport.vw + 'x' + rep.viewport.vh);
    log('  HUD covers          ' + rep.hudCoveragePct + '% of the screen');
    log('  centre box clear    ' + rep.centreClearPct + '%   (where the player aims)');
    log('  visible panels      ' + rep.panelCount);
    log('  overlapping pairs   ' + rep.overlaps);
    log('  NaN/undefined shown ' + rep.nanOnScreen.length);
    rep.nanOnScreen.forEach(n => log('      ! ' + (n.id || '?') + '  "' + n.text + '"'));
    log('  text under 11px     ' + rep.tinyText.length);
    log('  boot to playable    ' + (rep.bootMs / 1000).toFixed(1) + 's   (SwiftShader — indicative only)');
    log('  engine              ' + JSON.stringify(rep.engine));
    log('');
    log('  biggest panels:');
    rep.biggest.forEach(p => log('    ' + String(p.pct).padStart(6) + '%  ' + ('#' + (p.id || p.cls || '?')).padEnd(28) + (p.text ? '"' + p.text.slice(0, 44) + '"' : '')));
    log('');
    // Verdicts, not gates. A human decides what is acceptable; this just says
    // plainly when a number is bad enough to hurt the game commercially.
    const v = [];
    if (rep.hudCoveragePct > 35) v.push('HUD COVERAGE ' + rep.hudCoveragePct + '% — the interface, not the game, is most of the screen');
    if (rep.centreClearPct < 85) v.push('CENTRE OBSTRUCTED — only ' + rep.centreClearPct + '% of the aiming box is clear');
    if (rep.nanOnScreen.length) v.push('BROKEN VALUES ON SCREEN — ' + rep.nanOnScreen.length + ' panel(s) printing NaN/undefined');
    if (rep.overlaps > 12) v.push('PANEL PILE-UP — ' + rep.overlaps + ' overlapping pairs');
    if (v.length) v.forEach(x => log('  VERDICT: ' + x));
    else log('  VERDICT: no usability thresholds breached');

    await deadline(browser.close(), 10000, 'close').catch(() => {});
    server.close();
    process.exit(0);
  } catch (e) {
    log('usability run failed: ' + e.message);
    try { if (browser) await deadline(browser.close(), 10000, 'close'); } catch (e2) {}
    server.close();
    process.exit(1);
  }
});
