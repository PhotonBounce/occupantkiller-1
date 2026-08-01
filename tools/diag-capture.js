// Boot the real game headless (swiftshader), START a level, let it render a few
// seconds, and save a PNG screenshot. Proves the game actually renders + plays.
// Usage: node tools/diag-capture.js <port> <desktop|mobile> <outfile>
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ROOT = '/home/user/occupantkiller-1';
const PORT = parseInt(process.argv[2] || '4140', 10);
const MODE = process.argv[3] || 'desktop';
const OUT = process.argv[4] || path.join(ROOT, 'tools', 'capture-' + MODE + '.png');
const MOBILE = MODE === 'mobile';
const LOG = OUT.replace(/\.png$/, '.log');
const t0 = Date.now();
function log(m){ const l='['+((Date.now()-t0)/1000).toFixed(1)+'s] '+m+'\n'; fs.appendFileSync(LOG,l); try{process.stdout.write(l);}catch(_){}}
try { fs.unlinkSync(LOG); } catch(_){}
const MIME={'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const fp=path.join(ROOT,p);if(!fp.startsWith(ROOT)){s.writeHead(403);return s.end();}fs.readFile(fp,(e,d)=>{if(e){s.writeHead(404);return s.end('404');}s.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});s.end(d);});});
const MOBILE_UA='Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36';

server.listen(PORT, async () => {
  log('server up ('+MODE+')');
  const browser = await chromium.launch({ headless:true, args:['--use-gl=swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage'] });
  const ctx = await browser.newContext(MOBILE ? { userAgent:MOBILE_UA, viewport:{width:915,height:412}, isMobile:true, hasTouch:true, deviceScaleFactor:2 } : { viewport:{width:1280,height:720} });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => log('PAGEERROR: '+e.message.slice(0,140)));
  try {
    await pg.goto('http://localhost:'+PORT+'/index.html',{waitUntil:'commit',timeout:20000});
    await pg.waitForFunction(()=>{var r=['THREE','VoxelWorld','Weapons','Enemies','HUD','GameManager'];var f=document.getElementById('boot-progress-bar-fill');return r.every(m=>typeof window[m]!=='undefined')&&f&&f.style.width==='100%';},{timeout:60000});
    log('booted to menu');
    await pg.evaluate(()=>{window.__chosenStartStage=0;if(window.GameManager&&GameManager.startGame)GameManager.startGame();});
    log('startGame called; dismissing briefing...');
    await pg.waitForTimeout(2500);
    // Dismiss the mission-briefing overlay to reach live 3D combat
    try { await pg.keyboard.press('Space'); } catch(_){}
    try { await pg.mouse.click(MOBILE?206:640, MOBILE?450:360); } catch(_){}
    await pg.waitForTimeout(4000);
    log('rendering live combat...');
    await pg.waitForTimeout(2000);
    const st = await pg.evaluate(()=>{try{return (window.GameManager&&GameManager.getState)?GameManager.getState():null;}catch(_){return null;}});
    log('state='+JSON.stringify(st));
    await pg.screenshot({ path: OUT });
    log('screenshot saved -> '+OUT+' ('+(fs.existsSync(OUT)?fs.statSync(OUT).size+' bytes':'MISSING')+')');
  } catch(e){ log('EXCEPTION: '+(e.message||e).slice(0,180)); }
  try{ await browser.close(); }catch(_){}
  log('DONE'); server.close(); process.exit(0);
});
