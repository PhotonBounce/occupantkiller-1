/* ============================================================
 *  BATTLE-RATING.JS — Real-time performance grade (passive)
 *
 *  Computes a rolling performance score and shows a letter grade
 *  in the top-right area. Grade updates smoothly every 3s.
 *
 *  Score factors (each 0-100 points, combined):
 *    Kill rate   — kills per minute (60 = 100pts, scales linearly)
 *    Accuracy    — shot hit fraction × 100
 *    HP          — (player.hp / maxHp) × 100
 *    Combo       — bonus for active combo ×2+
 *
 *  Grade thresholds:
 *    S: 85+   A: 70+   B: 55+   C: 40+   D: <40
 *
 *  Grade animates on change (scale pop + color flash).
 *  Position: right:20px top:50px (below kill-feed / above combo-counter).
 * ============================================================ */
var BattleRating = (function () {
  'use strict';

  var UPDATE_INTERVAL = 3.0;   /* seconds between grade recalculations */
  var KPM_CAP        = 60;    /* kills/min for max KPM score */

  var _init     = false;
  var _frameN   = 0;
  var _lastTs   = 0;

  /* Kill tracking */
  var _prevHp   = new WeakMap();
  var _counted  = new WeakSet();
  var _killTs   = [];          /* timestamps of recent kills */

  /* Shot/hit tracking */
  var _shots    = 0;
  var _hits     = 0;
  var _prevClip = null;
  var _lastShot = -999;

  var _nextUpdate  = 0;
  var _currentGrade = null;
  var _currentScore = 0;

  var _el       = null;
  var _gradeEl  = null;
  var _scoreEl  = null;
  var _style    = null;

  var GRADES = [
    { label: 'S', min: 85, color: '#ffdd00', shadow: 'rgba(255,220,0,0.8)' },
    { label: 'A', min: 70, color: '#44ff88', shadow: 'rgba(50,220,100,0.7)' },
    { label: 'B', min: 55, color: '#44ccff', shadow: 'rgba(50,180,255,0.7)' },
    { label: 'C', min: 40, color: '#aaaaaa', shadow: 'rgba(150,150,150,0.5)' },
    { label: 'D', min: 0,  color: '#ff4444', shadow: 'rgba(200,50,50,0.6)' },
  ];

  function _getGrade(score) {
    for (var i = 0; i < GRADES.length; i++) {
      if (score >= GRADES[i].min) return GRADES[i];
    }
    return GRADES[GRADES.length - 1];
  }

  function _buildStyle() {
    _style = document.createElement('style');
    _style.textContent = [
      '@keyframes brPop{',
        '0%{transform:scale(1.5)}',
        '60%{transform:scale(0.95)}',
        '100%{transform:scale(1.0)}',
      '}',
      '#br-wrap{',
        'position:fixed;right:20px;top:50px;',
        'pointer-events:none;z-index:420;',
        'text-align:right;',
        'font-family:"Courier New",monospace;',
      '}',
      '#br-grade{',
        'font-size:38px;font-weight:900;',
        'line-height:1;letter-spacing:-1px;',
        'transition:color 0.4s;',
        'text-shadow:0 0 20px currentColor;',
      '}',
      '#br-label{',
        'font-size:7px;letter-spacing:3px;',
        'color:rgba(180,200,180,0.55);',
        'margin-top:-2px;',
      '}',
      '#br-score{',
        'font-size:8px;letter-spacing:1px;',
        'color:rgba(150,170,150,0.45);',
        'margin-top:1px;',
      '}',
    ].join('');
    document.head.appendChild(_style);
  }

  function _buildDom() {
    _el = document.createElement('div');
    _el.id = 'br-wrap';

    _gradeEl = document.createElement('div');
    _gradeEl.id = 'br-grade';
    _gradeEl.textContent = '—';

    var lbl = document.createElement('div');
    lbl.id = 'br-label';
    lbl.textContent = 'RATING';

    _scoreEl = document.createElement('div');
    _scoreEl.id = 'br-score';

    _el.appendChild(_gradeEl);
    _el.appendChild(lbl);
    _el.appendChild(_scoreEl);
    document.body.appendChild(_el);
  }

  function _computeScore(now) {
    /* Kill rate: rolling 60s kill count as kills-per-minute */
    _killTs = _killTs.filter(function (t) { return now - t <= 60; });
    var kpm  = _killTs.length;  /* kills in last 60s = kills/min */
    var kScore = Math.min(100, kpm / KPM_CAP * 100);

    /* Accuracy */
    var aScore = _shots > 3 ? Math.min(100, (_hits / _shots) * 100) : 50;

    /* HP */
    var hScore = 50;
    try {
      if (window.player && window.player.hp !== undefined) {
        hScore = Math.max(0, (window.player.hp / (window.player.maxHp || 100)) * 100);
      }
    } catch (e) {}

    /* Combo bonus from DOM */
    var comboBonus = 0;
    try {
      var lbl = document.getElementById('cc-label');
      if (lbl) {
        var n = parseInt((lbl.textContent || '').replace('×', ''), 10);
        if (!isNaN(n) && n >= 2) comboBonus = Math.min(15, n * 2);
      }
    } catch (e) {}

    var raw = kScore * 0.40 + aScore * 0.30 + hScore * 0.30 + comboBonus;
    return Math.round(Math.min(100, raw));
  }

  function _updateDisplay(score) {
    var grade = _getGrade(score);
    var changed = grade.label !== _currentGrade;
    _currentGrade = grade.label;
    _currentScore = score;

    if (!_gradeEl) return;
    _gradeEl.textContent = grade.label;
    _gradeEl.style.color      = grade.color;
    _gradeEl.style.textShadow = '0 0 20px ' + grade.shadow;

    if (changed) {
      _gradeEl.style.animation = 'none';
      void _gradeEl.offsetWidth;
      _gradeEl.style.animation = 'brPop 0.30s ease-out forwards';
    }

    if (_scoreEl) _scoreEl.textContent = score + 'pts';
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt  = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    var now = ts / 1000;

    /* Kill detection */
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
              _killTs.push(now);
            }
            _prevHp.set(e, cur);
          }
        }
      } catch (er) {}
    }

    /* Shot / hit tracking */
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
      /* Hit proxy: any enemy HP drop near shot time */
      try {
        if (typeof Enemies !== 'undefined' && Enemies.getAll && now - _lastShot < 0.3) {
          var all2 = Enemies.getAll();
          for (var j = 0; j < all2.length; j++) {
            var e2 = all2[j];
            if (!e2) continue;
            var c2   = e2.hp !== undefined ? e2.hp : null;
            var p2   = _prevHp.has(e2) ? _prevHp.get(e2) : c2;
            if (c2 !== null && p2 !== null && p2 > c2) _hits++;
          }
        }
      } catch (e) {}
    }

    /* Periodic grade update */
    if (now >= _nextUpdate) {
      _nextUpdate = now + UPDATE_INTERVAL;
      _updateDisplay(_computeScore(now));
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

window.BattleRating = BattleRating;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { BattleRating.init(); });
} else {
  BattleRating.init();
}