/* ============================================================
 *  WAVE-INTEL.JS — Tactical enemy type briefing on wave start (passive)
 *
 *  When a new wave begins, scans enemy types present and displays
 *  a brief "INTEL" panel for 4 seconds:
 *
 *    ┌────────────────────────────────┐
 *    │  ▸ WAVE 3 INTEL               │
 *    │  CONSCRIPT  ×6                │
 *    │  ENGINEER   ×3                │
 *    │  SNIPER     ×1  ⚠             │
 *    └────────────────────────────────┘
 *
 *  Position: top-left, below enemy-counter (top:100px).
 *  Snipers flagged with ⚠. Dismissed after SHOW_TIME or on first kill.
 *  Completely passive — no keybind.
 * ============================================================ */
var WaveIntel = (function () {
  'use strict';

  var SHOW_TIME   = 4.0;      /* seconds before auto-dismiss */
  var SCAN_DELAY  = 0.4;      /* seconds after wave change to scan (let spawner run) */

  var _init       = false;
  var _frameN     = 0;
  var _lastTs     = 0;
  var _waveWas    = -1;
  var _showing    = false;
  var _showT      = 0;        /* time remaining to show */
  var _scanPending = false;
  var _scanAt     = 0;

  var _prevHp     = new WeakMap();
  var _counted    = new WeakSet();
  var _killThisWave = 0;

  var _el         = null;
  var _style      = null;

  var LABEL_MAP = {
    CONSCRIPT: 'CONSCRIPT',
    STORMER:   'STORMER',
    ENGINEER:  'ENGINEER',
    SNIPER:    'SNIPER',
    WAGNER:    'WAGNER',
    SPETSNAZ:  'SPETSNAZ',
    ELITE:     'ELITE',
    HEAVY:     'HEAVY',
    DRONE:     'DRONE',
    TANK:      'TANK',
    MECH:      'MECH',
  };

  var DANGER = { SNIPER: true, HEAVY: true, TANK: true, MECH: true, SPETSNAZ: true };

  function _buildStyle() {
    _style = document.createElement('style');
    _style.textContent = [
      '@keyframes wiIn{',
        '0%{opacity:0;transform:translateX(-12px)}',
        '15%{opacity:1;transform:translateX(0)}',
        '85%{opacity:1;transform:translateX(0)}',
        '100%{opacity:0;transform:translateX(-12px)}',
      '}',
      '#wi-wrap{',
        'position:fixed;top:100px;left:20px;',
        'background:rgba(0,6,12,0.82);',
        'border:1px solid rgba(0,200,255,0.30);',
        'border-radius:4px;padding:7px 12px;',
        'pointer-events:none;z-index:370;',
        'min-width:160px;',
        'display:none;',
        'font-family:"Courier New",monospace;',
      '}',
      '#wi-head{',
        'font-size:9px;letter-spacing:3px;color:rgba(0,200,255,0.9);',
        'margin-bottom:5px;',
      '}',
      '.wi-row{',
        'display:flex;justify-content:space-between;',
        'font-size:9px;color:rgba(200,220,200,0.85);',
        'line-height:1.55;letter-spacing:1px;',
      '}',
      '.wi-danger{color:rgba(255,160,50,0.95);}',
    ].join('');
    document.head.appendChild(_style);
  }

  function _buildDom() {
    _el = document.createElement('div');
    _el.id = 'wi-wrap';
    document.body.appendChild(_el);
  }

  function _scanAndShow(wave) {
    var counts = {};
    var total  = 0;
    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
      var all = Enemies.getAll();
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e) continue;
        var raw  = (e.type || e.name || 'UNKNOWN').toUpperCase();
        var key  = 'UNKNOWN';
        for (var k in LABEL_MAP) {
          if (raw.indexOf(k) >= 0) { key = LABEL_MAP[k]; break; }
        }
        counts[key] = (counts[key] || 0) + 1;
        total++;
      }
    } catch (er) {}

    if (!total) return;  /* nothing to show */

    /* Build DOM */
    _el.innerHTML = '';

    var head = document.createElement('div');
    head.id = 'wi-head';
    head.textContent = '▸ WAVE ' + wave + ' INTEL';
    _el.appendChild(head);

    var keys = Object.keys(counts).sort();
    for (var j = 0; j < keys.length; j++) {
      var row = document.createElement('div');
      row.className = 'wi-row' + (DANGER[keys[j]] ? ' wi-danger' : '');
      var lbl = document.createElement('span');
      lbl.textContent = keys[j] + (DANGER[keys[j]] ? ' ⚠' : '');
      var cnt = document.createElement('span');
      cnt.textContent = '×' + counts[keys[j]];
      row.appendChild(lbl);
      row.appendChild(cnt);
      _el.appendChild(row);
    }

    /* Animate */
    _el.style.animation = 'none';
    void _el.offsetWidth;
    _el.style.display = 'block';
    _el.style.animation = 'wiIn ' + SHOW_TIME + 's ease forwards';
    _showing  = true;
    _showT    = SHOW_TIME;
  }

  function _dismiss() {
    if (!_showing) return;
    _showing = false;
    _el.style.display = 'none';
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt  = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    var now = ts / 1000;

    /* Wave change detection */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (_waveWas !== -1 && w !== _waveWas) {
          _killThisWave = 0;
          _dismiss();
          _scanPending = true;
          _scanAt = now + SCAN_DELAY;
        }
        _waveWas = w;
      }
    } catch (e) {}

    /* Delayed scan */
    if (_scanPending && now >= _scanAt) {
      _scanPending = false;
      _scanAndShow(_waveWas);
    }

    /* Decay timer */
    if (_showing) {
      _showT -= dt;
      if (_showT <= 0) _dismiss();
    }

    /* First kill → dismiss */
    if (_showing && _frameN % 3 === 0) {
      try {
        if (typeof Enemies !== 'undefined' && Enemies.getAll) {
          var all2 = Enemies.getAll();
          for (var i = 0; i < all2.length; i++) {
            var e2 = all2[i];
            if (!e2 || !e2.mesh) continue;
            var cur  = e2.hp !== undefined ? e2.hp : null;
            if (cur === null) continue;
            var prev = _prevHp.has(e2) ? _prevHp.get(e2) : cur;
            if (cur <= 0 && prev > 0 && !_counted.has(e2)) {
              _counted.add(e2);
              _killThisWave++;
              if (_killThisWave >= 1) _dismiss();
            }
            _prevHp.set(e2, cur);
          }
        }
      } catch (er) {}
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

window.WaveIntel = WaveIntel;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { WaveIntel.init(); });
} else {
  WaveIntel.init();
}