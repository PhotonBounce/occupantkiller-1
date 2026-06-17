/* ============================================================
 *  WAVE-SCOREBOARD.JS — Wave-end stat panel (passive)
 *
 *  Appears 0.6s after a wave clears (wave number increments).
 *  Shows 5 key stats from the just-completed wave:
 *
 *    KILLS     — enemies killed
 *    ACCURACY  — shots-to-hits ratio %
 *    TIME      — wave elapsed time (from player.waveStartTime)
 *    COMBO     — best combo reached (via ComboCounter DOM)
 *    DAMAGE    — total HP lost this wave
 *
 *  Panel slides up from bottom, holds 5s, then slides back down.
 *  CSS-only animation — no canvas.
 *  z-index 420.
 * ============================================================ */
var WaveScoreboard = (function () {
  'use strict';

  var SHOW_DELAY = 0.6;
  var HOLD_TIME  = 5.0;
  var SLIDE_DUR  = '0.35s';

  var _init      = false;
  var _frameN    = 0;
  var _lastTs    = 0;
  var _waveWas   = -1;

  /* Per-wave tracking */
  var _kills     = 0;
  var _shots     = 0;
  var _hits      = 0;
  var _maxCombo  = 0;
  var _dmgTaken  = 0;
  var _waveStart = null;

  var _prevHp    = new WeakMap();
  var _counted   = new WeakSet();
  var _prevClip  = null;
  var _lastShotT = -999;
  var _prevPHp   = null;

  var _pendingShow = false;
  var _showAt    = 0;
  var _hideTimer = 0;

  /* DOM */
  var _el        = null;
  var _rows      = {};
  var _style     = null;

  function _buildStyle() {
    _style = document.createElement('style');
    _style.textContent = [
      '#ws-wrap{',
        'position:fixed;bottom:0;left:50%;',
        'transform:translate(-50%,100%);',
        'transition:transform ' + SLIDE_DUR + ' cubic-bezier(0.4,0,0.2,1);',
        'background:rgba(0,6,12,0.88);',
        'border-top:1px solid rgba(0,200,255,0.25);',
        'border-left:1px solid rgba(0,200,255,0.12);',
        'border-right:1px solid rgba(0,200,255,0.12);',
        'border-radius:6px 6px 0 0;padding:10px 28px 14px;',
        'pointer-events:none;z-index:420;',
        'font-family:"Courier New",monospace;',
        'min-width:260px;text-align:center;',
      '}',
      '#ws-wrap.ws-in{transform:translate(-50%,0);}',
      '#ws-head{',
        'font-size:8px;letter-spacing:5px;',
        'color:rgba(0,200,255,0.75);margin-bottom:8px;',
      '}',
      '.ws-row{',
        'display:flex;justify-content:space-between;',
        'font-size:9px;letter-spacing:2px;',
        'color:rgba(200,215,200,0.75);',
        'line-height:1.7;',
      '}',
      '.ws-val{color:rgba(255,255,255,0.90);font-weight:bold;}',
    ].join('');
    document.head.appendChild(_style);
  }

  function _buildDom() {
    _el = document.createElement('div');
    _el.id = 'ws-wrap';

    var head = document.createElement('div');
    head.id = 'ws-head';
    head.textContent = '— WAVE DEBRIEF —';
    _el.appendChild(head);

    var fields = [
      { key: 'kills',    label: 'ELIMINATIONS' },
      { key: 'accuracy', label: 'ACCURACY'      },
      { key: 'time',     label: 'TIME'           },
      { key: 'combo',    label: 'BEST COMBO'     },
      { key: 'damage',   label: 'DAMAGE TAKEN'   },
    ];

    fields.forEach(function (f) {
      var row = document.createElement('div');
      row.className = 'ws-row';
      var lbl = document.createElement('span');
      lbl.textContent = f.label;
      var val = document.createElement('span');
      val.className = 'ws-val';
      val.textContent = '—';
      row.appendChild(lbl);
      row.appendChild(val);
      _el.appendChild(row);
      _rows[f.key] = val;
    });

    document.body.appendChild(_el);
  }

  function _fmtTime(secs) {
    var m = Math.floor(secs / 60);
    var s = Math.floor(secs % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function _showPanel(wave) {
    /* Collect best combo from DOM */
    var combo = _maxCombo;
    try {
      var lbl = document.getElementById('cc-label');
      if (lbl) {
        var n = parseInt((lbl.textContent || '').replace('×', ''), 10);
        if (!isNaN(n) && n > combo) combo = n;
      }
    } catch (e) {}

    /* Elapsed wave time */
    var elapsed = 0;
    try {
      if (window.player && window.player.waveStartTime) {
        elapsed = (Date.now() - window.player.waveStartTime) / 1000;
      } else if (_waveStart) {
        elapsed = performance.now() / 1000 - _waveStart;
      }
    } catch (e) {}

    var acc = _shots > 0 ? Math.round((_hits / _shots) * 100) : 0;

    document.getElementById('ws-head').textContent = '— WAVE ' + wave + ' DEBRIEF —';
    if (_rows.kills)    _rows.kills.textContent    = _kills;
    if (_rows.accuracy) _rows.accuracy.textContent = acc + '%' + (acc >= 75 ? ' ✓' : '');
    if (_rows.time)     _rows.time.textContent     = _fmtTime(elapsed);
    if (_rows.combo)    _rows.combo.textContent    = combo >= 2 ? '×' + combo : '—';
    if (_rows.damage)   _rows.damage.textContent   = Math.round(_dmgTaken) + ' HP';

    /* Slide in */
    _el.classList.add('ws-in');
    _hideTimer = HOLD_TIME;
  }

  function _hidePanel() {
    _el.classList.remove('ws-in');
  }

  function _resetWave(now) {
    _kills    = 0;
    _shots    = 0;
    _hits     = 0;
    _maxCombo = 0;
    _dmgTaken = 0;
    _waveStart = now;
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt  = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    var now = ts / 1000;

    /* Wave detection */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (_waveWas > 0 && w > _waveWas) {
          _pendingShow = true;
          _showAt = now + SHOW_DELAY;
          var completedWave = _waveWas;
          setTimeout(function () { _showPanel(completedWave); }, SHOW_DELAY * 1000);
          _resetWave(now);
        }
        _waveWas = w;
      }
    } catch (e) {}

    /* Hide timer */
    if (_hideTimer > 0) {
      _hideTimer -= dt;
      if (_hideTimer <= 0) _hidePanel();
    }

    /* Kill/hit/shot tracking (every 2nd frame) */
    if (_frameN % 2 === 0) {
      try {
        if (typeof Weapons !== 'undefined' && Weapons.getState) {
          var st = Weapons.getState();
          var isMelee = (typeof Weapons.getCurrentType === 'function'
            && (Weapons.getCurrentType() || '').toUpperCase().indexOf('MELEE') >= 0);
          if (!isMelee && st && _prevClip !== null && st.clip < _prevClip) {
            var fired = _prevClip - st.clip;
            if (fired >= 1 && fired <= 5) { _shots += fired; _lastShotT = now; }
          }
          _prevClip = st ? st.clip : _prevClip;
        }
      } catch (e) {}

      try {
        if (typeof Enemies !== 'undefined' && Enemies.getAll) {
          var all = Enemies.getAll();
          for (var i = 0; i < all.length; i++) {
            var e = all[i];
            if (!e || !e.mesh) continue;
            var cur  = e.hp !== undefined ? e.hp : null;
            if (cur === null) continue;
            var prev = _prevHp.has(e) ? _prevHp.get(e) : cur;
            if (prev > cur && now - _lastShotT < 0.3) _hits++;
            if (cur <= 0 && prev > 0 && !_counted.has(e)) { _counted.add(e); _kills++; }
            _prevHp.set(e, cur);
          }
        }
      } catch (er) {}
    }

    /* Combo tracking */
    try {
      var clbl = document.getElementById('cc-label');
      if (clbl) {
        var cn = parseInt((clbl.textContent || '').replace('×', ''), 10);
        if (!isNaN(cn) && cn > _maxCombo) _maxCombo = cn;
      }
    } catch (e) {}

    /* Damage tracking */
    try {
      if (window.player && window.player.hp !== undefined) {
        var php = window.player.hp;
        if (_prevPHp !== null && _prevPHp > php) _dmgTaken += _prevPHp - php;
        _prevPHp = php;
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

window.WaveScoreboard = WaveScoreboard;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { WaveScoreboard.init(); });
} else {
  WaveScoreboard.init();
}