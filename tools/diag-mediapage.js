// Load the media gallery page headless and screenshot it — verify the slideshow
// renders (stage image + caption + thumbnails). Writes log immediately.
const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const ROOT='/home/user/occupantkiller-1',PORT=parseInt(process.argv[2]||'4180',10);
const OUT=path.join(ROOT,'tools','mediapage.png'),LOG=OUT.replace(/\.png$/,'.log');
try{fs.unlinkSync(LOG);}catch(_){}
const t0=Date.now();function log(m){fs.appendFileSync(LOG,'['+((Date.now()-t0)/1000).toFixed(1)+'s] '+m+'\n');}
const MIME={'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const fp=path.join(ROOT,p);if(!fp.startsWith(ROOT)){s.writeHead(403);return s.end();}fs.readFile(fp,(e,d)=>{if(e){s.writeHead(404);return s.end('404');}s.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});s.end(d);});});
server.listen(PORT,async()=>{
  log('server up');
  const b=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--disable-dev-shm-usage']});
  const pg=await (await b.newContext({viewport:{width:1280,height:900}})).newPage();
  const errs=[];pg.on('pageerror',e=>{errs.push(e.message);log('PAGEERROR: '+e.message.slice(0,140));});
  try{
    await pg.goto('http://localhost:'+PORT+'/microsite/occupantkiller/index.html',{waitUntil:'networkidle',timeout:20000});
    log('loaded');
    await pg.waitForSelector('#stage:not([hidden])',{timeout:8000});
    const info=await pg.evaluate(()=>{
      var stage=document.getElementById('stage');
      var onImg=document.querySelector('.stage-frame img.on');
      var thumbs=document.querySelectorAll('.thumb').length;
      var cap=(document.querySelector('.cap .t')||{}).textContent||'';
      var counter=(document.getElementById('counter')||{}).textContent||'';
      return {stageShown:stage&&!stage.hidden,activeImg:!!onImg,imgSrc:onImg?onImg.getAttribute('src'):null,thumbs:thumbs,caption:cap,counter:counter};
    });
    log('STATE '+JSON.stringify(info));
    await pg.screenshot({path:OUT});
    log('screenshot -> '+OUT+' ('+(fs.existsSync(OUT)?fs.statSync(OUT).size+'B':'MISSING')+')');
  }catch(e){log('EXCEPTION: '+(e.message||e).slice(0,180));}
  log('pageErrors='+errs.length);
  try{await b.close();}catch(_){}
  log('DONE');server.close();process.exit(0);
});
