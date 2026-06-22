window.KillstreakRewards = (function() {
  'use strict';

  var _streak = 0;
  var _streakTimer = 0;
  var _STREAK_TIMEOUT = 8;
  var _totalKills = 0;
  var _hudEl = null;
  var _streakEl = null;
  var _audioCtx = null;
  var _grantedThisStreak = {};

  var REWARDS = [
    { kills: 3,  name: 'UAV',         key: 'UAV',   msg: '📡 UAV ONLINE — enemies revealed 30s' },
    { kills: 5,  name: 'AIRSTRIKE',   key: 'AIR',   msg: '✈ AIRSTRIKE READY — Ctrl+O to fire' },
    { kills: 7,  name: 'NAPALM',      key: 'NAP',   msg: '🔥 NAPALM STRIKE INBOUND' },
    { kills: 10, name: 'NUKE ASSIST', key: 'NUKE_A',msg: '☢ NUKE CHARGES REFILLED' },
    { kills: 15, name: 'LEGENDARY',   key: 'LEG',   msg: '🌟 LEGENDARY KILLSTREAK — score ×2 for 30s' }
  ];

  function _getAudio() {
    if (!_audioCtx) _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    return _audioCtx;
  }

  function _playKillTone(n) {
    try {
      var ctx = _getAudio();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      var f = 300 + n * 60;
      osc.frequency.setValueAtTime(f, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(f * 1.5, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(); osc.stop(ctx.currentTime + 0.25);
    } catch(e) {}
  }

  function _playFanfare() {
    try {
      var ctx = _getAudio();
      var notes = [523, 659, 784, 1047];
      for (var i = 0; i < notes.length; i++) {
        (function(freq, delay) {
          var osc = ctx.createOscillator();
          var g = ctx.createGain();
          osc.connect(g); g.connect(ctx.destination);
          osc.type = 'square'; osc.frequency.value = freq;
          g.gain.setValueAtTime(0, ctx.currentTime + delay);
          g.gain.linearRampToValueAtTime(0.08, ctx.currentTime + delay + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.28);
          osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.3);
        })(notes[i], i * 0.12);
      }
    } catch(e) {}
  }

  function _createHUD() {
    _streakEl = document.createElement('div');
    _streakEl.style.cssText = 'position:fixed;top:50%;right:16px;transform:translateY(-50%);color:#FFD700;font-family:monospace;font-size:13px;font-weight:bold;text-align:right;text-shadow:0 0 8px #FF8800;z-index:600;pointer-events:none;line-height:1.5;display:none';
    document.body.appendChild(_streakEl);

    _hudEl = document.createElement('div');
    _hudEl.style.cssText = 'position:fixed;top:45%;left:50%;transform:translate(-50%,-50%);color:#FFD700;font-family:monospace;font-size:28px;font-weight:bold;text-shadow:0 0 20px #FF8800;z-index:2000;pointer-events:none;display:none;text-align:center;letter-spacing:3px';
    document.body.appendChild(_hudEl);
  }

  function _grantReward(reward) {
    if (_grantedThisStreak[reward.key]) return;
    _grantedThisStreak[reward.key] = true;
    _playFanfare();
    if (window.HUD && window.HUD.showToast) window.HUD.showToast(reward.msg);
    _hudEl.textContent = '🏆 ' + reward.name + ' 🏆';
    _hudEl.style.display = 'block';
    setTimeout(function() { _hudEl.style.display = 'none'; }, 2000);

    if (reward.key === 'UAV') {
      window._uavActive = true;
      if (window.Enemies && window.Enemies.getAll) {
        var en = window.Enemies.getAll();
        for (var i = 0; i < en.length; i++) { if (en[i]) en[i]._revealedByDrone = true; }
      }
      setTimeout(function() { window._uavActive = false; }, 30000);
    } else if (reward.key === 'AIR') {
      window._orbitalStrikeCharges = (window._orbitalStrikeCharges || 0) + 2;
    } else if (reward.key === 'NAP') {
      _napalm();
    } else if (reward.key === 'NUKE_A') {
      if (window.NukeStrike) window.NukeStrike.reset();
    } else if (reward.key === 'LEG') {
      window._scoreMultiplier = (window._scoreMultiplier || 1) * 2;
      setTimeout(function() { window._scoreMultiplier = Math.max(1, (window._scoreMultiplier || 2) / 2); }, 30000);
    }
  }

  function _napalm() {
    var cx = window._camera ? window._camera.position.x : 0;
    var cz = window._camera ? window._camera.position.z : 0;
    var fwd = new THREE.Vector3(0,0,-1);
    if (window._camera) fwd.applyEuler(window._camera.rotation);
    var tx = cx + fwd.x * 25;
    var tz = cz + fwd.z * 25;
    var scene = window._gameScene;
    if (!scene) return;
    var patches = [];
    for (var i = 0; i < 8; i++) {
      var geo = new THREE.CircleGeometry(1.5 + Math.random(), 8);
      var mat = new THREE.MeshBasicMaterial({ color: 0xFF5500, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
      var m = new THREE.Mesh(geo, mat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(tx + (Math.random()-0.5)*16, 0.1, tz + (Math.random()-0.5)*16);
      scene.add(m);
      patches.push(m);
    }
    var elapsed = 0;
    var iv = setInterval(function() {
      elapsed += 0.5;
      if (elapsed >= 12) {
        clearInterval(iv);
        for (var k = 0; k < patches.length; k++) scene.remove(patches[k]);
        return;
      }
      if (window.Enemies && window.Enemies.getAll) {
        var en = window.Enemies.getAll();
        for (var j = 0; j < en.length; j++) {
          var e = en[j];
          if (!e || !e.mesh) continue;
          var dx = e.mesh.position.x - tx;
          var dz = e.mesh.position.z - tz;
          if (dx*dx + dz*dz < 100) {
            if (e.takeDamage) e.takeDamage(12);
            else if (e.health !== undefined) e.health -= 12;
          }
        }
      }
    }, 500);
  }

  function _updateHUD() {
    if (!_streakEl) return;
    if (_streak <= 0) { _streakEl.style.display = 'none'; return; }
    _streakEl.style.display = 'block';
    var lines = ['KILLSTREAK: ' + _streak];
    for (var i = 0; i < REWARDS.length; i++) {
      var r = REWARDS[i];
      if (_grantedThisStreak[r.key]) { lines.push('✓ ' + r.name); continue; }
      var diff = r.kills - _streak;
      if (diff > 0 && diff <= 6) lines.push('· ' + r.name + ' [' + diff + ' more]');
    }
    _streakEl.innerHTML = lines.join('<br>');
  }

  function onKill() {
    _streak++;
    _totalKills++;
    _streakTimer = _STREAK_TIMEOUT;
    _playKillTone(_streak);
    var label = null;
    if (_streak === 3) label = '🔥 TRIPLE KILL';
    else if (_streak === 5) label = '💀 KILLING SPREE';
    else if (_streak === 7) label = '⚡ RAMPAGE';
    else if (_streak === 10) label = '🌟 UNSTOPPABLE';
    else if (_streak === 15) label = '☠ LEGENDARY';
    else if (_streak > 1) label = '×' + _streak + ' KILLSTREAK';
    if (label && window.HUD && window.HUD.showToast) window.HUD.showToast(label);
    for (var i = 0; i < REWARDS.length; i++) {
      if (_streak >= REWARDS[i].kills) _grantReward(REWARDS[i]);
    }
    _updateHUD();
  }

  function update(dt) {
    if (_streak > 0) {
      _streakTimer -= dt;
      if (_streakTimer <= 0) {
        _streak = 0;
        _grantedThisStreak = {};
        _updateHUD();
      }
    }
  }

  function init() {
    _createHUD();
    var prev = window._onEnemyKilled;
    window._onEnemyKilled = function(enemy) {
      if (prev) prev(enemy);
      onKill();
    };
  }

  function reset() {
    _streak = 0;
    _streakTimer = 0;
    _totalKills = 0;
    _grantedThisStreak = {};
    _updateHUD();
  }

  return { init: init, update: update, onKill: onKill, reset: reset };
})();
