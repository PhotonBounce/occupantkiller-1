window.HeadshotSystem = (function() {
  'use strict';

  var _headshots = 0;
  var _totalKills = 0;
  var _audioCtx = null;
  var _hudEl = null;
  var _streakEl = null;
  var _lastHeadshotTime = 0;
  var _headshotStreak = 0;
  var _STREAK_WINDOW = 12;

  var _HEADSHOT_BONUS = 150;
  var _STREAK_BONUSES = [0, 0, 300, 500, 800, 1200, 2000];

  function _getAudio() {
    if (!_audioCtx) _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    return _audioCtx;
  }

  function _playHeadshotSound(isStreak) {
    try {
      var ctx = _getAudio();
      if (isStreak) {
        // Rising triumphant ping
        var freqs = [523, 659, 784, 1047];
        for (var i = 0; i < freqs.length; i++) {
          (function(freq, delay) {
            var osc = ctx.createOscillator();
            var g = ctx.createGain();
            osc.connect(g); g.connect(ctx.destination);
            osc.type = 'sine'; osc.frequency.value = freq;
            var t = ctx.currentTime + delay;
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.12, t + 0.02);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            osc.start(t); osc.stop(t + 0.3);
          })(freqs[i], i * 0.08);
        }
      } else {
        // Crisp metallic ping
        var osc = ctx.createOscillator();
        var g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);
        g.gain.setValueAtTime(0.15, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(); osc.stop(ctx.currentTime + 0.25);
      }
    } catch(e) {}
  }

  function _showHeadshotText(streakCount) {
    var el = document.createElement('div');
    var isStreak = streakCount >= 2;
    var labels = ['', 'HEADSHOT', 'DOUBLE TAP', 'TRIPLE SHOT', 'QUAD KILL', 'RAMPAGE'];
    var label = labels[Math.min(streakCount, labels.length - 1)] || 'HEADSHOT';
    el.textContent = label + ' +' + (_HEADSHOT_BONUS + (_STREAK_BONUSES[Math.min(streakCount, _STREAK_BONUSES.length - 1)] || 0));
    var hue = isStreak ? '45deg' : '0deg';
    var color = isStreak ? '#FFD700' : '#FF4444';
    el.style.cssText = [
      'position:fixed',
      'top:38%',
      'left:50%',
      'transform:translateX(-50%)',
      'color:' + color,
      'font-family:monospace',
      'font-size:' + (isStreak ? '22' : '17') + 'px',
      'font-weight:bold',
      'text-shadow:0 0 10px ' + color + ',0 0 20px ' + color,
      'pointer-events:none',
      'z-index:2800',
      'transition:transform 0.6s,opacity 0.6s',
      'opacity:1'
    ].join(';');
    document.body.appendChild(el);
    setTimeout(function() {
      el.style.transform = 'translateX(-50%) translateY(-40px)';
      el.style.opacity = '0';
    }, 50);
    setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 700);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var acc = _totalKills > 0 ? Math.round((_headshots / _totalKills) * 100) : 0;
    _hudEl.textContent = '🎯 ' + _headshots + ' HS (' + acc + '%)';
  }

  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'headshot-hud';
    _hudEl.style.cssText = 'position:fixed;top:8px;right:16px;color:#FF4444;font-family:monospace;font-size:12px;font-weight:bold;text-shadow:0 0 6px #FF2200;z-index:1300;pointer-events:none';
    document.body.appendChild(_hudEl);
    _updateHUD();
  }

  function onBulletHit(hitObject, hitPoint) {
    if (!hitObject) return false;

    var isHead = false;
    // Check if hit point Y is above the object's base + ~75% height
    if (hitPoint && hitObject.position) {
      var relY = hitPoint.y - hitObject.position.y;
      // Head is typically at 0.9-1.2 units above mesh origin for humanoid enemies
      if (relY > 0.75) isHead = true;
    }
    // Fallback: check if we hit a child mesh named/positioned as head
    if (!isHead && hitObject.parent) {
      var parent = hitObject.parent;
      if (hitObject.position && hitObject.position.y > 0.8) isHead = true;
    }
    return isHead;
  }

  function registerHeadshot(enemyMesh) {
    var now = Date.now() / 1000;
    _headshots++;
    _totalKills++;

    if (now - _lastHeadshotTime < _STREAK_WINDOW) {
      _headshotStreak++;
    } else {
      _headshotStreak = 1;
    }
    _lastHeadshotTime = now;

    var streakBonus = _STREAK_BONUSES[Math.min(_headshotStreak, _STREAK_BONUSES.length - 1)] || 0;
    var totalBonus = _HEADSHOT_BONUS + streakBonus;

    // Apply score
    if (window.player && window.player.score !== undefined) {
      window.player.score += totalBonus;
      if (window.HUD && window.HUD.setScore) window.HUD.setScore(window.player.score);
    }

    _playHeadshotSound(_headshotStreak >= 2);
    _showHeadshotText(_headshotStreak);

    if (_headshotStreak >= 3 && window.HUD && window.HUD.showToast) {
      var streakLabels = ['', '', '', 'TRIPLE HEADSHOT!', 'QUAD HEADSHOT!', 'HEADSHOT RAMPAGE!'];
      var label = streakLabels[Math.min(_headshotStreak, streakLabels.length - 1)] || (_headshotStreak + 'x HEADSHOT STREAK!');
      window.HUD.showToast(label);
    }

    _updateHUD();

    window._lastHeadshotTime = now;
    window._headshotStreak = _headshotStreak;

    return totalBonus;
  }

  function registerKill() {
    _totalKills++;
    _updateHUD();
  }

  function init() {
    _createHUD();
    window._onHeadshot = registerHeadshot;
    window._registerKill = registerKill;
    window._headshotCount = 0;
    window._headshotStreak = 0;
  }

  function update(dt) {
    var now = Date.now() / 1000;
    if (_headshotStreak > 0 && now - _lastHeadshotTime > _STREAK_WINDOW) {
      _headshotStreak = 0;
      window._headshotStreak = 0;
    }
  }

  function reset() {
    _headshots = 0;
    _totalKills = 0;
    _headshotStreak = 0;
    _lastHeadshotTime = 0;
    window._headshotCount = 0;
    window._headshotStreak = 0;
    _updateHUD();
  }

  function getStats() {
    return { headshots: _headshots, kills: _totalKills, accuracy: _totalKills > 0 ? _headshots / _totalKills : 0, streak: _headshotStreak };
  }

  return { init: init, update: update, reset: reset, registerHeadshot: registerHeadshot, registerKill: registerKill, onBulletHit: onBulletHit, getStats: getStats };
})();
