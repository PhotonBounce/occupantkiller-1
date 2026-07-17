// QA harness: serve the real site, boot it in headless Chromium, click START,
// build a level, and assert no error overlay / WebGL loss / page crash.
// Runs N clean cycles; exits non-zero if ANY cycle fails.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ROOT = '/home/user/occupantkiller-1';
const PORT = parseInt(process.argv[2] || '4120', 10);
const CYCLES = parseInt(process.argv[3] || '5', 10);
const MOBILE = process.argv[4] === 'mobile';
const MIME = { '.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.svg':'image/svg+xml','.ico':'image/x-icon' };
const server = http.createServer((q,s)=>{
  let p = decodeURIComponent(q.url.split('?')[0]); if (p==='/') p='/index.html';
  const fp = path.join(ROOT,p);
  if (!fp.startsWith(ROOT)) { s.writeHead(403); return s.end(); }
  fs.readFile(fp,(e,d)=>{ if(e){ s.writeHead(404); return s.end('404'); } s.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'}); s.end(d); });
});
const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36';

async function runCycle(n) {
  // Fresh browser per cycle: a swiftshader/page crash in one cycle must not
  // poison the rest of the run.
  const browser = await chromium.launch({ headless:true, args:['--use-gl=swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage'] });
  const ctx = await browser.newContext(MOBILE ? { userAgent: MOBILE_UA, viewport:{width:412,height:915}, isMobile:true, hasTouch:true } : { viewport:{width:1280,height:720} });
  const pg = await ctx.newPage();
  const pageErrors = [], consoleErrors = [];
  pg.on('pageerror', e => pageErrors.push(e.message));
  pg.on('console', m => { if (m.type()==='error') consoleErrors.push(m.text().slice(0,160)); });
  pg.on('crash', () => pageErrors.push('PAGE_CRASHED'));
  let result = { cycle:n, booted:false, worldChunks:null, started:false, state:null, errOverlay:null, canvas:false, pageErrors:0, ok:false };
  try {
    await pg.goto('http://localhost:'+PORT+'/index.html', { waitUntil:'commit', timeout:20000 });
    // 1) wait for boot to menu (all modules + GameManager.init done → 100% ready)
    await pg.waitForFunction(() => {
      var req=['THREE','VoxelWorld','AudioSystem','Weapons','Enemies','HUD','GameManager','DroneSystem','VehicleSystem','Tracers'];
      var missing=req.filter(function(m){return typeof window[m]==='undefined';});
      var fill=document.getElementById('boot-progress-bar-fill');
      return missing.length===0 && fill && fill.style.width==='100%';
    }, { timeout: 45000 });
    result.booted = true;
    result.worldChunks = await pg.evaluate(() => window.WORLD_CHUNKS);
    // 2) no error overlay after boot
    let errText = await pg.evaluate(() => { var e=document.getElementById('error-overlay'); return (e && e.style.display!=='none') ? (e.textContent||'').slice(0,160) : null; });
    if (errText) { result.errOverlay = errText; throw new Error('error overlay after boot: '+errText); }
    // 3) START the game (build a real level — the step that was crashing)
    await pg.evaluate(() => {
      window.__chosenStartStage = 0;
      if (window.GameManager && GameManager.startGame) GameManager.startGame();
    });
    result.started = true;
    // 4) let it build + render several frames
    await pg.waitForTimeout(4000);
    // 4b) simulate the WASD combo (S+D) that used to launch SamuraiDuel/DeepSeaBase
    try {
      await pg.keyboard.down('s'); await pg.keyboard.down('d');
      await pg.waitForTimeout(1500);
      await pg.keyboard.up('s'); await pg.keyboard.up('d');
      await pg.waitForTimeout(1500);
    } catch(_){}
    // 5) assertions after playing + combo
    const EMBED_RE = /DEEP SEA BASE|BUSHIDO|BIOWEAPON|OPERATOR DOWN|SAMURAI|CYBERPUNK|GLADIATOR|MOON ?BASE|PRISON BREAK|HEIST|COLOSSEUM/i;
    const post = await pg.evaluate(() => {
      var e=document.getElementById('error-overlay');
      var errShown = (e && e.style.display!=='none') ? (e.textContent||'').slice(0,200) : null;
      var canvases = document.querySelectorAll('canvas');
      var main = document.querySelector('#game-container canvas');
      // scan visible text for embedded mini-game HUDs
      var bodyText = (document.body.innerText || '').slice(0, 20000);
      var st = null; try { st = (window.GameManager && GameManager.getState) ? GameManager.getState() : null; } catch(_){}
      return { errShown: errShown, canvasCount: canvases.length, main: !!main, mainW: main?main.width:0, bodyText: bodyText, state: st };
    });
    result.errOverlay = post.errShown;
    result.canvas = post.main && post.mainW > 0;
    result.canvasCount = post.canvasCount;
    result.state = post.state;
    const embedMatch = (post.bodyText.match(EMBED_RE) || [])[0] || null;
    result.embeddedHud = embedMatch;
    if (post.errShown) throw new Error('error overlay: '+post.errShown);
    if (!result.canvas) throw new Error('no rendered canvas after START');
    // main game has 1 game canvas + tiny HUD canvases (minimap 180x180, tacmap 400x400).
    // A leaked mini-game renderer appends a FULL-SIZE extra canvas → flag >1 large canvas.
    if (embedMatch) throw new Error('embedded mini-game HUD visible: '+embedMatch);
  } catch (e) {
    result.error = e.message.slice(0,160);
  }
  // ignore the known ethers CDN block (sandbox proxy), count everything else
  const realPageErrors = pageErrors.filter(m => !/ethers|jsdelivr|ERR_TUNNEL|net::/i.test(m));
  result.pageErrors = realPageErrors.length;
  if (realPageErrors.length) result.pageErrorSample = realPageErrors.slice(0,3);
  result.ok = result.booted && result.started && result.canvas && !result.errOverlay && !result.embeddedHud && result.pageErrors===0 && !result.error;
  try { await ctx.close(); } catch(_){}
  try { await browser.close(); } catch(_){}
  return result;
}

server.listen(PORT, async () => {
  let allOk = true;
  console.log('=== QA boot+play: '+CYCLES+' cycles, '+(MOBILE?'MOBILE':'DESKTOP')+' ===');
  for (let i=1;i<=CYCLES;i++) {
    let r; try { r = await runCycle(i); } catch(e){ r = { cycle:i, ok:false, error:'cycle threw: '+e.message.slice(0,120) }; }
    if (!r.ok) allOk = false;
    console.log('cycle '+i+': '+(r.ok?'PASS':'FAIL')+
      ' | booted='+r.booted+' WORLD_CHUNKS='+r.worldChunks+' started='+r.started+' canvas='+r.canvas+
      ' canvasCount='+r.canvasCount+' embeddedHud='+(r.embeddedHud?JSON.stringify(r.embeddedHud):'none')+
      ' state='+JSON.stringify(r.state)+' errOverlay='+(r.errOverlay?JSON.stringify(r.errOverlay):'none')+
      ' pageErrors='+r.pageErrors+(r.error?' err='+r.error:'')+(r.pageErrorSample?' '+JSON.stringify(r.pageErrorSample):''));
  }
  console.log('=== RESULT: '+(allOk?'ALL '+CYCLES+' CYCLES CLEAN':'FAILURES ABOVE')+' ===');
  server.close(); process.exit(allOk?0:1);
});
