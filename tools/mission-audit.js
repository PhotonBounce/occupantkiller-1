// Mission audit: generate each template live, validate data + objective text,
// run check(), screenshot the HUD state. Reports anomalies per mission.
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OUT = path.join(__dirname, 'screenshots', 'missions');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--window-size=1024,576'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1024, height: 576 });
  const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 90)));
  await p.evaluateOnNewDocument(() => { window.__QA_MODE = true; });
  await p.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
  for (let i = 0; i < 60 && !(await p.evaluate(() => typeof window.GameManager !== 'undefined')); i++) await sleep(300);
  await p.evaluate(() => { Object.defineProperty(document, 'pointerLockElement', { get: () => document.body, configurable: true }); if (window.forceStartGame) window.forceStartGame(); });
  await sleep(3500);
  await p.evaluate(() => { try { if (!window.GameManager.isGodMode()) window.GameManager.toggleGodMode(); } catch (e) {} });

  const keys = await p.evaluate(() => Object.keys(MissionSystem.TEMPLATES));
  console.log('TEMPLATES: ' + keys.join(','));

  for (const key of keys) {
    const report = await p.evaluate(async (k) => {
      const out = { key: k, problems: [] };
      try {
        // clear actives so each test is isolated
        const act = MissionSystem.getActive(); act.length = 0;
        const m = MissionSystem.generateMission(k);
        if (!m) { out.problems.push('generateMission returned null'); return out; }
        out.name = m.name || (m.data && m.data.name);
        const d = m.data || m;
        out.objective = d.objectiveText || m.objectiveText || '(none)';
        // run the template check once
        const tpl = MissionSystem.TEMPLATES[k];
        let chk = null;
        try { chk = tpl.check ? tpl.check(d) : '(no check fn)'; } catch (e) { out.problems.push('check() threw: ' + e.message); }
        out.checkResult = chk;
        out.objectiveAfterCheck = d.objectiveText || '(none)';
        // anomaly heuristics
        if (d.spawned !== undefined && d.spawned === 0) out.problems.push('spawned 0 enemies');
        if (d.killTarget && d.spawned !== undefined && d.spawned < d.killTarget) out.problems.push('spawned ' + d.spawned + '/' + d.killTarget + ' (short)');
        if (/undefined|NaN|null/.test(String(out.objectiveAfterCheck))) out.problems.push('objective contains undefined/NaN');
        if (chk === true) out.problems.push('check() true immediately (auto-completes!)');
        // marker sanity
        if (d.target && (isNaN(d.target.x) || isNaN(d.target.z))) out.problems.push('target marker NaN');
        if (d.building && d.building.x === undefined && !d.building.cx) out.problems.push('building ref missing coords');
      } catch (e) { out.problems.push('audit threw: ' + e.message); }
      return out;
    }, key);
    await sleep(1200);
    try { await p.screenshot({ path: path.join(OUT, 'audit-' + key + '.jpg'), type: 'jpeg', quality: 80 }); } catch (e) {}
    console.log(JSON.stringify(report));
  }
  console.log('AUDIT done errs=' + errs.length + (errs.length ? ' :: ' + errs.slice(0, 3).join(' | ') : ''));
  await b.close();
})().catch(e => console.log('AUDITERR', e.message));
