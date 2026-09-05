// Minimal boot/start check: reports page errors and how long the game takes to
// reach the playing state. Use this first whenever a heavier harness times out,
// so a startup regression is distinguished from a slow software-rendered build.
const http=require('http'),fs=require('fs'),path=require('path');
let chromium; try{({chromium}=require('/opt/node22/lib/node_modules/playwright'));}catch(e){({chromium}=require('playwright'));}
const ROOT=process.env.OK_ROOT||path.resolve(__dirname, '..');
const PORT=parseInt(process.env.PORT||'4770',10);
const STAGE=parseInt(process.argv[2]||'0',10);
const MIME={'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const fp=path.join(ROOT,p);if(!fp.startsWith(ROOT)){s.writeHead(403);return s.end();}fs.readFile(fp,(e,d)=>{if(e){s.writeHead(404);return s.end('404');}s.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});s.end(d);});});
server.listen(PORT,async()=>{
  const t0=Date.now(),el=()=>((Date.now()-t0)/1000).toFixed(1)+'s';
  const b=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio']});
  const ctx=await b.newContext({viewport:{width:640,height:400}});
  ctx.setDefaultTimeout(240000);
  const pg=await ctx.newPage();
  const errs=[];pg.on('pageerror',e=>errs.push(String(e.message||e).slice(0,220)));
  await pg.goto('http://localhost:'+PORT+'/index.html',{waitUntil:'commit',timeout:60000});
  await pg.waitForFunction(()=>typeof window.GameManager!=='undefined'&&!!GameManager.startGame,{timeout:240000});
  console.log('['+el()+'] globals ready; boot errors: '+JSON.stringify(errs));
  await pg.evaluate(i=>{window.__chosenStartStage=i;setTimeout(()=>{try{GameManager.startGame();}catch(e){window.__startErr=String(e&&e.stack||e).slice(0,400);}},0);},STAGE);
  let reached=false;
  for(let i=0;i<30;i++){
    await pg.waitForTimeout(5000);
    const st=await pg.evaluate(()=>{try{return{s:GameManager.getState?GameManager.getState():'?',e:window.__startErr||null};}catch(e){return{s:'ERR '+e};}});
    console.log('['+el()+'] state='+st.s+(st.e?' startErr='+st.e:'')+' errs='+errs.length);
    if(st.s==='playing'){reached=true;break;}
  }
  console.log('reached playing: '+reached);
  console.log('pageErrors: '+JSON.stringify(errs.slice(0,8),null,1));
  await b.close();server.close();process.exit(reached?0:1);
});
