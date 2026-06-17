/* ============================================================
 *  DAMAGE-NUMBERS.JS — Floating damage digits at enemy positions (passive)
 *
 *  Each time an enemy takes a HP hit within 0.35s of the last shot,
 *  a floating number appears at their screen position and drifts up.
 *
 *  Number styles:
 *    Normal hit  → white, 14px, life 0.65s
 *    Crit (>60 dmg) → yellow, 18px, bold, life 0.80s
 *    Kill shot   → "KILL" in red, 16px, life 0.90s
 *
 *  Max 20 simultaneous numbers. Canvas z-index 453 (above hit-marker).
 * ============================================================ */
var DamageNumbers = (function () {
  'use strict';

  var MAX_NUMS   = 20;
  var CRIT_DMG   = 60;
  var DRIFT_VY   = -45;   /* px/s upward drift */
  var JITTER     = 18;    /* horizontal spread px */
  var SHOT_WIN   = 0.35;  /* shot attribution window seconds */

  var _canvas  = null;
  var _ctx     = null;
  var _init    = false;
  var _frameN  = 0;
  var _lastTs  = 0;
  var _cam     = null;
  var _nums    = [];

  var _prevHp  = new WeakMap();
  var _counted = new WeakSet();
  var _prevClip = null;
  var _lastShotT = -999;

  function _getCamera() {
    if (!_cam) {
      try { _cam = (typeof GameManager !== 'undefined' && GameManager.getCamera) ? GameManager.getCamera() : null; } catch (e) {}
    }
    return _cam;
  }

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:453;';
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

  function _projectEnemy(e) {
    var cam = _getCamera();
    if (!cam || typeof THREE === 'undefined') return null;
    try {
      var v = new THREE.Vector3(e.mesh.position.x, e.mesh.position.y + 1.2, e.mesh.position.z);
      v.project(cam);
      if (v.z > 1) return null;
      var sx = (v.x * 0.5 + 0.5) * _canvas.width;
      var sy = (-v.y * 0.5 + 0.5) * _canvas.height;
      if (sx < -60 || sx > _canvas.width + 60 || sy < -60 || sy > _canvas.height + 60) return null;
      return { x: sx, y: sy };
    } catch (e2) { return null; }
  }

  function _spawnNum(x, y, text, style) {
    if (_nums.length >= MAX_NUMS) _nums.shift();
    var life = style === 'kill' ? 0.90 : (style === 'crit' ? 0.80 : 0.65);
    _nums.push({
      x: x + (Math.random() - 0.5) * JITTER,
      y: y,
      vy: DRIFT_VY + (Math.random() - 0.5) * 10,
      text: text,
      style: style,
      life: life,
      total: life,
    });
  }

  function _drawNum(n) {
    var t = n.life / n.total;
    var alpha = t > 0.8 ? 1 : t / 0.8;
    var ctx = _ctx;
    ctx.save();
    ctx.globalAlpha = alpha;

    var sz, col, weight;
    if (n.style === 'kill') {
      sz = 16; col = 'rgba(255,60,60,1)'; weight = 'bold';
    } else if (n.style === 'crit') {
      sz = 18; col = 'rgba(255,210,50,1)'; weight = 'bold';
    } else {
      sz = 14; col = 'rgba(240,240,240,1)'; weight = 'normal';
    }

    ctx.font = weight + ' ' + sz + 'px "Courier New",monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = n.style === 'kill' ? 'rgba(255,0,0,0.7)' : (n.style === 'crit' ? 'rgba(255,180,0,0.7)' : 'rgba(0,0,0,0.8)');
    ctx.shadowBlur = n.style === 'normal' ? 4 : 10;
    ctx.fillStyle = col;
    ctx.fillText(n.text, n.x, n.y);
    ctx.restore();
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.08, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    var now = ts / 1000;

    /* Shot detection */
    if (_frameN % 2 === 0) {
      try {
        if (typeof Weapons !== 'undefined' && Weapons.getState) {
          var st = Weapons.getState();
          var isMelee = (typeof Weapons.getCurrentType === 'function' && (Weapons.getCurrentType() || '').toUpperCase().indexOf('MELEE') >= 0);
          if (!isMelee && st && _prevClip !== null && st.clip < _prevClip) {
            var fired = _prevClip - st.clip;
            if (fired >= 1 && fired <= 5) _lastShotT = now;
          }
          _prevClip = st ? st.clip : _prevClip;
        }
      } catch (e) {}

      /* Enemy HP tracking */
      try {
        if (typeof Enemies !== 'undefined' && Enemies.getAll) {
          var all = Enemies.getAll();
          for (var i = 0; i < all.length; i++) {
            var e = all[i];
            if (!e || !e.mesh) continue;
            var cur  = e.hp !== undefined ? e.hp : null;
            if (cur === null) continue;
            var prev = _prevHp.has(e) ? _prevHp.get(e) : cur;

            if (prev > cur && now - _lastShotT < SHOT_WIN) {
              var dmg = Math.round(prev - cur);
              var sc  = _projectEnemy(e);
              if (sc) {
                if (cur <= 0 && !_counted.has(e)) {
                  _counted.add(e);
                  _spawnNum(sc.x, sc.y, 'KILL', 'kill');
                } else if (dmg >= CRIT_DMG) {
                  _spawnNum(sc.x, sc.y, '' + dmg, 'crit');
                } else if (dmg > 0) {
                  _spawnNum(sc.x, sc.y, '' + dmg, 'normal');
                }
              }
            }
            _prevHp.set(e, cur);
          }
        }
      } catch (er) {}
    }

    /* Render */
    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    for (var j = _nums.length - 1; j >= 0; j--) {
      var n = _nums[j];
      n.life -= dt;
      if (n.life <= 0) { _nums.splice(j, 1); continue; }
      n.y += n.vy * dt;
      _drawNum(n);
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

window.DamageNumbers = DamageNumbers;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { DamageNumbers.init(); });
} else {
  DamageNumbers.init();
}