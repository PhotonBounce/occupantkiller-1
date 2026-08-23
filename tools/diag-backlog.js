// One probe that answers the open player-reported questions with measurements
// rather than guesses:
//   1. what the visible boxes around NPCs actually are (mesh + material + owner)
//   2. what audio is playing (the "whistling" in the background)
//   3. flashlight / spotlight state and the time-of-day the level started at
//   4. the canvas census (the player's HUD showed 132 2D canvases vs 12 in CI)
//   5. actual player speed vs the movement cap
//   6. drone system state
// Usage: PORT=4712 node tools/diag-backlog.js [stageIdx]
const http=require('http'),fs=require('fs'),path=require('path');
let chromium; try{({chromium}=require('/opt/node22/lib/node_modules/playwright'));}catch(e){({chromium}=require('playwright'));}
const ROOT='/home/user/occupantkiller-1';
const PORT=parseInt(process.env.PORT||'4712',10);
const STAGE=parseInt(process.argv[2]||'0',10);
const MIME={'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const fp=path.join(ROOT,p);if(!fp.startsWith(ROOT)){s.writeHead(403);return s.end();}fs.readFile(fp,(e,d)=>{if(e){s.writeHead(404);return s.end('404');}s.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});s.end(d);});});

server.listen(PORT,async()=>{
  const b=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio']});
  const pg=await (await b.newContext({viewport:{width:960,height:600}})).newPage();
  const errs=[]; pg.on('pageerror',e=>errs.push(String(e.message||e)));
  // Record every Audio/AudioBufferSource that actually starts, with a stack, so
  // a looping background sound can be traced back to the module that made it.
  await pg.addInitScript(()=>{
    window.__audio=[];
    function note(kind,src){ try{ window.__audio.push({kind:kind,src:String(src||'').slice(-70),stack:(new Error()).stack.split('\n').slice(2,5).join(' | ')}); }catch(e){} }
    const AP=window.Audio; if(AP){ window.Audio=function(s){ const a=new AP(s); note('Audio',s); return a; }; }
    const play=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(){ note('play',this.src||this.currentSrc); return play.apply(this,arguments); };
    if(window.OscillatorNode){ const st=OscillatorNode.prototype.start;
      OscillatorNode.prototype.start=function(){ note('osc:'+this.type+'@'+(this.frequency&&this.frequency.value),''); return st.apply(this,arguments); }; }
    if(window.AudioBufferSourceNode){ const st2=AudioBufferSourceNode.prototype.start;
      AudioBufferSourceNode.prototype.start=function(){ note('bufsrc'+(this.loop?':LOOP':''),''); return st2.apply(this,arguments); }; }
  });
  await pg.goto('http://localhost:'+PORT+'/index.html',{waitUntil:'commit',timeout:30000});
  await pg.waitForFunction(()=>['THREE','VoxelWorld','GameManager'].every(m=>typeof window[m]!=='undefined')&&!!(window.GameManager&&window.GameManager.startGame),{timeout:90000});
  await pg.evaluate(i=>{window.__chosenStartStage=i;setTimeout(()=>{try{GameManager.startGame();}catch(e){}},0);},STAGE);
  await pg.waitForTimeout(12000);
  const r=await pg.evaluate(()=>{
    const o={};
    const sc=(window.GAME&&window.GAME.scene)||window.scene||(window.GameManager&&GameManager.getScene&&GameManager.getScene());
    o.hasScene=!!sc;
    // --- 1. visible box-ish meshes attached to enemy/NPC groups -------------
    const boxes=[];
    if(sc) sc.traverse(o2=>{
      if(!o2.isMesh||!o2.visible) return;
      const m=Array.isArray(o2.material)?o2.material[0]:o2.material; if(!m) return;
      const isWire=!!m.wireframe;
      const g=o2.geometry; if(!g||!g.boundingBox) { try{g&&g.computeBoundingBox();}catch(e){} }
      const bb=g&&g.boundingBox; if(!bb) return;
      const sz=[bb.max.x-bb.min.x,bb.max.y-bb.min.y,bb.max.z-bb.min.z];
      const human = sz[1]>1.2 && sz[1]<2.6 && sz[0]<1.5 && sz[2]<1.5;
      if(!isWire && !human) return;
      // walk up to find owning group tag
      let p=o2,tag='';
      for(let i=0;i<6&&p;i++){ const u=p.userData||{}; if(u.isEnemy||u.enemy||u.isNPC||u.npc||u.type){tag=(u.type||'')+(u.isEnemy?' isEnemy':'')+(u.isNPC?' isNPC':'');break;} p=p.parent; }
      boxes.push({name:o2.name||'(anon)',parent:(o2.parent&&o2.parent.name)||'',tag:tag,wire:isWire,
        mat:m.type,color:m.color?'#'+m.color.getHexString():null,op:m.opacity,transp:!!m.transparent,
        colorWrite:m.colorWrite!==false,size:sz.map(v=>+v.toFixed(2)),geo:g.type});
    });
    // Line/LineSegments are NOT isMesh, so a box drawn as edges is invisible to
    // the mesh sweep above. A cyan edge box around an NPC is exactly that shape.
    const lines=[];
    if(sc) sc.traverse(o2=>{
      if(!(o2.isLine||o2.isLineSegments||o2.isLineLoop)||!o2.visible) return;
      const m=Array.isArray(o2.material)?o2.material[0]:o2.material;
      const g=o2.geometry; if(g&&!g.boundingBox){try{g.computeBoundingBox();}catch(e){}}
      const bb=g&&g.boundingBox;
      const sz=bb?[bb.max.x-bb.min.x,bb.max.y-bb.min.y,bb.max.z-bb.min.z].map(v=>+v.toFixed(2)):null;
      let p2=o2,tag='';
      for(let i=0;i<6&&p2;i++){const u=p2.userData||{};if(u.isEnemy||u.enemy||u.isNPC||u.npc||u.faction||u.type){tag=JSON.stringify({t:u.type,f:u.faction,e:!!u.isEnemy,n:!!u.isNPC});break;}p2=p2.parent;}
      lines.push({name:o2.name||'(anon)',type:o2.type,tag:tag,geo:g&&g.type,
        color:m&&m.color?'#'+m.color.getHexString():null,op:m&&m.opacity,size:sz});
    });
    const lseen={};lines.forEach(x=>{const k=JSON.stringify([x.type,x.geo,x.color,x.op,x.size,x.tag]);lseen[k]=(lseen[k]||0)+1;});
    o.lineObjects=Object.keys(lseen).map(k=>({n:lseen[k],def:JSON.parse(k)})).sort((a,b)=>b.n-a.n).slice(0,20);
    o.lineTotal=lines.length;
    // Sprites too — a billboarded marker reads as an indicator.
    const sprites=[];if(sc)sc.traverse(o2=>{if(o2.isSprite&&o2.visible)sprites.push((o2.material&&o2.material.color)?'#'+o2.material.color.getHexString():'?');});
    o.spriteTotal=sprites.length;
    // collapse identical shapes
    const seen={};
    boxes.forEach(x=>{const k=JSON.stringify([x.name,x.geo,x.mat,x.color,x.op,x.colorWrite,x.wire,x.size]);seen[k]=(seen[k]||0)+1;});
    o.suspectBoxes=Object.keys(seen).map(k=>({n:seen[k],...JSON.parse('{"v":'+k+'}').v?{}:{}, def:JSON.parse(k)})).sort((a,b)=>b.n-a.n).slice(0,15);
    // --- 2. audio ----------------------------------------------------------
    o.audio=(window.__audio||[]).slice(0,60);
    o.audioCount=(window.__audio||[]).length;
    // --- 3. lights / flashlight / time of day ------------------------------
    const lights=[]; if(sc) sc.traverse(x=>{ if(x.isLight) lights.push({t:x.type,i:+(x.intensity||0).toFixed(2),name:x.name||'',keep:!!(x.userData&&x.userData.keepLight)}); });
    o.lights=lights;
    o.spots=lights.filter(l=>l.t==='SpotLight');
    try{o.flashlight=(window.Flashlight&&Flashlight.isOn&&Flashlight.isOn())??null;}catch(e){}
    o.timeOfDayGlobals=['TimeOfDay','TimeSystem','DayNight','Weather','WeatherSystem','Seasons','SeasonSystem','SnowSystem','Rain','Animals','Wildlife','DroneSystem','Drones']
      .filter(n=>typeof window[n]!=='undefined');
    try{ if(window.TimeOfDay&&TimeOfDay.getPhase) o.phase=TimeOfDay.getPhase(); }catch(e){}
    try{ if(window.TimeSystem&&TimeSystem.getHour) o.hour=TimeSystem.getHour(); }catch(e){}
    // --- 4. canvases -------------------------------------------------------
    const cv=document.getElementsByTagName('canvas'); let gl=0,d2=0;
    for(const c of cv){ (c.__ctxKind==='2d')?d2++:0; }
    o.canvasCount=cv.length;
    // --- 5. speed ----------------------------------------------------------
    try{o.playerPos=window.GAME&&GAME.camera?GAME.camera.position.toArray().map(v=>+v.toFixed(1)):null;}catch(e){}
    // --- 6. drone ----------------------------------------------------------
    try{ o.droneApi = window.DroneSystem?Object.keys(window.DroneSystem):null; }catch(e){}
    o.errs=(window.__pageErrs||[]);
    return o;
  });
  r.pageErrors=errs.slice(0,10);
  console.log(JSON.stringify(r,null,1));
  await b.close();server.close();process.exit(0);
});
