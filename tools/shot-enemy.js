// Parks the camera a few metres in front of a live enemy and an NPC and captures
// the frame, so reported visual artefacts (e.g. "collision boxes around NPCs")
// can be judged from actual pixels instead of guessed at from source.
// Usage: PORT=4714 node tools/shot-enemy.js [stageIdx]
const http=require('http'),fs=require('fs'),path=require('path');
let chromium; try{({chromium}=require('/opt/node22/lib/node_modules/playwright'));}catch(e){({chromium}=require('playwright'));}
const ROOT='/home/user/occupantkiller-1';
const OUT='/tmp/claude-0/-home-user-occupantkiller-1/935a3386-bf68-508b-961f-b5a7bf15988c/scratchpad';
const PORT=parseInt(process.env.PORT||'4714',10);
const STAGE=parseInt(process.argv[2]||'0',10);
const MIME={'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const fp=path.join(ROOT,p);if(!fp.startsWith(ROOT)){s.writeHead(403);return s.end();}fs.readFile(fp,(e,d)=>{if(e){s.writeHead(404);return s.end('404');}s.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});s.end(d);});});
server.listen(PORT,async()=>{
  const b=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio']});
  const _ctx=await b.newContext({viewport:{width:1280,height:720}});
  // waitForFunction's 2nd arg is `arg`, not options — an options object there
  // is ignored and the 30s default applies. Set the real budget on the context.
  _ctx.setDefaultTimeout(240000);
  const pg=await _ctx.newPage();
  await pg.goto('http://localhost:'+PORT+'/index.html',{waitUntil:'commit',timeout:30000});
  await pg.waitForFunction(()=>['THREE','VoxelWorld','GameManager'].every(m=>typeof window[m]!=='undefined')&&!!(window.GameManager&&window.GameManager.startGame),{timeout:90000});
  await pg.evaluate(i=>{window.__chosenStartStage=i;setTimeout(()=>{try{GameManager.startGame();}catch(e){}},0);},STAGE);
  await pg.waitForTimeout(14000);
  for(const which of ['enemy','npc']){
    const info=await pg.evaluate((w)=>{
      const cam=(window.GAME&&GAME.camera);if(!cam)return{err:'no camera'};
      let list=[];
      if(w==='enemy'){ try{list=(window.Enemies&&Enemies.getAll)?Enemies.getAll().filter(e=>e&&e.mesh&&!e.dead&&e.hp>0):[];}catch(e){} }
      else { try{list=(window.NPCSystem&&NPCSystem.getAll)?NPCSystem.getAll():[];}catch(e){}
             if(!list.length){ const sc=(window.GAME&&GAME.scene); if(sc) sc.traverse(o=>{const u=o.userData||{};if(u.faction&&u.faction!=='wildlife')list.push({mesh:o});}); } }
      if(!list.length)return{err:'no '+w+' found'};
      const t=list[0]; const v=new THREE.Vector3(); t.mesh.getWorldPosition(v);
      cam.position.set(v.x+3.2,v.y+1.7,v.z+3.2);
      cam.lookAt(v.x,v.y+1.0,v.z);
      return {count:list.length,at:[+v.x.toFixed(1),+v.y.toFixed(1),+v.z.toFixed(1)]};
    },which);
    await pg.waitForTimeout(400);
    const durl=await pg.evaluate(()=>{try{return GameManager.captureFrame?GameManager.captureFrame():null;}catch(e){return null;}});
    const f=path.join(OUT,'shot-'+which+'-'+STAGE+'.png');
    if(durl&&durl.startsWith('data:image/png;base64,')){fs.writeFileSync(f,Buffer.from(durl.split(',')[1],'base64'));console.log(which,JSON.stringify(info),'->',f);}
    else console.log(which,JSON.stringify(info),'capture failed');
  }
  await b.close();server.close();process.exit(0);
});
