window.TimeRewind = (function() {
  'use strict';

  var _snapshots = [];
  var _maxSnapshots = 40;
  var _recordInterval = 0.1;
  var _recordTimer = 0;
  var _cooldown = 0;
  var _COOLDOWN = 90;
  var _charges = 1;
  var _hudEl = null;
  var _audioCtx = null;
  var _active = false;

  function _getAudio() {
    if (!_audioCtx) _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    return _audioCtx;
  }

  function _playRewindSound() {
    try {
      var ctx = _getAudio();
      // Reverse time audio - swept filter on noise going backwards
      var buf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) {
        var t = i / ctx.sampleRate;
        d[i] = (Math.random() * 2 - 1) * Math.exp(-t * 4) * 0.3;
      }
      // Reverse the buffer
      d.reverse();
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var filt = ctx.createBiquadFilter();
      filt.type = 'bandpass'; filt.frequency.value = 1200;
      var g = ctx.createGain(); g.gain.value = 0.5;
      src.connect(filt); filt.connect(g); g.connect(ctx.destination);
      src.start();
    } catch(e) {}
  }

  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'time-rewind-hud';
    _hudEl.style.cssText = 'position:fixed;bottom:200px;right:16px;color:#4488FF;font-family:monospace;font-size:13px;font-weight:bold;text-shadow:0 0 8px #2266FF;z-index:1400;pointer-events:none';
    document.body.appendChild(_hudEl);
    _updateHUD();
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var cdText = _cooldown > 0 ? ' ' + Math.ceil(_cooldown) + 's' : (_charges > 0 ? ' READY' : '');
    _hudEl.textContent = '⏪ REWIND' + cdText;
    _hudEl.style.color = _cooldown > 0 ? '#666688' : '#4488FF';
  }

  function _activate() {
    if (_charges <= 0 || _cooldown > 0 || _active) {
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast(_cooldown > 0 ? 'TIME REWIND RECHARGING' : 'NO REWIND CHARGES');
      }
      return;
    }
    if (_snapshots.length < 3) {
      if (window.HUD && window.HUD.showToast) window.HUD.showToast('INSUFFICIENT TIMELINE DATA');
      return;
    }

    _active = true;
    _charges--;
    _cooldown = _COOLDOWN;

    var snap = _snapshots[0]; // Oldest = 4s ago
    var cam = window._camera;
    var player = window._gameManager ? window._gameManager.getPlayer() : (window.player || null);

    // Move player back
    if (cam && snap) {
      cam.position.set(snap.x, snap.y, snap.z);
    }

    // Restore HP
    if (player && snap && snap.hp !== undefined) {
      player.hp = Math.max(player.hp, snap.hp);
      if (window.HUD && window.HUD.setHealth) window.HUD.setHealth(player.hp);
    }

    // Screen flash blue
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(50,100,255,0.65);pointer-events:none;z-index:2900;transition:opacity 0.4s';
    document.body.appendChild(overlay);
    setTimeout(function() {
      overlay.style.opacity = '0';
      setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 400);
    }, 80);

    // Film grain flash
    var grain = document.createElement('div');
    grain.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:white;pointer-events:none;z-index:2950;opacity:0.8;transition:opacity 0.3s';
    document.body.appendChild(grain);
    setTimeout(function() {
      grain.style.opacity = '0';
      setTimeout(function() { if (grain.parentNode) grain.parentNode.removeChild(grain); }, 300);
    }, 50);

    // Ghost marker at old position
    var sc = window._gameScene || window._scene;
    if (sc && cam) {
      var ghostGeo = new THREE.SphereGeometry(0.3, 8, 8);
      var ghostMat = new THREE.MeshBasicMaterial({ color: 0x4488FF, transparent: true, opacity: 0.7 });
      var ghost = new THREE.Mesh(ghostGeo, ghostMat);
      ghost.position.copy(cam.position);
      sc.add(ghost);
      var ghostLight = new THREE.PointLight(0x4488FF, 6, 4);
      ghostLight.position.copy(ghost.position);
      sc.add(ghostLight);
      var fadeTimer = 0;
      var interval = setInterval(function() {
        fadeTimer += 0.05;
        ghostMat.opacity = Math.max(0, 0.7 - fadeTimer);
        ghostLight.intensity = Math.max(0, 6 - fadeTimer * 6);
        if (fadeTimer >= 1.0) {
          sc.remove(ghost);
          sc.remove(ghostLight);
          clearInterval(interval);
        }
      }, 50);
    }

    // Stagger enemies
    if (window.Enemies && window.Enemies.getAll) {
      var enemies = window.Enemies.getAll();
      for (var i = 0; i < Math.min(enemies.length, 8); i++) {
        var e = enemies[i];
        if (e && e.mesh) {
          e._stunned = true;
          e._stunTimer = (e._stunTimer || 0) + 1.5;
          if (e.mesh.rotation) e.mesh.rotation.z = (Math.random() - 0.5) * 0.5;
        }
      }
    }

    _playRewindSound();
    if (window.HUD && window.HUD.showToast) window.HUD.showToast('TIME REWOUND');
    _snapshots = [];
    _active = false;
    _updateHUD();
  }

  function init() {
    _createHUD();
    window._timeRewindActive = false;
    window._timeRewindCooldown = 0;

    document.addEventListener('keydown', function(e) {
      if (window._menuOpen || window._isPaused || window._inMenu) return;
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
      if (e.ctrlKey && e.code === 'KeyZ') {
        e.preventDefault();
        _activate();
      }
    });
  }

  function update(dt) {
    if (_cooldown > 0) {
      _cooldown -= dt;
      if (_cooldown <= 0) {
        _cooldown = 0;
        _charges = 1;
        if (window.HUD && window.HUD.showToast) window.HUD.showToast('⏪ TIME REWIND READY');
      }
      window._timeRewindCooldown = _cooldown;
      _updateHUD();
    }

    // Record player state
    _recordTimer -= dt;
    if (_recordTimer <= 0) {
      _recordTimer = _recordInterval;
      var cam = window._camera;
      var player = window.player || (window._gameManager && window._gameManager.getPlayer ? window._gameManager.getPlayer() : null);
      if (cam) {
        _snapshots.unshift({
          x: cam.position.x,
          y: cam.position.y,
          z: cam.position.z,
          hp: player ? (player.hp || player.health || 100) : 100,
          time: Date.now()
        });
        if (_snapshots.length > _maxSnapshots) _snapshots.pop();
      }
    }
  }

  function reset() {
    _snapshots = [];
    _cooldown = 0;
    _charges = 1;
    _active = false;
    window._timeRewindActive = false;
    window._timeRewindCooldown = 0;
    _updateHUD();
  }

  return { init: init, update: update, activate: _activate, reset: reset };
})();
