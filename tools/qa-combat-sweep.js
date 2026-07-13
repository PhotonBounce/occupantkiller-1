const fs=require('fs'), vm=require('vm');
const w={ WORLD_CHUNKS:4, CHUNK_SIZE:32, CHUNK_HEIGHT:64 };
const mkCanvas=()=>{ const el={style:{},addEventListener:()=>{},width:0,height:0};
  el.getContext=()=>new Proxy({canvas:el,measureText:()=>({width:10}),getImageData:(x,y,wd,h)=>({data:new Uint8ClampedArray(Math.max(1,wd*h*4))}),createLinearGradient:()=>({addColorStop:()=>{}}),createRadialGradient:()=>({addColorStop:()=>{}})},{get:(o,k)=>k in o?o[k]:(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
  return el; };
const ctx={ window:w, self:w, console, Math, Date, JSON, performance:{now:()=>Date.now()},
  document:{ createElement:(t)=>t==='canvas'?mkCanvas():{style:{},addEventListener:()=>{},getContext:()=>null}, addEventListener:()=>{}, getElementById:()=>null, querySelector:()=>null, body:{appendChild:()=>{}} },
  navigator:{userAgent:'node',maxTouchPoints:0}, localStorage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},
  setTimeout, clearTimeout, setInterval, clearInterval, requestAnimationFrame:()=>0 };
ctx.globalThis=ctx; w.window=w; vm.createContext(ctx);
for (const f of ['three.min.js','voxel-world.js','enemies.js']) {
  vm.runInContext(fs.readFileSync(f,'utf8'), ctx, {filename:f});
}
w.THREE=ctx.THREE;
const VW=w.VoxelWorld, EN=w.Enemies, THREE=ctx.THREE;
const scene=new THREE.Scene();
VW.init(scene);
const stages=[[0,'HOSTOMEL'],[2,'BAKHMUT'],[7,'MOSCOW'],[13,'KYIV'],[70,'AVDIIVKA'],[95,'BAKHMUT_STREETS'],[97,'FINAL_SIEGE'],[110,'PROC_110']];
let crashes=0;
for (const [idx, label] of stages){
  try{
    VW.generateLevel(idx);
    const sp=VW.getSpawnPoint();
    const ppos=new THREE.Vector3(sp.x, sp.y+2, sp.z);
    for (let wave=1; wave<=3; wave++){
      EN.startWave(wave, scene, 1.5, null, VW.getLevelDef(idx).id, null, ppos);
      let hits=0;
      for (let f=0; f<400; f++){
        ppos.x += Math.sin(f*0.05)*0.3; ppos.z += Math.cos(f*0.07)*0.3;
        EN.update(0.016, ppos, ()=>{hits++;}, ()=>{});
      }
      const alive=EN.getAliveCount();
      // damage every enemy to exercise death/surrender paths
      for (const e of EN.getAll()) if(e && e.alive) EN.damage(e, 500, 'rifle');
      EN.update(0.016, ppos, ()=>{}, ()=>{});
      console.log(label,'wave',wave,'ok | alive after 400 ticks:',alive,'| hits:',hits);
      EN.clear();
    }
  }catch(e){ crashes++; console.log('CRASH', label, '::', (e.stack||e.message).split('\n').slice(0,3).join(' | ').slice(0,300)); try{EN.clear();}catch(_){} }
}
// Long-sim pass: grenades/mortars only fire after sustained contact — 2500 ticks on one stage
try{
  VW.generateLevel(0);
  const sp2=VW.getSpawnPoint();
  const p2=new THREE.Vector3(sp2.x, sp2.y+2, sp2.z);
  EN.startWave(3, scene, 2.0, null, 'HOSTOMEL', null, p2);
  let hits2=0;
  for (let f=0; f<2500; f++) EN.update(0.016, p2, ()=>{hits2++;}, ()=>{});
  console.log('long-sim ok | hits:', hits2, '| alive:', EN.getAliveCount());
  if (hits2===0) { crashes++; console.log('LONG-SIM SUSPECT: zero hits in 2500 ticks'); }
  EN.clear();
}catch(e){ crashes++; console.log('LONG-SIM CRASH ::', (e.stack||e.message).split('\n').slice(0,3).join(' | ').slice(0,300)); }
console.log('COMBAT SWEEP DONE crashes='+crashes);
