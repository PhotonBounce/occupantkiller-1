window.GasSystem = (function() {
  'use strict';

  // ── Internal state ─────────────────────────────────────────────────
  var _scene = null;
  var _zones = [];          // active gas zones
  var _grenades = [];       // in-flight grenades (player + enemy)
  var _audioCtx = null;

  // HUD overlays
  var _gasOverlayEl = null;
  var _gasMaskNotifEl = null;

  // player tracking
  var _playerInGasTime = 0; // seconds continuously inside gas without mask
  var _coughTimer = 0;

  // constants
  var GAS_DURATION = 20;           // seconds
  var PLAYER_GAS_DURATION = 15;    // player grenade duration
  var PLAYER_GAS_RADIUS = 3;
  var ENEMY_GAS_RADIUS = 4;
  var PLAYER_DAMAGE_PER_SEC = 3;
  var ENEMY_DAMAGE_PER_SEC = 5;    // gas vs enemies
  var COUGH_INTERVAL = 2;
  var HEAVY_COUGH_THRESHOLD = 8;   // seconds before constant coughing
  var GRENADE_THROW_DISTANCE_MIN = 8;
  var GRENADE_THROW_DISTANCE_MAX = 15;
  var ENEMY_STATIONARY_TIME = 2;   // seconds stationary before enemy throws
  var WAVE_GAS_GRENADE_CHANCE = 0.4;
  var WAVE_GAS_START = 4;

  // enemy grenade carry state: map enemyId -> { hasGrenade, stationaryTime, lastPos }
  var _enemyGasState = {};

  // ── Init / Clear / Reset ───────────────────────────────────────────

  function init(scene) {
    _scene = scene;
    _zones = [];
    _grenades = [];
    _playerInGasTime = 0;
    _coughTimer = 0;
    _enemyGasState = {};

    window._playerInGas = false;
    window._gasZoneCount = 0;
    window._gasMaskOn = window._gasMaskOn || false;
    window._onGasThrow = window._onGasThrow || null;

    _createOverlays();
  }

  function clear() {
    // Remove all zone meshes
    for (var i = 0; i < _zones.length; i++) {
      _removeZoneMeshes(_zones[i]);
    }
    _zones = [];

    // Remove all grenade meshes
    for (var j = 0; j < _grenades.length; j++) {
      if (_grenades[j].mesh && _scene) _scene.remove(_grenades[j].mesh);
    }
    _grenades = [];

    _playerInGasTime = 0;
    _coughTimer = 0;
    _enemyGasState = {};
    window._playerInGas = false;
    window._gasZoneCount = 0;

    _hideOverlays();
    _clearCanvasFilter();
  }

  function reset() {
    clear();
  }

  // ── HUD Overlays ───────────────────────────────────────────────────

  function _createOverlays() {
    if (!_gasOverlayEl) {
      _gasOverlayEl = document.createElement('div');
      _gasOverlayEl.id = 'gasSystemOverlay';
      _gasOverlayEl.style.cssText = [
        'position:fixed;top:0;left:0;width:100%;height:100%;',
        'pointer-events:none;z-index:3050;',
        'background:rgba(100,180,0,0.2);',
        'display:none;',
        'transition:opacity 0.5s;',
      ].join('');
      document.body.appendChild(_gasOverlayEl);
    }

    if (!_gasMaskNotifEl) {
      _gasMaskNotifEl = document.createElement('div');
      _gasMaskNotifEl.id = 'gasSystemMaskNotif';
      _gasMaskNotifEl.style.cssText = [
        'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);',
        'background:rgba(0,0,0,0.7);border:1px solid #44ff88;',
        'color:#44ff88;padding:6px 18px;border-radius:6px;',
        'font-size:13px;font-family:monospace;pointer-events:none;',
        'z-index:3100;display:none;',
      ].join('');
      _gasMaskNotifEl.textContent = 'GAS MASK EQUIPPED';
      document.body.appendChild(_gasMaskNotifEl);
    }
  }

  function _hideOverlays() {
    if (_gasOverlayEl) _gasOverlayEl.style.display = 'none';
    if (_gasMaskNotifEl) _gasMaskNotifEl.style.display = 'none';
  }

  function _clearCanvasFilter() {
    if (window._renderer && window._renderer.domElement) {
      // Only clear our gas filter if GasMask isn't overriding it
      if (!window._gasMaskOn) {
        window._renderer.domElement.style.filter = '';
      }
    }
  }

  // ── Audio ──────────────────────────────────────────────────────────

  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return null;
      }
    }
    return _audioCtx;
  }

  function _playCough() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      // Two quick distorted tones to simulate coughing
      var times = [0, 0.12];
      for (var t = 0; t < times.length; t++) {
        (function(offset) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          var distortion = ctx.createWaveShaper();

          // Simple distortion curve
          var curve = new Float32Array(256);
          for (var k = 0; k < 256; k++) {
            var x = (k * 2) / 256 - 1;
            curve[k] = (3 + 20) * x * 20 * (Math.PI / 180) / (Math.PI + 20 * Math.abs(x));
          }
          distortion.curve = curve;

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(180 + Math.random() * 40, ctx.currentTime + offset);
          osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + offset + 0.1);

          gain.gain.setValueAtTime(0.18, ctx.currentTime + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.12);

          osc.connect(distortion);
          distortion.connect(gain);
          gain.connect(ctx.destination);

          osc.start(ctx.currentTime + offset);
          osc.stop(ctx.currentTime + offset + 0.14);
        })(times[t]);
      }
    } catch (e) {
      // audio not available
    }
  }

  // ── Zone Mesh ──────────────────────────────────────────────────────

  function _createZoneMeshes(zone) {
    var count = 5 + Math.floor(Math.random() * 4); // 5-8 spheres
    var color = zone.isPlayer ? 0x22CC88 : 0x88CC22;
    zone.meshes = [];

    for (var i = 0; i < count; i++) {
      var geo = new THREE.SphereGeometry(zone.radius / 2, 8, 8);
      var mat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
      });
      var mesh = new THREE.Mesh(geo, mat);

      // Scatter spheres loosely within zone
      var offsetX = (Math.random() - 0.5) * zone.radius * 0.8;
      var offsetY = (Math.random() - 0.5) * zone.radius * 0.4 + zone.radius * 0.3;
      var offsetZ = (Math.random() - 0.5) * zone.radius * 0.8;
      mesh.position.set(
        zone.x + offsetX,
        (zone.y || 0) + offsetY,
        zone.z + offsetZ
      );
      mesh._bobIndex = i;
      mesh._offsetX = offsetX;
      mesh._offsetY = offsetY;
      mesh._offsetZ = offsetZ;

      if (_scene) _scene.add(mesh);
      zone.meshes.push(mesh);
    }
  }

  function _removeZoneMeshes(zone) {
    if (!zone.meshes) return;
    for (var i = 0; i < zone.meshes.length; i++) {
      if (_scene) _scene.remove(zone.meshes[i]);
      if (zone.meshes[i].geometry) zone.meshes[i].geometry.dispose();
      if (zone.meshes[i].material) zone.meshes[i].material.dispose();
    }
    zone.meshes = [];
  }

  function _updateZoneMeshes(zone) {
    if (!zone.meshes) return;
    var t = Date.now() * 0.001;
    var opacityTarget = zone.dissipating ? 0 : 0.15;

    for (var i = 0; i < zone.meshes.length; i++) {
      var mesh = zone.meshes[i];
      // Bob/pulse animation at different rates
      var scale = 0.9 + 0.1 * Math.sin(t * (0.8 + i * 0.15) + i);
      mesh.scale.setScalar(scale);

      // Follow zone center (with wind drift)
      mesh.position.x = zone.x + mesh._offsetX;
      mesh.position.y = (zone.y || 0) + mesh._offsetY;
      mesh.position.z = zone.z + mesh._offsetZ;

      // Lerp opacity toward target
      if (mesh.material) {
        mesh.material.opacity += (opacityTarget - mesh.material.opacity) * 0.05;
      }
    }
  }

  // ── Grenade Mesh ───────────────────────────────────────────────────

  function _createGrenadeMesh(isPlayer) {
    var color = isPlayer ? 0x22AA66 : 0x446622;
    var geo = new THREE.CylinderGeometry(0.08, 0.08, 0.22, 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    if (_scene) _scene.add(mesh);
    return mesh;
  }

  // ── Spawn Gas Zone ─────────────────────────────────────────────────

  function spawnGasZone(x, y, z, radius, duration, isPlayer) {
    var zone = {
      x: x,
      y: y || 0,
      z: z,
      radius: radius || ENEMY_GAS_RADIUS,
      duration: duration || GAS_DURATION,
      elapsed: 0,
      isPlayer: isPlayer || false,
      dissipating: false,
      meshes: [],
      _driftX: (Math.random() - 0.5) * 0.04,   // +/- 0.02 per frame at 30fps
      _driftZ: (Math.random() - 0.5) * 0.04,
    };
    _createZoneMeshes(zone);
    _zones.push(zone);
    window._gasZoneCount = _zones.length;

    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('TOXIC GAS ZONE', '#88cc22');
    }
    return zone;
  }

  // ── Throw Gas Grenade (Player) ──────────────────────────────────────

  function throwGasGrenade(origin, direction) {
    if (!origin || !direction) return;

    // Notify grenade-selector integration hook
    if (typeof window._onGasThrow === 'function') {
      window._onGasThrow(origin, direction);
    }

    var mesh = _createGrenadeMesh(true);

    var grenade = {
      mesh: mesh,
      x: origin.x,
      y: origin.y,
      z: origin.z,
      vx: direction.x * 10,
      vy: direction.y * 10 + 5,  // add upward arc
      vz: direction.z * 10,
      elapsed: 0,
      isPlayer: true,
      landed: false,
    };

    if (mesh) {
      mesh.position.set(grenade.x, grenade.y, grenade.z);
    }

    _grenades.push(grenade);
  }

  // ── Enemy Gas Grenade Logic ─────────────────────────────────────────

  function updateEnemyGasGrenades(delta, enemies, playerPos, wave) {
    if (!enemies || !playerPos || wave < WAVE_GAS_START) return;

    for (var i = 0; i < enemies.length; i++) {
      var enemy = enemies[i];
      if (!enemy || !enemy.position) continue;

      var id = enemy._gasId;
      if (!id) {
        id = 'enemy_' + Math.random().toString(36).slice(2);
        enemy._gasId = id;
        // Assign gas grenade to some enemies (40% chance)
        _enemyGasState[id] = {
          hasGrenade: Math.random() < WAVE_GAS_GRENADE_CHANCE,
          stationaryTime: 0,
          lastX: enemy.position.x,
          lastZ: enemy.position.z,
          thrown: false,
        };
      }

      var state = _enemyGasState[id];
      if (!state || !state.hasGrenade || state.thrown) continue;

      // Check distance to player
      var dx = playerPos.x - enemy.position.x;
      var dz = playerPos.z - enemy.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < GRENADE_THROW_DISTANCE_MIN || dist > GRENADE_THROW_DISTANCE_MAX) {
        state.stationaryTime = 0;
        state.lastX = enemy.position.x;
        state.lastZ = enemy.position.z;
        continue;
      }

      // Check if enemy is stationary
      var movedX = Math.abs(enemy.position.x - state.lastX);
      var movedZ = Math.abs(enemy.position.z - state.lastZ);
      var moved = Math.sqrt(movedX * movedX + movedZ * movedZ);

      if (moved < 0.1) {
        state.stationaryTime += delta;
      } else {
        state.stationaryTime = 0;
        state.lastX = enemy.position.x;
        state.lastZ = enemy.position.z;
      }

      if (state.stationaryTime >= ENEMY_STATIONARY_TIME) {
        // Throw at player position
        _throwEnemyGasGrenade(enemy.position, playerPos);
        state.thrown = true;
      }
    }
  }

  function _throwEnemyGasGrenade(fromPos, targetPos) {
    var mesh = _createGrenadeMesh(false);

    var dx = targetPos.x - fromPos.x;
    var dz = targetPos.z - fromPos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    var normX = dist > 0 ? dx / dist : 0;
    var normZ = dist > 0 ? dz / dist : 1;

    var speed = 8;
    var grenade = {
      mesh: mesh,
      x: fromPos.x,
      y: fromPos.y + 1.5,
      z: fromPos.z,
      vx: normX * speed,
      vy: 5,
      vz: normZ * speed,
      elapsed: 0,
      isPlayer: false,
      landed: false,
    };

    if (mesh) {
      mesh.position.set(grenade.x, grenade.y, grenade.z);
    }

    _grenades.push(grenade);
  }

  // ── Update ─────────────────────────────────────────────────────────

  function update(delta, playerPos, playerHP, enemies, wave) {
    if (!_scene) return;

    _updateGrenades(delta);
    _updateZones(delta, playerPos, playerHP, enemies);
    if (typeof wave !== 'undefined') {
      updateEnemyGasGrenades(delta, enemies, playerPos, wave);
    }
  }

  function _updateGrenades(delta) {
    var GRAVITY = -9.8;

    for (var i = _grenades.length - 1; i >= 0; i--) {
      var g = _grenades[i];
      if (g.landed) continue;

      g.elapsed += delta;
      g.vy += GRAVITY * delta;

      g.x += g.vx * delta;
      g.y += g.vy * delta;
      g.z += g.vz * delta;

      if (g.mesh) {
        g.mesh.position.set(g.x, g.y, g.z);
        // Tumble while in flight
        g.mesh.rotation.x += delta * 8;
        g.mesh.rotation.z += delta * 5;
      }

      // Landed when y hits ground (y <= 0)
      if (g.y <= 0) {
        g.y = 0;
        g.landed = true;

        // Remove mesh
        if (g.mesh && _scene) {
          _scene.remove(g.mesh);
          if (g.mesh.geometry) g.mesh.geometry.dispose();
          if (g.mesh.material) g.mesh.material.dispose();
          g.mesh = null;
        }

        // Spawn gas zone
        var radius = g.isPlayer ? PLAYER_GAS_RADIUS : ENEMY_GAS_RADIUS;
        var duration = g.isPlayer ? PLAYER_GAS_DURATION : GAS_DURATION;
        spawnGasZone(g.x, 0, g.z, radius, duration, g.isPlayer);

        // Remove grenade from list
        _grenades.splice(i, 1);
      }
    }
  }

  function _updateZones(delta, playerPos, playerHP, enemies) {
    var playerInsideAny = false;
    var playerInsideMask = false;

    for (var i = _zones.length - 1; i >= 0; i--) {
      var zone = _zones[i];
      zone.elapsed += delta;

      // Wind drift
      zone.x += zone._driftX * delta;
      zone.z += zone._driftZ * delta;

      // Start dissipating near end
      if (zone.elapsed >= zone.duration * 0.85) {
        zone.dissipating = true;
      }

      // Update visuals
      _updateZoneMeshes(zone);

      // Check if zone is fully expired and invisible
      var fullyGone = zone.elapsed >= zone.duration;
      if (fullyGone) {
        _removeZoneMeshes(zone);
        _zones.splice(i, 1);
        window._gasZoneCount = _zones.length;
        continue;
      }

      // Check player inside zone
      if (playerPos) {
        var pdx = playerPos.x - zone.x;
        var pdz = playerPos.z - zone.z;
        var pdist = Math.sqrt(pdx * pdx + pdz * pdz);

        if (pdist < zone.radius) {
          playerInsideAny = true;

          if (window._gasMaskOn) {
            playerInsideMask = true;
          } else {
            // Deal damage
            if (typeof playerHP !== 'undefined' && window._playerHP !== undefined) {
              window._playerHP = Math.max(0, window._playerHP - PLAYER_DAMAGE_PER_SEC * delta);
            }
          }
        }
      }

      // Check enemies inside player gas zones
      if (zone.isPlayer && enemies) {
        for (var j = 0; j < enemies.length; j++) {
          var enemy = enemies[j];
          if (!enemy || !enemy.position) continue;
          var edx = enemy.position.x - zone.x;
          var edz = enemy.position.z - zone.z;
          var edist = Math.sqrt(edx * edx + edz * edz);
          if (edist < zone.radius) {
            // Damage enemy
            if (typeof enemy.hp !== 'undefined') {
              enemy.hp = Math.max(0, enemy.hp - ENEMY_DAMAGE_PER_SEC * delta);
            } else if (typeof enemy.health !== 'undefined') {
              enemy.health = Math.max(0, enemy.health - ENEMY_DAMAGE_PER_SEC * delta);
            }
          }
        }
      }
    }

    window._playerInGas = playerInsideAny;

    // Player gas effects
    if (playerInsideAny) {
      _applyPlayerGasEffects(delta, playerInsideMask);
    } else {
      _clearPlayerGasEffects();
    }
  }

  function _applyPlayerGasEffects(delta, hasMask) {
    // Green tint overlay
    if (_gasOverlayEl) {
      _gasOverlayEl.style.display = 'block';
    }

    if (hasMask) {
      // Mask equipped: show notif, slight tint only
      if (_gasMaskNotifEl) _gasMaskNotifEl.style.display = 'block';
      _clearCanvasFilter();
      _playerInGasTime = 0;
      _coughTimer = 0;
      return;
    }

    // No mask
    if (_gasMaskNotifEl) _gasMaskNotifEl.style.display = 'none';

    _playerInGasTime += delta;
    _coughTimer += delta;

    // Escalating blur/saturation based on time inside
    var blurAmount = Math.min(3, 1 + _playerInGasTime * 0.2);
    var saturate = Math.max(0.2, 0.5 - _playerInGasTime * 0.02);

    if (window._renderer && window._renderer.domElement) {
      window._renderer.domElement.style.filter =
        'blur(' + blurAmount.toFixed(1) + 'px) saturate(' + saturate.toFixed(2) + ')';
    }

    // Coughing sound
    var coughRate = _playerInGasTime >= HEAVY_COUGH_THRESHOLD
      ? 0.5   // every 0.5s when heavily exposed
      : COUGH_INTERVAL;

    if (_coughTimer >= coughRate) {
      _coughTimer = 0;
      _playCough();
    }
  }

  function _clearPlayerGasEffects() {
    if (_gasOverlayEl) _gasOverlayEl.style.display = 'none';
    if (_gasMaskNotifEl) _gasMaskNotifEl.style.display = 'none';
    _playerInGasTime = 0;
    _coughTimer = 0;
    _clearCanvasFilter();
  }

  // ── Public API ─────────────────────────────────────────────────────

  return {
    init: init,
    update: update,
    throwGasGrenade: throwGasGrenade,
    spawnGasZone: spawnGasZone,
    clear: clear,
    reset: reset,
    updateEnemyGasGrenades: updateEnemyGasGrenades,
  };
})();
