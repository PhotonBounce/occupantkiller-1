/* OccupantKiller microsite — main JS (vanilla, no deps) */
(function(){
'use strict';
var D = window.OK_DATA;
var $ = function(s){ return document.querySelector(s); };
var $$ = function(s){ return document.querySelectorAll(s); };

/* ── year ── */
var yr = $('#yr'); if(yr) yr.textContent = new Date().getFullYear();

/* ── nav scroll / hamburger ── */
var nav = $('.nav');
window.addEventListener('scroll', function(){
  if(nav) nav.classList.toggle('scrolled', window.scrollY>40);
}, {passive:true});
var ham = $('.nav-hamburger'), navLinks = $('.nav-links');
if(ham && navLinks){
  ham.addEventListener('click', function(){
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){ navLinks.classList.remove('open'); });
  });
}

/* ── counter animation ── */
function animCount(el){
  var raw = el.getAttribute('data-count');
  var suffix = raw.replace(/[\d.]/g,'');
  var target = parseFloat(raw);
  if(isNaN(target)) return;
  var cur=0, steps=48, step=target/steps;
  var iv = setInterval(function(){
    cur += step;
    if(cur>=target){ cur=target; clearInterval(iv); }
    el.textContent = (Number.isInteger(target)?Math.round(cur):cur.toFixed(1))+suffix;
  },18);
}
/* trigger on scroll into view */
var countersDone = false;
function checkCounters(){
  if(countersDone) return;
  var section = $('.hero-stats');
  if(!section) return;
  var r = section.getBoundingClientRect();
  if(r.top < window.innerHeight*.9){
    countersDone=true;
    $$('.num[data-count]').forEach(animCount);
  }
}
window.addEventListener('scroll', checkCounters, {passive:true});
checkCounters();

/* ── weapons grid ── */
var wg = $('#weaponGrid');
if(wg && D && D.weapons){
  var activeWCat = 'all';
  var catOrder = ['all','rifle','sniper','launcher','special','melee'];
  var catLabels = {all:'ALL',rifle:'RIFLES',sniper:'SNIPERS',launcher:'LAUNCHERS',special:'SPECIAL',melee:'MELEE'};

  /* tabs */
  var tabs = $('#weaponTabs');
  if(tabs){
    catOrder.forEach(function(c){
      var b = document.createElement('button');
      b.className = 'cat-tab'+(c==='all'?' on':'');
      b.textContent = catLabels[c];
      b.setAttribute('data-cat',c);
      b.addEventListener('click', function(){
        activeWCat = c;
        tabs.querySelectorAll('.cat-tab').forEach(function(t){ t.classList.toggle('on', t.getAttribute('data-cat')===c); });
        wg.querySelectorAll('.wpn').forEach(function(el){
          el.classList.toggle('hide', c!=='all' && el.getAttribute('data-cat')!==c);
        });
        /* re-trigger bar animations */
        wg.querySelectorAll('.wpn:not(.hide) .bar-fill').forEach(function(b){ var w=b.getAttribute('data-w'); b.style.width='0'; requestAnimationFrame(function(){ b.style.width=w; }); });
      });
      tabs.appendChild(b);
    });
  }

  D.weapons.forEach(function(w){
    var dmgPct = Math.round((w.dmg/1200)*100);
    var firePct = w.fr==='auto'?85:w.fr==='semi'?50:30;
    var el = document.createElement('div');
    el.className = 'wpn cat-'+w.cat+(w.ukr?' ukr':'');
    el.setAttribute('data-cat', w.cat);
    el.innerHTML =
      '<div class="wpn-head">'
       +'<div><div class="wn">'+w.n+'</div><div class="wc">'+w.c+'</div></div>'
       +'<div class="wpn-flag">'+(w.ukr?'🇺🇦':'🇷🇺')+'</div>'
      +'</div>'
      +'<div class="wdesc">'+w.desc+'</div>'
      +'<div class="wpn-bars">'
        +'<div class="wpn-bar-row"><span>DMG</span><div class="bar-track"><div class="bar-fill" data-w="'+dmgPct+'%" style="--w:'+dmgPct+'%;width:0"></div></div></div>'
        +'<div class="wpn-bar-row"><span>RATE</span><div class="bar-track"><div class="bar-fill" data-w="'+firePct+'%" style="--w:'+firePct+'%;width:0;background:var(--orange)"></div></div></div>'
      +'</div>';
    wg.appendChild(el);
  });

  /* animate bars on scroll */
  var barsTriggered = false;
  var barObserver = new IntersectionObserver(function(entries){
    if(barsTriggered) return;
    entries.forEach(function(e){
      if(e.isIntersecting){
        barsTriggered = true;
        $$('.bar-fill').forEach(function(b){
          b.style.width = b.getAttribute('data-w');
        });
        barObserver.disconnect();
      }
    });
  },{threshold:.1});
  barObserver.observe(wg);
}

