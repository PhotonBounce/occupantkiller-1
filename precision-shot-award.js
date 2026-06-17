/* ============================================================
 *  PRECISION-SHOT-AWARD.JS — Elite kill awards (passive)
 *
 *  Grants a brief text award for special kill circumstances:
 *
 *    "SNIPER NEUTRALIZED"   — killed a SNIPER type
 *    "EXTREME RANGE KILL"   — killed enemy >80 world units away
 *    "LONG RANGE KILL"      — killed enemy >50 units away
 *    "EXECUTIONER"          — killed HEAVY, TANK, or MECH
 *    "MECH DESTROYED"       — killed a MECH specifically
 *
 *  Only the highest-priority award fires per kill.
 *  Award slides in from the right at top:35% center, holds 2.0s, fades.
 *
 *  CSS-only. z-index 458. Passive — no keybind.
 * ============================================================ */
var PrecisionShotAward = (function () {
  'use strict';

  var SHOW_TIME = 2.0;
  var QUEUE_MAX = 3;
  var STAGGER   = 0.35;

  var _el      = null;
  var _init    = false;
  var _seen    = new WeakSet();
  var _prevHp  = new WeakMap();
  var _queue   = [];
  var _showing = false;
  var _lastTs  = 0;
  var _frameN  = 0;

  var AWARDS = [
    { cond: function (e, dist) { return (e.type || '').toUpperCase() === 'MECH'; },                           label: 'MECH DESTROYED',     col: 'rgba(255,80,220,1)' },
    { cond: function (e, dist) { return (e.type || '').toUpperCase() === 'SNIPER'; },                         label: 'SNIPER NEUTRALIZED', col: 'rgba(255,80,80,1)'  },
    { cond: function (e, dist) { return dist > 80; },                                                         label: 'EXTREME RANGE KILL', col: 'rgba(255,200,50,1)' },
    { cond: function (e, dist) { return dist > 50; },                                                         label: 'LONG RANGE KILL',    col: 'rgba(200,200,200,1)'},
    { cond: function (e, dist) { var t=(e.type||'').toUpperCase(); return t==='HEAVY'||t==='TANK'; },          label: 'EXECUTIONER',        col: 'rgba(255,130,40,1)' },
  ];

  function _buildStyle() {
    var style = document.createElement('style');
    style.textContent = [
      '@keyframes psaSlide{',
        '0%{opacity:0;transform:translateX(60%)}',
        '12%{opacity:1;transform:translateX(0)}',
        '75%{opacity:1;transform:translateX(0)}',
        '100%{opacity:0;transform:translateX(20%)}',
      '}',
      '#psa-bar{',
        'position:fixed;right:20px;top:35%;',
        'font-family:"Courier New",monospace;',
        'font-size:10px;font-weight:bold;letter-spacing:3px;',
        'padding:5px 14px;',
        'background:rgba(0,4,8,0.72);',
        'border-right:2px solid currentColor;',
        'border-radius:2px;',
        'pointer-events:none;z-index:458;',
        'display:none;white-space:nowrap;',
      '}',
    ].join('');
    document.head.appendChild(style);
  }

  function _buildDom() {
    _el = document.createElement('div');
    _el.id = 'psa-bar';
    document.body.appendChild(_el);
  }

  function _showNext() {
    if (_showing || _queue.length === 0 || !_el) return;
    _showing = true;
    var item = _queue.shift();
    _el.textContent = item.label;
    _el.style.color = item.col;
    _el.style.display = 'block';
    _el.style.animation = 'none';
    void _el.offsetWidth;
    _el.style.animation = 'psaSlide ' + SHOW_TIME + 's ease forwards';
    var el = _el;
    setTimeout(function () {
      if (el) el.style.display = 'none';
      _showing = false;
      if (_queue.length > 0) setTimeout(_showNext, STAGGER * 1000);
    }, SHOW_TIME * 1000);
  }

  function _distToPlayer(e) {
    try {
      if (!window.player || !window.player.position) return 0;
      var p = window.player.position;
      var dx = e.mesh.position.x - p.x;
      var dz = e.mesh.position.z - p.z;
      return Math.sqrt(dx*dx + dz*dz);
    } catch (er) { return 0; }
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    if (_frameN % 2 === 0) {
      try {
        if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
        var all = Enemies.getAll();
        for (var i = 0; i < all.length; i++) {
          var e = all[i];
          if (!e || !e.mesh) continue;
          var cur  = e.hp !== undefined ? e.hp : null;
          if (cur === null) continue;
          var prev = _prevHp.has(e) ? _prevHp.get(e) : cur;
          if (cur <= 0 && prev > 0 && !_seen.has(e)) {
            _seen.add(e);
            var dist = _distToPlayer(e);
            for (var k = 0; k < AWARDS.length; k++) {
              if (AWARDS[k].cond(e, dist)) {
                if (_queue.length < QUEUE_MAX) _queue.push(AWARDS[k]);
                if (!_showing) _showNext();
                break;
              }
            }
          }
          _prevHp.set(e, cur);
        }
      } catch (er) {}
    }
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildStyle();
    _buildDom();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.PrecisionShotAward = PrecisionShotAward;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { PrecisionShotAward.init(); });
} else {
  PrecisionShotAward.init();
}