/* ============================================================
 *  GHOST-CAMO.JS — Active camouflage / invisibility (F9)
 *
 *  F9 activates 10s of active camo. All enemy detection ranges
 *  are zeroed for the duration — enemies lose target lock.
 *  Screen shows a moving heat-shimmer / predator refraction
 *  overlay. 1 stock per wave, 50s cooldown.
 * ============================================================ */
var GhostCamo = (function () {
  'use strict';

  var DURATION   = 10.0;
  var COOLDOWN   = 50.0;
  var STOCK_MAX  = 1;

  var _active    = false;
  var _timer     = 0;
  var _cd        = 0;
  var _stock     = STOCK_MAX;
  var _waveWas   = -1;
  var _lastTs    = 0;
  var _frameN    = 0;
  var _init      = false;

  /* Saved enemy detection values */
  var _savedDet  = new WeakMap();
  var _savedRng  = new WeakMap();

  /* DOM */
  var _canvas, _ctx, _banner, _hintEl;

  /* ── Build DOM ──────────────────────────── */
  function _buildDOM() {
    /* Shimmer canvas overlay */
    _canvas = document.createElement('canvas');
    _canvas.id = 'gc-canvas';
    Object.assign(_canvas.style, {
      position: 'fixed', top: 0, left: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 310,
      display: 'none', mixBlendMode: 'overlay'
    });
    document.body.appendChild(_canvas);
    _ctx = _canvas.getContext('2d');

    /* Active timer banner */
    _banner = document.createElement('div');
    _banner.id = 'gc-banner';
    Object.assign(_banner.style, {
      position: 'fixed', top: '80px', right: '14px',
      fontFamily: "'Courier New', monospace",
      fontSize: '10px', letterSpacing: '2px',
      color: 'rgba(100,255,200,0.92)',
      textShadow: '0 0 8px rgba(60,255,180,0.85)',
      zIndex: 320, display: 'none', pointerEvents: 'none',
      whiteSpace: 'nowrap'
    });
    document.body.appendChild(_banner);

    /* Cooldown / stock hint near kill-feed area */
    _hintEl = document.createElement('div');
    _hintEl.id = 'gc-hint';
    Object.assign(_hintEl.style, {
      position: 'fixed', top: '98px', right: '14px',
      fontFamily: "'Courier New', monospace",
      fontSize: '9px', letterSpacing: '1.5px',
      color: 'rgba(100,200,160,0.55)',
      zIndex: 320, pointerEvents: 'none',
      whiteSpace: 'nowrap'
    });
    _hintEl.textContent = '[F9] GHOST ×' + _stock;
    document.body.appendChild(_hintEl);
  }

  /* ── Resize canvas ─────────────────────── */
  function _resize() {
    _canvas.width  = window.innerWidth;
    _canvas.height = window.innerHeight;
  }

  /* ── Apply / remove detection suppression ─ */
  function _suppress() {
    try {
      var all = typeof Enemies !== 'undefined' && Enemies.getAll ? Enemies.getAll() : [];
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || e.dead) continue;
        if (!_savedDet.has(e)) {
          _savedDet.set(e, e.detectionRange || 20);
          _savedRng.set(e, e.rangedRange    || 30);
        }
        e.detectionRange = 0.01;
        e.rangedRange    = 0.01;
      }
    } catch (err) {}
  }

  function _restore() {
    try {
      var all = typeof Enemies !== 'undefined' && Enemies.getAll ? Enemies.getAll() : [];
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e) continue;
        if (_savedDet.has(e)) { e.detectionRange = _savedDet.get(e); _savedDet.delete(e); }
        if (_savedRng.has(e)) { e.rangedRange    = _savedRng.get(e); _savedRng.delete(e); }
      }
    } catch (err) {}
  }

  /* ── Activate ───────────────────────────── */
  function _activate() {
    if (_active)   { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('GHOST CAMO ALREADY ACTIVE'); return; }
    if (_cd > 0)   { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('GHOST CAMO CD ' + Math.ceil(_cd) + 's'); return; }
    if (_stock <= 0) { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('GHOST CAMO — NO STOCK'); return; }

    _stock--;
    _active = true;
    _timer  = DURATION;

    _canvas.style.display = 'block';
    _banner.style.display = 'block';
    _resize();

    /* Game canvas CSS tint */
    var gc = document.querySelector('canvas[id]:not(#gc-canvas):not(#km-canvas)');
    if (gc) gc.style.filter = 'hue-rotate(140deg) brightness(1.05) saturate(0.7)';

    if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.2, 0.15);
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('👻 GHOST CAMO ACTIVE — ' + DURATION + 's');

    _hintEl.textContent = '[F9] GHOST ×' + _stock;
  }

  /* ── Deactivate ─────────────────────────── */
  function _deactivate() {
    _active = false;
    _cd     = COOLDOWN;
    _restore();
    _canvas.style.display = 'none';
    _banner.style.display = 'none';
    var gc = document.querySelector('canvas[id]:not(#gc-canvas):not(#km-canvas)');
    if (gc) gc.style.filter = '';
    if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.18, 0.12);
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('GHOST CAMO ENDED');
  }

  /* ── Draw shimmer overlay ───────────────── */
  function _drawShimmer(t) {
    var W = _canvas.width, H = _canvas.height;
    _ctx.clearRect(0, 0, W, H);

    /* Moving diagonal refraction lines */
    var speed = t * 0.4;
    _ctx.save();
    _ctx.globalAlpha = 0.06;
    _ctx.strokeStyle = 'rgba(160,255,220,1)';
    _ctx.lineWidth   = 1;
    var spacing = 28;
    for (var i = -H; i < W + H; i += spacing) {
      var offset = Math.sin((i * 0.04) + speed) * 8;
      _ctx.beginPath();
      _ctx.moveTo(i + offset, 0);
      _ctx.lineTo(i + H * 0.7 + offset, H);
      _ctx.stroke();
    }
    _ctx.restore();

    /* Subtle edge vignette — teal tint */
    _ctx.save();
    _ctx.globalAlpha = 0.18 + Math.sin(t * 3) * 0.06;
    var vg = _ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,200,140,0.35)');
    _ctx.fillStyle = vg;
    _ctx.fillRect(0, 0, W, H);
    _ctx.restore();

    /* Scanline ripple from top */
    _ctx.save();
    _ctx.globalAlpha = 0.04;
    _ctx.fillStyle   = 'rgba(100,255,200,1)';
    var ry = ((t * 120) % (H + 30)) - 15;
    _ctx.fillRect(0, ry, W, 2);
    _ctx.restore();
  }

  /* ── rAF tick ───────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    _frameN++;

    /* Restock on new wave */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (w !== _waveWas) { _waveWas = w; _stock = STOCK_MAX; _cd = 0; _hintEl.textContent = '[F9] GHOST ×' + _stock; }
      }
    } catch (e) {}

    /* Cooldown tick */
    if (_cd > 0) {
      _cd -= dt;
      if (_cd <= 0) {
        _cd = 0;
        _hintEl.textContent = '[F9] GHOST ×' + _stock;
        _hintEl.style.color = 'rgba(100,200,160,0.55)';
      } else {
        _hintEl.textContent = '[F9] GHOST CD ' + Math.ceil(_cd) + 's';
        _hintEl.style.color = 'rgba(100,200,160,0.35)';
      }
    }

    if (!_active) return;

    /* Suppress enemy detection every 3 frames (catch newly-spawned enemies) */
    if (_frameN % 3 === 0) _suppress();

    /* Timer countdown */
    _timer -= dt;
    _banner.textContent = '👻 GHOST  ' + Math.ceil(Math.max(0, _timer)) + 's';
    _drawShimmer(ts / 1000);

    if (_timer <= 0) _deactivate();
  }

  /* ── Key handler ────────────────────────── */
  function _onKey(e) {
    if (e.key === 'F9' && !e.repeat) {
      e.preventDefault();
      _activate();
    }
  }

  /* ── Init ──────────────────────────────── */
  function init() {
    if (_init) return;
    _init = true;
    _buildDOM();
    _resize();
    window.addEventListener('resize', _resize);
    window.addEventListener('keydown', _onKey);
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.GhostCamo = GhostCamo;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { GhostCamo.init(); });
} else {
  GhostCamo.init();
}
