const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const ROOT='/home/user/occupantkiller-1';
const PAGE=process.argv[3]||'/scene-bradley.html';
const OUT=process.argv[4]||'/tmp/claude-0/-home-user-occupantkiller-1/935a3386-bf68-508b-961f-b5a7bf15988c/scratchpad/bradley-treeline.png';
const PORT=parseInt(process.argv[2]||'3970',10);
const MIME={'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.json':'application/json'};
const server=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const fp=path.join(ROOT,p);if(!fp.startsWith(ROOT)){s.writeHead(403);return s.end();}fs.readFile(fp,(e,d)=>{if(e){s.writeHead(404);return s.end('404');}s.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});s.end(d);});});
setTimeout(()=>{console.log('HARD TIMEOUT');process.exit(2);},70000);
server.listen(PORT, async ()=>{
  const br=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--ignore-gpu-blocklist']});
  const pg=await br.newPage({viewport:{width:1280,height:720}});
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  try{await pg.goto('http://localhost:'+PORT+PAGE,{waitUntil:'load',timeout:30000});}catch(e){console.log('goto',e.message.slice(0,60));}
  // wait for __RENDERED
  let ok=false;
  for(let k=0;k<20;k++){ try{ if(await pg.evaluate(()=>window.__RENDERED===true)){ok=true;break;} }catch(e){ console.log('eval',e.message.slice(0,40)); break; } await pg.waitForTimeout(1000); }
  await pg.waitForTimeout(1000);
  try{ await pg.screenshot({path:OUT}); console.log('SHOT OK', ok?'(rendered flag set)':'(flag not set, captured anyway)'); }
  catch(e){ console.log('shot fail', e.message.slice(0,60)); }
  console.log('pageerrors('+errs.length+'):'); errs.slice(0,8).forEach(e=>console.log('  '+e.slice(0,160)));
  try{await br.close();}catch(e){} server.close(); process.exit(0);
});
