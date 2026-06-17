/* ============================================================
 *  WAVE-COMPLETE.JS — Wave clear celebration (passive)
 *
 *  Detects wave number increment (getCurrentWave() goes up).
 *  On wave clear: big "WAVE X COMPLETE" splash + kill count stat
 *  + 30 CSS confetti squares rain down briefly.
 *  Tracks kills per wave via WeakSet (same death detection as
 *  kill-feed but own WeakSet so no double-counting clash).
 * ============================================================ */
var WaveComplete = (function () {
  'use strict';

  var _waveWas    = -1;
  var _waveKills  = 0;
  var _waveStart  = 0;
  var _init       = false;
  var _lastTs     = 0;
  var _frameN     = 0;
  var _prevHp     = new WeakMap();
  var _counted    = new WeakSet();
  var _style      = null;
  var _splashEl   = null;
  var _confettiEl = null;

  var CONFETTI_COLORS = ['#ff4444','#44aaff','#ffcc00','#44ff88','#ff88cc','#aaffaa','#ff8800'];

  function _buildStyle() {
    _style = document.createElement('style');
    _style.textContent = [
      '@keyframes wcSplash{',
        '0%{opacity:0;transform:translate(-50%,-50%) scale(0.5)}',
        '25%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}',
        '60%{opacity:1;transform:translate(-50%,-50%) scale(1.0)}',
        '100%{opacity:0;transform:translate(-50%,-50%) scale(0.95)}',
      '}',
      '@keyframes wcFall{',
        '0%{transform:translateY(-20px) rotate(0deg);opacity:1}',
        '80%{opacity:1}',
        '100%{transform:translateY(110vh) rotate(720deg);opacity:0}',
      '}',
      '#wc-splash{',
        'position:fixed;top:44%;left:50%;',
        'transform:translate(-50%,-50%);',
        'font-family:"Courier New",monospace;font-weight:bold;',
        'text-align:center;letter-spacing:0.25em;',
        'pointer-events:none;z-index:420;',
        'text-shadow:0 0 20px currentColor;',
        'display:none;',
      '}',
      '#wc-splash .wc-main{font-size:32px;color:#44aaff;display:block;margin-bottom:6px;}',
      '#wc-splash .wc-sub{font-size:13px;color:#aaccff;opacity:0.85;display:block;}',
      '#wc-confetti{position:fixed;top:0;left:0;width:100%;height:100%;',
        'pointer-events:none;z-index:415;overflow:hidden;}',
      '.wc-piece{position:absolute;width:8px;height:8px;border-radius:1px;}',
    ].join('');
    document.head.appendChild(_style);
  }

  function _buildDom() {
    _splashEl = document.createElement('div');
    _splashEl.id = 'wc-splash';
    _splashEl.innerHTML = '<span class="wc-main"></span><span class="wc-sub"></span>';
    document.body.appendChild(_splashEl);

    _confettiEl = document.createElement('div');
    _confettiEl.id = 'wc-confetti';
    document.body.appendChild(_confettiEl);
  }

  function _celebrate(wave, kills, elapsed) {
    /* Splash text */
    if (_splashEl) {
      _splashEl.querySelector('.wc-main').textContent = 'WAVE ' + wave + ' COMPLETE';
      var sub = kills + ' KILLS';
      if (elapsed > 0) sub += '  ·  ' + Math.floor(elapsed) + 's';
      _splashEl.querySelector('.wc-sub').textContent = sub;
      _splashEl.style.display = 'block';
      _splashEl.style.animation = 'none';
      void _splashEl.offsetWidth;
      _splashEl.style.animation = 'wcSplash 2.8s ease-in-out forwards';
      setTimeout(function () { if (_splashEl) _splashEl.style.display = 'none'; }, 2900);
    }

    /* Confetti */
    if (_confettiEl) {
      _confettiEl.innerHTML = '';
      for (var i = 0; i < 32; i++) {
        (function (idx) {
          setTimeout(function () {
            var p    = document.createElement('div');
            p.className = 'wc-piece';
            var color = CONFETTI_COLORS[idx % CONFETTI_COLORS.length];
            var dur   = 1.8 + Math.random() * 1.2;
            var delay = Math.random() * 0.6;
            p.style.cssText = [
              'left:' + (Math.random() * 100) + '%;',
              'background:' + color + ';',
              'animation:wcFall ' + dur + 's ' + delay + 's ease-in forwards;',
              'transform:rotate(' + (Math.random() * 360) + 'deg);',
            ].join('');
            _confettiEl.appendChild(p);
            setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, (dur + delay + 0.1) * 1000);
          }, idx * 25);
        })(i);
      }
    }
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt  = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    _frameN++;

    /* Wave change detection */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (_waveWas === -1) {
          _waveWas   = w;
          _waveStart = ts / 1000;
        } else if (w > _waveWas) {
          /* Wave just advanced — previous wave cleared */
          var elapsed = ts / 1000 - _waveStart;
          _celebrate(_waveWas, _waveKills, elapsed);
          _waveWas   = w;
          _waveKills = 0;
          _waveStart = ts / 1000;
          /* Reset kill tracking for new wave */
          _counted   = new WeakSet();
        }
      }
    } catch (e) {}

    /* Kill tracking every 2 frames */
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
              _waveKills++;
            }
            _prevHp.set(e, cur);
          }
        }
      } catch (err) {}
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

window.WaveComplete = WaveComplete;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { WaveComplete.init(); });
} else {
  WaveComplete.init();
}