/* ============================================================
 *  XP-POPUP.JS — RPG-style kill reward popups (passive)
 *
 *  On each kill, a "+XP THREAT NEUTRALIZED" style label pops up
 *  near screen center (slightly randomised), drifts upward and fades.
 *
 *  XP values by enemy type:
 *    SNIPER/WAGNER/SPETSNAZ → +200  (elite)
 *    HEAVY/TANK/MECH        → +150  (armoured)
 *    ENGINEER/STORMER       → +75   (standard+)
 *    CONSCRIPT (default)    → +50
 *
 *  Bonus multipliers:
 *    Combo ≥ 5  → +COMBO BONUS label (gold)
 *    Combo ≥ 10 → +STREAK text appears too
 *
 *  Max 8 simultaneous popups. Canvas z-index 456.
 *  Passive — no keybind.
 * ============================================================ */
var XpPopup = (function () {
  'use strict';

  var MAX_POPUPS = 8;
  var LIFE       = 1.0;   /* seconds */
  var DRIFT      = -38;   /* px/s upward */
  var JITTER_X   = 60;
  var JITTER_Y   = 30;

  var XP_VALUES = {
    SNIPER:    200, WAGNER: 200, SPETSNAZ: 200,
    HEAVY:     150, TANK:   150, MECH:      150,
    ENGINEER:  75,  STORMER: 75,
  };
  var DEFAULT_XP = 50;

  var _canvas  = null;
  var _ctx     = null;
  var _init    = false;
  var _lastTs  = 0;
  var _frameN  = 0;
  var _popups  = [];

  var _prevHp  = new WeakMap();
  var _counted = new WeakSet();

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:456;';
    document.body.appendChild(_canvas);
    _ctx = _canvas.getContext('2d');
    _resize();
    window.addEventListener('resize', _resize);
  }

  function _resize() {
    if (!_canvas) return;
    _canvas.width  = window.innerWidth;
    _canvas.height = window.innerHeight;
  }

  function _getCombo() {
    try {
      var lbl = document.getElementById('cc-label');
      if (lbl) {
        var n = parseInt((lbl.textContent || '').replace('×', '').replace('x', ''), 10);
        if (!isNaN(n) && n >= 2) return n;
      }
    } catch (e) {}
    return 0;
  }

  function _spawn(enemyType) {
    if (_popups.length >= MAX_POPUPS) _popups.shift();

    var xp = XP_VALUES[(enemyType || '').toUpperCase()] || DEFAULT_XP;
    var combo = _getCombo();
    if (combo >= 5) xp = Math.round(xp * 1.5);

    var cx = _canvas.width / 2  + (Math.random() - 0.5) * JITTER_X;
    var cy = _canvas.height / 2 + (Math.random() - 0.5) * JITTER_Y;

    var lines = ['+' + xp];
    if (combo >= 10) lines.push('×' + combo + ' STREAK');
    else if (combo >= 5) lines.push('COMBO BONUS');

    _popups.push({
      x: cx, y: cy,
      lines: lines,
      life: LIFE,
      total: LIFE,
      combo: combo,
    });
  }

  function _drawPopup(p) {
    var t = p.life / p.total;
    var alpha = Math.min(1, t * 3) * t;
    var ctx = _ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';

    /* Main XP value */
    var sz = p.combo >= 5 ? 14 : 12;
    ctx.font = 'bold ' + sz + 'px "Courier New",monospace';
    ctx.shadowColor = 'rgba(80,200,80,0.7)';
    ctx.shadowBlur  = 6;
    ctx.fillStyle = p.combo >= 10 ? 'rgba(255,220,50,1)' : (p.combo >= 5 ? 'rgba(255,180,60,1)' : 'rgba(140,230,140,1)');
    ctx.fillText(p.lines[0], p.x, p.y);

    /* Bonus label */
    if (p.lines[1]) {
      ctx.font = '9px "Courier New",monospace';
      ctx.shadowBlur = 4;
      ctx.fillStyle = 'rgba(255,210,50,0.85)';
      ctx.fillText(p.lines[1], p.x, p.y + 14);
    }
    ctx.restore();
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.08, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* Kill detection every 2nd frame */
    if (_frameN % 2 === 0) {
      try {
        if (typeof Enemies !== 'undefined' && Enemies.getAll) {
          var all = Enemies.getAll();
          for (var i = 0; i < all.length; i++) {
            var e = all[i];
            if (!e || !e.mesh) continue;
            var cur  = e.hp !== undefined ? e.hp : null;
            if (cur === null) continue;
            var prev = _prevHp.has(e) ? _prevHp.get(e) : cur;
            if (cur <= 0 && prev > 0 && !_counted.has(e)) {
              _counted.add(e);
              _spawn(e.type || '');
            }
            _prevHp.set(e, cur);
          }
        }
      } catch (er) {}
    }

    /* Render */
    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    for (var j = _popups.length - 1; j >= 0; j--) {
      var p = _popups[j];
      p.life -= dt;
      if (p.life <= 0) { _popups.splice(j, 1); continue; }
      p.y += DRIFT * dt;
      _drawPopup(p);
    }
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildCanvas();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.XpPopup = XpPopup;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { XpPopup.init(); });
} else {
  XpPopup.init();
}