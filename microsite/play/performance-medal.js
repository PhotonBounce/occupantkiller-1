/* ============================================================
 *  PERFORMANCE-MEDAL.JS — End-of-wave achievement medals (passive)
 *
 *  Tracks per-wave stats. On wave clear (wave number increments),
 *  evaluates earned medals and pops a brief badge for each:
 *
 *  SURVIVOR     — cleared with full HP (no damage taken)
 *  SPEEDKILL    — landed first kill within 3s of wave start
 *  PRECISION    — accuracy ≥ 75% for the wave
 *  ELIMINATOR   — killed 15+ enemies in the wave
 *  COMBO MASTER — hit a ×6 or higher combo during the wave
 *
 *  Medals pop in sequence (0.5s apart) in the top-right area.
 *  Each badge slides in, holds 1.8s, then fades out.
 *  No keybind — purely passive.
 * ============================================================ */
var PerformanceMedal = (function () {
  'use strict';

  var FIRST_KILL_WINDOW = 3.0;  /* seconds from wave start to count SPEEDKILL */
  var PRECISION_MIN     = 0.75; /* fraction accuracy for PRECISION medal */
  var ELIMINATOR_MIN    = 15;   /* enemies killed in wave for ELIMINATOR */
  var COMBO_MASTER_MIN  = 6;    /* combo count for COMBO MASTER */
  var BADGE_HOLD        = 1.8;  /* seconds each badge is visible */
  var BADGE_STAGGER     = 0.5;  /* seconds between badge pops */

  /* Per-wave tracking */
  var _waveWas      = -1;
  var _waveStart    = 0;
  var _hpAtStart    = null;
  var _firstKillT   = null;   /* time of first kill this wave */
  var _kills        = 0;
  var _shots        = 0;
  var _hits         = 0;
  var _maxCombo     = 0;

  var _prevHp       = new WeakMap();
  var _counted      = new WeakSet();
  var _prevClip     = null;
  var _lastShotT    = -999;
  var _prevPlayerHp = null;

  var _pendingMedals = [];  /* [{label, color, icon}] queued to show */
  var _showingMedal  = false;
  var _medalEl       = null;
  var _style         = null;

  var _init = false;
  var _frameN = 0;
  var _lastTs = 0;

  var MEDALS = {
    SURVIVOR:     { label: 'SURVIVOR',     color: '#44ff88', icon: '❤' },
    SPEEDKILL:    { label: 'SPEEDKILL',    color: '#ffdd44', icon: '⚡' },
    PRECISION:    { label: 'PRECISION',    color: '#44ccff', icon: '◎' },
    ELIMINATOR:   { label: 'ELIMINATOR',   color: '#ff8844', icon: '☠' },
    COMBO_MASTER: { label: 'COMBO MASTER', color: '#dd44ff', icon: '×' },
  };

  function _buildStyle() {
    _style = document.createElement('style');
    _style.textContent = [
      '@keyframes pmSlide{',
        '0%{opacity:0;transform:translateX(60px)}',
        '15%{opacity:1;transform:translateX(0)}',
        '75%{opacity:1;transform:translateX(0)}',
        '100%{opacity:0;transform:translateX(60px)}',
      '}',
      '#pm-badge{',
        'position:fixed;right:20px;top:310px;',
        'pointer-events:none;z-index:435;',
        'display:none;text-align:right;',
      '}',
      '#pm-inner{',
        'display:inline-block;',
        'background:rgba(0,6,12,0.88);',
        'border:1px solid currentColor;border-radius:4px;',
        'padding:5px 12px;',
        'font-family:"Courier New",monospace;',
      '}',
      '#pm-icon{font-size:16px;margin-right:6px;vertical-align:middle;}',
      '#pm-text{',
        'font-size:11px;font-weight:bold;letter-spacing:3px;',
        'vertical-align:middle;',
      '}',
      '#pm-sub{',
        'font-size:7px;letter-spacing:2px;',
        'color:rgba(180,200,180,0.65);',
        'display:block;text-align:right;margin-top:1px;',
      '}',
    ].join('');
    document.head.appendChild(_style);
  }

  function _buildDom() {
    _medalEl = document.createElement('div');
    _medalEl.id = 'pm-badge';
    _medalEl.innerHTML = '<div id="pm-inner"><span id="pm-icon"></span><span id="pm-text"></span><span id="pm-sub">MEDAL</span></div>';
    document.body.appendChild(_medalEl);
  }

  function _showNextMedal() {
    if (_pendingMedals.length === 0) { _showingMedal = false; return; }
    _showingMedal = true;
    var m = _pendingMedals.shift();

    var inner = document.getElementById('pm-inner');
    var icon  = document.getElementById('pm-icon');
    var text  = document.getElementById('pm-text');
    if (!inner || !icon || !text) return;

    inner.style.color    = m.color;
    inner.style.borderColor = m.color;
    icon.textContent     = m.icon;
    text.textContent     = m.label;
    text.style.color     = m.color;

    _medalEl.style.display = 'block';
    _medalEl.style.animation = 'none';
    void _medalEl.offsetWidth;
    var dur = BADGE_HOLD + 0.4;  /* hold + 0.2s in + 0.2s out */
    _medalEl.style.animation = 'pmSlide ' + dur + 's ease forwards';

    setTimeout(function () {
      _medalEl.style.display = 'none';
      setTimeout(_showNextMedal, BADGE_STAGGER * 1000);
    }, dur * 1000);
  }

  function _queueMedal(key) {
    var m = MEDALS[key];
    if (!m) return;
    _pendingMedals.push(m);
    if (!_showingMedal) _showNextMedal();
  }

  function _evaluateWave() {
    var earned = [];

    /* SURVIVOR */
    try {
      if (window.player && _prevPlayerHp !== null && _prevPlayerHp >= (window.player.maxHp || 100)) {
        earned.push('SURVIVOR');
      }
    } catch (e) {}

    /* SPEEDKILL */
    if (_firstKillT !== null && _firstKillT - _waveStart <= FIRST_KILL_WINDOW) {
      earned.push('SPEEDKILL');
    }

    /* PRECISION */
    var acc = _shots > 0 ? _hits / _shots : 0;
    if (_shots >= 4 && acc >= PRECISION_MIN) {
      earned.push('PRECISION');
    }

    /* ELIMINATOR */
    if (_kills >= ELIMINATOR_MIN) earned.push('ELIMINATOR');

    /* COMBO MASTER */
    if (_maxCombo >= COMBO_MASTER_MIN) earned.push('COMBO_MASTER');

    earned.forEach(function (k) { _queueMedal(k); });
  }

  function _resetWave(now) {
    _waveStart  = now;
    _firstKillT = null;
    _kills      = 0;
    _shots      = 0;
    _hits       = 0;
    _maxCombo   = 0;
    try { _prevPlayerHp = window.player ? window.player.hp : null; } catch (e) {}
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt   = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs  = ts;
    var now  = ts / 1000;

    /* Wave detection */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (_waveWas !== -1 && w !== _waveWas) {
          _evaluateWave();
          _resetWave(now);
        }
        _waveWas = w;
      }
    } catch (e) {}

    /* Shot detection */
    if (_frameN % 2 === 0) {
      try {
        if (typeof Weapons !== 'undefined' && Weapons.getState && Weapons.getCurrent) {
          var st  = Weapons.getState();
          var cur = Weapons.getCurrent();
          var isMelee = (typeof Weapons.getCurrentType === 'function'
            && (Weapons.getCurrentType() || '').toUpperCase().indexOf('MELEE') >= 0);
          if (!isMelee && st && _prevClip !== null && st.clip < _prevClip) {
            var fired = _prevClip - st.clip;
            if (fired >= 1 && fired <= 5) { _shots += fired; _lastShotT = now; }
          }
          _prevClip = st ? st.clip : _prevClip;
        }
      } catch (e) {}
    }

    /* Kill / hit detection */
    if (_frameN % 2 === 0) {
      try {
        if (typeof Enemies !== 'undefined' && Enemies.getAll) {
          var all = Enemies.getAll();
          for (var i = 0; i < all.length; i++) {
            var e = all[i];
            if (!e || !e.mesh) continue;
            var hcur  = e.hp !== undefined ? e.hp : null;
            if (hcur === null) continue;
            var hprev = _prevHp.has(e) ? _prevHp.get(e) : hcur;

            if (hprev > hcur && now - _lastShotT <= 0.3) _hits++;

            if (hcur <= 0 && hprev > 0 && !_counted.has(e)) {
              _counted.add(e);
              _kills++;
              if (_firstKillT === null) _firstKillT = now;
            }
            _prevHp.set(e, hcur);
          }
        }
      } catch (er) {}
    }

    /* Track player HP for SURVIVOR */
    try {
      if (window.player && window.player.hp !== undefined) {
        if (_prevPlayerHp !== null && window.player.hp < _prevPlayerHp) {
          /* Damage taken — survivor broken */
          _prevPlayerHp = window.player.hp;   /* keep tracking (future waves reset) */
        }
      }
    } catch (e) {}

    /* Track combo from ComboCounter if available */
    try {
      if (typeof ComboCounter !== 'undefined') {
        /* Combo tracking is internal; rely on DOM readout */
        var lbl = document.getElementById('cc-label');
        if (lbl) {
          var txt = lbl.textContent || '';
          var n = parseInt(txt.replace('×', ''), 10);
          if (!isNaN(n) && n > _maxCombo) _maxCombo = n;
        }
      }
    } catch (e) {}
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

window.PerformanceMedal = PerformanceMedal;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { PerformanceMedal.init(); });
} else {
  PerformanceMedal.init();
}