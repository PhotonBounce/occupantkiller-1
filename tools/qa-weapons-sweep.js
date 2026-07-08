const fs=require('fs'), vm=require('vm');
const w={ WORLD_CHUNKS:4, CHUNK_SIZE:32, CHUNK_HEIGHT:64 };
const noop=()=>new Proxy(function(){}, {get:(o,k)=>k==='length'?0:noop(), apply:()=>noop()});
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
vm.runInContext(fs.readFileSync('voxel-world.js','utf8'), ctx, {filename:'vw'});
// HUD/audio stubs must exist before weapons loads? weapons references HUD at call time — define stub globals in context
vm.runInContext('var HUD = new Proxy({}, {get:()=>function(){}}); var AudioSystem = new Proxy({}, {get:()=>function(){}}); var Tracers = new Proxy({}, {get:()=>function(){}}); window.HUD=HUD; window.AudioSystem=AudioSystem; window.Tracers=Tracers;', ctx);
vm.runInContext(fs.readFileSync('weapons.js','utf8'), ctx, {filename:'weapons'});
const WP=w.Weapons, THREE=ctx.THREE, VW=w.VoxelWorld;
const scene=new THREE.Scene(); VW.init(scene);
const camera=new THREE.PerspectiveCamera(75,1.6,0.1,500);
camera.position.set(0,5,0); scene.add(camera);
let fails=[];
try{ WP.createGunMesh(camera); console.log('createGunMesh: ALL weapon models built OK'); }
catch(e){ console.log('createGunMesh CRASH:', (e.stack||'').split('\n').slice(0,3).join(' | ')); }
const n=(function(){ let i=0; while(WP.getWeaponId(i)) i++; return i; })();
console.log('weapon count:', n);
WP.refillAllAmmo && WP.refillAllAmmo();
for(let i=0;i<n;i++){
  try{
    WP.switchTo(i);
    WP.update(0.016, camera);
    WP.tryFire(camera, [], 0.016, ()=>{}, true);
    WP.update(0.1, camera);
  }catch(e){ fails.push([i, WP.getWeaponId(i), (e.stack||e.message).split('\n').slice(0,2).join(' | ').slice(0,200)]); }
}
console.log('WEAPONS SWEEP DONE fails='+fails.length+'/'+n);
fails.slice(0,15).forEach(f=>console.log('FAIL idx',f[0],f[1],'::',f[2]));
