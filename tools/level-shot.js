// Lean single-level screenshotter. Small viewport so software GL can keep up
// (the full-size multi-level harness is far too slow headless without a GPU).
// Usage: PORT=4400 node tools/level-shot.js <stageIndex> [outName]
const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const ROOT='/home/user/occupantkiller-1';
const OUT='/tmp/claude-0/-home-user-occupantkiller-1/935a3386-bf68-508b-961f-b5a7bf15988c/scratchpad';
const PORT=parseInt(process.env.PORT||'4400',10);
const STAGE=parseInt(process.argv[2]||'0',10);
const NAME=process.argv[3]||('shot-'+String(STAGE).padStart(2,'0'));
const MIME={'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.svg':'image/svg+xml','.ico':'image/x-icon','.jpg':'image/jpeg'};
const server=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const fp=path.join(ROOT,p);if(!fp.startsWith(ROOT)){s.writeHead(403);return s.end();}fs.readFile(fp,(e,d)=>{if(e){s.writeHead(404);return s.end('404');}s.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});s.end(d);});});
server.listen(PORT,async()=>{
  const t0=Date.now(); const el=()=>((Date.now()-t0)/1000).toFixed(1)+'s';
  const b=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage']});
  const pg=await (await b.newContext({viewport:{width:640,height:360}})).newPage();
  await pg.goto('http://localhost:'+PORT+'/index.html',{waitUntil:'commit',timeout:20000});
  await pg.waitForFunction(()=>['THREE','VoxelWorld','Weapons','Enemies','HUD','GameManager'].every(m=>typeof window[m]!=='undefined')&&!!window.GameManager.startGame,{timeout:90000});
  console.log('booted',el());
  await pg.evaluate((i)=>{window.__chosenStartStage=i;GameManager.startGame();},STAGE);
  await pg.waitForTimeout(2500);
  try{await pg.mouse.click(320,180);}catch(_){}
  await pg.waitForTimeout(5000);
  const info=await pg.evaluate(()=>{
    var o={};
    try{o.stage=GameManager.getCurrentStage&&GameManager.getCurrentStage();}catch(e){}
    var m=(document.body.innerText||'').match(/STAGE\s*\d+\s*:\s*([A-Z0-9 \-—']+?)(?:\s{2,}|SCORE|WAVE|$)/);
    o.name=m?m[1].trim():null;
    try{var r=GameManager.getRenderer();if(r&&r.info)o.tris=r.info.render.triangles;}catch(e){}
    return o;
  });
  console.log('in game',el(),JSON.stringify(info));
  const d=await pg.evaluate(()=>{try{return GameManager.captureFrame&&GameManager.captureFrame();}catch(e){return null;}});
  if(d&&d.indexOf('data:image/png')===0){fs.writeFileSync(path.join(OUT,NAME+'.png'),Buffer.from(d.split(',')[1],'base64'));console.log('saved',NAME+'.png',el());}
  else console.log('capture failed');
  await b.close();server.close();process.exit(0);
});
