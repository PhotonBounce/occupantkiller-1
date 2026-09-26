// End-to-end check of the player-reported backlog, on a live level, with
// screenshots so visual claims can be judged from pixels rather than source.
// Captures: a wide shot, a close-up of an enemy, a close-up of an allied NPC,
// and a night/weather shot. Reports weapon mounting, time/season, weather,
// wildlife, drone loadout, light counts and any page error.
// Usage: PORT=4730 node tools/verify-backlog.js [stageIdx]
const http=require('http'),fs=require('fs'),path=require('path');
let chromium; try{({chromium}=require('/opt/node22/lib/node_modules/playwright'));}catch(e){({chromium}=require('playwright'));}
const ROOT='/home/user/occupantkiller-1';
const OUT='/tmp/claude-0/-home-user-occupantkiller-1/935a3386-bf68-508b-961f-b5a7bf15988c/scratchpad';
const PORT=parseInt(process.env.PORT||'4730',10);
const STAGE=parseInt(process.argv[2]||'0',10);
// Level build is synchronous and slow under software rendering; give it room.
const BUILD_WAIT_MS=parseInt(process.env.BUILD_WAIT_MS||'150000',10);
const MIME={'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const fp=path.join(ROOT,p);if(!fp.startsWith(ROOT)){s.writeHead(403);return s.end();}fs.readFile(fp,(e,d)=>{if(e){s.writeHead(404);return s.end('404');}s.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});s.end(d);});});
const log=m=>{console.log(m);};

async function shot(pg,name){
  const durl=await pg.evaluate(()=>{try{return GameManager.captureFrame?GameManager.captureFrame():null;}catch(e){return null;}});
  const f=path.join(OUT,'verify-'+name+'-'+STAGE+'.png');
  if(durl&&durl.startsWith('data:image/png;base64,')){fs.writeFileSync(f,Buffer.from(durl.split(',')[1],'base64'));log('  shot '+name+' -> '+f);return f;}
  log('  shot '+name+' FAILED'); return null;
}

server.listen(PORT,async()=>{
  const b=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio']});
  const _ctx=await b.newContext({viewport:{width:720,height:450}});
  // waitForFunction's 2nd arg is `arg`, not options — an options object there
  // is ignored and the 30s default applies. Set the real budget on the context.
  _ctx.setDefaultTimeout(240000);
  const pg=await _ctx.newPage();
  const errs=[];pg.on('pageerror',e=>errs.push(String(e.message||e)));
  log('booting stage '+STAGE+'...');
  await pg.goto('http://localhost:'+PORT+'/index.html',{waitUntil:'commit',timeout:30000});
  await pg.waitForFunction(()=>typeof window.GameManager!=='undefined'&&!!GameManager.startGame);
  log('globals ready');
  await pg.evaluate(i=>{window.__chosenStartStage=i;setTimeout(()=>{try{GameManager.startGame();}catch(e){}},0);},STAGE);
  // Do NOT poll from node while the level builds. Level generation is one long
  // SYNCHRONOUS block on the page's main thread, so every page.evaluate() issued
  // during it simply queues until it ends — which reads as a hung harness even
  // though the game is fine. Wait out the build with a driver-side timeout
  // (which does not touch the page), then probe once.
  log('  building level (synchronous; waiting it out)...');
  await pg.waitForTimeout(BUILD_WAIT_MS);
  const st0=await pg.evaluate(()=>{try{return GameManager.getState?GameManager.getState():'?';}catch(e){return 'err';}});
  log('  state after build wait: '+st0);
  if(st0!=='playing'){ log('never reached playing'); await b.close(); server.close(); process.exit(1); }
  log('playing');
  await pg.waitForTimeout(30000);   // let the wave spawn and wildlife tick
  await pg.evaluate(()=>{try{Object.defineProperty(document,'pointerLockElement',{get:()=>document.body,configurable:true});}catch(e){}});

  await shot(pg,'wide');

  // Park the camera in front of a live enemy, then an allied NPC.
  for(const who of ['enemy','npc']){
    const info=await pg.evaluate((w)=>{
      const cam=window.GAME&&GAME.camera; const sc=window.GAME&&GAME.scene;
      if(!cam||!sc)return{err:'no camera/scene'};
      const want=(w==='enemy')?'occupant':'ukrainian';
      let best=null,bd=1e9; const v=new THREE.Vector3();
      sc.traverse(o=>{ const u=o.userData||{}; if(u.faction!==want)return;
        o.getWorldPosition(v); const d=v.distanceTo(cam.position);
        if(d<bd){bd=d;best={x:v.x,y:v.y,z:v.z,kind:u.weaponKind||null,hasPivot:!!u.weaponPivot};} });
      if(!best)return{err:'no '+want+' in scene'};
      cam.position.set(best.x+2.6,best.y+1.6,best.z+2.6);
      cam.lookAt(best.x,best.y+1.0,best.z);
      return best;
    },who);
    log('  '+who+': '+JSON.stringify(info));
    await pg.waitForTimeout(500);
    await shot(pg,who);
  }

  // Exercise the drone loadout: pick the bomber and drop on something.
  const drone=await pg.evaluate(async()=>{
    const out={};
    try{
      out.before=GameManager.getDroneLoadout().map(d=>d.type+':'+d.ammo);
      out.launched=GameManager.launchDroneFromLoadout('bomb');
      out.possessing=DroneSystem.isPossessing();
      const d=DroneSystem.getPossessed();
      out.type=d&&d.type; out.hasPayload=d&&d.hasPayload;
      if(d){ out.dropped=DroneSystem.dropPayload(d.id); out.payloadAfter=d.hasPayload; }
      out.after=GameManager.getDroneLoadout().map(x=>x.type+':'+x.ammo);
      DroneSystem.release&&DroneSystem.release();
    }catch(e){out.err=String(e).slice(0,160);}
    return out;
  });
  log('  drone: '+JSON.stringify(drone));

  // Force winter weather so snow, fog and ground cover can be seen at all.
  await pg.evaluate(()=>{ try{
    if(window.TimeSystem){TimeSystem.setSeason('Winter');TimeSystem.setHour(21.0);}
    if(window.WeatherSystem)WeatherSystem.forceWeather('SNOW');
  }catch(e){} });
  await pg.waitForTimeout(22000);   // snow needs ~20s to lay a full cover
  await shot(pg,'night-snow');

  const r=await pg.evaluate(()=>{
    const o={},sc=window.GAME&&GAME.scene;
    // characters and their weapons
    let chars=0,armed=0,uk=0,ru=0; const kinds={};
    if(sc)sc.traverse(x=>{const u=x.userData||{};
      if(u.faction==='ukrainian'||u.faction==='occupant'){chars++;
        if(u.faction==='ukrainian')uk++;else ru++;
        if(u.weaponPivot){armed++;kinds[u.weaponKind]=(kinds[u.weaponKind]||0)+1;}}});
    o.characters={total:chars,ukrainian:uk,russian:ru,armed:armed,kinds:kinds};
    // wildlife
    const wl={};
    if(sc)sc.traverse(x=>{const u=x.userData||{};if(u.faction==='wildlife')wl.count=(wl.count||0)+1;});
    try{ const all=window.NPCSystem&&NPCSystem.getAll?NPCSystem.getAll():[];
      const byType={}; all.forEach(n=>{if(n&&n.wild)byType[n.type]=(byType[n.type]||0)+1;});
      wl.wildByType=byType; }catch(e){}
    o.wildlife=wl;
    // time / weather / snow
    try{o.time=TimeSystem.getFormattedTime();o.season=TimeSystem.getSeason();o.phase=TimeSystem.getInfo().phase;}catch(e){}
    try{o.weather=WeatherSystem.getCurrentWeather();o.groundSnow=WeatherSystem.getGroundSnow();}catch(e){}
    try{o.snowCover=VoxelWorld.getSnowCover?VoxelWorld.getSnowCover():null;}catch(e){}
    // lights (the shader-churn metric)
    let pt=0,sp=0,am=0;
    if(sc)sc.traverse(x=>{if(x.isPointLight)pt++;else if(x.isSpotLight)sp++;else if(x.isAmbientLight)am++;});
    o.lights={point:pt,spot:sp,ambient:am};
    try{o.ambientIntensity=(function(){let a=null;sc.traverse(x=>{if(x.isAmbientLight&&a===null)a=+x.intensity.toFixed(3);});return a;})();}catch(e){}
    // drone loadout
    try{o.droneLoadout=GameManager.getDroneLoadout?GameManager.getDroneLoadout().map(d=>d.type+':'+d.ammo):null;}catch(e){}
    // flashlight
    try{o.flashlightOn=Weapons.isFlashlightOn?Weapons.isFlashlightOn():null;}catch(e){}
    // visible boxes / lines that could read as "collision boxes"
    const vis=[];
    if(sc)sc.traverse(x=>{
      if(!x.visible)return;
      const m=Array.isArray(x.material)?x.material[0]:x.material;
      if(!m)return;
      const wire=!!m.wireframe, line=!!(x.isLine||x.isLineSegments);
      if(!wire&&!line)return;
      vis.push({type:x.type,wire:wire,color:m.color?'#'+m.color.getHexString():null});
    });
    o.visibleWireOrLine=vis.slice(0,20);
    o.visibleWireOrLineCount=vis.length;
    // renderer stats
    try{const rd=GameManager.getRenderer&&GameManager.getRenderer();
      if(rd&&rd.info){o.draws=rd.info.render.calls;o.tris=rd.info.render.triangles;o.programs=rd.info.programs?rd.info.programs.length:null;}}catch(e){}
    return o;
  });
  r.drone=drone;
  r.wildErr=await pg.evaluate(()=>window.__wildlifeErr||null);
  r.pageErrors=errs.slice(0,12);
  console.log('\n=== VERIFY stage '+STAGE+' ===');
  console.log(JSON.stringify(r,null,1));
  fs.writeFileSync(path.join(OUT,'verify-'+STAGE+'.json'),JSON.stringify(r,null,1));
  await b.close();server.close();process.exit(0);
});
