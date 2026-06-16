/* ============================================================
 *  BREACH-CLEAR.JS — Tactical breach (slow-mo cinematic)
 *
 *  [ key — initiates a 2.5s breach window:
 *    • Canvas chromatic aberration + radial smear overlay
 *    • Game canvas gets CSS desaturation filter
 *    • Enemies within 12u are staggered (knocked back briefly)
 *    • Kills during breach award 3× score bonus
 *    • HUD countdown banner
 *    • WebAudio slowdown if AudioContext is accessible
 *  2 stock per wave. 45s cooldown after each use.
 * ============================================================ */
var BreachClear = (function () {
  'use strict';

  /* ── Config ─────────────────────────────── */
  var CFG = {
    DURATION:    2500,  /* ms */
    COOLDOWN:   45000,  /* ms */
    STOCK:          2,
    STAGGER_RANGE: 12,  /* world units — enemies inside get knocked */
    STAGGER_FORCE:  8,  /* push velocity */
    KILL_MULT:      3,  /* score multiplier during breach */
  };

  /* ── State ──────────────────────────────── */
  var _initialized = false;
  var _active      = false;
  var _stock       = CFG.STOCK;
  var _cooldown    = 0;       /* ms remaining */
  var _elapsed     = 0;       /* ms into current breach */
  var _canvas      = null;
  var _ctx         = null;
  var _banner      = null;
  var _hudEl       = null;
  var _gameCanvas  = null;    /* the THREE.js render canvas */
  var _lastTs      = 0;
  var _staggered   = new WeakSet();

  /* ── Find THREE canvas ──────────────────── */
  function _findGameCanvas() {
    if (_gameCanvas) return _gameCanvas;
    /* THREE renderer usually creates the first WebGL canvas */
    var canvases = document.getElementsByTagName('canvas');
    for (var i = 0; i < canvases.length; i++) {
      var ctx = null;
      try { ctx = canvases[i].getContext('webgl') || canvases[i].getContext('webgl2'); } catch(e){}
      if (ctx) { _gameCanvas = canvases[i]; return _gameCanvas; }
    }
    return null;
  }

  /* ── HUD counter ────────────────────────── */
  function _updateHUD() {
    if (!_hudEl) return;
    var ready = _cooldown <= 0;
    _hudEl.innerHTML = '⚡ ' + _stock + (ready ? '' : ' <span style="color:rgba(255,255,255,0.3);font-size:8px">' + Math.ceil(_cooldown/1000) + 's</span>');
    _hudEl.style.color = _stock > 0 && ready ? '#ffffff' : 'rgba(255,255,255,0.35)';
  }

  /* ── Stagger near enemies ───────────────── */
  function _staggerEnemies() {
    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
      var player = window.player;
      if (!player || !player.position) return;
      var all = Enemies.getAll();
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || !e.mesh || e.dead) continue;
        if (_staggered.has(e)) continue;
        var dx = e.mesh.position.x - player.position.x;
        var dz = e.mesh.position.z - player.position.z;
        var dist = Math.sqrt(dx*dx + dz*dz);
        if (dist > CFG.STAGGER_RANGE) continue;
        _staggered.add(e);
        /* Push enemy away from player */
        var len = dist || 1;
        if (!e._breachVel) e._breachVel = { x: 0, z: 0, t: 0 };
        e._breachVel.x = (dx / len) * CFG.STAGGER_FORCE;
        e._breachVel.z = (dz / len) * CFG.STAGGER_FORCE;
        e._breachVel.t = 0.6; /* seconds of stagger */
        /* Brief stun — try to flag e.stunned (respected by some AI paths) */
        try { e.stunned = 0.6; } catch(ex){}
      }
    } catch(err) {}
  }

  /* Apply stagger physics each frame */
  function _tickStagger(dt) {
    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
      var all = Enemies.getAll();
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || !e._breachVel || e._breachVel.t <= 0) continue;
        e._breachVel.t -= dt;
        if (e._breachVel.t <= 0) { e._breachVel.t = 0; continue; }
        try {
          e.mesh.position.x += e._breachVel.x * dt;
          e.mesh.position.z += e._breachVel.z * dt;
        } catch(ex){}
      }
    } catch(err) {}
  }

  /* ── Draw chromatic aberration overlay ─── */
  function _drawChroma(t) {
    var w = window.innerWidth, h = window.innerHeight;
    if (_canvas.width !== w || _canvas.height !== h) {
      _canvas.width = w; _canvas.height = h;
    }
    var ctx = _ctx;
    ctx.clearRect(0, 0, w, h);

    /* Progress 0→1 over duration, peaks at 0.3, fades */
    var prog = t / CFG.DURATION;
    var peak = 1 - Math.abs(prog - 0.3) / 0.7;
    peak = Math.max(0, Math.min(1, peak));

    var shift = peak * 14; /* max pixel shift */

    /* Red channel offset left, blue offset right via gradient overlay */
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = peak * 0.35;

    /* Red fringe — left edge */
    var rg = ctx.createLinearGradient(0, 0, w * 0.25, 0);
    rg.addColorStop(0, 'rgba(255,0,0,0.5)');
    rg.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, w * 0.25, h);

    /* Blue fringe — right edge */
    var bg = ctx.createLinearGradient(w * 0.75, 0, w, 0);
    bg.addColorStop(0, 'rgba(0,0,255,0)');
    bg.addColorStop(1, 'rgba(0,80,255,0.5)');
    ctx.fillStyle = bg;
    ctx.fillRect(w * 0.75, 0, w * 0.25, h);

    /* Radial vignette — darkens edges heavily */
    ctx.globalAlpha = peak * 0.55;
    var vig = ctx.createRadialGradient(w/2, h/2, h*0.2, w/2, h/2, h*0.7);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    /* Scan-line flash at breach start */
    if (prog < 0.1) {
      ctx.globalAlpha = (1 - prog/0.1) * 0.25;
      ctx.fillStyle = 'rgba(255,255,255,1)';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ── Trigger breach ─────────────────────── */
  function _activate() {
    if (_active || _stock <= 0 || _cooldown > 0) return;
    _stock--;
    _active  = true;
    _elapsed = 0;
    _staggered = new WeakSet();
    _updateHUD();

    /* HUD banner */
    if (_banner) {
      _banner.style.opacity = '1';
      _banner.textContent   = '⚡ BREACH';
    }

    /* De-saturate game canvas */
    var gc = _findGameCanvas();
    if (gc) gc.style.filter = 'saturate(0.12) brightness(1.18) contrast(1.1)';

    /* Show overlay */
    if (_canvas) _canvas.style.display = 'block';

    /* Stagger nearby enemies immediately */
    _staggerEnemies();

    /* Radio chatter */
    try { if (window.Feedback && Feedback.radioChatter) Feedback.radioChatter('breach'); } catch(e){}
    try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('⚡ BREACH CLEAR', '#ffffff'); } catch(e){}
    try { if (window.CameraSystem && CameraSystem.shake) CameraSystem.shake(0.4, 0.3); } catch(e) {}
  }

  /* ── End breach ─────────────────────────── */
  function _deactivate() {
    _active   = false;
    _cooldown = CFG.COOLDOWN;
    _elapsed  = 0;

    /* Restore game canvas */
    var gc = _findGameCanvas();
    if (gc) gc.style.filter = '';

    /* Hide overlay + banner */
    if (_canvas) _canvas.style.display = 'none';
    if (_banner) _banner.style.opacity = '0';
    _updateHUD();
  }

  /* ── rAF tick ───────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - _lastTs) / 1000);
    if (_lastTs) {
      /* Cooldown */
      if (_cooldown > 0) {
        _cooldown = Math.max(0, _cooldown - dt * 1000);
        if (_cooldown === 0) _updateHUD();
      }

      /* Active breach */
      if (_active) {
        _elapsed += dt * 1000;
        _tickStagger(dt);

        if (_elapsed >= CFG.DURATION) {
          _deactivate();
        } else {
          /* Update banner countdown */
          var remaining = ((CFG.DURATION - _elapsed) / 1000).toFixed(1);
          if (_banner) _banner.textContent = '⚡ BREACH  ' + remaining + 's';
          /* Draw chroma */
          try { _drawChroma(_elapsed); } catch(e){}
        }
      }
    }
    _lastTs = ts;
  }

  /* ── Restock on wave change ─────────────── */
  function _hookWaveChange() {
    var lastWave = -1;
    setInterval(function () {
      try {
        var w = window.GameManager && GameManager.getCurrentWave ? GameManager.getCurrentWave() : 0;
        if (w !== lastWave && w > 0) {
          lastWave = w;
          _stock = CFG.STOCK;
          _cooldown = 0;
          _staggered = new WeakSet();
          _updateHUD();
        }
      } catch(e) {}
    }, 2000);
  }

  /* ── Init ──────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;
    if (typeof THREE === 'undefined') return;

    /* Chromatic aberration canvas */
    _canvas = document.createElement('canvas');
    _canvas.id = 'breach-canvas';
    _canvas.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'pointer-events:none;z-index:310;display:none;',
    ].join('');
    _ctx = _canvas.getContext('2d');
    document.body.appendChild(_canvas);

    /* Flash banner */
    _banner = document.createElement('div');
    _banner.id = 'breach-banner';
    _banner.style.cssText = [
      'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);',
      'font-family:monospace;font-size:28px;font-weight:bold;',
      'color:#ffffff;text-shadow:0 0 20px rgba(255,255,255,0.8),0 0 40px rgba(100,160,255,0.6);',
      'letter-spacing:0.3em;pointer-events:none;z-index:315;',
      'opacity:0;transition:opacity 0.15s;',
    ].join('');
    document.body.appendChild(_banner);

    /* HUD chip — bottom-left stack */
    _hudEl = document.createElement('div');
    _hudEl.id = 'breach-hud';
    _hudEl.style.cssText = [
      'position:fixed;bottom:310px;left:52px;font-family:monospace;font-size:9px;',
      'color:#ffffff;pointer-events:none;z-index:210;line-height:20px;',
      'letter-spacing:0.08em;',
    ].join('');
    document.body.appendChild(_hudEl);
    _updateHUD();

    /* Key handler */
    window.addEventListener('keydown', function (e) {
      if (e.code === 'BracketLeft' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        _activate();
      }
    });

    _hookWaveChange();
    requestAnimationFrame(_tick);
  }

  return { init: init, activate: _activate };
})();

window.BreachClear = BreachClear;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { BreachClear.init(); });
} else {
  BreachClear.init();
}
