/* ============================================================
 *  ENEMY-COUNTER.JS — Live enemy count HUD (passive)
 *
 *  Reads Enemies.getAll() each tick. Shows:
 *    REMAINING
 *    <N>          ← live count, colour green→yellow→red
 *    <rate>/s     ← rolling 4s kill-rate
 *
 *  Also shows a brief "CLEARED!" flash when count hits 0.
 *  Positioned top-left below typical health area.
 * ============================================================ */
var EnemyCounter = (function () {
  'use strict';

  var _init      = false;
  var _lastTs    = 0;
  var _frameN    = 0;
  var _prevCount = -1;

  /* Rolling kill rate — keep timestamps of recent kills */
  var _killTimes  = [];
  var RATE_WINDOW = 4.0;   /* seconds */

  var _el       = null;
  var _countEl  = null;
  var _rateEl   = null;
  var _style    = null;

  var _clearedTimer = null;
  var _peakCount    = 0;

  function _buildStyle() {
    _style = document.createElement('style');
    _style.textContent = [
      '#ec-wrap{',
        'position:fixed;top:72px;left:20px;',
        'pointer-events:none;z-index:370;',
        'font-family:"Courier New",monospace;',
      '}',
      '#ec-label{font-size:9px;color:rgba(255,80,80,0.55);letter-spacing:1px;text-transform:uppercase;}',
      '#ec-count{font-size:22px;font-weight:bold;letter-spacing:2px;transition:color 0.3s;}',
      '#ec-rate{font-size:9px;letter-spacing:1px;}',
      '@keyframes ecPop{',
        '0%{transform:scale(0.8);opacity:0}',
        '30%{transform:scale(1.15);opacity:1}',
        '100%{transform:scale(1.0);opacity:1}',
      '}',
      '.ec-pop{animation:ecPop 0.22s ease-out forwards;}',
      '@keyframes ecCleared{',
        '0%{opacity:0;transform:scale(0.5)}',
        '25%{opacity:1;transform:scale(1.1)}',
        '65%{opacity:1}',
        '100%{opacity:0}',
      '}',
      '#ec-cleared{',
        'position:fixed;top:72px;left:20px;',
        'font-family:"Courier New",monospace;font-weight:bold;',
        'font-size:14px;color:#44ff88;letter-spacing:3px;',
        'pointer-events:none;z-index:371;',
        'display:none;',
      '}',
    ].join('');
    document.head.appendChild(_style);
  }

  function _buildDom() {
    _el = document.createElement('div');
    _el.id = 'ec-wrap';

    var lbl = document.createElement('div');
    lbl.id  = 'ec-label';
    lbl.textContent = 'REMAINING';

    _countEl = document.createElement('div');
    _countEl.id = 'ec-count';
    _countEl.textContent = '—';

    _rateEl = document.createElement('div');
    _rateEl.id = 'ec-rate';
    _rateEl.textContent = '';

    _el.appendChild(lbl);
    _el.appendChild(_countEl);
    _el.appendChild(_rateEl);
    document.body.appendChild(_el);

    var clearEl = document.createElement('div');
    clearEl.id = 'ec-cleared';
    clearEl.textContent = 'CLEARED!';
    document.body.appendChild(clearEl);
  }

  function _colorForCount(n, peak) {
    if (n === 0)  return '#44ff88';
    var pct = peak > 0 ? n / peak : 1;
    if (pct < 0.25) return '#ff4444';
    if (pct < 0.5)  return '#ffcc00';
    return '#ff8888';
  }

  function _showCleared() {
    var el = document.getElementById('ec-cleared');
    if (!el) return;
    el.style.display = 'block';
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = 'ecCleared 1.8s ease-out forwards';
    if (_clearedTimer) clearTimeout(_clearedTimer);
    _clearedTimer = setTimeout(function () { if (el) el.style.display = 'none'; }, 1900);
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    if (_frameN % 6 !== 0) return;   /* 10fps update */
    var dt  = Math.min(0.5, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    var now = ts / 1000;

    var count = 0;
    try {
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var all = Enemies.getAll();
        for (var i = 0; i < all.length; i++) {
          var e = all[i];
          if (e && (e.hp === undefined || e.hp > 0)) count++;
        }
      }
    } catch (er) {}

    /* Track peak for colour scale */
    if (count > _peakCount) _peakCount = count;

    /* Kill events */
    if (_prevCount > count && count >= 0) {
      var killed = _prevCount - count;
      for (var k = 0; k < killed; k++) _killTimes.push(now);
    }
    _killTimes = _killTimes.filter(function (t) { return now - t <= RATE_WINDOW; });

    /* Wave reset — if count jumps up, new wave */
    if (count > _prevCount + 2) _peakCount = count;

    if (_prevCount !== count && _countEl) {
      _countEl.textContent = count;
      _countEl.style.color = _colorForCount(count, _peakCount);
      /* Pop animation on change */
      _countEl.classList.remove('ec-pop');
      void _countEl.offsetWidth;
      _countEl.classList.add('ec-pop');

      if (count === 0 && _prevCount > 0) _showCleared();
    }

    _prevCount = count;

    /* Kill rate */
    if (_rateEl) {
      var rate = _killTimes.length / RATE_WINDOW;
      _rateEl.textContent = rate > 0.05 ? rate.toFixed(1) + '/s' : '';
      _rateEl.style.color = rate > 1 ? '#ff8800' : 'rgba(200,150,150,0.6)';
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

window.EnemyCounter = EnemyCounter;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { EnemyCounter.init(); });
} else {
  EnemyCounter.init();
}