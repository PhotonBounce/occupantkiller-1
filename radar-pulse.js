// No let/const — only var throughout, IIFE pattern
window.RadarPulse = (function() {
  'use strict';

  // --- State ---
  var _scene = null;
  var _camera = null;
  var _audioCtx = null;

  var _MAX_CHARGES = 3;
  var _COOLDOWN_PER_CHARGE = 30; // seconds
  var _PULSE_DURATION = 1.5;     // seconds for ring to expand
  var _MAX_RADIUS = 40;
  var _REVEAL_DURATION = 4;      // seconds enemies stay revealed
  var _RING_COUNT = 3;           // rings per pulse
  var _RING_DELAY = 0.2;         // seconds between rings

  var _charges = 3;
  var _cooldownTimer = 0;        // countdown until next charge restore

  // Active rings: each {mesh, mat, age, delay}
  var _rings = [];

  // Revealed enemies: {enemy, timer, blipMesh}
  var _revealed = [];

  // HUD element
  var _hudEl = null;

  // Screen flash element
  var _flashEl = null;

  // --- Audio ---
  function _getAudio() {
    if (!_audioCtx) {
      _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    }
    return _audioCtx;
  }

  function _playSonarPing() {
    try {
      var ctx = _getAudio();
      // 3 pings, 0.3s apart
      for (var i = 0; i < 3; i++) {
        (function(offset) {
          var osc = ctx.createOscillator();
          var g = ctx.createGain();
          osc.connect(g);
          g.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, ctx.currentTime + offset);
          g.gain.setValueAtTime(0.18, ctx.currentTime + offset);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.4);
          osc.start(ctx.currentTime + offset);
          osc.stop(ctx.currentTime + offset + 0.4);
        })(i * 0.3);
      }
    } catch(e) {}
  }

  // --- HUD ---
  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'radar-pulse-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#00FF44',
      'font-family:monospace',
      'font-size:14px',
      'font-weight:bold',
      'text-shadow:0 0 8px #00CC33',
      'z-index:1500',
      'pointer-events:none',
      'background:rgba(0,0,0,0.45)',
      'padding:3px 10px',
      'border-radius:4px',
      'border:1px solid #00FF4455',
      'letter-spacing:1px'
    ].join(';');
    _hudEl.textContent = '📡 RADAR \xD73';
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (_charges >= _MAX_CHARGES) {
      _hudEl.textContent = '📡 RADAR \xD7' + _charges;
      _hudEl.style.color = '#00FF44';
    } else if (_charges > 0) {
      var cd = Math.ceil(_cooldownTimer);
      _hudEl.textContent = '📡 RADAR \xD7' + _charges + ' (' + cd + 's)';
      _hudEl.style.color = '#88FF99';
    } else {
      var cd2 = Math.ceil(_cooldownTimer);
      _hudEl.textContent = '📡 RADAR \xD70 (' + cd2 + 's)';
      _hudEl.style.color = '#336633';
    }
  }

  // --- Screen flash ---
  function _createFlash() {
    if (_flashEl) return;
    _flashEl = document.createElement('div');
    _flashEl.id = 'radar-pulse-flash';
    _flashEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:1499',
      'background:rgba(0,200,0,0)',
      'transition:background 0.08s ease-out'
    ].join(';');
    document.body.appendChild(_flashEl);
  }

  function _triggerFlash() {
    if (!_flashEl) return;
    _flashEl.style.background = 'rgba(0,200,0,0.15)';
    setTimeout(function() {
      if (_flashEl) _flashEl.style.background = 'rgba(0,200,0,0)';
    }, 140);
  }

  // --- Ring geometry ---
  function _createRing() {
    var sc = _scene || window._gameScene || window._scene;
    if (!sc) return null;
    var geo = new THREE.SphereGeometry(1, 12, 12);
    var wireGeo = new THREE.WireframeGeometry(geo);
    var mat = new THREE.LineBasicMaterial({
      color: 0x00FF44,
      transparent: true,
      opacity: 0.8
    });
    var mesh = new THREE.LineSegments(wireGeo, mat);
    var cam = _camera || window._camera;
    if (cam) {
      mesh.position.copy(cam.position);
    }
    mesh.scale.set(0.1, 0.1, 0.1);
    sc.add(mesh);
    return { mesh: mesh, mat: mat, age: 0, active: false };
  }

  function _removeRing(ring) {
    var sc = _scene || window._gameScene || window._scene;
    if (sc && ring.mesh) sc.remove(ring.mesh);
  }

  // --- Enemy reveal ---
  function _markRevealed(enemy) {
    // Check if already revealed — reset timer
    for (var i = 0; i < _revealed.length; i++) {
      if (_revealed[i].enemy === enemy) {
        _revealed[i].timer = _REVEAL_DURATION;
        return;
      }
    }
    var sc = _scene || window._gameScene || window._scene;
    var blipMesh = null;
    if (sc && enemy.mesh) {
      var blipGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
      var blipMat = new THREE.MeshBasicMaterial({ color: 0x00FF44, transparent: true, opacity: 1.0 });
      blipMesh = new THREE.Mesh(blipGeo, blipMat);
      sc.add(blipMesh);
    }
    enemy._radarRevealed = true;
    enemy._minimapVisible = true;
    _revealed.push({ enemy: enemy, timer: _REVEAL_DURATION, blipMesh: blipMesh, blipMat: blipMesh ? blipMesh.material : null });

    // Register globally for minimap
    if (!window._radarRevealedEnemies) window._radarRevealedEnemies = [];
    window._radarRevealedEnemies.push(enemy);
  }

  function _unrevealEnemy(item) {
    item.enemy._radarRevealed = false;
    item.enemy._minimapVisible = false;
    var sc = _scene || window._gameScene || window._scene;
    if (sc && item.blipMesh) sc.remove(item.blipMesh);
    // Remove from global array
    if (window._radarRevealedEnemies) {
      for (var i = window._radarRevealedEnemies.length - 1; i >= 0; i--) {
        if (window._radarRevealedEnemies[i] === item.enemy) {
          window._radarRevealedEnemies.splice(i, 1);
        }
      }
    }
  }

  function _getEnemies() {
    // Try common global enemy arrays used in this game
    return window._enemies || window._activeEnemies || (window.Enemies && window.Enemies.getAll && window.Enemies.getAll()) || [];
  }

  function _checkEnemyDetection(pulseRadius, pulseOrigin) {
    var enemies = _getEnemies();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e) continue;
      var pos = (e.mesh && e.mesh.position) || e.position;
      if (!pos) continue;
      var dx = pos.x - pulseOrigin.x;
      var dy = pos.y - pulseOrigin.y;
      var dz = pos.z - pulseOrigin.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist <= pulseRadius) {
        _markRevealed(e);
      }
    }
  }

  // --- Pulse trigger ---
  function pulse() {
    if (_charges <= 0) {
      if (window.HUD && window.HUD.showToast) window.HUD.showToast('RADAR RECHARGING');
      return;
    }

    _charges--;
    window._pulseActive = true;

    // Start cooldown countdown for restoring one charge
    // Timer only counts when below max charges
    if (_cooldownTimer <= 0) {
      _cooldownTimer = _COOLDOWN_PER_CHARGE;
    }

    _playSonarPing();
    _triggerFlash();

    if (window.HUD && window.HUD.showToast) window.HUD.showToast('📡 RADAR PULSE');

    // Spawn 3 rings with staggered delays
    for (var i = 0; i < _RING_COUNT; i++) {
      (function(ringIndex) {
        var ring = _createRing();
        if (!ring) return;
        ring.delay = ringIndex * _RING_DELAY;
        ring.active = false; // wait until delay passes
        _rings.push(ring);
      })(i);
    }

    _updateHUD();
  }

  // --- Init ---
  function init(scene, camera) {
    _scene = scene || window._gameScene || window._scene;
    _camera = camera || window._camera;

    window._pulseActive = false;
    window._radarRevealedEnemies = [];

    _charges = _MAX_CHARGES;
    _cooldownTimer = 0;
    _rings = [];
    _revealed = [];

    _createHUD();
    _createFlash();
    _updateHUD();

    document.addEventListener('keydown', function(e) {
      if (window._menuOpen || window._isPaused || window._inMenu) return;
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
      if (e.ctrlKey && e.code === 'KeyP') {
        e.preventDefault();
        pulse();
      }
    });
  }

  // --- Update (call each frame with dt in seconds) ---
  function update(dt) {
    var time = Date.now() * 0.001;

    // Cooldown / charge restore
    if (_charges < _MAX_CHARGES && _cooldownTimer > 0) {
      _cooldownTimer -= dt;
      if (_cooldownTimer <= 0) {
        _charges++;
        if (_charges < _MAX_CHARGES) {
          // Start another cooldown cycle for the next missing charge
          _cooldownTimer = _COOLDOWN_PER_CHARGE;
        } else {
          _cooldownTimer = 0;
          window._pulseActive = false;
        }
        if (window.HUD && window.HUD.showToast) window.HUD.showToast('📡 RADAR CHARGE READY');
      }
    }

    var cam = _camera || window._camera;
    var origin = cam ? cam.position : { x: 0, y: 0, z: 0 };

    // Update rings
    for (var i = _rings.length - 1; i >= 0; i--) {
      var ring = _rings[i];
      ring.age += dt;

      // Wait for stagger delay
      if (!ring.active) {
        if (ring.age >= ring.delay) {
          ring.active = true;
          ring.age = ring.age - ring.delay; // reset age to time since activation
        } else {
          continue;
        }
      }

      var progress = ring.age / _PULSE_DURATION; // 0..1
      if (progress >= 1.0) {
        _removeRing(ring);
        _rings.splice(i, 1);
        continue;
      }

      // Scale from 0.1 to _MAX_RADIUS
      var currentRadius = 0.1 + progress * (_MAX_RADIUS - 0.1);
      ring.mesh.scale.set(currentRadius, currentRadius, currentRadius);

      // Opacity fades from 0.8 to 0
      ring.mat.opacity = 0.8 * (1.0 - progress);

      // Detection sweep — check once per frame at current radius
      _checkEnemyDetection(currentRadius, origin);
    }

    // Update revealed enemies
    for (var j = _revealed.length - 1; j >= 0; j--) {
      var item = _revealed[j];
      item.timer -= dt;

      if (item.timer <= 0) {
        _unrevealEnemy(item);
        _revealed.splice(j, 1);
        continue;
      }

      // Update blip position above enemy
      if (item.blipMesh && item.enemy) {
        var epos = (item.enemy.mesh && item.enemy.mesh.position) || item.enemy.position;
        if (epos) {
          item.blipMesh.position.set(epos.x, epos.y + 2.2, epos.z);
          // Pulse blip opacity
          item.blipMesh.material.opacity = 0.5 + 0.5 * Math.sin(time * 8);
          // Spin slightly
          item.blipMesh.rotation.y += dt * 3;
        }
      }
    }

    _updateHUD();
  }

  // --- Reset ---
  function reset() {
    // Remove all rings
    for (var i = 0; i < _rings.length; i++) {
      _removeRing(_rings[i]);
    }
    _rings = [];

    // Unreveal all enemies
    for (var j = 0; j < _revealed.length; j++) {
      _unrevealEnemy(_revealed[j]);
    }
    _revealed = [];

    _charges = _MAX_CHARGES;
    _cooldownTimer = 0;
    window._pulseActive = false;
    window._radarRevealedEnemies = [];

    _updateHUD();
  }

  return { init: init, update: update, pulse: pulse, reset: reset };
})();