/* ── features ── */
var featGrid = $('#featGrid');
if(featGrid && D.features){
  D.features.forEach(function(f,i){
    var el=document.createElement('div');
    el.className='card reveal reveal-delay-'+((i%3)+1);
    el.innerHTML='<div class="ic">'+f.ic+'</div><h3>'+f.title+'</h3><p>'+f.body+'</p>';
    featGrid.appendChild(el);
  });
}

/* ── missions ── */
var mGrid = $('#missionGrid');
if(mGrid && D.missions){
  D.missions.forEach(function(m,i){
    var el=document.createElement('div');
    el.className='mission-card reveal reveal-delay-'+((i%3)+1);
    el.innerHTML='<div class="mission-ic">'+m.ic+'</div><div><div class="mission-t">'+m.t+'</div><div class="mission-d">'+m.desc+'</div></div>';
    mGrid.appendChild(el);
  });
}

/* ── tokenomics donut ── */
var svg = $('#donut'), leg = $('#tokenLegend');
if(svg && leg && D.distribution){
  var r=15.915, cx=21, cy=21, offset=25;
  D.distribution.forEach(function(d){
    var c=document.createElementNS('http://www.w3.org/2000/svg','circle');
    c.setAttribute('cx',cx); c.setAttribute('cy',cy); c.setAttribute('r',r);
    c.setAttribute('fill','transparent'); c.setAttribute('stroke',d.color); c.setAttribute('stroke-width','7');
    c.setAttribute('stroke-dasharray', d.pct+' '+(100-d.pct));
    c.setAttribute('stroke-dashoffset', offset);
    c.style.transition='stroke-dasharray .8s ease, stroke-dashoffset .8s ease';
    svg.appendChild(c);
    offset -= d.pct;
    var li=document.createElement('div'); li.className='li';
    li.innerHTML='<span class="sw" style="background:'+d.color+'"></span>'+d.label+' <span class="lp">'+d.pct+'% · '+d.amount+' OKC</span>';
    leg.appendChild(li);
  });
}

/* ── emission table ── */
var emTbl = $('#emissionTable');
if(emTbl){
  var rows=[
    {y:'Year 1',e:'200,000',total:'73M'},
    {y:'Year 2',e:'100,000',total:'109.5M'},
    {y:'Year 3',e:'50,000',total:'128M'},
    {y:'Year 4',e:'25,000',total:'137M'},
    {y:'Year 5+',e:'12,500',total:'—',hl:true}
  ];
  rows.forEach(function(r){
    var tr=document.createElement('tr');
    if(r.hl) tr.className='highlight';
    tr.innerHTML='<td>'+r.y+'</td><td>'+r.e+' OKC/day</td><td>'+r.total+'</td>';
    emTbl.appendChild(tr);
  });
}

/* ── packs ── */
var pg = $('#packGrid');
if(pg && D.packs){
  D.packs.forEach(function(p){
    var el=document.createElement('div'); el.className='pack';
    el.innerHTML='<div class="pl">'+p.label+'</div><div class="pu">$'+p.usd+'</div><div class="po">'+p.total+' OKC</div><div class="pb">+'+(p.bonus||0)+'% bonus</div>';
    pg.appendChild(el);
  });
}

/* ── roadmap ── */
var tlWrap = $('#timeline');
if(tlWrap && D.roadmap){
  D.roadmap.forEach(function(r){
    var el=document.createElement('div');
    el.className='tl'+(r.s==='SHIPPED'?' done':r.s==='IN PROGRESS'?' now':'');
    el.innerHTML='<span>'+r.s+'</span><h4>'+r.title+'</h4><p>'+r.body+'</p>';
    tlWrap.appendChild(el);
  });
}

/* ── gallery ── */
var grid=$('#galleryGrid'), moreBtn=$('#galMore'), filtersWrap=$('#galFilters'),
    lb=$('#lightbox'), lbImg=$('#lbImg'), lbPrev=$('#lbPrev'), lbNext=$('#lbNext'),
    galCount=$('#galCount'), lbCaption=$('#lbCaption');
var shots=[], shown=0, PAGE=32, activeCat='all', lbIdx=0;

var galCats=[
  {k:'all',    l:'ALL'},
  {k:'weapons',l:'WEAPONS'},
  {k:'combat', l:'COMBAT'},
  {k:'drone',  l:'DRONES'},
  {k:'vehicle',l:'VEHICLES'},
  {k:'mission',l:'MISSIONS'}
];

function tagOf(name){
  if(/drone|uav|fpv/i.test(name))   return 'drone';
  if(/vehicle|bradley|tank|armor/i.test(name)) return 'vehicle';
  if(/mission|clear|convoy|strike/i.test(name)) return 'mission';
  if(/-w\d+/i.test(name))            return 'weapons';
  return 'combat';
}

if(filtersWrap){
  galCats.forEach(function(c){
    var b=document.createElement('button');
    b.textContent=c.l; b.setAttribute('data-cat',c.k);
    if(c.k==='all') b.classList.add('on');
    b.addEventListener('click', function(){
      activeCat=c.k;
      filtersWrap.querySelectorAll('button').forEach(function(x){ x.classList.toggle('on', x.getAttribute('data-cat')===c.k); });
      renderGallery(true);
    });
    filtersWrap.appendChild(b);
  });
}

