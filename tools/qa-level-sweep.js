const fs=require('fs'), vm=require('vm');
const w={ WORLD_CHUNKS:4, CHUNK_SIZE:32, CHUNK_HEIGHT:64 };
const ctx={ window:w, self:w, console, Math, Date, JSON, performance:{now:()=>Date.now()},
  document:{ createElement:(t)=>{ const el={style:{},addEventListener:()=>{},width:0,height:0}; if(t==='canvas'){ el.getContext=()=>new Proxy({canvas:el,measureText:()=>({width:10}),getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createLinearGradient:()=>({addColorStop:()=>{}}),createRadialGradient:()=>({addColorStop:()=>{}})},{get:(o,k)=>k in o?o[k]:(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}}); } else { el.getContext=()=>null; } return el; }, addEventListener:()=>{}, getElementById:()=>null, querySelector:()=>null, body:{appendChild:()=>{}} },
  navigator:{userAgent:'node',maxTouchPoints:0}, localStorage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},
  setTimeout, clearTimeout, setInterval, clearInterval, requestAnimationFrame:()=>0 };
ctx.globalThis=ctx; w.window=w;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('three.min.js','utf8'), ctx, {filename:'three.min.js'});
w.THREE=ctx.THREE||w.THREE;
vm.runInContext(fs.readFileSync('voxel-world.js','utf8'), ctx, {filename:'voxel-world.js'});
const VW=w.VoxelWorld;
const scene=new (w.THREE.Scene)();
let t=Date.now();
VW.init(scene);
console.log('init ms:', Date.now()-t);
const N=parseInt(process.argv[2]||'128',10), START=parseInt(process.argv[3]||'0',10);
let ok=0, fails=[];
for (let i=START;i<N;i++){
  t=Date.now();
  try{
    VW.generateLevel(i); ok++;
    const def=VW.getLevelDef(i);
    // spawn validity: game's own spawn point must have 2 clear blocks
    const sp=VW.getSpawnPoint();
    if (sp && VW.isSolid){
      const bx=Math.round(sp.x), bz=Math.round(sp.z), by=Math.round(sp.y);
      if (VW.isSolid(bx, by+1, bz) || VW.isSolid(bx, by+2, bz)) console.log('SPAWN EMBEDDED level', i, def.id, JSON.stringify(sp));
    }
    // candidate audit: all candidates fully blocked would strand the fallback
    if (def.spawnCandidates && VW.isSolid && VW.getTopSolidY){
      let open=0;
      for (const cnd of def.spawnCandidates){
        const gy=VW.getTopSolidY(cnd.x, cnd.z);
        if (!VW.isSolid(cnd.x, gy+1, cnd.z) && !VW.isSolid(cnd.x, gy+2, cnd.z)) open++;
      }
      if (open===0) console.log('ALL CANDIDATES BLOCKED level', i, def.id);
    }
  }
  catch(e){ fails.push([i, VW.getLevelDef(i).id||'?', e.message.slice(0,140)]); }
}
console.log('SWEEP DONE ok='+ok+' fail='+fails.length);
fails.forEach(f=>console.log('FAIL level',f[0],f[1],'::',f[2]));
