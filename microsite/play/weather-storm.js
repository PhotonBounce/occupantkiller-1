/* ───────────────────────────────────────────────────────────────────────────
   WEATHER STORM — Extreme weather events for Three.js browser FPS game
   Storm types: THUNDERSTORM, BLIZZARD, SANDSTORM, FLOOD, FIRESTORM
   Keys: W+S to cycle storm type; Shift+W+S to trigger immediately.
   Storms normally cycle every 8 minutes; intensity builds 60s / peaks 120s /
   dissipates 60s.  Wind vector applied to projectiles each frame.
   ─────────────────────────────────────────────────────────────────────────── */
window.WeatherStorm = (function () {
  'use strict';

  /* ── Storm type constants ──────────────────────────────────────────────── */
  var STORM_NONE        = 'NONE';
  var STORM_THUNDERSTORM = 'THUNDERSTORM';
  var STORM_BLIZZARD    = 'BLIZZARD';
  var STORM_SANDSTORM   = 'SANDSTORM';
  var STORM_FLOOD       = 'FLOOD';
  var STORM_FIRESTORM   = 'FIRESTORM';

  var STORM_TYPES = [
    STORM_THUNDERSTORM,
    STORM_BLIZZARD,
    STORM_SANDSTORM,
    STORM_FLOOD,
    STORM_FIRESTORM
  ];

  /* ── Timing constants ──────────────────────────────────────────────────── */
  var AUTO_CYCLE_INTERVAL = 480;   // 8 minutes between auto storms
  var BUILD_DURATION      = 60;    // seconds to build to peak
  var PEAK_DURATION       = 120;   // seconds at full intensity
  var DISSIPATE_DURATION  = 60;    // seconds to clear
  var STORM_TOTAL         = BUILD_DURATION + PEAK_DURATION + DISSIPATE_DURATION;
  var WARNING_BEFORE_PEAK = 30;    // seconds before peak to show warning

  /* ── Module state ──────────────────────────────────────────────────────── */
  var _scene            = null;
  var _camera           = null;
  var _renderer         = null;
  var _playerRef        = null;
  var _projectilesRef   = null;
  var _inited           = false;

  var _selectedStormIdx = 0;       // index into STORM_TYPES
  var _activeStorm      = STORM_NONE;
  var _stormElapsed     = 0;       // seconds since storm started
  var _intensity        = 0;       // 0-100
  var _autoCycleTimer   = AUTO_CYCLE_INTERVAL; // countdown to next auto storm

  /* ── Wind vector (applied to projectiles) ──────────────────────────────── */
  var _windVector = { x: 0, y: 0, z: 0 };

  /* ── Particle systems ──────────────────────────────────────────────────── */
  var _rainParticles    = null;
  var _rainVelocities   = [];
  var _snowParticles    = null;
  var _snowVelocities   = [];
  var _sandParticles    = null;
  var _sandVelocities   = [];
  var _fireParticles    = null;
  var _fireVelocities   = [];

  /* ── Scene objects ─────────────────────────────────────────────────────── */
  var _lightningMesh    = null;
  var _lightningTimer   = 0;
  var _lightningInterval = 14;     // next lightning strike interval (8-20s)
  var _lightningFlash   = false;
  var _lightningFlashTimer = 0;

  var _floodPlane       = null;
  var _floodY           = -5;

  var _groundFires      = [];      // CylinderGeometry fire patches
  var _groundFirePositions = [];

  /* ── HUD elements ──────────────────────────────────────────────────────── */
  var _hudEl            = null;
  var _toastEl          = null;
  var _toastTimer       = 0;

  /* ── Key state ─────────────────────────────────────────────────────────── */
  var _keysDown         = {};
  var _wsPressedTime    = 0;
  var _wsComboActive    = false;

  /* ── Original scene fog ────────────────────────────────────────────────── */
  var _origFogNear      = 80;
  var _origFogFar       = 350;
  var _origFogColor     = 0xc8d0e0;
  var _origBgColor      = 0xc8d0e0;
  var _fogModified      = false;

  /* ── AudioContext for thunder ──────────────────────────────────────────── */
  var _audioCtx         = null;

  /* ═══════════════════════════════════════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════════════════════════════════════ */
  function init(options) {
    options = options || {};
    _scene          = options.scene          || (window.scene || null);
    _camera         = options.camera         || (window.camera || null);
    _renderer       = options.renderer       || (window.renderer || null);
    _playerRef      = options.player         || null;
    _projectilesRef = options.projectiles    || null;

    if (!_scene) {
      console.warn('[WeatherStorm] No scene provided — weather effects require a THREE.Scene.');
      return;
    }

    _storeOriginalFog();
    _buildHUD();
    _bindKeys();
    _inited = true;
    console.log('[WeatherStorm] Initialized. W+S cycles storm type; Shift+W+S triggers immediately.');
  }

  /* ─── Store original scene fog so we can restore it ─────────────────────── */
  function _storeOriginalFog() {
    if (_scene.fog) {
      _origFogNear  = _scene.fog.near  || 80;
      _origFogFar   = _scene.fog.far   || 350;
      _origFogColor = _scene.fog.color ? _scene.fog.color.getHex() : 0xc8d0e0;
    }
    if (_scene.background) {
      _origBgColor = _scene.background.getHex ? _scene.background.getHex() : 0xc8d0e0;
    }
  }

  /* ─── HUD ────────────────────────────────────────────────────────────────── */
  function _buildHUD() {
    _hudEl = document.getElementById('weather-storm-hud');
    if (!_hudEl) {
      _hudEl = document.createElement('div');
      _hudEl.id = 'weather-storm-hud';
      _hudEl.style.cssText = [
        'position:fixed',
        'top:10px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,0,0,0.55)',
        'color:#fff',
        'font-family:monospace',
        'font-size:13px',
        'padding:4px 10px',
        'border-radius:4px',
        'pointer-events:none',
        'display:none',
        'z-index:9000'
      ].join(';');
      document.body.appendChild(_hudEl);
    }

    _toastEl = document.getElementById('weather-storm-toast');
    if (!_toastEl) {
      _toastEl = document.createElement('div');
      _toastEl.id = 'weather-storm-toast';
      _toastEl.style.cssText = [
        'position:fixed',
        'top:60px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(200,100,0,0.85)',
        'color:#fff',
        'font-family:monospace',
        'font-size:15px',
        'font-weight:bold',
        'padding:6px 16px',
        'border-radius:6px',
        'pointer-events:none',
        'display:none',
        'z-index:9001'
      ].join(';');
      document.body.appendChild(_toastEl);
    }
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (_activeStorm === STORM_NONE) {
      _hudEl.style.display = 'none';
      return;
    }
    var timeLeft = Math.max(0, STORM_TOTAL - _stormElapsed);
    var mm = Math.floor(timeLeft / 60);
    var ss = Math.floor(timeLeft % 60);
    var mmStr = mm < 10 ? '0' + mm : '' + mm;
    var ssStr = ss < 10 ? '0' + ss : '' + ss;
    _hudEl.style.display = 'block';
    _hudEl.textContent = 'STORM: ' + _activeStorm +
      ' [INTENSITY: ' + Math.round(_intensity) + '%]' +
      ' [CLEARS: ' + mmStr + ':' + ssStr + ']';
  }

  function _showToast(msg, duration) {
    if (!_toastEl) return;
    _toastEl.textContent = msg;
    _toastEl.style.display = 'block';
    _toastTimer = duration || 4;
  }

  /* ─── Key bindings ───────────────────────────────────────────────────────── */
  function _bindKeys() {
    document.addEventListener('keydown', _onKeyDown, false);
    document.addEventListener('keyup',   _onKeyUp,   false);
  }

  function _onKeyDown(e) {
    _keysDown[e.code] = true;

    var wDown = _keysDown['KeyW'];
    var sDown = _keysDown['KeyS'];

    if (wDown && sDown) {
      if (!_wsComboActive) {
        _wsComboActive = true;
        _wsPressedTime = performance.now();
        if (e.shiftKey || _keysDown['ShiftLeft'] || _keysDown['ShiftRight']) {
          // Shift+W+S: trigger selected storm immediately
          _triggerStorm(STORM_TYPES[_selectedStormIdx]);
        } else {
          // W+S: cycle to next storm type
          _selectedStormIdx = (_selectedStormIdx + 1) % STORM_TYPES.length;
          _showToast('SELECTED: ' + STORM_TYPES[_selectedStormIdx], 2);
        }
      }
    }
  }

  function _onKeyUp(e) {
    _keysDown[e.code] = false;
    if (!_keysDown['KeyW'] || !_keysDown['KeyS']) {
      _wsComboActive = false;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     TRIGGER / END STORM
  ═══════════════════════════════════════════════════════════════════════════ */
  function _triggerStorm(type) {
    _clearCurrentStorm();
    _activeStorm  = type;
    _stormElapsed = 0;
    _intensity    = 0;
    _autoCycleTimer = AUTO_CYCLE_INTERVAL;
    _showToast('STORM INCOMING: ' + type, 5);
    _buildStormAssets(type);
  }

  function _clearCurrentStorm() {
    if (_activeStorm === STORM_NONE) return;

    _removeParticles(_rainParticles);  _rainParticles  = null; _rainVelocities  = [];
    _removeParticles(_snowParticles);  _snowParticles  = null; _snowVelocities  = [];
    _removeParticles(_sandParticles);  _sandParticles  = null; _sandVelocities  = [];
    _removeParticles(_fireParticles);  _fireParticles  = null; _fireVelocities  = [];

    if (_lightningMesh) { _scene.remove(_lightningMesh); _lightningMesh = null; }

    if (_floodPlane)    { _scene.remove(_floodPlane);    _floodPlane    = null; }
    _floodY = -5;

    for (var gi = 0; gi < _groundFires.length; gi++) {
      _scene.remove(_groundFires[gi]);
    }
    _groundFires         = [];
    _groundFirePositions = [];

    _restoreFog();
    _clearVisualEffects();
    _activeStorm = STORM_NONE;
    _intensity   = 0;
    _windVector  = { x: 0, y: 0, z: 0 };
    if (_hudEl) _hudEl.style.display = 'none';
  }

  function _removeParticles(mesh) {
    if (!mesh) return;
    _scene.remove(mesh);
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) mesh.material.dispose();
  }

  /* ─── Build storm assets ─────────────────────────────────────────────────── */
  function _buildStormAssets(type) {
    if (type === STORM_THUNDERSTORM) { _buildRain();      return; }
    if (type === STORM_BLIZZARD)     { _buildSnow();      return; }
    if (type === STORM_SANDSTORM)    { _buildSand();      return; }
    if (type === STORM_FLOOD)        { _buildFlood();     return; }
    if (type === STORM_FIRESTORM)    { _buildFirestorm(); return; }
  }

  /* ─── THUNDERSTORM: 800 rain particles ──────────────────────────────────── */
  function _buildRain() {
    var COUNT   = 800;
    var geo     = new THREE.BufferGeometry();
    var pos     = new Float32Array(COUNT * 3);
    var mat     = new THREE.MeshBasicMaterial({ color: 0x88AAFF });
    var tmpGeo  = new THREE.BoxGeometry(0.05, 0.3, 0.05);

    _rainVelocities = [];
    for (var i = 0; i < COUNT; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = Math.random() * 40 + 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      _rainVelocities.push(-15);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var instMesh = new THREE.InstancedMesh(tmpGeo, mat, COUNT);
    _setInstancePositions(instMesh, pos, COUNT);
    _scene.add(instMesh);
    _rainParticles = instMesh;
    _rainParticles._posArr = pos;

    // Schedule first lightning
    _lightningTimer    = _randBetween(8, 20);
    _lightningInterval = _randBetween(8, 20);
  }

  /* ─── BLIZZARD: 600 snow particles ──────────────────────────────────────── */
  function _buildSnow() {
    var COUNT   = 600;
    var tmpGeo  = new THREE.SphereGeometry(0.05, 4, 4);
    var mat     = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    var pos     = new Float32Array(COUNT * 3);

    _snowVelocities = [];
    for (var i = 0; i < COUNT; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = Math.random() * 40 + 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      _snowVelocities.push({
        y:  -(1.5 + Math.random() * 2),
        dx: (Math.random() - 0.5) * 1.5,
        dz: (Math.random() - 0.5) * 0.5
      });
    }
    var instMesh = new THREE.InstancedMesh(tmpGeo, mat, COUNT);
    _setInstancePositions(instMesh, pos, COUNT);
    _scene.add(instMesh);
    _snowParticles = instMesh;
    _snowParticles._posArr = pos;
  }

  /* ─── SANDSTORM: 400 sand particles ─────────────────────────────────────── */
  function _buildSand() {
    var COUNT   = 400;
    var tmpGeo  = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    var mat     = new THREE.MeshBasicMaterial({ color: 0xC2A05A });
    var pos     = new Float32Array(COUNT * 3);

    _sandVelocities = [];
    for (var i = 0; i < COUNT; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = Math.random() * 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      _sandVelocities.push({
        dx: 8 + Math.random() * 4,   // west->east blast
        dy: (Math.random() - 0.5) * 0.5,
        dz: (Math.random() - 0.5) * 1
      });
    }
    var instMesh = new THREE.InstancedMesh(tmpGeo, mat, COUNT);
    _setInstancePositions(instMesh, pos, COUNT);
    _scene.add(instMesh);
    _sandParticles = instMesh;
    _sandParticles._posArr = pos;
  }

  /* ─── FLOOD: rising water plane ─────────────────────────────────────────── */
  function _buildFlood() {
    var geo = new THREE.BoxGeometry(200, 0.5, 200);
    var mat = new THREE.MeshBasicMaterial({
      color:       0x2244AA,
      transparent: true,
      opacity:     0.6
    });
    _floodPlane = new THREE.Mesh(geo, mat);
    _floodY     = -5;
    _floodPlane.position.set(0, _floodY, 0);
    _scene.add(_floodPlane);
  }

  /* ─── FIRESTORM: fire particles + ground patches ─────────────────────────── */
  function _buildFirestorm() {
    var COUNT   = 300;
    var tmpGeo  = new THREE.SphereGeometry(0.12, 4, 4);
    var mat     = new THREE.MeshBasicMaterial({ color: 0xFF4400 });
    var pos     = new Float32Array(COUNT * 3);

    _fireVelocities = [];
    for (var i = 0; i < COUNT; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = Math.random() * 50 + 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      _fireVelocities.push({
        dy: -(3 + Math.random() * 4)
      });
    }
    var instMesh = new THREE.InstancedMesh(tmpGeo, mat, COUNT);
    _setInstancePositions(instMesh, pos, COUNT);
    _scene.add(instMesh);
    _fireParticles = instMesh;
    _fireParticles._posArr = pos;

    // 10 ground fire patches
    var patchGeo = new THREE.CylinderGeometry(2, 2.5, 0.3, 8);
    var patchMat = new THREE.MeshBasicMaterial({ color: 0xFF6600, transparent: true, opacity: 0.8 });
    for (var p = 0; p < 10; p++) {
      var patch = new THREE.Mesh(patchGeo, patchMat);
      var px    = (Math.random() - 0.5) * 60;
      var pz    = (Math.random() - 0.5) * 60;
      patch.position.set(px, 0.15, pz);
      _scene.add(patch);
      _groundFires.push(patch);
      _groundFirePositions.push({ x: px, z: pz, r: 2.5 });
    }
  }

  /* ─── Shared: set InstancedMesh positions from flat array ───────────────── */
  function _setInstancePositions(mesh, pos, count) {
    var dummy = new THREE.Object3D();
    for (var i = 0; i < count; i++) {
      dummy.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     UPDATE  (call every frame with delta in seconds)
  ═══════════════════════════════════════════════════════════════════════════ */
  function update(delta) {
    if (!_inited || !_scene) return;

    delta = delta || 0.016;

    // Auto-cycle countdown
    if (_activeStorm === STORM_NONE) {
      _autoCycleTimer -= delta;
      if (_autoCycleTimer <= 0) {
        _selectedStormIdx = (_selectedStormIdx + 1) % STORM_TYPES.length;
        _triggerStorm(STORM_TYPES[_selectedStormIdx]);
      }
    }

    if (_activeStorm === STORM_NONE) return;

    _stormElapsed += delta;

    // Compute intensity 0-100
    if (_stormElapsed < BUILD_DURATION) {
      _intensity = (_stormElapsed / BUILD_DURATION) * 100;
    } else if (_stormElapsed < BUILD_DURATION + PEAK_DURATION) {
      _intensity = 100;
    } else if (_stormElapsed < STORM_TOTAL) {
      var dissipateElapsed = _stormElapsed - BUILD_DURATION - PEAK_DURATION;
      _intensity = (1 - dissipateElapsed / DISSIPATE_DURATION) * 100;
    } else {
      // Storm over
      _clearCurrentStorm();
      _autoCycleTimer = AUTO_CYCLE_INTERVAL;
      return;
    }

    // Warning: 30s before peak
    var timeUntilPeak = BUILD_DURATION - _stormElapsed;
    if (timeUntilPeak > 0 && timeUntilPeak <= WARNING_BEFORE_PEAK && _stormElapsed < BUILD_DURATION) {
      if (!_warningSent) {
        _showToast('STORM INCOMING', 5);
        _warningSent = true;
      }
    }
    if (_stormElapsed <= 0.1) { _warningSent = false; }

    // Update wind vector
    _updateWind(delta);

    // Update by storm type
    if (_activeStorm === STORM_THUNDERSTORM) { _updateThunderstorm(delta); }
    if (_activeStorm === STORM_BLIZZARD)     { _updateBlizzard(delta);     }
    if (_activeStorm === STORM_SANDSTORM)    { _updateSandstorm(delta);    }
    if (_activeStorm === STORM_FLOOD)        { _updateFlood(delta);        }
    if (_activeStorm === STORM_FIRESTORM)    { _updateFirestorm(delta);    }

    // Apply wind to projectiles
    _applyWindToProjectiles(delta);

    // Toast countdown
    if (_toastTimer > 0) {
      _toastTimer -= delta;
      if (_toastTimer <= 0 && _toastEl) {
        _toastEl.style.display = 'none';
        _toastTimer = 0;
      }
    }

    // Lightning flash overlay
    if (_lightningFlash) {
      _lightningFlashTimer -= delta;
      if (_lightningFlashTimer <= 0) {
        _lightningFlash = false;
        _clearFlash();
      }
    }

    _updateHUD();
  }

  var _warningSent = false;

  /* ─── Wind update ────────────────────────────────────────────────────────── */
  function _updateWind(delta) {
    var t        = _intensity / 100;
    var baseWind = 0;

    if (_activeStorm === STORM_THUNDERSTORM) { baseWind = 3 * t;  _windVector = { x: baseWind, y: 0, z: baseWind * 0.3 }; }
    if (_activeStorm === STORM_BLIZZARD)     { baseWind = 5 * t;  _windVector = { x: baseWind, y: 0, z: baseWind * 0.4 }; }
    if (_activeStorm === STORM_SANDSTORM)    { baseWind = 8 * t;  _windVector = { x: baseWind, y: 0, z: 0 }; }
    if (_activeStorm === STORM_FLOOD)        { baseWind = 1 * t;  _windVector = { x: 0,        y: 0, z: 0 }; }
    if (_activeStorm === STORM_FIRESTORM)    { baseWind = 4 * t;  _windVector = { x: baseWind, y: 0, z: baseWind * 0.5 }; }

    // Expose globally for other modules
    window._stormWindVector = _windVector;
  }

  /* ─── Apply wind to projectiles ──────────────────────────────────────────── */
  function _applyWindToProjectiles(delta) {
    var projectiles = _projectilesRef || window._projectiles || null;
    if (!projectiles) return;
    for (var i = 0; i < projectiles.length; i++) {
      var p = projectiles[i];
      if (!p || !p.velocity) continue;
      p.velocity.x += _windVector.x * 0.15 * delta;
      p.velocity.y += _windVector.y * 0.15 * delta;
      p.velocity.z += _windVector.z * 0.15 * delta;
    }
  }

  /* ─── THUNDERSTORM update ─────────────────────────────────────────────────── */
  function _updateThunderstorm(delta) {
    var t = _intensity / 100;

    // Fog
    if (_scene.fog) {
      _scene.fog.far  = Math.max(20, _origFogFar  - 200 * t);
      _scene.fog.near = Math.max(5,  _origFogNear - 40 * t);
      _fogModified = true;
    }

    // Rain particles
    if (_rainParticles) {
      var pos   = _rainParticles._posArr;
      var COUNT = _rainVelocities.length;
      var dummy = new THREE.Object3D();
      for (var i = 0; i < COUNT; i++) {
        pos[i * 3 + 1] += _rainVelocities[i] * delta;
        // respawn below Y=-5
        if (pos[i * 3 + 1] < -5) {
          pos[i * 3]     = (Math.random() - 0.5) * 80;
          pos[i * 3 + 1] = Math.random() * 20 + 30;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
        }
        dummy.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
        dummy.updateMatrix();
        _rainParticles.setMatrixAt(i, dummy.matrix);
      }
      _rainParticles.instanceMatrix.needsUpdate = true;
    }

    // Lightning
    _lightningTimer -= delta;
    if (_lightningTimer <= 0) {
      _strikeLightning();
      _lightningTimer = _randBetween(8, 20);
    }
  }

  /* ─── Lightning strike ───────────────────────────────────────────────────── */
  function _strikeLightning() {
    // Remove old bolt
    if (_lightningMesh) {
      _scene.remove(_lightningMesh);
      _lightningMesh = null;
    }

    // Build jagged path Y=50 to Y=0
    var pts = [];
    var x   = (Math.random() - 0.5) * 60;
    var z   = (Math.random() - 0.5) * 60;
    var segs = 12;
    for (var i = 0; i <= segs; i++) {
      var y = 50 - (50 / segs) * i;
      var jx = i === 0 ? x : x + (Math.random() - 0.5) * 8;
      var jz = i === 0 ? z : z + (Math.random() - 0.5) * 8;
      pts.push(new THREE.Vector3(jx, y, jz));
    }
    var geo  = new THREE.BufferGeometry().setFromPoints(pts);
    var mat  = new THREE.LineBasicMaterial({ color: 0xFFFFFF, linewidth: 2 });
    _lightningMesh = new THREE.LineSegments(geo, mat);
    _scene.add(_lightningMesh);

    // Flash effect
    _lightningFlash      = true;
    _lightningFlashTimer = 0.12;
    _applyFlash();

    // 10% chance to strike near player
    var player = _playerRef || window._player || null;
    if (player && Math.random() < 0.1) {
      var px = player.position ? player.position.x : 0;
      var pz = player.position ? player.position.z : 0;
      var dx = pts[segs].x - px;
      var dz = pts[segs].z - pz;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 5) {
        // Deal 40 HP damage
        if (typeof player.takeDamage === 'function') {
          player.takeDamage(40);
        } else if (window._playerHP !== undefined) {
          window._playerHP = Math.max(0, window._playerHP - 40);
        }
      }
    }

    // Thunder 0.5s after flash
    setTimeout(function () { _playThunder(); }, 500);

    // Remove bolt after 0.2s
    setTimeout(function () {
      if (_lightningMesh) {
        _scene.remove(_lightningMesh);
        _lightningMesh = null;
      }
    }, 200);
  }

  /* ─── Camera white flash ─────────────────────────────────────────────────── */
  function _applyFlash() {
    var el = document.getElementById('ws-flash-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'ws-flash-overlay';
      el.style.cssText = [
        'position:fixed',
        'top:0',
        'left:0',
        'width:100%',
        'height:100%',
        'background:#fff',
        'pointer-events:none',
        'z-index:8999'
      ].join(';');
      document.body.appendChild(el);
    }
    el.style.opacity = '0.85';
  }

  function _clearFlash() {
    var el = document.getElementById('ws-flash-overlay');
    if (el) el.style.opacity = '0';
  }

  /* ─── Thunder sound via AudioContext ─────────────────────────────────────── */
  function _playThunder() {
    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      var ctx      = _audioCtx;
      var buf      = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      var data     = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.4));
      }
      var src      = ctx.createBufferSource();
      src.buffer   = buf;
      var gain     = ctx.createGain();
      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) {
      // AudioContext unavailable — silent fail
    }
  }

  /* ─── BLIZZARD update ────────────────────────────────────────────────────── */
  function _updateBlizzard(delta) {
    var t = _intensity / 100;

    // Fog: density doubles, visibility 15 units max
    if (_scene.fog) {
      _scene.fog.far  = Math.max(15, _origFogFar  - (_origFogFar  - 15) * t);
      _scene.fog.near = Math.max(2,  _origFogNear - (_origFogNear - 2)  * t);
      _fogModified = true;
    }

    // Player speed -25%
    _applySpeedMult(0.75, t);

    // Snow particles with wind drift
    if (_snowParticles) {
      var pos   = _snowParticles._posArr;
      var COUNT = _snowVelocities.length;
      var dummy = new THREE.Object3D();
      for (var i = 0; i < COUNT; i++) {
        var v  = _snowVelocities[i];
        pos[i * 3]     += (v.dx + _windVector.x) * delta;
        pos[i * 3 + 1] += v.y * delta;
        pos[i * 3 + 2] += (v.dz + _windVector.z) * delta;
        if (pos[i * 3 + 1] < -5) {
          pos[i * 3]     = (Math.random() - 0.5) * 80;
          pos[i * 3 + 1] = Math.random() * 20 + 25;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
        }
        dummy.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
        dummy.updateMatrix();
        _snowParticles.setMatrixAt(i, dummy.matrix);
      }
      _snowParticles.instanceMatrix.needsUpdate = true;
    }
  }

  /* ─── SANDSTORM update ───────────────────────────────────────────────────── */
  function _updateSandstorm(delta) {
    var t = _intensity / 100;

    // Fog orange tint
    if (_scene.fog) {
      _scene.fog.far  = Math.max(12, _origFogFar - (_origFogFar - 12) * t);
      _scene.fog.near = Math.max(2, _origFogNear - (_origFogNear - 2) * t);
      if (_scene.fog.color) _scene.fog.color.setHex(0xC8A060);
      _fogModified = true;
    }

    // HUD orange tint + CSS blur
    var canvas = _renderer ? _renderer.domElement : document.querySelector('canvas');
    if (canvas) {
      canvas.style.filter = 'sepia(' + (0.6 * t) + ')';
    }

    // Sand particles
    if (_sandParticles) {
      var pos   = _sandParticles._posArr;
      var COUNT = _sandVelocities.length;
      var dummy = new THREE.Object3D();
      for (var i = 0; i < COUNT; i++) {
        var v  = _sandVelocities[i];
        pos[i * 3]     += v.dx * delta * t;
        pos[i * 3 + 1] += v.dy * delta;
        pos[i * 3 + 2] += v.dz * delta;
        // Wrap east->west
        if (pos[i * 3] > 40) {
          pos[i * 3]     = -40;
          pos[i * 3 + 1] = Math.random() * 15;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
        }
        dummy.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
        dummy.updateMatrix();
        _sandParticles.setMatrixAt(i, dummy.matrix);
      }
      _sandParticles.instanceMatrix.needsUpdate = true;
    }
  }

  /* ─── FLOOD update ───────────────────────────────────────────────────────── */
  function _updateFlood(delta) {
    var t = _intensity / 100;

    // Water rises from Y=-5 to Y=1 over 60s
    var targetY = -5 + 6 * (_stormElapsed / BUILD_DURATION);
    if (_stormElapsed >= BUILD_DURATION) {
      // During peak + dissipate, keep at max then lower
      if (_stormElapsed < BUILD_DURATION + PEAK_DURATION) {
        targetY = 1;
      } else {
        var dissipFrac = (_stormElapsed - BUILD_DURATION - PEAK_DURATION) / DISSIPATE_DURATION;
        targetY = 1 - 6 * dissipFrac;
      }
    }
    _floodY = targetY;
    if (_floodPlane) {
      _floodPlane.position.y = _floodY;
    }

    // Player in water moves at 40% speed
    var player = _playerRef || window._player || null;
    if (player && player.position && player.position.y <= _floodY + 0.5) {
      _applySpeedMult(0.4, 1);
    } else {
      _applySpeedMult(1, 1);
    }
  }

  /* ─── FIRESTORM update ────────────────────────────────────────────────────── */
  function _updateFirestorm(delta) {
    var t = _intensity / 100;

    // Fire particles falling from above
    if (_fireParticles) {
      var pos   = _fireParticles._posArr;
      var COUNT = _fireVelocities.length;
      var dummy = new THREE.Object3D();
      for (var i = 0; i < COUNT; i++) {
        var v  = _fireVelocities[i];
        pos[i * 3]     += _windVector.x * delta * 0.3;
        pos[i * 3 + 1] += v.dy * delta;
        pos[i * 3 + 2] += _windVector.z * delta * 0.3;
        if (pos[i * 3 + 1] < -2) {
          pos[i * 3]     = (Math.random() - 0.5) * 80;
          pos[i * 3 + 1] = Math.random() * 30 + 20;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
        }
        dummy.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
        dummy.updateMatrix();
        _fireParticles.setMatrixAt(i, dummy.matrix);
      }
      _fireParticles.instanceMatrix.needsUpdate = true;
    }

    // Flicker ground fire patches
    for (var p = 0; p < _groundFires.length; p++) {
      _groundFires[p].scale.y = 0.8 + Math.sin(Date.now() * 0.01 + p) * 0.2;
    }

    // Player in fire patch: -8 HP/s
    var player = _playerRef || window._player || null;
    if (player && player.position) {
      var px = player.position.x;
      var pz = player.position.z;
      for (var fi = 0; fi < _groundFirePositions.length; fi++) {
        var fp = _groundFirePositions[fi];
        var dx = px - fp.x;
        var dz = pz - fp.z;
        if (Math.sqrt(dx * dx + dz * dz) < fp.r) {
          if (typeof player.takeDamage === 'function') {
            player.takeDamage(8 * delta);
          } else if (window._playerHP !== undefined) {
            window._playerHP = Math.max(0, window._playerHP - 8 * delta);
          }
          break;
        }
      }
    }
  }

  /* ─── Fog + visual restore ────────────────────────────────────────────────── */
  function _restoreFog() {
    if (!_fogModified) return;
    if (_scene.fog) {
      _scene.fog.near = _origFogNear;
      _scene.fog.far  = _origFogFar;
      if (_scene.fog.color) _scene.fog.color.setHex(_origFogColor);
    }
    if (_scene.background && _scene.background.setHex) {
      _scene.background.setHex(_origBgColor);
    }
    _fogModified = false;
  }

  function _clearVisualEffects() {
    // Remove canvas CSS filter
    var canvas = _renderer ? _renderer.domElement : document.querySelector('canvas');
    if (canvas) canvas.style.filter = '';
    // Clear flash
    _clearFlash();
    // Reset speed
    _applySpeedMult(1, 1);
  }

  /* ─── Speed multiplier helper ─────────────────────────────────────────────── */
  function _applySpeedMult(mult, weight) {
    // Expose globally; game's movement code should read window._stormSpeedMult
    window._stormSpeedMult = 1 + (mult - 1) * weight;
  }

  /* ─── Random helper ───────────────────────────────────────────────────────── */
  function _randBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     RESET
  ═══════════════════════════════════════════════════════════════════════════ */
  function reset() {
    _clearCurrentStorm();
    _selectedStormIdx = 0;
    _autoCycleTimer   = AUTO_CYCLE_INTERVAL;
    _warningSent      = false;
    _keysDown         = {};
    _wsComboActive    = false;
    if (_hudEl) _hudEl.style.display = 'none';
    if (_toastEl) _toastEl.style.display = 'none';
  }

  /* ─── Public API ──────────────────────────────────────────────────────────── */
  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
