/* ============================================================
 *  HIT-MARKER.JS — Classic ×-shape hit confirmation (passive)
 *
 *  Fires a brief × graphic at screen center whenever a shot connects
 *  with an enemy (enemy HP drops within HIT_WINDOW of a shot event).
 *  Separate from the kill-flash in dynamic-crosshair.
 *
 *  - Regular hit: white × (size 10px arms), 0.22s lifetime
 *  - Kill shot:   red   × (size 14px arms), 0.30s lifetime
 *  - Max 3 simultaneous markers (oldest evicted)
 *  - Markers at screen center ± tiny jitter so stacked shots are readable
 *  - No keybind needed — fully passive.
 * ============================================================ */
var HitMarker = (function () {
  'use strict';

  var HIT_WINDOW   = 0.28;   /* seconds after shot to credit a hit */
  var HIT_LIFE     = 0.22;   /* seconds a hit marker lives */
  var KILL_LIFE    = 0.30;
  var ARM_LEN      = 10;
  var KILL_ARM     = 14;
  var MAX_MARKERS  = 3;

  var _canvas   = null;
  var _ctx      = null;
  var _init     = false;
  var _frameN   = 0;
  var _lastTs   = 0;

  var _prevHp   = new WeakMap();
  var _counted  = new WeakSet();
  var _prevClip = null;
  var _lastShotT = -999;

  var _markers  = [];   /* [{x,y,life,total,kill}] */

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = [
      'position:fixed;top:0;left:0;',
      'width:100%;height:100%;',
      'pointer-events:none;z-index:451;',   /* just above dynamic-crosshair (450) */
    ].join('');
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

  function _spawnMarker(isKill) {
    /* Jitter so rapid stacked hits are still readable */
    var jitter = 3;
    var cx = _canvas.width  / 2 + (Math.random() - 0.5) * jitter;
    var cy = _canvas.height / 2 + (Math.random() - 0.5) * jitter;
    var total = isKill ? KILL_LIFE : HIT_LIFE;
    _markers.push({ x: cx, y: cy, life: total, total: total, kill: isKill });
    if (_markers.length > MAX_MARKERS) _markers.shift();
  }

  function _drawMarker(m) {
    var t     = m.life / m.total;          /* 1 = fresh, 0 = done */
    var alpha = t * (m.kill ? 0.92 : 0.78);
    var arm   = m.kill ? KILL_ARM : ARM_LEN;
    var col   = m.kill ? 'rgba(255,60,60,' : 'rgba(255,255,255,';

    var ctx = _ctx;
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.strokeStyle = col + alpha.toFixed(2) + ')';
    ctx.lineWidth   = m.kill ? 2.2 : 1.6;
    ctx.lineCap     = 'round';
    ctx.shadowColor = col + '0.6)';
    ctx.shadowBlur  = m.kill ? 8 : 4;

    /* × — two diagonal lines */
    ctx.beginPath();
    ctx.moveTo(-arm, -arm); ctx.lineTo(arm, arm);
    ctx.moveTo( arm, -arm); ctx.lineTo(-arm, arm);
    ctx.stroke();
    ctx.restore();
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt  = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    var now = ts / 1000;

    /* Shot detection */
    try {
      if (typeof Weapons !== 'undefined' && Weapons.getState) {
        var st = Weapons.getState();
        var isMelee = (typeof Weapons.getCurrentType === 'function'
          && (Weapons.getCurrentType() || '').toUpperCase().indexOf('MELEE') >= 0);
        if (!isMelee && st && _prevClip !== null && st.clip < _prevClip) {
          var shots = _prevClip - st.clip;
          if (shots >= 1 && shots <= 5) _lastShotT = now;
        }
        _prevClip = st ? st.clip : _prevClip;
      }
    } catch (e) {}

    /* Hit/kill detection (every 2nd frame) */
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

            if (prev > cur) {
              /* HP dropped — check if it was a shot we fired */
              if (now - _lastShotT <= HIT_WINDOW) {
                var isKill = (cur <= 0 && !_counted.has(e));
                if (isKill) _counted.add(e);
                _spawnMarker(isKill);
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

    for (var j = _markers.length - 1; j >= 0; j--) {
      var m = _markers[j];
      m.life -= dt;
      if (m.life <= 0) { _markers.splice(j, 1); continue; }
      _drawMarker(m);
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

window.HitMarker = HitMarker;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { HitMarker.init(); });
} else {
  HitMarker.init();
}