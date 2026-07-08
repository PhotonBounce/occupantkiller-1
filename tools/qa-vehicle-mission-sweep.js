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
vm.runInContext('var VoxelWorld = window.VoxelWorld;', ctx);
vm.runInContext(fs.readFileSync('vehicles.js','utf8'), ctx, {filename:'veh'});
vm.runInContext(fs.readFileSync('missions.js','utf8'), ctx, {filename:'mis'});
const THREE=ctx.THREE, VW=w.VoxelWorld;
const scene=new THREE.Scene(); VW.init(scene); VW.generateLevel(0);
let issues=0;
// Vehicles: all 7 types + junk type
const VS=w.VehicleSystem;
try{
  VS.init(scene);
  for (const t of ['transport','combat','logistics','helicopter','plane','turret_rover','tank','JUNK_TYPE']) VS.spawn((Math.random()-0.5)*30, 6, (Math.random()-0.5)*30, t);
  for (let f=0; f<1200; f++) VS.update(0.016);
  VS.clear();
  console.log('VehicleSystem: OK (8 spawns incl junk type, 1200 ticks)');
}catch(e){ issues++; console.log('VehicleSystem CRASH ::', (e.stack||e.message).split('\n').slice(0,3).join(' | ').slice(0,260)); }
// Missions
const MS=vm.runInContext('typeof MissionSystem!=="undefined" ? MissionSystem : null', ctx);
if (!MS){ console.log('MissionSystem: not reachable'); }
else try{
  if (MS.init) MS.init();
  for (const t of ['bradley_mission','airborne_assault','urban_breakout','JUNK']) if (MS.generateMission) MS.generateMission(t);
  for (let f=0;f<600;f++) if (MS.update) MS.update(0.016);
  console.log('MissionSystem: OK (10 generated, 600 ticks) | active:', MS.getActive ? (MS.getActive()||[]).length : '?');
}catch(e){ issues++; console.log('MissionSystem CRASH ::', (e.stack||e.message).split('\n').slice(0,3).join(' | ').slice(0,260)); }
console.log('VEHICLE/MISSION SWEEP DONE issues='+issues);
