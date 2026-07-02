/* ============================================================
 *  SCREEN-EFFECTS.JS — Camera/screen post-processing overlays
 *  Effects:
 *    1. Blood splatter on camera (when player takes damage)
 *    2. Screen crack pattern (HP < 22%)
 *    3. EMP / explosion static flicker
 *    4. Near-death colour desaturation pulse
 *    5. Bullet-impact edge vignette flash
 *  Hooks via HUD.setHealth monkey-patch — no game-manager edits needed.
 * ============================================================ */
var ScreenEffects = (function () {
  'use strict';

  /* ── Config ───────────────────────────────── */
  var CFG = {
    BLOOD_FADE_SEC:   3.5,   // how long blood stays visible
    BLOOD_BLOBS:      5,     // blobs per damage event (max)
    CRACK_HP_FRAC:    0.22,  // crack appears below this HP fraction
    CRACK_HEAVY_FRAC: 0.10,  // heavy crack pattern below this
    EMP_DURATION:     0.25,  // seconds for EMP static
    CRACK_FADE_SEC:   5,     // auto-fade cracks after 5 seconds
    VIGNETTE_DURATION:0.35,  // red vignette flash duration
    DESAT_MIN_ALPHA:  0.0,
    DESAT_MAX_ALPHA:  0.5,   // grey overlay alpha at 0 HP
  };

  /* ── State ────────────────────────────────── */
  var _initialized = false;
  var _bloodCanvas  = null;
  var _bloodCtx     = null;
  var _crackCanvas  = null;
  var _crackCtx     = null;
  var _empOverlay   = null;
  var _vigOverlay   = null;
  var _desatOverlay = null;

  var _bloodAlpha   = 0;   // current alpha (fades to 0)
  var _crackAlpha   = 0;
  var _crackFadeTimer = 0; // auto-fade timer for cracks
  var _empTimer     = 0;   // seconds remaining
  var _vigTimer     = 0;
  var _lastHp       = 100;
  var _maxHp        = 100;
  var _crackDrawn   = false;

  var _raf          = null;
  var _lastTs       = 0;

  /* ── DOM setup ───────────────────────────── */
  function _createLayer(id, zIndex, extra) {
    var el = document.createElement('div');
    el.id = id;
    el.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:' + zIndex + ';' + (extra || '');
    document.body.appendChild(el);
    return el;
  }

  function _createCanvas(id, zIndex) {
    var c = document.createElement('canvas');
    c.id = id;
    c.width  = window.innerWidth;
    c.height = window.innerHeight;
    c.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:' + zIndex + ';';
    document.body.appendChild(c);
    window.addEventListener('resize', function () {
      c.width  = window.innerWidth;
      c.height = window.innerHeight;
      if (id === 'se-crack-canvas') _crackDrawn = false; // redraw cracks on resize
    });
    return c;
  }

  /* ── Blood splatter ──────────────────────── */
  function _spawnBloodBlobs(intensity) {
    if (!_bloodCtx) return;
    var w = _bloodCanvas.width, h = _bloodCanvas.height;
    var count = Math.ceil(CFG.BLOOD_BLOBS * intensity) + 1;
    for (var i = 0; i < count; i++) {
      // Bias toward edges (damage "coming from outside")
      var edge = Math.random();
      var bx, by;
      if (edge < 0.25) { bx = Math.random() * w * 0.3; by = Math.random() * h; }
      else if (edge < 0.5) { bx = w - Math.random() * w * 0.3; by = Math.random() * h; }
      else if (edge < 0.75) { bx = Math.random() * w; by = Math.random() * h * 0.3; }
      else { bx = Math.random() * w; by = h - Math.random() * h * 0.3; }

      var r = 18 + Math.random() * 55 * intensity;
      var grd = _bloodCtx.createRadialGradient(bx, by, 0, bx, by, r);
      grd.addColorStop(0,   'rgba(160,0,0,0.85)');
      grd.addColorStop(0.4, 'rgba(100,0,0,0.6)');
      grd.addColorStop(1,   'rgba(60,0,0,0)');
      _bloodCtx.fillStyle = grd;
      _bloodCtx.beginPath();
      // Slightly irregular blob
      _bloodCtx.ellipse(bx, by, r * (0.7 + Math.random() * 0.6),
                                 r * (0.5 + Math.random() * 0.5),
                                 Math.random() * Math.PI, 0, Math.PI * 2);
      _bloodCtx.fill();
    }
    // Drip streaks for heavy hits
    if (intensity > 0.5) {
      for (var d = 0; d < 2; d++) {
        var dx = Math.random() * w;
        var dy = Math.random() * h * 0.6;
        var dLen = 20 + Math.random() * 60;
        _bloodCtx.strokeStyle = 'rgba(120,0,0,0.55)';
        _bloodCtx.lineWidth   = 2 + Math.random() * 3;
        _bloodCtx.beginPath();
        _bloodCtx.moveTo(dx, dy);
        _bloodCtx.bezierCurveTo(dx + (Math.random()-0.5)*20, dy + dLen*0.4,
                                 dx + (Math.random()-0.5)*20, dy + dLen*0.8,
                                 dx + (Math.random()-0.5)*10, dy + dLen);
        _bloodCtx.stroke();
      }
    }
    _bloodAlpha = Math.min(1, _bloodAlpha + intensity * 0.7 + 0.2);
  }

  /* ── Screen crack ────────────────────────── */
  function _drawCracks(heavy) {
    if (!_crackCtx) return;
    var w = _crackCanvas.width, h = _crackCanvas.height;
    _crackCtx.clearRect(0, 0, w, h);
    // Radiate cracks from corners and edges
    var origins = [[0, 0], [w, 0], [0, h], [w, h],
                   [w/2, 0], [w/2, h], [0, h/2], [w, h/2]];
    var lineCount = heavy ? 18 : 8;
    _crackCtx.strokeStyle = 'rgba(255,255,255,0.35)';
    _crackCtx.lineWidth   = 1;
    for (var i = 0; i < lineCount; i++) {
      var o = origins[i % origins.length];
      _crackCtx.beginPath();
      var cx = o[0], cy = o[1];
      _crackCtx.moveTo(cx, cy);
      var steps = 4 + Math.floor(Math.random() * 4);
      var tx = w * 0.3 + Math.random() * w * 0.4;
      var ty = h * 0.3 + Math.random() * h * 0.4;
      for (var s = 0; s < steps; s++) {
        var frac = (s + 1) / steps;
        var nx = cx + (tx - cx) * frac + (Math.random() - 0.5) * 80;
        var ny = cy + (ty - cy) * frac + (Math.random() - 0.5) * 80;
        _crackCtx.lineTo(nx, ny);
        cx = nx; cy = ny;
      }
      _crackCtx.stroke();
    }
    // A glass-fracture ring around center
    _crackCtx.strokeStyle = heavy ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.10)';
    _crackCtx.beginPath();
    _crackCtx.arc(w/2, h/2, Math.min(w, h) * 0.12, 0, Math.PI * 2);
    _crackCtx.stroke();
    _crackDrawn = true;
  }

  /* ── EMP static ─────────────────────────── */
  function _renderEmpStatic() {
    if (!_empOverlay) return;
    var w = window.innerWidth, h = window.innerHeight;
    // Quick noise via repeating tiny canvas drawn as background
    var nc = document.createElement('canvas');
    nc.width = 128; nc.height = 128;
    var nctx = nc.getContext('2d');
    var imgd = nctx.createImageData(128, 128);
    for (var p = 0; p < imgd.data.length; p += 4) {
      var v = Math.random() > 0.5 ? 200 : 20;
      imgd.data[p] = imgd.data[p+1] = imgd.data[p+2] = v;
      imgd.data[p+3] = Math.random() * 60;
    }
    nctx.putImageData(imgd, 0, 0);
    _empOverlay.style.background = 'url(' + nc.toDataURL() + ') repeat';
    _empOverlay.style.opacity    = '0.45';
  }

  /* ── Update loop ─────────────────────────── */
  function _tick(ts) {
    _raf = requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - _lastTs) / 1000);
    _lastTs = ts;

    // Blood fade
    if (_bloodAlpha > 0) {
      _bloodAlpha -= dt / CFG.BLOOD_FADE_SEC;
      if (_bloodAlpha <= 0) {
        _bloodAlpha = 0;
        if (_bloodCtx) _bloodCtx.clearRect(0, 0, _bloodCanvas.width, _bloodCanvas.height);
        _bloodCanvas.style.opacity = '0';
      } else {
        _bloodCanvas.style.opacity = String(_bloodAlpha);
      }
    }

    // Crack visibility based on HP + auto-fade timer
    if (_crackCanvas) {
      var hpFrac = _maxHp > 0 ? _lastHp / _maxHp : 1;
      if (hpFrac < CFG.CRACK_HP_FRAC && _crackFadeTimer > 0) {
        var heavy = hpFrac < CFG.CRACK_HEAVY_FRAC;
        if (!_crackDrawn) _drawCracks(heavy);
        var hpAlpha = Math.min(1, (CFG.CRACK_HP_FRAC - hpFrac) / CFG.CRACK_HP_FRAC * 1.4);
        _crackAlpha = hpAlpha * (_crackFadeTimer / CFG.CRACK_FADE_SEC);
        _crackFadeTimer -= dt;
        if (_crackFadeTimer < 0) _crackFadeTimer = 0;
        _crackCanvas.style.opacity = String(_crackAlpha);
      } else {
        if (_crackDrawn) { _crackDrawn = false; }
        _crackFadeTimer = 0;
        _crackAlpha = 0;
        _crackCanvas.style.opacity = '0';
      }
    }

    // EMP fade
    if (_empTimer > 0) {
      _empTimer -= dt;
      if (_empTimer <= 0) {
        _empOverlay.style.opacity = '0';
      } else {
        _renderEmpStatic();
      }
    }

    // Vignette flash fade
    if (_vigTimer > 0) {
      _vigTimer -= dt;
      var vAlpha = Math.max(0, _vigTimer / CFG.VIGNETTE_DURATION);
      _vigOverlay.style.opacity = String(vAlpha);
    }

    // Near-death grey desaturation
    if (_desatOverlay) {
      var hpFr = _maxHp > 0 ? _lastHp / _maxHp : 1;
      var dAlpha = hpFr < 0.25 ? (0.25 - hpFr) / 0.25 * CFG.DESAT_MAX_ALPHA : 0;
      _desatOverlay.style.opacity = String(dAlpha);
    }
  }

  /* ── Public API ──────────────────────────── */
  function _onHealthSet(hp, maxHp) {
    var prevFrac = _maxHp > 0 ? _lastHp / _maxHp : 1;
    _lastHp = hp;
    _maxHp  = maxHp > 0 ? maxHp : _maxHp;
    var newFrac  = maxHp > 0 ? hp / maxHp : 1;
    var drop = prevFrac - newFrac;
    if (drop > 0.005) {
      // Intensity: fraction of max HP lost in this hit
      var intensity = Math.min(1, drop * 3);
      _spawnBloodBlobs(intensity);
      _vigTimer = CFG.VIGNETTE_DURATION;
      if (_crackDrawn && hp > 0 && newFrac >= CFG.CRACK_HP_FRAC) {
        // HP recovered above crack threshold — clear cracks
        _crackDrawn = false;
      }
      // Reset crack fade timer when damage is taken below threshold
      if (newFrac < CFG.CRACK_HP_FRAC) {
        _crackFadeTimer = CFG.CRACK_FADE_SEC;
      }
    }
  }

  function triggerEMP() {
    _empTimer = CFG.EMP_DURATION;
    _renderEmpStatic();
  }

  function init() {
    if (_initialized) return;
    _initialized = true;

    // Blood canvas
    _bloodCanvas = _createCanvas('se-blood-canvas', 183);
    _bloodCtx    = _bloodCanvas.getContext('2d');
    _bloodCanvas.style.opacity = '0';

    // Crack canvas
    _crackCanvas = _createCanvas('se-crack-canvas', 182);
    _crackCtx    = _crackCanvas.getContext('2d');
    _crackCanvas.style.opacity = '0';

    // EMP overlay
    _empOverlay = _createLayer('se-emp-overlay', 186,
      'background:repeating-linear-gradient(transparent 0px,transparent 1px,rgba(0,0,0,0.04) 2px);opacity:0;transition:opacity 0.05s;');

    // Vignette flash overlay
    _vigOverlay = _createLayer('se-vignette-flash', 181,
      'box-shadow:inset 0 0 80px 30px rgba(200,0,0,0.55);opacity:0;transition:opacity 0.08s;');

    // Near-death grey desaturation overlay
    _desatOverlay = _createLayer('se-desat-overlay', 180,
      'background:rgba(30,30,30,0.6);opacity:0;filter:grayscale(1);transition:opacity 0.3s;');

    // Hook HUD.setHealth
    var _hookAttempts = 0;
    function _tryHook() {
      if (typeof window.HUD !== 'undefined' && typeof HUD.setHealth === 'function') {
        var _origSH = HUD.setHealth.bind(HUD);
        HUD.setHealth = function (hp, maxHp) {
          _origSH(hp, maxHp);
          _onHealthSet(hp, maxHp);
        };
      } else if (_hookAttempts++ < 30) {
        setTimeout(_tryHook, 200);
      }
    }
    _tryHook();

    // Start render loop
    _lastTs = performance.now();
    _raf = requestAnimationFrame(_tick);
  }

  function fadeCrack() {
    if (_crackFadeTimer > 0) {
      _crackFadeTimer = Math.min(_crackFadeTimer, 0.5); // fade quickly on vehicle exit
    }
  }

  return {
    init:         init,
    triggerEMP:   triggerEMP,
    fadeCrack:    fadeCrack,
    _onHealthSet: _onHealthSet,
  };
})();

window.ScreenEffects = ScreenEffects;
// Auto-init once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { ScreenEffects.init(); });
} else {
  ScreenEffects.init();
}
