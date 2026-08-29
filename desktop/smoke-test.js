// Desktop smoke test: launches the PACKAGED exe (win-unpacked build of the same
// binary the portable exe wraps), boots the game, starts stage 1, verifies it
// reaches the PLAYING state, and captures a frame whose content is measured —
// a flat/black frame fails the build. Runs on the Windows CI runner so the
// artifact that ships is the artifact that was tested.
const { _electron } = require('playwright');
const fs = require('fs'), path = require('path');

(async () => {
  const exe = process.argv[2];
  if (!exe || !fs.existsSync(exe)) { console.error('exe not found: ' + exe); process.exit(1); }
  console.log('launching', exe);
  const app = await _electron.launch({ executablePath: exe, args: [] });
  const page = await app.firstWindow();
  page.on('console', m => { if (m.type() === 'error') console.log('[page-err]', m.text().slice(0, 160)); });

  await page.waitForFunction(
    () => ['THREE', 'VoxelWorld', 'Weapons', 'Enemies', 'HUD', 'GameManager']
      .every(m => typeof window[m] !== 'undefined') && !!window.GameManager.startGame,
    null, { timeout: 180000 });
  console.log('booted: all core modules present');

  await page.evaluate(() => { window.__chosenStartStage = 0; setTimeout(() => { try { GameManager.startGame(); } catch (e) {} }, 0); });
  await page.waitForFunction(
    () => window.GameManager && GameManager.getState && GameManager.getState() === 'playing',
    null, { timeout: 240000 });
  console.log('state: playing');
  await page.waitForTimeout(6000);

  // 10-second performance window on this Windows/ANGLE-D3D11 stack — the same
  // driver family as the reported 1-FPS machine. Continuous shader-program
  // growth here would reproduce that bug's signature directly in CI.
  const perf0 = await page.evaluate(() => {
    window.__pfFrames = 0;
    (function lp() { window.__pfFrames++; requestAnimationFrame(lp); })();
    const r = GameManager.getRenderer();
    let lights = 0; try { GameManager.getScene().traverse(o => { if (o.isLight) lights++; }); } catch (e) {}
    return { progs: r && r.info && r.info.programs ? r.info.programs.length : null, lights };
  });
  await page.waitForTimeout(10000);
  const perf1 = await page.evaluate(() => {
    const r = GameManager.getRenderer();
    const h = window.__renderHealth || {};
    return {
      frames: window.__pfFrames,
      progs: r && r.info && r.info.programs ? r.info.programs.length : null,
      renderMs: h.renderMs, drawCalls: h.drawCalls,
      textures: h.textures, geometries: h.geometries,
      canvasesGl: h.canvasesGl, canvases2d: h.canvases2d,
      lights: (() => { let n = 0; try { GameManager.getScene().traverse(o => { if (o.isLight) n++; }); } catch (e) {} return n; })(),
      // Light-slot swap accounting. progs climbing is the symptom; these say
      // whether the compensation is running and whether it ran out of pads.
      lw: window.__lwStats || null,
      pads: (window.__lwPadP || []).length,
    };
  });
  const fps = +(perf1.frames / 10).toFixed(1);
  console.log('PERF fps=' + fps + ' gpu.render=' + perf1.renderMs + 'ms draw=' + perf1.drawCalls
    + ' progs=' + perf0.progs + '->' + perf1.progs
    + ' lights=' + perf0.lights + '->' + perf1.lights
    + ' tex=' + perf1.textures + ' geo=' + perf1.geometries
    + ' canvases=' + perf1.canvasesGl + 'gl/' + perf1.canvases2d + '2d'
    + ' lw=' + JSON.stringify(perf1.lw) + ' pads=' + perf1.pads);

  const probe = await page.evaluate(() => {
    const out = { state: GameManager.getState() };
    try { const r = GameManager.getRenderer(); if (r && r.info) { out.tris = r.info.render.triangles; out.calls = r.info.render.calls; } } catch (e) {}
    try { out.enemies = Enemies.getAliveCount ? Enemies.getAliveCount() : null; } catch (e) {}
    let url = null, score = null;
    try {
      url = GameManager.captureFrame ? GameManager.captureFrame() : null;
      const r = GameManager.getRenderer();
      const c = document.createElement('canvas'); c.width = 64; c.height = 36;
      const x = c.getContext('2d'); x.drawImage(r.domElement, 0, 0, 64, 36);
      const d = x.getImageData(0, 0, 64, 36).data;
      let n = 0, s1 = 0, s2 = 0;
      for (let i = 0; i < d.length; i += 4) { const l = d[i] * .299 + d[i+1] * .587 + d[i+2] * .114; s1 += l; s2 += l * l; n++; }
      const mean = s1 / n; score = Math.sqrt(Math.max(0, s2 / n - mean * mean));
    } catch (e) { out.frameErr = e.message; }
    out.contentScore = score == null ? null : +score.toFixed(1);
    out.frame = url;
    return out;
  });
  if (probe.frame && probe.frame.startsWith('data:image/png')) {
    fs.writeFileSync(path.join(process.cwd(), 'desktop-smoke.png'), Buffer.from(probe.frame.split(',')[1], 'base64'));
  }
  delete probe.frame;
  console.log('probe:', JSON.stringify(probe));
  await app.close();

  const ok = probe.state === 'playing' && (probe.tris || 0) > 5000 && (probe.contentScore || 0) >= 10;
  console.log(ok ? 'SMOKE TEST PASS' : 'SMOKE TEST FAIL');
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('SMOKE TEST ERROR', e && e.message); process.exit(1); });
