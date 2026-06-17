/* ============================================================
 *  BOSS-WARNING.JS — High-threat enemy spawn alert (passive)
 *
 *  When a TANK, MECH, HEAVY, SPETSNAZ, or WAGNER enemy appears
 *  for the first time in a wave, shows a brief alert:
 *
 *    "⚠ HEAVY CONTACT DETECTED"  — red/orange, 2.5s
 *
 *  Tracks enemies via WeakSet so each hostile triggers at most once.
 *  Alerts queue (max 3) and show in sequence with 0.4s stagger.
 *
 *  CSS-only. z-index 497 (just below wave-intro-card 498). Passive.
 * ============================================================ */
var BossWarning = (function () {
  'use strict';

  var BOSS_TYPES = { TANK:1, MECH:1, HEAVY:1, SPETSNAZ:1, WAGNER:1 };
  var SHOW_TIME  = 2.5;
  var STAGGER    = 0.5;

  var _el      = null;
  var _style   = null;
  var _init    = false;
  var _seen    = new WeakSet();
  var _queue   = [];     /* pending label strings */
  var _showing = false;
  var _lastTs  = 0;
  var _frameN  = 0;
  var _waveWas = -1;
  var _prevKnown = new Set();

  function _buildStyle() {
    _style = document.createElement('style');
    _style.textContent = [
      '@keyframes bwFlash{',
        '0%{opacity:0;transform:translate(-50%,-50%) scale(0.85)}',
        '15%{opacity:1;transform:translate(-50%,-50%) scale(1.0)}',
        '80%{opacity:1}',
        '100%{opacity:0;transform:translate(-50%,-50%) scale(0.95)}',
      '}',
      '#bw-wrap{',
        'position:fixed;top:38%;left:50%;',
        'transform:translate(-50%,-50%);',
        'font-family:"Courier New",monospace;',
        'font-size:13px;font-weight:bold;',
        'letter-spacing:4px;',
        'color:rgba(255,120,40,1);',
        'text-shadow:0 0 20px rgba(255,80,0,0.9);',
        'background:rgba(30,4,0,0.75);',
        'border:1px solid rgba(255,80,0,0.35);',
        'border-radius:3px;',
        'padding:8px 22px 8px;',
        'pointer-events:none;z-index:497;',
        'display:none;white-space:nowrap;',
      '}',
    ].join('');
    document.head.appendChild(_style);
  }

  function _buildDom() {
    _el = document.createElement('div');
    _el.id = 'bw-wrap';
    document.body.appendChild(_el);
  }

  function _showNext() {
    if (_showing || _queue.length === 0 || !_el) return;
    _showing = true;
    var msg = _queue.shift();
    _el.textContent = msg;
    _el.style.display = 'block';
    _el.style.animation = 'none';
    void _el.offsetWidth;
    _el.style.animation = 'bwFlash ' + SHOW_TIME + 's ease forwards';
    var el = _el;
    setTimeout(function () {
      if (el) el.style.display = 'none';
      _showing = false;
      if (_queue.length > 0) setTimeout(_showNext, STAGGER * 1000);
    }, SHOW_TIME * 1000);
  }

  function _queueAlert(type) {
    var label = '⚠  ' + type.toUpperCase() + ' DETECTED';
    if (_queue.length < 3) _queue.push(label);
    if (!_showing) _showNext();
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    if (_frameN % 4 !== 0) return;

    /* Reset on new wave */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (w !== _waveWas) { _waveWas = w; _seen = new WeakSet(); _prevKnown = new Set(); }
      }
    } catch (e) {}

    /* Check for new boss-type enemies */
    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
      var all = Enemies.getAll();
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || !e.mesh) continue;
        if (e.hp !== undefined && e.hp <= 0) continue;
        if (!BOSS_TYPES[(e.type || '').toUpperCase()]) continue;
        if (_seen.has(e)) continue;
        _seen.add(e);
        _queueAlert(e.type);
      }
    } catch (er) {}
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

window.BossWarning = BossWarning;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { BossWarning.init(); });
} else {
  BossWarning.init();
}