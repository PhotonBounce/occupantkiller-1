/**
 * horde-mode.js — Unlimited enemy survival challenge
 * Activated after wave 10+ via wave-clear screen button, or developer shortcut (window._hordeMode = true).
 * Infinite escalating enemy spawns, 2x score multiplier, personal best tracking.
 */
window.HordeMode = (function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────────────────────
  var _active = false;
  var _kills = 0;
  var _startTime = 0;
  var _elapsed = 0;          // seconds survived
  var _spawnTimer = 0;       // countdown to next spawn
  var _difficultyTick = 0;   // unused placeholder for future ramp
  var _pbKills = 0;
  var _pbTime = 0;
  var _pbNotified = false;   // guard: notify only once per session
  var _endShown = false;
  var _bannerEl = null;
  var _killCountEl = null;
  var _timeEl = null;
  var _multEl = null;
  var _milestones = [50, 100, 250, 500];
  var _milestonesHit = {};

  // Dev shortcut polling (window._hordeMode flag)
  var _devCheckTimer = 0;

  // ── Constants ─────────────────────────────────────────────────────────────
  var SCORE_MULT = 2;
  var LS_KEY = 'okk_horde_best';

  // Spawn intervals by phase (seconds elapsed)
  var SPAWN_PHASE = [
    { after: 0,   interval: 2.0 },   // 0-59s: 1 enemy / 2s
    { after: 60,  interval: 1.0 },   // 60-119s: 1 enemy / 1s
    { after: 120, interval: 0.5 },   // 120s+: 2 enemies / 1s (0.5s each)
  ];

  // Enemy mix by difficulty phase (every 30s)
  var ENEMY_POOLS = [
    // 0-29s: conscript-heavy
    ['CONSCRIPT', 'CONSCRIPT', 'CONSCRIPT', 'STORMER', 'CONSCRIPT'],
    // 30-59s: more stormers
    ['CONSCRIPT', 'STORMER', 'STORMER', 'CONSCRIPT', 'ARMORED'],
    // 60-89s: assault shift
    ['STORMER', 'STORMER', 'ARMORED', 'CONSCRIPT', 'STORMER'],
    // 90-119s: elite mix
    ['STORMER', 'ARMORED', 'SPETSNAZ', 'ARMORED', 'STORMER'],
    // 120-149s: heavy/elite
    ['ARMORED', 'SPETSNAZ', 'ARMORED', 'HEAVY_GUNNER', 'SPETSNAZ'],
    // 150s+: maximum threat
    ['ARMORED', 'SPETSNAZ', 'HEAVY_GUNNER', 'WAGNER', 'ARMORED'],
  ];

  // ── Helpers ───────────────────────────────────────────────────────────────

  function _loadPB() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        _pbKills = data.kills || 0;
        _pbTime  = data.time  || 0;
      }
    } catch (_e) {}
  }

  function _savePB() {
    try {
      var newKills = Math.max(_pbKills, _kills);
      var newTime  = Math.max(_pbTime,  _elapsed);
      localStorage.setItem(LS_KEY, JSON.stringify({ kills: newKills, time: newTime }));
      _pbKills = newKills;
      _pbTime  = newTime;
    } catch (_e) {}
  }

  function _fmtTime(sec) {
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function _getPlayer() {
    return (typeof window !== 'undefined' && window.player) ? window.player : null;
  }

  function _getCurrentEnemy() {
    var tier = Math.min(Math.floor(_elapsed / 30), ENEMY_POOLS.length - 1);
    var pool = ENEMY_POOLS[tier];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function _getSpawnInterval() {
    var phase = SPAWN_PHASE[0];
    var i;
    for (i = SPAWN_PHASE.length - 1; i >= 0; i--) {
      if (_elapsed >= SPAWN_PHASE[i].after) { phase = SPAWN_PHASE[i]; break; }
    }
    return phase.interval;
  }

  function _getSpawnPos() {
    var player = _getPlayer();
    var angle = Math.random() * Math.PI * 2;
    var dist  = 18 + Math.random() * 12;
    var bx = player ? player.position.x : 0;
    var bz = player ? player.position.z : 0;
    var sx = bx + Math.cos(angle) * dist;
    var sz = bz + Math.sin(angle) * dist;
    var sy = 0;
    if (typeof window !== 'undefined' && window.VoxelWorld && window.VoxelWorld.getTerrainHeight) {
      sy = window.VoxelWorld.getTerrainHeight(sx, sz);
    }
    return { x: sx, y: sy, z: sz };
  }

  function _spawnEnemy() {
    if (typeof window === 'undefined' || !window.Enemies || !window.Enemies.spawnSingle) return;
    var type = _getCurrentEnemy();
    var pos  = _getSpawnPos();
    try {
      window.Enemies.spawnSingle(type, pos);
    } catch (_e) {}
  }

  function _notifyHUD(msg, color) {
    try {
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
        HUD.notifyPickup(msg, color || '#ff4444');
      }
    } catch (_e) {}
  }

  function _showToast(msg, dur, color) {
    try {
      if (typeof HUD !== 'undefined' && HUD.showToast) {
        HUD.showToast(msg, dur || 2500, color || '#ff4444');
      }
    } catch (_e) {}
  }

  // ── HUD Creation ──────────────────────────────────────────────────────────

  function _createHUD() {
    if (_bannerEl) return; // already created

    // Crimson pulsing "HORDE MODE" banner — top center
    var banner = document.createElement('div');
    banner.id = 'horde-mode-banner';
    banner.style.cssText = [
      'position:fixed',
      'top:56px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:300',
      'font-family:monospace',
      'font-weight:bold',
      'font-size:18px',
      'letter-spacing:4px',
      'color:#dc143c',
      'text-shadow:0 0 12px #dc143c,0 0 24px rgba(220,20,60,0.6)',
      'pointer-events:none',
      'text-align:center',
      'animation:hordePulse 1.2s ease-in-out infinite',
      'display:none',
    ].join(';');
    banner.innerHTML = '&#9760; HORDE MODE &#9760;';
    document.body.appendChild(banner);
    _bannerEl = banner;

    // Kill counter
    var killDiv = document.createElement('div');
    killDiv.id = 'horde-kill-counter';
    killDiv.style.cssText = [
      'position:fixed',
      'top:82px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:300',
      'font-family:monospace',
      'font-size:13px',
      'color:#ff6666',
      'text-shadow:0 0 6px rgba(255,80,80,0.5)',
      'pointer-events:none',
      'display:none',
    ].join(';');
    killDiv.textContent = 'KILLS: 0';
    document.body.appendChild(killDiv);
    _killCountEl = killDiv;

    // Time survived
    var timeDiv = document.createElement('div');
    timeDiv.id = 'horde-time-display';
    timeDiv.style.cssText = [
      'position:fixed',
      'top:100px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:300',
      'font-family:monospace',
      'font-size:12px',
      'color:#ffaaaa',
      'pointer-events:none',
      'display:none',
    ].join(';');
    timeDiv.textContent = 'SURVIVED: 00:00';
    document.body.appendChild(timeDiv);
    _timeEl = timeDiv;

    // Score multiplier badge (shown near score display)
    var multDiv = document.createElement('div');
    multDiv.id = 'horde-mult-badge';
    multDiv.style.cssText = [
      'position:fixed',
      'top:56px',
      'right:12px',
      'z-index:300',
      'font-family:monospace',
      'font-weight:bold',
      'font-size:14px',
      'color:#ffd700',
      'text-shadow:0 0 8px rgba(255,215,0,0.6)',
      'background:rgba(0,0,0,0.55)',
      'border:1px solid rgba(255,215,0,0.4)',
      'padding:2px 8px',
      'border-radius:4px',
      'pointer-events:none',
      'display:none',
    ].join(';');
    multDiv.textContent = 'x2.0';
    document.body.appendChild(multDiv);
    _multEl = multDiv;

    // Inject keyframe animation if missing
    if (!document.getElementById('horde-mode-style')) {
      var style = document.createElement('style');
      style.id = 'horde-mode-style';
      style.textContent = [
        '@keyframes hordePulse {',
        '  0%,100% { opacity:1; text-shadow:0 0 12px #dc143c,0 0 24px rgba(220,20,60,0.6); }',
        '  50%     { opacity:0.6; text-shadow:0 0 20px #dc143c,0 0 40px rgba(220,20,60,0.9); }',
        '}',
      ].join('\n');
      document.head.appendChild(style);
    }
  }

  function _showHUD(visible) {
    var disp = visible ? 'block' : 'none';
    if (_bannerEl)    _bannerEl.style.display    = disp;
    if (_killCountEl) _killCountEl.style.display  = disp;
    if (_timeEl)      _timeEl.style.display       = disp;
    if (_multEl)      _multEl.style.display       = disp;
  }

  function _updateHUD() {
    if (_killCountEl) _killCountEl.textContent = 'KILLS: ' + _kills;
    if (_timeEl)      _timeEl.textContent      = 'SURVIVED: ' + _fmtTime(_elapsed);
  }

  // ── Wave-clear horde button ───────────────────────────────────────────────

  function _injectWaveClearButton() {
    var waveClear = document.getElementById('overlay-waveclear');
    if (!waveClear) return;
    if (document.getElementById('horde-activate-btn')) return;

    var waveNumEl = document.getElementById('waveclear-num');
    var waveNum = waveNumEl ? (parseInt(waveNumEl.textContent, 10) || 0) : 0;
    if (waveNum < 10) return;

    var btn = document.createElement('button');
    btn.id = 'horde-activate-btn';
    btn.className = 'btn';
    btn.style.cssText = [
      'margin-top:10px',
      'border-color:#dc143c',
      'color:#dc143c',
      'text-shadow:0 0 8px rgba(220,20,60,0.8)',
      'font-weight:bold',
      'letter-spacing:2px',
    ].join(';');
    btn.textContent = 'ENTER HORDE MODE';
    btn.addEventListener('click', function () {
      var wco = document.getElementById('overlay-waveclear');
      if (wco) wco.style.display = 'none';
      HordeMode.activate();
    });

    var nextBtn = document.getElementById('next-wave-btn');
    if (nextBtn && nextBtn.parentNode) {
      nextBtn.parentNode.insertBefore(btn, nextBtn);
    } else {
      waveClear.appendChild(btn);
    }
  }

  // ── End screen ────────────────────────────────────────────────────────────

  function _showEndScreen() {
    if (_endShown) return;
    _endShown = true;
    _showHUD(false);

    _savePB();

    var isPBKills = _kills >= _pbKills;
    var isPBTime  = _elapsed >= _pbTime;

    var overlay = document.createElement('div');
    overlay.id = 'horde-end-overlay';
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:9000',
      'background:rgba(0,0,0,0.88)',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'font-family:monospace',
      'color:#fff',
      'text-align:center',
      'pointer-events:auto',
    ].join(';');

    var pbLine = '';
    if (isPBKills || isPBTime) {
      pbLine = '<div style="color:#ffd700;font-size:14px;margin:6px 0;text-shadow:0 0 10px #ffd700">&#11088; PERSONAL BEST!</div>';
    }

    var scoreNow = 0;
    try { scoreNow = (window.player && window.player.score) ? window.player.score : 0; } catch (_e) {}

    overlay.innerHTML = [
      '<div style="color:#dc143c;font-size:28px;font-weight:bold;letter-spacing:4px;text-shadow:0 0 20px #dc143c;margin-bottom:14px">HORDE ENDED</div>',
      '<div style="font-size:14px;color:#ff8888;margin:4px 0">TOTAL KILLS: <span style="color:#fff;font-weight:bold">' + _kills + '</span></div>',
      '<div style="font-size:14px;color:#ff8888;margin:4px 0">SURVIVAL TIME: <span style="color:#fff;font-weight:bold">' + _fmtTime(_elapsed) + '</span></div>',
      '<div style="font-size:14px;color:#ff8888;margin:4px 0">SCORE: <span style="color:#ffd700;font-weight:bold">' + scoreNow + '</span></div>',
      pbLine,
      '<div style="margin-top:12px;font-size:12px;color:#888">PERSONAL BEST &mdash; KILLS: ' + _pbKills + ' | TIME: ' + _fmtTime(_pbTime) + '</div>',
      '<button id="horde-end-close-btn" style="margin-top:18px;padding:8px 24px;background:rgba(220,20,60,0.15);border:1px solid #dc143c;color:#dc143c;cursor:pointer;font-family:monospace;font-size:13px;border-radius:4px;letter-spacing:2px">BACK TO MENU</button>',
    ].join('');

    document.body.appendChild(overlay);

    var closeBtn = document.getElementById('horde-end-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        try {
          if (typeof GameManager !== 'undefined' && GameManager.returnToMenu) {
            GameManager.returnToMenu();
          } else {
            var menuOverlay = document.getElementById('overlay-start');
            if (menuOverlay) menuOverlay.style.display = 'flex';
          }
        } catch (_e) {}
      });
    }
  }

  // ── Milestone handling ────────────────────────────────────────────────────

  function _checkMilestones() {
    var mi;
    for (mi = 0; mi < _milestones.length; mi++) {
      var threshold = _milestones[mi];
      if (!_milestonesHit[threshold] && _kills >= threshold) {
        _milestonesHit[threshold] = true;
        _onMilestone(threshold);
      }
    }
  }

  function _onMilestone(kills) {
    // Bonus ammo drop
    try {
      var pl = _getPlayer();
      if (pl) {
        if (typeof pl.reserves !== 'undefined') {
          pl.reserves = (pl.reserves || 0) + 100;
        } else {
          pl.ammo = (pl.ammo || 0) + 100;
        }
      }
    } catch (_e) {}

    // Audio fanfare
    try {
      if (typeof AudioSystem !== 'undefined' && AudioSystem.playAchievementUnlock) {
        AudioSystem.playAchievementUnlock();
      }
    } catch (_e) {}

    // UNSTOPPABLE badge + notification
    _showToast('UNSTOPPABLE — ' + kills + ' KILLS! +100 AMMO', 3500, '#ffd700');
    _notifyHUD('MILESTONE: ' + kills + ' KILLS!', '#ffd700');
  }

  // ── Personal best check (in-game) ────────────────────────────────────────

  function _checkPB() {
    if (_pbNotified) return;
    if (_kills > 0 && (_kills > _pbKills || (_kills === _pbKills && _kills > 0 && _elapsed > _pbTime))) {
      _pbNotified = true;
      _showToast('PERSONAL BEST! Keep going!', 2500, '#ffd700');
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  function init() {
    _loadPB();
    _createHUD();

    // Expose globals
    window._hordeActive = false;
    window._hordeKills  = 0;
    window._hordeScoreMultiplier = 1;

    // Watch for wave-clear screen visibility to inject horde button
    setInterval(function () {
      if (_active) return;
      var wco = document.getElementById('overlay-waveclear');
      if (!wco) return;
      var st = wco.style.display;
      if (st && st !== 'none') {
        _injectWaveClearButton();
      }
    }, 500);
  }

  function activate() {
    if (_active) return;
    _active = true;
    _kills = 0;
    _elapsed = 0;
    _spawnTimer = 0;
    _difficultyTick = 0;
    _startTime = Date.now();
    _endShown = false;
    _pbNotified = false;
    _milestonesHit = {};

    window._hordeActive = true;
    window._hordeKills  = 0;
    window._hordeScoreMultiplier = SCORE_MULT;

    _createHUD();
    _showHUD(true);
    _updateHUD();

    _notifyHUD('HORDE MODE ACTIVATED — x2 SCORE — NO EXTRACTION', '#dc143c');
    _showToast('HORDE MODE — SURVIVE AS LONG AS YOU CAN!', 3000, '#dc143c');

    // Spawn initial enemies immediately
    var si;
    for (si = 0; si < 3; si++) {
      _spawnEnemy();
    }

    console.log('[HordeMode] Activated.');
  }

  function deactivate() {
    if (!_active) return;
    _active = false;
    window._hordeActive = false;
    window._hordeScoreMultiplier = 1;
    _showHUD(false);
    console.log('[HordeMode] Deactivated.');
  }

  function reset() {
    deactivate();
    _kills = 0;
    _elapsed = 0;
    _spawnTimer = 0;
    window._hordeKills = 0;
    _endShown = false;
    _pbNotified = false;
    _milestonesHit = {};
  }

  /**
   * update(dt) — call from game loop each frame (dt = seconds since last frame).
   * Manages spawn timer, difficulty scaling, HUD updates, death detection.
   */
  function update(dt) {
    // Dev flag shortcut: set window._hordeMode = true to activate
    _devCheckTimer += dt;
    if (_devCheckTimer >= 0.5) {
      _devCheckTimer = 0;
      if (!_active && typeof window !== 'undefined' && window._hordeMode === true) {
        window._hordeMode = false; // consume the flag
        activate();
      }
    }

    if (!_active) return;

    _elapsed += dt;
    _difficultyTick += dt;
    _spawnTimer -= dt;

    // Spawn enemy when timer expires
    if (_spawnTimer <= 0) {
      _spawnEnemy();
      _spawnTimer = _getSpawnInterval();
    }

    // Death detection: player HP reached 0
    var pl = _getPlayer();
    if (pl && typeof pl.hp !== 'undefined' && pl.hp <= 0 && !_endShown) {
      deactivate();
      // Small delay so game-manager can also update its state
      setTimeout(function () { _showEndScreen(); }, 600);
      return;
    }

    // Also detect STATE.DEAD via GameManager
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getState) {
        if (GameManager.getState() === 'dead' && !_endShown) {
          deactivate();
          setTimeout(function () { _showEndScreen(); }, 600);
          return;
        }
      }
    } catch (_e) {}

    _checkPB();
    _checkMilestones();
    _updateHUD();
  }

  /**
   * onKill() — call this whenever a kill happens while horde is active.
   * Increments horde kill counter, awards bonus score.
   */
  function onKill() {
    if (!_active) return;
    _kills++;
    window._hordeKills = _kills;

    // Award flat bonus per kill on top of base game score
    var pl = _getPlayer();
    if (pl) {
      pl.score = (pl.score || 0) + 50;
      try {
        if (typeof HUD !== 'undefined' && HUD.setScore) HUD.setScore(pl.score);
      } catch (_e) {}
    }

    _updateHUD();
    _checkMilestones();
  }

  // Expose public API
  return {
    init:       init,
    update:     update,
    activate:   activate,
    deactivate: deactivate,
    reset:      reset,
    onKill:     onKill,
  };
})();
