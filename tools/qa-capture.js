// Capture real headless frames (mobile viewport) so I can SEE the game state:
// menu, after START, and during simulated play. Saves PNGs I can view.
const http=require('http'), fs=require('fs'), path=require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ROOT='/home/user/occupantkiller-1';
const PORT=parseInt(process.argv[2]||'4400',10);
const STAGE=process.argv[3]||'0';
const OUTDIR=process.argv[4]||'/tmp/claude-0/-home-user-occupantkiller-1/935a3386-bf68-508b-961f-b5a7bf15988c/scratchpad/shots';
const MOBILE=process.argv[5]!=='desktop';
fs.mkdirSync(OUTDIR,{recursive:true});
const MIME={'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const fp=path.join(ROOT,p);if(!fp.startsWith(ROOT)){s.writeHead(403);return s.end();}fs.readFile(fp,(e,d)=>{if(e){s.writeHead(404);return s.end('404');}s.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});s.end(d);});});
const MOBILE_UA='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
server.listen(PORT, async ()=>{
  const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage','--js-flags=--max-old-space-size=4096']});
  const ctx=await browser.newContext(MOBILE?{userAgent:MOBILE_UA,viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2}:{viewport:{width:1280,height:720}});
  const pg=await ctx.newPage();
  const perr=[]; pg.on('pageerror',e=>perr.push(e.message.slice(0,120)));
  const log=[];
  async function shot(name){ try{ await pg.screenshot({path:path.join(OUTDIR,name)}); log.push('shot '+name); }catch(e){ log.push('shot FAIL '+name+' '+e.message.slice(0,60)); } }
  try{
    await pg.goto('http://localhost:'+PORT+'/index.html',{waitUntil:'commit',timeout:20000});
    await pg.waitForFunction(()=>{var f=document.getElementById('boot-progress-bar-fill');var e=document.getElementById('error-overlay');return (f&&f.style.width==='100%')||(e&&e.style.display!=='none');},{timeout:45000});
    await pg.waitForTimeout(800);
    await shot('01-menu.png');
    const bootErr=await pg.evaluate(()=>{var e=document.getElementById('error-overlay');return (e&&e.style.display!=='none')?(e.textContent||'').slice(0,200):null;});
    log.push('bootErr='+(bootErr||'none'));
    // choose stage + start
    await pg.evaluate((st)=>{window.__chosenStartStage=parseInt(st,10)||0; if(window.GameManager&&GameManager.startGame)GameManager.startGame();}, STAGE);
    await pg.waitForTimeout(2500); await shot('02-start.png');
    // simulate play: move + look + fire
    for(let i=0;i<5;i++){
      try{
        await pg.keyboard.down('w'); await pg.mouse.move(400+i*30,200);
        await pg.mouse.down(); await pg.waitForTimeout(400); await pg.mouse.up();
        await pg.keyboard.up('w');
        // touch drag (mobile look) + tap (fire)
        await pg.touchscreen.tap(650, 200);
      }catch(_){}
      await pg.waitForTimeout(1200);
      await shot('03-play-'+i+'.png');
    }
    const post=await pg.evaluate(()=>{var e=document.getElementById('error-overlay');var c=document.querySelector('#game-container canvas');
      var vis={}; ['hud','overlay-start','mobile-controls','error-overlay','boot-preloader'].forEach(id=>{var el=document.getElementById(id); vis[id]=el?(getComputedStyle(el).display):'absent';});
      var st=null; try{st=window.GameManager&&GameManager.getState&&GameManager.getState();}catch(_){}
      return {err:(e&&e.style.display!=='none')?(e.textContent||'').slice(0,200):null, canvas:!!(c&&c.width>0), canvasWH:c?(c.width+'x'+c.height):'none', state:st, vis:vis};});
    log.push('AFTER PLAY: '+JSON.stringify(post));
    log.push('pageerrors('+perr.length+'): '+JSON.stringify(perr.slice(0,5)));
  }catch(e){ log.push('FATAL '+e.message.slice(0,140)); }
  console.log(log.join('\n'));
  try{await browser.close();}catch(_){} server.close(); process.exit(0);
});
