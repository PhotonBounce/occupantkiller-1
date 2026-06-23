/* ════════════════════════════════════════════════════════════════════════════
 *  electromagnetic-pulse.js — EMP Weapons & Electronic Warfare Module
 *  ──────────────────────────────────────────────────────────────────────────
 *  Features:
 *   • EMP Grenade  (Ctrl+G) — cylindrical blue mesh, detonates on impact
 *   • Expanding electric-blue ring FX on detonation (torus + PointLight)
 *   • EMP effect range 20u — disables vehicles, drones, enemy weapons, HUD
 *   • EMP Rifle (hold Alt+F) — directed arc beam, 12u range, 45s cooldown
 *   • Faraday Kit crafting at WeaponWorkshop — blocks self-EMP effects
 *   • 3 power pylons on map — destroy all → 30s map-wide EMP
 *   • Pylon HP 200, fall animation, static field (2 HP/s within 5u)
 *   • HUD glitch CSS class applied on EMP hit
 *   • Audio: 4000Hz transient crack + 60Hz buzzing decay
 *   • Starts with 3 EMP grenades; replenished from enemy vehicles
 *
 *  Public API: window.ElectromagneticPulse
 *    init(scene, camera)   — call once after scene is ready
 *    update(delta)         — call every frame with delta-seconds
 *    throwEMPGrenade(pos)  — throw grenade from position (Vector3 optional)
 *    activateEMPRifle()    — fire directed EMP beam
 *    isEMPAffected(obj)    — returns true if obj is currently EMP-disabled
 *    reset()               — clear all state
 * ════════════════════════════════════════════════════════════════════════════ */

