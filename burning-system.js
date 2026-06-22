window.BurningSystem = (function () {
  'use strict';

  // Active fire records: { target, duration, dps, elapsed, particles, light, smoke, panicTimer, panicDir, isPlayer }
  var _fires = [];
  var _extinguisherPickups = [];
  var _audioCtx = null;
  var _hudOverlay = null;
  var _onFireLabel = null;
  var _vignetteEl = null;
  var _initialized = false;
  var _spacePressed = false;
  var _cameraBobTimer = 0;
  var _cameraBobActive = false;

  // Expose globals
  window._playerBurning = false;
  window._onIgnite = window._onIgnite || null;

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  function _getScene() {
    return (window.scene) || (window.GameManager && window.GameManager.scene) || null;
  }

  function _getCamera() {
    return (window.camera) || (window.GameManager && window.GameManager.camera) || null;
  }

  function _getEnemies() {
    return (window.enemies) || (window.GameManager && window.GameManager.enemies) || [];
  }

  function _getPlayerPos() {
    var cam = _getCamera();
    if (cam) return cam.position;
    return null;
  }

  function _getAudioCtx() {
    if (!_audioCtx) {
      try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { _audioCtx = null; }
    }
    return _audioCtx;
  }

  function _dist2(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _targetPos(target) {
    if (target && target.mesh && target.mesh.position) return target.mesh.position;
    if (target && target.position) return target.position;
    return null;
  }

  function _alreadyBurning(target) {
    for (var i = 0; i < _fires.length; i++) {
      if (_fires[i].target === target) return true;
    }
    return false;
  }

  // -----------------------------------------------------------------------
  // Audio: enemy scream — ascending tone 400->800 Hz over 0.3s
  // -----------------------------------------------------------------------

  function _playScream() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.32);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) { /* ignore */ }
  }

  // -----------------------------------------------------------------------
  // Visuals: fire particles + glow + smoke
  // -----------------------------------------------------------------------

  function _makeFireParticles(pos) {
    var scene = _getScene();
    if (!scene || !window.THREE) return [];
    var THREE = window.THREE;
    var count = 4 + Math.floor(Math.random() * 3); // 4-6
    var particles = [];
    for (var i = 0; i < count; i++) {
      var color = (Math.random() > 0.5) ? 0xFF6600 : 0xFFCC00;
      var geo = new THREE.SphereGeometry(0.08, 6, 6);
      var mat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.85
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 0.3,
        pos.y + 0.5 + Math.random() * 0.3,
        pos.z + (Math.random() - 0.5) * 0.3
      );
      mesh._baseX = mesh.position.x;
      mesh._baseZ = mesh.position.z;
      mesh._phase = Math.random() * Math.PI * 2;
      scene.add(mesh);
      particles.push(mesh);
    }
    return particles;
  }

  function _makeGlowLight(pos) {
    var scene = _getScene();
    if (!scene || !window.THREE) return null;
    var THREE = window.THREE;
    var light = new THREE.PointLight(0xFF4400, 2, 2);
    light.position.set(pos.x, pos.y + 0.6, pos.z);
    scene.add(light);
    return light;
  }

  function _makeSmoke(pos) {
    var scene = _getScene();
    if (!scene || !window.THREE) return null;
    var THREE = window.THREE;
    var geo = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6);
    var mat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.35
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, pos.y + 1.0, pos.z);
    scene.add(mesh);
    return mesh;
  }

  function _removeFireVisuals(fire) {
    var scene = _getScene();
    if (!scene) return;
    for (var i = 0; i < fire.particles.length; i++) {
      scene.remove(fire.particles[i]);
      if (fire.particles[i].geometry) fire.particles[i].geometry.dispose();
      if (fire.particles[i].material) fire.particles[i].material.dispose();
    }
    fire.particles = [];
    if (fire.light) {
      scene.remove(fire.light);
      fire.light = null;
    }
    if (fire.smoke) {
      scene.remove(fire.smoke);
      if (fire.smoke.geometry) fire.smoke.geometry.dispose();
      if (fire.smoke.material) fire.smoke.material.dispose();
      fire.smoke = null;
    }
  }

  // -----------------------------------------------------------------------
  // HUD: player on fire overlay
  // -----------------------------------------------------------------------

  function _ensureHUD() {
    if (_hudOverlay) return;
    _hudOverlay = document.createElement('div');
    _hudOverlay.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:9999',
      'display:none'
    ].join(';');

    _vignetteEl = document.createElement('div');
    _vignetteEl.style.cssText = [
      'position:absolute',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'background:radial-gradient(ellipse at center, rgba(255,0,0,0) 40%, rgba(255,60,0,0.65) 100%)',
      'animation:burningPulse 0.4s ease-in-out infinite alternate'
    ].join(';');

    _onFireLabel = document.createElement('div');
    _onFireLabel.textContent = 'ON FIRE -- Press SPACE to roll';
    _onFireLabel.style.cssText = [
      'position:absolute',
      'top:18%',
      'width:100%',
      'text-align:center',
      'color:#FF4400',
      'font-size:2.2rem',
      'font-weight:bold',
      'font-family:monospace',
      'text-shadow:0 0 12px #FF0000,0 0 4px #000',
      'letter-spacing:0.1em',
      'animation:burningPulse 0.4s ease-in-out infinite alternate'
    ].join(';');

    var style = document.createElement('style');
    style.textContent = '@keyframes burningPulse{from{opacity:0.7}to{opacity:1}}';
    document.head.appendChild(style);

    _hudOverlay.appendChild(_vignetteEl);
    _hudOverlay.appendChild(_onFireLabel);
    document.body.appendChild(_hudOverlay);
  }

  function _showPlayerFireHUD(show) {
    _ensureHUD();
    _hudOverlay.style.display = show ? 'block' : 'none';
  }

  // -----------------------------------------------------------------------
  // Fire extinguisher pickup
  // -----------------------------------------------------------------------

  function _spawnExtinguisher(pos) {
    var scene = _getScene();
    if (!scene || !window.THREE) return;
    var THREE = window.THREE;
    var geo = new THREE.BoxGeometry(0.15, 0.4, 0.15);
    var mat = new THREE.MeshStandardMaterial({ color: 0xCC0000 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, pos.y, pos.z);
    scene.add(mesh);
    _extinguisherPickups.push({ mesh: mesh, position: mesh.position });
  }

  function _checkExtinguisherPickup() {
    var playerPos = _getPlayerPos();
    if (!playerPos) return;
    var scene = _getScene();
    for (var i = _extinguisherPickups.length - 1; i >= 0; i--) {
      var ext = _extinguisherPickups[i];
      if (_dist2(playerPos, ext.position) < 0.8) {
        if (window._playerBurning) {
          _extinguishPlayer();
        }
        if (scene) scene.remove(ext.mesh);
        if (ext.mesh.geometry) ext.mesh.geometry.dispose();
        if (ext.mesh.material) ext.mesh.material.dispose();
        _extinguisherPickups.splice(i, 1);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Extinguish / stop-drop-roll
  // -----------------------------------------------------------------------

  function _extinguishPlayer() {
    window._playerBurning = false;
    _showPlayerFireHUD(false);
    // Remove player fire record
    for (var i = _fires.length - 1; i >= 0; i--) {
      if (_fires[i].isPlayer) {
        _removeFireVisuals(_fires[i]);
        _fires.splice(i, 1);
      }
    }
    // Camera bob animation (stop-drop-roll)
    _cameraBobActive = true;
    _cameraBobTimer = 0.5;
  }

  function _handleSpaceKey(e) {
    if (e.code === 'Space' || e.keyCode === 32) {
      _spacePressed = true;
    }
  }

  // -----------------------------------------------------------------------
  // Core: ignite
  // -----------------------------------------------------------------------

  function ignite(target, duration, dps) {
    if (!target) return;
    if (_alreadyBurning(target)) return;

    var isPlayer = (target === 'player') || (target && target._isPlayer) ||
                   (target === window.player);
    var pos;
    if (isPlayer) {
      pos = _getPlayerPos() || { x: 0, y: 0, z: 0 };
    } else {
      pos = _targetPos(target) || { x: 0, y: 0, z: 0 };
    }

    var particles = _makeFireParticles(pos);
    var light = _makeGlowLight(pos);
    var smoke = _makeSmoke(pos);

    var fireRecord = {
      target: target,
      duration: duration || 5,
      dps: dps || 5,
      elapsed: 0,
      particles: particles,
      light: light,
      smoke: smoke,
      panicTimer: 0,
      panicDir: { x: 0, z: 0 },
      isPlayer: isPlayer,
      spreadCooldown: 0
    };

    _fires.push(fireRecord);

    if (isPlayer) {
      window._playerBurning = true;
      _showPlayerFireHUD(true);
    } else {
      // Enemy panic: random direction for 1.5s
      var angle = Math.random() * Math.PI * 2;
      fireRecord.panicTimer = 1.5;
      fireRecord.panicDir = { x: Math.cos(angle), z: Math.sin(angle) };
      _playScream();
    }

    // Fire _onIgnite hook
    if (typeof window._onIgnite === 'function') {
      window._onIgnite(target, 'burning-system');
    }
  }

  // -----------------------------------------------------------------------
  // Core: update
  // -----------------------------------------------------------------------

  function update(dt) {
    if (!dt || dt <= 0) return;

    // Check thermite zones
    _checkThermiteZones();

    // Check extinguisher pickups
    _checkExtinguisherPickup();

    // Stop-drop-roll: space key extinguishes player
    if (_spacePressed && window._playerBurning) {
      _extinguishPlayer();
    }
    _spacePressed = false;

    // Camera bob when rolling
    if (_cameraBobActive) {
      _cameraBobTimer -= dt;
      var cam = _getCamera();
      if (cam && _cameraBobTimer > 0) {
        cam.position.y += Math.sin(_cameraBobTimer * 40) * 0.015;
      } else {
        _cameraBobActive = false;
      }
    }

    var enemies = _getEnemies();

    for (var i = _fires.length - 1; i >= 0; i--) {
      var fire = _fires[i];
      fire.elapsed += dt;

      var pos = fire.isPlayer ? _getPlayerPos() : _targetPos(fire.target);

      // Tick duration
      if (fire.elapsed >= fire.duration) {
        _removeFireVisuals(fire);
        if (fire.isPlayer) {
          window._playerBurning = false;
          _showPlayerFireHUD(false);
        }
        _fires.splice(i, 1);
        continue;
      }

      // Apply damage per second
      if (pos) {
        if (fire.isPlayer) {
          if (window.playerHealth !== undefined) {
            window.playerHealth -= fire.dps * dt;
          } else if (window.GameManager && window.GameManager.playerHealth !== undefined) {
            window.GameManager.playerHealth -= fire.dps * dt;
          }
        } else {
          var tgt = fire.target;
          if (tgt && tgt.health !== undefined) {
            tgt.health -= fire.dps * dt;
          }
        }
      }

      // Update particle positions
      if (pos) {
        for (var p = 0; p < fire.particles.length; p++) {
          var particle = fire.particles[p];
          // Rise 0.3 units then reset
          particle.position.y += 0.4 * dt;
          if (particle.position.y > pos.y + 1.1) {
            particle.position.y = pos.y + 0.5;
            particle._baseX = pos.x + (Math.random() - 0.5) * 0.3;
            particle._baseZ = pos.z + (Math.random() - 0.5) * 0.3;
          }
          particle.position.x = particle._baseX + Math.sin(fire.elapsed * 3 + particle._phase) * 0.06;
          particle.position.z = particle._baseZ + Math.cos(fire.elapsed * 2 + particle._phase) * 0.04;
        }

        // Update light position + pulse intensity (0.8 to 1.5)
        if (fire.light) {
          fire.light.position.set(pos.x, pos.y + 0.6, pos.z);
          fire.light.intensity = 0.8 + (Math.sin(fire.elapsed * 8) * 0.5 + 0.5) * 0.7;
        }

        // Update smoke trail
        if (fire.smoke) {
          fire.smoke.position.set(pos.x, pos.y + 1.0 + fire.elapsed * 0.05, pos.z);
          if (fire.smoke.material) {
            fire.smoke.material.opacity = Math.max(0.1, 0.35 - fire.elapsed * 0.02);
          }
        }
      }

      // Enemy panic movement
      if (!fire.isPlayer && fire.panicTimer > 0) {
        fire.panicTimer -= dt;
        var tgtObj = fire.target;
        if (tgtObj && tgtObj.mesh && tgtObj.mesh.position) {
          tgtObj.mesh.position.x += fire.panicDir.x * 2 * dt;
          tgtObj.mesh.position.z += fire.panicDir.z * 2 * dt;
        }
        // Occasional scream repeat
        if (fire.panicTimer > 0 && Math.random() < dt * 2) {
          _playScream();
        }
      }

      // Fire spread: 30% per second to nearby enemies within 1.5 units
      if (!fire.isPlayer && pos) {
        fire.spreadCooldown -= dt;
        if (fire.spreadCooldown <= 0) {
          fire.spreadCooldown = 1.0;
          for (var e = 0; e < enemies.length; e++) {
            var enemy = enemies[e];
            if (_alreadyBurning(enemy)) continue;
            var epos = _targetPos(enemy);
            if (!epos) continue;
            if (_dist2(pos, epos) < 1.5) {
              if (Math.random() < 0.30) {
                ignite(enemy, fire.duration - fire.elapsed, fire.dps);
              }
            }
          }
        }
      }
    }
  }

  // -----------------------------------------------------------------------
  // Thermite zone interaction
  // -----------------------------------------------------------------------

  function _checkThermiteZones() {
    var zones = window._thermiteZones;
    if (!zones || !zones.length) return;

    var playerPos = _getPlayerPos();
    var enemies = _getEnemies();

    for (var z = 0; z < zones.length; z++) {
      var zone = zones[z];
      if (!zone || !zone.position) continue;
      var radius = zone.radius || 2;

      // Ignite player if in thermite zone
      if (playerPos && !window._playerBurning) {
        if (_dist2(playerPos, zone.position) < radius) {
          ignite('player', 5, 5);
        }
      }

      // Ignite nearby enemies
      for (var e = 0; e < enemies.length; e++) {
        var epos = _targetPos(enemies[e]);
        if (!epos) continue;
        if (_alreadyBurning(enemies[e])) continue;
        if (_dist2(epos, zone.position) < radius) {
          ignite(enemies[e], 6, 8);
        }
      }
    }
  }

  // -----------------------------------------------------------------------
  // init
  // -----------------------------------------------------------------------

  function init() {
    if (_initialized) return;
    _initialized = true;

    window.addEventListener('keydown', _handleSpaceKey);

    // Defer extinguisher pickup spawning until scene is available
    var _spawnAttempts = 0;
    var _spawnInterval = setInterval(function () {
      _spawnAttempts++;
      var scene = _getScene();
      if (scene || _spawnAttempts > 30) {
        clearInterval(_spawnInterval);
        if (scene) {
          _spawnExtinguisher({ x: 5, y: 0, z: -8 });
          _spawnExtinguisher({ x: -12, y: 0, z: 4 });
        }
      }
    }, 500);
  }

  // -----------------------------------------------------------------------
  // reset
  // -----------------------------------------------------------------------

  function reset() {
    for (var i = 0; i < _fires.length; i++) {
      _removeFireVisuals(_fires[i]);
    }
    _fires = [];

    var scene = _getScene();
    for (var j = 0; j < _extinguisherPickups.length; j++) {
      if (scene) scene.remove(_extinguisherPickups[j].mesh);
    }
    _extinguisherPickups = [];

    window._playerBurning = false;
    _showPlayerFireHUD(false);
    _cameraBobActive = false;
  }

  // -----------------------------------------------------------------------
  // Auto-init on DOM ready
  // -----------------------------------------------------------------------

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init: init,
    update: update,
    ignite: ignite,
    reset: reset
  };
})();
