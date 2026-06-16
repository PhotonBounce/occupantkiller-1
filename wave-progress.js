/* ============================================================
 *  WAVE-PROGRESS.JS — Enemy kill counter bar (top-center HUD)
 *
 *  Shows "WAVE X  dead/total" text + thin fill bar below the
 *  compass. Color shifts red→yellow→green as enemies are cleared.
 *  Auto-hides between waves (empty enemy list). No key binding.
 * ============================================================ */
var WaveProgress = (function () {
  'use strict';

  var _init    = false;
  var _frameN  = 0;
  var _wrap, _textEl, _barFill;

  /* ── DOM ──────────────────────────────── */
  function _buildDOM() {
    _wrap = document.createElement('div');
    _wrap.id = 'wp-wrap';
    Object.assign(_wrap.style, {
      position:       'fixed',
      top:            '48px',
      left:           '50%',
      transform:      'translateX(-50%)',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      gap:            '3px',
      zIndex:         215,
      pointerEvents:  'none'
    });
    document.body.appendChild(_wrap);

    _textEl = document.createElement('div');
    Object.assign(_textEl.style, {
      fontFamily:   "'Courier New', monospace",
      fontSize:     '9px',
      letterSpacing:'2px',
      color:        'rgba(180,220,255,0.75)',
      textShadow:   '0 0 5px rgba(100,180,255,0.5)',
      whiteSpace:   'nowrap'
    });
    _textEl.textContent = '';
    _wrap.appendChild(_textEl);

    var bg = document.createElement('div');
    Object.assign(bg.style, {
      width:        '130px',
      height:       '2px',
      background:   'rgba(255,255,255,0.08)',
      borderRadius: '1px',
      overflow:     'hidden'
    });
    _wrap.appendChild(bg);

    _barFill = document.createElement('div');
    Object.assign(_barFill.style, {
      height:       '100%',
      width:        '0%',
      borderRadius: '1px',
      transition:   'width 0.2s ease-out, background 0.4s ease'
    });
    bg.appendChild(_barFill);
  }

  /* ── rAF tick (updates every 10 frames) ─ */
  function _tick() {
    requestAnimationFrame(_tick);
    _frameN++;
    if (_frameN % 10 !== 0) return;

    if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
    var all = Enemies.getAll();

    if (!all || all.length === 0) {
      _textEl.textContent = '';
      _barFill.style.width = '0%';
      return;
    }

    var total = all.length;
    var dead  = 0;
    for (var i = 0; i < all.length; i++) {
      if (all[i] && all[i].dead) dead++;
    }

    var pct = (dead / total) * 100;

    /* Color: red (low cleared) → yellow → green (all cleared) */
    var r, g, b;
    if (pct < 50) {
      r = 255; g = Math.round(pct * 3.6); b = 60;
    } else {
      r = Math.round((100 - pct) * 4.4); g = 210; b = 60;
    }
    _barFill.style.background = 'rgba(' + r + ',' + g + ',' + b + ',0.88)';
    _barFill.style.width = pct.toFixed(1) + '%';

    var wave = '?';
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) wave = GameManager.getCurrentWave();
    } catch (e) {}

    _textEl.textContent = 'WAVE ' + wave + '  ' + dead + ' / ' + total;
  }

  /* ── Init ──────────────────────────────── */
  function init() {
    if (_init) return;
    _init = true;
    _buildDOM();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.WaveProgress = WaveProgress;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { WaveProgress.init(); });
} else {
  WaveProgress.init();
}
