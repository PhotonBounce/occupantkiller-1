// Multi-level visual/geometry audit.
// Loads several DISTINCTLY-NAMED stages and captures, per stage:
//   - stage name/id, sceneMeshes, visibleMeshes, triangles, drawCalls
//   - a geometry FINGERPRINT: scene bounding box dims + a hash of all mesh
//     world positions (quantized). If two differently-named stages share the
//     same fingerprint, they are the SAME recycled geometry — the reported bug.
//   - a screenshot to eyeball.
// Fresh page per stage for clean state.
// Usage: node tools/qa-levels.js [idx,idx,...]
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const ROOT='/home/user/occupantkiller-1';
const OUTDIR='/tmp/claude-0/-home-user-occupantkiller-1/935a3386-bf68-508b-961f-b5a7bf15988c/scratchpad';
const PORT=parseInt(process.env.PORT||'4193',10);
const STAGES=(process.argv[2]||'0,2,4,5,11').split(',').map(s=>parseInt(s,10));
const LOG=path.join(OUTDIR,'qa-levels.log');
try{fs.unlinkSync(LOG);}catch(_){}
const t0=Date.now();
function log(m){const s='['+((Date.now()-t0)/1000).toFixed(1)+'s] '+m;fs.appendFileSync(LOG,s+'\n');console.log(s);}
const MIME={'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const fp=path.join(ROOT,p);if(!fp.startsWith(ROOT)){s.writeHead(403);return s.end();}fs.readFile(fp,(e,d)=>{if(e){s.writeHead(404);return s.end('404');}s.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});s.end(d);});});

async function loadStage(ctx,idx){
  const pg=await ctx.newPage();
  const perr=[];pg.on('pageerror',e=>perr.push(e.message));
  const out={idx};
  try{
    await pg.goto('http://localhost:'+PORT+'/index.html',{waitUntil:'commit',timeout:20000});
    // Readiness: all core globals defined AND startGame available. (The old
    // boot-progress-bar element is REMOVED once boot completes, so gating on its
    // width==='100%' race-timed-out — that was the harness bug, not the game.)
    await pg.waitForFunction(()=>['THREE','VoxelWorld','Weapons','Enemies','HUD','GameManager'].every(m=>typeof window[m]!=='undefined')&&!!(window.GameManager&&window.GameManager.startGame),{timeout:60000});
    await pg.evaluate((i)=>{window.__chosenStartStage=i;if(window.GameManager&&GameManager.startGame)GameManager.startGame();},idx);
    await pg.waitForTimeout(2500);
    try{await pg.keyboard.press('Space');}catch(_){}
    try{await pg.mouse.click(640,360);}catch(_){}
    await pg.waitForTimeout(5000); // let world build + settle
    const probe=await pg.evaluate(()=>{
      var o={};
      try{o.stage=(window.GameManager&&GameManager.getCurrentStage)?GameManager.getCurrentStage():null;}catch(e){}
      // stage name from the STAGE banner text if present
      var m=(document.body.innerText||'').match(/STAGE\s*\d+\s*:\s*([A-Z0-9 \-—]+?)(?:\s{2,}|SCORE|WAVE|$)/);
      o.name=m?m[1].trim():null;
      try{
        var sc=GameManager.getScene&&GameManager.getScene();
        var meshes=0,vis=0,positions=[],box={minx:1e9,miny:1e9,minz:1e9,maxx:-1e9,maxy:-1e9,maxz:-1e9};
        var v=new (window.THREE.Vector3)();
        if(sc&&sc.traverse){sc.traverse(function(x){
          if(x.isMesh&&x.geometry){meshes++;if(x.visible)vis++;
            x.getWorldPosition(v);
            if(x.visible){
              box.minx=Math.min(box.minx,v.x);box.maxx=Math.max(box.maxx,v.x);
              box.miny=Math.min(box.miny,v.y);box.maxy=Math.max(box.maxy,v.y);
              box.minz=Math.min(box.minz,v.z);box.maxz=Math.max(box.maxz,v.z);
              // quantize to 3m for a stable fingerprint of the world layout
              positions.push(Math.round(v.x/3)+','+Math.round(v.y/3)+','+Math.round(v.z/3));
            }
          }
        });}
        o.sceneMeshes=meshes;o.visibleMeshes=vis;
        o.bbox=[Math.round(box.maxx-box.minx),Math.round(box.maxy-box.miny),Math.round(box.maxz-box.minz)];
        positions.sort();
        o.__posjoined=positions.join(';');
      }catch(e){o.sceneErr=e.message;}
      try{var rd=GameManager.getRenderer&&GameManager.getRenderer();if(rd&&rd.info&&rd.info.render){o.triangles=rd.info.render.triangles;o.drawCalls=rd.info.render.calls;}}catch(e){}
      o.enemies=(window.Enemies&&Enemies.getAliveCount)?Enemies.getAliveCount():null;
      return o;
    });
    // hash the position layout in node
    if(probe.__posjoined!=null){probe.fingerprint=crypto.createHash('md5').update(probe.__posjoined).digest('hex').slice(0,12);probe.posCount=probe.__posjoined?probe.__posjoined.split(';').length:0;delete probe.__posjoined;}
    Object.assign(out,probe);
    // Capture via the game's own on-demand frame render (a data URL) instead of
    // Playwright's page.screenshot, which hangs on document.fonts.ready with the
    // game's custom webfont. Also exercises GameManager.captureFrame().
    const png=path.join(OUTDIR,'lvl-'+String(idx).padStart(2,'0')+'.png');
    try{
      const durl=await pg.evaluate(()=>{try{return (window.GameManager&&GameManager.captureFrame)?GameManager.captureFrame():null;}catch(e){return null;}});
      if(durl&&durl.indexOf('data:image/png;base64,')===0){fs.writeFileSync(png,Buffer.from(durl.split(',')[1],'base64'));out.png=png;}
      else{out.pngErr='captureFrame returned '+(durl?durl.slice(0,30):'null');}
    }catch(e){out.pngErr=(e.message||''+e).slice(0,80);}
    out.errs=perr.filter(m=>!/ethers|jsdelivr|ERR_TUNNEL|net::/i.test(m)).length;
    log('stage '+idx+' "'+(out.name||'?')+'" meshes='+out.visibleMeshes+' tris='+out.triangles+' bbox='+JSON.stringify(out.bbox)+' fp='+out.fingerprint+' enemies='+out.enemies);
  }catch(e){out.error=(e.message||''+e).slice(0,160);log('stage '+idx+' EXCEPTION '+out.error);}
  try{await pg.close();}catch(_){}
  return out;
}

server.listen(PORT,async()=>{
  log('server up; stages='+STAGES.join(','));
  const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage']});
  const ctx=await browser.newContext({viewport:{width:1280,height:720}});
  const results=[];
  for(const idx of STAGES){results.push(await loadStage(ctx,idx));}
  // compare fingerprints
  const byFp={};results.forEach(r=>{if(r.fingerprint){(byFp[r.fingerprint]=byFp[r.fingerprint]||[]).push((r.name||'?')+'#'+r.idx);}});
  log('=== FINGERPRINT GROUPS (same fp = identical geometry) ===');
  Object.keys(byFp).forEach(fp=>log('  '+fp+' -> '+byFp[fp].join(' , ')));
  const distinct=Object.keys(byFp).length;
  log('DISTINCT LAYOUTS: '+distinct+' / '+results.length+' stages tested');
  fs.writeFileSync(path.join(OUTDIR,'qa-levels.json'),JSON.stringify(results,null,1));
  try{await browser.close();}catch(_){}
  log('DONE');server.close();process.exit(0);
});
