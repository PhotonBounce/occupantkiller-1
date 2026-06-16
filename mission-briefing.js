/* ============================================================
 *  MISSION-BRIEFING.JS — Full-screen pre-mission intel overlay
 *
 *  Detects stage changes via GameManager.getCurrentStage() poll.
 *  On new stage: shows a cinematic full-screen briefing card with:
 *    • Stage name + classification header
 *    • Description / historical context
 *    • Objective
 *    • Suggested weapons (hintWeapons)
 *    • 4-second auto-deploy countdown (or click to skip)
 *  First stage on initial game start is suppressed (game already
 *  has its own intro flow).
 * ============================================================ */
var MissionBriefing = (function () {
  'use strict';

  /* ── State ─────────────────────────────── */
  var _initialized  = false;
  var _lastStage    = -1;
  var _overlay      = null;
  var _countdownInt = null;
  var _pollTimer    = 0;
  var POLL_INTERVAL = 0.8;
  var _shown        = false; // overlay currently visible

  /* ── Historical context bank ──────────────
     Keyed by stage name substring (lowercased). Falls back to description. */
  var HISTORY = {
    'hostomel':   'Feb 24, 2022 — Russian VDV attempted to seize Hostomel (Antonov) Airport to open an air corridor for armoured columns heading to Kyiv. Ukrainian forces repelled the assault within hours.',
    'avdiivka':   'One of the longest and bloodiest battles of the war. Russia committed tens of thousands of troops to take the industrial town of Avdiivka. Ukrainian defenders held for nearly two years.',
    'bakhmut':    'Wagner PMC led a grinding 9-month siege of Bakhmut. The city was reduced to rubble — dubbed "a meat grinder" by Russian commanders themselves.',
    'kherson':    'Nov 11, 2022 — Ukraine liberated Kherson in a dramatic offensive, forcing Russian troops to withdraw across the Dnipro River. The only regional capital recaptured in the war.',
    'mariupol':   'March–May 2022 — The Azovstal steel plant became the last stand of the Azov Regiment and Ukrainian Marines. Their defence held for 86 days against an overwhelming siege.',
    'kerch':      'Oct 8, 2022 — A massive explosion tore through the Kerch Strait Bridge — the only land link from Russia to occupied Crimea — disrupting Russian logistics for months.',
    'chornobyl':  'Russian troops occupied the Chornobyl exclusion zone in the first days of the invasion, reportedly digging trenches in the highly radioactive Red Forest.',
    'moscow':     'Ukrainian drone strikes have repeatedly hit sites inside Russia, including Moscow itself, signalling the war has come to Russian soil.',
    'sevastopol': 'Ukraine has struck Sevastopol Naval Base multiple times with naval drones and missiles, severely degrading Russia\'s Black Sea Fleet.',
    'kyiv':       'Russia\'s initial goal was to seize Kyiv and decapitate Ukraine\'s government within 72 hours. Ukrainian resistance shattered that plan, forcing a full Russian withdrawal by April 2022.',
    'kharkiv':    'Ukraine\'s second-largest city was shelled from the first day of the invasion. A stunning Ukrainian counter-offensive in Sep 2022 recaptured thousands of square km in Kharkiv Oblast.',
    'zaporizhzhia': 'Home to Europe\'s largest nuclear power plant. Russian forces have shelled the plant multiple times, raising fears of a nuclear disaster.',
    'melitopol':  'A key Russian logistics hub. Ukrainian sabotage operations have repeatedly disrupted supply lines through occupied Melitopol.',
    'luhansk':    'Russian-controlled since 2022. Ukrainian cross-border strikes and partisan operations continue to target Russian command positions.',
    'antonov':    'The Antonov Airport confrontation opened the war. Russia\'s airborne assault on the "gateway to Kyiv" ended in failure.',
    'treeline':   'Ukraine\'s 47th Separate Mechanized Brigade operates M2A2 Bradley IFVs along the contact line, using their 25mm Bushmaster to systematically rake Russian-held treelines.',
  };

  function _getHistory(stageName) {
    var lower = (stageName || '').toLowerCase();
    for (var key in HISTORY) {
      if (HISTORY.hasOwnProperty(key) && lower.indexOf(key) !== -1) {
        return HISTORY[key];
      }
    }
    return null;
  }

  /* ── Build the overlay element ────────────── */
  function _buildOverlay() {
    var el = document.createElement('div');
    el.id = 'mission-briefing-overlay';
    el.style.cssText = [
      'display:none;position:fixed;top:0;left:0;right:0;bottom:0;z-index:500;',
      'background:rgba(0,0,0,0.93);color:#ccc;font-family:monospace;',
      'flex-direction:column;align-items:center;justify-content:center;',
      'animation:mbFadeIn 0.4s ease-out;overflow:hidden;',
    ].join('');

    // CSS animations
    var style = document.createElement('style');
    style.textContent = [
      '@keyframes mbFadeIn{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}',
      '@keyframes mbScanLine{0%{top:-4px}100%{top:100%}}',
      '@keyframes mbBlink{0%,100%{opacity:1}50%{opacity:0}}',
      '#mission-briefing-overlay .mb-card{max-width:740px;width:90%;padding:36px 40px;',
        'border:1px solid rgba(68,170,255,0.3);border-top:3px solid #44aaff;',
        'background:rgba(0,10,20,0.85);position:relative;overflow:hidden;}',
      '#mission-briefing-overlay .mb-scan{position:absolute;top:0;left:0;right:0;height:4px;',
        'background:rgba(68,170,255,0.15);animation:mbScanLine 3s linear infinite;}',
      '#mission-briefing-overlay .mb-class{color:#44aaff;font-size:10px;letter-spacing:0.25em;margin-bottom:8px;}',
      '#mission-briefing-overlay .mb-name{color:#fff;font-size:28px;font-weight:bold;margin-bottom:4px;',
        'text-shadow:0 0 20px rgba(68,170,255,0.5);}',
      '#mission-briefing-overlay .mb-sep{height:1px;background:rgba(68,170,255,0.25);margin:16px 0;}',
      '#mission-briefing-overlay .mb-section{color:#88aacc;font-size:10px;letter-spacing:0.18em;margin-bottom:6px;}',
      '#mission-briefing-overlay .mb-text{color:#ccd;font-size:13px;line-height:1.6;margin-bottom:14px;}',
      '#mission-briefing-overlay .mb-obj{color:#44ffaa;font-size:13px;line-height:1.6;margin-bottom:14px;}',
      '#mission-briefing-overlay .mb-weapons{color:#ffcc44;font-size:12px;margin-bottom:18px;}',
      '#mission-briefing-overlay .mb-footer{display:flex;justify-content:space-between;align-items:center;',
        'border-top:1px solid rgba(68,170,255,0.2);padding-top:14px;}',
      '#mission-briefing-overlay .mb-deploy{',
        'background:rgba(68,170,255,0.15);border:1px solid #44aaff;color:#44aaff;',
        'font-family:monospace;font-size:13px;font-weight:bold;padding:8px 28px;',
        'cursor:pointer;letter-spacing:0.1em;',
        'transition:background 0.2s,color 0.2s;}',
      '#mission-briefing-overlay .mb-deploy:hover{background:#44aaff;color:#000;}',
      '#mission-briefing-overlay .mb-timer{color:#44aaff;font-size:12px;letter-spacing:0.1em;}',
    ].join('');
    document.head.appendChild(style);

    document.body.appendChild(el);
    return el;
  }

  /* ── Show briefing for a stage object ─────── */
  function show(stageInfo) {
    if (!_overlay) _overlay = _buildOverlay();
    if (_shown) _hide();

    var name     = stageInfo.name        || 'UNKNOWN SECTOR';
    var desc     = stageInfo.description || '';
    var obj      = stageInfo.objective   || '';
    var weapons  = (stageInfo.hintWeapons || []).join(' · ');
    var history  = _getHistory(name) || desc;
    var countdown = 5;

    // Build inner HTML
    _overlay.style.display = 'flex';
    _overlay.innerHTML = '<div class="mb-card">' +
      '<div class="mb-scan"></div>' +
      '<div class="mb-class">▌ CLASSIFIED — MISSION BRIEFING</div>' +
      '<div class="mb-name">' + name + '</div>' +
      '<div class="mb-sep"></div>' +
      (history ? '<div class="mb-section">INTELLIGENCE SUMMARY</div><div class="mb-text">' + history + '</div>' : '') +
      '<div class="mb-section">PRIMARY OBJECTIVE</div>' +
      '<div class="mb-obj">▶ ' + obj + '</div>' +
      (weapons ? '<div class="mb-section">RECOMMENDED LOADOUT</div><div class="mb-weapons">◆ ' + weapons + '</div>' : '') +
      '<div class="mb-footer">' +
        '<button class="mb-deploy" id="mb-deploy-btn">[ DEPLOY ]</button>' +
        '<span class="mb-timer" id="mb-timer">AUTO-DEPLOY IN <span id="mb-countdown">' + countdown + '</span>s</span>' +
      '</div>' +
      '</div>';

    _shown = true;

    // Countdown
    var timerEl = document.getElementById('mb-countdown');
    _countdownInt = setInterval(function () {
      countdown--;
      if (timerEl) timerEl.textContent = countdown;
      if (countdown <= 0) { _hide(); }
    }, 1000);

    // Deploy button
    var btn = document.getElementById('mb-deploy-btn');
    if (btn) btn.addEventListener('click', function () { _hide(); });

    // ESC to skip
    var _escHandler = function (e) {
      if (e.key === 'Escape' || e.key === 'Enter' || e.code === 'Space') {
        _hide();
        window.removeEventListener('keydown', _escHandler);
      }
    };
    window.addEventListener('keydown', _escHandler);
  }

  function _hide() {
    if (_countdownInt) { clearInterval(_countdownInt); _countdownInt = null; }
    if (_overlay) _overlay.style.display = 'none';
    _shown = false;
  }

  /* ── Poll for stage change ─────────────────── */
  function update(dt) {
    _pollTimer += dt;
    if (_pollTimer < POLL_INTERVAL) return;
    _pollTimer = 0;

    try {
      if (!window.GameManager || !GameManager.getCurrentStage) return;
      var stageIdx = GameManager.getCurrentStage();
      if (typeof stageIdx !== 'number') return;

      if (stageIdx !== _lastStage) {
        var prevStage = _lastStage;
        _lastStage = stageIdx;
        // Skip briefing on very first detection (game just loaded, user hasn't started)
        if (prevStage === -1) return;
        // Show briefing if game is playing
        var state = GameManager.getState ? GameManager.getState() : null;
        if (state && state !== 'playing' && state !== 'waveClear') return;
        var info = GameManager.getStageInfo ? null : null;
        // Get stage info from the currently playing stage
        try {
          if (GameManager.getStageInfo) {
            // getStageInfo returns STAGES[currentStage] after the change
            info = GameManager.getStageInfo();
          }
        } catch(e) {}
        if (info && info.name) {
          // Brief delay so the world finishes loading before we show briefing
          setTimeout(function () { if (!_shown) show(info); }, 600);
        }
      }
    } catch(e) {}
  }

  /* ── Init ──────────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;

    _overlay = _buildOverlay();

    // Set last stage to current so we don't brief on very first load
    setTimeout(function () {
      try {
        if (window.GameManager && GameManager.getCurrentStage) {
          _lastStage = GameManager.getCurrentStage();
        }
      } catch(e) {}
    }, 2500);

    var _last = performance.now();
    function _tick(ts) {
      var dt = Math.min(0.1, (ts - _last) / 1000);
      _last  = ts;
      update(dt);
      requestAnimationFrame(_tick);
    }
    requestAnimationFrame(_tick);
  }

  return { init: init, show: show };
})();

window.MissionBriefing = MissionBriefing;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { MissionBriefing.init(); });
} else {
  MissionBriefing.init();
}
