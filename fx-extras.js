/* ============================================================================
   OccupantKiller — FX Extras (additive, defensive, cosmetic).
   Round 4 — visual atmosphere, diversifying away from HUD widgets:
     1. Cinematic mode   — letterbox bars + vignette + faint scanlines  (key C)
     2. Atmosphere       — drifting ember/dust motes overlay            (key V)
     3. Stage title card — cinematic "STAGE N — NAME" on match start
   All overlays are pointer-events:none and default OFF (cinematic/particles),
   so they add zero cost until enabled. Title card auto-shows on match start.
   Test hooks: window.FXExtras.cinematic(b) / .particles(b) / .titleCard(txt).
   ========================================================================== */
(function () {
  'use strict';

  function el(tag, css, parent) {
    var d = document.createElement(tag);
    if (css) d.style.cssText = css;
    (parent || document.body).appendChild(d);
    return d;
  }

  /* 1. Cinematic overlay ----------------------------------------------------- */
  var cine = el('div',
    'position:fixed;inset:0;pointer-events:none;z-index:960;opacity:0;'
    + 'transition:opacity .4s;'
    + 'background:'
    +   'linear-gradient(rgba(0,0,0,.92),rgba(0,0,0,0) 9%,rgba(0,0,0,0) 91%,rgba(0,0,0,.92)),'   // letterbox
    +   'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,.45) 100%),'           // vignette
    +   'repeating-linear-gradient(rgba(0,0,0,0) 0 2px, rgba(0,0,0,.10) 2px 3px);');             // scanlines
  var cineOn = false;

  /* 2. Atmosphere particles -------------------------------------------------- */
  var pcanvas = el('canvas', 'position:fixed;inset:0;pointer-events:none;z-index:945;opacity:0;transition:opacity .5s;');
  var pctx = pcanvas.getContext('2d');
  var particles = [], partOn = false;
  function sizeCanvas() { pcanvas.width = window.innerWidth; pcanvas.height = window.innerHeight; }
  sizeCanvas();
  window.addEventListener('resize', sizeCanvas);
  function seedParticles() {
    particles = [];
    for (var i = 0; i < 32; i++) {
      particles.push({
        x: Math.random() * pcanvas.width, y: Math.random() * pcanvas.height,
        r: 0.6 + Math.random() * 2.2, vx: (Math.random() - 0.5) * 12, vy: -6 - Math.random() * 16,
        a: 0.15 + Math.random() * 0.45, hue: 28 + Math.random() * 18
      });
    }
  }
  seedParticles();

  /* 3. Stage title card ------------------------------------------------------ */
  var card = el('div',
    'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;'
    + 'z-index:962;text-align:center;opacity:0;transition:opacity .5s,letter-spacing .9s;'
    + 'font-family:"JetBrains Mono",monospace;');
  card.innerHTML =
    '<div data-card-kicker style="color:#ffd400;font-size:13px;letter-spacing:4px;margin-bottom:6px;text-shadow:0 0 8px #ff6a00">DEPLOYING</div>'
    + '<div data-card-title style="color:#fff;font-size:38px;font-weight:900;letter-spacing:2px;text-shadow:0 2px 10px #000,0 0 20px rgba(0,216,255,.4)">STAGE</div>'
    + '<div style="height:2px;width:120px;margin:10px auto 0;background:linear-gradient(90deg,transparent,#00d8ff,transparent)"></div>';
  var cardTitle = card.querySelector('[data-card-title]');
  var cardKicker = card.querySelector('[data-card-kicker]');
  var _cardHideAt = 0;

  function showCard(name, kicker) {
    if (cardTitle) cardTitle.textContent = (name || 'STAGE').toUpperCase();
    if (cardKicker) cardKicker.textContent = (kicker || 'DEPLOYING').toUpperCase();
    card.style.opacity = '1';
    card.style.letterSpacing = '6px';
    _cardHideAt = performance.now() + 2600;
  }

  function setCinematic(on) { cineOn = !!on; cine.style.opacity = cineOn ? '1' : '0'; }
  function setParticles(on) { partOn = !!on; pcanvas.style.opacity = partOn ? '1' : '0'; if (partOn) seedParticles(); }

  /* Hotkeys ------------------------------------------------------------------ */
  window.addEventListener('keydown', function (e) {
    if (e.repeat || e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.key === 'c' || e.key === 'C') setCinematic(!cineOn);
    if (e.key === 'v' || e.key === 'V') setParticles(!partOn);
  });

  /* Loop --------------------------------------------------------------------- */
  function playing() {
    try { if (typeof GameManager === 'undefined' || !GameManager.getState) return false; var s = GameManager.getState(); return s === 'playing' || s === 'preWave'; } catch (e) { return false; }
  }
  var _wasPlaying = false, _lastT = performance.now();

  function tick(now) {
    requestAnimationFrame(tick);
    var dt = Math.min(0.05, (now - _lastT) / 1000); _lastT = now;

    // Auto title card on match start.
    var live = playing();
    if (live && !_wasPlaying) {
      var name = 'STAGE';
      try { var si = GameManager.getStageInfo && GameManager.getStageInfo(); if (si && si.name) name = si.name; } catch (e) {}
      showCard(name, 'DEPLOYING');
    }
    _wasPlaying = live;
    if (_cardHideAt && now > _cardHideAt) { card.style.opacity = '0'; card.style.letterSpacing = '2px'; _cardHideAt = 0; }

    // Particles
    if (partOn && pctx) {
      pctx.clearRect(0, 0, pcanvas.width, pcanvas.height);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.y < -10) { p.y = pcanvas.height + 10; p.x = Math.random() * pcanvas.width; }
        if (p.x < -10) p.x = pcanvas.width + 10; if (p.x > pcanvas.width + 10) p.x = -10;
        pctx.beginPath();
        pctx.fillStyle = 'hsla(' + p.hue + ',90%,60%,' + p.a + ')';
        pctx.shadowColor = 'hsla(' + p.hue + ',90%,60%,.8)'; pctx.shadowBlur = 6;
        pctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); pctx.fill();
      }
      pctx.shadowBlur = 0;
    }
  }
  requestAnimationFrame(tick);

  window.FXExtras = {
    cinematic: setCinematic,
    particles: setParticles,
    titleCard: function (txt, kicker) { showCard(txt || 'TREELINE ASSAULT', kicker); },
    _cine: cine, _canvas: pcanvas, _card: card
  };
})();
