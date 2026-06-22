// killstreak-rewards.js — Escalating kill streak reward milestones
// Ukraine conflict FPS — Three.js browser game
// IIFE pattern, all var (no let/const)

window.KillstreakRewards = (function () {
  'use strict';

  // ─── Private state ────────────────────────────────────────────────────────
  var _streak        = 0;         // consecutive kills without dying
  var _timerSec      = 0;         // seconds since last kill (8-second window)
  var _timerMax      = 8;         // kill timer window in seconds
  var _lastKillTime  = 0;         // performance.now() timestamp of last kill
  var _ticking       = false;     // RAF loop running?
  var _rafId         = 0;
  var _lastFrameTime = 0;

  // DOM elements
  var _hudEl         = null;      // bottom-center streak counter container
  var _counterEl     = null;      // fire + number text
  var _timerBarEl    = null;      // countdown bar container
  var _timerFillEl   = null;      // countdown bar fill
  var _timerTextEl   = null;      // seconds text below streak

  // Screen overlay elements (created on demand)
  var _redTintEl     = null;      // RAMPAGE red screen tint
  var _goldBorderEl  = null;      // UNSTOPPABLE gold border flash
  var _purpleAuraEl  = null;      // LEGENDARY purple aurora border

  // Milestone tracking — set of milestone kills already fired this streak
  var _firedMilestones = {};

  // AudioContext (lazy-created)
  var _audioCtx = null;

  // Milestone definitions
  var MILESTONES = [
    {
      kills: 5,
      name: 'KILLING SPREE',
      score: 200,
      color: '#ff8800',
      onFire: function () {
        _addScore(200);
        _spawnAmmoPickup();
        _playFanfare3();
      }
    },
    {
      kills: 10,
      name: 'RAMPAGE',
      score: 500,
      color: '#ff4400',
      onFire: function () {
        _addScore(500);
        _spawnHealthPack();
        _showRedTint();
        _playFanfare5();
      }
    },
    {
      kills: 15,
      name: 'UNSTOPPABLE',
      score: 1000,
      color: '#ffcc00',
      onFire: function () {
        _addScore(1000);
        _refillCurrentWeaponAmmo();
        _showGoldBorderFlash();
        _playChord();
      }
    },
    {
      kills: 20,
      name: 'GODLIKE',
      score: 2000,
      color: '#ff00ff',
      onFire: function () {
        _addScore(2000);
        _activateInvincibility(5000);
        _playBassDrop();
      }
    }
  ];

  // ─── Public globals ───────────────────────────────────────────────────────
  window._currentKillstreak = 0;
  window._killstreakInvincible = false;

  // ─── Score helper ─────────────────────────────────────────────────────────
  function _addScore(amount) {
    if (typeof window.GameManager !== 'undefined' && typeof window.GameManager.addScore === 'function') {
      window.GameManager.addScore(amount);
    } else if (typeof window._score !== 'undefined') {
      window._score += amount;
    }
    var el = document.getElementById('score-display');
    if (el) {
      var current = parseInt((el.textContent || '0').replace(/[^0-9]/g, ''), 10) || 0;
      el.textContent = 'SCORE: ' + (current + amount);
    }
  }

  // ─── Reward: spawn ammo pickup near player ────────────────────────────────
  function _spawnAmmoPickup() {
    if (typeof window.Pickups !== 'undefined' && typeof window.Pickups.spawnNearPlayer === 'function') {
      window.Pickups.spawnNearPlayer('ammo');
    } else if (typeof window.GameManager !== 'undefined' && typeof window.GameManager.spawnPickup === 'function') {
      window.GameManager.spawnPickup('ammo');
    }
  }

  // ─── Reward: spawn health pack ────────────────────────────────────────────
  function _spawnHealthPack() {
    if (typeof window.Pickups !== 'undefined' && typeof window.Pickups.spawnNearPlayer === 'function') {
      window.Pickups.spawnNearPlayer('health');
    } else if (typeof window.GameManager !== 'undefined' && typeof window.GameManager.spawnPickup === 'function') {
      window.GameManager.spawnPickup('health');
    }
  }

  // ─── Reward: full ammo refill for current weapon ──────────────────────────
  function _refillCurrentWeaponAmmo() {
    if (typeof window.GameManager !== 'undefined' && typeof window.GameManager.refillAmmo === 'function') {
      window.GameManager.refillAmmo();
    } else if (typeof window._playerAmmo !== 'undefined') {
      window._playerAmmo = window._playerAmmoMax || 999;
    }
    // Try to update ammo HUD
    var ammoEl = document.getElementById('ammo-display');
    var reserveEl = document.getElementById('ammo-reserve');
    if (ammoEl) { ammoEl.textContent = '∞'; }
    if (reserveEl) { reserveEl.textContent = '/ MAX'; }
  }

  // ─── Reward: temporary invincibility ─────────────────────────────────────
  function _activateInvincibility(ms) {
    window._killstreakInvincible = true;
    var shield = document.getElementById('shield-indicator');
    if (shield) { shield.style.display = 'block'; }
    setTimeout(function () {
      window._killstreakInvincible = false;
      if (shield) { shield.style.display = 'none'; }
    }, ms);
  }

  // ─── Screen FX: red tint (RAMPAGE, 3 seconds) ────────────────────────────
  function _showRedTint() {
    if (!_redTintEl) {
      _redTintEl = document.createElement('div');
      _redTintEl.id = 'ks-red-tint';
      _redTintEl.style.cssText = [
        'position:fixed;top:0;left:0;right:0;bottom:0;',
        'background:rgba(180,0,0,0.18);',
        'pointer-events:none;z-index:8100;',
        'transition:opacity 0.5s;'
      ].join('');
      document.body.appendChild(_redTintEl);
    }
    _redTintEl.style.opacity = '1';
    setTimeout(function () {
      if (_redTintEl) { _redTintEl.style.opacity = '0'; }
    }, 3000);
  }

  // ─── Screen FX: gold border flash (UNSTOPPABLE) ───────────────────────────
  function _showGoldBorderFlash() {
    if (!_goldBorderEl) {
      _goldBorderEl = document.createElement('div');
      _goldBorderEl.id = 'ks-gold-border';
      _goldBorderEl.style.cssText = [
        'position:fixed;top:0;left:0;right:0;bottom:0;',
        'pointer-events:none;z-index:8101;',
        'box-shadow:inset 0 0 60px 20px rgba(255,200,0,0.7);',
        'transition:opacity 0.4s;'
      ].join('');
      document.body.appendChild(_goldBorderEl);
    }
    _goldBorderEl.style.opacity = '1';
    var flashes = 0;
    var intervalId = setInterval(function () {
      flashes++;
      _goldBorderEl.style.opacity = (flashes % 2 === 0) ? '1' : '0.1';
      if (flashes >= 6) {
        clearInterval(intervalId);
        _goldBorderEl.style.opacity = '0';
      }
    }, 200);
  }

  // ─── Screen FX: purple aurora border (LEGENDARY, persistent while streak active) ──
  function _showPurpleAura() {
    if (!_purpleAuraEl) {
      _purpleAuraEl = document.createElement('div');
      _purpleAuraEl.id = 'ks-purple-aura';
      _purpleAuraEl.style.cssText = [
        'position:fixed;top:0;left:0;right:0;bottom:0;',
        'pointer-events:none;z-index:8102;',
        'box-shadow:inset 0 0 80px 30px rgba(140,0,255,0.35);',
        'border:3px solid rgba(180,0,255,0.4);',
        'transition:opacity 0.5s;'
      ].join('');
      document.body.appendChild(_purpleAuraEl);
    }
    _purpleAuraEl.style.opacity = '1';
  }

  function _hidePurpleAura() {
    if (_purpleAuraEl) { _purpleAuraEl.style.opacity = '0'; }
  }

  // ─── Banner: large animated center-screen text ────────────────────────────
  function _showBanner(text, color) {
    // Remove any existing banner
    var old = document.getElementById('ks-banner');
    if (old && old.parentNode) { old.parentNode.removeChild(old); }

    // Inject keyframe CSS once
    if (!document.getElementById('ks-banner-style')) {
      var style = document.createElement('style');
      style.id = 'ks-banner-style';
      style.textContent = [
        '@keyframes ksBannerScale {',
        '  0%   { transform:translate(-50%,-50%) scale(0.4); opacity:0; }',
        '  30%  { transform:translate(-50%,-50%) scale(1.15); opacity:1; }',
        '  60%  { transform:translate(-50%,-50%) scale(1); opacity:1; }',
        '  100% { transform:translate(-50%,-50%) scale(0.9); opacity:0; }',
        '}',
        '.killstreak-banner {',
        '  position:fixed;top:38%;left:50%;',
        '  transform:translate(-50%,-50%);',
        '  font-family:monospace;font-weight:bold;font-size:42px;',
        '  text-align:center;pointer-events:none;z-index:8300;',
        '  text-shadow:0 0 30px currentColor, 0 2px 4px rgba(0,0,0,0.9);',
        '  animation:ksBannerScale 2s ease forwards;',
        '  white-space:nowrap;',
        '}'
      ].join('');
      document.head.appendChild(style);
    }

    var el = document.createElement('div');
    el.id = 'ks-banner';
    el.className = 'killstreak-banner';
    el.style.color = color || '#ffdd00';
    el.textContent = text;
    document.body.appendChild(el);

    setTimeout(function () {
      if (el.parentNode) { el.parentNode.removeChild(el); }
    }, 2100);
  }

  // ─── Audio: 3-note fanfare (5 kills) ─────────────────────────────────────
  function _getAudioCtx() {
    if (!_audioCtx) {
      try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
    return _audioCtx;
  }

  function _playTone(freq, startTime, duration, vol) {
    var ctx = _getAudioCtx();
    if (!ctx) { return; }
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(vol || 0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.01);
    } catch (e) {}
  }

  function _playFanfare3() {
    var ctx = _getAudioCtx();
    if (!ctx) { return; }
    var t = ctx.currentTime;
    _playTone(523.25, t,        0.18, 0.18);  // C5
    _playTone(659.25, t + 0.18, 0.18, 0.18);  // E5
    _playTone(783.99, t + 0.36, 0.25, 0.22);  // G5
  }

  function _playFanfare5() {
    var ctx = _getAudioCtx();
    if (!ctx) { return; }
    var t = ctx.currentTime;
    _playTone(392.00, t,        0.14, 0.15);  // G4
    _playTone(523.25, t + 0.14, 0.14, 0.16);  // C5
    _playTone(587.33, t + 0.28, 0.14, 0.17);  // D5
    _playTone(659.25, t + 0.42, 0.14, 0.18);  // E5
    _playTone(783.99, t + 0.56, 0.28, 0.22);  // G5
  }

  function _playChord() {
    // Full ascending chord (UNSTOPPABLE / GODLIKE)
    var ctx = _getAudioCtx();
    if (!ctx) { return; }
    var t = ctx.currentTime;
    // Stacked ascending notes
    var notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    for (var i = 0; i < notes.length; i++) {
      _playTone(notes[i], t + i * 0.09, 0.5, 0.15);
    }
  }

  function _playBassDrop() {
    // Bass drop for GODLIKE
    var ctx = _getAudioCtx();
    if (!ctx) { return; }
    try {
      var t = ctx.currentTime;
      // Low rumble sweep down
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.6);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      osc.start(t);
      osc.stop(t + 0.85);
      // Follow-up ascending chord
      _playChord();
    } catch (e) {}
  }

  // ─── HUD: streak counter (bottom-center) ─────────────────────────────────
  function _createHUD() {
    if (_hudEl) { return; }

    // Inject HUD CSS once
    if (!document.getElementById('ks-hud-style')) {
      var style = document.createElement('style');
      style.id = 'ks-hud-style';
      style.textContent = [
        '#ks-hud-root {',
        '  position:fixed;bottom:88px;left:50%;transform:translateX(-50%);',
        '  text-align:center;pointer-events:none;z-index:8050;',
        '  font-family:monospace;',
        '}',
        '#ks-counter {',
        '  font-size:18px;font-weight:bold;',
        '  transition:color 0.3s;',
        '  text-shadow:0 0 8px currentColor;',
        '}',
        '#ks-timer-bar {',
        '  width:80px;height:3px;background:rgba(0,0,0,0.4);',
        '  border:1px solid rgba(255,255,255,0.2);border-radius:2px;',
        '  margin:3px auto 0 auto;overflow:hidden;',
        '}',
        '#ks-timer-fill {',
        '  height:100%;width:100%;',
        '  background:linear-gradient(90deg,#ff4400,#ffcc00);',
        '  border-radius:2px;transition:width 0.1s linear;',
        '}',
        '#ks-timer-text {',
        '  font-size:9px;color:#888;margin-top:1px;letter-spacing:1px;',
        '}'
      ].join('');
      document.head.appendChild(style);
    }

    _hudEl = document.createElement('div');
    _hudEl.id = 'ks-hud-root';

    _counterEl = document.createElement('div');
    _counterEl.id = 'ks-counter';

    _timerBarEl = document.createElement('div');
    _timerBarEl.id = 'ks-timer-bar';

    _timerFillEl = document.createElement('div');
    _timerFillEl.id = 'ks-timer-fill';
    _timerBarEl.appendChild(_timerFillEl);

    _timerTextEl = document.createElement('div');
    _timerTextEl.id = 'ks-timer-text';

    _hudEl.appendChild(_counterEl);
    _hudEl.appendChild(_timerBarEl);
    _hudEl.appendChild(_timerTextEl);
    document.body.appendChild(_hudEl);
  }

  function _getStreakColor(n) {
    if (n >= 20) { return '#ff00ff'; }
    if (n >= 15) { return '#ff2200'; }
    if (n >= 10) { return '#ff6600'; }
    if (n >= 5)  { return '#ffcc00'; }
    return '#ffffff';
  }

  function _updateHUD() {
    if (!_hudEl) { return; }
    if (_streak <= 0) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';
    _counterEl.style.color = _getStreakColor(_streak);
    _counterEl.textContent = '🔥 ' + _streak;  // 🔥
    var pct = Math.max(0, Math.min(1, (_timerMax - _timerSec) / _timerMax));
    _timerFillEl.style.width = (pct * 100).toFixed(1) + '%';
    var remaining = Math.max(0, _timerMax - _timerSec);
    _timerTextEl.textContent = remaining.toFixed(1) + 's';
  }

  // ─── Check and fire milestone rewards ────────────────────────────────────
  function _checkMilestones() {
    var i;
    for (i = 0; i < MILESTONES.length; i++) {
      var m = MILESTONES[i];
      if (_streak >= m.kills && !_firedMilestones[m.kills]) {
        _firedMilestones[m.kills] = true;
        _showBanner(m.name, m.color);
        m.onFire();
      }
    }
    // LEGENDARY: 25+ kills — +500 per kill bonus, purple aura
    if (_streak >= 25) {
      if (!_firedMilestones['legendary_aura']) {
        _firedMilestones['legendary_aura'] = true;
        _showBanner('LEGENDARY', '#cc44ff');
        _showPurpleAura();
      }
      // +500 bonus every kill beyond 25
      _addScore(500);
    }
  }

  // ─── RAF tick loop ────────────────────────────────────────────────────────
  function _tick(nowMs) {
    if (!_ticking) { return; }
    _rafId = requestAnimationFrame(_tick);

    if (_lastFrameTime === 0) { _lastFrameTime = nowMs; }
    var dt = (nowMs - _lastFrameTime) / 1000;
    _lastFrameTime = nowMs;

    if (_streak > 0) {
      _timerSec += dt;
      if (_timerSec >= _timerMax) {
        // Streak timed out
        _resetStreak(false);
        return;
      }
    }
    _updateHUD();
  }

  function _startTick() {
    if (_ticking) { return; }
    _ticking = true;
    _lastFrameTime = 0;
    _rafId = requestAnimationFrame(_tick);
  }

  function _stopTick() {
    _ticking = false;
    if (_rafId) {
      cancelAnimationFrame(_rafId);
      _rafId = 0;
    }
  }

  // ─── Reset streak ─────────────────────────────────────────────────────────
  function _resetStreak(fromDeath) {
    _streak = 0;
    _timerSec = 0;
    _firedMilestones = {};
    window._currentKillstreak = 0;
    _hidePurpleAura();
    _updateHUD();
    if (fromDeath) {
      // Hide HUD immediately on death
      if (_hudEl) { _hudEl.style.display = 'none'; }
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  function init() {
    _createHUD();
    _startTick();

    // Death hook — called by game when player dies
    window._onPlayerDeathForStreak = function () {
      _resetStreak(true);
    };

    // Kill hook — called by game whenever a kill is confirmed
    window._onKillForStreak = function () {
      onKill();
    };
  }

  function onKill() {
    _streak += 1;
    _timerSec = 0;
    _lastKillTime = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    window._currentKillstreak = _streak;

    _checkMilestones();
    _updateHUD();

    if (!_ticking) { _startTick(); }
  }

  function reset() {
    _resetStreak(false);
    _stopTick();
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
      _hudEl = null;
      _counterEl = null;
      _timerBarEl = null;
      _timerFillEl = null;
      _timerTextEl = null;
    }
    window._currentKillstreak = 0;
    window._killstreakInvincible = false;
  }

  return { init: init, onKill: onKill, reset: reset };

}());