window.ElectromagneticPulse = (function () {
  'use strict';

  /* ── constants ─────────────────────────────────────────────────────────── */
  var EMP_GRENADE_START        = 3;
  var EMP_GRENADE_GRAVITY      = -9.8;
  var EMP_GRENADE_THROW_SPEED  = 14;
  var EMP_EFFECT_RANGE         = 20;
  var EMP_RING_DURATION        = 1.0;    // seconds for ring to expand
  var EMP_RING_MAX_RADIUS      = 22;
  var VEHICLE_DISABLE_DURATION = 15;
  var DRONE_DISABLE_DURATION   = 15;
  var WEAPON_JAM_DURATION      = 8;
  var HUD_GLITCH_DURATION      = 2;
  var SELF_EMP_RANGE           = 20;

  var RIFLE_RANGE              = 12;
  var RIFLE_COOLDOWN           = 45;
  var RIFLE_BEAM_DURATION      = 0.6;

  var PYLON_HP                 = 200;
  var PYLON_COUNT              = 3;
  var PYLON_STATIC_RANGE       = 5;
  var PYLON_STATIC_DAMAGE      = 2;     // HP/s
  var PYLON_FALL_DURATION      = 1.8;   // seconds for fall animation
  var MAP_WIDE_EMP_DURATION    = 30;

  var GLITCH_CSS_CLASS         = 'emp-hud-glitch';

  /* ── state ─────────────────────────────────────────────────────────────── */
  var _scene     = null;
  var _camera    = null;
  var _audioCtx  = null;

  var _grenadeCount    = EMP_GRENADE_START;
  var _activeGrenades  = [];   // {mesh, vel, age, bounced}
  var _activeRings     = [];   // {mesh, light, age, origin}
  var _affectedObjects = [];   // {obj, type, timer, origProps}
  var _rifleBeams      = [];   // {mesh, age}
  var _pylons          = [];   // {group, hp, falling, fallAge, fallAxis, dead}
  var _sparkParticles  = [];   // {mesh, age, origin}

  var _rifleMode       = false;
  var _rifleCooldown   = 0;
  var _rifleFiring     = false;

  var _mapEMPActive    = false;
  var _mapEMPTimer     = 0;

  var _hudGlitchTimer  = 0;
  var _hudGlitchActive = false;

  var _faradayKit      = false;   // crafted Faraday shield

  var _keyState        = {};
  var _ctrlG_prev      = false;
  var _altF_prev       = false;

  /* ── materials (reused) ────────────────────────────────────────────────── */
  var _grenadeMat = null;
  var _ringMat    = null;
  var _beamMat    = null;
  var _pylonMat   = null;
  var _sparkMat   = null;

  /* ─────────────────────────────────────────────────────────────────────────
   *  Audio
   * ───────────────────────────────────────────────────────────────────────── */
  function _getAudio() {
    if (!_audioCtx) {
      _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    }
    return _audioCtx;
  }

  function _playEMPSound() {
    try {
      var ctx = _getAudio();
      var sampleRate = ctx.sampleRate;
      var dur = 1.6;
      var buf = ctx.createBuffer(1, Math.floor(sampleRate * dur), sampleRate);
      var d   = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) {
        var t = i / sampleRate;
        // 4000Hz transient crack (first 0.05s)
        var crackEnv = Math.exp(-t / 0.02) * (t < 0.05 ? 1 : 0);
        var crack    = Math.sin(2 * Math.PI * 4000 * t) * crackEnv * 0.8;
        // 60Hz buzzing decay
        var buzzEnv  = Math.exp(-t / 0.6) * (t < 0.05 ? 0 : 1);
        var buzz     = Math.sin(2 * Math.PI * 60 * t) * buzzEnv * 0.5;
        // harmonic at 180Hz
        var buzz3    = Math.sin(2 * Math.PI * 180 * t) * buzzEnv * 0.2;
        // random noise transient
        var noise    = (Math.random() * 2 - 1) * Math.exp(-t / 0.03) * 0.3;
        d[i] = crack + buzz + buzz3 + noise;
      }
      var src  = ctx.createBufferSource();
      src.buffer = buf;
      var gain = ctx.createGain();
      gain.gain.value = 0.6;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) {
      // audio not critical
    }
  }

  function _playStaticSpark() {
    try {
      var ctx = _getAudio();
      var dur = 0.15;
      var buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      var d   = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) {
        var t = i / ctx.sampleRate;
        d[i] = (Math.random() * 2 - 1) * Math.exp(-t / 0.04) * 0.4;
      }
      var src  = ctx.createBufferSource();
      src.buffer = buf;
      var filt = ctx.createBiquadFilter();
      filt.type = 'highpass';
      filt.frequency.value = 3000;
      src.connect(filt);
      filt.connect(ctx.destination);
      src.start();
    } catch (e) { }
  }

  /* ─────────────────────────────────────────────────────────────────────────
   *  Materials
   * ───────────────────────────────────────────────────────────────────────── */
  function _ensureMaterials() {
    if (!_grenadeMat) {
      _grenadeMat = new THREE.MeshPhongMaterial({
        color:     0x0044FF,
        emissive:  0x002299,
        shininess: 80,
        transparent: true,
        opacity:   0.9
      });
    }
    if (!_ringMat) {
      _ringMat = new THREE.MeshBasicMaterial({
        color:       0x00AAFF,
        transparent: true,
        opacity:     0.75,
        wireframe:   true,
        side:        THREE.DoubleSide
      });
    }
    if (!_beamMat) {
      _beamMat = new THREE.LineBasicMaterial({
        color:       0x00FFFF,
        transparent: true,
        opacity:     0.9,
        linewidth:   2
      });
    }
    if (!_pylonMat) {
      _pylonMat = new THREE.MeshPhongMaterial({
        color:    0x334455,
        emissive: 0x001122
      });
    }
    if (!_sparkMat) {
      _sparkMat = new THREE.MeshBasicMaterial({
        color:       0x00CCFF,
        transparent: true,
        opacity:     0.85
      });
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
   *  Grenade mesh — cylindrical blue body
   * ───────────────────────────────────────────────────────────────────────── */
  function _createGrenadeMesh() {
    _ensureMaterials();
    var geo  = new THREE.CylinderGeometry(0.08, 0.08, 0.22, 8);
    var mesh = new THREE.Mesh(geo, _grenadeMat);
    // small emissive band ring
    var bandGeo = new THREE.TorusGeometry(0.1, 0.015, 6, 12);
    var bandMat = new THREE.MeshBasicMaterial({ color: 0x00FFFF });
    var band    = new THREE.Mesh(bandGeo, bandMat);
    band.rotation.x = Math.PI / 2;
    mesh.add(band);
    return mesh;
  }

  /* ─────────────────────────────────────────────────────────────────────────
   *  EMP Ring FX — expanding blue torus + PointLight
   * ───────────────────────────────────────────────────────────────────────── */
  function _spawnEMPRing(position) {
    _ensureMaterials();
    var mat  = _ringMat.clone();
    var geo  = new THREE.TorusGeometry(1, 0.18, 8, 32);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);
    mesh.rotation.x = Math.PI / 2;
    _scene.add(mesh);

    // secondary solid torus
    var mat2  = new THREE.MeshBasicMaterial({ color: 0x0066FF, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
    var geo2  = new THREE.TorusGeometry(1, 0.35, 6, 24);
    var mesh2 = new THREE.Mesh(geo2, mat2);
    mesh2.position.copy(position);
    mesh2.rotation.x = Math.PI / 2;
    _scene.add(mesh2);

    var light = new THREE.PointLight(0x0088FF, 18, 28);
    light.position.copy(position);
    _scene.add(light);

    _activeRings.push({
      mesh:  mesh,
      mesh2: mesh2,
      mat:   mat,
      mat2:  mat2,
      light: light,
      age:   0,
      origin: position.clone()
    });
  }

  /* ─────────────────────────────────────────────────────────────────────────
   *  Throw EMP Grenade
   * ───────────────────────────────────────────────────────────────────────── */
  function throwEMPGrenade(pos) {
    if (_grenadeCount <= 0) { return; }
    _grenadeCount--;
    _updateHUD();

    var startPos;
    if (pos) {
      startPos = pos.clone();
    } else if (_camera) {
      startPos = _camera.position.clone();
      startPos.y -= 0.2;
    } else {
      startPos = new THREE.Vector3(0, 1, 0);
    }

    var dir = new THREE.Vector3(0, 0, -1);
    if (_camera) {
      dir.set(0, 0, -1).applyQuaternion(_camera.quaternion);
    }
    dir.normalize();

    var mesh = _createGrenadeMesh();
    mesh.position.copy(startPos);
    _scene.add(mesh);

    _activeGrenades.push({
      mesh: mesh,
      vel:  new THREE.Vector3(
        dir.x * EMP_GRENADE_THROW_SPEED,
        dir.y * EMP_GRENADE_THROW_SPEED + 3,
        dir.z * EMP_GRENADE_THROW_SPEED
      ),
      age:      0,
      bounced:  0,
      detonate: false
    });

    _playEMPSound();
  }

  /* ─────────────────────────────────────────────────────────────────────────
   *  Detonate at position
   * ───────────────────────────────────────────────────────────────────────── */
  function _detonateAt(position) {
    _spawnEMPRing(position);
    _playEMPSound();
    _applyEMPEffect(position, EMP_EFFECT_RANGE);

    // check if player is within self-EMP range
    if (_camera && !_faradayKit) {
      var distToPlayer = position.distanceTo(_camera.position);
      if (distToPlayer <= SELF_EMP_RANGE) {
        _triggerHUDGlitch();
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
   *  Apply EMP Effect to world objects in range
   * ───────────────────────────────────────────────────────────────────────── */
  function _applyEMPEffect(origin, range) {
    // Vehicles (TankControls)
    _disableVehicle(window.TankControls, origin, range, VEHICLE_DISABLE_DURATION, 'vehicle');

    // Generic vehicles array
    if (window._worldVehicles && Array.isArray(window._worldVehicles)) {
      for (var vi = 0; vi < window._worldVehicles.length; vi++) {
        var veh = window._worldVehicles[vi];
        if (veh && veh.position && veh.position.distanceTo(origin) <= range) {
          _markDisabled(veh, 'vehicle', VEHICLE_DISABLE_DURATION);
        }
      }
    }

    // Drones (ReconDrone, companion-drone, etc.)
    var droneSystems = [window.ReconDrone, window.CompanionDrone, window.DroneSystem,
                        window.SpyDrone, window.FPVKamikaze, window.EnemyHackerDrone];
    for (var di = 0; di < droneSystems.length; di++) {
      _disableDrone(droneSystems[di], origin, range);
    }

    // Enemy squads / enemies
    if (window._enemies && Array.isArray(window._enemies)) {
      for (var ei = 0; ei < window._enemies.length; ei++) {
        var en = window._enemies[ei];
        if (en && en.mesh && en.mesh.position && en.mesh.position.distanceTo(origin) <= range) {
          _jamEnemyWeapon(en);
        }
      }
    }

    // Map-exposed enemy objects
    if (window._enemyObjects && Array.isArray(window._enemyObjects)) {
      for (var eoi = 0; eoi < window._enemyObjects.length; eoi++) {
        var eo = window._enemyObjects[eoi];
        if (eo && eo.position && eo.position.distanceTo(origin) <= range) {
          _jamEnemyWeapon(eo);
        }
      }
    }

    // If map-wide EMP (pylon destruction), disable tank-controls engine
    if (range > EMP_EFFECT_RANGE) {
      if (window.TankControls && typeof window.TankControls._empDisable === 'function') {
        window.TankControls._empDisable(MAP_WIDE_EMP_DURATION);
      }
      if (!_faradayKit) {
        _triggerHUDGlitch();
      }
    }
  }

  function _disableVehicle(sys, origin, range, duration, type) {
    if (!sys) { return; }
    // Check position via mesh reference
    var pos = null;
    if (sys._tank && sys._tank.group) { pos = sys._tank.group.position; }
    if (!pos && sys.position) { pos = sys.position; }
    if (pos && pos.distanceTo(origin) <= range) {
      _markDisabled(sys, type, duration);
      if (typeof sys._empDisable === 'function') { sys._empDisable(duration); }
    }
  }

  function _disableDrone(sys, origin, range) {
    if (!sys) { return; }
    var pos = null;
    if (sys._drone && sys._drone.position)   { pos = sys._drone.position; }
    if (!pos && sys._mesh && sys._mesh.position) { pos = sys._mesh.position; }
    if (!pos && sys.position) { pos = sys.position; }
    if (pos && pos.distanceTo(origin) <= range) {
      _markDisabled(sys, 'drone', DRONE_DISABLE_DURATION);
      if (typeof sys._empCrash === 'function') { sys._empCrash(); }
      // Apply falling via gravity flag
      if (sys._drone) { sys._drone._empFalling = true; sys._drone._empFallTimer = 0; }
    }
  }

  function _jamEnemyWeapon(en) {
    if (!en) { return; }
    _markDisabled(en, 'weapon', WEAPON_JAM_DURATION);
    en._weaponJammed     = true;
    en._weaponJamTimer   = WEAPON_JAM_DURATION;
    // Visual glitch — flickering opacity on mesh
    if (en.mesh) {
      _startFlickerEffect(en.mesh, WEAPON_JAM_DURATION);
    } else if (en.group) {
      _startFlickerEffect(en.group, WEAPON_JAM_DURATION);
    }
  }

  function _markDisabled(obj, type, duration) {
    // avoid duplicates
    for (var i = 0; i < _affectedObjects.length; i++) {
      if (_affectedObjects[i].obj === obj) {
        _affectedObjects[i].timer = Math.max(_affectedObjects[i].timer, duration);
        return;
      }
    }
    obj._electronicsDisabled = true;
    _affectedObjects.push({ obj: obj, type: type, timer: duration });
  }

  function _startFlickerEffect(mesh, duration) {
    if (!mesh) { return; }
    mesh._empFlicker = true;
    mesh._empFlickerTimer = duration;
    mesh._empFlickerAge   = 0;
    mesh.traverse(function (child) {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        child.material.transparent = true;
        child._empOrigOpacity = child.material.opacity !== undefined ? child.material.opacity : 1.0;
      }
    });
  }

  /* ─────────────────────────────────────────────────────────────────────────
   *  HUD Glitch
   * ───────────────────────────────────────────────────────────────────────── */
  function _triggerHUDGlitch() {
    _hudGlitchTimer  = HUD_GLITCH_DURATION;
    _hudGlitchActive = true;

    // Apply CSS glitch class to body and HUD elements
    document.body.classList.add(GLITCH_CSS_CLASS);

    var hudSelectors = ['.hud', '#hud', '.crosshair', '#minimap', '.ammo-counter',
                        '.health-bar', '.score-display', '[class*="hud"]'];
    for (var s = 0; s < hudSelectors.length; s++) {
      try {
        var els = document.querySelectorAll(hudSelectors[s]);
        for (var e = 0; e < els.length; e++) {
          els[e].classList.add(GLITCH_CSS_CLASS);
        }
      } catch (ex) { }
    }

    // Screen shake
    _triggerScreenShake(2.0);

    // Static noise overlay
    _showStaticOverlay(HUD_GLITCH_DURATION);

    _injectGlitchCSS();
  }

  function _clearHUDGlitch() {
    _hudGlitchActive = false;
    document.body.classList.remove(GLITCH_CSS_CLASS);
    var els = document.querySelectorAll('.' + GLITCH_CSS_CLASS);
    for (var i = 0; i < els.length; i++) {
      els[i].classList.remove(GLITCH_CSS_CLASS);
    }
    var overlay = document.getElementById('emp-static-overlay');
    if (overlay) { overlay.style.display = 'none'; }
  }

  function _injectGlitchCSS() {
    if (document.getElementById('emp-glitch-style')) { return; }
    var style = document.createElement('style');
    style.id = 'emp-glitch-style';
    style.textContent =
      '@keyframes emp-shimmer {' +
      '  0%   { opacity:1;   filter:brightness(1)   hue-rotate(0deg); }' +
      '  15%  { opacity:0.4; filter:brightness(2.5) hue-rotate(90deg); }' +
      '  30%  { opacity:0.9; filter:brightness(0.3) hue-rotate(180deg); }' +
      '  50%  { opacity:0.1; filter:brightness(3)   hue-rotate(270deg); }' +
      '  70%  { opacity:0.8; filter:brightness(0.5) hue-rotate(90deg); }' +
      '  85%  { opacity:0.3; filter:brightness(2)   hue-rotate(20deg); }' +
      '  100% { opacity:1;   filter:brightness(1)   hue-rotate(0deg); }' +
      '}' +
      '.' + GLITCH_CSS_CLASS + ' {' +
      '  animation: emp-shimmer 0.18s steps(1) infinite;' +
      '  pointer-events: none;' +
      '}';
    document.head.appendChild(style);
  }

  function _showStaticOverlay(duration) {
    var overlay = document.getElementById('emp-static-overlay');
    if (!overlay) {
      overlay = document.createElement('canvas');
      overlay.id = 'emp-static-overlay';
      overlay.style.cssText =
        'position:fixed;top:0;left:0;width:100%;height:100%;' +
        'pointer-events:none;z-index:9998;opacity:0.18;';
      document.body.appendChild(overlay);
    }
    overlay.width  = 320;
    overlay.height = 240;
    overlay.style.display = 'block';

    // Animate static noise frames
    var ctx  = overlay.getContext('2d');
    var end  = Date.now() + duration * 1000;

    function drawNoise() {
      if (Date.now() >= end) {
        overlay.style.display = 'none';
        return;
      }
      var img = ctx.createImageData(320, 240);
      for (var p = 0; p < img.data.length; p += 4) {
        var v = Math.random() > 0.5 ? 255 : 0;
        img.data[p]     = 0;
        img.data[p + 1] = Math.floor(v * 0.8);
        img.data[p + 2] = v;
        img.data[p + 3] = 200;
      }
      ctx.putImageData(img, 0, 0);
      requestAnimationFrame(drawNoise);
    }
    drawNoise();
  }

  function _triggerScreenShake(intensity) {
    if (!_camera) { return; }
    var startTime = Date.now();
    var dur       = 400; // ms
    var origPos   = _camera.position.clone();

    function shakeStep() {
      var elapsed = Date.now() - startTime;
      if (elapsed >= dur) {
        _camera.position.copy(origPos);
        return;
      }
      var t    = elapsed / dur;
      var mag  = intensity * (1 - t);
      _camera.position.x = origPos.x + (Math.random() - 0.5) * mag;
      _camera.position.y = origPos.y + (Math.random() - 0.5) * mag;
      requestAnimationFrame(shakeStep);
    }
    shakeStep();
  }

  /* ─────────────────────────────────────────────────────────────────────────
   *  EMP Rifle — directed arc beam (Alt+F)
   * ───────────────────────────────────────────────────────────────────────── */
  function activateEMPRifle() {
    if (_rifleCooldown > 0) { return; }
    if (!_camera || !_scene) { return; }

    _rifleCooldown = RIFLE_COOLDOWN;
    _rifleFiring   = true;

    _playEMPSound();

    var origin = _camera.position.clone();
    var dir    = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion).normalize();
    var target = origin.clone().addScaledVector(dir, RIFLE_RANGE);

    // Build arc beam — jagged line segments (spark effect)
    var pts = [];
    var steps = 18;
    for (var i = 0; i <= steps; i++) {
      var t   = i / steps;
      var pt  = origin.clone().lerp(target, t);
      if (i > 0 && i < steps) {
        pt.x += (Math.random() - 0.5) * 0.5;
        pt.y += (Math.random() - 0.5) * 0.5;
        pt.z += (Math.random() - 0.5) * 0.5;
      }
      pts.push(pt);
    }
    var geo  = new THREE.BufferGeometry().setFromPoints(pts);
    _ensureMaterials();
    var mat  = _beamMat.clone();
    var line = new THREE.Line(geo, mat);
    _scene.add(line);

    // Secondary arcs for spark effect
    var arcCount = 4;
    for (var ai = 0; ai < arcCount; ai++) {
      var arcPts = [];
      for (var aj = 0; aj <= steps; aj++) {
        var at  = aj / steps;
        var apt = origin.clone().lerp(target, at);
        apt.x += (Math.random() - 0.5) * 1.2;
        apt.y += (Math.random() - 0.5) * 1.2;
        apt.z += (Math.random() - 0.5) * 1.2;
        arcPts.push(apt);
      }
      var arcGeo  = new THREE.BufferGeometry().setFromPoints(arcPts);
      var arcMat  = new THREE.LineBasicMaterial({ color: 0x88EEFF, transparent: true, opacity: 0.5 });
      var arcLine = new THREE.Line(arcGeo, arcMat);
      _scene.add(arcLine);
      _rifleBeams.push({ mesh: arcLine, mat: arcMat, age: 0, maxAge: RIFLE_BEAM_DURATION });
    }

    var beamLight = new THREE.PointLight(0x00FFFF, 12, 15);
    beamLight.position.copy(origin.clone().addScaledVector(dir, RIFLE_RANGE * 0.5));
    _scene.add(beamLight);

    _rifleBeams.push({ mesh: line, mat: mat, light: beamLight, age: 0, maxAge: RIFLE_BEAM_DURATION });

    // Apply EMP to objects in beam path (within RIFLE_RANGE, narrow cone)
    _applyEMPRifleEffect(origin, dir);

    _rifleFiring = false;
  }

  function _applyEMPRifleEffect(origin, dir) {
    var target = origin.clone().addScaledVector(dir, RIFLE_RANGE);
    var coneAngle = 0.18; // ~10 degrees half-angle

    // Vehicles
    if (window._worldVehicles && Array.isArray(window._worldVehicles)) {
      for (var vi = 0; vi < window._worldVehicles.length; vi++) {
        var veh = window._worldVehicles[vi];
        if (veh && veh.position) {
          var toV = veh.position.clone().sub(origin);
          if (toV.length() <= RIFLE_RANGE) {
            var ang = toV.normalize().angleTo(dir);
            if (ang < coneAngle) {
              _markDisabled(veh, 'vehicle', VEHICLE_DISABLE_DURATION);
            }
          }
        }
      }
    }

    // Enemies
    if (window._enemies && Array.isArray(window._enemies)) {
      for (var ei = 0; ei < window._enemies.length; ei++) {
        var en = window._enemies[ei];
        if (en && en.mesh && en.mesh.position) {
          var toE = en.mesh.position.clone().sub(origin);
          if (toE.length() <= RIFLE_RANGE) {
            var angE = toE.normalize().angleTo(dir);
            if (angE < coneAngle) { _jamEnemyWeapon(en); }
          }
        }
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
   *  Power Pylons
   * ───────────────────────────────────────────────────────────────────────── */
  function _buildPylonMesh() {
    _ensureMaterials();
    var group = new THREE.Group();

    // Vertical pole
    var poleGeo = new THREE.CylinderGeometry(0.18, 0.22, 12, 8);
    var pole    = new THREE.Mesh(poleGeo, _pylonMat);
    pole.position.y = 6;
    group.add(pole);

    // Horizontal T-bar (crossarm)
    var armGeo = new THREE.CylinderGeometry(0.1, 0.1, 8, 6);
    var arm    = new THREE.Mesh(armGeo, _pylonMat);
    arm.rotation.z = Math.PI / 2;
    arm.position.y = 11.5;
    group.add(arm);

    // Crossarm end caps
    var capGeo = new THREE.BoxGeometry(0.3, 0.8, 0.3);
    for (var c = -1; c <= 1; c += 2) {
      var cap = new THREE.Mesh(capGeo, _pylonMat);
      cap.position.set(c * 3.8, 11.5, 0);
      group.add(cap);
    }

    // Insulators (small spheres)
    var insGeo = new THREE.SphereGeometry(0.22, 6, 6);
    var insMat = new THREE.MeshPhongMaterial({ color: 0x888866 });
    var insPositions = [[-3.8, 11.5, 0], [3.8, 11.5, 0], [0, 11.5, 0]];
    for (var ip = 0; ip < insPositions.length; ip++) {
      var ins = new THREE.Mesh(insGeo, insMat);
      ins.position.set(insPositions[ip][0], insPositions[ip][1], insPositions[ip][2]);
      group.add(ins);
    }

    // Warning light (emissive red sphere)
    var warnGeo = new THREE.SphereGeometry(0.18, 6, 6);
    var warnMat = new THREE.MeshBasicMaterial({ color: 0xFF3300 });
    var warnLight = new THREE.Mesh(warnGeo, warnMat);
    warnLight.position.y = 12.2;
    group.add(warnLight);

    // Point light (subtle blue glow)
    var pylonLight = new THREE.PointLight(0x0044FF, 3, 10);
    pylonLight.position.y = 6;
    group.add(pylonLight);

    return group;
  }

  function _spawnPylons() {
    var positions = [
      new THREE.Vector3(-45, 0, -30),
      new THREE.Vector3(50,  0,  20),
      new THREE.Vector3(10,  0, -60)
    ];

    for (var i = 0; i < PYLON_COUNT; i++) {
      var group = _buildPylonMesh();
      group.position.copy(positions[i]);
      _scene.add(group);

      _pylons.push({
        group:     group,
        hp:        PYLON_HP,
        falling:   false,
        fallAge:   0,
        fallAxis:  new THREE.Vector3(Math.random() > 0.5 ? 1 : -1, 0, (Math.random() - 0.5) * 0.5).normalize(),
        dead:      false,
        position:  positions[i].clone()
      });
    }
  }

  function _damagePylon(pylon, amount) {
    if (pylon.dead || pylon.falling) { return; }
    pylon.hp -= amount;
    if (pylon.hp <= 0) {
      pylon.hp      = 0;
      pylon.falling = true;
      pylon.fallAge = 0;
      _playEMPSound();
      _checkAllPylonsDestroyed();
    }
  }

  function _checkAllPylonsDestroyed() {
    var allDown = true;
    for (var i = 0; i < _pylons.length; i++) {
      if (!_pylons[i].dead && !_pylons[i].falling) {
        allDown = false;
        break;
      }
    }
    if (allDown) {
      _triggerMapWideEMP();
    }
  }

  function _triggerMapWideEMP() {
    _mapEMPActive = true;
    _mapEMPTimer  = MAP_WIDE_EMP_DURATION;

    // Apply to everything
    _applyEMPEffect(new THREE.Vector3(0, 0, 0), 999);

    // Spawn ring from center of map
    _spawnEMPRing(new THREE.Vector3(0, 2, 0));

    if (window._score !== undefined) {
      window._score = (window._score || 0) + 500;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
   *  Spark effect near pylons
   * ───────────────────────────────────────────────────────────────────────── */
  function _spawnSpark(origin) {
    _ensureMaterials();
    var geo  = new THREE.SphereGeometry(0.06, 4, 4);
    var mesh = new THREE.Mesh(geo, _sparkMat.clone());
    var offset = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      Math.random() * 5 + 1,
      (Math.random() - 0.5) * 2
    );
    mesh.position.copy(origin).add(offset);
    _scene.add(mesh);
    _sparkParticles.push({ mesh: mesh, age: 0, maxAge: 0.25 + Math.random() * 0.2 });
  }

  /* ─────────────────────────────────────────────────────────────────────────
   *  Faraday Kit (crafted at WeaponWorkshop)
   * ───────────────────────────────────────────────────────────────────────── */
  function _registerFaradayKit() {
    if (!window.WeaponWorkshop || typeof window.WeaponWorkshop.registerCraft !== 'function') {
      return;
    }
    window.WeaponWorkshop.registerCraft({
      id:      'FARADAY_KIT',
      label:   'Faraday Kit',
      desc:    'Blocks self-EMP effects (EMP shielding)',
      cost:    150,
      rareParts: 1,
      apply:   function () {
        _faradayKit = true;
        _showFaradayNotice();
      }
    });
  }

  function _showFaradayNotice() {
    var el = document.createElement('div');
    el.textContent = 'FARADAY KIT ACTIVE — EMP Shielded';
    el.style.cssText =
      'position:fixed;bottom:120px;left:50%;transform:translateX(-50%);' +
      'color:#00FFCC;font-family:monospace;font-size:14px;font-weight:bold;' +
      'background:rgba(0,0,0,0.7);padding:6px 14px;border:1px solid #00FFCC;' +
      'z-index:9990;letter-spacing:2px;pointer-events:none;';
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) { el.parentNode.removeChild(el); }
    }, 3500);
  }

  /* ─────────────────────────────────────────────────────────────────────────
   *  HUD display
   * ───────────────────────────────────────────────────────────────────────── */
  function _updateHUD() {
    var el = document.getElementById('emp-grenade-hud');
    if (!el) {
      el = document.createElement('div');
      el.id = 'emp-grenade-hud';
      el.style.cssText =
        'position:fixed;bottom:80px;right:16px;color:#00AAFF;' +
        'font-family:monospace;font-size:13px;font-weight:bold;' +
        'background:rgba(0,0,20,0.65);padding:5px 10px;' +
        'border:1px solid #0044FF;z-index:9985;letter-spacing:1px;' +
        'pointer-events:none;text-shadow:0 0 6px #00AAFF;';
      document.body.appendChild(el);
    }
    var rifleStatus = _rifleCooldown > 0 ? ('EMP RIFLE: ' + Math.ceil(_rifleCooldown) + 's') : 'EMP RIFLE: READY';
    el.innerHTML =
      'EMP GRENADES: ' + _grenadeCount + '<br>' +
      rifleStatus + (_mapEMPActive ? '<br><span style="color:#FF4400">MAP EMP: ' + Math.ceil(_mapEMPTimer) + 's</span>' : '');
  }

  /* ─────────────────────────────────────────────────────────────────────────
   *  Public: isEMPAffected
   * ───────────────────────────────────────────────────────────────────────── */
  function isEMPAffected(obj) {
    if (!obj) { return false; }
    for (var i = 0; i < _affectedObjects.length; i++) {
      if (_affectedObjects[i].obj === obj && _affectedObjects[i].timer > 0) {
        return true;
      }
    }
    return false;
  }

  /* ─────────────────────────────────────────────────────────────────────────
   *  Keyboard bindings
   * ───────────────────────────────────────────────────────────────────────── */
  function _bindKeys() {
    document.addEventListener('keydown', function (e) {
      _keyState[e.code] = true;
      _keyState[e.key]  = true;
    });
    document.addEventListener('keyup', function (e) {
      _keyState[e.code] = false;
      _keyState[e.key]  = false;
    });
  }

  function _isCtrlG() {
    return (_keyState['ControlLeft'] || _keyState['ControlRight'] || _keyState['Control']) &&
           (_keyState['KeyG'] || _keyState['g'] || _keyState['G']);
  }

  function _isAltF() {
    return (_keyState['AltLeft'] || _keyState['AltRight'] || _keyState['Alt']) &&
           (_keyState['KeyF'] || _keyState['f'] || _keyState['F']);
  }

  /* ─────────────────────────────────────────────────────────────────────────
   *  Update — called every frame
   * ───────────────────────────────────────────────────────────────────────── */
  function update(delta) {
    if (!_scene) { return; }
    if (!delta || delta <= 0) { delta = 0.016; }

    // Key handling
    var ctrlGNow = _isCtrlG();
    if (ctrlGNow && !_ctrlG_prev) {
      throwEMPGrenade();
    }
    _ctrlG_prev = ctrlGNow;

    var altFNow = _isAltF();
    if (altFNow && !_altF_prev) {
      activateEMPRifle();
    }
    _altF_prev = altFNow;

    // Rifle cooldown
    if (_rifleCooldown > 0) {
      _rifleCooldown -= delta;
      if (_rifleCooldown < 0) { _rifleCooldown = 0; }
    }

    // Active grenades (in-flight physics)
    for (var gi = _activeGrenades.length - 1; gi >= 0; gi--) {
      var gren = _activeGrenades[gi];
      gren.age += delta;

      gren.vel.y += EMP_GRENADE_GRAVITY * delta;
      gren.mesh.position.addScaledVector(gren.vel, delta);
      gren.mesh.rotation.x += delta * 4;
      gren.mesh.rotation.z += delta * 2.5;

      // Ground collision
      if (gren.mesh.position.y <= 0.1) {
        gren.mesh.position.y = 0.1;
        if (gren.bounced < 1) {
          gren.vel.y = Math.abs(gren.vel.y) * 0.35;
          gren.vel.x *= 0.7;
          gren.vel.z *= 0.7;
          gren.bounced++;
        } else {
          // Detonate
          _detonateAt(gren.mesh.position.clone());
          _scene.remove(gren.mesh);
          _activeGrenades.splice(gi, 1);
          continue;
        }
      }

      // Time-based detonate after 3.5s if no ground hit
      if (gren.age > 3.5) {
        _detonateAt(gren.mesh.position.clone());
        _scene.remove(gren.mesh);
        _activeGrenades.splice(gi, 1);
      }
    }

    // Active rings (expanding torus FX)
    for (var ri = _activeRings.length - 1; ri >= 0; ri--) {
      var ring = _activeRings[ri];
      ring.age += delta;
      var t = ring.age / EMP_RING_DURATION;

      if (t >= 1) {
        _scene.remove(ring.mesh);
        _scene.remove(ring.mesh2);
        _scene.remove(ring.light);
        _activeRings.splice(ri, 1);
        continue;
      }

      var radius = t * EMP_RING_MAX_RADIUS;
      ring.mesh.scale.setScalar(radius);
      ring.mesh2.scale.setScalar(radius * 0.85);

      // Fade out
      ring.mat.opacity  = 0.75 * (1 - t);
      ring.mat2.opacity = 0.35 * (1 - t);

      // Light flicker and decay
      ring.light.intensity = 18 * (1 - t) * (0.7 + 0.3 * Math.sin(ring.age * 30));
    }

    // Rifle beams (fade out)
    for (var bi = _rifleBeams.length - 1; bi >= 0; bi--) {
      var beam = _rifleBeams[bi];
      beam.age += delta;
      var bt = beam.age / beam.maxAge;
      if (bt >= 1) {
        _scene.remove(beam.mesh);
        if (beam.light) { _scene.remove(beam.light); }
        _rifleBeams.splice(bi, 1);
        continue;
      }
      beam.mat.opacity = (1 - bt) * (beam.mat === _beamMat ? 0.9 : 0.5);
      if (beam.light) { beam.light.intensity = 12 * (1 - bt); }
    }

    // Affected objects — tick down timers, restore on expiry
    for (var oi = _affectedObjects.length - 1; oi >= 0; oi--) {
      var rec = _affectedObjects[oi];
      rec.timer -= delta;

      // Update flicker on affected meshes
      var affMesh = rec.obj.mesh || rec.obj.group || null;
      if (affMesh && affMesh._empFlicker) {
        affMesh._empFlickerTimer -= delta;
        affMesh._empFlickerAge   += delta;
        if (affMesh._empFlickerTimer <= 0) {
          affMesh._empFlicker = false;
          affMesh.traverse(function (child) {
            if (child.isMesh && child.material && child._empOrigOpacity !== undefined) {
              child.material.opacity = child._empOrigOpacity;
            }
          });
        } else {
          var flick = Math.sin(affMesh._empFlickerAge * 22) * 0.5 + 0.5;
          affMesh.traverse(function (child) {
            if (child.isMesh && child.material && child._empOrigOpacity !== undefined) {
              child.material.opacity = flick * child._empOrigOpacity;
            }
          });
        }
      }

      if (rec.timer <= 0) {
        rec.obj._electronicsDisabled = false;
        if (rec.obj._weaponJammed !== undefined) { rec.obj._weaponJammed = false; }
        _affectedObjects.splice(oi, 1);
      }
    }

    // Pylon updates
    var sparksThisFrame = 0;
    for (var pi = 0; pi < _pylons.length; pi++) {
      var pylon = _pylons[pi];
      if (pylon.dead) { continue; }

      if (pylon.falling) {
        pylon.fallAge += delta;
        var ft = pylon.fallAge / PYLON_FALL_DURATION;
        if (ft >= 1) {
          ft = 1;
          pylon.dead = true;
          pylon.group.rotation.setFromVector3(
            new THREE.Vector3(pylon.fallAxis.z * Math.PI / 2, 0, -pylon.fallAxis.x * Math.PI / 2)
          );
          // Spawn final EMP ring
          _spawnEMPRing(pylon.group.position.clone());
          continue;
        }
        // Pivot: rotate around base along fallAxis
        var angle = ft * ft * (Math.PI / 2);
        pylon.group.rotation.z = pylon.fallAxis.x * angle;
        pylon.group.rotation.x = pylon.fallAxis.z * angle;
      }

      // Static field — player within range takes damage
      if (_camera && !pylon.falling) {
        var distPylon = pylon.group.position.distanceTo(_camera.position);
        if (distPylon <= PYLON_STATIC_RANGE) {
          // damage player at 2 HP/s
          if (window._playerHP !== undefined) {
            window._playerHP -= PYLON_STATIC_DAMAGE * delta;
            if (window._playerHP < 0) { window._playerHP = 0; }
          }
          if (window.player && window.player.hp !== undefined) {
            window.player.hp -= PYLON_STATIC_DAMAGE * delta;
          }
          // Spark effect every ~0.15s
          if (sparksThisFrame < 3 && Math.random() < delta * 8) {
            _spawnSpark(pylon.group.position);
            _playStaticSpark();
            sparksThisFrame++;
          }
        }
      }

      // Allow bullets/explosions to damage pylon via global hit system
      if (window._pylonDamageQueue && Array.isArray(window._pylonDamageQueue)) {
        for (var dqi = window._pylonDamageQueue.length - 1; dqi >= 0; dqi--) {
          var dmg = window._pylonDamageQueue[dqi];
          if (dmg.target === pylon.group || dmg.target === pi) {
            _damagePylon(pylon, dmg.amount || 10);
            window._pylonDamageQueue.splice(dqi, 1);
          }
        }
      }
    }

    // Spark particles
    for (var si = _sparkParticles.length - 1; si >= 0; si--) {
      var sp = _sparkParticles[si];
      sp.age += delta;
      if (sp.age >= sp.maxAge) {
        _scene.remove(sp.mesh);
        _sparkParticles.splice(si, 1);
        continue;
      }
      var st = sp.age / sp.maxAge;
      sp.mesh.material.opacity = (1 - st) * 0.85;
      sp.mesh.position.y += delta * 2.5;
      sp.mesh.position.x += (Math.random() - 0.5) * 0.08;
    }

    // Map-wide EMP timer
    if (_mapEMPActive) {
      _mapEMPTimer -= delta;
      if (_mapEMPTimer <= 0) {
        _mapEMPActive = false;
        _mapEMPTimer  = 0;
      }
    }

    // HUD glitch timer
    if (_hudGlitchActive) {
      _hudGlitchTimer -= delta;
      if (_hudGlitchTimer <= 0) {
        _clearHUDGlitch();
      }
    }

    // HUD refresh
    _updateHUD();
  }

  /* ─────────────────────────────────────────────────────────────────────────
   *  Init
   * ───────────────────────────────────────────────────────────────────────── */
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    _ensureMaterials();
    _bindKeys();
    _spawnPylons();
    _registerFaradayKit();
    _updateHUD();

    // Register pylon damage queue global
    if (!window._pylonDamageQueue) {
      window._pylonDamageQueue = [];
    }

    // Expose pylon references for other modules
    window._empPylons = _pylons;
  }

  /* ─────────────────────────────────────────────────────────────────────────
   *  Reset
   * ───────────────────────────────────────────────────────────────────────── */
  function reset() {
    // Remove active grenade meshes
    for (var gi = 0; gi < _activeGrenades.length; gi++) {
      if (_scene) { _scene.remove(_activeGrenades[gi].mesh); }
    }
    _activeGrenades = [];

    // Remove rings
    for (var ri = 0; ri < _activeRings.length; ri++) {
      if (_scene) {
        _scene.remove(_activeRings[ri].mesh);
        _scene.remove(_activeRings[ri].mesh2);
        _scene.remove(_activeRings[ri].light);
      }
    }
    _activeRings = [];

    // Remove rifle beams
    for (var bi = 0; bi < _rifleBeams.length; bi++) {
      if (_scene) {
        _scene.remove(_rifleBeams[bi].mesh);
        if (_rifleBeams[bi].light) { _scene.remove(_rifleBeams[bi].light); }
      }
    }
    _rifleBeams = [];

    // Remove sparks
    for (var si = 0; si < _sparkParticles.length; si++) {
      if (_scene) { _scene.remove(_sparkParticles[si].mesh); }
    }
    _sparkParticles = [];

    // Remove pylons
    for (var pi = 0; pi < _pylons.length; pi++) {
      if (_scene) { _scene.remove(_pylons[pi].group); }
    }
    _pylons = [];

    // Reset state
    _affectedObjects = [];
    _grenadeCount    = EMP_GRENADE_START;
    _rifleCooldown   = 0;
    _rifleFiring     = false;
    _mapEMPActive    = false;
    _mapEMPTimer     = 0;
    _faradayKit      = false;
    _hudGlitchActive = false;
    _hudGlitchTimer  = 0;
    _ctrlG_prev      = false;
    _altF_prev       = false;

    _clearHUDGlitch();

    var hudEl = document.getElementById('emp-grenade-hud');
    if (hudEl && hudEl.parentNode) { hudEl.parentNode.removeChild(hudEl); }

    window._empPylons = [];

    // If pylons present, re-spawn
    if (_scene && _camera) {
      _spawnPylons();
      _updateHUD();
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
   *  Public API
   * ───────────────────────────────────────────────────────────────────────── */
  return {
    init:             init,
    update:           update,
    throwEMPGrenade:  throwEMPGrenade,
    activateEMPRifle: activateEMPRifle,
    isEMPAffected:    isEMPAffected,
    reset:            reset
  };

}());
