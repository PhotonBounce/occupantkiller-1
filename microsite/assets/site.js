(function(){
  var D = window.OK_DATA;
  document.getElementById('yr').textContent = new Date().getFullYear();

  /* ---- weapons ---- */
  var wg = document.getElementById('weaponGrid');
  D.weapons.forEach(function(w){
    var el = document.createElement('div');
    el.className = 'wpn cat-' + w.cat;
    el.innerHTML = '<div class="wn">'+w.n+'</div><div class="wc">'+w.c+'</div>';
    wg.appendChild(el);
  });

  /* ---- tokenomics donut ---- */
  var svg = document.getElementById('donut'), leg = document.getElementById('tokenLegend');
  var off = 25; // start at top
  D.distribution.forEach(function(d){
    var c = document.createElementNS('http://www.w3.org/2000/svg','circle');
    c.setAttribute('cx','21'); c.setAttribute('cy','21'); c.setAttribute('r','15.915');
    c.setAttribute('fill','transparent'); c.setAttribute('stroke',d.color); c.setAttribute('stroke-width','7');
    c.setAttribute('stroke-dasharray', d.pct + ' ' + (100-d.pct));
    c.setAttribute('stroke-dashoffset', off);
    svg.appendChild(c);
    off -= d.pct;
    var li = document.createElement('div');
    li.className='li';
    li.innerHTML='<span class="sw" style="background:'+d.color+'"></span>'+d.label+' <span class="lp">'+d.pct+'% · '+d.amount+'</span>';
    leg.appendChild(li);
  });

  /* ---- packs ---- */
  var pg = document.getElementById('packGrid');
  D.packs.forEach(function(p){
    var el=document.createElement('div'); el.className='pack';
    el.innerHTML='<div class="pl">'+p.label+'</div><div class="pu">$'+p.usd+'</div><div class="po">'+p.total+' OKC</div>'+(p.bonus?'<div class="pb">+'+p.bonus+'% bonus</div>':'<div class="pb">&nbsp;</div>');
    pg.appendChild(el);
  });

  /* ---- counters ---- */
  document.querySelectorAll('.num[data-count]').forEach(function(n){
    var target=+n.getAttribute('data-count'), txt=n.textContent, suffix=txt.replace(/[0-9.]/g,''), cur=0, step=target/40;
    var iv=setInterval(function(){cur+=step; if(cur>=target){cur=target;clearInterval(iv);} n.textContent=Math.round(cur)+suffix;},22);
  });

  /* ---- gallery (manifest-driven, graceful fallback) ---- */
  var grid=document.getElementById('galleryGrid'), more=document.getElementById('galMore'),
      filters=document.getElementById('galFilters'), lb=document.getElementById('lightbox'), lbImg=document.getElementById('lbImg'),
      galCount=document.getElementById('galCount');
  var shots=[], shown=0, PAGE=24, activeCat='all';

  function tagOf(name){
    var m=name.match(/-(w\d+|feat-[a-z]+|combat)/i);
    if(!m) return 'combat';
    if(/feat-/.test(m[0])) return name.match(/feat-([a-z]+)/i)[1];
    if(/^-w/i.test(m[0])) return 'weapons';
    return 'combat';
  }
  function render(reset){
    if(reset){grid.innerHTML='';shown=0;}
    var pool=shots.filter(function(s){return activeCat==='all'||tagOf(s)===activeCat;});
    var next=pool.slice(shown,shown+PAGE);
    next.forEach(function(s){
      var img=document.createElement('img'); img.loading='lazy'; img.src='gallery/'+s; img.alt='OccupantKiller — '+s;
      img.onclick=function(){lbImg.src='gallery/'+s; lb.classList.add('on');};
      grid.appendChild(img);
    });
    shown+=next.length;
    more.style.display = shown<pool.length ? 'block':'none';
  }
  function buildFilters(){
    var cats=['all','weapons','combat'];
    shots.forEach(function(s){var t=tagOf(s); if(cats.indexOf(t)<0)cats.push(t);});
    cats.forEach(function(c){
      var b=document.createElement('button'); b.textContent=c.toUpperCase(); if(c==='all')b.className='on';
      b.onclick=function(){activeCat=c; filters.querySelectorAll('button').forEach(function(x){x.classList.remove('on');}); b.classList.add('on'); render(true);};
      filters.appendChild(b);
    });
  }
  more.onclick=function(){render(false);};

  fetch('gallery/manifest.json').then(function(r){return r.json();}).then(function(list){
    shots=list; galCount.textContent=list.length+'+';
    if(list.length){ document.getElementById('heroShot').src='gallery/'+list[0]; }
    buildFilters(); render(true);
  }).catch(function(){
    // fallback: probe sequential filenames if no manifest
    var i=1, tmp=[];
    (function probe(){
      var im=new Image();
      im.onload=function(){tmp.push(pad(i)+'.png'); i++; if(i<=60) probe(); else finish();};
      im.onerror=function(){finish();};
      im.src='gallery/'+pad(i)+'.png';
    })();
    function pad(n){return String(n).padStart(4,'0');}
    function finish(){ shots=tmp; if(tmp.length){galCount.textContent=tmp.length+'+';} buildFilters(); render(true); }
  });
})();
