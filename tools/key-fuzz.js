// Presses every key the game could plausibly receive, on a live level, and
// records any uncaught error. Dozens of side-modules bind document-level
// keydown handlers at load time; if one forgets to check "am I active?" it
// dereferences a null scene and kills the frame loop. That is exactly the
// crash the player hit on R (moon-base.js). This finds the rest of them.
// Usage: PORT=4711 node tools/key-fuzz.js [stageIdx]
const http=require('http'),fs=require('fs'),path=require('path');
let chromium; try{({chromium}=require('/opt/node22/lib/node_modules/playwright'));}catch(e){({chromium}=require('playwright'));}
const ROOT='/home/user/occupantkiller-1';
const PORT=parseInt(process.env.PORT||'4711',10);
const STAGE=parseInt(process.argv[2]||'0',10);
const MIME={'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const fp=path.join(ROOT,p);if(!fp.startsWith(ROOT)){s.writeHead(403);return s.end();}fs.readFile(fp,(e,d)=>{if(e){s.writeHead(404);return s.end('404');}s.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});s.end(d);});});

const KEYS=[];
'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(c=>KEYS.push({name:'Key'+c,label:c}));
'0123456789'.split('').forEach(c=>KEYS.push({name:'Digit'+c,label:c}));
for(let i=1;i<=12;i++)KEYS.push({name:'F'+i,label:'F'+i});
['Tab','Space','Enter','ShiftLeft','ControlLeft','AltLeft','CapsLock','Backquote','Minus','Equal',
 'BracketLeft','BracketRight','Backslash','Semicolon','Quote','Comma','Period','Slash',
 'ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Insert','Delete','Home','End','PageUp','PageDown']
 .forEach(n=>KEYS.push({name:n,label:n}));

server.listen(PORT,async()=>{
  const b=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio']});
  const pg=await (await b.newContext({viewport:{width:960,height:600}})).newPage();
  const errs=[];
  pg.on('pageerror',e=>errs.push(String(e.message||e)));
  await pg.goto('http://localhost:'+PORT+'/index.html',{waitUntil:'commit',timeout:30000});
  await pg.waitForFunction(()=>['THREE','VoxelWorld','GameManager'].every(m=>typeof window[m]!=='undefined')&&!!(window.GameManager&&window.GameManager.startGame),{timeout:90000});
  await pg.evaluate(i=>{window.__chosenStartStage=i;setTimeout(()=>{try{GameManager.startGame();}catch(e){}},0);},STAGE);
  await pg.waitForTimeout(9000);
  // Mouse input is gated on pointer lock; fake it so weapon/UI paths run too.
  await pg.evaluate(()=>{try{Object.defineProperty(document,'pointerLockElement',{get:()=>document.body,configurable:true});}catch(e){}});
  errs.length=0; // ignore anything from boot; we only want key-triggered faults
  const hits=[];
  const PROG='/tmp/claude-0/-home-user-occupantkiller-1/935a3386-bf68-508b-961f-b5a7bf15988c/scratchpad/key-fuzz.progress';
  try{fs.unlinkSync(PROG);}catch(_){}
  for(const k of KEYS){
    fs.appendFileSync(PROG,'trying '+k.label+'\n');
    const before=errs.length;
    try{ await pg.keyboard.down(k.name); await pg.waitForTimeout(60); await pg.keyboard.up(k.name); }
    catch(e){ continue; }
    await pg.waitForTimeout(90);
    if(errs.length>before){
      const fresh=errs.slice(before);
      hits.push({key:k.label,errors:[...new Set(fresh)]});
      console.log('FAULT on '+k.label+': '+fresh[0].split('\n')[0].slice(0,160));
    }
  }
  const alive=await pg.evaluate(()=>{try{return {state:GameManager.getState&&GameManager.getState(),hp:(window.Player&&Player.getHealth)?Player.getHealth():null};}catch(e){return {err:String(e)};}});
  console.log('\n=== key fuzz stage '+STAGE+': '+hits.length+' faulting keys of '+KEYS.length+' ===');
  console.log(JSON.stringify({alive,hits},null,1));
  fs.writeFileSync('/tmp/claude-0/-home-user-occupantkiller-1/935a3386-bf68-508b-961f-b5a7bf15988c/scratchpad/key-fuzz-'+STAGE+'.json',JSON.stringify(hits,null,1));
  await b.close();server.close();process.exit(0);
});
