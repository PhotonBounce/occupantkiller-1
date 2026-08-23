// Measures the whole day/night lighting chain at a forced hour so it is clear
// which stage is not responding: sun, ambient, hemisphere, fog, background, or
// a separate sky mesh that none of them touch.
const http=require('http'),fs=require('fs'),path=require('path');
let chromium; try{({chromium}=require('/opt/node22/lib/node_modules/playwright'));}catch(e){({chromium}=require('playwright'));}
const ROOT='/home/user/occupantkiller-1';
const OUT='/tmp/claude-0/-home-user-occupantkiller-1/935a3386-bf68-508b-961f-b5a7bf15988c/scratchpad';
const PORT=parseInt(process.env.PORT||'4740',10);
const MIME={'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const fp=path.join(ROOT,p);if(!fp.startsWith(ROOT)){s.writeHead(403);return s.end();}fs.readFile(fp,(e,d)=>{if(e){s.writeHead(404);return s.end('404');}s.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});s.end(d);});});
server.listen(PORT,async()=>{
  const b=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage','--mute-audio']});
  const pg=await (await b.newContext({viewport:{width:768,height:480}})).newPage();
  const errs=[];pg.on('pageerror',e=>errs.push(String(e.message||e)));
  await pg.goto('http://localhost:'+PORT+'/index.html',{waitUntil:'commit',timeout:30000});
  await pg.waitForFunction(()=>['THREE','VoxelWorld','GameManager'].every(m=>typeof window[m]!=='undefined')&&!!(window.GameManager&&window.GameManager.startGame),{timeout:120000});
  await pg.evaluate(()=>{window.__chosenStartStage=0;setTimeout(()=>{try{GameManager.startGame();}catch(e){}},0);});
  await pg.waitForFunction(()=>{try{return GameManager.getState()==='playing';}catch(e){return false;}},{timeout:120000});
  await pg.waitForTimeout(5000);
  // Point the camera at the horizon so the sky and ground are both in frame.
  await pg.evaluate(()=>{const c=GAME.camera;c.rotation.set(-0.1,0,0);});
  function snap(hour, weather){
    return pg.evaluate(([h,w])=>{
      try{ if(window.TimeSystem){ TimeSystem.setHour(h); } }catch(e){}
      try{ if(w&&window.WeatherSystem) WeatherSystem.forceWeather(w); }catch(e){}
      const sc=GAME.scene,o={hour:h,weather:w};
      let sun=null,amb=null,hemi=null,skyMeshes=[];
      sc.traverse(x=>{
        if(x.isDirectionalLight&&!sun)sun=x;
        if(x.isAmbientLight&&!amb)amb=x;
        if(x.isHemisphereLight&&!hemi)hemi=x;
        // A very large mesh with a BackSide material is a sky dome.
        if(x.isMesh&&x.geometry&&x.geometry.boundingSphere&&x.geometry.boundingSphere.radius>200){
          const m=Array.isArray(x.material)?x.material[0]:x.material;
          skyMeshes.push({r:Math.round(x.geometry.boundingSphere.radius),type:x.geometry.type,
            mat:m&&m.type,side:m&&m.side,color:(m&&m.color)?'#'+m.color.getHexString():null,vis:x.visible});
        }
      });
      o.sun=sun?{i:+sun.intensity.toFixed(3),color:'#'+sun.color.getHexString(),y:Math.round(sun.position.y)}:null;
      o.ambient=amb?{i:+amb.intensity.toFixed(3),color:'#'+amb.color.getHexString()}:null;
      o.hemi=hemi?{i:+hemi.intensity.toFixed(3)}:null;
      o.fog=sc.fog?{color:'#'+sc.fog.color.getHexString(),near:Math.round(sc.fog.near),far:Math.round(sc.fog.far)}:null;
      o.background=sc.background?(sc.background.isColor?'#'+sc.background.getHexString():String(sc.background.type||'texture')):null;
      o.skyMeshes=skyMeshes.slice(0,5);
      try{o.tsPhase=TimeSystem.getInfo().phase;o.tsTime=TimeSystem.getFormattedTime();}catch(e){}
      return o;
    },[hour,weather]);
  }
  for(const [h,w,name] of [[12,'CLEAR','noon'],[19.5,'CLEAR','dusk'],[23,'CLEAR','night'],[23,'SNOW','night-snow']]){
    const r=await snap(h,w);
    await pg.waitForTimeout(2500);
    console.log(name+': '+JSON.stringify(r));
    const durl=await pg.evaluate(()=>{try{return GameManager.captureFrame();}catch(e){return null;}});
    if(durl&&durl.startsWith('data:image/png;base64,'))
      fs.writeFileSync(path.join(OUT,'light-'+name+'.png'),Buffer.from(durl.split(',')[1],'base64'));
  }
  console.log('errors: '+JSON.stringify(errs.slice(0,5)));
  await b.close();server.close();process.exit(0);
});
