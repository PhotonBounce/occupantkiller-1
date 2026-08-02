// Staged mobile-boot diagnostic. Writes each step to a log file IMMEDIATELY
// (appendFileSync) so a timeout/kill never loses progress. Tells us exactly
// how far a mobile boot gets and where (if anywhere) it stalls.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ROOT = '/home/user/occupantkiller-1';
const PORT = parseInt(process.argv[2] || '4130', 10);
const LOG = path.join(ROOT, 'tools', 'diag-mobile-boot.log');
try { fs.unlinkSync(LOG); } catch (_) {}
const t0 = Date.now();
function log(msg) {
  const line = '[' + String(((Date.now() - t0) / 1000).toFixed(1)).padStart(6) + 's] ' + msg + '\n';
  fs.appendFileSync(LOG, line);
  try { process.stdout.write(line); } catch (_) {}
}
const MIME = { '.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.svg':'image/svg+xml','.ico':'image/x-icon' };
const server = http.createServer((q,s)=>{
  let p = decodeURIComponent(q.url.split('?')[0]); if (p==='/') p='/index.html';
  const fp = path.join(ROOT,p);
  if (!fp.startsWith(ROOT)) { s.writeHead(403); return s.end(); }
  fs.readFile(fp,(e,d)=>{ if(e){ s.writeHead(404); return s.end('404'); } s.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'}); s.end(d); });
});
const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36';

server.listen(PORT, async () => {
  log('server up on ' + PORT);
  const browser = await chromium.launch({ headless:true, args:['--use-gl=swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage'] });
  log('browser launched');
  const ctx = await browser.newContext({ userAgent: MOBILE_UA, viewport:{width:412,height:915}, isMobile:true, hasTouch:true });
  const pg = await ctx.newPage();
  const pageErrors = [];
  pg.on('pageerror', e => { pageErrors.push(e.message); log('PAGEERROR: ' + e.message.slice(0,160)); });
  pg.on('crash', () => log('PAGE_CRASHED'));
  try {
    await pg.goto('http://localhost:'+PORT+'/index.html', { waitUntil:'commit', timeout:20000 });
    log('goto committed');
    // Poll boot state every 2s for up to 90s, logging module presence + progress bar
    let booted = false;
    for (let i=0;i<45;i++){
      const st = await pg.evaluate(() => {
        var req=['THREE','VoxelWorld','AudioSystem','Weapons','Enemies','HUD','GameManager','DroneSystem','VehicleSystem','Tracers'];
        var missing=req.filter(function(m){return typeof window[m]==='undefined';});
        var fill=document.getElementById('boot-progress-bar-fill');
        return { missing:missing, width: fill?fill.style.width:'(no bar)' };
      }).catch(e=>({err:e.message}));
      if (st.err) { log('eval err: '+st.err); }
      else log('boot poll '+i+': progress='+st.width+' missing=['+st.missing.join(',')+']');
      if (st.missing && st.missing.length===0 && st.width==='100%') { booted = true; log('BOOTED to menu'); break; }
      await pg.waitForTimeout(2000);
    }
    if (!booted) { log('DID NOT BOOT within 90s'); }
    else {
      // Try START
      await pg.evaluate(() => { window.__chosenStartStage = 0; if (window.GameManager && GameManager.startGame) GameManager.startGame(); });
      log('startGame() called');
      await pg.waitForTimeout(5000);
      const post = await pg.evaluate(() => {
        var e=document.getElementById('error-overlay');
        var main = document.querySelector('#game-container canvas');
        var st=null; try{ st=(window.GameManager&&GameManager.getState)?GameManager.getState():null;}catch(_){}
        return { err:(e&&e.style.display!=='none')?(e.textContent||'').slice(0,160):null, canvas:!!main, w:main?main.width:0, state:st };
      });
      log('post-start: state='+JSON.stringify(post.state)+' canvas='+post.canvas+' w='+post.w+' err='+(post.err||'none'));
    }
  } catch (e) {
    log('EXCEPTION: ' + (e.message||e).slice(0,200));
  }
  log('realPageErrors='+pageErrors.filter(m=>!/ethers|jsdelivr|ERR_TUNNEL|net::/i.test(m)).length);
  try { await browser.close(); } catch(_){}
  log('DONE');
  server.close(); process.exit(0);
});
