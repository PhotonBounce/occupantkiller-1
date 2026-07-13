/* ───────────────────────────────────────────────────────────────────────
   POISON GAS — deployable gas canisters + environmental hazard zones
   Alt+X to throw a canister (3 charges, 30s cooldown).
   Pre-placed environmental zones from broken pipes/barrels.
   Player damage: 6 HP/s. Enemy damage: 4 HP/s.
   Gas mask (window._gasMaskOn) reduces damage to 15%.
   Wind drift via window._windX / _windZ.
   All var, IIFE pattern.
   ─────────────────────────────────────────────────────────────────────── */
window.PoisonGas = (function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────────────────
  var _scene = null;
  var _camera = null;
  var _initialized = false;

  // Canisters the player has thrown
  var _canisters = [];    // { mesh, velocity, landed, landTimer, active, cloudMeshes,
                           //   cloudTimer, cloudRadius, zoneIndex, audioNode }

  // All gas zones (canisters + environmental)
  var _zones = [];        // { position:{x,y,z}, radius, active, timer, meshes[], enviro }

  // Player canister charges
  var _charges = 3;
  var MAX_CHARGES = 3;
  var COOLDOWN = 30;       // seconds
  var _cooldownTimer = 0;

  // Player in-gas tracking
  var _playerInGas = false;
  var _coughTimer = 0;

  // Damage constants
  var PLAYER_DAMAGE_PER_SEC = 6;
  var ENEMY_DAMAGE_PER_SEC = 4;
  var GAS_MASK_MULTIPLIER = 0.15;

  // Gas zone duration (after cloud fully deployed)
  var ZONE_DURATION = 15;      // seconds the cloud lasts
  var LAND_DELAY = 2;          // seconds after landing before crack/emit
  var EXPAND_TIME = 3;         // seconds to grow from radius 1 to 5
  var CLOUD_PARTICLES = 10;
  var CLOUD_MAX_RADIUS = 5;
  var CLOUD_MIN_RADIUS = 1;
  var CLOUD_PARTICLE_RADIUS = 0.8;

  // Enemy flee state: map enemy id -> { fleeing, fleeTimer }
  var _enemyFleeState = {};

  // Audio nodes
  var _audioCtx = null;
  var _hissNodes = [];
  var _coughNode = null;

  // HUD element
  var _hudEl = null;

  // Canvas filter state
  var _canvasFilterActive = false;

  // ── Init ──────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene = scene;
    _camera = camera || null;
    _initialized = true;

    _canisters = [];
    _zones = [];
    _charges = MAX_CHARGES;
    _cooldownTimer = 0;
    _playerInGas = false;
    _coughTimer = 0;
    _enemyFleeState = {};
    _hissNodes = [];
    _coughNode = null;
    _canvasFilterActive = false;

    window._gasZones = [];
    window._gasMaskOn = window._gasMaskOn || false;

    _createHud();
    _placeEnvironmentalZones();
    _bindKeys();
    _updateHud();
  }

  // ── Environmental zones (3 pre-placed) ───────────────────────────────
  function _placeEnvironmentalZones() {
    var positions = [
      { x: 20,  y: 0, z: -15 },
      { x: -30, y: 0, z: 10  },
      { x: 5,   y: 0, z: 35  }
    ];
    for (var i = 0; i < positions.length; i++) {
      _createGasZone(positions[i], 4, true, ZONE_DURATION * 100); // long-lasting env zones
    }
  }

  // ── Zone creation ─────────────────────────────────────────────────────
  function _createGasZone(position, initialRadius, isEnviro, duration) {
    var meshes = _buildCloudMeshes(position, initialRadius);
    var zone = {
      position: { x: position.x, y: position.y, z: position.z },
      radius: initialRadius,
      targetRadius: isEnviro ? 4 : CLOUD_MAX_RADIUS,
      active: true,
      timer: duration || ZONE_DURATION,
      meshes: meshes,
      enviro: isEnviro || false,
      expandTimer: isEnviro ? EXPAND_TIME : 0   // env zones start expanded
    };
    _zones.push(zone);
    _syncGasZones();
    return zone;
  }

  function _buildCloudMeshes(position, radius) {
    var meshes = [];
    if (!_scene || typeof THREE === 'undefined') return meshes;

    var geo = new THREE.SphereGeometry(CLOUD_PARTICLE_RADIUS, 6, 6);
    for (var i = 0; i < CLOUD_PARTICLES; i++) {
      var opacity = 0.25 + Math.random() * 0.15;  // 0.25–0.40
      var mat = new THREE.MeshBasicMaterial({
        color: 0x88CC00,
        transparent: true,
        opacity: opacity,
        depthWrite: false
      });
      var mesh = new THREE.Mesh(geo, mat);
      var angle = (i / CLOUD_PARTICLES) * Math.PI * 2;
      var r = radius * (0.4 + Math.random() * 0.6);
      mesh.position.set(
        position.x + Math.cos(angle) * r,
        position.y + 0.5 + Math.random() * 1.5,
        position.z + Math.sin(angle) * r
      );
      mesh.userData.driftAngle = angle;
      mesh.userData.driftSpeed = 0.2 + Math.random() * 0.3;
      mesh.userData.bobOffset = Math.random() * Math.PI * 2;
      mesh.userData.baseY = mesh.position.y;
      _scene.add(mesh);
      meshes.push(mesh);
    }
    return meshes;
  }

  function _removeZoneMeshes(zone) {
    if (!zone.meshes) return;
    for (var i = 0; i < zone.meshes.length; i++) {
      if (_scene) _scene.remove(zone.meshes[i]);
    }
    zone.meshes = [];
  }

  // ── Canister throw ───────────────────────────────────────────────────
  function _throwCanister() {
    if (!_initialized || !_scene || !_camera) return;
    if (_charges <= 0) return;

    _charges--;
    if (_charges === 0) _cooldownTimer = COOLDOWN;
    _updateHud();

    var dir = new THREE.Vector3();
    _camera.getWorldDirection(dir);

    var spawnPos = _camera.position.clone().add(dir.clone().multiplyScalar(1.0));
    spawnPos.y -= 0.2;

    var geo = new THREE.CylinderGeometry(0.1, 0.12, 0.35, 8);
    var mat = new THREE.MeshLambertMaterial({ color: 0x88CC00 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(spawnPos);
    _scene.add(mesh);

    var speed = 12;
    var velocity = {
      x: dir.x * speed,
      y: dir.y * speed + 3,
      z: dir.z * speed
    };

    var canister = {
      mesh: mesh,
      velocity: velocity,
      landed: false,
      landTimer: 0,
      active: true,
      cloudMeshes: [],
      cloudTimer: 0,
      cloudRadius: CLOUD_MIN_RADIUS,
      zoneIndex: -1,
      audioNode: null,
      tumbleX: (Math.random() - 0.5) * 5,
      tumbleZ: (Math.random() - 0.5) * 5
    };
    _canisters.push(canister);

    _startHissAudio(canister);
  }

  // ── Canister physics update ───────────────────────────────────────────
  function _updateCanisters(dt) {
    for (var i = _canisters.length - 1; i >= 0; i--) {
      var c = _canisters[i];
      if (!c.active) continue;

      if (!c.landed) {
        // Apply gravity
        c.velocity.y -= 9.8 * dt;
        c.mesh.position.x += c.velocity.x * dt;
        c.mesh.position.y += c.velocity.y * dt;
        c.mesh.position.z += c.velocity.z * dt;

        // Tumble rotation
        c.mesh.rotation.x += c.tumbleX * dt;
        c.mesh.rotation.z += c.tumbleZ * dt;

        // Ground check (y <= 0 or floor)
        if (c.mesh.position.y <= 0.175) {
          c.mesh.position.y = 0.175;
          c.landed = true;
          c.velocity.x = 0;
          c.velocity.y = 0;
          c.velocity.z = 0;
        }
      } else {
        // Countdown to crack and release
        c.landTimer += dt;

        if (c.landTimer >= LAND_DELAY && c.zoneIndex === -1) {
          // Crack: change canister color to cracked look
          if (c.mesh.material) {
            c.mesh.material.color.setHex(0x556600);
          }
          // Create gas zone at canister position
          var pos = {
            x: c.mesh.position.x,
            y: 0,
            z: c.mesh.position.z
          };
          var zone = _createGasZone(pos, CLOUD_MIN_RADIUS, false, ZONE_DURATION);
          c.zoneIndex = _zones.length - 1;
        }

        if (c.zoneIndex >= 0) {
          var zone2 = _zones[c.zoneIndex];
          c.cloudTimer += dt;

          // Expand radius over EXPAND_TIME
          if (c.cloudTimer <= EXPAND_TIME) {
            var t = c.cloudTimer / EXPAND_TIME;
            zone2.radius = CLOUD_MIN_RADIUS + (CLOUD_MAX_RADIUS - CLOUD_MIN_RADIUS) * t;
          }

          // Zone expired => deactivate canister
          if (!zone2.active) {
            _stopHissAudio(c);
            if (_scene) _scene.remove(c.mesh);
            c.active = false;
          }
        }
      }
    }

    // Clean finished canisters
    for (var j = _canisters.length - 1; j >= 0; j--) {
      if (!_canisters[j].active) _canisters.splice(j, 1);
    }
  }

  // ── Zone update ───────────────────────────────────────────────────────
  function _updateZones(dt) {
    var windX = (typeof window._windX === 'number') ? window._windX : 0;
    var windZ = (typeof window._windZ === 'number') ? window._windZ : 0;

    for (var i = _zones.length - 1; i >= 0; i--) {
      var zone = _zones[i];
      if (!zone.active) continue;

      // Tick timer (env zones have very long timer so they persist)
      zone.timer -= dt;
      if (zone.timer <= 0) {
        zone.active = false;
        _removeZoneMeshes(zone);
        continue;
      }

      // Wind drift
      zone.position.x += windX * 0.5 * dt;
      zone.position.z += windZ * 0.5 * dt;

      // Expand env zones
      if (zone.enviro && zone.expandTimer < EXPAND_TIME) {
        zone.expandTimer += dt;
        var te = Math.min(zone.expandTimer / EXPAND_TIME, 1);
        zone.radius = CLOUD_MIN_RADIUS + (zone.targetRadius - CLOUD_MIN_RADIUS) * te;
      }

      // Update cloud particle positions (drift + bob)
      var time = Date.now() * 0.001;
      for (var k = 0; k < zone.meshes.length; k++) {
        var m = zone.meshes[k];
        m.userData.driftAngle += m.userData.driftSpeed * dt;
        var da = m.userData.driftAngle;
        var r2 = zone.radius * (0.4 + 0.6 * ((k % 5) / 5));
        m.position.x = zone.position.x + Math.cos(da) * r2;
        m.position.z = zone.position.z + Math.sin(da) * r2;
        m.position.y = m.userData.baseY + Math.sin(time + m.userData.bobOffset) * 0.3
                       + windX * 0.1 + windZ * 0.1;
        m.rotation.y += 0.3 * dt;

        // Fade out when timer < 3s
        if (zone.timer < 3) {
          m.material.opacity = Math.max(0, m.material.opacity - dt * 0.12);
        }
      }
    }

    _syncGasZones();
  }

  // ── Player damage ─────────────────────────────────────────────────────
  function _updatePlayerDamage(dt) {
    if (!_camera) return;

    var px = _camera.position.x;
    var py = _camera.position.y;
    var pz = _camera.position.z;

    var inGas = false;
    for (var i = 0; i < _zones.length; i++) {
      var zone = _zones[i];
      if (!zone.active) continue;
      var dx = px - zone.position.x;
      var dz = pz - zone.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < zone.radius) {
        inGas = true;
        break;
      }
    }

    _playerInGas = inGas;
    window._playerInGas = inGas;

    if (inGas) {
      _showGasOverlay();
      _applyCanvasFilter();

      var dmgMultiplier = (window._gasMaskOn === true) ? GAS_MASK_MULTIPLIER : 1.0;
      var dmg = PLAYER_DAMAGE_PER_SEC * dmgMultiplier * dt;

      if (typeof window.playerHealth === 'number') {
        window.playerHealth = Math.max(0, window.playerHealth - dmg);
      } else if (typeof window._playerHP === 'number') {
        window._playerHP = Math.max(0, window._playerHP - dmg);
      }

      // Coughing sound
      if (!window._gasMaskOn) {
        _coughTimer -= dt;
        if (_coughTimer <= 0) {
          _playCough();
          _coughTimer = 2.5;
        }
      }
    } else {
      _hideGasOverlay();
      _clearCanvasFilter();
      _coughTimer = 0;
    }
  }

  // ── Enemy damage & flee ───────────────────────────────────────────────
  function _updateEnemyDamage(dt) {
    var enemies = window._enemies || window.enemies || [];
    if (!enemies || !enemies.length) return;

    for (var i = 0; i < enemies.length; i++) {
      var enemy = enemies[i];
      if (!enemy || enemy.dead) continue;

      var ex = enemy.position ? enemy.position.x : (enemy.mesh ? enemy.mesh.position.x : 0);
      var ez = enemy.position ? enemy.position.z : (enemy.mesh ? enemy.mesh.position.z : 0);

      var inGas = false;
      for (var j = 0; j < _zones.length; j++) {
        var zone = _zones[j];
        if (!zone.active) continue;
        var dx = ex - zone.position.x;
        var dz = ez - zone.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < zone.radius) {
          inGas = true;
          break;
        }
      }

      if (inGas) {
        // Damage enemy
        var dmg = ENEMY_DAMAGE_PER_SEC * dt;
        if (typeof enemy.hp === 'number') {
          enemy.hp = Math.max(0, enemy.hp - dmg);
        } else if (typeof enemy.health === 'number') {
          enemy.health = Math.max(0, enemy.health - dmg);
        }

        // Flee behaviour — reduce speed and change direction
        var eid = enemy.id || i;
        if (!_enemyFleeState[eid]) {
          _enemyFleeState[eid] = { fleeing: false, fleeTimer: 0 };
        }
        var fs = _enemyFleeState[eid];
        if (!fs.fleeing) {
          fs.fleeing = true;
          fs.fleeTimer = 2 + Math.random() * 2;
          // Push enemy outward from zone centre
          var nearZone = null;
          for (var k = 0; k < _zones.length; k++) {
            if (!_zones[k].active) continue;
            var ddx = ex - _zones[k].position.x;
            var ddz = ez - _zones[k].position.z;
            if (Math.sqrt(ddx * ddx + ddz * ddz) < _zones[k].radius) {
              nearZone = _zones[k];
              break;
            }
          }
          if (nearZone) {
            var fx = ex - nearZone.position.x;
            var fz = ez - nearZone.position.z;
            var fl = Math.sqrt(fx * fx + fz * fz) || 1;
            if (enemy.velocity) {
              enemy.velocity.x = (fx / fl) * 4;
              enemy.velocity.z = (fz / fl) * 4;
            }
            if (typeof enemy.speed === 'number') {
              enemy.speed = Math.max(0, enemy.speed - 2);
            }
          }
        } else {
          fs.fleeTimer -= dt;
          if (fs.fleeTimer <= 0) {
            fs.fleeing = false;
          }
        }
      } else {
        var eid2 = enemy.id || i;
        if (_enemyFleeState[eid2]) {
          _enemyFleeState[eid2].fleeing = false;
        }
      }
    }
  }

  // ── Cooldown & charges ────────────────────────────────────────────────
  function _updateCooldown(dt) {
    if (_cooldownTimer > 0) {
      _cooldownTimer -= dt;
      if (_cooldownTimer <= 0) {
        _cooldownTimer = 0;
        _charges = MAX_CHARGES;
        _updateHud();
      }
    }
  }

  // ── HUD ───────────────────────────────────────────────────────────────
  function _createHud() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'poison-gas-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:110px',
      'left:20px',
      'color:#88CC00',
      'font-family:monospace',
      'font-size:15px',
      'font-weight:bold',
      'text-shadow:0 0 6px #88CC00, 0 1px 3px #000',
      'pointer-events:none',
      'z-index:900',
      'display:none'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHud() {
    if (!_hudEl) return;
    _hudEl.style.display = 'block';
    var chargeStr = '';
    for (var i = 0; i < MAX_CHARGES; i++) {
      chargeStr += (i < _charges) ? '●' : '○';
    }
    var coolStr = (_cooldownTimer > 0) ? ' (' + Math.ceil(_cooldownTimer) + 's)' : '';
    _hudEl.textContent = '☠ GAS ' + chargeStr + coolStr;
  }

  // ── Gas overlay (vignette) ────────────────────────────────────────────
  var _overlayEl = null;

  function _showGasOverlay() {
    if (!_overlayEl) {
      _overlayEl = document.createElement('div');
      _overlayEl.id = 'poison-gas-overlay';
      _overlayEl.style.cssText = [
        'position:fixed',
        'inset:0',
        'pointer-events:none',
        'z-index:800',
        'background:radial-gradient(ellipse at center, transparent 40%, rgba(100,180,0,0.30) 100%)',
        'display:none'
      ].join(';');
      document.body.appendChild(_overlayEl);
    }
    _overlayEl.style.display = 'block';
  }

  function _hideGasOverlay() {
    if (_overlayEl) _overlayEl.style.display = 'none';
  }

  // ── Canvas CSS filter ─────────────────────────────────────────────────
  function _applyCanvasFilter() {
    if (_canvasFilterActive) return;
    var canvas = document.querySelector('canvas');
    if (!canvas) return;
    canvas.style.filter = 'sepia(0.3) hue-rotate(60deg) saturate(1.4) blur(1px)';
    _canvasFilterActive = true;
  }

  function _clearCanvasFilter() {
    if (!_canvasFilterActive) return;
    var canvas = document.querySelector('canvas');
    if (canvas) canvas.style.filter = '';
    _canvasFilterActive = false;
  }

  // ── Audio ─────────────────────────────────────────────────────────────
  function _getAudioCtx() {
    if (_audioCtx && _audioCtx.state !== 'closed') return _audioCtx;
    try {
      _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      _audioCtx = null;
    }
    return _audioCtx;
  }

  function _startHissAudio(canister) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gainNode = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      canister.audioNode = { osc: osc, gain: gainNode };
      _hissNodes.push(canister.audioNode);
    } catch (e) { /* silent fail */ }
  }

  function _stopHissAudio(canister) {
    if (!canister.audioNode) return;
    try {
      canister.audioNode.gain.gain.setTargetAtTime(0, _audioCtx.currentTime, 0.3);
      canister.audioNode.osc.stop(_audioCtx.currentTime + 0.5);
    } catch (e) { /* silent fail */ }
    var idx = _hissNodes.indexOf(canister.audioNode);
    if (idx >= 0) _hissNodes.splice(idx, 1);
    canister.audioNode = null;
  }

  function _playCough() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var buf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
      var filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, ctx.currentTime);
      filter.Q.setValueAtTime(2, ctx.currentTime);
      src.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      src.start();
    } catch (e) { /* silent fail */ }
  }

  // ── Key bindings ──────────────────────────────────────────────────────
  function _bindKeys() {
    document.addEventListener('keydown', function (e) {
      if (e.altKey && (e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        _throwCanister();
      }
    });
  }

  // ── Sync public _gasZones array ───────────────────────────────────────
  function _syncGasZones() {
    window._gasZones = [];
    for (var i = 0; i < _zones.length; i++) {
      var z = _zones[i];
      window._gasZones.push({
        position: { x: z.position.x, y: z.position.y, z: z.position.z },
        radius: z.radius,
        active: z.active
      });
    }
  }

  // ── Public API ────────────────────────────────────────────────────────
  function update(dt) {
    if (!_initialized) return;
    _updateCooldown(dt);
    _updateCanisters(dt);
    _updateZones(dt);
    _updatePlayerDamage(dt);
    _updateEnemyDamage(dt);
    _updateHud();
  }

  function release() {
    // Remove all zone meshes
    for (var i = 0; i < _zones.length; i++) {
      _removeZoneMeshes(_zones[i]);
    }
    _zones = [];

    // Remove canister meshes
    for (var j = 0; j < _canisters.length; j++) {
      if (_canisters[j].mesh && _scene) _scene.remove(_canisters[j].mesh);
      _stopHissAudio(_canisters[j]);
    }
    _canisters = [];

    _clearCanvasFilter();
    _hideGasOverlay();

    if (_hudEl) { _hudEl.style.display = 'none'; }
    if (_overlayEl) { _overlayEl.style.display = 'none'; }

    window._gasZones = [];
    window._playerInGas = false;
    _initialized = false;
  }

  function reset() {
    release();
  }

  function getZones() {
    var result = [];
    for (var i = 0; i < _zones.length; i++) {
      var z = _zones[i];
      result.push({
        position: { x: z.position.x, y: z.position.y, z: z.position.z },
        radius: z.radius,
        active: z.active
      });
    }
    return result;
  }

  return { init: init, update: update, release: release, reset: reset, getZones: getZones };
})();
