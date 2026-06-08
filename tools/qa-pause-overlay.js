// Verify the pause overlay actually renders (dimmed bg + PAUSED + buttons) on mobile.
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const URL_BASE = process.argv[2] || 'http://localhost:3000';
const OUT = path.join(__dirname, 'screenshots', 'pause-check');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'] });
  const page = await browser.newPage();
  await page.emulate({
    viewport: { width: 844, height: 390, isMobile: true, hasTouch: true, isLandscape: true, deviceScaleFactor: 2 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  await page.goto(URL_BASE, { waitUntil: 'networkidle0', timeout: 30000 });
  for (let i = 0; i < 40 && !(await page.evaluate(() => typeof window.GameManager !== 'undefined')); i++) await sleep(250);
  await page.evaluate(() => { if (window.forceStartGame) window.forceStartGame(); });
  await sleep(3000);

  const state = await page.evaluate(() => {
    const o = document.getElementById('overlay-pause');
    o.style.display = 'flex';
    const cs = getComputedStyle(o);
    const h1 = o.querySelector('h1');
    const btns = [...o.querySelectorAll('button')].map(b => { const r = b.getBoundingClientRect(); return { text: b.textContent.trim().slice(0, 18), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), visible: r.width > 0 && r.height > 0 }; });
    const hr = h1 ? h1.getBoundingClientRect() : null;
    return { display: cs.display, bg: cs.backgroundColor, zIndex: cs.zIndex, opacity: cs.opacity, h1Text: h1 && h1.textContent, h1Visible: hr && hr.width > 0, buttons: btns };
  });
  console.log(JSON.stringify(state, null, 1));
  await sleep(200);
  await page.screenshot({ path: path.join(OUT, 'pause.png'), type: 'png' });
  await browser.close();
  const ok = state.display === 'flex' && /rgba?\(0, 0, 0/.test(state.bg) && state.h1Visible && state.buttons.every(b => b.visible);
  console.log('PAUSE OVERLAY RENDERS OK:', ok);
  process.exit(ok ? 0 : 2);
})();
