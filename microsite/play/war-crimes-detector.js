/* war-crimes-detector.js — Ethical decision tracker with karma/consequence system
 * Tracks violations and honors, affects gameplay via karma level.
 * Follows project convention: all var, IIFE, window.WarCrimesDetector
 */
window.WarCrimesDetector = (function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────── */

  var KARMA_MIN = -500;
  var KARMA_MAX = 500;

  var VIOLATIONS = {
    CIVILIAN_KILL:        { karma: -50,  label: 'Civilian Killed',          flash: 'red'    },
    WOUNDED_KILL:         { karma: -30,  label: 'Wounded/Surrendered Killed', flash: 'orange' },
    PROPERTY_DESTRUCTION: { karma: -10,  label: 'Excessive Property Destruction', flash: null },
    CHEMICAL_USE:         { karma: -80,  label: 'Chemical Weapon Near Civilians', flash: 'red' },
    MEDIC_ATTACK:         { karma: -100, label: 'Medic Attacked',           flash: 'red'    }
  };

  var HONORS = {
    PRISONER_SPARED:    { karma: +30,  label: 'Prisoner Spared',              flash: 'blue', score: 0   },
    CIVILIAN_SAVED:     { karma: +50,  label: 'Civilian Saved',               flash: null,   score: 0   },
    WOUNDED_AIDED:      { karma: +25,  label: 'Wounded Enemy Aided',          flash: 'blue', score: 50  },
    PROPORTIONAL_FORCE: { karma: +100, label: 'Proportional Force Maintained', flash: null,  score: 0   }
  };

  var KARMA_LEVELS = [
    { name: 'HERO',         min: 300,  max: 500,  color: '#00ccff' },
    { name: 'HONORABLE',    min: 0,    max: 300,  color: '#44ff88' },
    { name: 'NEUTRAL',      min: -100, max: 0,    color: '#cccccc' },
    { name: 'QUESTIONABLE', min: -200, max: -100, color: '#ffaa00' },
    { name: 'WAR_CRIMINAL', min: -500, max: -200, color: '#ff2222' }
  ];

  /* ── State ──────────────────────────────────────────────────── */

  var karma = 0;
  var eventLog = [];       // all events this mission
  var recentLog = [];      // last 3 for HUD
  var scoreBonus = 0;
  var iccWarrantActive = false;
  var iccSquadSpawned = false;
  var flashTimer = 0;
  var flashColor = null;

  var sceneRef = null;
  var cameraRef = null;

  var hudEl = null;
  var flashEl = null;
  var iccIconEl = null;
  var summaryEl = null;

  /* ── Helpers ─────────────────────────────────────────────────── */

  function clamp(val, lo, hi) {
    return val < lo ? lo : val > hi ? hi : val;
  }

  function getKarmaLevel() {
    var i;
    for (i = 0; i < KARMA_LEVELS.length; i++) {
      if (karma >= KARMA_LEVELS[i].min) {
        return KARMA_LEVELS[i];
      }
    }
    return KARMA_LEVELS[KARMA_LEVELS.length - 1];
  }

  function getKarma() {
    return karma;
  }

  function applyKarmaDelta(delta) {
    karma = clamp(karma + delta, KARMA_MIN, KARMA_MAX);
    updateIccWarrant();
    updateHud();
  }

  function pushEvent(type, label, delta, isViolation) {
    var entry = {
      type: type,
      label: label,
      delta: delta,
      isViolation: isViolation,
      time: Date.now()
    };
    eventLog.push(entry);
    recentLog.push(entry);
    if (recentLog.length > 3) {
      recentLog.shift();
    }
  }

  function triggerFlash(color) {
    if (!flashEl || !color) return;
    flashColor = color;
    flashTimer = 0.4; // seconds
    flashEl.style.background = color === 'red'    ? 'rgba(255,0,0,0.35)'
                             : color === 'orange' ? 'rgba(255,140,0,0.35)'
                             : color === 'blue'   ? 'rgba(0,120,255,0.30)'
                             : 'rgba(255,255,255,0.20)';
    flashEl.style.opacity = '1';
    flashEl.style.pointerEvents = 'none';
    flashEl.style.display = 'block';
  }

  /* ── ICC Warrant ─────────────────────────────────────────────── */

  function updateIccWarrant() {
    var level = getKarmaLevel();
    iccWarrantActive = (level.name === 'WAR_CRIMINAL');

    if (iccIconEl) {
      iccIconEl.style.display = iccWarrantActive ? 'block' : 'none';
    }

    if (iccWarrantActive && !iccSquadSpawned) {
      spawnIccSquad();
    }
    if (!iccWarrantActive) {
      iccSquadSpawned = false;
    }
  }

  function spawnIccSquad() {
    iccSquadSpawned = true;
    // Notify external systems that the ICC tribunal squad should spawn
    if (window.EnemySquads && typeof window.EnemySquads.spawnSpecialSquad === 'function') {
      window.EnemySquads.spawnSpecialSquad('ICC_TRIBUNAL');
    }
    // Dispatch a custom event for any listeners
    var ev;
    try {
      ev = new CustomEvent('warcrimes:icc_warrant', { detail: { karma: karma } });
      window.dispatchEvent(ev);
    } catch (e) { /* older browsers */ }
    pushEvent('ICC_WARRANT', 'ICC Warrant Issued — Tribunal squad hunting you', 0, true);
    updateHud();
  }

  /* ── Gameplay Effects ────────────────────────────────────────── */

  function getScoreMultiplier() {
    var level = getKarmaLevel();
    if (level.name === 'HERO')         return 1.20;
    if (level.name === 'HONORABLE')    return 1.05;
    if (level.name === 'NEUTRAL')      return 1.00;
    if (level.name === 'QUESTIONABLE') return 0.90;
    if (level.name === 'WAR_CRIMINAL') return 0.80;
    return 1.00;
  }

  function getEnemyHpMultiplier() {
    var level = getKarmaLevel();
    if (level.name === 'WAR_CRIMINAL') return 1.30;
    return 1.00;
  }

  function isFriendlySupportAvailable() {
    var level = getKarmaLevel();
    if (level.name === 'WAR_CRIMINAL') return false;
    if (level.name === 'QUESTIONABLE') {
      return Math.random() > 0.20; // 20% chance refusal
    }
    return true;
  }

  function isAmmoFreeFromFriendlies() {
    var level = getKarmaLevel();
    return level.name === 'HERO';
  }

  function hasCivilianTipoffs() {
    var level = getKarmaLevel();
    return level.name === 'HERO';
  }

  /* ── HUD ─────────────────────────────────────────────────────── */

  function createHud() {
    // Karma HUD container (top-left)
    hudEl = document.createElement('div');
    hudEl.id = 'wcd-karma-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:12px',
      'z-index:9800',
      'background:rgba(0,0,0,0.65)',
      'border:1px solid rgba(255,255,255,0.18)',
      'border-radius:6px',
      'padding:8px 12px',
      'min-width:220px',
      'font-family:monospace',
      'font-size:13px',
      'color:#eee',
      'pointer-events:none',
      'user-select:none'
    ].join(';');
    document.body.appendChild(hudEl);

    // Full-screen flash overlay
    flashEl = document.createElement('div');
    flashEl.id = 'wcd-flash';
    flashEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100vw',
      'height:100vh',
      'z-index:9700',
      'display:none',
      'pointer-events:none',
      'transition:opacity 0.3s ease-out'
    ].join(';');
    document.body.appendChild(flashEl);

    // ICC Warrant icon (top-right corner)
    iccIconEl = document.createElement('div');
    iccIconEl.id = 'wcd-icc-icon';
    iccIconEl.innerHTML = '&#9878; ICC WARRANT';
    iccIconEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'right:12px',
      'z-index:9800',
      'background:rgba(180,0,0,0.85)',
      'color:#fff',
      'border:2px solid #ff4444',
      'border-radius:5px',
      'padding:6px 12px',
      'font-family:monospace',
      'font-size:14px',
      'font-weight:bold',
      'display:none',
      'animation:wcd-pulse 1.2s infinite',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(iccIconEl);

    // Inject keyframe animation for ICC icon
    var styleTag = document.createElement('style');
    styleTag.textContent = '@keyframes wcd-pulse{0%{opacity:1;}50%{opacity:0.55;}100%{opacity:1;}}';
    document.head.appendChild(styleTag);

    updateHud();
  }

  function updateHud() {
    if (!hudEl) return;
    var level = getKarmaLevel();
    var bar = buildKarmaBar();
    var recentHtml = buildRecentLog();

    hudEl.innerHTML =
      '<div style="font-size:11px;color:#aaa;margin-bottom:2px;letter-spacing:1px">KARMA</div>' +
      bar +
      '<div style="margin-top:5px;font-size:14px;font-weight:bold;color:' + level.color + '">' + level.name + '</div>' +
      '<div style="margin-top:2px;font-size:12px;color:#bbb">Score x' + getScoreMultiplier().toFixed(2) + '</div>' +
      recentHtml;
  }

  function buildKarmaBar() {
    var level = getKarmaLevel();
    var pct = ((karma - KARMA_MIN) / (KARMA_MAX - KARMA_MIN)) * 100;
    pct = clamp(pct, 0, 100);
    return '<div style="background:#222;border:1px solid #555;border-radius:3px;height:10px;width:196px;margin-top:4px">' +
           '<div style="height:100%;width:' + pct.toFixed(1) + '%;background:' + level.color + ';border-radius:3px;transition:width 0.3s"></div>' +
           '</div>' +
           '<div style="font-size:12px;color:#ccc;margin-top:2px">' + (karma >= 0 ? '+' : '') + karma + ' / ' + KARMA_MAX + '</div>';
  }

  function buildRecentLog() {
    if (recentLog.length === 0) return '';
    var html = '<div style="margin-top:6px;border-top:1px solid #444;padding-top:4px;font-size:11px">';
    var i;
    for (i = recentLog.length - 1; i >= 0; i--) {
      var e = recentLog[i];
      var sign = e.delta > 0 ? '+' : '';
      var col  = e.isViolation ? '#ff6666' : '#66ccff';
      html += '<div style="color:' + col + ';margin-top:2px">' +
              (e.delta !== 0 ? '[' + sign + e.delta + '] ' : '') +
              e.label + '</div>';
    }
    html += '</div>';
    return html;
  }

  /* ── Summary Screen ──────────────────────────────────────────── */

  function showSummary() {
    if (summaryEl) removeSummary();

    summaryEl = document.createElement('div');
    summaryEl.id = 'wcd-summary';
    summaryEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100vw',
      'height:100vh',
      'z-index:10000',
      'background:rgba(0,0,0,0.88)',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'font-family:monospace',
      'color:#eee'
    ].join(';');

    var level = getKarmaLevel();
    var violations = eventLog.filter(function(e) { return e.isViolation; });
    var honors = eventLog.filter(function(e) { return !e.isViolation; });

    var vHtml = '';
    var i;
    for (i = 0; i < violations.length; i++) {
      vHtml += '<div style="color:#ff6666;margin:2px 0">' + violations[i].label + ' [' + violations[i].delta + ']</div>';
    }
    if (!vHtml) vHtml = '<div style="color:#888">No violations recorded.</div>';

    var hHtml = '';
    for (i = 0; i < honors.length; i++) {
      hHtml += '<div style="color:#66ccff;margin:2px 0">' + honors[i].label + ' [+' + honors[i].delta + ']</div>';
    }
    if (!hHtml) hHtml = '<div style="color:#888">No honors recorded.</div>';

    summaryEl.innerHTML =
      '<div style="max-width:520px;width:90%;background:rgba(20,20,30,0.95);border:1px solid #444;border-radius:10px;padding:32px 28px">' +
        '<h2 style="text-align:center;margin:0 0 6px;font-size:22px;letter-spacing:2px;color:' + level.color + '">MISSION CONDUCT REVIEW</h2>' +
        '<div style="text-align:center;font-size:16px;margin-bottom:18px;color:' + level.color + '">' + level.name + '</div>' +
        '<div style="font-size:24px;text-align:center;margin-bottom:18px;color:' + level.color + '">' +
          (karma >= 0 ? '+' : '') + karma + ' Karma' +
        '</div>' +
        '<div style="display:flex;gap:24px">' +
          '<div style="flex:1">' +
            '<div style="font-size:13px;color:#ff8888;letter-spacing:1px;margin-bottom:6px">VIOLATIONS</div>' +
            vHtml +
          '</div>' +
          '<div style="flex:1">' +
            '<div style="font-size:13px;color:#88ccff;letter-spacing:1px;margin-bottom:6px">HONORS</div>' +
            hHtml +
          '</div>' +
        '</div>' +
        '<div style="text-align:center;margin-top:24px">' +
          '<button id="wcd-close-summary" style="background:#333;color:#eee;border:1px solid #666;border-radius:4px;padding:8px 28px;font-family:monospace;font-size:14px;cursor:pointer">CLOSE</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(summaryEl);

    var closeBtn = document.getElementById('wcd-close-summary');
    if (closeBtn) {
      closeBtn.addEventListener('click', removeSummary);
    }
  }

  function removeSummary() {
    if (summaryEl && summaryEl.parentNode) {
      summaryEl.parentNode.removeChild(summaryEl);
    }
    summaryEl = null;
  }

  /* ── Public: recordViolation ─────────────────────────────────── */

  function recordViolation(type) {
    var def = VIOLATIONS[type];
    if (!def) {
      console.warn('[WarCrimesDetector] Unknown violation type:', type);
      return;
    }
    applyKarmaDelta(def.karma);
    pushEvent(type, def.label, def.karma, true);
    if (def.flash) triggerFlash(def.flash);
    updateHud();
  }

  /* ── Public: recordHonor ─────────────────────────────────────── */

  function recordHonor(type) {
    var def = HONORS[type];
    if (!def) {
      console.warn('[WarCrimesDetector] Unknown honor type:', type);
      return;
    }
    applyKarmaDelta(def.karma);
    scoreBonus += def.score;
    pushEvent(type, def.label, def.karma, false);
    if (def.flash) triggerFlash(def.flash);

    if (def.score > 0 && window._score !== undefined) {
      window._score += def.score;
    }
    updateHud();
  }

  /* ── Public: init ────────────────────────────────────────────── */

  function init(scene, camera) {
    sceneRef  = scene  || null;
    cameraRef = camera || null;

    createHud();
    updateIccWarrant();

    // Listen for F-key wounded-aid events from external systems
    window.addEventListener('warcrimes:wounded_aided', function () {
      recordHonor('WOUNDED_AIDED');
    });

    // Expose gameplay-effect helpers globally for other modules
    window.WarCrimesEffects = {
      getScoreMultiplier:        getScoreMultiplier,
      getEnemyHpMultiplier:      getEnemyHpMultiplier,
      isFriendlySupportAvailable: isFriendlySupportAvailable,
      isAmmoFreeFromFriendlies:  isAmmoFreeFromFriendlies,
      hasCivilianTipoffs:        hasCivilianTipoffs,
      showSummary:               showSummary
    };
  }

  /* ── Public: update ──────────────────────────────────────────── */

  function update(delta) {
    // Tick flash overlay
    if (flashTimer > 0 && flashEl) {
      flashTimer -= delta;
      if (flashTimer <= 0) {
        flashTimer = 0;
        flashEl.style.opacity = '0';
        // Hide after transition
        (function (el) {
          setTimeout(function () { el.style.display = 'none'; }, 350);
        })(flashEl);
      }
    }

    // Apply score multiplier each frame via window._scoreMultiplier
    window._scoreMultiplier = getScoreMultiplier();
    window._enemyHpMultiplier = getEnemyHpMultiplier();
  }

  /* ── Public: reset ───────────────────────────────────────────── */

  function reset() {
    karma            = 0;
    eventLog         = [];
    recentLog        = [];
    scoreBonus       = 0;
    iccWarrantActive = false;
    iccSquadSpawned  = false;
    flashTimer       = 0;
    flashColor       = null;

    if (flashEl) {
      flashEl.style.display  = 'none';
      flashEl.style.opacity  = '0';
    }
    if (iccIconEl) {
      iccIconEl.style.display = 'none';
    }
    removeSummary();
    updateHud();
  }

  /* ── Exports ─────────────────────────────────────────────────── */

  return {
    init:             init,
    update:           update,
    reset:            reset,
    recordViolation:  recordViolation,
    recordHonor:      recordHonor,
    getKarma:         getKarma,
    getKarmaLevel:    getKarmaLevel
  };

})();
