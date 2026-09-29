const http=require('http'),fs=require('fs'),path=require('path');
const { chromium } = require('playwright');
const ROOT='/home/user/occupantkiller-1', PORT=4998;
const server=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';fs.readFile(path.join(ROOT,p),(e,d)=>{if(e){s.writeHead(404);return s.end('404');}s.end(d);});});
const out=[]; const say=m=>{out.push(m);fs.writeFileSync('/tmp/claude-0/probetab2.txt',out.join('\n')+'\n');};
server.listen(PORT, async()=>{
 try{
  const b=await chromium.launch({headless:true,executablePath:process.env.QA_CHROMIUM,args:['--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage','--no-sandbox','--mute-audio']});
  const page=await (await b.newContext({viewport:{width:480,height:270}})).newPage();
  page.on('pageerror',e=>say('PAGEERR '+String(e.message).slice(0,160)));
  await page.goto('http://localhost:'+PORT+'/index.html',{waitUntil:'commit'});
  await page.waitForFunction(()=>window.GameManager&&window.VoxelWorld&&window.THREE&&window.Enemies,null,{timeout:120000});
  await page.waitForFunction(()=>{const f=document.getElementById('boot-progress-bar-fill');return f&&f.style.width==='100%';},null,{timeout:120000}).catch(()=>{});
  await page.evaluate(()=>{window.__QA_MODE=true;window.__chosenStartStage=0;});
  await page.evaluate(()=>{const x=document.getElementById('quick-start-btn'); if(x)x.click(); else GameManager.startGame();});
  await page.waitForFunction(()=>GameManager.getState()==='playing',null,{timeout:120000});
  await page.mouse.click(240,135); await page.waitForTimeout(3000);
  const st=(l)=>page.evaluate(()=>({s:GameManager.getState(),d:document.getElementById('inventory-overlay').style.display,l:!!document.pointerLockElement})).then(r=>say(l+': '+JSON.stringify(r)));
  await st('baseline  ');
  await page.keyboard.press('Tab'); await page.waitForTimeout(1000); await st('Tab open  ');
  await page.keyboard.press('Tab'); await page.waitForTimeout(1000); await st('Tab close ');
  await page.keyboard.press('Tab'); await page.waitForTimeout(1000); await st('Tab open2 ');
  await page.keyboard.press('Tab'); await page.waitForTimeout(1000); await st('Tab close2');
  await page.keyboard.press('Escape');await page.waitForTimeout(1000); await st('Esc       ');
  await b.close();
 }catch(e){ say('ERROR '+String(e.message).split('\n')[0]); }
 server.close(); process.exit(0);
});
