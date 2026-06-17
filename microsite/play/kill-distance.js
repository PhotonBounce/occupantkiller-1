/* ============================================================
 *  KILL-DISTANCE.JS — Longest kill distance tracker (passive)
 *
 *  On each enemy death: computes 3D distance from player.position
 *  to enemy.mesh.position. Tracks session best (localStorage).
 *  Shows "RANGE" in corner; on new record flashes "NEW RECORD Xm".
 *  The last-kill distance also displays briefly (1.8s) as a pop.
 * ============================================================ */
var KillDistance = (function () {
  'use strict';

  var LS_KEY    = 'ok_kill_dist_best_v1';
  var _best     = 0;
  var _prevHp   = new WeakMap();
  var _counted  = new WeakSet();
  var _init     = false;
  var _lastTs   = 0;
  var _frameN   = 0;

  var _distEl   = null;
  var _bestEl   = null;
  var _popEl    = null;
  var _popTimer = null;
  var _style    = null;

  function _loadBest() {
    try { _best = parseFloat(localStorage.getItem(LS_KEY) || '0') || 0; } catch (e) {}
  }

  function _saveBest() {
    try { localStorage.setItem(LS_KEY, String(_best)); } catch (e) {}
  }

  function _buildStyle() {
    _style = document.createElement('style');
    _style.textContent = [
      '#kd-wrap{',
        'position:fixed;top:240px;left:20px;',   /* below accuracy-tracker */
        'pointer-events:none;z-index:370;',
        'font-family:"Courier New",monospace;',
      '}',
      '#kd-label{font-size:9px;color:rgba(150,220,150,0.55);letter-spacing:1px;text-transform:uppercase;}',
      '#kd-dist{font-size:18px;font-weight:bold;color:rgba(150,220,150,0.9);letter-spacing:2px;}',
      '#kd-best{font-size:9px;color:rgba(100,180,100,0.55);letter-spacing:1px;}',
      '@keyframes kdPop{',
        '0%{opacity:0;transform:translateX(-50%) scale(0.7)}',
        '18%{opacity:1;transform:translateX(-50%) scale(1.08)}',
        '60%{opacity:1}',
        '100%{opacity:0;transform:translateX(-50%) scale(0.9)}',
      '}',
      '#kd-pop{',
        'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);',
        'font-family:"Courier New",monospace;font-weight:bold;font-size:14px;',
        'pointer-events:none;z-index:436;',
        'white-space:nowrap;text-shadow:0 0 10px currentColor;',
        'display:none;',
      '}',
    ].join('');
    document.head.appendChild(_style);
  }

  function _buildDom() {
    var wrap = document.createElement('div');
    wrap.id  = 'kd-wrap';

    var lbl  = document.createElement('div');
    lbl.id   = 'kd-label';
    lbl.textContent = 'RANGE';

    _distEl  = document.createElement('div');
    _distEl.id = 'kd-dist';
    _distEl.textContent = '—m';

    _bestEl  = document.createElement('div');
    _bestEl.id = 'kd-best';
    _bestEl.textContent = _best > 0 ? 'BEST ' + _best.toFixed(0) + 'm' : 'BEST —';

    wrap.appendChild(lbl);
    wrap.appendChild(_distEl);
    wrap.appendChild(_bestEl);
    document.body.appendChild(wrap);

    _popEl  = document.createElement('div');
    _popEl.id = 'kd-pop';
    document.body.appendChild(_popEl);
  }

  function _showPop(text, color, isRecord) {
    if (!_popEl) return;
    if (_popTimer) { clearTimeout(_popTimer); _popTimer = null; }
    _popEl.textContent = text;
    _popEl.style.color = color;
    _popEl.style.display = 'block';
    _popEl.style.animation = 'none';
    void _popEl.offsetWidth;
    _popEl.style.animation = 'kdPop ' + (isRecord ? 2.5 : 1.8) + 's ease-out forwards';
    _popTimer = setTimeout(function () { if (_popEl) _popEl.style.display = 'none'; }, isRecord ? 2600 : 1900);
  }

  function _onKill(dist) {
    /* Update RANGE display with brief decay — show last kill dist */
    if (_distEl) _distEl.textContent = dist.toFixed(0) + 'm';

    var isRecord = dist > _best;
    if (isRecord) {
      _best = dist;
      _saveBest();
      if (_bestEl) _bestEl.textContent = 'BEST ' + _best.toFixed(0) + 'm';
      _showPop('NEW RECORD ' + dist.toFixed(0) + 'm', '#ffdd44', true);
    } else {
      _showPop(dist.toFixed(0) + 'm', '#88cc88', false);
    }
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    if (_frameN % 2 !== 0) return;
    _lastTs = ts;

    var px = 0, py = 0, pz = 0;
    try {
      if (window.player && window.player.position) {
        px = window.player.position.x;
        py = window.player.position.y;
        pz = window.player.position.z;
      }
    } catch (e) {}

    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
      var all = Enemies.getAll();
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || !e.mesh) continue;
        var cur  = e.hp !== undefined ? e.hp : null;
        if (cur === null) continue;
        var prev = _prevHp.has(e) ? _prevHp.get(e) : cur;
        if (cur <= 0 && prev > 0 && !_counted.has(e)) {
          _counted.add(e);
          var dx = e.mesh.position.x - px;
          var dy = e.mesh.position.y - py;
          var dz = e.mesh.position.z - pz;
          var dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
          _onKill(dist);
        }
        _prevHp.set(e, cur);
      }
    } catch (err) {}
  }

  function init() {
    if (_init) return;
    _init = true;
    _loadBest();
    _buildStyle();
    _buildDom();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.KillDistance = KillDistance;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { KillDistance.init(); });
} else {
  KillDistance.init();
}