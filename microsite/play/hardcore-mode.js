// hardcore-mode.js — Hardcore / Ironman Mode: permanent death with exclusive rewards
// IIFE singleton, all var, no let/const.
// Exposes: window.HardcoreMode = { init, isActive, toggle, onPlayerDeath, getStats, reset }

window.HardcoreMode = (function () {
  'use strict';

  // ── Storage key ────────────────────────────────────────────────────────────
  var STORAGE_KEY = 'okk_hardcore_v1';

  // ── Internal state ─────────────────────────────────────────────────────────
  var _active = false;          // is hardcore mode on for this session
  var _sessionStarted = false;  // once a wave starts, toggling is locked
  var _runStats = {
    wavesSurvived: 0,
    enemiesKilled: 0,
    score: 0,
    startTime: 0
  };

  // DOM elements injected by init()
  var _borderOverlay = null;
  var _badge = null;
  var _skullBadge = null;
  var _deathOverlay = null;
  var _toggleBtn = null;
  var _warnDialog = null;

  // ── CSS injected once ───────────────────────────────────────────────────────
  var _cssInjected = false;
  function _injectCSS() {
    if (_cssInjected) return;
    _cssInjected = true;
    var style = document.createElement('style');
    style.id = 'hardcore-mode-styles';
    style.textContent = [
      '@keyframes hc-border-pulse {',
      '  0%,100% { border-color: rgba(180,0,0,0.85); }',
      '  50% { border-color: rgba(255,50,50,1); }',
      '}',
      '@keyframes hc-badge-pulse {',
      '  0%,100% { border-color: #8b0000; box-shadow: 0 0 6px rgba(200,0,0,0.5); }',
      '  50% { border-color: #ff2222; box-shadow: 0 0 14px rgba(255,0,0,0.9); }',
      '}',
      '@keyframes hc-shake {',
      '  0%,100% { transform: translate(-50%,-50%) translateX(0); }',
      '  10%     { transform: translate(-50%,-50%) translateX(-8px); }',
      '  20%     { transform: translate(-50%,-50%) translateX(8px); }',
      '  30%     { transform: translate(-50%,-50%) translateX(-6px); }',
      '  40%     { transform: translate(-50%,-50%) translateX(6px); }',
      '  50%     { transform: translate(-50%,-50%) translateX(-4px); }',
      '  60%     { transform: translate(-50%,-50%) translateX(4px); }',
      '  70%     { transform: translate(-50%,-50%) translateX(-2px); }',
      '  80%     { transform: translate(-50%,-50%) translateX(2px); }',
      '}',
      '@keyframes hc-btn-pulse {',
      '  0%,100% { box-shadow: 0 0 4px rgba(200,0,0,0.5); }',
      '  50% { box-shadow: 0 0 12px rgba(255,50,50,0.9); }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  // ── Persist state ───────────────────────────────────────────────────────────
  function _save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function _load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { active: false };
  }

  // ── Apply / remove global difficulty flags ──────────────────────────────────
  function _applyDifficultyFlags(on) {
    window._hardcoreActive = on;
    window._hardcoreDifficulty = on;
    window._hardcoreDamageMultiplier = on ? 1.5 : 1.0;
    window._hardcoreMaxHP = on ? 75 : 100;
    window._hardcoreScoreMultiplier = on ? 2.0 : 1.0;
  }

  // ── Red border frame overlay ────────────────────────────────────────────────
  function _createBorderOverlay() {
    if (_borderOverlay) return;
    _borderOverlay = document.createElement('div');
    _borderOverlay.id = 'hc-border-overlay';
    _borderOverlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'pointer-events:none',
      'z-index:9990',
      'border:4px solid rgba(180,0,0,0.85)',
      'animation:hc-border-pulse 2s ease-in-out infinite',
      'display:none'
    ].join(';');
    document.body.appendChild(_borderOverlay);
  }

  // ── [HARDCORE] top-center badge ─────────────────────────────────────────────
  function _createBadge() {
    if (_badge) return;
    _badge = document.createElement('div');
    _badge.id = 'hc-badge';
    _badge.textContent = '[HARDCORE]';
    _badge.style.cssText = [
      'position:fixed',
      'top:4px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:9991',
      'pointer-events:none',
      'background:#4a0000',
      'color:#ff4444',
      'font-family:monospace',
      'font-size:12px',
      'font-weight:bold',
      'letter-spacing:2px',
      'padding:3px 14px',
      'border-radius:4px',
      'border:1px solid #8b0000',
      'animation:hc-badge-pulse 1.5s ease-in-out infinite',
      'display:none'
    ].join(';');
    document.body.appendChild(_badge);
  }

  // ── Red skull badge (top-right HUD) ────────────────────────────────────────
  function _createSkullBadge() {
    if (_skullBadge) return;
    _skullBadge = document.createElement('div');
    _skullBadge.id = 'hc-skull-badge';
    _skullBadge.textContent = '☠';
    _skullBadge.style.cssText = [
      'position:fixed',
      'top:4px',
      'right:8px',
      'z-index:9992',
      'pointer-events:none',
      'color:#ff2222',
      'font-size:20px',
      'text-shadow:0 0 8px rgba(255,0,0,0.8)',
      'display:none'
    ].join(';');
    document.body.appendChild(_skullBadge);
  }

  // ── Dim friendly HUD elements ───────────────────────────────────────────────
  var _HUD_IDS = [
    'hud', 'minimap-canvas', 'extended-top-bar', 'top-bar', 'bottom-bar',
    'info-panel-left', 'resource-bar', 'tactical-compass', 'weather-indicator',
    'prestige-indicator', 'role-indicator', 'hud-okc-bar', 'perk-display',
    'combat-log', 'daily-challenges', 'bounty-display', 'streak-display',
    'stamina-bar-container', 'armor-bar-container', 'heat-bar-container'
  ];

  function _dimHUD(on) {
    var opacity = on ? '0.7' : '';
    for (var i = 0; i < _HUD_IDS.length; i++) {
      var el = document.getElementById(_HUD_IDS[i]);
      if (el) el.style.opacity = opacity;
    }
    // Hide minimap
    var mm = document.getElementById('minimap-canvas');
    if (mm) mm.style.display = on ? 'none' : '';
  }

  // ── Show / hide all hardcore HUD overlays ──────────────────────────────────
  function _showHUDOverlays(on) {
    var disp = on ? 'block' : 'none';
    if (_borderOverlay) _borderOverlay.style.display = disp;
    if (_badge)         _badge.style.display         = disp;
    if (_skullBadge)    _skullBadge.style.display     = disp;
    _dimHUD(on);
  }

  // ── Warning dialog before enabling ─────────────────────────────────────────
  function _createWarnDialog(onConfirm, onCancel) {
    if (_warnDialog) {
      document.body.removeChild(_warnDialog);
      _warnDialog = null;
    }
    _warnDialog = document.createElement('div');
    _warnDialog.id = 'hc-warn-dialog';
    _warnDialog.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'z-index:99990',
      'background:#0d0000',
      'border:2px solid #cc0000',
      'color:#fff',
      'font-family:monospace',
      'padding:28px 36px',
      'border-radius:8px',
      'text-align:center',
      'max-width:420px',
      'box-shadow:0 0 30px rgba(200,0,0,0.6)'
    ].join(';');

    var title = document.createElement('div');
    title.textContent = '☠ WARNING ☠';
    title.style.cssText = 'color:#ff2222;font-size:20px;font-weight:bold;margin-bottom:14px;letter-spacing:3px';

    var msg = document.createElement('div');
    msg.textContent = 'Death is permanent in this run. No respawns. No mercy. Continue?';
    msg.style.cssText = 'color:#ddd;font-size:13px;line-height:1.6;margin-bottom:22px';

    var btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:16px;justify-content:center';

    var confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'CONFIRM';
    confirmBtn.style.cssText = [
      'background:#8b0000',
      'border:1px solid #ff2222',
      'color:#fff',
      'font-family:monospace',
      'font-size:13px',
      'padding:8px 24px',
      'cursor:pointer',
      'border-radius:4px',
      'font-weight:bold'
    ].join(';');
    confirmBtn.onclick = function () {
      document.body.removeChild(_warnDialog);
      _warnDialog = null;
      onConfirm();
    };

    var cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'CANCEL';
    cancelBtn.style.cssText = [
      'background:#111',
      'border:1px solid #555',
      'color:#aaa',
      'font-family:monospace',
      'font-size:13px',
      'padding:8px 24px',
      'cursor:pointer',
      'border-radius:4px'
    ].join(';');
    cancelBtn.onclick = function () {
      document.body.removeChild(_warnDialog);
      _warnDialog = null;
      onCancel();
    };

    btnRow.appendChild(confirmBtn);
    btnRow.appendChild(cancelBtn);
    _warnDialog.appendChild(title);
    _warnDialog.appendChild(msg);
    _warnDialog.appendChild(btnRow);
    document.body.appendChild(_warnDialog);
  }

  // ── Main-menu toggle button (injected via DOM) ──────────────────────────────
  function _createToggleButton() {
    if (_toggleBtn) return;
    _toggleBtn = document.createElement('button');
    _toggleBtn.id = 'hardcoreToggle';
    _toggleBtn.style.cssText = [
      'position:fixed',
      'bottom:20px',
      'right:20px',
      'z-index:9993',
      'background:#1a0000',
      'border:1px solid #8b0000',
      'color:#ff4444',
      'font-family:monospace',
      'font-size:12px',
      'font-weight:bold',
      'padding:8px 16px',
      'border-radius:5px',
      'cursor:pointer',
      'letter-spacing:1px',
      'animation:hc-btn-pulse 2s ease-in-out infinite'
    ].join(';');
    _updateToggleBtn();
    _toggleBtn.onclick = function () {
      if (_sessionStarted) {
        // Cannot toggle mid-session
        return;
      }
      toggle();
    };
    document.body.appendChild(_toggleBtn);
  }

  function _updateToggleBtn() {
    if (!_toggleBtn) return;
    if (_active) {
      _toggleBtn.textContent = '☠ HARDCORE MODE: ON';
      _toggleBtn.style.background = '#4a0000';
      _toggleBtn.style.borderColor = '#ff2222';
      _toggleBtn.style.color = '#ff4444';
    } else {
      _toggleBtn.textContent = '☠ HARDCORE MODE: OFF';
      _toggleBtn.style.background = '#1a0000';
      _toggleBtn.style.borderColor = '#8b0000';
      _toggleBtn.style.color = '#884444';
    }
  }

  // ── Death overlay ───────────────────────────────────────────────────────────
  function _createDeathOverlay() {
    if (_deathOverlay) {
      document.body.removeChild(_deathOverlay);
      _deathOverlay = null;
    }

    _deathOverlay = document.createElement('div');
    _deathOverlay.id = 'hc-death-overlay';
    _deathOverlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:99995',
      'background:rgba(0,0,0,0.96)',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'font-family:monospace',
      'text-align:center',
      'pointer-events:auto'
    ].join(';');

    // Big eliminated text with shake
    var eliminated = document.createElement('div');
    eliminated.textContent = '☠ ELIMINATED ☠';
    eliminated.style.cssText = [
      'color:#ff0000',
      'font-size:clamp(28px,6vw,56px)',
      'font-weight:bold',
      'letter-spacing:4px',
      'text-shadow:0 0 30px rgba(255,0,0,0.9)',
      'position:absolute',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'animation:hc-shake 0.5s ease-in-out 0.2s 3'
    ].join(';');

    var subtitle = document.createElement('div');
    subtitle.textContent = 'MISSION FAILED — ELIMINATED';
    subtitle.style.cssText = [
      'color:#880000',
      'font-size:clamp(12px,2.5vw,18px)',
      'letter-spacing:3px',
      'margin-top:72px'
    ].join(';');

    // Stats display
    var stats = _runStats;
    var elapsed = stats.startTime ? Math.floor((Date.now() - stats.startTime) / 1000) : 0;
    var minutes = Math.floor(elapsed / 60);
    var seconds = elapsed % 60;
    var timeStr = minutes + 'm ' + seconds + 's';

    var statsDiv = document.createElement('div');
    statsDiv.style.cssText = [
      'color:#aaa',
      'font-size:13px',
      'line-height:2',
      'margin-top:18px',
      'border:1px solid #330000',
      'padding:14px 28px',
      'border-radius:6px',
      'background:rgba(60,0,0,0.3)'
    ].join(';');
    statsDiv.innerHTML = [
      '<div style="color:#ff6666;font-size:14px;margin-bottom:6px;letter-spacing:2px">RUN STATS</div>',
      '<div>Waves Survived: <span style="color:#fff">' + stats.wavesSurvived + '</span></div>',
      '<div>Enemies Killed: <span style="color:#fff">' + stats.enemiesKilled + '</span></div>',
      '<div>Score: <span style="color:#fff">' + stats.score + '</span></div>',
      '<div>Time Survived: <span style="color:#fff">' + timeStr + '</span></div>'
    ].join('');

    // Buttons (shown after 4s)
    var btnDiv = document.createElement('div');
    btnDiv.style.cssText = 'margin-top:28px;display:none';
    btnDiv.id = 'hc-death-btn-row';

    var menuBtn = document.createElement('button');
    menuBtn.textContent = '[RETURN TO MENU]';
    menuBtn.style.cssText = [
      'background:#1a0000',
      'border:2px solid #cc0000',
      'color:#ff4444',
      'font-family:monospace',
      'font-size:14px',
      'font-weight:bold',
      'padding:10px 28px',
      'cursor:pointer',
      'border-radius:5px',
      'letter-spacing:1px'
    ].join(';');
    menuBtn.onclick = function () {
      _clearSessionProgress();
      _hideDeathOverlay();
      // Return to menu — call any registered handler, then reload
      if (typeof window._onHardcoreDeath === 'function') {
        window._onHardcoreDeath();
      }
      // Reset session state (keep mode preference)
      _sessionStarted = false;
      // Attempt to bring up main menu via GameManager or reload
      if (window.GameManager && typeof window.GameManager.showMainMenu === 'function') {
        window.GameManager.showMainMenu();
      } else {
        window.location.reload();
      }
    };

    btnDiv.appendChild(menuBtn);

    // Assemble
    _deathOverlay.appendChild(eliminated);
    _deathOverlay.appendChild(subtitle);
    _deathOverlay.appendChild(statsDiv);
    _deathOverlay.appendChild(btnDiv);
    document.body.appendChild(_deathOverlay);

    // Show buttons after 4 seconds
    setTimeout(function () {
      var row = document.getElementById('hc-death-btn-row');
      if (row) row.style.display = 'block';
    }, 4000);
  }

  function _hideDeathOverlay() {
    if (_deathOverlay && _deathOverlay.parentNode) {
      _deathOverlay.parentNode.removeChild(_deathOverlay);
      _deathOverlay = null;
    }
  }

  // ── Clear wave session progress (not total progression) ────────────────────
  function _clearSessionProgress() {
    try {
      localStorage.removeItem('okk_progression_v2');
    } catch (e) {}
  }

  // ── Public: init ────────────────────────────────────────────────────────────
  function init() {
    _injectCSS();

    // Load saved preference
    var saved = _load();
    _active = !!(saved && saved.active);

    // Create DOM elements
    _createBorderOverlay();
    _createBadge();
    _createSkullBadge();
    _createToggleButton();

    // Apply state
    _applyDifficultyFlags(_active);
    if (_active) {
      _showHUDOverlays(true);
    }

    console.log('[HardcoreMode] init — active:', _active);
  }

  // ── Public: isActive ────────────────────────────────────────────────────────
  function isActive() {
    return _active;
  }

  // ── Public: toggle ──────────────────────────────────────────────────────────
  function toggle() {
    if (_sessionStarted) {
      console.warn('[HardcoreMode] Cannot toggle mid-session.');
      return;
    }

    if (!_active) {
      // Turning ON — show warning first
      _createWarnDialog(
        function () {
          // Confirmed
          _active = true;
          _save({ active: true });
          _applyDifficultyFlags(true);
          _showHUDOverlays(true);
          _updateToggleBtn();
          console.log('[HardcoreMode] ENABLED');
        },
        function () {
          // Cancelled — do nothing
          _updateToggleBtn();
        }
      );
    } else {
      // Turning OFF
      _active = false;
      _save({ active: false });
      _applyDifficultyFlags(false);
      _showHUDOverlays(false);
      _updateToggleBtn();
      console.log('[HardcoreMode] DISABLED');
    }
  }

  // ── Public: onPlayerDeath ───────────────────────────────────────────────────
  function onPlayerDeath(stats) {
    if (!_active) return;

    // Merge any live stats passed in
    if (stats) {
      if (typeof stats.wavesSurvived !== 'undefined') _runStats.wavesSurvived = stats.wavesSurvived;
      if (typeof stats.enemiesKilled !== 'undefined') _runStats.enemiesKilled = stats.enemiesKilled;
      if (typeof stats.score !== 'undefined')         _runStats.score         = stats.score;
    }

    // Show death overlay (immediate full-screen black + eliminated text)
    _createDeathOverlay();

    // Call hook
    if (typeof window._onHardcoreDeath === 'function') {
      try { window._onHardcoreDeath(); } catch (e) {}
    }
  }

  // ── Public: onRunComplete (all waves cleared in hardcore) ───────────────────
  function onRunComplete(levelId) {
    if (!_active) return;

    // Award IRONMAN achievement
    var achievementEl = document.getElementById('achievement-popup');
    var achievementName = document.getElementById('achievement-name');
    if (achievementEl && achievementName) {
      achievementName.textContent = 'IRON WILL — Complete any level in Hardcore Mode';
      achievementEl.style.display = 'block';
      setTimeout(function () {
        achievementEl.style.display = 'none';
      }, 5000);
    }

    // Award IRONMAN title on leaderboard (set flag for leaderboard to read)
    window._hardcoreIronman = true;
    window._hardcoreIronmanTitle = 'IRONMAN';

    // Score multiplier is already 2.0 via _hardcoreScoreMultiplier
    // Call completion hook
    if (typeof window._onHardcoreComplete === 'function') {
      try { window._onHardcoreComplete(levelId); } catch (e) {}
    }

    console.log('[HardcoreMode] Run COMPLETE — IRONMAN awarded for level:', levelId);
  }

  // ── Public: getStats ────────────────────────────────────────────────────────
  function getStats() {
    return {
      wavesSurvived: _runStats.wavesSurvived,
      enemiesKilled: _runStats.enemiesKilled,
      score: _runStats.score,
      startTime: _runStats.startTime
    };
  }

  // ── Public: reset ───────────────────────────────────────────────────────────
  function reset() {
    _runStats.wavesSurvived = 0;
    _runStats.enemiesKilled = 0;
    _runStats.score = 0;
    _runStats.startTime = Date.now();
    _sessionStarted = true;
    console.log('[HardcoreMode] Session started / stats reset.');
  }

  // ── Expose module ───────────────────────────────────────────────────────────
  return {
    init:          init,
    isActive:      isActive,
    toggle:        toggle,
    onPlayerDeath: onPlayerDeath,
    onRunComplete: onRunComplete,
    getStats:      getStats,
    reset:         reset
  };

})();
