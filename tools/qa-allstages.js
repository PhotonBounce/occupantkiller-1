// tools/qa-allstages.js — advance through every stage, report errors + one shot each.
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const URL_BASE = process.argv[2] || 'http://localhost:3000';
const OUT = path.join(__dirname, 'screenshots', 'allstages');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.evaluateOnNewDocument(() => { window.__QA_MODE = true; });

  const errors = [];
  page.on('pageerror', e => errors.push('CRASH: ' + e.message));
  page.on('console', m => {
    if (m.type() === 'error') {
      const t = m.text();
      if (!/ERR_CONNECTION_REFUSED|favicon|AudioContext|3001|MP3|JUKEBOX/.test(t)) errors.push('CONSOLE: ' + t);
    }
  });

  await page.goto(URL_BASE, { waitUntil: 'networkidle0', timeout: 30000 });
  for (let i = 0; i < 40 && !(await page.evaluate(() => typeof window.GameManager !== 'undefined')); i++) await sleep(250);
  await page.evaluate(() => { if (window.forceStartGame) window.forceStartGame(); });
  await sleep(3000);

  const stageCount = await page.evaluate(() => (window.GameManager.STAGES || []).length);
  console.log('[ALLSTAGES] total stages:', stageCount);

  for (let s = 0; s < stageCount; s++) {
    const before = errors.length;
    const info = await page.evaluate((target) => {
      let guard = 30;
      while (window.GameManager.getCurrentStage() < target && guard-- > 0) {
        if (typeof window.GameManager.nextStage === 'function') window.GameManager.nextStage();
      }
      const gm = window.GameManager;
      const st = gm.getStageInfo ? gm.getStageInfo() : null;
      // probe for NaN in camera/player
      let nan = false;
      try {
        const c = gm.getCamera().position, p = gm.getPlayer().position;
        nan = [c.x, c.y, c.z, p.x, p.y, p.z].some(v => !Number.isFinite(v));
      } catch (e) {}
      return { stage: gm.getCurrentStage(), name: st && st.name, nan };
    }, s);
    await sleep(1200);
    const shot = path.join(OUT, `stage-${String(s).padStart(2, '0')}-${(info.name || '').replace(/[^a-z0-9]/gi, '').slice(0, 12)}.png`);
    await page.screenshot({ path: shot, type: 'png' });
    const newErrs = errors.slice(before);
    console.log(`stage ${info.stage} "${info.name}" nan=${info.nan} newErrors=${newErrs.length}` + (newErrs.length ? '\n   ' + newErrs.join('\n   ') : ''));
  }

  console.log('[ALLSTAGES] TOTAL distinct errors:', errors.length);
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
