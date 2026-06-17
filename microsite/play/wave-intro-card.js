/* ============================================================
 *  WAVE-INTRO-CARD.JS — Cinematic wave briefing card (passive)
 *
 *  Each new wave triggers a 2.8s briefing card at screen centre:
 *    — WAVE N / STAGE NAME —
 *    OBJECTIVE TEXT
 *    enemies: TYPE × N, TYPE × N …
 *
 *  Card fades in over 0.3s, holds 2.0s, fades out over 0.5s.
 *  Uses `@keyframes wicFade`. Does NOT block gameplay (pointer-events:none).
 *  Reads GameManager.getStageInfo() for stage name + objective, and
 *  Enemies.getAll() for live enemy type counts.
 *
 *  CSS-only. z-index 498 (just below letterbox at 500).
 *  Passive — no keybind.
 * ============================================================ */
var WaveIntroCard = (function () {
  'use strict';

  var HOLD_TIME  = 2.0;
  var FADE_IN    = 0.3;
  var FADE_OUT   = 0.5;
  var TOTAL_LIFE = FADE_IN + HOLD_TIME + FADE_OUT;

  var _init     = false;
  var _el       = null;
  var _waveWas  = -1;
  var _lastTs   = 0;
  var _frameN   = 0;

  /* Scan enemy type distribution */
  function _countTypes() {
    var counts = {};
    try {
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var all = Enemies.getAll();
        for (var i = 0; i < all.length; i++) {
          var e = all[i];
          if (!e || !e.mesh) continue;
          var t = (e.type || 'UNKNOWN').toUpperCase();
          counts[t] = (counts[t] || 0) + 1;
        }
      }
    } catch (er) {}
    return counts;
  }

  function _buildStyle() {
    var style = document.createElement('style');
    style.textContent = [
      '@keyframes wicFadeIn{0%{opacity:0;transform:translate(-50%,-50%) scale(0.94)}',
        '100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}',
      '@keyframes wicFadeOut{0%{opacity:1}100%{opacity:0}}',
      '#wic-wrap{',
        'position:fixed;top:50%;left:50%;',
        'transform:translate(-50%,-50%);',
        'background:rgba(0,4,8,0.82);',
        'border:1px solid rgba(0,200,255,0.20);',
        'border-radius:4px;',
        'padding:18px 34px 20px;',
        'font-family:"Courier New",monospace;',
        'text-align:center;',
        'pointer-events:none;z-index:498;',
        'min-width:320px;max-width:520px;',
        'display:none;',
      '}',
      '#wic-wave{',
        'font-size:9px;letter-spacing:6px;',
        'color:rgba(0,200,255,0.80);margin-bottom:8px;',
      '}',
      '#wic-stage{',
        'font-size:18px;font-weight:bold;letter-spacing:3px;',
        'color:rgba(220,230,220,0.95);margin-bottom:10px;',
      '}',
      '#wic-obj{',
        'font-size:8px;letter-spacing:3px;',
        'color:rgba(180,200,180,0.70);margin-bottom:10px;',
      '}',
      '#wic-enemies{',
        'font-size:8px;letter-spacing:2px;',
        'color:rgba(140,160,140,0.60);',
      '}',
      '#wic-enemies .wic-danger{color:rgba(255,140,40,0.85);}',
    ].join('');
    document.head.appendChild(style);
  }

  function _buildDom() {
    _el = document.createElement('div');
    _el.id = 'wic-wrap';
    _el.innerHTML = [
      '<div id="wic-wave"></div>',
      '<div id="wic-stage"></div>',
      '<div id="wic-obj"></div>',
      '<div id="wic-enemies"></div>',
    ].join('');
    document.body.appendChild(_el);
  }

  var DANGER_TYPES = { SNIPER:1, HEAVY:1, TANK:1, MECH:1, SPETSNAZ:1, WAGNER:1 };

  function _showCard(wave, wavesTotal, stageName, objective, enemyCounts) {
    if (!_el) return;

    /* Wave header */
    var waveEl = document.getElementById('wic-wave');
    var stageEl = document.getElementById('wic-stage');
    var objEl = document.getElementById('wic-obj');
    var enemyEl = document.getElementById('wic-enemies');

    if (waveEl)  waveEl.textContent  = '— WAVE ' + wave + ' / ' + wavesTotal + ' —';
    if (stageEl) stageEl.textContent = (stageName || 'ENGAGEMENT').toUpperCase();
    if (objEl)   objEl.textContent   = objective || 'ELIMINATE ALL HOSTILES';

    /* Enemy type list */
    if (enemyEl) {
      var parts = [];
      for (var t in enemyCounts) {
        var n = enemyCounts[t];
        var isDanger = !!(DANGER_TYPES[t]);
        if (isDanger) {
          parts.push('<span class="wic-danger">' + t + ' ×' + n + ' ⚠</span>');
        } else {
          parts.push(t + ' ×' + n);
        }
      }
      enemyEl.innerHTML = parts.join('  ');
    }

    /* Show with fade-in */
    _el.style.display = 'block';
    _el.style.animation = 'wicFadeIn ' + FADE_IN + 's ease forwards';

    /* Schedule fade-out */
    var el = _el;
    setTimeout(function () {
      if (el) el.style.animation = 'wicFadeOut ' + FADE_OUT + 's ease forwards';
      setTimeout(function () { if (el) { el.style.display = 'none'; el.style.animation = ''; } }, FADE_OUT * 1000);
    }, (FADE_IN + HOLD_TIME) * 1000);
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    if (_frameN % 4 !== 0) return;  /* check every 4th frame */

    try {
      if (typeof GameManager === 'undefined' || !GameManager.getCurrentWave) return;
      var w = GameManager.getCurrentWave();
      if (w !== _waveWas) {
        var prevWas = _waveWas;
        _waveWas = w;
        if (prevWas !== -1 && w > 0) {
          /* Slight delay so enemies have spawned */
          var wave = w;
          setTimeout(function () {
            var info = (GameManager.getStageInfo ? GameManager.getStageInfo() : null) || {};
            var wavesTotal = info.wavesPerStage || '?';
            var stageName  = info.name || '';
            var objective  = info.objective || 'ELIMINATE ALL HOSTILES';
            var counts     = _countTypes();
            _showCard(wave, wavesTotal, stageName, objective, counts);
          }, 200);
        } else {
          _waveWas = w;
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

window.WaveIntroCard = WaveIntroCard;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { WaveIntroCard.init(); });
} else {
  WaveIntroCard.init();
}