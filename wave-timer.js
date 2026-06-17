/* ============================================================
 *  WAVE-TIMER.JS — Wave elapsed time + best-time tracker (passive)
 *
 *  Reads player.waveStartTime (set by game on wave start).
 *  Displays MM:SS in a small top-right HUD chip.
 *  Tracks best (fastest) time per wave number in localStorage.
 *  When wave advances (getCurrentWave increments): compares elapsed
 *  vs saved best; shows "NEW BEST" flash if improved; resets clock.
 *  No keybindings required.
 * ============================================================ */
var WaveTimer = (function () {
  'use strict';

  var LS_KEY   = 'ok_wave_bests_v1';
  var _bests   = {};     /* wave# → best seconds (float) */
  var _waveWas = -1;
  var _init    = false;
  var _lastTs  = 0;
  var _frameN  = 0;

  var _el        = null;   /* timer chip */
  var _timeEl    = null;
  var _labelEl   = null;
  var _bestEl    = null;
  var _bestTimer = null;
  var _style     = null;

  /* --- localStorage helpers -------------------------------- */
  function _loadBests() {
    try { _bests = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch (e) { _bests = {}; }
  }

  function _saveBests() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(_bests)); } catch (e) {}
  }

  function _fmt(sec) {
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  /* --- DOM ------------------------------------------------- */
  function _buildStyle() {
    _style = document.createElement('style');
    _style.textContent = [
      '#wt-wrap{',
        'position:fixed;top:14px;right:155px;',   /* left of typical score area */
        'pointer-events:none;z-index:370;',
        'font-family:"Courier New",monospace;',
        'text-align:right;',
      '}',
      '#wt-label{font-size:9px;color:rgba(0,200,255,0.55);letter-spacing:1px;text-transform:uppercase;}',
      '#wt-time{font-size:18px;color:rgba(0,200,255,0.9);font-weight:bold;letter-spacing:2px;}',
      '#wt-best{font-size:9px;color:rgba(0,200,255,0.45);letter-spacing:1px;}',
      '@keyframes wtBest{',
        '0%{opacity:0;transform:scale(0.8)}',
        '20%{opacity:1;transform:scale(1.1)}',
        '70%{opacity:1}',
        '100%{opacity:0;transform:scale(0.95)}',
      '}',
      '#wt-best.new{color:#ffcc00;animation:wtBest 2.2s ease-out forwards;}',
    ].join('');
    document.head.appendChild(_style);
  }

  function _buildDom() {
    _el = document.createElement('div');
    _el.id = 'wt-wrap';

    _labelEl = document.createElement('div');
    _labelEl.id = 'wt-label';
    _labelEl.textContent = 'WAVE TIME';

    _timeEl = document.createElement('div');
    _timeEl.id = 'wt-time';
    _timeEl.textContent = '00:00';

    _bestEl = document.createElement('div');
    _bestEl.id = 'wt-best';
    _bestEl.textContent = 'BEST —';

    _el.appendChild(_labelEl);
    _el.appendChild(_timeEl);
    _el.appendChild(_bestEl);
    document.body.appendChild(_el);
  }

  function _onWaveEnd(waveNum, elapsed) {
    var key    = String(waveNum);
    var prev   = _bests[key];
    var isNew  = (prev === undefined || elapsed < prev);
    if (isNew) { _bests[key] = elapsed; _saveBests(); }

    if (_bestEl) {
      if (_bestTimer) { clearTimeout(_bestTimer); _bestTimer = null; }
      _bestEl.className = '';
      void _bestEl.offsetWidth;
      if (isNew) {
        _bestEl.textContent = 'NEW BEST ' + _fmt(elapsed);
        _bestEl.className = 'new';
        _bestTimer = setTimeout(function () {
          if (_bestEl) { _bestEl.className = ''; _bestEl.textContent = 'BEST ' + _fmt(elapsed); }
        }, 2300);
      } else {
        _bestEl.textContent = 'BEST ' + _fmt(_bests[key]);
      }
    }
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    if (_frameN % 6 !== 0) return;   /* update ~10fps — plenty for a clock */
    _lastTs = ts;

    /* Current wave */
    var wave = -1;
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        wave = GameManager.getCurrentWave();
      }
    } catch (e) {}

    /* Wave transition */
    if (_waveWas !== -1 && wave > _waveWas) {
      /* Wave just advanced — measure elapsed from waveStartTime of PREVIOUS wave */
      /* waveStartTime was set at the START of the old wave; estimate elapsed via perf.now */
      try {
        var wst = window.player && window.player.waveStartTime;
        if (wst) {
          var elapsed = (performance.now() - wst) / 1000;
          _onWaveEnd(_waveWas, elapsed);
        }
      } catch (err) {}
    }
    _waveWas = wave;

    /* Live timer display */
    try {
      var wst2 = window.player && window.player.waveStartTime;
      if (wst2 && _timeEl) {
        var sec = (performance.now() - wst2) / 1000;
        _timeEl.textContent = _fmt(sec);
      }
    } catch (er) {}

    /* Best line when not showing new-best flash */
    if (_bestEl && !_bestEl.classList.contains('new')) {
      var bKey = String(_waveWas);
      if (_bests[bKey] !== undefined) {
        _bestEl.textContent = 'BEST ' + _fmt(_bests[bKey]);
      }
    }
  }

  function init() {
    if (_init) return;
    _init = true;
    _loadBests();
    _buildStyle();
    _buildDom();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.WaveTimer = WaveTimer;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { WaveTimer.init(); });
} else {
  WaveTimer.init();
}