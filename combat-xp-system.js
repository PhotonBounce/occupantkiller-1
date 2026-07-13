window.CombatXPSystem = (function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────────────────── */
  var STORAGE_KEY = 'ok_xpSystem';
  var MAX_LEVEL   = 30;
  var MAX_PRESTIGE = 10;

  var XP_SOURCES = {
    kill:              25,
    headshot:          15, // bonus on top of kill
    melee_kill:        35,
    vehicle_kill:      80,
    objective_capture: 100,
    revive:            40,
    wave_clear:        150
  };

  var MILESTONES = {
    5:  { name: 'IRON WILL',     desc: '+10% passive damage reduction' },
    10: { name: 'MARKSMAN',      desc: 'Sniper scope zoom +25%' },
    15: { name: 'COMBAT MEDIC',  desc: 'Carry 2 extra medkits' },
    20: { name: 'VETERAN',       desc: 'Start each wave with full ammo' },
    25: { name: 'BERSERKER',     desc: '2x XP and score for kills under 30% HP' },
    30: { name: 'LEGEND',        desc: 'Golden outline + LEGEND title in HUD' }
  };

  /* ── State ──────────────────────────────────────────────────────────────── */
  var _level        = 1;
  var _xp           = 0;
  var _prestige     = 0;
  var _initialized  = false;

  /* ── HUD element references ─────────────────────────────────────────────── */
  var _xpBarWrap    = null;
  var _xpBarFill    = null;
  var _xpLabel      = null;
  var _levelBadge   = null;
  var _prestigeRow  = null;
  var _levelUpEl    = null;
  var _prestigePromptEl = null;

  /* ── XP bar animation state ─────────────────────────────────────────────── */
  var _xpBarPulseTimer   = 0;
  var _levelUpFreezeTimer = 0;
  var _levelUpAnimTimer  = 0;
  var _levelUpAnimLevel  = 0;
  var _prestigeWaiting   = false;

  /* ── Audio context ──────────────────────────────────────────────────────── */
  var _audioCtx = null;

  /* ════════════════════════════════════════════════════════════════
     HELPER: XP required to reach a given level
     Formula: level × level × 50
  ════════════════════════════════════════════════════════════════ */
  function _xpForLevel(lv) {
    return lv * lv * 50;
  }

  /* total XP accumulated at the START of a given level */
  function _xpBaseForLevel(lv) {
    var total = 0;
    var i;
    for (i = 1; i < lv; i++) {
      total += _xpForLevel(i);
    }
    return total;
  }

  /* ════════════════════════════════════════════════════════════════
     PERSISTENCE
  ════════════════════════════════════════════════════════════════ */
  function _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        level:    _level,
        xp:       _xp,
        prestige: _prestige
      }));
    } catch (e) { /* ignore */ }
  }

  function _load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      _level    = (data.level    >= 1 && data.level    <= MAX_LEVEL)    ? data.level    : 1;
      _prestige = (data.prestige >= 0 && data.prestige <= MAX_PRESTIGE) ? data.prestige : 0;
      _xp       = (typeof data.xp === 'number' && data.xp >= 0)        ? data.xp       : 0;
    } catch (e) { /* ignore */ }
  }

  /* ════════════════════════════════════════════════════════════════
     HUD CONSTRUCTION
  ════════════════════════════════════════════════════════════════ */
  function _buildHUD() {
    /* ── XP bar at bottom of screen ── */
    _xpBarWrap = document.createElement('div');
    _xpBarWrap.id = 'combat-xp-bar-wrap';
    _xpBarWrap.style.cssText = [
      'position:fixed', 'bottom:0', 'left:0', 'width:100%', 'height:18px',
      'background:rgba(0,0,0,0.55)', 'z-index:3000', 'pointer-events:none',
      'box-shadow:0 -1px 6px rgba(0,0,0,0.7)'
    ].join(';');

    _xpBarFill = document.createElement('div');
    _xpBarFill.id = 'combat-xp-bar-fill';
    _xpBarFill.style.cssText = [
      'position:absolute', 'top:0', 'left:0', 'height:100%', 'width:0%',
      'background:linear-gradient(90deg,#7a5c00,#FFD700,#FFF176,#FFD700)',
      'transition:width 0.3s ease', 'border-radius:0 3px 3px 0'
    ].join(';');
    _xpBarWrap.appendChild(_xpBarFill);

    _xpLabel = document.createElement('div');
    _xpLabel.id = 'combat-xp-label';
    _xpLabel.style.cssText = [
      'position:absolute', 'top:0', 'left:50%', 'transform:translateX(-50%)',
      'color:#fff', 'font-family:monospace', 'font-size:11px', 'font-weight:bold',
      'line-height:18px', 'letter-spacing:2px', 'text-shadow:0 0 6px #000',
      'pointer-events:none', 'white-space:nowrap'
    ].join(';');
    _xpBarWrap.appendChild(_xpLabel);
    document.body.appendChild(_xpBarWrap);

    /* ── Level badge top-right ── */
    _levelBadge = document.createElement('div');
    _levelBadge.id = 'combat-level-badge';
    _levelBadge.style.cssText = [
      'position:fixed', 'top:14px', 'right:14px',
      'width:52px', 'height:52px', 'border-radius:50%',
      'background:radial-gradient(circle,#2a1c00,#000)',
      'border:2px solid #FFD700',
      'color:#FFD700', 'font-family:monospace', 'font-size:11px', 'font-weight:bold',
      'display:flex', 'align-items:center', 'justify-content:center',
      'flex-direction:column', 'pointer-events:none', 'z-index:3000',
      'text-shadow:0 0 8px #FFD700', 'box-shadow:0 0 12px rgba(255,215,0,0.4)',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_levelBadge);

    /* ── Prestige stars below badge ── */
    _prestigeRow = document.createElement('div');
    _prestigeRow.id = 'combat-prestige-row';
    _prestigeRow.style.cssText = [
      'position:fixed', 'top:70px', 'right:14px',
      'color:#FFD700', 'font-size:10px', 'letter-spacing:1px',
      'font-family:monospace', 'pointer-events:none', 'z-index:3000',
      'text-align:center', 'width:52px', 'text-shadow:0 0 6px #FFD700'
    ].join(';');
    document.body.appendChild(_prestigeRow);

    /* ── Level-up announcement ── */
    _levelUpEl = document.createElement('div');
    _levelUpEl.id = 'combat-levelup-announce';
    _levelUpEl.style.cssText = [
      'position:fixed', 'left:50%', 'bottom:60px', 'transform:translateX(-50%)',
      'color:#FFD700', 'font-family:monospace', 'font-size:36px', 'font-weight:bold',
      'letter-spacing:6px', 'text-shadow:0 0 24px #FFA500, 0 0 8px #000',
      'pointer-events:none', 'z-index:5000',
      'display:none', 'text-align:center', 'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_levelUpEl);

    /* ── Prestige prompt ── */
    _prestigePromptEl = document.createElement('div');
    _prestigePromptEl.id = 'combat-prestige-prompt';
    _prestigePromptEl.style.cssText = [
      'position:fixed', 'left:50%', 'top:50%', 'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.88)', 'border:2px solid #FFD700', 'border-radius:8px',
      'color:#FFD700', 'font-family:monospace', 'font-size:18px', 'font-weight:bold',
      'padding:24px 36px', 'text-align:center', 'letter-spacing:2px',
      'pointer-events:auto', 'z-index:8000', 'display:none',
      'box-shadow:0 0 32px rgba(255,215,0,0.5)'
    ].join(';');
    _prestigePromptEl.innerHTML =
      '<div style="font-size:24px;margin-bottom:10px;">PRESTIGE?</div>' +
      '<div style="font-size:13px;margin-bottom:18px;color:#fff;">' +
        'Reset to LV.1 and earn a ★ star.<br>' +
        'Each prestige grants +5% permanent XP gain.' +
      '</div>' +
      '<button id="combat-prestige-yes" style="' +
        'background:#FFD700;color:#000;border:none;padding:8px 22px;' +
        'font-family:monospace;font-size:14px;font-weight:bold;cursor:pointer;' +
        'border-radius:4px;margin-right:12px;letter-spacing:1px;">PRESTIGE</button>' +
      '<button id="combat-prestige-no" style="' +
        'background:#333;color:#fff;border:1px solid #666;padding:8px 22px;' +
        'font-family:monospace;font-size:14px;cursor:pointer;' +
        'border-radius:4px;letter-spacing:1px;">STAY</button>';
    document.body.appendChild(_prestigePromptEl);

    /* attach prestige prompt buttons */
    var btnYes = document.getElementById('combat-prestige-yes');
    var btnNo  = document.getElementById('combat-prestige-no');
    if (btnYes) btnYes.addEventListener('click', function () { _doPrestige(); });
    if (btnNo)  btnNo.addEventListener('click',  function () { _hidePrestigePrompt(); });
  }

  /* ════════════════════════════════════════════════════════════════
     HUD UPDATE
  ════════════════════════════════════════════════════════════════ */
  function _updateHUD() {
    if (!_levelBadge) return;

    /* badge */
    var titleLine = (_level >= 30) ? '<br><span style="font-size:8px;color:#FFF176">LEGEND</span>' : '';
    _levelBadge.innerHTML = '<span style="font-size:9px">LV.</span><span style="font-size:18px">' + _level + '</span>' + titleLine;

    /* prestige stars */
    if (_prestige > 0) {
      var stars = '';
      var i;
      for (i = 0; i < _prestige; i++) { stars += '★'; }
      _prestigeRow.textContent = stars;
    } else {
      _prestigeRow.textContent = '';
    }

    /* XP bar */
    var levelXP = _xpForLevel(_level);
    var pct     = (levelXP > 0) ? Math.min((_xp / levelXP) * 100, 100) : 100;

    if (_levelUpFreezeTimer > 0) {
      _xpBarFill.style.width = '100%';
      _xpBarFill.style.background = 'linear-gradient(90deg,#FFD700,#FFF176,#FFD700)';
    } else {
      _xpBarFill.style.width = pct.toFixed(1) + '%';
      _xpBarFill.style.background = 'linear-gradient(90deg,#7a5c00,#FFD700,#FFF176,#FFD700)';
    }

    /* label */
    if (_level >= MAX_LEVEL) {
      _xpLabel.textContent = 'LV.' + _level + ' [MAX]';
    } else {
      _xpLabel.textContent = 'LV.' + _level + ' [' + _xp + 'XP / ' + levelXP + 'XP]';
    }

    /* LEGEND golden canvas glow */
    if (_level >= 30) {
      var canvas = document.querySelector('canvas');
      if (canvas && !canvas._xpLegendGlow) {
        canvas.style.boxShadow = '0 0 0 3px #FFD700, 0 0 24px 6px rgba(255,215,0,0.5)';
        canvas._xpLegendGlow = true;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════
     AUDIO: level-up major chord C-E-G arpeggio
  ════════════════════════════════════════════════════════════════ */
  function _ensureAudioCtx() {
    if (_audioCtx) return;
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { /* audio not available */ }
  }

  function _playNote(freq, startTime, duration) {
    if (!_audioCtx) return;
    var osc  = _audioCtx.createOscillator();
    var gain = _audioCtx.createGain();
    osc.connect(gain);
    gain.connect(_audioCtx.destination);
    osc.type      = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0, startTime);
    gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  function _playLevelUpSound() {
    _ensureAudioCtx();
    if (!_audioCtx) return;
    var now = _audioCtx.currentTime;
    /* C4=261.63, E4=329.63, G4=392.00 ascending 200ms apart */
    _playNote(261.63, now,         0.5);
    _playNote(329.63, now + 0.20,  0.5);
    _playNote(392.00, now + 0.40,  0.7);
  }

  /* ════════════════════════════════════════════════════════════════
     FLOATING XP TEXT
  ════════════════════════════════════════════════════════════════ */
  function _spawnFloatXP(amount, screenX, screenY) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'left:' + (screenX || Math.round(window.innerWidth / 2)) + 'px',
      'top:'  + (screenY || Math.round(window.innerHeight * 0.55)) + 'px',
      'color:#FFD700', 'font-family:monospace', 'font-size:16px', 'font-weight:bold',
      'pointer-events:none', 'z-index:4000',
      'text-shadow:0 0 8px #000, 0 0 4px #FFA500',
      'letter-spacing:1px', 'white-space:nowrap',
      'transition:top 1.2s ease, opacity 1.2s ease',
      'opacity:1'
    ].join(';');
    el.textContent = '+' + amount + 'XP';
    document.body.appendChild(el);

    /* kick animation next frame */
    requestAnimationFrame(function () {
      el.style.top     = (parseInt(el.style.top, 10) - 80) + 'px';
      el.style.opacity = '0';
    });

    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1400);
  }

  /* ════════════════════════════════════════════════════════════════
     LEVEL-UP SEQUENCE
  ════════════════════════════════════════════════════════════════ */
  function _triggerLevelUpSequence(newLevel) {
    _playLevelUpSound();
    _levelUpFreezeTimer = 0.5; /* freeze XP bar full gold 0.5s */
    _levelUpAnimLevel   = newLevel;
    _levelUpAnimTimer   = 2.5;  /* total animation time */

    if (_levelUpEl) {
      _levelUpEl.textContent = 'LEVEL UP!  LV.' + newLevel;
      _levelUpEl.style.display    = 'block';
      _levelUpEl.style.opacity    = '1';
      _levelUpEl.style.bottom     = '60px';
      _levelUpEl.style.fontSize   = '36px';
      _levelUpEl.style.transition = 'none';
    }

    /* apply milestone if applicable */
    if (MILESTONES[newLevel]) {
      _applyMilestone(newLevel);
      _showMilestoneToast(newLevel);
    }

    /* if max level and not max prestige, show prestige prompt */
    if (newLevel >= MAX_LEVEL && _prestige < MAX_PRESTIGE) {
      _prestigeWaiting = true;
    }
  }

  /* ════════════════════════════════════════════════════════════════
     MILESTONE APPLICATION
  ════════════════════════════════════════════════════════════════ */
  function _applyMilestone(lv) {
    if (lv === 5) {
      window._passiveDmgReduce = 0.9;
    }
    if (lv === 10) {
      if (window.SniperScope && typeof window.SniperScope.setZoomBonus === 'function') {
        window.SniperScope.setZoomBonus(1.25);
      } else {
        window._sniperZoomBonus = (window._sniperZoomBonus || 1.0) * 1.25;
      }
    }
    if (lv === 15) {
      window._medkitCapacity = (window._medkitCapacity || 3) + 2;
    }
    if (lv === 20) {
      window._waveStartCallback = function () {
        if (window.player && window.player.ammo !== undefined) {
          window.player.ammo = window.player.maxAmmo || 999;
        }
        if (window._refillAmmo) window._refillAmmo();
      };
    }
    if (lv === 25) {
      window._berserkerXPActive = true;
    }
    if (lv === 30) {
      window._legendUnlocked = true;
    }
  }

  function _showMilestoneToast(lv) {
    var m  = MILESTONES[lv];
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed', 'right:80px', 'top:90px',
      'background:rgba(0,0,0,0.85)', 'border:2px solid #FFD700',
      'border-radius:6px', 'padding:10px 18px',
      'color:#FFD700', 'font-family:monospace', 'font-size:13px', 'font-weight:bold',
      'letter-spacing:2px', 'z-index:6000', 'pointer-events:none',
      'box-shadow:0 0 18px rgba(255,215,0,0.4)', 'text-align:center',
      'opacity:1', 'transition:opacity 0.5s'
    ].join(';');
    el.innerHTML = 'UNLOCK: ' + m.name + '<br><span style="font-size:10px;color:#fff;font-weight:normal">' + m.desc + '</span>';
    document.body.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; }, 3500);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 4100);
  }

  /* ════════════════════════════════════════════════════════════════
     PRESTIGE
  ════════════════════════════════════════════════════════════════ */
  function _showPrestigePrompt() {
    if (_prestigePromptEl) _prestigePromptEl.style.display = 'block';
  }

  function _hidePrestigePrompt() {
    if (_prestigePromptEl) _prestigePromptEl.style.display = 'none';
    _prestigeWaiting = false;
  }

  function _doPrestige() {
    if (_prestige >= MAX_PRESTIGE) { _hidePrestigePrompt(); return; }
    _prestige += 1;
    _level     = 1;
    _xp        = 0;
    _hidePrestigePrompt();
    _save();
    _updateHUD();

    /* prestige announcement */
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed', 'left:50%', 'top:40%', 'transform:translate(-50%,-50%)',
      'color:#FFD700', 'font-family:monospace', 'font-size:30px', 'font-weight:bold',
      'letter-spacing:6px', 'text-shadow:0 0 24px #FFA500',
      'pointer-events:none', 'z-index:5500', 'text-align:center',
      'opacity:1', 'transition:opacity 1.5s'
    ].join(';');
    el.textContent = '★ PRESTIGE ' + _prestige + ' ★';
    document.body.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; }, 2500);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 4000);
  }

  /* ════════════════════════════════════════════════════════════════
     CORE: ADD XP
  ════════════════════════════════════════════════════════════════ */
  function addXP(amount, reason, screenX, screenY) {
    if (!_initialized) return;
    if (typeof amount !== 'number' || amount <= 0) return;

    /* prestige bonus: +5% per prestige */
    var mult = 1 + _prestige * 0.05;

    /* global score multiplier integration */
    var globalMult = (window._scoreMultiplier && window._scoreMultiplier > 1)
      ? window._scoreMultiplier : 1;
    mult *= globalMult;

    /* berserker: 2x under 30% HP */
    if (window._berserkerXPActive) {
      var hp    = (window.player && window.player.health) || 100;
      var maxHp = (window.player && window.player.maxHealth) || 100;
      if (hp / maxHp < 0.30) {
        mult *= 2;
      }
    }

    var earned = Math.max(1, Math.round(amount * mult));

    /* DailyChallenges bonus */
    if (reason === 'challenge_complete' &&
        window.DailyChallenges &&
        typeof window.DailyChallenges.getCompletions === 'function') {
      earned += 200;
    }

    _xp += earned;
    _xpBarPulseTimer = 0.4;

    /* spawn floating text */
    _spawnFloatXP(earned, screenX, screenY);

    /* check for level-up(s) */
    var levelled = false;
    while (_level < MAX_LEVEL && _xp >= _xpForLevel(_level)) {
      _xp    -= _xpForLevel(_level);
      _level += 1;
      levelled = true;
      _triggerLevelUpSequence(_level);
    }

    /* cap XP at max level */
    if (_level >= MAX_LEVEL) {
      _xp = 0;
    }

    _save();
    _updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════
     onKill — public hook
  ════════════════════════════════════════════════════════════════ */
  function onKill(enemy) {
    if (!enemy) {
      addXP(XP_SOURCES.kill, 'kill');
      return;
    }

    var baseXP = XP_SOURCES.kill;
    var reason = 'kill';

    /* vehicle */
    if (enemy.isVehicle || enemy.type === 'vehicle') {
      baseXP = XP_SOURCES.vehicle_kill;
      reason = 'vehicle_kill';
    }
    /* melee */
    else if (enemy.killedByMelee || enemy.meleeKill) {
      baseXP = XP_SOURCES.melee_kill;
      reason = 'melee_kill';
    }

    var sx = null, sy = null;
    if (enemy.screenPos) { sx = enemy.screenPos.x; sy = enemy.screenPos.y; }

    addXP(baseXP, reason, sx, sy);

    /* headshot bonus */
    if (enemy.headshot || enemy.isHeadshot) {
      addXP(XP_SOURCES.headshot, 'headshot', sx, sy);
    }
  }

  /* ════════════════════════════════════════════════════════════════
     PUBLIC GETTERS
  ════════════════════════════════════════════════════════════════ */
  function getLevel() { return _level; }
  function getXP()    { return _xp; }

  /* ════════════════════════════════════════════════════════════════
     RESET
  ════════════════════════════════════════════════════════════════ */
  function reset() {
    _level    = 1;
    _xp       = 0;
    _prestige = 0;
    _save();
    _updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════
     HOOK INTO GameManager
  ════════════════════════════════════════════════════════════════ */
  function _hookGameManager() {
    if (window.GameManager && typeof window.GameManager.onKill === 'function') {
      var _orig = window.GameManager.onKill;
      window.GameManager.onKill = function (enemy) {
        onKill(enemy);
        return _orig.apply(window.GameManager, arguments);
      };
    }
  }

  /* ════════════════════════════════════════════════════════════════
     HOOK DailyChallenges
  ════════════════════════════════════════════════════════════════ */
  function _hookDailyChallenges() {
    if (window.DailyChallenges && typeof window.DailyChallenges.onComplete === 'function') {
      var _origDC = window.DailyChallenges.onComplete;
      window.DailyChallenges.onComplete = function (challenge) {
        addXP(200, 'challenge_complete');
        return _origDC.apply(window.DailyChallenges, arguments);
      };
    }
  }

  /* ════════════════════════════════════════════════════════════════
     RE-APPLY MILESTONES after load (so persisted levels keep perks)
  ════════════════════════════════════════════════════════════════ */
  function _reapplyMilestones() {
    var lv;
    for (lv in MILESTONES) {
      if (MILESTONES.hasOwnProperty(lv) && parseInt(lv, 10) <= _level) {
        _applyMilestone(parseInt(lv, 10));
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════════════ */
  function init(scene, camera) {
    if (_initialized) return;
    _initialized = true;

    _load();
    _buildHUD();
    _reapplyMilestones();
    _updateHUD();
    _hookGameManager();
    _hookDailyChallenges();
  }

  /* ════════════════════════════════════════════════════════════════
     UPDATE (call each frame with dt in seconds)
  ════════════════════════════════════════════════════════════════ */
  function update(dt) {
    if (!_initialized) return;

    /* XP bar pulse on gain */
    if (_xpBarPulseTimer > 0) {
      _xpBarPulseTimer -= dt;
      if (_xpBarFill) {
        var scale = 1 + 0.08 * Math.max(0, _xpBarPulseTimer / 0.4);
        _xpBarFill.style.transformOrigin = 'left center';
        _xpBarFill.style.transform = 'scaleY(' + scale.toFixed(3) + ')';
      }
    } else {
      if (_xpBarFill) _xpBarFill.style.transform = 'scaleY(1)';
    }

    /* freeze timer */
    if (_levelUpFreezeTimer > 0) {
      _levelUpFreezeTimer -= dt;
      if (_levelUpFreezeTimer < 0) _levelUpFreezeTimer = 0;
      _updateHUD();
    }

    /* level-up text animation */
    if (_levelUpAnimTimer > 0) {
      _levelUpAnimTimer -= dt;

      if (_levelUpEl) {
        /* animate upward */
        var progress  = 1 - (_levelUpAnimTimer / 2.5);
        var bottomPx  = 60 + Math.round(progress * (window.innerHeight * 0.35));
        var fadeStart = 1.5;
        var opacity   = (_levelUpAnimTimer < fadeStart)
          ? (_levelUpAnimTimer / fadeStart)
          : 1;

        _levelUpEl.style.transition = 'none';
        _levelUpEl.style.bottom     = bottomPx + 'px';
        _levelUpEl.style.opacity    = opacity.toFixed(3);
      }

      if (_levelUpAnimTimer <= 0) {
        if (_levelUpEl) _levelUpEl.style.display = 'none';

        /* show prestige prompt after animation completes */
        if (_prestigeWaiting) {
          _prestigeWaiting = false;
          _showPrestigePrompt();
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════
     AUTO-INIT on DOMContentLoaded if not already done
  ════════════════════════════════════════════════════════════════ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(null, null); });
  } else {
    setTimeout(function () { init(null, null); }, 0);
  }

  /* ════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════ */
  return {
    init:     init,
    update:   update,
    addXP:    addXP,
    onKill:   onKill,
    getLevel: getLevel,
    getXP:    getXP,
    reset:    reset
  };

})();
