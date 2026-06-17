/* ============================================================
 *  STATS-OVERLAY.JS — Compact live performance stats (passive)
 *
 *  Compact readout at bottom-right corner (above radar-minimap).
 *  Updates every second. Shows:
 *
 *    FPS     — rolling 60-frame average
 *    TIME    — session elapsed time MM:SS
 *    KILLS   — session total (from sessionStorage ok_session_kills)
 *    BEST D  — best kill distance (from localStorage ok_kill_dist_best_v1)
 *    AVG ACC — running accuracy this session
 *
 *  Toggle visibility with F1 key (show/hide).
 *  Default: visible. Very low opacity at rest.
 *  z-index 362 (below radar 380).
 * ============================================================ */
var StatsOverlay = (function () {
  'use strict';

  var UPDATE_INTERVAL = 1.0;  /* seconds */

  var _init    = false;
  var _frameN  = 0;
  var _lastTs  = 0;
  var _nextUpdate = 0;
  var _startT  = 0;

  /* FPS tracking */
  var _fpsFrameTimes = [];
  var _lastFt = 0;

  /* Session accuracy */
  var _shots   = 0;
  var _hits    = 0;
  var _prevClip = null;
  var _lastShot = -999;
  var _prevHp   = new WeakMap();

  /* DOM */
  var _el    = null;
  var _rows  = {};
  var _style = null;
  var _visible = true;

  function _buildStyle() {
    _style = document.createElement('style');
    _style.textContent = [
      '#so-wrap{',
        'position:fixed;right:20px;bottom:140px;',
        'font-family:"Courier New",monospace;font-size:7px;',
        'letter-spacing:1px;color:rgba(150,170,150,0.40);',
        'pointer-events:none;z-index:362;',
        'text-align:right;line-height:1.7;',
        'transition:opacity 0.3s;',
      '}',
      '#so-wrap.so-hidden{opacity:0;}',
    ].join('');
    document.head.appendChild(_style);
  }

  function _buildDom() {
    _el = document.createElement('div');
    _el.id = 'so-wrap';

    var lines = ['fps','time','kills','bestd','acc'];
    lines.forEach(function (k) {
      var row = document.createElement('div');
      _el.appendChild(row);
      _rows[k] = row;
    });
    document.body.appendChild(_el);
  }

  function _getStoredKills() {
    try { return parseInt(sessionStorage.getItem('ok_session_kills') || '0', 10) || 0; } catch (e) { return 0; }
  }

  function _getStoredBestDist() {
    try { return parseFloat(localStorage.getItem('ok_kill_dist_best_v1') || '0') || 0; } catch (e) { return 0; }
  }

  function _fmtTime(secs) {
    var m = Math.floor(secs / 60);
    var s = Math.floor(secs % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function _update(now) {
    var fps  = _fpsFrameTimes.length > 0
      ? Math.round(_fpsFrameTimes.length / Math.min(1, (now - _fpsFrameTimes[0]) || 1))
      : 0;
    /* FPS: count frames in last 1s */
    _fpsFrameTimes = _fpsFrameTimes.filter(function (t) { return now - t < 1.0; });
    fps = _fpsFrameTimes.length;

    var elapsed = now - _startT;
    var kills   = _getStoredKills();
    var bestD   = _getStoredBestDist();
    var acc     = _shots > 0 ? Math.round(_hits / _shots * 100) : 0;

    if (_rows.fps)   _rows.fps.textContent   = 'FPS   ' + fps;
    if (_rows.time)  _rows.time.textContent  = 'TIME  ' + _fmtTime(elapsed);
    if (_rows.kills) _rows.kills.textContent = 'KILLS ' + kills;
    if (_rows.bestd) _rows.bestd.textContent = 'BEST  ' + (bestD > 0 ? bestD.toFixed(0) + 'm' : '--');
    if (_rows.acc)   _rows.acc.textContent   = 'ACC   ' + (kills > 0 ? acc + '%' : '--');
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt  = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    var now = ts / 1000;

    /* FPS sample */
    _fpsFrameTimes.push(now);
    if (_fpsFrameTimes.length > 120) _fpsFrameTimes.shift();

    /* Shot tracking */
    if (_frameN % 2 === 0) {
      try {
        if (typeof Weapons !== 'undefined' && Weapons.getState) {
          var st = Weapons.getState();
          var isMelee = (typeof Weapons.getCurrentType === 'function'
            && (Weapons.getCurrentType() || '').toUpperCase().indexOf('MELEE') >= 0);
          if (!isMelee && st && _prevClip !== null && st.clip < _prevClip) {
            var fired = _prevClip - st.clip;
            if (fired >= 1 && fired <= 5) { _shots += fired; _lastShot = now; }
          }
          _prevClip = st ? st.clip : _prevClip;
        }
      } catch (e) {}
      /* Hits */
      try {
        if (typeof Enemies !== 'undefined' && Enemies.getAll && now - _lastShot < 0.3) {
          var all = Enemies.getAll();
          for (var i = 0; i < all.length; i++) {
            var e = all[i];
            if (!e) continue;
            var cur  = e.hp !== undefined ? e.hp : null;
            var prev = _prevHp.has(e) ? _prevHp.get(e) : cur;
            if (cur !== null && prev !== null && prev > cur) _hits++;
            _prevHp.set(e, cur);
          }
        }
      } catch (e) {}
    }

    if (now >= _nextUpdate) {
      _nextUpdate = now + UPDATE_INTERVAL;
      _update(now);
    }
  }

  function init() {
    if (_init) return;
    _init = true;
    _startT = performance.now() / 1000;
    _buildStyle();
    _buildDom();

    /* F1 toggle */
    window.addEventListener('keydown', function (e) {
      if (e.code === 'F1' || e.key === 'F1') {
        e.preventDefault();
        _visible = !_visible;
        if (_el) _el.classList.toggle('so-hidden', !_visible);
      }
    });

    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.StatsOverlay = StatsOverlay;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { StatsOverlay.init(); });
} else {
  StatsOverlay.init();
}