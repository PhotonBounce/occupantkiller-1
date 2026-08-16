// Weapon gallery: builds every in-game weapon mesh via Weapons.createGunMesh and
// renders them side-on into ONE contact-sheet PNG (plus per-weapon part counts),
// so the whole arsenal can be reviewed at a glance for detail/quality.
// Usage: PORT=4320 node tools/wpn-gallery.js [cols]
const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const ROOT='/home/user/occupantkiller-1';
const OUTDIR='/tmp/claude-0/-home-user-occupantkiller-1/935a3386-bf68-508b-961f-b5a7bf15988c/scratchpad';
const PORT=parseInt(process.env.PORT||'4320',10);
const COLS=parseInt(process.argv[2]||'4',10);
const MIME={'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const fp=path.join(ROOT,p);if(!fp.startsWith(ROOT)){s.writeHead(403);return s.end();}fs.readFile(fp,(e,d)=>{if(e){s.writeHead(404);return s.end('404');}s.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});s.end(d);});});

server.listen(PORT,async()=>{
  const b=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage']});
  const pg=await (await b.newContext({viewport:{width:900,height:600}})).newPage();
  await pg.goto('http://localhost:'+PORT+'/index.html',{waitUntil:'commit',timeout:20000});
  await pg.waitForFunction(()=>typeof window.THREE!=='undefined'&&typeof window.Weapons!=='undefined'&&!!window.Weapons.createGunMesh,{timeout:60000});

  const IDX=process.env.IDX?process.env.IDX.split(',').map(Number):null;
  const OUTNAME=process.env.OUTNAME||'weapons-gallery';
  const res=await pg.evaluate(([cols,IDX])=>{
    const TILE_W=460, TILE_H=280, LABEL=26;
    const cam=new THREE.PerspectiveCamera(40,1,0.01,100);
    window.Weapons.createGunMesh(cam);
    let all=cam.children.filter(c=>c.userData&&c.userData.muzzlePos);
    const pick=(IDX&&IDX.length)?IDX:all.map((_,i)=>i);
    const meshes=pick.map(i=>all[i]).filter(Boolean);
    const idxMap=pick.filter(i=>all[i]);
    const n=meshes.length;
    if(!n) return {err:'no weapon meshes found'};
    const rows=Math.ceil(n/cols);

    // per-weapon render target
    const rcanvas=document.createElement('canvas');rcanvas.width=TILE_W;rcanvas.height=TILE_H;
    const r=new THREE.WebGLRenderer({canvas:rcanvas,antialias:true,preserveDrawingBuffer:true,alpha:false});
    r.setSize(TILE_W,TILE_H);
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x2e3238);
    scene.add(new THREE.HemisphereLight(0xffffff,0x555555,1.5));
    const k=new THREE.DirectionalLight(0xffffff,1.6);k.position.set(2.5,2,1.5);scene.add(k);
    const f=new THREE.DirectionalLight(0xcfe0ff,0.85);f.position.set(2,0.5,-1.5);scene.add(f);
    const rc=new THREE.PerspectiveCamera(32,TILE_W/TILE_H,0.01,100);
    const holder=new THREE.Group();scene.add(holder);

    // contact sheet
    const big=document.createElement('canvas');
    big.width=cols*TILE_W; big.height=rows*(TILE_H+LABEL);
    const bx=big.getContext('2d');
    bx.fillStyle='#14171b';bx.fillRect(0,0,big.width,big.height);

    const stats=[];
    for(let i=0;i<n;i++){
      holder.clear();
      const src=meshes[i];
      const m=src.clone(true);m.visible=true;m.traverse(o=>{o.visible=true;});
      m.position.set(0,0,0);m.rotation.set(0,0,0);m.scale.set(1,1,1);
      holder.add(m);
      // count parts + materials for a detail metric
      let parts=0,mats=new Set(),tris=0;
      m.traverse(o=>{if(o.isMesh){parts++;
        const mm=Array.isArray(o.material)?o.material:[o.material];
        mm.forEach(x=>{if(x)mats.add(x.uuid);});
        const g=o.geometry;if(g&&g.attributes&&g.attributes.position){tris+=(g.index?g.index.count:g.attributes.position.count)/3;}
      }});
      const box=new THREE.Box3().setFromObject(m);
      const c=box.getCenter(new THREE.Vector3());const s=box.getSize(new THREE.Vector3());
      m.position.sub(c);
      const radius=Math.max(s.z,s.y)*0.5||0.2;
      const dist=radius/Math.tan((32*Math.PI/180)/2)*1.35;
      rc.position.set(dist*0.35,radius*0.55,dist);rc.up.set(0,1,0);rc.lookAt(0,0,0);
      r.render(scene,rc);
      const realIdx=idxMap[i];
      let name='w'+realIdx;
      try{const inf=window.Weapons.getWeaponInfo&&window.Weapons.getWeaponInfo(realIdx);if(inf&&inf.name)name=inf.name;}catch(e){}
      const col=i%cols, row=Math.floor(i/cols);
      const x=col*TILE_W, y=row*(TILE_H+LABEL);
      bx.drawImage(rcanvas,x,y);
      bx.fillStyle='#0b0d10';bx.fillRect(x,y+TILE_H,TILE_W,LABEL);
      bx.fillStyle='#7fffaa';bx.font='bold 15px monospace';
      bx.fillText(String(realIdx).padStart(2,'0')+'  '+name+'   ['+parts+' parts, '+Math.round(tris)+' tris]',x+8,y+TILE_H+18);
      stats.push({idx:realIdx,name:name,parts:parts,materials:mats.size,tris:Math.round(tris)});
    }
    return {count:n,stats:stats,img:big.toDataURL('image/png')};
  },[COLS,IDX]);

  if(res.err){console.log('ERR',res.err);}
  else{
    fs.writeFileSync(path.join(OUTDIR,OUTNAME+'.png'),Buffer.from(res.img.split(',')[1],'base64'));
    fs.writeFileSync(path.join(OUTDIR,OUTNAME+'-stats.json'),JSON.stringify(res.stats,null,1));
    console.log('weapons:',res.count);
    // print least-detailed first — these are the ones needing work
    res.stats.slice().sort((a,b)=>a.parts-b.parts).forEach(s=>console.log(String(s.parts).padStart(3),'parts',String(s.tris).padStart(6),'tris  #'+s.idx,s.name));
  }
  await b.close();server.close();process.exit(0);
});
