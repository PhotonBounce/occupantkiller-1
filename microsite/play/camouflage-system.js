// camouflage-system.js — Active Camouflage / Ghillie Suit System
// Exports: window.CamouflageSystem = { init, update, activate, deactivate, reset }
// Key: O (free — not used by any other system)

window.CamouflageSystem = (function () {
  'use strict';

  // ─── Constants ────────────────────────────────────────────────────────────
  var CAMO_DURATION       = 45;    // seconds of battery
  var RECHARGE_RATIO      = 0.5;   // 1 s recharge per 2 s rest (0.5 s/s)
  var DETECT_STILL        = 4;     // detection radius when active + still
  var DETECT_MOVING       = 8;     // detection radius when active + moving
  var DETECT_PRONE        = 2;     // detection radius when active + prone
  var DETECT_NORMAL       = 18;    // detection radius when camo inactive
  var SHIMMER_DURATION    = 0.4;   // seconds for deactivate shimmer VFX
  var NOISE_GRID_SIZE     = 16;    // grid cells for shimmer canvas

  // ─── State ────────────────────────────────────────────────────────────────
  var _initialized    = false;
  var _hasCamo        = false;    // has the player picked up the suit?
  var _camoActive     = false;    // is camo currently active?
  var _camoTimer      = CAMO_DURATION;   // seconds remaining
  var _recharging     = false;
  var _restTimer      = 0;        // time spent resting (for recharge rate)

  // Shimmer VFX
  var _shimmerActive  = false;
  var _shimmerTimer   = 0;
  var _shimmerCanvas  = null;
  var _shimmerCtx     = null;

  // Audio
  var _audioCtx       = null;

  // HUD
  var _camoHudEl      = null;    // main camo status div
  var _camoBarEl      = null;    // inner bar fill div
  var _camoLabelEl    = null;    // text label "CAMO: ██ 38s"

  // Pickups
  var _pickups        = [];

  // CSS filter applied to #game-container when camo active
  var _filterTarget   = null;

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function _showToast(text, color) {
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup(text, color || '#ffffff');
    } else if (typeof HUD !== 'undefined' && HUD.showToast) {
      HUD.showToast(text, 2500, color || '#ffffff');
    } else {
      var el = document.getElementById('pickup-notif');
      if (el) {
        el.textContent = text;
        el.style.color = color || '#ffffff';
        el.style.display = 'block';
        setTimeout(function () { el.style.display = 'none'; }, 2500);
      }
    }
  }

  function _isPlaying() {
    if (typeof gameState !== 'undefined' && typeof STATE !== 'undefined') {
      return gameState === STATE.PLAYING;
    }
    return true; // assume playing if enums not found
  }

  function _isMoving() {
    // Check global player velocity if available
    if (window._playerVelocity) {
      var v = window._playerVelocity;
      var speed = Math.sqrt(v.x * v.x + v.z * v.z);
      return speed > 0.5;
    }
    // Fallback: check key states
    if (window._keysDown) {
      var kd = window._keysDown;
      return !!(kd['KeyW'] || kd['KeyA'] || kd['KeyS'] || kd['KeyD'] ||
                kd['ArrowUp'] || kd['ArrowDown'] || kd['ArrowLeft'] || kd['ArrowRight']);
    }
    return false;
  }

  function _isProne() {
    if (typeof window._playerProne !== 'undefined') return !!window._playerProne;
    if (typeof window._isProne !== 'undefined') return !!window._isProne;
    // Check prone indicator visibility as fallback
    var el = document.getElementById('prone-indicator');
    if (el) return el.style.display !== 'none' && el.style.display !== '';
    return false;
  }

  function _setFilterTarget() {
    _filterTarget = document.getElementById('game-container') ||
                    document.body;
  }

  function _applyGreenTint(on) {
    if (!_filterTarget) _setFilterTarget();
    if (!_filterTarget) return;
    _filterTarget.style.filter = on ? 'hue-rotate(40deg) brightness(0.85)' : '';
  }

  // ─── Audio — soft hiss on activate ────────────────────────────────────────

  function _ensureAudioCtx() {
    if (_audioCtx) return _audioCtx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) _audioCtx = new AC();
    } catch (e) { /* silent fail */ }
    return _audioCtx;
  }

  function _playActivateHiss() {
    var ctx = _ensureAudioCtx();
    if (!ctx) return;
    try {
      // White noise buffer (0.5 s)
      var bufSize = ctx.sampleRate * 0.5;
      var buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }
      var source = ctx.createBufferSource();
      source.buffer = buffer;

      // Low-pass filter to soften the noise
      var filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime);

      var gain = ctx.createGain();
      // Fade in over 0.3 s then silence
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.3);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start(ctx.currentTime);
      source.stop(ctx.currentTime + 0.5);
    } catch (e) { /* silent fail */ }
  }

  // ─── Shimmer VFX on deactivate ────────────────────────────────────────────

  function _createShimmerCanvas() {
    if (_shimmerCanvas) return;
    _shimmerCanvas = document.createElement('canvas');
    _shimmerCanvas.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100vw',
      'height:100vh',
      'pointer-events:none',
      'z-index:196',
      'opacity:0'
    ].join(';');
    _shimmerCanvas.id = 'camo-shimmer-canvas';
    document.body.appendChild(_shimmerCanvas);
    _shimmerCtx = _shimmerCanvas.getContext('2d');
  }

  function _startShimmer() {
    _createShimmerCanvas();
    _shimmerActive = true;
    _shimmerTimer = SHIMMER_DURATION;
    _shimmerCanvas.style.opacity = '1';
    _drawShimmerFrame();
  }

  function _drawShimmerFrame() {
    if (!_shimmerCtx || !_shimmerCanvas) return;
    var w = window.innerWidth || 800;
    var h = window.innerHeight || 600;
    _shimmerCanvas.width = w;
    _shimmerCanvas.height = h;
    var ctx = _shimmerCtx;
    var cellW = w / NOISE_GRID_SIZE;
    var cellH = h / NOISE_GRID_SIZE;
    for (var row = 0; row < NOISE_GRID_SIZE; row++) {
      for (var col = 0; col < NOISE_GRID_SIZE; col++) {
        var r = Math.floor(Math.random() * 60 + 20);
        var g = Math.floor(Math.random() * 120 + 60);
        var b = Math.floor(Math.random() * 40 + 10);
        var a = Math.random() * 0.35;
        ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
        ctx.fillRect(col * cellW, row * cellH, cellW, cellH);
      }
    }
  }

  function _updateShimmer(dt) {
    if (!_shimmerActive) return;
    _shimmerTimer -= dt;
    if (_shimmerTimer <= 0) {
      _shimmerActive = false;
      if (_shimmerCanvas) {
        _shimmerCanvas.style.opacity = '0';
      }
      return;
    }
    // Fade out + redraw noise each frame for motion effect
    var progress = _shimmerTimer / SHIMMER_DURATION; // 1→0
    if (_shimmerCanvas) {
      _shimmerCanvas.style.opacity = String(progress);
    }
    _drawShimmerFrame();
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────

  function _createCamoHUD() {
    if (_camoHudEl) return;
    _camoHudEl = document.createElement('div');
    _camoHudEl.id = 'camo-hud';
    _camoHudEl.style.cssText = [
      'display:none',
      'position:fixed',
      'bottom:95px',
      'right:12px',
      'background:rgba(10,30,10,0.75)',
      'border:1px solid #3a6a3a',
      'color:#88cc88',
      'padding:4px 10px',
      'border-radius:4px',
      'font-size:10px',
      'font-family:monospace',
      'letter-spacing:1px',
      'z-index:202',
      'pointer-events:none',
      'min-width:140px'
    ].join(';');

    _camoLabelEl = document.createElement('div');
    _camoLabelEl.style.marginBottom = '3px';
    _camoLabelEl.textContent = 'CAMO: OFF';

    var barTrack = document.createElement('div');
    barTrack.style.cssText = [
      'width:100%',
      'height:5px',
      'background:rgba(0,0,0,0.5)',
      'border:1px solid rgba(80,160,80,0.4)',
      'border-radius:2px',
      'overflow:hidden'
    ].join(';');

    _camoBarEl = document.createElement('div');
    _camoBarEl.style.cssText = [
      'width:100%',
      'height:100%',
      'background:linear-gradient(90deg,#2a6a2a,#44cc44)',
      'border-radius:2px',
      'transition:width 0.1s'
    ].join(';');

    barTrack.appendChild(_camoBarEl);
    _camoHudEl.appendChild(_camoLabelEl);
    _camoHudEl.appendChild(barTrack);
    document.body.appendChild(_camoHudEl);
  }

  function _updateHUD() {
    if (!_camoHudEl) return;
    if (!_hasCamo) {
      _camoHudEl.style.display = 'none';
      return;
    }
    _camoHudEl.style.display = 'block';

    var pct = Math.max(0, Math.min(1, _camoTimer / CAMO_DURATION));
    var secs = Math.ceil(_camoTimer);

    if (_camoBarEl) {
      _camoBarEl.style.width = (pct * 100) + '%';
      // Colour shifts red as battery drains
      if (pct < 0.25) {
        _camoBarEl.style.background = 'linear-gradient(90deg,#6a0000,#cc2222)';
      } else if (pct < 0.5) {
        _camoBarEl.style.background = 'linear-gradient(90deg,#6a5500,#ccaa00)';
      } else {
        _camoBarEl.style.background = 'linear-gradient(90deg,#2a6a2a,#44cc44)';
      }
    }

    if (_camoLabelEl) {
      var blocks = '';
      var filled = Math.round(pct * 8);
      for (var b = 0; b < 8; b++) {
        blocks += b < filled ? '█' : '░';
      }
      if (_camoActive) {
        _camoLabelEl.style.color = '#44ff44';
        _camoLabelEl.textContent = 'CAMO: ' + blocks + ' ' + secs + 's';
      } else if (_recharging) {
        _camoLabelEl.style.color = '#88cc88';
        _camoLabelEl.textContent = 'RECHARGE: ' + blocks + ' ' + secs + 's';
      } else {
        _camoLabelEl.style.color = '#aaaaaa';
        _camoLabelEl.textContent = 'CAMO READY [O]';
      }
    }
  }

  // ─── Detection radius ─────────────────────────────────────────────────────

  function _updateDetectionRadius() {
    var radius;
    if (!_camoActive) {
      radius = DETECT_NORMAL;
    } else if (_isProne()) {
      radius = DETECT_PRONE;
    } else if (_isMoving()) {
      radius = DETECT_MOVING;
    } else {
      radius = DETECT_STILL;
    }
    window._playerDetectionRadius = radius;
    window._camoActive = _camoActive;
  }

  // ─── Pickup mesh ──────────────────────────────────────────────────────────

  function _spawnPickup(scene, x, y, z) {
    if (typeof THREE === 'undefined') return;
    // Folded ghillie suit box
    var geo = new THREE.BoxGeometry(0.5, 0.5, 0.3);
    var mat = new THREE.MeshLambertMaterial({ color: 0x4A5A2A });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.name = 'ghilliePickup';

    // Optional canvas label "GHILLIE"
    try {
      var canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 32;
      var ctx2d = canvas.getContext('2d');
      if (ctx2d) {
        ctx2d.fillStyle = '#1a2a0a';
        ctx2d.fillRect(0, 0, 128, 32);
        ctx2d.fillStyle = '#88cc44';
        ctx2d.font = 'bold 13px monospace';
        ctx2d.textAlign = 'center';
        ctx2d.fillText('GHILLIE SUIT', 64, 22);
        var tex = new THREE.CanvasTexture(canvas);
        var lblGeo = new THREE.PlaneGeometry(0.55, 0.14);
        var lblMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
        var label = new THREE.Mesh(lblGeo, lblMat);
        label.position.set(0, 0.35, 0);
        mesh.add(label);
      }
    } catch (e) { /* label optional */ }

    scene.add(mesh);
    _pickups.push({ mesh: mesh, scene: scene });
    return mesh;
  }

  function _spawnLevelPickups(scene) {
    if (!scene || typeof THREE === 'undefined') return;
    var rx = (Math.random() - 0.5) * 40;
    var rz = (Math.random() - 0.5) * 40;
    _spawnPickup(scene, rx, 1.0, rz);
  }

  function _checkPickupCollection(playerPos) {
    if (!playerPos || _pickups.length === 0) return;
    for (var i = _pickups.length - 1; i >= 0; i--) {
      var p = _pickups[i];
      if (!p.mesh) continue;
      var dx = p.mesh.position.x - playerPos.x;
      var dy = p.mesh.position.y - playerPos.y;
      var dz = p.mesh.position.z - playerPos.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 1.8) {
        p.scene.remove(p.mesh);
        if (p.mesh.geometry) p.mesh.geometry.dispose();
        if (p.mesh.material) p.mesh.material.dispose();
        _pickups.splice(i, 1);
        _hasCamo = true;
        window._hasCamo = true;
        _showToast('GHILLIE SUIT EQUIPPED — Press O to activate', '#88cc44');
        if (typeof window.AudioSystem !== 'undefined' && window.AudioSystem.playPickup) {
          window.AudioSystem.playPickup();
        }
      }
    }
  }

  // ─── Activate / Deactivate ────────────────────────────────────────────────

  function activate() {
    if (!_hasCamo) {
      _showToast('No ghillie suit — find one in the world', '#ff8844');
      return;
    }
    if (_camoActive) return;
    if (_camoTimer <= 0) {
      _showToast('CAMO DRAINED — let it recharge', '#ff8844');
      return;
    }
    _camoActive = true;
    window._camoActive = true;
    _recharging = false;
    _restTimer = 0;
    _applyGreenTint(true);
    _playActivateHiss();
    _updateDetectionRadius();
    _showToast('CAMO ACTIVE [O off]', '#44ff44');
  }

  function deactivate() {
    if (!_camoActive) return;
    _camoActive = false;
    window._camoActive = false;
    _applyGreenTint(false);
    _updateDetectionRadius();
    _startShimmer();
    _restTimer = 0;
    _recharging = true;
  }

  // ─── update(dt) ───────────────────────────────────────────────────────────

  function update(dt) {
    if (!dt || dt <= 0) return;

    // Pickup collection check
    var playerPos = window.player ? window.player.position : null;
    if (!playerPos && typeof THREE !== 'undefined') {
      playerPos = window._playerPosition || null;
    }
    if (playerPos) _checkPickupCollection(playerPos);

    // Drain or recharge timer
    if (_camoActive) {
      _camoTimer -= dt;
      if (_camoTimer <= 0) {
        _camoTimer = 0;
        deactivate();
        _showToast('CAMO BATTERY DEPLETED', '#ff8844');
      }
      _recharging = false;
    } else {
      // Recharge at 0.5 s per 1 s of rest
      _restTimer += dt;
      if (_hasCamo && _camoTimer < CAMO_DURATION) {
        _camoTimer = Math.min(CAMO_DURATION, _camoTimer + dt * RECHARGE_RATIO);
        _recharging = _camoTimer < CAMO_DURATION;
      } else {
        _recharging = false;
      }
    }

    // Rotate ghillie suit pickups slowly
    for (var i = 0; i < _pickups.length; i++) {
      if (_pickups[i].mesh) {
        _pickups[i].mesh.rotation.y += dt * 0.8;
      }
    }

    // Update detection radius every frame (movement/prone state may change)
    _updateDetectionRadius();

    // Shimmer VFX
    if (_shimmerActive) _updateShimmer(dt);

    // HUD
    _updateHUD();
  }

  // ─── Forced-deactivate hooks ──────────────────────────────────────────────

  function _onFire() {
    if (_camoActive) {
      deactivate();
      _showToast('CAMO BROKEN — fired weapon', '#ffaa44');
    }
  }

  function _onDamage() {
    if (_camoActive) {
      deactivate();
      _showToast('CAMO BROKEN — took damage', '#ff4444');
    }
  }

  function _onGrenadeThrow() {
    if (_camoActive) {
      deactivate();
      _showToast('CAMO BROKEN — threw grenade', '#ffaa44');
    }
  }

  function _hookGameEvents() {
    // Hook window._onPlayerFire if it exists, or patch AudioSystem.playGunshot
    var origFire = window._onPlayerFire;
    window._onPlayerFire = function () {
      _onFire();
      if (origFire) origFire.apply(this, arguments);
    };

    // Hook window._onPlayerDamage
    var origDmg = window._onPlayerDamage;
    window._onPlayerDamage = function () {
      _onDamage();
      if (origDmg) origDmg.apply(this, arguments);
    };

    // Hook window._onGrenadeThrow
    var origGrenade = window._onGrenadeThrow;
    window._onGrenadeThrow = function () {
      _onGrenadeThrow();
      if (origGrenade) origGrenade.apply(this, arguments);
    };

    // Also patch AudioSystem.playGunshot as a fire signal
    if (typeof window.AudioSystem !== 'undefined') {
      var origGunshot = window.AudioSystem.playGunshot;
      window.AudioSystem.playGunshot = function () {
        _onFire();
        if (origGunshot) origGunshot.apply(window.AudioSystem, arguments);
      };
    }
  }

  // ─── Key handler ──────────────────────────────────────────────────────────

  function _onKeyDown(e) {
    if (e.code !== 'KeyO') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!_isPlaying()) return;

    if (_camoActive) {
      deactivate();
    } else {
      activate();
    }
  }

  // ─── Level change hook ────────────────────────────────────────────────────

  function _onLevelChange(levelIndex) {
    var scene = window._scene || null;
    // Spawn every 2nd level starting at 0
    if (scene && (levelIndex === 0 || levelIndex % 2 === 0)) {
      _spawnLevelPickups(scene);
    }
  }

  // ─── init() ───────────────────────────────────────────────────────────────

  function init(opts) {
    if (_initialized) return;
    _initialized = true;

    opts = opts || {};

    // Initial globals
    window._hasCamo = false;
    window._camoActive = false;
    window._playerDetectionRadius = DETECT_NORMAL;

    // Create HUD (deferred until DOM ready)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _createCamoHUD);
    } else {
      _createCamoHUD();
    }

    // Key listener
    document.addEventListener('keydown', _onKeyDown, false);

    // Hook game events (after a tick so other systems are registered)
    setTimeout(_hookGameEvents, 0);

    // Level change hook
    var origLevelStart = window.__onLevelStart;
    window.__onLevelStart = function (idx) {
      _onLevelChange(idx || 0);
      if (origLevelStart) origLevelStart(idx);
    };

    if (typeof GameManager !== 'undefined' && GameManager.onLevelStart) {
      var origGMLevelStart = GameManager.onLevelStart;
      GameManager.onLevelStart = function (idx) {
        _onLevelChange(idx || 0);
        origGMLevelStart.apply(GameManager, arguments);
      };
    }

    // Try to spawn initial pickup immediately if scene already exists
    var scene = (opts && opts.scene) || window._scene || null;
    if (scene) _spawnLevelPickups(scene);

    console.log('[CamouflageSystem] initialized — press O to toggle camo');
  }

  // ─── reset() ──────────────────────────────────────────────────────────────

  function reset() {
    deactivate();

    // Remove all pickups
    for (var i = 0; i < _pickups.length; i++) {
      var p = _pickups[i];
      if (p.scene && p.mesh) p.scene.remove(p.mesh);
      if (p.mesh && p.mesh.geometry) p.mesh.geometry.dispose();
      if (p.mesh && p.mesh.material) p.mesh.material.dispose();
    }
    _pickups = [];

    // Reset state
    _hasCamo = false;
    _camoTimer = CAMO_DURATION;
    _recharging = false;
    _restTimer = 0;
    _shimmerActive = false;
    _shimmerTimer = 0;
    if (_shimmerCanvas) _shimmerCanvas.style.opacity = '0';

    // Reset globals
    window._hasCamo = false;
    window._camoActive = false;
    window._playerDetectionRadius = DETECT_NORMAL;

    _updateHUD();
  }

  // ─── IIFE return ──────────────────────────────────────────────────────────

  return {
    init: init,
    update: update,
    activate: activate,
    deactivate: deactivate,
    reset: reset
  };

})();
