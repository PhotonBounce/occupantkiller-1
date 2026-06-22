window.KillStreak = (function() {
  'use strict';
  // var only

  var _currentStreak = 0;
  var _bullettimeActive = false;
  var _bullettimeTimer = 0;
  var _bullettimeDuration = 5.0;
  var _bullettimeScale = 0.4;      // time scale during bullet time
  var _normalTimeScale = 1.0;
  var _statusEl = null;
  var _btOverlay = null;

  // Streak milestones: { kills, reward, announced }
  var MILESTONES = [
    { kills: 3,  id: 'DOUBLE_KILL',   name: 'DOUBLE KILL',    icon: '⚡', reward: function() { _grantHealthRegen(15); } },
    { kills: 5,  id: 'KILLING_SPREE', name: 'KILLING SPREE',  icon: '🔥', reward: function() { _grantAmmoRefill(0.3); } },
    { kills: 7,  id: 'BULLET_TIME',   name: 'BULLET TIME',    icon: '🌀', reward: function() { _activateBulletTime(); } },
    { kills: 10, id: 'UNSTOPPABLE',   name: 'UNSTOPPABLE',    icon: '💀', reward: function() { _grantHealthRegen(30); _grantAmmoRefill(0.5); } },
    { kills: 15, id: 'GODLIKE',       name: 'GODLIKE',        icon: '⭐', reward: function() { _activateBulletTime(); _grantHealthRegen(50); } },
  ];
  var _announcedMilestones = {};

  function _showStreakNotif(milestone) {
    // Remove old
    var old = document.getElementById('streak-notif');
    if (old) old.parentNode.removeChild(old);

    var el = document.createElement('div');
    el.id = 'streak-notif';
    el.style.cssText = [
      'position:fixed;top:25%;left:50%;transform:translateX(-50%);',
      'font-family:monospace;font-size:22px;font-weight:bold;',
      'color:#ffdd00;text-align:center;',
      'text-shadow:0 0 20px rgba(255,200,0,0.8);',
      'pointer-events:none;z-index:8200;',
      'animation:streakPop 0.3s ease;',
      'opacity:1;transition:opacity 0.5s;',
    ].join('');

    if (!document.getElementById('streak-style')) {
      var style = document.createElement('style');
      style.id = 'streak-style';
      style.textContent = '@keyframes streakPop { from { transform:translateX(-50%) scale(0.5); opacity:0; } to { transform:translateX(-50%) scale(1); opacity:1; } }';
      document.head.appendChild(style);
    }

    el.innerHTML = '<div style="font-size:32px">' + milestone.icon + '</div>' +
      '<div>' + milestone.name + '</div>' +
      '<div style="font-size:13px;color:#ffaa00">' + _currentStreak + ' KILLS IN A ROW</div>';
    document.body.appendChild(el);

    setTimeout(function() {
      if (el.parentNode) {
        el.style.opacity = '0';
        setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 500);
      }
    }, 2500);
  }

  function _activateBulletTime() {
    _bullettimeActive = true;
    _bullettimeTimer = _bullettimeDuration;

    // Overlay
    if (!_btOverlay) {
      _btOverlay = document.createElement('div');
      _btOverlay.id = 'bt-overlay';
      _btOverlay.style.cssText = [
        'position:fixed;top:0;left:0;width:100%;height:100%;',
        'pointer-events:none;z-index:7500;',
        'background:radial-gradient(ellipse, rgba(0,50,150,0.0) 60%, rgba(0,0,80,0.3) 100%);',
        'border:3px solid rgba(100,150,255,0.3);',
        'transition:opacity 0.3s;',
      ].join('');
      _btOverlay.innerHTML = '<div style="position:absolute;top:10px;left:50%;transform:translateX(-50%);font-family:monospace;font-size:11px;color:rgba(100,150,255,0.8);letter-spacing:4px;">BULLET TIME</div>';
      document.body.appendChild(_btOverlay);
    }
    _btOverlay.style.opacity = '1';

    // Tell game-manager to slow time
    window._killstreakTimeScale = _bullettimeScale;
  }

  function _deactivateBulletTime() {
    _bullettimeActive = false;
    window._killstreakTimeScale = _normalTimeScale;
    if (_btOverlay) {
      _btOverlay.style.opacity = '0';
      setTimeout(function() {
        if (_btOverlay && _btOverlay.parentNode) {
          _btOverlay.parentNode.removeChild(_btOverlay);
          _btOverlay = null;
        }
      }, 300);
    }
  }

  function _grantHealthRegen(amount) {
    // Set a regen flag that game-manager reads
    window._killstreakHealthRegen = (window._killstreakHealthRegen || 0) + amount;
  }

  function _grantAmmoRefill(fraction) {
    window._killstreakAmmoRefill = Math.max(window._killstreakAmmoRefill || 0, fraction);
  }

  function onKill() {
    _currentStreak++;
    // Update status display
    _updateStatusEl();
    // Check milestones
    for (var i = 0; i < MILESTONES.length; i++) {
      var m = MILESTONES[i];
      if (_currentStreak >= m.kills && !_announcedMilestones[m.id]) {
        _announcedMilestones[m.id] = true;
        _showStreakNotif(m);
        m.reward();
      }
    }
  }

  function onDeath() {
    _currentStreak = 0;
    _announcedMilestones = {};
    _deactivateBulletTime();
    _updateStatusEl();
  }

  function onWaveClear() {
    // Reset streak between waves but keep bullet time going if active
    _currentStreak = 0;
    _announcedMilestones = {};
    _updateStatusEl();
  }

  function _updateStatusEl() {
    if (!_statusEl) {
      _statusEl = document.createElement('div');
      _statusEl.id = 'streak-status';
      _statusEl.style.cssText = [
        'position:fixed;right:15px;top:50%;transform:translateY(-50%);',
        'font-family:monospace;font-size:11px;color:#ffaa00;',
        'pointer-events:none;z-index:4100;text-align:right;',
      ].join('');
      document.body.appendChild(_statusEl);
    }
    if (_currentStreak >= 3) {
      _statusEl.textContent = '🔥 x' + _currentStreak;
      _statusEl.style.display = 'block';
    } else {
      _statusEl.style.display = 'none';
    }
  }

  function update(delta) {
    if (_bullettimeActive) {
      _bullettimeTimer -= delta;
      if (_bullettimeTimer <= 0) {
        _deactivateBulletTime();
      }
    }

    // Apply killstreak time scale
    // (Game loop reads window._killstreakTimeScale)
  }

  function getTimeScale() {
    return _bullettimeActive ? _bullettimeScale : _normalTimeScale;
  }

  function getStreak() { return _currentStreak; }

  function reset() {
    onDeath();
  }

  return {
    onKill: onKill,
    onDeath: onDeath,
    onWaveClear: onWaveClear,
    update: update,
    getTimeScale: getTimeScale,
    getStreak: getStreak,
    reset: reset,
  };
})();
