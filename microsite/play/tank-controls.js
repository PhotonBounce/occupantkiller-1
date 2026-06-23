// ============================================================
//  tank-controls.js — Player-Driveable Main Battle Tank
//
//  Controls (while driving):
//    W/S        = drive forward / backward
//    A/D        = rotate hull left / right
//    Mouse X    = rotate turret independently
//    LMB        = fire 120mm main gun
//    RMB        = fire coaxial machine gun
//    T          = enter tank (within 3m)
//    E          = exit tank
//
//  Public API: { init(scene, camera), update(dt), spawnTank(x, y, z), reset }
// ============================================================
window.TankControls = (function () {
  'use strict';

  // ── Scene / camera references ────────────────────────────────
  var _scene  = null;
  var _camera = null;

  // ── Tank state ───────────────────────────────────────────────
  var _tank = null;          // { group, hull, turretGroup, barrel, wheels, tracks, hp, yaw, speed, vx, vz }
  var _active = false;       // player is currently driving

  // ── Movement ─────────────────────────────────────────────────
  var _speed       = 0;      // forward speed m/s
  var _yaw         = 0;      // hull yaw radians
  var _turretYaw   = 0;      // turret yaw relative to hull
  var _wheelSpin   = 0;      // accumulated wheel rotation

  // ── Combat ───────────────────────────────────────────────────
  var _tankHP         = 500;
  var _tankMaxHP      = 500;
  var _mainGunCooldown = 0;   // seconds until next shot
  var _mgCooldown      = 0;
  var _mgAmmo          = 500;
  var _recoilOffset    = 0;   // barrel recoil position (z offset)
  var _recoilVel       = 0;

  // ── Projectiles / FX ─────────────────────────────────────────
  var _shells      = [];     // 120mm shells
  var _mgRounds    = [];     // coax MG tracers
  var _explosions  = [];     // { light, particles, life, maxLife }
  var _scorches    = [];     // ground scorch marks

  // ── Input ────────────────────────────────────────────────────
  var _keys = { w: false, s: false, a: false, d: false };
  var _mouseDX   = 0;
  var _lmbDown   = false;
  var _rmbDown   = false;

  // ── Audio ─────────────────────────────────────────────────────
  var _audioCtx      = null;
  var _engineOsc     = null;
  var _engineMod     = null;
  var _engineGain    = null;
  var _prevSpeed     = 0;
  var _gearCooldown  = 0;
  var _bound         = false;

  // ── HUD / UI ──────────────────────────────────────────────────
  var _hudEl      = null;
  var _promptEl   = null;
  var _statusEl   = null;

  // ── Constants ────────────────────────────────────────────────
  var DRIVE_ACCEL    = 4;      // m/s²
  var DRIVE_MAX      = 10;     // m/s
  var DRIVE_FRICTION = 3;      // passive deceleration
  var TURN_RATE      = 1.2;    // rad/s hull rotation
  var TURRET_RATE    = 2;      // rad/s turret rotation
  var ENTER_DIST     = 3;      // m for entry prompt
  var NEARBY_DIST    = 10;     // m for "TANK AVAILABLE" indicator
  var CAM_BACK       = 6;
  var CAM_UP         = 4;
  var MAIN_GUN_RELOAD = 4;     // seconds
  var MAIN_GUN_SPEED  = 80;    // m/s
  var MAIN_GUN_DMG_NEAR = 300; // damage within 4m
  var MAIN_GUN_DMG_FAR  = 150; // damage within 8m
  var MAIN_GUN_RADIUS_NEAR = 4;
  var MAIN_GUN_RADIUS_FAR  = 8;
  var MG_INTERVAL    = 60 / 600; // 600 RPM
  var MG_DAMAGE      = 15;
  var MG_SPEED       = 120;
  var RECOIL_PUSH    = 0.3;    // units back on fire
  var RECOIL_RETURN  = 0.5;    // seconds to return
  var HP_SMOKE       = 300;
  var HP_TRACK_DMG   = 150;

  // ── Build Tank Mesh ──────────────────────────────────────────
  function _buildTank(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var oliveMat  = new THREE.MeshLambertMaterial({ color: 0x4B5320 }); // olive drab
    var darkMat   = new THREE.MeshLambertMaterial({ color: 0x2A2E14 });
    var trackMat  = new THREE.MeshLambertMaterial({ color: 0x1A1A0A });
    var steelMat  = new THREE.MeshLambertMaterial({ color: 0x303030 });
    var wheelMat  = new THREE.MeshLambertMaterial({ color: 0x222222 });

    // Hull: 4 × 1.2 × 2.5
    var hullGeo = new THREE.BoxGeometry(4, 1.2, 2.5);
    var hull    = new THREE.Mesh(hullGeo, oliveMat);
    hull.position.y = 0.6;
    group.add(hull);

    // Turret group (pivots around Y)
    var turretGroup = new THREE.Group();
    turretGroup.position.set(0, 1.6, 0);

    // Turret box: 2 × 0.8 × 2
    var turretGeo  = new THREE.BoxGeometry(2, 0.8, 2);
    var turretMesh = new THREE.Mesh(turretGeo, darkMat);
    turretGroup.add(turretMesh);

    // Gun barrel: CylinderGeometry r=0.15, length=2.5, extends forward (+Z)
    var barrelGroup = new THREE.Group();
    var barrelGeo   = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 8);
    var barrel      = new THREE.Mesh(barrelGeo, steelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = 1.25; // extends forward
    barrelGroup.add(barrel);
    barrelGroup.position.y = 0;
    turretGroup.add(barrelGroup);

    group.add(turretGroup);

    // Road wheels — 4 per side (CylinderGeometry, rotate with movement)
    var wheels = [];
    var wGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.25, 10);
    var wOffsets = [-1.0, -0.33, 0.33, 1.0]; // along hull length
    var wSides   = [-2.15, 2.15];             // left / right
    for (var wi = 0; wi < wOffsets.length; wi++) {
      for (var ws = 0; ws < wSides.length; ws++) {
        var wm = new THREE.Mesh(wGeo, wheelMat);
        wm.rotation.z = Math.PI / 2;          // axis along X
        wm.position.set(wSides[ws], 0.15, wOffsets[wi]);
        group.add(wm);
        wheels.push(wm);
      }
    }

    // Track links — flat box along bottom sides
    var tkGeo = new THREE.BoxGeometry(0.35, 0.18, 2.6);
    [-2.15, 2.15].forEach(function (sx) {
      var tk = new THREE.Mesh(tkGeo, trackMat);
      tk.position.set(sx, 0.02, 0);
      group.add(tk);
    });

    _scene.add(group);

    _tank = {
      group:       group,
      hull:        hull,
      turretGroup: turretGroup,
      barrelGroup: barrelGroup,
      barrel:      barrel,
      wheels:      wheels,
      hp:          _tankHP,
      yaw:         0,
      speed:       0
    };
  }

  // ── HUD setup ────────────────────────────────────────────────
  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'tank-controls-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.6)',
      'color:#a8c840',
      'font-family:monospace',
      'font-size:13px',
      'padding:8px 18px',
      'border-radius:4px',
      'border:1px solid rgba(168,200,64,0.4)',
      'pointer-events:none',
      'display:none',
      'z-index:300',
      'text-align:center'
    ].join(';');
    document.body.appendChild(_hudEl);

    _promptEl = document.createElement('div');
    _promptEl.id = 'tank-controls-prompt';
    _promptEl.style.cssText = [
      'position:fixed',
      'bottom:140px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.55)',
      'color:#ffe066',
      'font-family:monospace',
      'font-size:14px',
      'padding:6px 16px',
      'border-radius:4px',
      'border:1px solid rgba(255,224,102,0.4)',
      'pointer-events:none',
      'display:none',
      'z-index:300'
    ].join(';');
    document.body.appendChild(_promptEl);

    _statusEl = document.createElement('div');
    _statusEl.id = 'tank-controls-status';
    _statusEl.style.cssText = [
      'position:fixed',
      'top:60px',
      'right:20px',
      'background:rgba(0,0,0,0.6)',
      'color:#a8c840',
      'font-family:monospace',
      'font-size:12px',
      'padding:5px 12px',
      'border-radius:3px',
      'border:1px solid rgba(168,200,64,0.35)',
      'pointer-events:none',
      'display:none',
      'z-index:300'
    ].join(';');
    document.body.appendChild(_statusEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (!_active) {
      _hudEl.style.display = 'none';
      _statusEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';
    _statusEl.style.display = 'block';

    var hpPct  = Math.round((_tankHP / _tankMaxHP) * 100);
    var hpCol  = _tankHP < HP_TRACK_DMG ? '#ff4444' : _tankHP < HP_SMOKE ? '#ffaa22' : '#88ff44';
    var reload = _mainGunCooldown > 0 ? 'RELOADING ' + _mainGunCooldown.toFixed(1) + 's' : 'READY';
    var mgAmmoStr = 'MG: ' + _mgAmmo;
    _hudEl.innerHTML =
      '<span style="color:' + hpCol + '">HP: ' + _tankHP + '/' + _tankMaxHP + ' (' + hpPct + '%)</span>' +
      ' &nbsp; 120mm: <span style="color:' + (_mainGunCooldown > 0 ? '#ff8800' : '#88ff44') + '">' + reload + '</span>' +
      ' &nbsp; ' + mgAmmoStr +
      ' &nbsp; [E]=Exit';
    _statusEl.innerHTML = 'IN TANK';
  }

  // ── Audio ────────────────────────────────────────────────────
  function _getAudio() {
    if (_audioCtx) return _audioCtx;
    try {
      _audioCtx = window._audioCtx ||
        new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {}
    return _audioCtx;
  }

  function _startEngine() {
    try {
      var ctx = _getAudio();
      if (!ctx) return;

      // Low drone at 60 Hz
      _engineOsc = ctx.createOscillator();
      _engineOsc.type = 'sawtooth';
      _engineOsc.frequency.value = 60;

      // 20 Hz modulation
      _engineMod = ctx.createOscillator();
      _engineMod.type = 'sine';
      _engineMod.frequency.value = 20;

      var modGain = ctx.createGain();
      modGain.gain.value = 8;
      _engineMod.connect(modGain);
      modGain.connect(_engineOsc.frequency);

      _engineGain = ctx.createGain();
      _engineGain.gain.value = 0.06;

      _engineOsc.connect(_engineGain);
      _engineGain.connect(ctx.destination);

      _engineOsc.start();
      _engineMod.start();
    } catch (e) {}
  }

  function _stopEngine() {
    try {
      if (_engineOsc)  { _engineOsc.stop();  _engineOsc  = null; }
      if (_engineMod)  { _engineMod.stop();  _engineMod  = null; }
      _engineGain = null;
    } catch (e) {}
  }

  function _updateEngineSound(dt, spd) {
    try {
      if (!_engineOsc || !_engineGain) return;
      var spd01 = Math.min(Math.abs(spd) / DRIVE_MAX, 1);
      _engineOsc.frequency.value = 60 + spd01 * 40;
      _engineGain.gain.value = 0.06 + spd01 * 0.05;

      // Gear-shift sound when accelerating from stop
      _gearCooldown -= dt;
      if (_prevSpeed < 0.5 && Math.abs(spd) > 1.5 && _gearCooldown <= 0) {
        _gearCooldown = 2;
        _playGearShift();
      }
      _prevSpeed = Math.abs(spd);
    } catch (e) {}
  }

  function _playGearShift() {
    try {
      var ctx = _getAudio();
      if (!ctx) return;
      var osc = ctx.createOscillator();
      var g   = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 120;
      g.gain.value = 0.08;
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.frequency.setTargetAtTime(200, ctx.currentTime, 0.1);
      g.gain.setTargetAtTime(0, ctx.currentTime + 0.18, 0.05);
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  }

  function _playImpact(position) {
    try {
      var ctx = _getAudio();
      if (!ctx) return;
      var buf  = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.12));
      }
      var src  = ctx.createBufferSource();
      var g    = ctx.createGain();
      src.buffer = buf;
      g.gain.value = 0.5;
      src.connect(g);
      g.connect(ctx.destination);
      src.start();
    } catch (e) {}
  }

  // ── Explosion FX ─────────────────────────────────────────────
  function _createExplosion(pos, large) {
    var numParticles = large ? 30 : 20;
    var intensity    = large ? 8  : 6;
    var range        = large ? 25 : 20;
    var life         = large ? 1.5 : 1.0;

    // Point light flash
    var light = new THREE.PointLight(0xff6600, intensity, range);
    light.position.copy(pos);
    _scene.add(light);

    // Debris particles
    var particles = [];
    var pMat = new THREE.MeshLambertMaterial({ color: 0x331100 });
    for (var i = 0; i < numParticles; i++) {
      var pGeo = new THREE.BoxGeometry(
        0.08 + Math.random() * 0.18,
        0.08 + Math.random() * 0.18,
        0.08 + Math.random() * 0.18
      );
      var p = new THREE.Mesh(pGeo, pMat);
      p.position.copy(pos);
      var spd = 4 + Math.random() * 8;
      var theta = Math.random() * Math.PI * 2;
      var phi   = Math.random() * Math.PI;
      p.userData.vx = spd * Math.sin(phi) * Math.cos(theta);
      p.userData.vy = spd * Math.cos(phi) + 3;
      p.userData.vz = spd * Math.sin(phi) * Math.sin(theta);
      _scene.add(p);
      particles.push(p);
    }

    // Ground scorch (CircleGeometry)
    var scorchGeo = new THREE.CircleGeometry(large ? 2.5 : 1.5, 12);
    var scorchMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var scorch = new THREE.Mesh(scorchGeo, scorchMat);
    scorch.rotation.x = -Math.PI / 2;
    scorch.position.set(pos.x, pos.y + 0.05, pos.z);
    _scene.add(scorch);
    _scorches.push(scorch);

    _explosions.push({
      light:      light,
      particles:  particles,
      life:       life,
      maxLife:    life
    });

    _playImpact(pos);
  }

  // ── Smoke emitter ─────────────────────────────────────────────
  var _smokeParticles = [];

  function _emitSmoke(pos) {
    try {
      var pGeo = new THREE.SphereGeometry(0.18 + Math.random() * 0.12, 5, 5);
      var pMat = new THREE.MeshLambertMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.5
      });
      var p = new THREE.Mesh(pGeo, pMat);
      p.position.set(
        pos.x + (Math.random() - 0.5) * 0.3,
        pos.y + 1.8,
        pos.z + (Math.random() - 0.5) * 0.3
      );
      p.userData.life    = 1.2;
      p.userData.maxLife = 1.2;
      p.userData.vy      = 1.5 + Math.random();
      _scene.add(p);
      _smokeParticles.push(p);
    } catch (e) {}
  }

  // ── Tank explosion (death) ────────────────────────────────────
  function _tankDestroyExplosion() {
    if (!_tank) return;
    var pos = _tank.group.position.clone();

    // Multiple light flashes
    for (var li = 0; li < 3; li++) {
      (function (delay) {
        setTimeout(function () {
          var fl = new THREE.PointLight(0xff4400, 12, 30);
          fl.position.set(pos.x, pos.y + 1.5, pos.z);
          _scene.add(fl);
          setTimeout(function () { _scene.remove(fl); }, 300);
        }, delay);
      })(li * 250);
    }

    // 30 debris particles
    var pMat = new THREE.MeshLambertMaterial({ color: 0x222200 });
    for (var i = 0; i < 30; i++) {
      var pGeo = new THREE.BoxGeometry(
        0.1 + Math.random() * 0.3,
        0.1 + Math.random() * 0.3,
        0.1 + Math.random() * 0.3
      );
      var p = new THREE.Mesh(pGeo, pMat);
      p.position.set(pos.x, pos.y + 1, pos.z);
      var spd = 6 + Math.random() * 10;
      var theta = Math.random() * Math.PI * 2;
      var phi   = Math.random() * Math.PI * 0.8;
      p.userData.vx = spd * Math.sin(phi) * Math.cos(theta);
      p.userData.vy = spd * Math.cos(phi) + 4;
      p.userData.vz = spd * Math.sin(phi) * Math.sin(theta);
      _scene.add(p);
      _explosions.push({
        light:      null,
        particles:  [p],
        life:       2.5,
        maxLife:    2.5
      });
    }

    // Ground scorch
    var scorchGeo = new THREE.CircleGeometry(4, 16);
    var scorchMat = new THREE.MeshLambertMaterial({ color: 0x0a0a00 });
    var scorch = new THREE.Mesh(scorchGeo, scorchMat);
    scorch.rotation.x = -Math.PI / 2;
    scorch.position.set(pos.x, pos.y + 0.05, pos.z);
    _scene.add(scorch);
    _scorches.push(scorch);

    _playImpact(pos);
  }

  // ── Damage area check ─────────────────────────────────────────
  function _applyExplosionDamage(pos, dmgNear, dmgFar, radNear, radFar) {
    // Check player (window._playerObject or camera stand-in)
    var playerPos = null;
    if (window._playerObject && window._playerObject.position) {
      playerPos = window._playerObject.position;
    } else if (_camera) {
      playerPos = _camera.position;
    }
    if (playerPos && !_active) {
      var dist = pos.distanceTo(playerPos);
      if (dist < radNear && window._playerHP !== undefined) {
        window._playerHP = Math.max(0, (window._playerHP || 100) - dmgNear);
      } else if (dist < radFar && window._playerHP !== undefined) {
        window._playerHP = Math.max(0, (window._playerHP || 100) - dmgFar);
      }
    }

    // Check enemies (window._enemies array or similar)
    var enemies = window._enemies || window._activeEnemies || [];
    for (var ei = 0; ei < enemies.length; ei++) {
      var en = enemies[ei];
      if (!en || !en.position) continue;
      var d = pos.distanceTo(en.position);
      if (d < radNear) {
        if (typeof en.takeDamage === 'function') en.takeDamage(dmgNear);
        else if (en.hp !== undefined) en.hp -= dmgNear;
      } else if (d < radFar) {
        if (typeof en.takeDamage === 'function') en.takeDamage(dmgFar);
        else if (en.hp !== undefined) en.hp -= dmgFar;
      }
    }
  }

  // ── Fire main gun ─────────────────────────────────────────────
  function _fireMainGun() {
    if (!_tank || _mainGunCooldown > 0) return;
    _mainGunCooldown = MAIN_GUN_RELOAD;

    // Barrel recoil
    _recoilOffset = -RECOIL_PUSH;
    _recoilVel    = 0;

    // Compute barrel tip world position
    var dir = new THREE.Vector3(0, 0, 1);
    var hullQ   = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, _yaw, 0));
    var turretQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, _turretYaw, 0));
    var finalQ  = new THREE.Quaternion().multiplyQuaternions(hullQ, turretQ);
    dir.applyQuaternion(finalQ);

    var tipPos = _tank.group.position.clone();
    tipPos.y += 1.6;
    tipPos.addScaledVector(dir, 2.5);

    // Create shell
    var shellGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.7, 6);
    var shellMat = new THREE.MeshLambertMaterial({ color: 0xddaa00 });
    var shellMesh = new THREE.Mesh(shellGeo, shellMat);
    shellMesh.rotation.x = Math.PI / 2;
    shellMesh.position.copy(tipPos);
    _scene.add(shellMesh);

    _shells.push({
      mesh:    shellMesh,
      vel:     dir.clone().multiplyScalar(MAIN_GUN_SPEED),
      life:    3.0,
      maxLife: 3.0
    });

    // Muzzle flash
    var fl = new THREE.PointLight(0xffaa00, 5, 12);
    fl.position.copy(tipPos);
    _scene.add(fl);
    setTimeout(function () { _scene.remove(fl); }, 80);
  }

  // ── Fire coaxial MG ──────────────────────────────────────────
  function _fireMG() {
    if (!_tank || _mgCooldown > 0 || _mgAmmo <= 0) return;
    _mgCooldown = MG_INTERVAL;
    _mgAmmo--;

    var dir = new THREE.Vector3(0, 0, 1);
    var hullQ   = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, _yaw, 0));
    var turretQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, _turretYaw, 0));
    var finalQ  = new THREE.Quaternion().multiplyQuaternions(hullQ, turretQ);
    dir.applyQuaternion(finalQ);

    // Slight spread
    dir.x += (Math.random() - 0.5) * 0.03;
    dir.y += (Math.random() - 0.5) * 0.015;
    dir.z += (Math.random() - 0.5) * 0.03;
    dir.normalize();

    var tipPos = _tank.group.position.clone();
    tipPos.y += 1.6;
    tipPos.addScaledVector(dir, 2.5);

    // Red tracer
    var tGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.45, 4);
    var tMat = new THREE.MeshLambertMaterial({ color: 0xff2200, emissive: 0xff1100 });
    var tMesh = new THREE.Mesh(tGeo, tMat);
    tMesh.rotation.x = Math.PI / 2;
    tMesh.position.copy(tipPos);
    _scene.add(tMesh);

    _mgRounds.push({
      mesh:   tMesh,
      vel:    dir.clone().multiplyScalar(MG_SPEED),
      life:   1.2,
      damage: MG_DAMAGE
    });
  }

  // ── Input handlers ────────────────────────────────────────────
  function _onKeyDown(e) {
    var k = e.key.toLowerCase();
    if (k === 'w') _keys.w = true;
    if (k === 's') _keys.s = true;
    if (k === 'a') _keys.a = true;
    if (k === 'd') _keys.d = true;

    // Enter tank
    if (k === 't' && !_active && _tank) {
      var playerPos = _camera ? _camera.position : null;
      if (playerPos) {
        var dist = _tank.group.position.distanceTo(playerPos);
        if (dist <= ENTER_DIST) {
          _enterTank();
        }
      }
    }

    // Exit tank
    if ((k === 'e') && _active) {
      _exitTank();
    }
  }

  function _onKeyUp(e) {
    var k = e.key.toLowerCase();
    if (k === 'w') _keys.w = false;
    if (k === 's') _keys.s = false;
    if (k === 'a') _keys.a = false;
    if (k === 'd') _keys.d = false;
  }

  function _onMouseMove(e) {
    if (!_active) return;
    _mouseDX += e.movementX || 0;
  }

  function _onMouseDown(e) {
    if (!_active) return;
    if (e.button === 0) _lmbDown = true;
    if (e.button === 2) _rmbDown = true;
  }

  function _onMouseUp(e) {
    if (e.button === 0) _lmbDown = false;
    if (e.button === 2) _rmbDown = false;
  }

  function _onContextMenu(e) {
    if (_active) e.preventDefault();
  }

  // ── Enter / exit ──────────────────────────────────────────────
  function _enterTank() {
    _active = true;
    window._playerInVehicle = true;
    window._playerInTank    = true;

    // Disable FPS controls if present
    if (window.controls && typeof window.controls.lock === 'function') {
      // keep pointer locked for mouse input
    }
    if (window._controls) {
      if (typeof window._controls.disconnect === 'function') window._controls.disconnect();
      if (window._controls.enabled !== undefined) window._controls.enabled = false;
    }

    _startEngine();

    if (_promptEl) _promptEl.style.display = 'none';
    if (_statusEl) _statusEl.style.display = 'block';
  }

  function _exitTank() {
    _active = false;
    window._playerInVehicle = false;
    window._playerInTank    = false;

    // Re-enable FPS controls
    if (window._controls) {
      if (typeof window._controls.connect === 'function') window._controls.connect();
      if (window._controls.enabled !== undefined) window._controls.enabled = true;
    }

    // Return camera to player
    if (_camera && _tank) {
      _camera.position.set(
        _tank.group.position.x,
        _tank.group.position.y + 2,
        _tank.group.position.z + 3
      );
    }

    _stopEngine();
    _speed = 0;

    if (_hudEl)    _hudEl.style.display    = 'none';
    if (_statusEl) _statusEl.style.display = 'none';
  }

  // ── Camera follow ─────────────────────────────────────────────
  function _updateCamera() {
    if (!_active || !_tank || !_camera) return;

    // Camera follows hull rotation, but offset looks in turret direction
    var camOffset = new THREE.Vector3(
      -Math.sin(_yaw) * CAM_BACK,
      CAM_UP,
      -Math.cos(_yaw) * CAM_BACK
    );
    var targetPos = _tank.group.position.clone().add(camOffset);
    _camera.position.lerp(targetPos, 0.12);

    // Look at a point slightly ahead in turret direction
    var totalYaw = _yaw + _turretYaw;
    var lookAt = _tank.group.position.clone();
    lookAt.y += 1.5;
    lookAt.x += Math.sin(totalYaw) * 8;
    lookAt.z += Math.cos(totalYaw) * 8;
    _camera.lookAt(lookAt);
  }

  // ── Terrain slope check ──────────────────────────────────────
  function _canClimbAhead() {
    if (!_tank || !window.VoxelWorld || !window.VoxelWorld.isSolid) return true;
    var pos = _tank.group.position;
    var aheadX = pos.x + Math.sin(_yaw);
    var aheadZ = pos.z + Math.cos(_yaw);
    var floorY = Math.floor(pos.y);
    // Can climb if one ahead+one above is not solid (or current is solid = wall)
    var wallAhead = window.VoxelWorld.isSolid(aheadX, floorY + 1, aheadZ);
    var slopeAhead = window.VoxelWorld.isSolid(aheadX, floorY + 2, aheadZ);
    // Gentle slope: solid at floor+1 but not floor+2 → can climb
    if (wallAhead && !slopeAhead) return true;
    // Clear: not solid → can drive
    if (!wallAhead) return true;
    // Tall wall: both solid → wall crush attempt
    return false;
  }

  function _tryCrushWall() {
    if (!_tank || !window.VoxelWorld || !window.VoxelWorld.isSolid) return;
    if (Math.abs(_speed) < 4) return; // need speed to crush
    var pos = _tank.group.position;
    var aheadX = Math.floor(pos.x + Math.sin(_yaw));
    var aheadZ = Math.floor(pos.z + Math.cos(_yaw));
    var floorY = Math.floor(pos.y);
    // Remove up to 2 blocks (thin wall)
    if (window.VoxelWorld.setBlock) {
      window.VoxelWorld.setBlock(aheadX, floorY + 1, aheadZ, 0);
      window.VoxelWorld.setBlock(aheadX, floorY + 2, aheadZ, 0);
    }
  }

  // ── Fear nearby enemies ───────────────────────────────────────
  function _fearEnemies() {
    if (!_tank) return;
    var enemies = window._enemies || window._activeEnemies || [];
    var tankPos = _tank.group.position;
    for (var i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (!en || !en.position) continue;
      if (en._fearsTank && tankPos.distanceTo(en.position) < 15) {
        en._fleeing = true;
      }
    }
  }

  // ── Shell/projectile hit check ────────────────────────────────
  function _checkProjectileHits(proj, radius, dmgNear, dmgFar, radNear, radFar) {
    var enemies = window._enemies || window._activeEnemies || [];
    for (var i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (!en || !en.position) continue;
      var d = proj.position.distanceTo(en.position);
      if (d < radius) return true; // hit
    }
    // Ground check
    if (window.VoxelWorld && window.VoxelWorld.isSolid) {
      if (window.VoxelWorld.isSolid(proj.position.x, proj.position.y - 0.3, proj.position.z)) return true;
      if (window.VoxelWorld.isSolid(proj.position.x, proj.position.y, proj.position.z)) return true;
    }
    // Below ground fallback
    if (proj.position.y < -2) return true;
    return false;
  }

  // ── Take damage ────────────────────────────────────────────────
  function takeDamage(amount, source) {
    if (!_tank) return;
    // Immune to small arms
    if (source === 'bullet' || source === 'smallarms') return;
    _tankHP = Math.max(0, _tankHP - amount);
    if (_tankHP <= 0 && _active) {
      _tankDestroyExplosion();
      _exitTank();
      setTimeout(function () {
        if (_tank) {
          _scene.remove(_tank.group);
          _tank = null;
        }
      }, 400);
    }
  }

  // ── Update (main loop) ────────────────────────────────────────
  function update(dt) {
    if (!_tank) {
      // Update any lingering explosions/particles even if tank gone
      _updateExplosions(dt);
      _updateSmoke(dt);
      return;
    }

    var tg = _tank.group;

    // ── Turret rotation via mouse ──
    var turretDelta = _mouseDX * 0.003; // sensitivity
    // Clamp turret rate
    turretDelta = Math.max(-TURRET_RATE * dt, Math.min(TURRET_RATE * dt, turretDelta));
    _turretYaw += turretDelta;
    _mouseDX = 0;

    if (_active) {
      // ── Hull rotation ──
      var turnRate = TURN_RATE;
      if (_tankHP < HP_TRACK_DMG) turnRate *= 0.5; // track damage
      if (_keys.a) _yaw += turnRate * dt;
      if (_keys.d) _yaw -= turnRate * dt;

      // ── Acceleration ──
      if (_keys.w) {
        _speed += DRIVE_ACCEL * dt;
        if (_speed > DRIVE_MAX) _speed = DRIVE_MAX;
      } else if (_keys.s) {
        _speed -= DRIVE_ACCEL * dt;
        if (_speed < -DRIVE_MAX * 0.6) _speed = -DRIVE_MAX * 0.6;
      } else {
        // Friction
        if (_speed > 0) {
          _speed -= DRIVE_FRICTION * dt;
          if (_speed < 0) _speed = 0;
        } else if (_speed < 0) {
          _speed += DRIVE_FRICTION * dt;
          if (_speed > 0) _speed = 0;
        }
      }

      // ── Move hull ──
      var canMove = _canClimbAhead();
      if (!canMove && _speed > 0) {
        _tryCrushWall();
        _speed *= 0.3; // slow down on wall
      }

      tg.position.x += Math.sin(_yaw) * _speed * dt;
      tg.position.z += Math.cos(_yaw) * _speed * dt;

      // Simple terrain height snap
      if (window.VoxelWorld && window.VoxelWorld.isSolid) {
        var groundY = 0;
        for (var gy = 20; gy >= -2; gy--) {
          if (window.VoxelWorld.isSolid(tg.position.x, gy, tg.position.z)) {
            groundY = gy + 1;
            break;
          }
        }
        tg.position.y += (groundY - tg.position.y) * 0.2;
      }

      // ── Wheel spin ──
      _wheelSpin += _speed * dt * 2;
      for (var wi = 0; wi < _tank.wheels.length; wi++) {
        _tank.wheels[wi].rotation.y = _wheelSpin;
      }

      // ── Apply yaw to group ──
      tg.rotation.y = _yaw;

      // ── Turret visual ──
      _tank.turretGroup.rotation.y = _turretYaw;

      // ── Barrel recoil ──
      _recoilOffset += (0 - _recoilOffset) * Math.min(1, dt / RECOIL_RETURN * 3);
      _tank.barrelGroup.position.z = _recoilOffset;

      // ── Fire main gun ──
      _mainGunCooldown -= dt;
      if (_mainGunCooldown < 0) _mainGunCooldown = 0;
      if (_lmbDown) _fireMainGun();

      // ── Coax MG ──
      _mgCooldown -= dt;
      if (_mgCooldown < 0) _mgCooldown = 0;
      if (_rmbDown) _fireMG();

      // ── Engine sound ──
      _updateEngineSound(dt, _speed);
      window._vehicleSpeed = _speed;

      // ── Smoke exhaust at low HP ──
      if (_tankHP < HP_SMOKE && Math.random() < dt * 6) {
        _emitSmoke(tg.position);
      }

      // ── Fear nearby enemies ──
      _fearEnemies();

      // ── Camera ──
      _updateCamera();
    }

    // ── Proximity prompt (outside tank) ──
    if (!_active && _promptEl && _camera) {
      var dist = tg.position.distanceTo(_camera.position);
      if (dist <= ENTER_DIST) {
        _promptEl.style.display = 'block';
        _promptEl.textContent   = 'Press T to enter tank';
      } else if (dist <= NEARBY_DIST) {
        _promptEl.style.display = 'block';
        _promptEl.textContent   = 'TANK AVAILABLE';
      } else {
        _promptEl.style.display = 'none';
      }
    }

    // ── Update shells ──
    _updateShells(dt);
    // ── Update MG rounds ──
    _updateMGRounds(dt);
    // ── Update explosions ──
    _updateExplosions(dt);
    // ── Update smoke ──
    _updateSmoke(dt);
    // ── HUD ──
    _updateHUD();
  }

  function _updateShells(dt) {
    for (var i = _shells.length - 1; i >= 0; i--) {
      var sh = _shells[i];
      sh.life -= dt;
      sh.mesh.position.addScaledVector(sh.vel, dt);
      sh.mesh.position.y += sh.vel.y * dt;
      // Gravity
      sh.vel.y -= 9.8 * dt * 0.3;

      var hit = _checkProjectileHits(sh.mesh, 0.8, MAIN_GUN_DMG_NEAR, MAIN_GUN_DMG_FAR, MAIN_GUN_RADIUS_NEAR, MAIN_GUN_RADIUS_FAR);
      if (hit || sh.life <= 0) {
        _createExplosion(sh.mesh.position.clone(), false);
        _applyExplosionDamage(sh.mesh.position.clone(), MAIN_GUN_DMG_NEAR, MAIN_GUN_DMG_FAR, MAIN_GUN_RADIUS_NEAR, MAIN_GUN_RADIUS_FAR);
        _scene.remove(sh.mesh);
        _shells.splice(i, 1);
      }
    }
  }

  function _updateMGRounds(dt) {
    for (var i = _mgRounds.length - 1; i >= 0; i--) {
      var r = _mgRounds[i];
      r.life -= dt;
      r.mesh.position.addScaledVector(r.vel, dt);

      var hit = _checkProjectileHits(r.mesh, 0.4, r.damage, 0, 0.4, 0);
      if (hit) {
        // Damage nearest enemy
        var enemies = window._enemies || window._activeEnemies || [];
        for (var ei = 0; ei < enemies.length; ei++) {
          var en = enemies[ei];
          if (!en || !en.position) continue;
          var d = r.mesh.position.distanceTo(en.position);
          if (d < 0.8) {
            if (typeof en.takeDamage === 'function') en.takeDamage(r.damage);
            else if (en.hp !== undefined) en.hp -= r.damage;
            break;
          }
        }
      }

      if (hit || r.life <= 0) {
        _scene.remove(r.mesh);
        _mgRounds.splice(i, 1);
      }
    }
  }

  function _updateExplosions(dt) {
    for (var i = _explosions.length - 1; i >= 0; i--) {
      var ex = _explosions[i];
      ex.life -= dt;
      var t = ex.life / ex.maxLife;

      if (ex.light) {
        ex.light.intensity = t * 6;
        if (ex.life <= 0) _scene.remove(ex.light);
      }

      for (var pi = ex.particles.length - 1; pi >= 0; pi--) {
        var p = ex.particles[pi];
        p.userData.vy -= 9.8 * dt;
        p.position.x += p.userData.vx * dt;
        p.position.y += p.userData.vy * dt;
        p.position.z += p.userData.vz * dt;
        if (p.material) p.material.opacity = t;
        if (ex.life <= 0) {
          _scene.remove(p);
          ex.particles.splice(pi, 1);
        }
      }

      if (ex.life <= 0) {
        _explosions.splice(i, 1);
      }
    }
  }

  function _updateSmoke(dt) {
    for (var i = _smokeParticles.length - 1; i >= 0; i--) {
      var sp = _smokeParticles[i];
      sp.userData.life -= dt;
      sp.position.y += sp.userData.vy * dt;
      sp.position.x += (Math.random() - 0.5) * 0.05;
      var alpha = sp.userData.life / sp.userData.maxLife;
      if (sp.material) sp.material.opacity = alpha * 0.4;
      if (sp.userData.life <= 0) {
        _scene.remove(sp);
        _smokeParticles.splice(i, 1);
      }
    }
  }

  // ── Bind / unbind events ──────────────────────────────────────
  function _bindEvents() {
    if (_bound) return;
    _bound = true;
    window.addEventListener('keydown',     _onKeyDown,     false);
    window.addEventListener('keyup',       _onKeyUp,       false);
    window.addEventListener('mousemove',   _onMouseMove,   false);
    window.addEventListener('mousedown',   _onMouseDown,   false);
    window.addEventListener('mouseup',     _onMouseUp,     false);
    window.addEventListener('contextmenu', _onContextMenu, false);
  }

  function _unbindEvents() {
    _bound = false;
    window.removeEventListener('keydown',     _onKeyDown,     false);
    window.removeEventListener('keyup',       _onKeyUp,       false);
    window.removeEventListener('mousemove',   _onMouseMove,   false);
    window.removeEventListener('mousedown',   _onMouseDown,   false);
    window.removeEventListener('mouseup',     _onMouseUp,     false);
    window.removeEventListener('contextmenu', _onContextMenu, false);
  }

  // ── Public API ────────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;
    _buildHUD();
    _bindEvents();

    // Expose takeDamage globally so missiles/rockets can call it
    window._tankControlsTakeDamage = takeDamage;
  }

  function spawnTank(x, y, z) {
    // Remove existing tank first
    if (_tank) {
      _scene.remove(_tank.group);
      _tank = null;
    }
    _tankHP          = _tankMaxHP;
    _speed           = 0;
    _yaw             = 0;
    _turretYaw       = 0;
    _mainGunCooldown = 0;
    _mgCooldown      = 0;
    _mgAmmo          = 500;
    _recoilOffset    = 0;
    _recoilVel       = 0;

    _buildTank(x, y !== undefined ? y : 0, z !== undefined ? z : 0);
  }

  function reset() {
    _exitTank();
    _stopEngine();

    // Remove tank mesh
    if (_tank) {
      _scene.remove(_tank.group);
      _tank = null;
    }

    // Clean up shells
    for (var i = 0; i < _shells.length; i++) _scene.remove(_shells[i].mesh);
    _shells = [];

    for (var i = 0; i < _mgRounds.length; i++) _scene.remove(_mgRounds[i].mesh);
    _mgRounds = [];

    for (var i = 0; i < _explosions.length; i++) {
      if (_explosions[i].light) _scene.remove(_explosions[i].light);
      for (var pi = 0; pi < _explosions[i].particles.length; pi++) {
        _scene.remove(_explosions[i].particles[pi]);
      }
    }
    _explosions = [];

    for (var i = 0; i < _smokeParticles.length; i++) _scene.remove(_smokeParticles[i]);
    _smokeParticles = [];

    for (var i = 0; i < _scorches.length; i++) _scene.remove(_scorches[i]);
    _scorches = [];

    // Remove HUD
    if (_hudEl    && _hudEl.parentNode)    _hudEl.parentNode.removeChild(_hudEl);
    if (_promptEl && _promptEl.parentNode) _promptEl.parentNode.removeChild(_promptEl);
    if (_statusEl && _statusEl.parentNode) _statusEl.parentNode.removeChild(_statusEl);
    _hudEl = null; _promptEl = null; _statusEl = null;

    _unbindEvents();

    _tankHP          = 500;
    _speed           = 0;
    _yaw             = 0;
    _turretYaw       = 0;
    _mainGunCooldown = 0;
    _mgCooldown      = 0;
    _mgAmmo          = 500;
    _active          = false;

    window._playerInVehicle = false;
    window._playerInTank    = false;
    window._vehicleSpeed    = 0;
  }

  return {
    init:       init,
    update:     update,
    spawnTank:  spawnTank,
    reset:      reset,
    takeDamage: takeDamage
  };

})();
