// Probe: boot the real game headless, report GL info + renderer scene weight,
// then START and report draw calls / triangles / GPU memory, and whether the
// context survives. Prints one JSON line so I can see exactly what's heavy.
const http=require('http'), fs=require('fs'), path=require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ROOT='/home/user/occupantkiller-1';
const PORT=parseInt(process.argv[2]||'4200',10);
const DOSTART=process.argv[3]!=='menu';
const MIME={'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const fp=path.join(ROOT,p);if(!fp.startsWith(ROOT)){s.writeHead(403);return s.end();}fs.readFile(fp,(e,d)=>{if(e){s.writeHead(404);return s.end('404');}s.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});s.end(d);});});
server.listen(PORT, async ()=>{
  const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage']});
  const pg=await browser.newPage({viewport:{width:1280,height:720}});
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message.slice(0,120))); pg.on('crash',()=>errs.push('PAGE_CRASHED'));
  const out={boot:false,gl:null,afterBoot:null,started:false,afterStart:null,errOverlay:null,errs:null};
  try{
    await pg.goto('http://localhost:'+PORT+'/index.html',{waitUntil:'commit',timeout:20000});
    await pg.waitForFunction(()=>{var r=['THREE','VoxelWorld','GameManager','Tracers'];return r.every(m=>typeof window[m]!=='undefined');},{timeout:40000});
    // wait for boot to menu (100%) or error
    await pg.waitForFunction(()=>{var f=document.getElementById('boot-progress-bar-fill');var e=document.getElementById('error-overlay');return (f&&f.style.width==='100%')||(e&&e.style.display!=='none');},{timeout:45000}).catch(()=>{});
    out.boot=await pg.evaluate(()=>{var f=document.getElementById('boot-progress-bar-fill');return f&&f.style.width==='100%';});
    out.gl=await pg.evaluate(()=>{
      try{var c=document.createElement('canvas');var g=c.getContext('webgl2')||c.getContext('webgl');if(!g)return 'no-gl';
        var dbg=g.getExtension('WEBGL_debug_renderer_info');
        return {renderer:dbg?g.getParameter(dbg.UNMASKED_RENDERER_WEBGL):'?',vendor:dbg?g.getParameter(dbg.UNMASKED_VENDOR_WEBGL):'?',
          maxTex:g.getParameter(g.MAX_TEXTURE_SIZE),maxRB:g.getParameter(g.MAX_RENDERBUFFER_SIZE),pr:window.devicePixelRatio};
      }catch(e){return 'gl-err:'+e.message;}
    });
    out.afterBoot=await pg.evaluate(()=>{try{var gm=window.GameManager;var r=gm&&gm._getRenderer&&gm._getRenderer();
      if(!r&&window.__OKrenderer)r=window.__OKrenderer; if(!r)return 'no-renderer-handle';
      return {calls:r.info.render.calls,tris:r.info.render.triangles,geom:r.info.memory.geometries,tex:r.info.memory.textures,pr:r.getPixelRatio?r.getPixelRatio():'?'};
    }catch(e){return 'info-err:'+e.message;}});
    out.errOverlay=await pg.evaluate(()=>{var e=document.getElementById('error-overlay');return (e&&e.style.display!=='none')?(e.textContent||'').slice(0,140):null;});
    if(DOSTART && out.boot && !out.errOverlay){
      await pg.evaluate(()=>{window.__chosenStartStage=0;if(window.GameManager&&GameManager.startGame)GameManager.startGame();});
      out.started=true;
      await pg.waitForTimeout(6000);
      out.afterStart=await pg.evaluate(()=>{try{var r=(window.GameManager&&GameManager._getRenderer&&GameManager._getRenderer())||window.__OKrenderer;if(!r)return 'no-renderer';
        return {calls:r.info.render.calls,tris:r.info.render.triangles,geom:r.info.memory.geometries,tex:r.info.memory.textures};}catch(e){return 'info-err:'+e.message;}});
      out.errOverlay=await pg.evaluate(()=>{var e=document.getElementById('error-overlay');return (e&&e.style.display!=='none')?(e.textContent||'').slice(0,140):out.errOverlay;}).catch(()=>out.errOverlay);
    }
  }catch(e){ out.fatal=e.message.slice(0,140); }
  out.errs=errs.slice(0,6);
  console.log(JSON.stringify(out,null,1));
  try{await browser.close();}catch(_){} server.close(); process.exit(0);
});