var lazyObs = new IntersectionObserver(function(entries){
  entries.forEach(function(e){
    if(e.isIntersecting){
      var img=e.target.querySelector('img');
      if(img && img.getAttribute('data-src')){
        img.src=img.getAttribute('data-src');
        img.removeAttribute('data-src');
        img.onload=function(){ e.target.classList.add('loaded'); };
        img.onerror=function(){ e.target.style.display='none'; };
        lazyObs.unobserve(e.target);
      }
    }
  });
},{rootMargin:'200px'});

function renderGallery(reset){
  if(reset){ if(grid) grid.innerHTML=''; shown=0; }
  var pool=shots.filter(function(s){ return activeCat==='all'||tagOf(s)===activeCat; });
  var slice=pool.slice(shown, shown+PAGE);
  slice.forEach(function(name, i){
    var item=document.createElement('div');
    item.className='gal-item lazy';
    item.setAttribute('data-idx', shown+i);
    var img=document.createElement('img');
    img.setAttribute('data-src','gallery/'+name);
    img.alt=name.replace(/[_-]/g,' ').replace(/\.jpg$/i,'');
    img.loading='lazy';
    item.appendChild(img);
    item.addEventListener('click', function(){
      lbIdx=shots.indexOf(name);
      openLb(lbIdx);
    });
    if(grid) grid.appendChild(item);
    lazyObs.observe(item);
  });
  shown+=slice.length;
  if(moreBtn) moreBtn.style.display = shown>=pool.length?'none':'block';
  if(galCount) galCount.textContent = pool.length.toLocaleString();
}

function openLb(idx){
  if(!lb||!lbImg) return;
  lbIdx=Math.max(0,Math.min(idx,shots.length-1));
  lbImg.src='gallery/'+shots[lbIdx];
  if(lbCaption) lbCaption.textContent=(lbIdx+1)+' / '+shots.length+' — '+shots[lbIdx].replace(/\.jpg$/i,'').replace(/[_-]/g,' ');
  lb.classList.add('on');
}
if(lb){
  lb.addEventListener('click',function(e){ if(e.target===lb||e.target.id==='lbClose') lb.classList.remove('on'); });
  document.addEventListener('keydown',function(e){
    if(!lb.classList.contains('on')) return;
    if(e.key==='Escape') lb.classList.remove('on');
    if(e.key==='ArrowRight') openLb(lbIdx+1);
    if(e.key==='ArrowLeft')  openLb(lbIdx-1);
  });
}
if(lbPrev) lbPrev.addEventListener('click',function(e){ e.stopPropagation(); openLb(lbIdx-1); });
if(lbNext) lbNext.addEventListener('click',function(e){ e.stopPropagation(); openLb(lbIdx+1); });
if(moreBtn) moreBtn.addEventListener('click',function(){ renderGallery(false); });

/* load manifest */
fetch('gallery/manifest.json')
  .then(function(r){ return r.json(); })
  .then(function(list){
    shots = list.filter(function(f){ return /\.jpg$/i.test(f) && f!=='cover.jpg'; });
    renderGallery(true);
  })
  .catch(function(){
    /* fallback: enumerate G0001..G1040 */
    for(var i=1;i<=1040;i++){
      shots.push('G'+String(i).padStart(4,'0')+'-combat-k0.jpg');
    }
    renderGallery(true);
  });

/* ── scroll reveal ── */
var revealObs = new IntersectionObserver(function(entries){
  entries.forEach(function(e){ if(e.isIntersecting) e.target.classList.add('visible'); });
},{threshold:.1});
$$('.reveal').forEach(function(el){ revealObs.observe(el); });

/* ── active nav highlight on scroll ── */
var sections = $$('section[id]');
var navAs = $$('.nav-links a[href^="#"]');
window.addEventListener('scroll', function(){
  var pos = window.scrollY + 120;
  sections.forEach(function(s){
    if(pos >= s.offsetTop && pos < s.offsetTop+s.offsetHeight){
      navAs.forEach(function(a){ a.classList.toggle('active', a.getAttribute('href')==='#'+s.id); });
    }
  });
},{passive:true});

/* ── hero image cycle ── */
var heroShot = $('#heroShot');
var heroImages = [];
/* load a few random gallery images for the hero cycle */
fetch('gallery/manifest.json')
  .then(function(r){ return r.json(); })
  .then(function(list){
    heroImages = list.filter(function(f){ return /\.jpg$/i.test(f) && f!=='cover.jpg'; });
    if(heroImages.length>10) startHeroCycle();
  }).catch(function(){});

function startHeroCycle(){
  if(!heroShot) return;
  var i=Math.floor(Math.random()*heroImages.length);
  setInterval(function(){
    i=(i+1)%heroImages.length;
    heroShot.style.opacity='0';
    heroShot.style.transition='opacity .6s';
    setTimeout(function(){
      heroShot.src='gallery/'+heroImages[i];
      heroShot.style.opacity='1';
    },600);
  },4500);
}

})();
