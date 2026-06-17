/* ============================================================
 *  ACCURACY-TRACKER.JS — Shot/hit tracking + accuracy HUD (passive)
 *
 *  Detects shots fired by watching Weapons.getState().clip decrease.
 *  Detects hits by watching any enemy HP drop (within 0.25s of shot).
 *
 *  MELEE weapons and reloads (clip increase) are excluded.
 *  Shows "ACC" percentage in a small corner chip.
 *  Color: green ≥70%, yellow ≥50%, red <50%.
 *  Resets per wave.
 * ============================================================ */
var AccuracyTracker = (function () {
  'use strict';

  var HIT_WINDOW = 0.25;   /* seconds — shot counts as a hit if enemy HP drops within this */

  var _shots      = 0;
  var _hits       = 0;
  var _prevClip   = null;
  var _prevHp     = new WeakMap();
  var _lastShotT  = -999;
  var _waveWas    = -1;
  var _init       = false;
  var _lastTs     = 0;
  var _frameN     = 0;

  var _el       = null;
  var _pctEl    = null;
  var _shotEl   = null;
  var _style    = null;

  function _buildStyle() {
    _style = document.createElement('style');
    _style.textContent = [
      '#at-wrap{',
        'position:fixed;top:180px;left:20px;',
        'pointer-events:none;z-index:370;',
        'font-family:"Courier New",monospace;',
      '}',
      '#at-label{font-size:9px;color:rgba(100,200,255,0.55);letter-spacing:1px;text-transform:uppercase;}',
      '#at-pct{font-size:18px;font-weight:bold;letter-spacing:2px;transition:color 0.4s;}',
      '#at-shots{font-size:9px;color:rgba(100,180,200,0.5);letter-spacing:1px;}',
    ].join('');
    document.head.appendChild(_style);
  }

  function _buildDom() {
    _el = document.createElement('div');
    _el.id = 'at-wrap';

    var lbl = document.createElement('div');
    lbl.id = 'at-label';
    lbl.textContent = 'ACC';

    _pctEl = document.createElement('div');
    _pctEl.id = 'at-pct';
    _pctEl.textContent = '—%';

    _shotEl = document.createElement('div');
    _shotEl.id = 'at-shots';
    _shotEl.textContent = '';

    _el.appendChild(lbl);
    _el.appendChild(_pctEl);
    _el.appendChild(_shotEl);
    document.body.appendChild(_el);
  }

  function _updateDisplay() {
    if (!_pctEl) return;
    if (_shots === 0) {
      _pctEl.textContent = '—%';
      _pctEl.style.color = 'rgba(100,200,255,0.7)';
      if (_shotEl) _shotEl.textContent = '';
      return;
    }
    var pct = Math.round((_hits / _shots) * 100);
    _pctEl.textContent = pct + '%';
    _pctEl.style.color = pct >= 70 ? '#44ff88' : pct >= 50 ? '#ffcc00' : '#ff4444';
    if (_shotEl) _shotEl.textContent = _hits + '/' + _shots;
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt  = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    var now = ts / 1000;

    /* Wave reset */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (_waveWas !== -1 && w > _waveWas) {
          _shots = 0; _hits = 0; _prevClip = null;
          _updateDisplay();
        }
        _waveWas = w;
      }
    } catch (e) {}

    /* Shot detection */
    if (_frameN % 2 === 0) {
      try {
        if (typeof Weapons !== 'undefined' && Weapons.getState && Weapons.getCurrentType) {
          var wType = Weapons.getCurrentType();
          if (wType !== 'MELEE') {
            var st   = Weapons.getState();
            var clip = st ? st.clip : null;
            if (clip !== null && _prevClip !== null) {
              var delta = _prevClip - clip;
              if (delta >= 1 && delta <= 5) {   /* 1-5 bullets — shot(s) fired */
                _shots += delta;
                _lastShotT = now;
              }
            }
            _prevClip = clip;
          }
        }
      } catch (er) {}

      /* Hit detection — any enemy HP drop within HIT_WINDOW of last shot */
      if (now - _lastShotT <= HIT_WINDOW) {
        try {
          if (typeof Enemies !== 'undefined' && Enemies.getAll) {
            var all = Enemies.getAll();
            for (var i = 0; i < all.length; i++) {
              var e = all[i];
              if (!e || !e.mesh) continue;
              var cur  = e.hp !== undefined ? e.hp : null;
              if (cur === null) continue;
              var prev = _prevHp.has(e) ? _prevHp.get(e) : cur;
              if (prev - cur >= 1) _hits++;
              _prevHp.set(e, cur);
            }
          }
        } catch (err) {}
      } else {
        /* Still need to update prevHp even when not in hit window */
        try {
          if (typeof Enemies !== 'undefined' && Enemies.getAll) {
            var all2 = Enemies.getAll();
            for (var j = 0; j < all2.length; j++) {
              var e2 = all2[j];
              if (!e2 || !e2.mesh) continue;
              var cur2 = e2.hp !== undefined ? e2.hp : null;
              if (cur2 !== null) _prevHp.set(e2, cur2);
            }
          }
        } catch (e3) {}
      }

      _updateDisplay();
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

window.AccuracyTracker = AccuracyTracker;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { AccuracyTracker.init(); });
} else {
  AccuracyTracker.init();
}