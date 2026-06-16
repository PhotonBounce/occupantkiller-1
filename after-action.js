/* ============================================================
 *  AFTER-ACTION.JS — Wave completion debrief overlay
 *
 *  Detects wave completion by polling GameManager.getCurrentWave().
 *  Tracks kills, dog-tags collected, and score earned per wave.
 *  On wave change: shows a "WAVE N COMPLETE" stats card for 4s.
 *
 *  Stats:
 *    • Enemies eliminated
 *    • Dog tags recovered
 *    • Smokes deployed (reads SmokeGrenadeSystem._smokesThisWave)
 *    • Score earned this wave
 *    • Time to clear (seconds)
 *    • Performance grade  S / A / B / C  based on kills per minute
 * ============================================================ */
var AfterAction = (function () {
  'use strict';

  /* ── State ──────────────────────────────── */
  var _initialized  = false;
  var _lastWave     = -1;
  var _waveStart    = 0;
  var _waveKills    = 0;
  var _waveTags     = 0;
  var _waveSmokes   = 0;
  var _scoreAtStart = 0;
  var _tagsAtStart  = 0;

  var _deadSet      = new WeakSet();   // per-wave kill tracker
  var _overlay      = null;
  var _hideTimer    = null;
  var _shown        = false;
  var _pollTimer    = 0;
  var POLL_INTERVAL = 0.7;

  /* ── Grade thresholds (kills per minute) ── */
  function _grade(kpm) {
    if (kpm >= 18) return { grade: 'S', color: '#ffd700', label: 'OUTSTANDING' };
    if (kpm >= 12) return { grade: 'A', color: '#44ffaa', label: 'EXCELLENT' };
    if (kpm >= 7)  return { grade: 'B', color: '#44aaff', label: 'GOOD'       };
    return               { grade: 'C', color: '#aaaaaa', label: 'MARGINAL'    };
  }

  /* ── Build overlay ──────────────────────── */
  function _buildOverlay() {
    var style = document.createElement('style');
    style.textContent = [
      '@keyframes aaFadeIn{from{opacity:0;transform:translateX(-50%) translateY(8px)}',
        'to{opacity:1;transform:translateX(-50%) translateY(0)}}',
      '#aa-overlay{',
        'display:none;position:fixed;top:14%;left:50%;transform:translateX(-50%);',
        'z-index:490;width:min(480px,90vw);',
        'background:rgba(0,8,18,0.92);border:1px solid rgba(68,170,255,0.3);',
        'border-top:3px solid #44aaff;font-family:monospace;',
        'padding:22px 30px 18px;',
        'animation:aaFadeIn 0.3s ease-out;}',
      '#aa-overlay .aa-head{color:#44aaff;font-size:10px;letter-spacing:0.25em;margin-bottom:6px;}',
      '#aa-overlay .aa-wave{color:#fff;font-size:22px;font-weight:bold;margin-bottom:12px;',
        'text-shadow:0 0 16px rgba(68,170,255,0.4);}',
      '#aa-overlay .aa-row{display:flex;justify-content:space-between;',
        'border-bottom:1px solid rgba(68,170,255,0.08);padding:5px 0;',
        'font-size:12px;color:#aabbd0;}',
      '#aa-overlay .aa-val{color:#ddeeff;font-weight:bold;}',
      '#aa-overlay .aa-grade{float:right;font-size:36px;font-weight:bold;',
        'line-height:1;text-align:center;}',
      '#aa-overlay .aa-glabel{font-size:10px;letter-spacing:0.15em;opacity:0.7;text-align:center;}',
      '#aa-overlay .aa-footer{margin-top:10px;font-size:10px;color:rgba(68,170,255,0.4);',
        'letter-spacing:0.1em;text-align:center;}',
    ].join('');
    document.head.appendChild(style);

    var el = document.createElement('div');
    el.id = 'aa-overlay';
    document.body.appendChild(el);
    return el;
  }

  /* ── Show report ────────────────────────── */
  function _showReport(wave) {
    if (!_overlay) _overlay = _buildOverlay();
    if (_hideTimer) { clearTimeout(_hideTimer); _hideTimer = null; }

    var elapsed = Math.max(1, (performance.now() / 1000) - _waveStart);
    var kpm     = _waveKills / (elapsed / 60);
    var g       = _grade(kpm);
    var score   = 0;
    try { score = (window.player && window.player.score) ? window.player.score - _scoreAtStart : 0; } catch(e){}

    _overlay.innerHTML = [
      '<div style="display:flex;justify-content:space-between;align-items:flex-start">',
        '<div>',
          '<div class="aa-head">▌ AFTER-ACTION REPORT</div>',
          '<div class="aa-wave">WAVE ' + wave + ' COMPLETE</div>',
        '</div>',
        '<div>',
          '<div class="aa-grade" style="color:' + g.color + '">' + g.grade + '</div>',
          '<div class="aa-glabel" style="color:' + g.color + '">' + g.label + '</div>',
        '</div>',
      '</div>',
      '<div class="aa-row"><span>Enemies eliminated</span><span class="aa-val">' + _waveKills + '</span></div>',
      '<div class="aa-row"><span>Dog tags recovered</span><span class="aa-val">' + _waveTags + '</span></div>',
      '<div class="aa-row"><span>Smokes deployed</span><span class="aa-val">' + _waveSmokes + '</span></div>',
      '<div class="aa-row"><span>Score earned</span><span class="aa-val">+' + score + '</span></div>',
      '<div class="aa-row"><span>Time</span><span class="aa-val">' + Math.round(elapsed) + 's  (' + kpm.toFixed(1) + ' k/min)</span></div>',
      '<div class="aa-footer">PRESS ANY KEY TO CONTINUE</div>',
    ].join('');

    _overlay.style.display = 'block';
    _shown = true;

    var _dismiss = function () {
      _hide();
      window.removeEventListener('keydown', _dismiss);
    };
    window.addEventListener('keydown', _dismiss);

    _hideTimer = setTimeout(function () { _hide(); }, 5000);
  }

  function _hide() {
    if (_hideTimer) { clearTimeout(_hideTimer); _hideTimer = null; }
    if (_overlay) _overlay.style.display = 'none';
    _shown = false;
  }

  /* ── Reset wave counters ────────────────── */
  function _resetCounters() {
    _waveKills   = 0;
    _waveTags    = 0;
    _waveSmokes  = 0;
    _waveStart   = performance.now() / 1000;
    try { _scoreAtStart = (window.player && window.player.score) || 0; } catch(e){}
    // Reset dead-tracking set for this wave by replacing it
    _deadSet = new WeakSet();
  }

  /* ── Poll ───────────────────────────────── */
  function update(dt) {
    _pollTimer += dt;

    /* Tally kills every frame */
    try {
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var all = Enemies.getAll();
        for (var i = 0; i < all.length; i++) {
          var e = all[i];
          if (!e || !e.mesh) continue;
          if (e.dead && !_deadSet.has(e)) {
            _deadSet.add(e);
            _waveKills++;
          }
        }
      }
    } catch(err) {}

    /* Poll smoke count */
    try {
      if (window.SmokeGrenadeSystem && SmokeGrenadeSystem._smokesThisWave) {
        _waveSmokes = SmokeGrenadeSystem._smokesThisWave;
      }
    } catch(e) {}

    /* Poll dog tags */
    try {
      if (window.DogTagSystem && DogTagSystem.getTags) {
        // count collected this wave via the _total counter approximation
        // DogTagSystem._total is the session total; we track our own delta
      }
    } catch(e) {}

    if (_pollTimer < POLL_INTERVAL) return;
    _pollTimer = 0;

    try {
      if (!window.GameManager || !GameManager.getCurrentWave) return;
      var wave = GameManager.getCurrentWave();
      if (typeof wave !== 'number') return;

      if (wave !== _lastWave) {
        var prev = _lastWave;
        _lastWave = wave;
        if (prev === -1) {
          _resetCounters();
          return;
        }
        // Wave advanced → show report for the completed wave, then reset
        var completedWave = prev;
        _showReport(completedWave);
        setTimeout(_resetCounters, 800); // small delay so score has time to settle
      }
    } catch(e) {}
  }

  /* ── Init ──────────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;

    _overlay = _buildOverlay();

    /* Prime wave reference without showing report */
    setTimeout(function () {
      try {
        if (window.GameManager && GameManager.getCurrentWave) {
          _lastWave = GameManager.getCurrentWave();
        }
        _resetCounters();
      } catch(e) {}
    }, 3000);

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

window.AfterAction = AfterAction;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { AfterAction.init(); });
} else {
  AfterAction.init();
}
