// ============================================================
//  anti-air.js — MANPADS & Anti-Aircraft Weapons System
//
//  Controls:
//    P     = equip/unequip MANPAD launcher
//    Aim   = lock-on tone rises 400→1200Hz over 2s when airborne target in crosshair
//    LMB   = fire missile (when locked on)
//
//  Features:
//    - MANPAD shoulder-launched missile with lock-on tone (Web Audio)
//    - Homing missile with smoke trail
//    - Proximity fuse (2 units) with 12-unit blast radius
//    - Enemy AA emplacements (Shilka-style quad-barrel autocannon, HP 250)
//    - AA suppression: double damage to AirSupport/HelicopterGunship while AA active
//    - Tracer fire from AA emplacements
//    - Anti-drone capability
//    - Shoulder-launch recoil (8° camera kick, 0.3s recovery)
//    - Reload: 3s between shots, 4 missiles total
//    - HUD: lock strength bar, missile count, AA status
//
//  Public API: { init(scene, camera), update(delta), equipMANPAD(),
//                lockOn(target), fire(), reset() }
// ============================================================
window.AntiAir = (function () {
  'use strict';

  // ── State ────────────────────────────────────────────────────────────────────
  var _scene  = null;
  var _camera = null;
  var _bound  = false;

  // MANPAD state
  var _manpadEquipped   = false;
  var _manpadMesh       = null;   // launcher mesh attached to camera
  var _missileCount     = 4;
  var _reloadTimer      = 0;
  var RELOAD_TIME       = 3.0;
  var _reloading        = false;

  // Lock-on state
  var _lockTarget       = null;   // THREE.Object3D target
  var _lockStrength     = 0;      // 0..1
  var LOCK_TIME         = 2.0;    // seconds to full lock
  var _locked           = false;

  // Audio (lock-on tone)
  var _audioCtx         = null;
  var _lockOsc          = null;
  var _lockGain         = null;
  var FREQ_MIN          = 400;
  var FREQ_MAX          = 1200;

  // Missiles in flight
  var _missiles         = [];
  // Each missile: { group, target, smokeTrail, smokeParticles, life, maxLife }

  // Recoil
  var _recoilAngle      = 0;      // current kick in radians
  var RECOIL_MAX        = 8 * Math.PI / 180;   // 8 degrees
  var RECOIL_RECOVER    = 0.3;    // seconds to recover

  // Enemy AA emplacements
  var _aaEmplacements   = [];
  // Each emplacement: { group, barrels, hp, maxHp, fireTimer, tracers, pos, destroyed, suppressed }
  var AA_HP             = 250;
  var AA_FIRE_RATE      = 5;     // rounds/sec
  var AA_DAMAGE         = 15;
  var AA_RANGE          = 30;

  // Tracer projectiles
  var _tracers          = [];
  // Each tracer: { mesh, light, vx, vy, vz, life, maxLife, damage, target }

  // HUD
  var _hudEl            = null;

  // Raycaster for lock-on detection
  var _raycaster        = null;

  // Airborne targets list (populated by searching scene)
  var _airborneTargets  = [];
  var _targetScanTimer  = 0;
  var TARGET_SCAN_INTERVAL = 0.5;

  // Explosion pool
  var _explosions       = [];

  // Materials
  var _matOlive         = null;
  var _matDark          = null;
  var _matBlack         = null;
  var _matGray          = null;
  var _matWhite         = null;
  var _matOrange        = null;
  var _matRed           = null;
  var _matBarrel        = null;
  var _matMissile       = null;
  var _matSmoke         = null;

  // Input
  var _keys             = {};
  var _mouseDown        = false;

  // ── Material init ────────────────────────────────────────────────────────────
  function _initMats() {
    if (_matOlive) return;
    _matOlive   = new THREE.MeshLambertMaterial({ color: 0x556b2f });
    _matDark    = new THREE.MeshLambertMaterial({ color: 0x2a3a1a });
    _matBlack   = new THREE.MeshLambertMaterial({ color: 0x111111 });
    _matGray    = new THREE.MeshLambertMaterial({ color: 0x888888 });
    _matWhite   = new THREE.MeshLambertMaterial({ color: 0xffffff });
    _matOrange  = new THREE.MeshLambertMaterial({ color: 0xff6600 });
    _matRed     = new THREE.MeshLambertMaterial({ color: 0xff1111 });
    _matBarrel  = new THREE.MeshLambertMaterial({ color: 0x333333 });
    _matMissile = new THREE.MeshLambertMaterial({ color: 0x8899aa });
    _matSmoke   = new THREE.MeshLambertMaterial({ color: 0xdddddd, transparent: true, opacity: 0.55 });
  }

  // ── Audio ────────────────────────────────────────────────────────────────────
  function _getAudioCtx() {
    if (!_audioCtx) {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return _audioCtx;
  }

  function _startLockTone() {
    try {
      var ctx = _getAudioCtx();
      if (_lockOsc) { _stopLockTone(); }
      _lockGain = ctx.createGain();
      _lockGain.gain.setValueAtTime(0.18, ctx.currentTime);
      _lockGain.connect(ctx.destination);

      _lockOsc = ctx.createOscillator();
      _lockOsc.type = 'sine';
      _lockOsc.frequency.setValueAtTime(FREQ_MIN, ctx.currentTime);
      _lockOsc.connect(_lockGain);
      _lockOsc.start();
    } catch (e) { /* silent */ }
  }

  function _updateLockTone(strength) {
    if (!_lockOsc) return;
    try {
      var ctx = _getAudioCtx();
      var freq = FREQ_MIN + (FREQ_MAX - FREQ_MIN) * strength;
      _lockOsc.frequency.setValueAtTime(freq, ctx.currentTime);
      // When fully locked, make tone pulse slightly for "solid lock" feel
      if (strength >= 1.0) {
        _lockGain.gain.setValueAtTime(0.22, ctx.currentTime);
      }
    } catch (e) { /* silent */ }
  }

  function _stopLockTone() {
    try {
      if (_lockOsc) { _lockOsc.stop(); _lockOsc.disconnect(); _lockOsc = null; }
      if (_lockGain) { _lockGain.disconnect(); _lockGain = null; }
    } catch (e) { /* silent */ }
  }

  function _playFireSound() {
    try {
      var ctx = _getAudioCtx();
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      gain.connect(ctx.destination);
      var osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
      osc.connect(gain);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) { /* silent */ }
  }

  function _playExplosionSound(vol) {
    try {
      var ctx = _getAudioCtx();
      var v = vol || 0.5;
      var buf = ctx.createBuffer(1, ctx.sampleRate * 0.8, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.5);
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(v, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) { /* silent */ }
  }

  // ── MANPAD Launcher Mesh ─────────────────────────────────────────────────────
  function _buildMANPAD() {
    _initMats();
    var g = new THREE.Group();

    // Tube body
    var tube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.07, 1.1, 10),
      _matOlive
    );
    tube.rotation.z = Math.PI / 2;
    g.add(tube);

    // Grip
    var grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.18, 0.06),
      _matDark
    );
    grip.position.set(0.1, -0.12, 0);
    g.add(grip);

    // Trigger guard
    var guard = new THREE.Mesh(
      new THREE.TorusGeometry(0.045, 0.008, 6, 12, Math.PI),
      _matBlack
    );
    guard.position.set(0.1, -0.14, 0);
    guard.rotation.x = Math.PI / 2;
    g.add(guard);

    // IFF antenna (small rod on top)
    var ant = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.22, 6),
      _matBlack
    );
    ant.position.set(-0.15, 0.1, 0);
    g.add(ant);

    // Sight assembly
    var sight = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.08, 0.06),
      _matBlack
    );
    sight.position.set(0, 0.1, 0);
    g.add(sight);

    // Missile nose visible at front
    var nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.055, 0.15, 8),
      _matMissile
    );
    nose.rotation.z = -Math.PI / 2;
    nose.position.set(0.62, 0, 0);
    g.add(nose);

    // Position in front of camera (right-hand side)
    g.position.set(0.28, -0.22, -0.55);
    g.rotation.y = 0.08;

    return g;
  }

  // ── Missile Mesh ─────────────────────────────────────────────────────────────
  function _buildMissile() {
    _initMats();
    var g = new THREE.Group();

    // Body
    var body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8),
      _matMissile
    );
    body.rotation.x = Math.PI / 2;
    g.add(body);

    // Nose cone
    var nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.04, 0.18, 8),
      new THREE.MeshLambertMaterial({ color: 0x334455 })
    );
    nose.rotation.x = Math.PI / 2;
    nose.position.z = -0.44;
    g.add(nose);

    // Fins
    for (var i = 0; i < 4; i++) {
      var fin = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.015, 0.12),
        _matDark
      );
      fin.rotation.z = i * Math.PI / 2;
      fin.position.z = 0.32;
      g.add(fin);
    }

    return g;
  }

  // ── Enemy AA Emplacement (Shilka-style quad-barrel autocannon) ───────────────
  function _buildAAEmplacement(px, pz) {
    _initMats();
    var g = new THREE.Group();

    // Base platform
    var base = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.3, 2.0),
      _matDark
    );
    base.position.y = 0.15;
    g.add(base);

    // Turret body
    var turret = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.7, 1.1),
      _matOlive
    );
    turret.position.y = 0.65;
    g.add(turret);

    // Turret dome top
    var dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      _matOlive
    );
    dome.position.y = 1.0;
    g.add(dome);

    // Radar dish (small box + cylinder)
    var radarBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.3, 8),
      _matBlack
    );
    radarBase.position.set(0.4, 1.35, 0);
    g.add(radarBase);
    var radarDish = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.25, 0.08),
      _matGray
    );
    radarDish.position.set(0.4, 1.6, 0);
    g.add(radarDish);

    // Quad barrels
    var barrelGroup = new THREE.Group();
    barrelGroup.position.set(0, 0.7, 0);
    var barrelOffsets = [
      { x: -0.1, y:  0.08 },
      { x:  0.1, y:  0.08 },
      { x: -0.1, y: -0.08 },
      { x:  0.1, y: -0.08 }
    ];
    for (var b = 0; b < 4; b++) {
      var barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 1.4, 8),
        _matBarrel
      );
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(barrelOffsets[b].x, barrelOffsets[b].y, -0.8);
      barrelGroup.add(barrel);
    }
    g.add(barrelGroup);

    // Tracks / wheels suggestion
    var trackL = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.35, 2.0),
      _matBlack
    );
    trackL.position.set(-0.95, 0.17, 0);
    g.add(trackL);
    var trackR = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.35, 2.0),
      _matBlack
    );
    trackR.position.set(0.95, 0.17, 0);
    g.add(trackR);

    g.position.set(px, 0, pz);

    var data = {
      group:      g,
      barrelGroup: barrelGroup,
      hp:         AA_HP,
      maxHp:      AA_HP,
      fireTimer:  Math.random() * (1 / AA_FIRE_RATE),
      tracers:    [],
      pos:        new THREE.Vector3(px, 1.0, pz),
      destroyed:  false,
      suppressed: false,
      radarAngle: 0
    };

    _scene.add(g);
    return data;
  }

  // ── Scan for airborne targets ────────────────────────────────────────────────
  function _scanAirborneTargets() {
    _airborneTargets = [];
    if (!_scene) return;

    // Look for helicopters, drones, enemy aircraft by checking scene children
    _scene.traverse(function (obj) {
      if (!obj.isMesh && !obj.isGroup) return;
      // Tag-based detection: objects with userData.isAirborne, isHelicopter, isDrone, isAircraft
      if (obj.userData && (
          obj.userData.isAirborne ||
          obj.userData.isHelicopter ||
          obj.userData.isDrone ||
          obj.userData.isAircraft ||
          obj.userData.isEnemyAircraft ||
          obj.userData.isEnemyDrone ||
          obj.userData.isEnemyHelicopter
        )) {
        // Only include if elevated (y > 1.5) or explicitly tagged airborne
        var worldPos = new THREE.Vector3();
        obj.getWorldPosition(worldPos);
        if (worldPos.y > 1.5 || obj.userData.isAirborne) {
          _airborneTargets.push(obj);
        }
      }
    });

    // Also check for HelicopterGunship module targets
    if (window.HelicopterGunship && window.HelicopterGunship.getHeliObject) {
      var heliObj = window.HelicopterGunship.getHeliObject();
      if (heliObj && _airborneTargets.indexOf(heliObj) === -1) {
        _airborneTargets.push(heliObj);
      }
    }
  }

  // ── Lock-on update ───────────────────────────────────────────────────────────
  function _updateLockOn(delta) {
    if (!_manpadEquipped || !_camera) return;

    // Check camera forward for airborne targets in crosshair
    var camDir = new THREE.Vector3();
    _camera.getWorldDirection(camDir);
    var camPos = new THREE.Vector3();
    _camera.getWorldPosition(camPos);

    _raycaster.set(camPos, camDir);

    var bestTarget = null;
    var bestDot = 0.97; // ~14 degrees cone

    for (var i = 0; i < _airborneTargets.length; i++) {
      var tgt = _airborneTargets[i];
      if (!tgt || !tgt.parent) continue; // removed from scene

      var tgtPos = new THREE.Vector3();
      tgt.getWorldPosition(tgtPos);

      var toTarget = tgtPos.clone().sub(camPos).normalize();
      var dot = camDir.dot(toTarget);
      var dist = camPos.distanceTo(tgtPos);

      if (dot > bestDot && dist < 120) {
        bestDot = dot;
        bestTarget = tgt;
      }
    }

    if (bestTarget) {
      if (_lockTarget !== bestTarget) {
        // New target — reset lock
        _lockStrength = 0;
        _locked = false;
        _lockTarget = bestTarget;
        _startLockTone();
        // Warn aircraft: if it's a friendly helicopter module, trigger evasion
        _triggerAircraftWarning(bestTarget);
      }

      if (!_locked) {
        _lockStrength = Math.min(1.0, _lockStrength + delta / LOCK_TIME);
        _updateLockTone(_lockStrength);
        if (_lockStrength >= 1.0) {
          _locked = true;
          _updateLockTone(1.0);
        }
      }
    } else {
      // Lost target
      if (_lockTarget) {
        _lockStrength = Math.max(0, _lockStrength - delta * 1.5);
        _updateLockTone(_lockStrength);
        if (_lockStrength <= 0) {
          _lockTarget = null;
          _locked = false;
          _stopLockTone();
        }
      }
    }

    _updateHUD();
  }

  function _triggerAircraftWarning(tgt) {
    // If the target is the HelicopterGunship, trigger evasion
    if (window.HelicopterGunship && window.HelicopterGunship.triggerEvasion) {
      try { window.HelicopterGunship.triggerEvasion(); } catch (e) { /* silent */ }
    }
    // Fire a custom event for other modules to hook
    try {
      window.dispatchEvent(new CustomEvent('antiair:lockon', { detail: { target: tgt } }));
    } catch (e) { /* silent */ }
  }

  // ── Fire missile ─────────────────────────────────────────────────────────────
  function fire() {
    if (!_manpadEquipped) return;
    if (!_locked || !_lockTarget) return;
    if (_reloading) return;
    if (_missileCount <= 0) return;

    _missileCount--;
    _reloading = true;
    _reloadTimer = RELOAD_TIME;

    _playFireSound();

    // Recoil
    _recoilAngle = RECOIL_MAX;

    // Spawn missile at camera position
    var spawnPos = new THREE.Vector3();
    _camera.getWorldPosition(spawnPos);
    var camDir = new THREE.Vector3();
    _camera.getWorldDirection(camDir);
    spawnPos.addScaledVector(camDir, 0.8);

    var missileMesh = _buildMissile();
    missileMesh.position.copy(spawnPos);

    // Orient toward target
    var tgtPos = new THREE.Vector3();
    _lockTarget.getWorldPosition(tgtPos);
    missileMesh.lookAt(tgtPos);

    _scene.add(missileMesh);

    // Smoke trail: line of Points
    var smokeGeo = new THREE.BufferGeometry();
    var smokePositions = new Float32Array(60 * 3); // 60 points
    smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
    var smokeMat = new THREE.PointsMaterial({
      color: 0xcccccc,
      size: 0.18,
      transparent: true,
      opacity: 0.6
    });
    var smokePoints = new THREE.Points(smokeGeo, smokeMat);
    _scene.add(smokePoints);

    // Smoke particles array for trail
    var smokeParticles = [];
    for (var s = 0; s < 60; s++) {
      smokeParticles.push({
        x: spawnPos.x, y: spawnPos.y, z: spawnPos.z,
        life: 0,
        active: false
      });
    }

    _missiles.push({
      group:          missileMesh,
      target:         _lockTarget,
      smokePoints:    smokePoints,
      smokeGeo:       smokeGeo,
      smokeParticles: smokeParticles,
      smokeIndex:     0,
      life:           0,
      maxLife:        12.0,
      speed:          18,
      vel:            camDir.clone().multiplyScalar(18)
    });

    // Lock is consumed - start searching for next
    _locked = false;
    _lockStrength = 0;
    _lockTarget = null;
    _stopLockTone();

    _updateHUD();
  }

  // ── Update missiles ──────────────────────────────────────────────────────────
  function _updateMissiles(delta) {
    for (var i = _missiles.length - 1; i >= 0; i--) {
      var m = _missiles[i];
      m.life += delta;

      if (m.life > m.maxLife) {
        _removeMissile(i);
        continue;
      }

      // Homing: lerp velocity toward target
      if (m.target && m.target.parent) {
        var tPos = new THREE.Vector3();
        m.target.getWorldPosition(tPos);
        var mPos = m.group.position.clone();
        var toTarget = tPos.clone().sub(mPos).normalize();

        // Proportional navigation-ish: blend current vel direction toward target
        var curDir = m.vel.clone().normalize();
        var newDir = curDir.lerp(toTarget, Math.min(1.0, delta * 3.5));
        newDir.normalize();
        m.vel.copy(newDir.multiplyScalar(m.speed));

        // Orient missile
        m.group.lookAt(tPos);

        // Proximity fuse check
        var dist = mPos.distanceTo(tPos);
        if (dist < 2.0) {
          _explodeMissile(m, tPos);
          _removeMissile(i);
          continue;
        }
      }

      // Move missile
      m.group.position.addScaledVector(m.vel, delta);

      // Smoke trail
      var sp = m.smokeParticles[m.smokeIndex % 60];
      sp.x = m.group.position.x + (Math.random() - 0.5) * 0.08;
      sp.y = m.group.position.y + (Math.random() - 0.5) * 0.08;
      sp.z = m.group.position.z + (Math.random() - 0.5) * 0.08;
      sp.active = true;
      m.smokeIndex++;

      // Update smoke geometry
      var positions = m.smokeGeo.attributes.position.array;
      for (var s = 0; s < 60; s++) {
        var idx = s * 3;
        positions[idx]     = m.smokeParticles[s].active ? m.smokeParticles[s].x : 0;
        positions[idx + 1] = m.smokeParticles[s].active ? m.smokeParticles[s].y : 0;
        positions[idx + 2] = m.smokeParticles[s].active ? m.smokeParticles[s].z : 0;
      }
      m.smokeGeo.attributes.position.needsUpdate = true;

      // Boost speed slightly as rocket motor burns
      if (m.speed < 30) { m.speed += delta * 4; }
    }
  }

  function _explodeMissile(m, pos) {
    _playExplosionSound(0.65);
    _spawnExplosion(pos, 12.0, 80, true);

    // Damage target
    if (m.target && m.target.userData) {
      var dmgAmt = 80 + Math.random() * 40;
      if (typeof m.target.userData.hp !== 'undefined') {
        m.target.userData.hp -= dmgAmt;
      }
      // Notify HelicopterGunship
      if (window.HelicopterGunship && window.HelicopterGunship.takeDamage) {
        try { window.HelicopterGunship.takeDamage(dmgAmt); } catch (e) { /* silent */ }
      }
      // Event
      try {
        window.dispatchEvent(new CustomEvent('antiair:missilehit', {
          detail: { target: m.target, damage: dmgAmt, position: pos }
        }));
      } catch (e) { /* silent */ }
    }
  }

  function _removeMissile(idx) {
    var m = _missiles[idx];
    if (m.group) _scene.remove(m.group);
    if (m.smokePoints) _scene.remove(m.smokePoints);
    _missiles.splice(idx, 1);
  }

  // ── Explosion VFX ────────────────────────────────────────────────────────────
  function _spawnExplosion(pos, radius, damage, isAA) {
    var exGroup = new THREE.Group();
    exGroup.position.copy(pos);

    // Core flash
    var flash = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.3, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    exGroup.add(flash);

    // Fireball
    var fire = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.5, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.9 })
    );
    exGroup.add(fire);

    // Point light
    var light = new THREE.PointLight(0xff8800, 4, radius * 2.5);
    exGroup.add(light);

    _scene.add(exGroup);

    _explosions.push({
      group:  exGroup,
      flash:  flash,
      fire:   fire,
      light:  light,
      life:   0,
      maxLife: 0.6,
      radius: radius,
      damage: damage,
      isAA:   isAA || false,
      damageDone: false
    });
  }

  function _updateExplosions(delta) {
    for (var i = _explosions.length - 1; i >= 0; i--) {
      var ex = _explosions[i];
      ex.life += delta;
      var t = ex.life / ex.maxLife;

      if (!ex.damageDone) {
        ex.damageDone = true;
        _applyBlastDamage(ex.group.position, ex.radius, ex.damage);
      }

      if (t >= 1.0) {
        _scene.remove(ex.group);
        _explosions.splice(i, 1);
        continue;
      }

      // Scale up then fade
      var scale = 1.0 + t * 1.5;
      ex.fire.scale.setScalar(scale);
      ex.fire.material.opacity = (1 - t) * 0.9;
      ex.flash.scale.setScalar(scale * 0.7);
      ex.flash.material.opacity = (1 - t * 2) > 0 ? (1 - t * 2) : 0;
      ex.light.intensity = 4 * (1 - t);
    }
  }

  function _applyBlastDamage(pos, radius, damage) {
    // Damage AA emplacements within radius
    for (var i = 0; i < _aaEmplacements.length; i++) {
      var aa = _aaEmplacements[i];
      if (aa.destroyed) continue;
      var dist = pos.distanceTo(aa.pos);
      if (dist < radius) {
        var falloff = 1 - (dist / radius);
        aa.hp -= damage * falloff;
        if (aa.hp <= 0) {
          _destroyAAEmplacement(i);
        }
      }
    }

    // Dispatch for other systems to respond
    try {
      window.dispatchEvent(new CustomEvent('antiair:explosion', {
        detail: { position: pos, radius: radius, damage: damage }
      }));
    } catch (e) { /* silent */ }
  }

  // ── AA Emplacement logic ─────────────────────────────────────────────────────
  function _updateAAEmplacements(delta) {
    for (var i = 0; i < _aaEmplacements.length; i++) {
      var aa = _aaEmplacements[i];
      if (aa.destroyed) continue;

      // Rotate radar dish
      aa.radarAngle += delta * 1.5;
      var radarDish = aa.group.children[3];
      if (radarDish) { radarDish.rotation.y = aa.radarAngle; }

      // Find a target to track: friendly aircraft, drones, or player if armed
      var aaTarget = _findAATarget(aa);

      if (aaTarget) {
        var tPos = new THREE.Vector3();
        aaTarget.getWorldPosition(tPos);
        var aaPos = aa.pos.clone();
        var dist = aaPos.distanceTo(tPos);

        // Rotate turret to face target
        var toTarget = tPos.clone().sub(aaPos);
        var angle = Math.atan2(toTarget.x, toTarget.z);
        aa.group.rotation.y = angle;

        // Elevate barrels toward target
        var elevAngle = Math.atan2(tPos.y - aaPos.y, Math.sqrt(toTarget.x * toTarget.x + toTarget.z * toTarget.z));
        aa.barrelGroup.rotation.x = -elevAngle;

        // Fire
        if (dist <= AA_RANGE) {
          aa.fireTimer -= delta;
          if (aa.fireTimer <= 0) {
            aa.fireTimer = 1 / AA_FIRE_RATE;
            _fireAATracer(aa, tPos, aaTarget);
          }
        }
      }

      // Update this emplacement's tracers
      _updateTracers(aa.tracers, delta);
    }

    // Check AA suppression status
    _checkAASuppression();
  }

  function _findAATarget(aa) {
    // Search for friendly aircraft (high altitude objects tagged friendly)
    // Also checks for player-deployed drones
    var bestTarget = null;
    var bestDist = AA_RANGE;

    _scene.traverse(function (obj) {
      if (!obj.userData) return;
      var isFriendlyAir = obj.userData.isFriendlyAircraft ||
                          obj.userData.isCompanionDrone ||
                          obj.userData.isReconDrone ||
                          obj.userData.isPlayerDrone;
      if (!isFriendlyAir) return;

      var wpos = new THREE.Vector3();
      obj.getWorldPosition(wpos);
      var d = aa.pos.distanceTo(wpos);
      if (d < bestDist) {
        bestDist = d;
        bestTarget = obj;
      }
    });

    // Also target HelicopterGunship if it's active and airborne
    if (!bestTarget && window.HelicopterGunship && window.HelicopterGunship.getHeliObject) {
      try {
        var heliObj = window.HelicopterGunship.getHeliObject();
        if (heliObj) {
          var hPos = new THREE.Vector3();
          heliObj.getWorldPosition(hPos);
          var hDist = aa.pos.distanceTo(hPos);
          if (hDist < bestDist && hPos.y > 1.0) {
            bestTarget = heliObj;
          }
        }
      } catch (e) { /* silent */ }
    }

    return bestTarget;
  }

  function _fireAATracer(aa, targetPos, targetObj) {
    _initMats();
    var muzzlePos = aa.pos.clone();
    muzzlePos.y += 0.9;
    muzzlePos.z -= 0.5; // front of barrel roughly

    // Slight spread
    var spread = 0.08;
    var adjustedTarget = targetPos.clone().add(new THREE.Vector3(
      (Math.random() - 0.5) * spread * 2,
      (Math.random() - 0.5) * spread * 2,
      (Math.random() - 0.5) * spread * 2
    ));

    var dir = adjustedTarget.clone().sub(muzzlePos).normalize();
    var speed = 45;

    // Tracer sphere
    var geo = new THREE.SphereGeometry(0.06, 6, 6);
    var mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(muzzlePos);
    _scene.add(mesh);

    // Point light on tracer
    var light = new THREE.PointLight(0xffffff, 1.5, 3);
    mesh.add(light);

    aa.tracers.push({
      mesh:   mesh,
      vx:     dir.x * speed,
      vy:     dir.y * speed,
      vz:     dir.z * speed,
      life:   0,
      maxLife: 1.5,
      damage: AA_DAMAGE,
      target: targetObj
    });
  }

  function _updateTracers(tracerList, delta) {
    for (var i = tracerList.length - 1; i >= 0; i--) {
      var t = tracerList[i];
      t.life += delta;

      if (t.life > t.maxLife) {
        _scene.remove(t.mesh);
        tracerList.splice(i, 1);
        continue;
      }

      t.mesh.position.x += t.vx * delta;
      t.mesh.position.y += t.vy * delta;
      t.mesh.position.z += t.vz * delta;

      // Check hit on target
      if (t.target && t.target.parent) {
        var tPos = new THREE.Vector3();
        t.target.getWorldPosition(tPos);
        var dist = t.mesh.position.distanceTo(tPos);
        if (dist < 1.5) {
          // Hit!
          _applyTracerDamage(t.target, t.damage);
          _scene.remove(t.mesh);
          tracerList.splice(i, 1);
          continue;
        }
      }
    }
  }

  function _applyTracerDamage(target, damage) {
    // Double damage while AA is active (suppression mechanic)
    var multiplier = _getAASuppressMultiplier();
    var finalDamage = damage * multiplier;

    if (target.userData) {
      if (typeof target.userData.hp !== 'undefined') {
        target.userData.hp -= finalDamage;
      }
    }

    // Notify HelicopterGunship
    if (window.HelicopterGunship && window.HelicopterGunship.takeDamage) {
      try { window.HelicopterGunship.takeDamage(finalDamage); } catch (e) { /* silent */ }
    }

    // Notify AirSupport
    if (window.AirSupport && window.AirSupport.takeDamage) {
      try { window.AirSupport.takeDamage(finalDamage); } catch (e) { /* silent */ }
    }

    try {
      window.dispatchEvent(new CustomEvent('antiair:tracerhit', {
        detail: { target: target, damage: finalDamage }
      }));
    } catch (e) { /* silent */ }
  }

  function _getAASuppressMultiplier() {
    var anyActive = false;
    for (var i = 0; i < _aaEmplacements.length; i++) {
      if (!_aaEmplacements[i].destroyed) { anyActive = true; break; }
    }
    return anyActive ? 2.0 : 1.0;
  }

  function _checkAASuppression() {
    // Update HUD suppression status
    _updateHUD();
  }

  function _destroyAAEmplacement(idx) {
    var aa = _aaEmplacements[idx];
    aa.destroyed = true;
    aa.hp = 0;

    // Explosion
    _playExplosionSound(0.8);
    _spawnExplosion(aa.pos, 6.0, 30, false);

    // Change color to charred
    aa.group.traverse(function (child) {
      if (child.isMesh && child.material) {
        child.material = new THREE.MeshLambertMaterial({ color: 0x222222 });
      }
    });

    // Clear tracers
    for (var t = 0; t < aa.tracers.length; t++) {
      _scene.remove(aa.tracers[t].mesh);
    }
    aa.tracers = [];

    try {
      window.dispatchEvent(new CustomEvent('antiair:aadestroyed', {
        detail: { index: idx, position: aa.pos }
      }));
    } catch (e) { /* silent */ }

    _updateHUD();
  }

  // ── HUD ──────────────────────────────────────────────────────────────────────
  function _buildHUD() {
    if (_hudEl) return;

    _hudEl = document.createElement('div');
    _hudEl.id = 'antiair-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:120px',
      'right:18px',
      'background:rgba(0,0,0,0.55)',
      'border:1px solid rgba(80,200,80,0.5)',
      'color:#88ff88',
      'font-family:monospace',
      'font-size:12px',
      'padding:8px 12px',
      'border-radius:4px',
      'min-width:170px',
      'pointer-events:none',
      'display:none',
      'z-index:900',
      'line-height:1.7'
    ].join(';');

    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (!_manpadEquipped) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';

    var lockPct = Math.round(_lockStrength * 100);
    var lockColor = _locked ? '#ff4444' : (_lockStrength > 0.5 ? '#ffcc00' : '#88ff88');
    var lockLabel = _locked ? 'LOCKED' : (_lockStrength > 0 ? 'ACQUIRING' : 'SEARCHING');

    var lockBar = '';
    var barFill = Math.round(_lockStrength * 20);
    for (var b = 0; b < 20; b++) {
      lockBar += b < barFill ? '█' : '░';
    }

    var aaStatus = '';
    var allDestroyed = true;
    var anySuppressed = false;
    for (var i = 0; i < _aaEmplacements.length; i++) {
      var aa = _aaEmplacements[i];
      if (!aa.destroyed) {
        allDestroyed = false;
        if (aa.suppressed) { anySuppressed = true; }
        var hpPct = Math.round((aa.hp / aa.maxHp) * 100);
        aaStatus += 'AA-' + (i + 1) + ': <span style="color:' + (aa.suppressed ? '#ffaa00' : '#ff4444') + '">' +
          (aa.suppressed ? 'SUPPRESSED' : 'ACTIVE') + '</span> HP:' + hpPct + '%<br>';
      } else {
        aaStatus += 'AA-' + (i + 1) + ': <span style="color:#555">DESTROYED</span><br>';
      }
    }

    var reloadText = _reloading
      ? ('<span style="color:#ffaa00">RELOADING ' + _reloadTimer.toFixed(1) + 's</span>')
      : '<span style="color:#88ff88">READY</span>';

    _hudEl.innerHTML =
      '<b style="color:#aaffaa">MANPAD</b><br>' +
      'LOCK: <span style="color:' + lockColor + '">' + lockLabel + ' ' + lockPct + '%</span><br>' +
      '<span style="font-size:10px;color:#aaa">[' + lockBar + ']</span><br>' +
      'MISSILES: <b>' + _missileCount + '/4</b> ' + reloadText + '<br>' +
      '<span style="font-size:11px;color:#aaa">── ENEMY AA ──</span><br>' +
      aaStatus;
  }

  // ── Recoil ───────────────────────────────────────────────────────────────────
  function _updateRecoil(delta) {
    if (_recoilAngle > 0) {
      // Apply recoil as camera pitch
      _camera.rotation.x -= _recoilAngle;
      // Recover
      var recover = (RECOIL_MAX / RECOIL_RECOVER) * delta;
      _recoilAngle = Math.max(0, _recoilAngle - recover);
      _camera.rotation.x += _recoilAngle;
    }
  }

  // ── Input ────────────────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    _keys[e.code] = true;
    if (e.code === 'KeyP') {
      equipMANPAD();
    }
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
  }

  function _onMouseDown(e) {
    if (e.button === 0) {
      _mouseDown = true;
      if (_manpadEquipped && _locked) {
        fire();
      }
    }
  }

  function _onMouseUp(e) {
    if (e.button === 0) { _mouseDown = false; }
  }

  function _bindInput() {
    if (_bound) return;
    _bound = true;
    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup', _onKeyUp);
    window.addEventListener('mousedown', _onMouseDown);
    window.addEventListener('mouseup', _onMouseUp);
  }

  function _unbindInput() {
    window.removeEventListener('keydown', _onKeyDown);
    window.removeEventListener('keyup', _onKeyUp);
    window.removeEventListener('mousedown', _onMouseDown);
    window.removeEventListener('mouseup', _onMouseUp);
    _bound = false;
  }

  // ── Public API ───────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;
    _raycaster = new THREE.Raycaster();

    _initMats();
    _buildHUD();
    _bindInput();

    // Spawn 2 enemy AA emplacements at fixed positions
    _aaEmplacements.push(_buildAAEmplacement(-18, -22));
    _aaEmplacements.push(_buildAAEmplacement(20, 18));

    _updateHUD();
  }

  function equipMANPAD() {
    if (_manpadEquipped) {
      // Unequip
      _manpadEquipped = false;
      if (_manpadMesh) {
        _camera.remove(_manpadMesh);
        _manpadMesh = null;
      }
      _stopLockTone();
      _lockTarget = null;
      _lockStrength = 0;
      _locked = false;
      _updateHUD();
      return;
    }

    _manpadEquipped = true;
    _manpadMesh = _buildMANPAD();
    _camera.add(_manpadMesh);
    _updateHUD();
  }

  function lockOn(target) {
    if (!_manpadEquipped) return;
    _lockTarget = target;
    _lockStrength = 0;
    _locked = false;
    _startLockTone();
    _triggerAircraftWarning(target);
  }

  function update(delta) {
    if (!_scene || !_camera) return;

    // Scan for airborne targets periodically
    _targetScanTimer -= delta;
    if (_targetScanTimer <= 0) {
      _targetScanTimer = TARGET_SCAN_INTERVAL;
      _scanAirborneTargets();
    }

    // Lock-on
    _updateLockOn(delta);

    // Missiles
    _updateMissiles(delta);

    // Explosions
    _updateExplosions(delta);

    // Enemy AA
    _updateAAEmplacements(delta);

    // Recoil recovery
    _updateRecoil(delta);

    // Reload timer
    if (_reloading) {
      _reloadTimer -= delta;
      if (_reloadTimer <= 0) {
        _reloading = false;
        _reloadTimer = 0;
      }
      _updateHUD();
    }
  }

  function reset() {
    // Remove missiles
    for (var i = 0; i < _missiles.length; i++) {
      var m = _missiles[i];
      if (m.group) _scene.remove(m.group);
      if (m.smokePoints) _scene.remove(m.smokePoints);
    }
    _missiles = [];

    // Remove explosions
    for (var e = 0; e < _explosions.length; e++) {
      if (_explosions[e].group) _scene.remove(_explosions[e].group);
    }
    _explosions = [];

    // Remove AA emplacements
    for (var a = 0; a < _aaEmplacements.length; a++) {
      var aa = _aaEmplacements[a];
      for (var t = 0; t < aa.tracers.length; t++) {
        _scene.remove(aa.tracers[t].mesh);
      }
      if (aa.group) _scene.remove(aa.group);
    }
    _aaEmplacements = [];

    // Unequip MANPAD
    if (_manpadEquipped) {
      _manpadEquipped = false;
      if (_manpadMesh) {
        _camera.remove(_manpadMesh);
        _manpadMesh = null;
      }
    }

    _stopLockTone();
    _lockTarget    = null;
    _lockStrength  = 0;
    _locked        = false;
    _missileCount  = 4;
    _reloading     = false;
    _reloadTimer   = 0;
    _recoilAngle   = 0;
    _airborneTargets = [];
    _targetScanTimer = 0;
    _keys          = {};
    _mouseDown     = false;

    if (_hudEl) { _hudEl.style.display = 'none'; }
  }

  return {
    init:        init,
    update:      update,
    equipMANPAD: equipMANPAD,
    lockOn:      lockOn,
    fire:        fire,
    reset:       reset
  };

}());
