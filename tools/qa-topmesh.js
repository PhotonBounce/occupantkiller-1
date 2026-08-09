// Find WHAT is adding ~190k triangles on the airport level. Boots the airport,
// lets it run ~35s, then dumps the top meshes by triangle count with name /
// userData / parent chain so we know exactly what to gate on mobile.
const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const ROOT='/home/user/occupantkiller-1';
const PORT=parseInt(process.argv[2]||'4292',10);
const server=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const fp=path.join(ROOT,p);if(!fp.startsWith(ROOT)){s.writeHead(403);return s.end();}fs.readFile(fp,(e,d)=>{if(e){s.writeHead(404);return s.end('404');}s.end(d);});});
const UA='Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36';
server.listen(PORT,async()=>{
  const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage']});
  const ctx=await browser.newContext({userAgent:UA,viewport:{width:915,height:412},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const pg=await ctx.newPage();
  pg.on('pageerror',e=>console.log('PAGEERR',e.message.slice(0,120)));
  await pg.goto('http://localhost:'+PORT+'/index.html',{waitUntil:'commit',timeout:20000});
  await pg.waitForFunction(()=>{var r=['THREE','VoxelWorld','Enemies','GameManager'];var f=document.getElementById('boot-progress-bar-fill');return r.every(m=>typeof window[m]!=='undefined')&&f&&f.style.width==='100%';},{timeout:60000});
  await pg.evaluate(()=>{window.__QA_START_STAGE=0;GameManager.startGame();});
  await pg.waitForTimeout(2500);try{await pg.keyboard.press('Space');}catch(_){}
  await pg.waitForTimeout(32000);
  const dump=await pg.evaluate(()=>{
    function tri(g){if(!g)return 0;if(g.index)return g.index.count/3;if(g.attributes&&g.attributes.position)return g.attributes.position.count/3;return 0;}
    var sc=GameManager.getScene&&GameManager.getScene();var arr=[];var total=0;
    if(sc&&sc.traverse)sc.traverse(function(o){if(o.isMesh&&o.geometry){var t=tri(o.geometry);total+=t;
      // build a short parent-name chain
      var chain=[];var p=o;var d=0;while(p&&d<6){chain.push(p.name||p.userData&&p.userData.type||p.type);p=p.parent;d++;}
      arr.push({t:Math.round(t),name:o.name||'',ud:Object.keys(o.userData||{}).slice(0,4).join(','),chain:chain.join('<'),count:o.count||1,inst:!!o.isInstancedMesh});}});
    arr.sort((a,b)=>b.t-a.t);
    // aggregate by name
    var byName={};arr.forEach(function(m){var k=(m.name||m.chain.split('<')[0]||'?');byName[k]=(byName[k]||0)+m.t;});
    var agg=Object.keys(byName).map(k=>({name:k,t:Math.round(byName[k])})).sort((a,b)=>b.t-a.t).slice(0,20);
    return {totalSceneTris:Math.round(total),meshCount:arr.length,top:arr.slice(0,25),aggByName:agg};
  });
  fs.writeFileSync(path.join(ROOT,'tools','qa-topmesh.json'),JSON.stringify(dump,null,2));
  console.log('totalSceneTris',dump.totalSceneTris,'meshCount',dump.meshCount);
  console.log('--- aggregate by name (top 20) ---');
  dump.aggByName.forEach(m=>console.log(String(m.t).padStart(9),m.name));
  console.log('--- top individual meshes ---');
  dump.top.forEach(m=>console.log(String(m.t).padStart(9),'inst='+m.inst,'cnt='+m.count,'| name="'+m.name+'" ud=['+m.ud+'] chain='+m.chain));
  await browser.close();server.close();process.exit(0);
});
