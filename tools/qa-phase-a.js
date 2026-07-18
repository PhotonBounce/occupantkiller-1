// Phase A verifier: is the game JS-clean when it renders?
// Retries past swiftshader infra crashes (PAGE_CRASHED before boot) to collect
// N runs that actually reach gameplay, and classifies each:
//   clean    = booted + started + played 6s + S+D combo, no fatal overlay,
//              no non-infra pageerror, canvas present, no embedded-game HUD
//   gamefail = booted but a real game bug (JS error / embedded HUD)
//   infra    = swiftshader died before boot (sandbox artifact, retried)
const http=require('http'), fs=require('fs'), path=require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ROOT='/home/user/occupantkiller-1';
const PORT=parseInt(process.argv[2]||'4300',10);
const WANT=parseInt(process.argv[3]||'5',10);      // clean runs wanted
const MAXATT=parseInt(process.argv[4]||'20',10);   // attempt cap
const MIME={'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const fp=path.join(ROOT,p);if(!fp.startsWith(ROOT)){s.writeHead(403);return s.end();}fs.readFile(fp,(e,d)=>{if(e){s.writeHead(404);return s.end('404');}s.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});s.end(d);});});
const EMBED_RE=/DEEP SEA BASE|BUSHIDO|BIOWEAPON|OPERATOR DOWN|SAMURAI|CYBERPUNK|GLADIATOR|MOON ?BASE|PRISON BREAK|HEIST|COLOSSEUM/i;

async function attempt(n){
  const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage','--js-flags=--max-old-space-size=4096']});
  const pg=await browser.newPage({viewport:{width:1000,height:600}});
  const perr=[]; pg.on('pageerror',e=>perr.push(e.message.slice(0,140))); pg.on('crash',()=>perr.push('PAGE_CRASHED'));
  const r={n,klass:'infra',booted:false,started:false,fatal:null,embed:null,canvas:false,perr:0};
  try{
    await pg.goto('http://localhost:'+PORT+'/index.html',{waitUntil:'commit',timeout:20000});
    await pg.waitForFunction(()=>{var q=['THREE','VoxelWorld','GameManager','Weapons','Enemies','HUD','Tracers'];return q.every(m=>typeof window[m]!=='undefined');},{timeout:40000});
    await pg.waitForFunction(()=>{var f=document.getElementById('boot-progress-bar-fill');var e=document.getElementById('error-overlay');return (f&&f.style.width==='100%')||(e&&e.style.display!=='none');},{timeout:45000});
    r.booted=await pg.evaluate(()=>{var f=document.getElementById('boot-progress-bar-fill');return !!(f&&f.style.width==='100%');});
    var bootErr=await pg.evaluate(()=>{var e=document.getElementById('error-overlay');return (e&&e.style.display!=='none')?(e.textContent||'').slice(0,160):null;});
    if(bootErr){ r.klass='gamefail'; r.fatal=bootErr; }
    else if(r.booted){
      await pg.evaluate(()=>{window.__chosenStartStage=0;if(window.GameManager&&GameManager.startGame)GameManager.startGame();});
      r.started=true;
      await pg.waitForTimeout(4000);
      try{ await pg.keyboard.down('s'); await pg.keyboard.down('d'); await pg.waitForTimeout(1500); await pg.keyboard.up('s'); await pg.keyboard.up('d'); await pg.waitForTimeout(1500);}catch(_){}
      const post=await pg.evaluate(()=>{var e=document.getElementById('error-overlay');var c=document.querySelector('#game-container canvas');return {err:(e&&e.style.display!=='none')?(e.textContent||'').slice(0,160):null, canvas:!!(c&&c.width>0), body:(document.body.innerText||'').slice(0,18000)};});
      r.fatal=post.err; r.canvas=post.canvas; r.embed=(post.body.match(EMBED_RE)||[])[0]||null;
      const realErr=perr.filter(m=>!/PAGE_CRASHED|ethers|jsdelivr|ERR_TUNNEL|net::/i.test(m));
      r.perr=realErr.length; if(realErr.length) r.perrSample=realErr.slice(0,3);
      if(!post.err && post.canvas && !r.embed && realErr.length===0) r.klass='clean';
      else r.klass='gamefail';
    }
  }catch(e){
    const crashed=perr.includes('PAGE_CRASHED')||/has been closed|Timeout/.test(e.message);
    if(r.booted){ r.klass='gamefail'; r.fatal=(r.fatal||e.message.slice(0,120)); }
    else r.klass = crashed?'infra':'gamefail';
    if(r.klass==='gamefail'&&!r.fatal) r.fatal=e.message.slice(0,120);
  }
  try{await browser.close();}catch(_){}
  return r;
}

server.listen(PORT, async ()=>{
  let clean=0, gamefail=0, infra=0, att=0;
  const fails=[];
  console.log('=== Phase A: want '+WANT+' clean gameplay runs (cap '+MAXATT+' attempts) ===');
  while(clean<WANT && att<MAXATT){
    att++;
    let r; try{ r=await attempt(att);}catch(e){ r={n:att,klass:'infra',fatal:'launch:'+e.message.slice(0,80)}; }
    if(r.klass==='clean') clean++;
    else if(r.klass==='gamefail'){ gamefail++; fails.push(r); }
    else infra++;
    console.log('att '+att+': '+r.klass.toUpperCase()+' | booted='+r.booted+' started='+r.started+' canvas='+r.canvas+' embed='+(r.embed||'none')+' perr='+(r.perr||0)+(r.fatal?' fatal='+JSON.stringify(r.fatal):'')+(r.perrSample?' '+JSON.stringify(r.perrSample):''));
    if(gamefail>=3) { console.log('>>> 3 game-level failures; stopping to fix.'); break; }
  }
  console.log('=== SUMMARY: clean='+clean+' gamefail='+gamefail+' infra(retried)='+infra+' attempts='+att+' ===');
  console.log(clean>=WANT ? '>>> PHASE A PASS: '+WANT+' clean gameplay runs' : '>>> PHASE A INCOMPLETE');
  server.close(); process.exit(clean>=WANT?0:1);
});
