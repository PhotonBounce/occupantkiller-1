/* ============================================================
 *  HIT-MARKER.JS — Crosshair hit feedback (passive)
 *
 *  WeakMap HP tracking every frame. On any enemy HP drop:
 *  flash a 4-line X hit marker at screen center for 0.14s.
 *  White = normal hit. Red + larger = kill.
 *  Uses CSS animation — zero canvas overhead.
 * ============================================================ */
var HitMarker = (function () {
  'use strict';

  var _prevHp  = new WeakMap();
  var _init    = false;
  var _lastTs  = 0;
  var _frameN  = 0;
  var _el      = null;
  var _timer   = 0;
  var _isKill  = false;
  var _style   = null;

  function _buildStyle() {
    _style = document.createElement('style');
    _style.textContent = [
      '@keyframes hmFlash{0%{opacity:1}100%{opacity:0}}',
      '#hit-marker{',
        'position:fixed;top:50%;left:50%;',
        'transform:translate(-50%,-50%);',
        'width:20px;height:20px;',
        'pointer-events:none;z-index:450;',
        'opacity:0;',
      '}',
      '#hit-marker .hm-line{',
        'position:absolute;background:currentColor;',
        'border-radius:1px;',
      '}',
      /* Horizontal segments — left and right of gap */
      '#hit-marker .hm-h1{width:6px;height:2px;top:9px;left:0;}',
      '#hit-marker .hm-h2{width:6px;height:2px;top:9px;right:0;}',
      /* Vertical segments — top and bottom */
      '#hit-marker .hm-v1{width:2px;height:6px;left:9px;top:0;}',
      '#hit-marker .hm-v2{width:2px;height:6px;left:9px;bottom:0;}',
      '#hit-marker.active{animation:hmFlash 0.14s ease-out forwards;}',
      '#hit-marker.kill{color:#ff3333;width:24px;height:24px;}',
      '#hit-marker.kill .hm-h1{width:7px;top:11px;}',
      '#hit-marker.kill .hm-h2{width:7px;top:11px;}',
      '#hit-marker.kill .hm-v1{height:7px;left:11px;}',
      '#hit-marker.kill .hm-v2{height:7px;left:11px;}',
    ].join('');
    document.head.appendChild(_style);
  }

  function _buildEl() {
    _el = document.createElement('div');
    _el.id = 'hit-marker';
    _el.innerHTML = '<div class="hm-line hm-h1"></div><div class="hm-line hm-h2"></div><div class="hm-line hm-v1"></div><div class="hm-line hm-v2"></div>';
    document.body.appendChild(_el);
  }

  function _flash(kill) {
    if (!_el) return;
    _el.classList.remove('active', 'kill');
    void _el.offsetWidth;
    _el.style.color = kill ? '#ff3333' : '#ffffff';
    if (kill) _el.classList.add('kill');
    _el.classList.add('active');
    _timer = 0.14;
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt  = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    _frameN++;
    if (_frameN % 2 !== 0) return;

    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
      var all = Enemies.getAll();
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || !e.mesh) continue;
        var cur  = e.hp !== undefined ? e.hp : null;
        if (cur === null) continue;
        var prev = _prevHp.has(e) ? _prevHp.get(e) : cur;
        if (prev - cur >= 1) {
          var kill = cur <= 0 && prev > 0;
          _flash(kill);
        }
        _prevHp.set(e, cur);
      }
    } catch (err) {}
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildStyle();
    _buildEl();
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