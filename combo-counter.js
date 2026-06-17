/* ============================================================
 *  COMBO-COUNTER.JS — Kill combo multiplier (passive)
 *
 *  Tracks rapid kill events. Each kill increments combo.
 *  If no kill within DECAY_TIME seconds, combo resets to 0.
 *
 *  Shows "×N" in large text right-center of screen.
 *  Color escalates: ×2=gold, ×4=orange, ×6=red, ×8+=purple.
 *  On reset: shrinks + fades to 0.
 *  On new max: brief scale pulse.
 *
 *  Combos ≥ 2 display; combos of 1 don't show (not a combo yet).
 * ============================================================ */
var ComboCounter = (function () {
  'use strict';

  var DECAY_TIME  = 2.0;   /* seconds without a kill = reset */

  var _prevHp    = new WeakMap();
  var _counted   = new WeakSet();
  var _combo     = 0;
  var _lastKill  = -999;
  var _maxCombo  = 0;
  var _init      = false;
  var _lastTs    = 0;
  var _frameN    = 0;

  var _el        = null;
  var _barEl     = null;   /* decay bar below the multiplier */
  var _style     = null;
  var _showing   = false;

  var COLORS = [
    { min: 2, color: '#ffdd44', shadow: 'rgba(255,220,0,0.7)' },
    { min: 4, color: '#ff8800', shadow: 'rgba(255,130,0,0.7)' },
    { min: 6, color: '#ff3300', shadow: 'rgba(255,50,0,0.8)'  },
    { min: 8, color: '#dd00ff', shadow: 'rgba(200,0,255,0.8)' },
  ];

  function _colorFor(n) {
    for (var i = COLORS.length - 1; i >= 0; i--) {
      if (n >= COLORS[i].min) return COLORS[i];
    }
    return COLORS[0];
  }

  function _buildStyle() {
    _style = document.createElement('style');
    _style.textContent = [
      '@keyframes ccPop{',
        '0%{transform:translate(-50%,-50%) scale(1.4)}',
        '40%{transform:translate(-50%,-50%) scale(0.95)}',
        '100%{transform:translate(-50%,-50%) scale(1.0)}',
      '}',
      '@keyframes ccFade{',
        '0%{opacity:1}',
        '100%{opacity:0;transform:translate(-50%,-50%) scale(0.5)}',
      '}',
      '#cc-wrap{',
        'position:fixed;right:200px;top:50%;',
        'transform:translate(0,-50%);',
        'pointer-events:none;z-index:428;',
        'text-align:right;',
        'display:none;',
      '}',
      '#cc-label{',
        'font-family:"Courier New",monospace;font-weight:900;',
        'font-size:40px;letter-spacing:0.05em;',
        'text-shadow:0 0 22px currentColor;',
        'transition:color 0.2s;',
        'white-space:nowrap;',
      '}',
      '#cc-sub{',
        'font-family:"Courier New",monospace;font-size:9px;',
        'color:rgba(255,255,255,0.5);letter-spacing:2px;',
        'text-align:right;margin-top:2px;',
      '}',
      '#cc-bar-bg{',
        'height:3px;border-radius:2px;',
        'background:rgba(255,255,255,0.2);margin-top:5px;',
      '}',
      '#cc-bar-fill{',
        'height:100%;border-radius:2px;',
        'transition:width 0.05s linear, background 0.2s;',
      '}',
    ].join('');
    document.head.appendChild(_style);
  }

  function _buildDom() {
    _el = document.createElement('div');
    _el.id = 'cc-wrap';

    var lbl = document.createElement('div');
    lbl.id  = 'cc-label';
    lbl.textContent = '×2';

    var sub = document.createElement('div');
    sub.id  = 'cc-sub';
    sub.textContent = 'COMBO';

    var barBg = document.createElement('div');
    barBg.id = 'cc-bar-bg';
    _barEl = document.createElement('div');
    _barEl.id = 'cc-bar-fill';
    barBg.appendChild(_barEl);

    _el.appendChild(lbl);
    _el.appendChild(sub);
    _el.appendChild(barBg);
    document.body.appendChild(_el);
  }

  function _show(combo, isNew) {
    if (!_el) return;
    var lbl = document.getElementById('cc-label');
    if (!lbl) return;

    var c = _colorFor(combo);
    lbl.textContent  = '×' + combo;
    lbl.style.color  = c.color;
    lbl.style.textShadow = '0 0 22px ' + c.shadow;
    if (_barEl) _barEl.style.background = c.color;

    _el.style.display = 'block';
    if (isNew) {
      lbl.style.animation = 'none';
      void lbl.offsetWidth;
      lbl.style.animation = 'ccPop 0.20s ease-out forwards';
    }
    _showing = true;
  }

  function _hide() {
    if (!_el || !_showing) return;
    var lbl = document.getElementById('cc-label');
    if (lbl) {
      lbl.style.animation = 'none';
      void lbl.offsetWidth;
      lbl.style.animation = 'ccFade 0.35s ease-out forwards';
    }
    setTimeout(function () { if (_el) _el.style.display = 'none'; }, 380);
    _showing = false;
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt  = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    var now = ts / 1000;

    /* Decay bar */
    if (_combo >= 2 && _showing && _barEl) {
      var remaining = Math.max(0, 1 - (now - _lastKill) / DECAY_TIME);
      _barEl.style.width = (remaining * 100) + '%';
    }

    /* Decay reset */
    if (_combo >= 2 && now - _lastKill > DECAY_TIME) {
      _combo = 0;
      _hide();
    }

    /* Kill scan every 2 frames */
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
        if (cur <= 0 && prev > 0 && !_counted.has(e)) {
          _counted.add(e);
          _combo++;
          _lastKill = now;
          if (_combo > _maxCombo) _maxCombo = _combo;
          if (_combo >= 2) _show(_combo, true);
        }
        _prevHp.set(e, cur);
      }
    } catch (err) {}
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

window.ComboCounter = ComboCounter;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { ComboCounter.init(); });
} else {
  ComboCounter.init();
}