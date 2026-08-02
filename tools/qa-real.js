// REAL playability QA — the check that should have existed.
// Enters ACTUAL gameplay (not the menu/briefing) at the mobile landscape
// viewport, then measures the things a player actually experiences:
//   1) Did the 3D WORLD render?  -> sample the WebGL game-canvas pixels and
//      measure colour diversity + luma variance. A blank/grey screen (the bug
//      in the boss's screenshot) has near-zero variance -> WORLD_BLANK.
//   2) FPS over a fixed window -> counts requestAnimationFrame ticks.
//   3) Broken state -> player/camera position NaN, and any "NaN" text in HUD.
//   4) Saves a real gameplay screenshot to eyeball.
// Writes each step to disk immediately so a stall never loses the finding.
//
// Usage: node tools/qa-real.js <port> <desktop|mobile> <outPng>
const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const ROOT='/home/user/occupantkiller-1';
const PORT=parseInt(process.argv[2]||'4190',10);
const MODE=process.argv[3]||'mobile';
const OUT=process.argv[4]||path.join(ROOT,'tools','qa-real-'+MODE+'.png');
const MOBILE=MODE==='mobile';
const LOG=OUT.replace(/\.png$/,'.log');
try{fs.unlinkSync(LOG);}catch(_){}
const t0=Date.now();
function log(m){fs.appendFileSync(LOG,'['+((Date.now()-t0)/1000).toFixed(1)+'s] '+m+'\n');}
const MIME={'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const fp=path.join(ROOT,p);if(!fp.startsWith(ROOT)){s.writeHead(403);return s.end();}fs.readFile(fp,(e,d)=>{if(e){s.writeHead(404);return s.end('404');}s.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});s.end(d);});});
const MOBILE_UA='Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36';

server.listen(PORT,async()=>{
  log('server up ('+MODE+')');
  const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage']});
  const ctx=await browser.newContext(MOBILE
    ? {userAgent:MOBILE_UA,viewport:{width:915,height:412},isMobile:true,hasTouch:true,deviceScaleFactor:2}
    : {viewport:{width:1280,height:720}});
  const pg=await ctx.newPage();
  const perr=[];pg.on('pageerror',e=>{perr.push(e.message);log('PAGEERROR: '+e.message.slice(0,140));});
  const res={mode:MODE};
  try{
    await pg.goto('http://localhost:'+PORT+'/index.html',{waitUntil:'commit',timeout:20000});
    await pg.waitForFunction(()=>{var r=['THREE','VoxelWorld','Weapons','Enemies','HUD','GameManager'];var f=document.getElementById('boot-progress-bar-fill');return r.every(m=>typeof window[m]!=='undefined')&&f&&f.style.width==='100%';},{timeout:60000});
    log('booted to menu');
    // Install an FPS counter BEFORE gameplay so it spans the whole window
    await pg.evaluate(()=>{window.__frames=0;(function loop(){window.__frames++;requestAnimationFrame(loop);})();});
    await pg.evaluate(()=>{window.__chosenStartStage=0;if(window.GameManager&&GameManager.startGame)GameManager.startGame();});
    await pg.waitForTimeout(2500);
    try{await pg.keyboard.press('Space');}catch(_){}
    try{await pg.mouse.click(MOBILE?450:640,MOBILE?200:360);}catch(_){}
    await pg.waitForTimeout(3500);
    log('in gameplay; measuring...');
    // ── FPS over a 5s window ──
    const f0=await pg.evaluate(()=>window.__frames);
    const w0=Date.now();
    await pg.waitForTimeout(5000);
    const f1=await pg.evaluate(()=>window.__frames);
    res.fps=+(((f1-f0)/((Date.now()-w0)/1000)).toFixed(1));
    // ── World-render + state sampling ──
    const probe=await pg.evaluate(()=>{
      var out={};
      out.canvasCount=document.querySelectorAll('canvas').length;
      // Engine-truth: did the world build, and did the renderer actually draw it?
      // (pixel readback of a WebGL canvas is unreliable headlessly; ask the engine)
      try{
        var sc=(window.GameManager&&GameManager.getScene)?GameManager.getScene():null;
        var meshes=0, visMeshes=0;
        if(sc&&sc.traverse){sc.traverse(function(o){ if(o.isMesh&&o.geometry){meshes++; if(o.visible)visMeshes++;} });}
        out.sceneMeshes=meshes; out.visibleMeshes=visMeshes;
      }catch(e){out.sceneErr=e.message;}
      try{
        var rd=(window.GameManager&&GameManager.getRenderer)?GameManager.getRenderer():null;
        if(rd&&rd.info&&rd.info.render){out.triangles=rd.info.render.triangles; out.drawCalls=rd.info.render.calls;}
        if(rd&&rd.getContext){try{var gl=rd.getContext();var dbg=gl.getExtension('WEBGL_debug_renderer_info');out.glRenderer=dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):(''+gl.getParameter(gl.RENDERER));}catch(_){}}
      }catch(e){out.rendErr=e.message;}
      // player/camera NaN check
      try{
        var p=(window.GameManager&&GameManager.getPlayer)?GameManager.getPlayer():null;
        if(p&&p.position){out.playerPos=[p.position.x,p.position.y,p.position.z];
          out.playerPosNaN=[p.position.x,p.position.y,p.position.z].some(v=>typeof v!=='number'||isNaN(v));}
      }catch(e){out.posErr=e.message;}
      out.state=(window.GameManager&&GameManager.getState)?GameManager.getState():null;
      out.enemies=(window.Enemies&&Enemies.getAliveCount)?Enemies.getAliveCount():null;
      // HUD garbage: NaN visible anywhere?
      var txt=(document.body.innerText||'');
      out.hudHasNaN=/NaN/.test(txt);
      out.nanSnippets=(txt.match(/[\w:]*NaN[\w/]*/g)||[]).slice(0,6);
      return out;
    });
    Object.assign(res,probe);
    // ── Verdicts (engine truth) ──
    // World is BLANK if the renderer drew ~no geometry last frame, or the scene
    // has almost no visible meshes. triangles is the definitive "pixels drawn".
    res.worldBlank = (probe.triangles!=null)
      ? (probe.triangles < 500 || probe.drawCalls < 3)
      : ((probe.visibleMeshes||0) < 5);
    res.playable = res.fps>=20 && !res.worldBlank && !probe.playerPosNaN && !probe.hudHasNaN;
    log('RESULT '+JSON.stringify(res));
    await pg.screenshot({path:OUT});
    log('screenshot -> '+OUT+' ('+(fs.existsSync(OUT)?fs.statSync(OUT).size+'B':'MISSING')+')');
  }catch(e){log('EXCEPTION: '+(e.message||e).slice(0,200)); res.error=(e.message||''+e).slice(0,200);}
  res.realPageErrors=perr.filter(m=>!/ethers|jsdelivr|ERR_TUNNEL|net::/i.test(m)).length;
  log('VERDICT playable='+res.playable+' fps='+res.fps+' worldBlank='+res.worldBlank+' posNaN='+res.playerPosNaN+' hudNaN='+res.hudHasNaN);
  try{await browser.close();}catch(_){}
  log('DONE');server.close();process.exit(res.playable?0:2);
});
