/* ============================================================
 *  TACTICAL-HUD-FRAME.JS — Corner bracket overlay (passive)
 *
 *  Draws faint L-shaped corner brackets at all 4 screen corners,
 *  giving the HUD a military tactical / heads-up display aesthetic.
 *
 *  Brackets pulse very slowly (0.2Hz) between dim and slightly brighter.
 *  During combat (recent kill or HP loss) brackets briefly sharpen.
 *  On wave clear: all 4 brackets glow green for 1.5s.
 *
 *  CSS-only implementation — a single fixed-position div with
 *  4 pseudo-element-style child divs using border tricks.
 *  z-index 360. Passive — no keybind.
 * ============================================================ */
var TacticalHudFrame = (function () {
  'use strict';

  var CORNER_LEN = 28;   /* px, arm length */
  var CORNER_W   = 2;    /* px, stroke */
  var PULSE_HZ   = 0.2;

  var _corners   = [];
  var _init      = false;
  var _lastTs    = 0;
  var _phase     = 0;
  var _alertT    = 0;    /* seconds of combat alert remaining */
  var _waveWas   = -1;
  var _clearT    = 0;    /* seconds of wave-clear glow remaining */
  var _frameN    = 0;

  var _prevHp    = new WeakMap();
  var _counted   = new WeakSet();
  var _prevPHp   = null;

  /* Corner positions: top-left, top-right, bottom-right, bottom-left */
  var POSITIONS = [
    { top: '0',    left:  '0',    right: '',     bottom: '',    bTop: true,  bLeft: true,  bRight: false, bBot: false },
    { top: '0',    left:  '',     right: '0',    bottom: '',    bTop: true,  bLeft: false, bRight: true,  bBot: false },
    { top: '',     left:  '',     right: '0',    bottom: '0',   bTop: false, bLeft: false, bRight: true,  bBot: true  },
    { top: '',     left:  '0',    right: '',     bottom: '0',   bTop: false, bLeft: true,  bRight: false, bBot: true  },
  ];

  function _buildStyle() {
    var style = document.createElement('style');
    style.textContent = [
      '.tac-corner{',
        'position:fixed;pointer-events:none;z-index:360;',
        'width:' + CORNER_LEN + 'px;',
        'height:' + CORNER_LEN + 'px;',
        'border:' + CORNER_W + 'px solid rgba(0,200,255,0.25);',
        'transition:border-color 0.4s ease;',
      '}',
    ].join('');
    document.head.appendChild(style);
  }

  function _buildDom() {
    POSITIONS.forEach(function (p, idx) {
      var el = document.createElement('div');
      el.className = 'tac-corner';
      if (p.top    !== '') el.style.top    = p.top    === '0' ? '12px' : p.top;
      if (p.left   !== '') el.style.left   = p.left   === '0' ? '12px' : p.left;
      if (p.right  !== '') el.style.right  = p.right  === '0' ? '12px' : p.right;
      if (p.bottom !== '') el.style.bottom = p.bottom === '0' ? '12px' : p.bottom;
      /* Hide borders we don't want */
      if (!p.bTop)  el.style.borderTop    = 'none';
      if (!p.bLeft) el.style.borderLeft   = 'none';
      if (!p.bRight) el.style.borderRight = 'none';
      if (!p.bBot)  el.style.borderBottom = 'none';
      document.body.appendChild(el);
      _corners.push(el);
    });
  }

  function _setColor(r, g, b, a) {
    var c = 'rgba(' + r + ',' + g + ',' + b + ',' + a.toFixed(2) + ')';
    _corners.forEach(function (el) {
      el.style.borderColor = c;
    });
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    _phase += PULSE_HZ * Math.PI * 2 * dt;

    /* Combat detection */
    if (_frameN % 3 === 0) {
      try {
        if (typeof Enemies !== 'undefined' && Enemies.getAll) {
          var all = Enemies.getAll();
          for (var i = 0; i < all.length; i++) {
            var e = all[i];
            if (!e || !e.mesh) continue;
            var cur  = e.hp !== undefined ? e.hp : null;
            if (cur === null) continue;
            var prev = _prevHp.has(e) ? _prevHp.get(e) : cur;
            if (cur <= 0 && prev > 0 && !_counted.has(e)) { _counted.add(e); _alertT = 0.6; }
            _prevHp.set(e, cur);
          }
        }
      } catch (er) {}

      try {
        if (window.player && window.player.hp !== undefined) {
          var php = window.player.hp;
          if (_prevPHp !== null && _prevPHp > php) _alertT = 1.0;
          _prevPHp = php;
        }
      } catch (e) {}

      /* Wave clear detection */
      try {
        if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
          var w = GameManager.getCurrentWave();
          if (_waveWas > 0 && w > _waveWas) _clearT = 1.5;
          _waveWas = w;
        }
      } catch (e) {}
    }

    if (_alertT > 0) _alertT = Math.max(0, _alertT - dt);
    if (_clearT > 0) _clearT = Math.max(0, _clearT - dt);

    /* Colour */
    var pulse = (Math.sin(_phase) * 0.5 + 0.5);
    var baseA = 0.12 + pulse * 0.06;

    if (_clearT > 0) {
      var ct = _clearT / 1.5;
      _setColor(40, 255, 80, baseA + ct * 0.45);
    } else if (_alertT > 0) {
      var at = _alertT;
      _setColor(255, 80, 80, baseA + at * 0.3);
    } else {
      _setColor(0, 200, 255, baseA);
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

window.TacticalHudFrame = TacticalHudFrame;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { TacticalHudFrame.init(); });
} else {
  TacticalHudFrame.init();
}