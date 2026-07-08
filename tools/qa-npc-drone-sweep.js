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
vm.runInContext(fs.readFileSync('three.min.js','utf8'), ctx, {filename:'three'});
w.THREE=ctx.THREE;
vm.runInContext('var HUD=new Proxy({},{get:()=>function(){}}); var AudioSystem=new Proxy({},{get:()=>function(){}}); window.HUD=HUD; window.AudioSystem=AudioSystem;', ctx);
vm.runInContext(fs.readFileSync('voxel-world.js','utf8'), ctx, {filename:'vw'});
vm.runInContext(fs.readFileSync('npc-system.js','utf8'), ctx, {filename:'npc'});
vm.runInContext(fs.readFileSync('drone-system.js','utf8'), ctx, {filename:'drone'});
const THREE=ctx.THREE, VW=w.VoxelWorld;
const scene=new THREE.Scene(); VW.init(scene); VW.generateLevel(0);
const camera=new THREE.PerspectiveCamera(75,1.6,0.1,500); camera.position.set(0,5,0);
let issues=0;
for (const [name, g] of [['UkrainianTactics', w.UkrainianTactics],['RussianTactics', w.RussianTactics],['DroneSystem', w.DroneSystem]]) {
  if(!g){ console.log(name,': global MISSING'); issues++; continue; }
  try{
    if(g.init) g.init.length>=2 ? g.init(scene, camera) : g.init(scene);
    for(let i=0;i<5;i++) if(g.spawn) g.spawn((i-2)*8, 6, (i-2)*8, ['recon','fpv_attack','bomb','baba_yaga','bayraktar'][i]);
    for(let f=0;f<1200;f++) if(g.update) g.update(0.016, {hour:12});
    if(g.clear) g.clear();
    console.log(name, ': OK (5 spawns, 1200 ticks)');
  }catch(e){ issues++; console.log(name, 'CRASH ::', (e.stack||e.message).split('\n').slice(0,3).join(' | ').slice(0,260)); }
}
console.log('NPC/DRONE SWEEP DONE issues='+issues);
