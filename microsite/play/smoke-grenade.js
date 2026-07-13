window.SmokeGrenade = (function() {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────
  var SMOKE_TYPES = ['WHITE', 'RED', 'VIOLET', 'GREEN'];

  var SMOKE_COLORS = {
    WHITE:  0xE0E0E0,
    RED:    0xCC2200,
    VIOLET: 0x9900CC,
    GREEN:  0x00CC44
  };

  var SMOKE_COLORS_CSS = {
    WHITE:  '#E0E0E0',
    RED:    '#CC2200',
    VIOLET: '#9900CC',
    GREEN:  '#00CC44'
  };

  var MAX_CLOUDS      = 6;
  var CLOUD_LIFETIME  = 20;     // seconds
  var EXPAND_TIME     = 2;      // seconds to reach full radius
  var CLOUD_RADIUS    = 6;      // units at full expansion
  var PARTICLE_COUNT_MIN = 15;
  var PARTICLE_COUNT_MAX = 25;
  var THROW_RANGE     = 15;     // units
  var RISE_SPEED      = 0.1;    // units/s per particle
  var BOUNCE_DAMPEN   = 0.35;
  var GRENADE_GRAVITY = -9.8;
  var START_AMMO      = 4;      // per type
  var WOBBLE_STRENGTH = 0.008;
  var WOBBLE_FREQ     = 3.5;    // Hz

  // ── State ─────────────────────────────────────────────────────────────────
  var _scene    = null;
  var _camera   = null;
  var _audioCtx = null;
  var _hudEl    = null;
  var _timerEl  = null;

  var _selectedIdx = 0;   // index into SMOKE_TYPES
  var _inventory   = { WHITE: START_AMMO, RED: START_AMMO, VIOLET: START_AMMO, GREEN: START_AMMO };

  var _activeGrenades = [];  // in-flight grenades
  var _smokeClouds    = [];  // deployed smoke clouds

  var _gKeyWasDown     = false;
  var _shiftGKeyWasDown = false;
  var _wobbleTime      = 0;
  var _playerInSmoke   = false;
  var _desatApplied    = false;

  // ── Audio ─────────────────────────────────────────────────────────────────
  function _getAudio() {
    if (!_audioCtx) {
      _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    }
    return _audioCtx;
  }

  function _playHiss() {
    try {
      var ctx = _getAudio();
      var dur = 3.0;
      var buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      var d   = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) {
        var t   = i / ctx.sampleRate;
        var env = Math.min(t / 0.15, 1.0) * Math.exp(-t / 1.2);
        d[i] = (Math.random() * 2 - 1) * env * 0.35;
      }
      var src  = ctx.createBufferSource();
      src.buffer = buf;
      var filt = ctx.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.value = 2800;
      filt.Q.value = 0.6;
      var g = ctx.createGain();
      g.gain.value = 0.4;
      src.connect(filt);
      filt.connect(g);
      g.connect(ctx.destination);
      src.start();
    } catch(e) {}
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function _createHUD() {
    if (_hudEl) return;

    _hudEl = document.createElement('div');
    _hudEl.id = 'smoke-grenade-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:220px',
      'right:16px',
      'font-family:monospace',
      'font-size:12px',
      'font-weight:bold',
      'text-shadow:1px 1px 2px #000',
      'z-index:1410',
      'pointer-events:none',
      'line-height:1.6'
    ].join(';');
    document.body.appendChild(_hudEl);

    _timerEl = document.createElement('div');
    _timerEl.id = 'smoke-grenade-timers';
    _timerEl.style.cssText = [
      'position:fixed',
      'bottom:160px',
      'right:16px',
      'font-family:monospace',
      'font-size:11px',
      'color:#BBBBBB',
      'text-shadow:1px 1px 2px #000',
      'z-index:1410',
      'pointer-events:none',
      'line-height:1.4'
    ].join(';');
    document.body.appendChild(_timerEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;

    var html = '<span style="color:#FFFFFF;">SMOKE: </span>';
    for (var i = 0; i < SMOKE_TYPES.length; i++) {
      var t    = SMOKE_TYPES[i];
      var col  = SMOKE_COLORS_CSS[t];
      var cnt  = _inventory[t];
      var sel  = (i === _selectedIdx);
      var bg   = sel ? 'background:rgba(255,255,255,0.15);padding:1px 3px;border-radius:2px;' : '';
      html += '<span style="color:' + col + ';' + bg + '">' + t[0] + ':' + cnt + '</span> ';
    }
    _hudEl.innerHTML = html;

    // Smoke cloud timers
    if (!_timerEl) return;
    var timerHtml = '';
    for (var j = 0; j < _smokeClouds.length; j++) {
      var cloud = _smokeClouds[j];
      var remaining = Math.max(0, CLOUD_LIFETIME - cloud.age);
      var c = SMOKE_COLORS_CSS[cloud.smokeType];
      timerHtml += '<span style="color:' + c + ';">' + cloud.smokeType[0] + ':' + remaining.toFixed(0) + 's</span> ';
    }
    _timerEl.innerHTML = timerHtml || '';
  }

  // ── Grenade mesh ──────────────────────────────────────────────────────────
  function _makeGrenadeMesh(smokeType) {
    var sc = _scene || window._gameScene || window._scene;
    if (!sc) return null;

    var geo  = new THREE.CylinderGeometry(0.06, 0.06, 0.18, 8);
    var mat  = new THREE.MeshLambertMaterial({ color: SMOKE_COLORS[smokeType] });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = false;
    sc.add(mesh);
    return mesh;
  }

  // ── Smoke particle ────────────────────────────────────────────────────────
  function _makeParticle(color, cloudPos) {
    var sc = _scene || window._gameScene || window._scene;
    if (!sc) return null;

    var geo  = new THREE.SphereGeometry(0.5, 6, 6);
    var mat  = new THREE.MeshLambertMaterial({
      color:       color,
      transparent: true,
      opacity:     0.0,
      depthWrite:  false
    });
    var mesh = new THREE.Mesh(geo, mat);

    // Random offset within cloud radius
    var angle  = Math.random() * Math.PI * 2;
    var radius = Math.random() * CLOUD_RADIUS * 0.4;
    mesh.position.set(
      cloudPos.x + Math.cos(angle) * radius,
      cloudPos.y + Math.random() * 0.5,
      cloudPos.z + Math.sin(angle) * radius
    );

    // Random target offset for expansion
    var tAngle  = Math.random() * Math.PI * 2;
    var tRadius = (0.5 + Math.random() * 0.5) * CLOUD_RADIUS;
    mesh.userData.targetOffsetX = Math.cos(tAngle) * tRadius;
    mesh.userData.targetOffsetY = 0.3 + Math.random() * 2.5;
    mesh.userData.targetOffsetZ = Math.sin(tAngle) * tRadius;
    mesh.userData.startX = mesh.position.x;
    mesh.userData.startY = mesh.position.y;
    mesh.userData.startZ = mesh.position.z;

    // Unique drift seeds
    mesh.userData.driftAngle = Math.random() * Math.PI * 2;
    mesh.userData.driftSpeed = 0.05 + Math.random() * 0.05;

    sc.add(mesh);
    return mesh;
  }

  // ── Deploy smoke cloud ─────────────────────────────────────────────────────
  function _deploySmoke(smokeType, landPos) {
    var sc = _scene || window._gameScene || window._scene;
    if (!sc) return;

    // Remove oldest cloud if over limit
    if (_smokeClouds.length >= MAX_CLOUDS) {
      var oldest = _smokeClouds.shift();
      _destroySmokeCloud(oldest);
    }

    _playHiss();

    var numParticles = PARTICLE_COUNT_MIN + Math.floor(Math.random() * (PARTICLE_COUNT_MAX - PARTICLE_COUNT_MIN + 1));
    var particles    = [];
    var color        = SMOKE_COLORS[smokeType];

    for (var i = 0; i < numParticles; i++) {
      var p = _makeParticle(color, landPos);
      if (p) particles.push(p);
    }

    _smokeClouds.push({
      smokeType:  smokeType,
      landPos:    landPos.clone ? landPos.clone() : { x: landPos.x, y: landPos.y, z: landPos.z },
      particles:  particles,
      age:        0,
      active:     true
    });

    // VIOLET: call air support
    if (smokeType === 'VIOLET' && window.AirSupport && typeof window.AirSupport.callBombRun === 'function') {
      window.AirSupport.callBombRun(landPos);
    }
  }

  function _destroySmokeCloud(cloud) {
    var sc = _scene || window._gameScene || window._scene;
    if (!sc) return;
    for (var i = 0; i < cloud.particles.length; i++) {
      var p = cloud.particles[i];
      if (p) {
        sc.remove(p);
        if (p.geometry) p.geometry.dispose();
        if (p.material) p.material.dispose();
      }
    }
    cloud.particles = [];
    cloud.active    = false;
  }

  // ── Throw grenade ──────────────────────────────────────────────────────────
  function _throwGrenade(smokeType) {
    var sc  = _scene  || window._gameScene || window._scene;
    var cam = _camera || window._camera    || window._gameCamera;
    if (!sc || !cam) return;

    if (_inventory[smokeType] <= 0) return;
    _inventory[smokeType]--;
    _updateHUD();

    var mesh = _makeGrenadeMesh(smokeType);
    if (!mesh) return;

    // Start position: camera position + small forward offset
    var dir = new THREE.Vector3();
    cam.getWorldDirection(dir);

    var startPos = cam.position.clone().add(dir.clone().multiplyScalar(0.5));
    startPos.y -= 0.2;
    mesh.position.copy(startPos);

    // Arc velocity: scale horizontal by THROW_RANGE, vertical by arc
    var hSpeed   = THROW_RANGE / 2.2;
    var vSpeed   = 7.0;
    var vel      = new THREE.Vector3(
      dir.x * hSpeed,
      vSpeed,
      dir.z * hSpeed
    );

    _activeGrenades.push({
      mesh:       mesh,
      smokeType:  smokeType,
      vel:        vel,
      bounced:    false,
      deployed:   false,
      age:        0
    });
  }

  // ── Update in-flight grenades ──────────────────────────────────────────────
  function _updateGrenades(delta) {
    for (var i = _activeGrenades.length - 1; i >= 0; i--) {
      var g = _activeGrenades[i];
      if (g.deployed) {
        _activeGrenades.splice(i, 1);
        continue;
      }

      g.age += delta;

      // Safety timeout
      if (g.age > 8) {
        if (g.mesh) {
          var sc = _scene || window._gameScene || window._scene;
          if (sc) sc.remove(g.mesh);
          if (g.mesh.geometry) g.mesh.geometry.dispose();
          if (g.mesh.material) g.mesh.material.dispose();
        }
        _activeGrenades.splice(i, 1);
        continue;
      }

      // Apply gravity
      g.vel.y += GRENADE_GRAVITY * delta;

      // Move
      g.mesh.position.x += g.vel.x * delta;
      g.mesh.position.y += g.vel.y * delta;
      g.mesh.position.z += g.vel.z * delta;

      // Spin for visual flair
      g.mesh.rotation.x += 3.0 * delta;
      g.mesh.rotation.z += 2.0 * delta;

      // Ground collision: y <= 0 (or terrain if available)
      var groundY = 0;
      if (window.TerrainSystem && typeof window.TerrainSystem.getHeightAt === 'function') {
        groundY = window.TerrainSystem.getHeightAt(g.mesh.position.x, g.mesh.position.z) || 0;
      }

      if (g.mesh.position.y <= groundY) {
        g.mesh.position.y = groundY;

        if (!g.bounced) {
          // Bounce once
          g.vel.y = Math.abs(g.vel.y) * BOUNCE_DAMPEN;
          g.vel.x *= 0.7;
          g.vel.z *= 0.7;
          g.bounced = true;
        } else {
          // Deploy smoke
          var landPos = g.mesh.position.clone();
          landPos.y   = groundY;

          var sc2 = _scene || window._gameScene || window._scene;
          if (sc2) {
            sc2.remove(g.mesh);
            if (g.mesh.geometry) g.mesh.geometry.dispose();
            if (g.mesh.material) g.mesh.material.dispose();
          }

          _deploySmoke(g.smokeType, landPos);
          g.deployed = true;
        }
      }
    }
  }

  // ── Update smoke clouds ────────────────────────────────────────────────────
  function _updateSmokeClouds(delta) {
    var cam  = _camera || window._camera || window._gameCamera;
    var wind = { x: 0, z: 0 };

    if (window.WeatherSystem && window.WeatherSystem.getWind) {
      var w = window.WeatherSystem.getWind();
      if (w) { wind.x = w.x || 0; wind.z = w.z || 0; }
    }

    _playerInSmoke = false;

    for (var i = _smokeClouds.length - 1; i >= 0; i--) {
      var cloud = _smokeClouds[i];
      cloud.age += delta;

      if (cloud.age >= CLOUD_LIFETIME) {
        _destroySmokeCloud(cloud);
        _smokeClouds.splice(i, 1);
        continue;
      }

      var expandT  = Math.min(cloud.age / EXPAND_TIME, 1.0);   // 0..1 during expansion
      var fadeT    = Math.max(0, (cloud.age - (CLOUD_LIFETIME * 0.6)) / (CLOUD_LIFETIME * 0.4)); // 0..1 during fade
      var opacity  = Math.min(expandT, 1.0 - fadeT) * 0.72;

      // Check if camera (player) is within this cloud
      if (cam) {
        var dx = cam.position.x - cloud.landPos.x;
        var dz = cam.position.z - cloud.landPos.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < CLOUD_RADIUS * expandT) {
          _playerInSmoke = true;
        }
      }

      for (var j = 0; j < cloud.particles.length; j++) {
        var p = cloud.particles[j];
        if (!p) continue;

        // Expand to target positions
        p.position.x = p.userData.startX + p.userData.targetOffsetX * expandT;
        p.position.y = p.userData.startY + p.userData.targetOffsetY * expandT + cloud.age * RISE_SPEED;
        p.position.z = p.userData.startZ + p.userData.targetOffsetZ * expandT;

        // Wind drift
        p.position.x += wind.x * delta * 0.5;
        p.position.z += wind.z * delta * 0.5;

        p.material.opacity = opacity;
      }
    }
  }

  // ── Player in smoke effects ────────────────────────────────────────────────
  function _applyPlayerSmokeEffect(inSmoke) {
    if (inSmoke && !_desatApplied) {
      document.body.style.filter = 'saturate(0.35)';
      _desatApplied = true;
    } else if (!inSmoke && _desatApplied) {
      document.body.style.filter = '';
      _desatApplied = false;
    }
  }

  function _applyCameraWobble(delta) {
    var cam = _camera || window._camera || window._gameCamera;
    if (!cam || !_playerInSmoke) return;

    _wobbleTime += delta;
    var wobble = Math.sin(_wobbleTime * WOBBLE_FREQ * Math.PI * 2) * WOBBLE_STRENGTH;
    cam.rotation.z += wobble;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * getSmokeZones() — returns array of active smoke zone descriptors.
   * Each entry: { pos, radius, type, age }
   * Used by AI systems, laser designators, etc.
   */
  function getSmokeZones() {
    var zones = [];
    for (var i = 0; i < _smokeClouds.length; i++) {
      var cloud   = _smokeClouds[i];
      var expandT = Math.min(cloud.age / EXPAND_TIME, 1.0);
      zones.push({
        pos:    cloud.landPos,
        radius: CLOUD_RADIUS * expandT,
        type:   cloud.smokeType,
        age:    cloud.age
      });
    }
    return zones;
  }

  /**
   * throwSmoke(color, pos) — programmatic throw to a target position.
   * color: 'WHITE'|'RED'|'VIOLET'|'GREEN'  pos: THREE.Vector3
   */
  function throwSmoke(color, pos) {
    if (!SMOKE_COLORS[color]) return;
    if (_inventory[color] <= 0) return;
    _inventory[color]--;
    _updateHUD();
    _deploySmoke(color, pos);
  }

  // ── Input handling ─────────────────────────────────────────────────────────
  function _handleKeys(delta) {
    var keys = window._keysDown || window._keys || {};

    var gDown     = !!(keys['KeyG']  || keys['g'] || keys['G']);
    var shiftDown = !!(keys['ShiftLeft'] || keys['ShiftRight'] || keys['Shift']);

    if (gDown && !shiftDown) {
      // G alone: cycle type (on key-down edge)
      if (!_gKeyWasDown) {
        _selectedIdx = (_selectedIdx + 1) % SMOKE_TYPES.length;
        _updateHUD();
      }
    } else if (gDown && shiftDown) {
      // Shift+G: throw (on key-down edge)
      if (!_shiftGKeyWasDown) {
        var type = SMOKE_TYPES[_selectedIdx];
        _throwGrenade(type);
      }
    }

    _gKeyWasDown      = gDown && !shiftDown;
    _shiftGKeyWasDown = gDown && shiftDown;
  }

  // ── Public init ────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene  || null;
    _camera = camera || null;
    _createHUD();
    _updateHUD();
  }

  // ── Public update ──────────────────────────────────────────────────────────
  function update(delta) {
    if (!delta || delta <= 0) delta = 0.016;

    _handleKeys(delta);
    _updateGrenades(delta);
    _updateSmokeClouds(delta);
    _applyPlayerSmokeEffect(_playerInSmoke);
    _applyCameraWobble(delta);
    _updateHUD();
  }

  // ── Public reset ───────────────────────────────────────────────────────────
  function reset() {
    // Remove all in-flight grenades
    var sc = _scene || window._gameScene || window._scene;
    for (var i = 0; i < _activeGrenades.length; i++) {
      var g = _activeGrenades[i];
      if (g.mesh && sc) {
        sc.remove(g.mesh);
        if (g.mesh.geometry) g.mesh.geometry.dispose();
        if (g.mesh.material) g.mesh.material.dispose();
      }
    }
    _activeGrenades = [];

    // Remove all smoke clouds
    for (var j = 0; j < _smokeClouds.length; j++) {
      _destroySmokeCloud(_smokeClouds[j]);
    }
    _smokeClouds = [];

    // Reset inventory
    _inventory = { WHITE: START_AMMO, RED: START_AMMO, VIOLET: START_AMMO, GREEN: START_AMMO };
    _selectedIdx    = 0;
    _gKeyWasDown    = false;
    _shiftGKeyWasDown = false;
    _wobbleTime     = 0;
    _playerInSmoke  = false;

    // Remove desaturation
    if (_desatApplied) {
      document.body.style.filter = '';
      _desatApplied = false;
    }

    _updateHUD();
  }

  // ── Expose AI helpers on the module ───────────────────────────────────────
  // Enemy AI can query isWhiteSmoke(pos) to route around obstacles.
  // Laser designator systems can query isInSmoke(pos) for safety checks.
  function _posInSmoke(pos, typeFilter) {
    var zones = getSmokeZones();
    for (var i = 0; i < zones.length; i++) {
      var z = zones[i];
      if (typeFilter && z.type !== typeFilter) continue;
      var dx   = pos.x - z.pos.x;
      var dz   = (pos.z !== undefined ? pos.z : pos.z) - z.pos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < z.radius) return true;
    }
    return false;
  }

  // ── Install global AI hook helpers ────────────────────────────────────────
  // Called by enemy AI systems to check navigability and fire penalty.
  window.SmokeGrenadeZones = {
    /** Returns true if pos is inside any active smoke cloud */
    isInSmoke: function(pos) {
      return _posInSmoke(pos, null);
    },
    /** Returns true if pos is inside WHITE smoke (blocks LOS; AI avoids) */
    isInWhiteSmoke: function(pos) {
      return _posInSmoke(pos, 'WHITE');
    },
    /** Returns true if pos is inside RED smoke (fire suppression) */
    isInRedSmoke: function(pos) {
      return _posInSmoke(pos, 'RED');
    },
    /** Returns true if pos is inside VIOLET smoke (air support marker) */
    isInVioletSmoke: function(pos) {
      return _posInSmoke(pos, 'VIOLET');
    },
    /** Returns true if pos is inside GREEN smoke (extraction beacon) */
    isInGreenSmoke: function(pos) {
      return _posInSmoke(pos, 'GREEN');
    },
    /**
     * getAIDetectionRange(defaultRange, enemyPos) — WHITE smoke reduces detection.
     * Returns adjusted detection range: 3 units inside white smoke, unchanged otherwise.
     */
    getAIDetectionRange: function(defaultRange, enemyPos) {
      return _posInSmoke(enemyPos, 'WHITE') ? 3 : defaultRange;
    },
    /**
     * getFireAccuracyMultiplier(enemyPos) — RED smoke reduces accuracy.
     * Returns 0.5 inside red smoke, 1.0 otherwise.
     */
    getFireAccuracyMultiplier: function(enemyPos) {
      return _posInSmoke(enemyPos, 'RED') ? 0.5 : 1.0;
    },
    /**
     * isLaserBlocked(start, end) — Returns true if a laser designator line
     * passes through any active smoke cloud (simple midpoint check).
     */
    isLaserBlocked: function(start, end) {
      var mid = {
        x: (start.x + end.x) * 0.5,
        y: (start.y + end.y) * 0.5,
        z: (start.z + end.z) * 0.5
      };
      return _posInSmoke(mid, null);
    }
  };

  return {
    init:          init,
    update:        update,
    throwSmoke:    throwSmoke,
    getSmokeZones: getSmokeZones,
    reset:         reset
  };

})();
