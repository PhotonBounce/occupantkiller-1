/* ============================================================
 *  KILL-STREAK.JS — Rapid multi-kill announcer + running tally
 *
 *  Polls Enemies.getAll() for newly dead enemies (WeakSet dedup).
 *  Tracks kills within a sliding 4-second window.
 *  Announces milestones with a centred animated banner.
 *
 *  Thresholds:
 *    2  → DOUBLE KILL      (#44aaff)
 *    3  → TRIPLE KILL      (#44ffaa)
 *    4  → MULTI KILL       (#ffcc44)
 *    5  → ULTRA KILL       (#ff8800)
 *    6  → RAMPAGE          (#ff3322)
 *    7+ → UNSTOPPABLE      (#dd00ff)
 * ============================================================ */
var KillStreak = (function () {
  'use strict';

  /* ── Config ─────────────────────────────── */
  var WINDOW_SEC   = 4.0;  // rolling window for streak
  var DISPLAY_MS   = 2200; // how long banner stays visible

  var STREAKS = [
    { count: 7, label: 'UNSTOPPABLE',  color: '#dd00ff', size: '30px' },
    { count: 6, label: 'RAMPAGE',      color: '#ff3322', size: '28px' },
    { count: 5, label: 'ULTRA KILL',   color: '#ff8800', size: '26px' },
    { count: 4, label: 'MULTI KILL',   color: '#ffcc44', size: '24px' },
    { count: 3, label: 'TRIPLE KILL',  color: '#44ffaa', size: '22px' },
    { count: 2, label: 'DOUBLE KILL',  color: '#44aaff', size: '20px' },
  ];

  /* ── State ──────────────────────────────── */
  var _initialized   = false;
  var _deadSet       = new WeakSet();
  var _killTimes     = [];   // timestamps of recent kills (secs)
  var _bannerEl      = null;
  var _hideTimer     = null;
  var _lastAnnounced = 0;    // count at last announcement (avoid spam)

  /* ── Banner element ─────────────────────── */
  function _buildBanner() {
    var style = document.createElement('style');
    style.textContent = [
      '@keyframes ksSlideIn{from{transform:translate(-50%,-60%) scale(0.6);opacity:0}',
        'to{transform:translate(-50%,-50%) scale(1);opacity:1}}',
      '@keyframes ksPulse{0%,100%{text-shadow:0 0 20px currentColor}',
        '50%{text-shadow:0 0 40px currentColor,0 0 60px currentColor}}',
      '#ks-banner{',
        'display:none;position:fixed;top:38%;left:50%;',
        'transform:translate(-50%,-50%);',
        'font-family:monospace;font-weight:bold;letter-spacing:0.18em;',
        'text-align:center;pointer-events:none;z-index:310;',
        'animation:ksSlideIn 0.25s ease-out,ksPulse 0.6s ease-in-out infinite;',
        'text-transform:uppercase;}',
      '#ks-sub{font-size:12px;letter-spacing:0.3em;margin-top:4px;opacity:0.7;}',
    ].join('');
    document.head.appendChild(style);

    var el = document.createElement('div');
    el.id = 'ks-banner';
    document.body.appendChild(el);
    return el;
  }

  /* ── Show a streak banner ───────────────── */
  function _announce(streak) {
    if (!_bannerEl) _bannerEl = _buildBanner();
    if (_hideTimer) { clearTimeout(_hideTimer); _hideTimer = null; }

    _bannerEl.style.color     = streak.color;
    _bannerEl.style.fontSize  = streak.size;
    _bannerEl.style.animation = 'none';
    // Force reflow to restart animation
    void _bannerEl.offsetWidth;
    _bannerEl.style.animation = 'ksSlideIn 0.25s ease-out, ksPulse 0.6s ease-in-out infinite';

    _bannerEl.innerHTML = streak.label + '<div id="ks-sub">×' + _killTimes.length + '</div>';
    _bannerEl.style.display = 'block';

    // Radio chatter for big kills
    try {
      if (streak.count >= 4 && window.Feedback && Feedback.radioChatter) {
        Feedback.radioChatter('multi_kill');
      }
    } catch(e) {}

    _hideTimer = setTimeout(function () {
      _bannerEl.style.display = 'none';
      _lastAnnounced = 0;
    }, DISPLAY_MS);
  }

  /* ── Update ──────────────────────────────── */
  function update(dt) {
    var now = performance.now() / 1000;

    /* Prune old kills outside the window */
    var cutoff = now - WINDOW_SEC;
    while (_killTimes.length && _killTimes[0] < cutoff) { _killTimes.shift(); }

    /* Scan for newly dead enemies */
    var newKills = 0;
    try {
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var all = Enemies.getAll();
        for (var i = 0; i < all.length; i++) {
          var e = all[i];
          if (!e || !e.mesh) continue;
          if (e.dead && !_deadSet.has(e)) {
            _deadSet.add(e);
            _killTimes.push(now);
            newKills++;
          }
        }
      }
    } catch(err) {}

    /* Announce if kill count crossed a threshold this frame */
    if (newKills > 0) {
      var count = _killTimes.length;
      for (var s = 0; s < STREAKS.length; s++) {
        if (count >= STREAKS[s].count && count > _lastAnnounced) {
          _lastAnnounced = count;
          _announce(STREAKS[s]);
          break;
        }
      }
    }
  }

  /* ── Init ──────────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;

    _bannerEl = _buildBanner();

    var _last = performance.now();
    function _tick(ts) {
      var dt = Math.min(0.1, (ts - _last) / 1000);
      _last  = ts;
      update(dt);
      requestAnimationFrame(_tick);
    }
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.KillStreak = KillStreak;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { KillStreak.init(); });
} else {
  KillStreak.init();
}
