// Unit-check the weapon bake without booting the game.
const fs=require('fs');
const m={exports:{}};
new Function('module','exports',fs.readFileSync('/home/user/occupantkiller-1/three.min.js','utf8'))(m,m.exports);
const THREE=m.exports;
global.THREE=THREE;
global.window={THREE:THREE};
new Function('window','THREE',fs.readFileSync('/home/user/occupantkiller-1/npc-weapons.js','utf8'))(global.window,THREE);
const NW=global.window.NPCWeapons;
let fail=0;
for(const k of ['M16','AK47','PISTOL','LMG','SNIPER']){
  const w=NW.build(k,1);
  const meshes=[]; w.traverse(o=>{if(o.isMesh)meshes.push(o);});
  const g=w.geometry;
  const p=g&&g.getAttribute('position'), n=g&&g.getAttribute('normal'), c=g&&g.getAttribute('color');
  const bb=g&&g.boundingSphere;
  const ok = meshes.length===1 && !!p && !!n && !!c && !!g.getIndex() &&
             p.count===n.count && p.count===c.count && bb && bb.radius>0.1 && bb.radius<3 &&
             !!w.userData.muzzle;
  console.log(k.padEnd(7),'meshes='+meshes.length,'verts='+(p?p.count:0),
    'idx='+(g.getIndex()?g.getIndex().count:0),'r='+(bb?bb.radius.toFixed(2):'?'),
    'muzzleZ='+(w.userData.muzzle?w.userData.muzzle.z:'?'), ok?'OK':'FAIL');
  if(!ok) fail++;
}
const a=NW.build('AK47',1), b=NW.build('AK47',1.3);
const shared=a.geometry===b.geometry;
console.log('shared geometry across characters:',shared,' scales:',a.scale.x,b.scale.x);
if(!shared) fail++;
// mount must still expose an aimable pivot
const g2=new THREE.Group();
NW.mount(g2,'M16',1);
const hasPivot=!!g2.userData.weaponPivot && !!g2.userData.weaponMesh;
console.log('mount pivot+mesh:',hasPivot);
if(!hasPivot) fail++;
console.log(fail?('FAILURES: '+fail):'ALL PASS');
process.exit(fail?1:0);
