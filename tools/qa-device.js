// HONEST device-class QA — reproduces the boss's real complaints in a real
// Chromium (mobile landscape, touch), on the HOSTOMEL AIRPORT level, in AUTO
// mode (nothing forced). Answers the questions the boss actually asked:
//   1) Does the auto-optimizer ACTUALLY drop the triangle budget over time,
//      starting from a cold frame-1 state? (time-series of _perfLevel + tris)
//   2) Do enemies render as real (multi-part) models, or as bare boxes?
//   3) Is the FIRE button + aim joystick actually visible & on-screen?
//   4) Do any HUD / control elements overlap or spill off-screen?
//   5) Any thrown page errors?
// Writes findings to disk immediately + a screenshot to eyeball.
//
// Usage: node tools/qa-device.js <port> <stageIndex> <outPng>
const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const ROOT='/home/user/occupantkiller-1';
const PORT=parseInt(process.argv[2]||'4291',10);
const STAGE=parseInt(process.argv[3]||'0',10);
const OUT=process.argv[4]||path.join(ROOT,'tools','qa-device.png');
const VW=parseInt(process.argv[5]||'915',10);
const VH=parseInt(process.argv[6]||'412',10);
const LOG=OUT.replace(/\.png$/,'.log');
const JSN=OUT.replace(/\.png$/,'.json');
try{fs.unlinkSync(LOG);}catch(_){}
const t0=Date.now();
function log(m){fs.appendFileSync(LOG,'['+((Date.now()-t0)/1000).toFixed(1)+'s] '+m+'\n');}
const MIME={'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const fp=path.join(ROOT,p);if(!fp.startsWith(ROOT)){s.writeHead(403);return s.end();}fs.readFile(fp,(e,d)=>{if(e){s.writeHead(404);return s.end('404');}s.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});s.end(d);});});
const MOBILE_UA='Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36';

server.listen(PORT,async()=>{
  log('server up; stage='+STAGE);
  const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage']});
  const ctx=await browser.newContext({userAgent:MOBILE_UA,viewport:{width:VW,height:VH},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const pg=await ctx.newPage();
  const perr=[];pg.on('pageerror',e=>{perr.push(e.message);log('PAGEERROR: '+e.message.slice(0,160));});
  const res={stage:STAGE,viewport:[VW,VH]};
  try{
    await pg.goto('http://localhost:'+PORT+'/index.html',{waitUntil:'commit',timeout:20000});
    await pg.waitForFunction(()=>{var r=['THREE','VoxelWorld','Weapons','Enemies','HUD','GameManager'];var f=document.getElementById('boot-progress-bar-fill');return r.every(m=>typeof window[m]!=='undefined')&&f&&f.style.width==='100%';},{timeout:60000});
    log('booted to menu');
    await pg.evaluate(()=>{window.__frames=0;(function loop(){window.__frames++;requestAnimationFrame(loop);})();});
    await pg.evaluate((st)=>{window.__QA_START_STAGE=st;if(window.GameManager&&GameManager.startGame)GameManager.startGame();},STAGE);
    await pg.waitForTimeout(2500);
    try{await pg.keyboard.press('Space');}catch(_){}
    try{await pg.mouse.click(650,200);}catch(_){}
    await pg.waitForTimeout(2500);
    log('in gameplay; sampling time-series (auto mode, nothing forced)...');

    // ── Time-series: does the optimizer actually drop tris from a cold start? ──
    res.series=[];
    let prevFrames=await pg.evaluate(()=>window.__frames), prevT=Date.now();
    for(let i=0;i<14;i++){
      await pg.waitForTimeout(2000);
      const s=await pg.evaluate(()=>{
        var o={};
        try{var rd=GameManager.getRenderer&&GameManager.getRenderer();if(rd&&rd.info&&rd.info.render){o.tris=rd.info.render.triangles;o.calls=rd.info.render.calls;}}catch(e){}
        o.pl=(typeof window._perfLevel==='number')?window._perfLevel:null;
        o.en=(window.Enemies&&Enemies.getAliveCount)?Enemies.getAliveCount():null;
        o.frames=window.__frames;
        return o;
      });
      const nowT=Date.now();
      s.fps=+(((s.frames-prevFrames)/((nowT-prevT)/1000)).toFixed(1));
      prevFrames=s.frames;prevT=nowT;delete s.frames;
      s.t=+(((nowT-t0)/1000).toFixed(1));
      res.series.push(s);
      log('  t='+s.t+'s pl='+s.pl+' tris='+s.tris+' calls='+s.calls+' fps='+s.fps+' enemies='+s.en);
    }

    // ── Deep probe: enemy models, controls visibility, HUD overlaps ──
    const probe=await pg.evaluate(()=>{
      var out={};
      // Enemy mesh anatomy: real soldiers are multi-part groups; a bare box is 1 mesh.
      try{
        var info=(window.Enemies&&Enemies.getDebugMeshInfo)?Enemies.getDebugMeshInfo():null;
        out.enemyMeshInfo=info;
        if(!info){
          // Fallback: scan the scene for enemy groups
          var sc=GameManager.getScene&&GameManager.getScene();
          var groups=[];
          if(sc&&sc.traverse){sc.traverse(function(o){ if(o.userData&&(o.userData.faction==='occupant'||o.userData.parts||o.userData.isEnemy)){var m=0;o.traverse(function(c){if(c.isMesh)m++;});groups.push(m);} });}
          out.enemyGroupMeshCounts=groups.slice(0,12);
        }
      }catch(e){out.enemyErr=e.message;}
      // Controls: is the fire button + aim joystick actually visible & on-screen?
      function rect(id){var el=document.getElementById(id);if(!el)return {id:id,exists:false};
        var r=el.getBoundingClientRect();var cs=getComputedStyle(el);
        var visible=cs.display!=='none'&&cs.visibility!=='hidden'&&parseFloat(cs.opacity||'1')>0.05&&r.width>2&&r.height>2;
        var onScreen=r.right>0&&r.bottom>0&&r.left<innerWidth&&r.top<innerHeight;
        return {id:id,exists:true,visible:visible,onScreen:onScreen,rect:[Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)]};
      }
      out.controls={};
      ['mobile-controls','btn-fire','aim-joystick-zone','joystick-zone','btn-reload','btn-jump','btn-grenade','mobile-look-zone'].forEach(function(id){out.controls[id]=rect(id);});
      // HUD overlap: check the stacked top-bar cluster + bottom sections for
      // rectangles that intersect each other (the "overlapping labels" bug).
      var hudIds=['top-bar','extended-top-bar','resource-bar','stage-display','hud-okc-bar','weapon-display','minimap-container','rank-card'];
      var rects=[];
      hudIds.forEach(function(id){var el=document.getElementById(id);if(!el)return;var cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')return;var r=el.getBoundingClientRect();if(r.width<2||r.height<2)return;rects.push({id:id,r:r});});
      function overlap(a,b){return !(a.r.right<=b.r.left||b.r.right<=a.r.left||a.r.bottom<=b.r.top||b.r.bottom<=a.r.top);}
      function nested(a,b){var ea=document.getElementById(a.id),eb=document.getElementById(b.id);return ea&&eb&&(ea.contains(eb)||eb.contains(ea));}
      var overlaps=[];
      for(var i=0;i<rects.length;i++)for(var j=i+1;j<rects.length;j++){if(overlap(rects[i],rects[j])&&!nested(rects[i],rects[j])){
        var ox=Math.max(0,Math.min(rects[i].r.right,rects[j].r.right)-Math.max(rects[i].r.left,rects[j].r.left));
        var oy=Math.max(0,Math.min(rects[i].r.bottom,rects[j].r.bottom)-Math.max(rects[i].r.top,rects[j].r.top));
        overlaps.push(rects[i].id+' × '+rects[j].id+' ('+Math.round(ox)+'x'+Math.round(oy)+'px)');
      }}
      out.hudOverlaps=overlaps;
      // Anything spilling off the right/bottom edge?
      var spill=[];
      hudIds.concat(['btn-fire','aim-joystick-zone','mobile-actions']).forEach(function(id){var el=document.getElementById(id);if(!el)return;var cs=getComputedStyle(el);if(cs.display==='none')return;var r=el.getBoundingClientRect();if(r.width<2)return;if(r.right>innerWidth+2||r.bottom>innerHeight+2||r.left<-2||r.top<-2)spill.push(id+' ['+Math.round(r.left)+','+Math.round(r.top)+','+Math.round(r.right)+','+Math.round(r.bottom)+'] vp='+innerWidth+'x'+innerHeight);});
      out.offScreen=spill;
      out.isMobileClass=document.documentElement.classList.contains('is-mobile');
      out.hudScale=getComputedStyle(document.getElementById('hud')||document.body).getPropertyValue('--hud-scale');
      out.state=GameManager.getState&&GameManager.getState();
      var txt=document.body.innerText||'';out.hudHasNaN=/NaN/.test(txt);
      return out;
    });
    Object.assign(res,probe);

    const last=res.series[res.series.length-1]||{};
    res.finalTris=last.tris;res.finalPl=last.pl;
    // Drawn-triangle budget: the sandbox software-rasterizes so its FPS is
    // meaningless, but the DRAWN triangle count (after cull) is engine-truth and
    // reflects the vertex/CPU-cull load a real mobile GPU sees. <80k drawn is
    // comfortable for an Adreno-class GPU. (True on-device FPS needs the device.)
    res.trisWithinBudget = (last.tris!=null && last.tris>500 && last.tris<80000);
    res.fireUsable = res.controls['btn-fire'] && res.controls['btn-fire'].visible && res.controls['btn-fire'].onScreen;
    res.noOverlap = (res.hudOverlaps||[]).length===0;
    res.noOffScreen = (res.offScreen||[]).length===0;
    res.realPageErrors=perr.filter(m=>!/ethers|jsdelivr|ERR_TUNNEL|net::/i.test(m));
    res.clean = res.trisWithinBudget && res.fireUsable && res.noOverlap && res.noOffScreen && !res.hudHasNaN && res.realPageErrors.length===0;
    await pg.screenshot({path:OUT});
    log('screenshot -> '+OUT+' ('+(fs.existsSync(OUT)?fs.statSync(OUT).size+'B':'MISSING')+')');
    fs.writeFileSync(JSN,JSON.stringify(res,null,2));
    log('RESULT '+JSON.stringify({finalTris:res.finalTris,finalPl:res.finalPl,trisWithinBudget:res.trisWithinBudget,fireUsable:res.fireUsable,noOverlap:res.noOverlap,noOffScreen:res.noOffScreen,hudOverlaps:res.hudOverlaps,offScreen:res.offScreen,errs:res.realPageErrors.length,clean:res.clean}));
  }catch(e){log('EXCEPTION: '+(e.message||e).slice(0,240));res.error=(e.message||''+e).slice(0,240);}
  try{await browser.close();}catch(_){}
  log('VERDICT clean='+res.clean);log('DONE');server.close();process.exit(res.clean?0:2);
});
