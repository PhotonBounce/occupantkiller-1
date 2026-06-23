// ============================================================
//  driveable-car.js — Civilian/Jeep-style Driveable Car
//
//  A civilian/jeep-style enterable vehicle.
//  Controls (while driving):
//    W/S   = accelerate / brake
//    A/D   = steer left / right
//    Space = handbrake (drift/slide)
//    E     = exit vehicle
//
//  Public API: init(scene,camera,controls), update(dt), reset(),
//              enter(), exit(), isActive()
// ============================================================
window.DriveableCar = (function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────
  var _scene    = null;
  var _gameCam  = null;
  var _controls = null;
  var _bound    = false;

  // Array of spawned car objects so multiple cars can exist
  var _cars    = [];   // [{ group, wheels[], hp, maxHp, vx, vz, yaw, smokeEl, fireEl, ... }]
  var _current = null; // car the player is currently driving
  var _active  = false;

  // Chase camera
  var _chaseCam = null;

  // HUD element
  var _hudEl = null;

  // Smoke/fire visual timers per car
  // (stored on the car object itself)

  // Input state
  var _key = { w: false, s: false, a: false, d: false, space: false };

  // Wheel spin accumulator (radians)
  var _wheelSpin = 0;

  // Expose globals
  window._playerInVehicle = false;
  window._vehicleSpeed    = 0;

  // ── Constants ───────────────────────────────────────────────
  var DRIVE_ACCEL    = 8;    // u/s²
  var DRIVE_MAX      = 18;   // u/s
  var DRIVE_FRICTION = 4.5;  // u/s² passive deceleration
  var BRAKE_FRICTION = 12;   // u/s² when S held as brake
  var HAND_BRAKE_FRIC= 22;   // u/s² handbrake
  var TURN_RATE_BASE = 1.6;  // rad/s at low speed
  var TURN_RATE_MIN  = 0.5;  // rad/s at max speed (wider turns fast)
  var ENTER_DIST     = 2.5;  // units for proximity prompt
  var RAM_SPEED_MIN  = 6;    // u/s — minimum speed to deal ram damage
  var RAM_DAMAGE     = 80;
  var HP_MAX         = 350;
  var SMOKE_HP       = 150;
  var FIRE_HP        = 50;
  var CAM_BACK       = 6;    // units behind car
  var CAM_UP         = 3;    // units above car

  // ── Build geometry ──────────────────────────────────────────
  function _buildCar() {
    var g = new THREE.Group();

    // Body
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x7A7040 });
    var body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 4.2), bodyMat);
    body.position.y = 0.65;
    g.add(body);

    // Roof (slightly darker)
    var roofMat = new THREE.MeshLambertMaterial({ color: 0x5A5228 });
    var roof = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 2.4), roofMat);
    roof.position.set(0, 1.4, 0.1);
    g.add(roof);

    // Windshield (front, semi-transparent)
    var windshieldMat = new THREE.MeshLambertMaterial({
      color: 0x889988,
      transparent: true,
      opacity: 0.4
    });
    var windshield = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 0.1), windshieldMat);
    windshield.position.set(0, 1.3, -1.29);
    windshield.rotation.x = -0.25;
    g.add(windshield);

    // Rear windshield
    var rearWind = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 0.1), windshieldMat);
    rearWind.position.set(0, 1.3, 1.29);
    rearWind.rotation.x = 0.2;
    g.add(rearWind);

    // Bumpers
    var bumpMat = new THREE.MeshLambertMaterial({ color: 0x333322 });
    var bumpF = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.22, 0.18), bumpMat);
    bumpF.position.set(0, 0.3, -2.2);
    g.add(bumpF);
    var bumpR = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.22, 0.18), bumpMat);
    bumpR.position.set(0, 0.3, 2.2);
    g.add(bumpR);

    // Wheels — 4 corners
    var wheelMat  = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var rimMat    = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var wheelPositions = [
      { x: -1.1, z: -1.35 }, // front-left
      { x:  1.1, z: -1.35 }, // front-right
      { x: -1.1, z:  1.35 }, // rear-left
      { x:  1.1, z:  1.35 }  // rear-right
    ];
    var wheels = [];
    for (var wi = 0; wi < 4; wi++) {
      var wp = wheelPositions[wi];
      var wheelGroup = new THREE.Group();
      wheelGroup.position.set(wp.x, 0.4, wp.z);
      // Tyre
      var tyre = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12), wheelMat);
      tyre.rotation.z = Math.PI / 2;
      wheelGroup.add(tyre);
      // Rim disc
      var rim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.31, 8), rimMat);
      rim.rotation.z = Math.PI / 2;
      wheelGroup.add(rim);
      g.add(wheelGroup);
      wheels.push(wheelGroup);
    }

    // Headlights (front)
    var hlMat = new THREE.MeshLambertMaterial({ color: 0xFFFFCC, emissive: 0xFFFFCC, emissiveIntensity: 0.6 });
    var hlL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.18, 0.08), hlMat);
    hlL.position.set(-0.7, 0.72, -2.12);
    g.add(hlL);
    var hlR = hlL.clone();
    hlR.position.x = 0.7;
    g.add(hlR);

    // Headlight point lights
    var lightL = new THREE.PointLight(0xFFFFCC, 2, 15);
    lightL.position.set(-0.7, 0.72, -2.3);
    g.add(lightL);
    var lightR = new THREE.PointLight(0xFFFFCC, 2, 15);
    lightR.position.set(0.7, 0.72, -2.3);
    g.add(lightR);

    // Tail lights (rear)
    var tlMat = new THREE.MeshLambertMaterial({ color: 0xFF2200, emissive: 0xFF0000, emissiveIntensity: 0.5 });
    var tlL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.08), tlMat);
    tlL.position.set(-0.75, 0.72, 2.12);
    g.add(tlL);
    var tlR = tlL.clone();
    tlR.position.x = 0.75;
    g.add(tlR);

    // Tail light point lights (dim red)
    var tailLightL = new THREE.PointLight(0xFF0000, 1, 4);
    tailLightL.position.set(-0.7, 0.72, 2.3);
    g.add(tailLightL);
    var tailLightR = new THREE.PointLight(0xFF0000, 1, 4);
    tailLightR.position.set(0.7, 0.72, 2.3);
    g.add(tailLightR);

    // Exhaust pipe (rear, low-right)
    var exhaustMat = new THREE.MeshLambertMaterial({ color: 0x444433 });
    var exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8), exhaustMat);
    exhaust.rotation.z = Math.PI / 2;
    exhaust.position.set(0.85, 0.25, 2.0);
    g.add(exhaust);

    // Hood detail (raised center ridge)
    var hoodMat = new THREE.MeshLambertMaterial({ color: 0x6A6035 });
    var hoodRidge = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.07, 1.6), hoodMat);
    hoodRidge.position.set(0, 1.13, -1.05);
    g.add(hoodRidge);

    g.castShadow  = false;
    g.receiveShadow = false;

    return { group: g, wheels: wheels };
  }

  // ── Spawn a car at a position ───────────────────────────────
  function _spawnCar(pos) {
    if (!_scene) return null;
    var built = _buildCar();
    built.group.position.copy(pos || new THREE.Vector3(0, 0, 0));
    _scene.add(built.group);
    var car = {
      group:   built.group,
      wheels:  built.wheels,
      hp:      HP_MAX,
      maxHp:   HP_MAX,
      vx:      0,
      vz:      0,
      yaw:     0,
      onFire:  false,
      smoking: false,
      exploded: false,
      fireTimer: 0,
      smokeTimer: 0,
      fireParticles: []
    };
    _cars.push(car);
    return car;
  }

  function _removeCar(car) {
    if (!car) return;
    try { _scene.remove(car.group); } catch (e) {}
    for (var i = _cars.length - 1; i >= 0; i--) {
      if (_cars[i] === car) { _cars.splice(i, 1); break; }
    }
  }

  // ── Ensure chase camera ─────────────────────────────────────
  function _ensureChaseCam() {
    if (_chaseCam) return _chaseCam;
    _chaseCam = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 1500);
    return _chaseCam;
  }

  // ── HUD ─────────────────────────────────────────────────────
  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'driveable-car-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:48px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.55)',
      'color:#dde8cc',
      'font-family:monospace',
      'font-size:13px',
      'padding:5px 14px',
      'border-radius:6px',
      'pointer-events:none',
      'display:none',
      'z-index:180',
      'text-align:center',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (!_active || !_current) { _hudEl.style.display = 'none'; return; }
    _hudEl.style.display = 'block';
    var spd   = Math.sqrt(_current.vx * _current.vx + _current.vz * _current.vz);
    var ratio = Math.min(1, spd / DRIVE_MAX);
    // Speed gauge: 6 left arrows + 6 right arrows, filled proportionally
    var totalBars = 6;
    var filled    = Math.round(ratio * totalBars);
    var gauge = '';
    for (var li = 0; li < totalBars; li++) {
      gauge += (li < filled) ? '◄' : '◂';
    }
    gauge += ' ';
    for (var ri = 0; ri < totalBars; ri++) {
      gauge += (ri < filled) ? '►' : '▸';
    }
    var hpColor = _current.hp > SMOKE_HP ? '#88ff88' : (_current.hp > FIRE_HP ? '#ffaa33' : '#ff4444');
    _hudEl.innerHTML =
      '<span style="color:#aaddaa">' + gauge + '</span>' +
      '&nbsp;&nbsp;' +
      '<span style="color:' + hpColor + '">VEHICLE HP: ' + Math.max(0, Math.ceil(_current.hp)) + '</span>';
  }

  // ── Ram / collision check ───────────────────────────────────
  function _checkRamCollision(car, dt) {
    var spd = Math.sqrt(car.vx * car.vx + car.vz * car.vz);
    if (spd < RAM_SPEED_MIN) return;
    if (!window.Enemies || !window.Enemies.getAll) return;
    var all = window.Enemies.getAll();
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (!e || e.dead || !e.mesh) continue;
      var dx = e.mesh.position.x - car.group.position.x;
      var dz = e.mesh.position.z - car.group.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 2.4) {
        // Deal ram damage
        try {
          if (window.Enemies.damageInRadius) {
            window.Enemies.damageInRadius(e.mesh.position.clone(), 1.2, RAM_DAMAGE, 'VEHICLE_RAM');
          }
        } catch (err) {}
        // Visual slam
        try {
          if (window.Tracers && window.Tracers.spawnExplosion) {
            window.Tracers.spawnExplosion(e.mesh.position.clone(), 1.0);
          }
        } catch (err) {}
        // Push enemy away
        try {
          if (e.mesh) {
            var pushDir = new THREE.Vector3(dx, 0, dz).normalize();
            e.mesh.position.addScaledVector(pushDir, 3.5);
            if (typeof e.vy !== 'undefined') e.vy = 6;
          }
        } catch (err) {}
      }
    }
  }

  // ── Damage / destruction ────────────────────────────────────
  function _triggerExplosion(car) {
    if (car.exploded) return;
    car.exploded = true;
    try {
      if (window.Tracers && window.Tracers.spawnExplosion) {
        window.Tracers.spawnExplosion(car.group.position.clone().add(new THREE.Vector3(0, 1, 0)), 5.0);
      }
      if (window.AudioSystem && window.AudioSystem.playExplosion) {
        window.AudioSystem.playExplosion(1.8, true);
      }
    } catch (e) {}
    // If player was driving this car, eject them
    if (_current === car && _active) {
      try {
        var vp = car.group.position;
        _gameCam.position.set(vp.x + 4, vp.y + 2, vp.z);
      } catch (e) {}
      try { if (window.HUD && window.HUD.showToast) window.HUD.showToast('CAR DESTROYED — EJECTED', 3000, '#ff5555'); } catch (e) {}
      _active = false;
      _current = null;
      window._playerInVehicle = false;
      window._vehicleSpeed    = 0;
      try { if (window.GameManager) window.GameManager.__driveableCarCam = null; } catch (e) {}
      _hudEl && (_hudEl.style.display = 'none');
    }
    // Remove wreck after a moment
    try { _scene.remove(car.group); } catch (e) {}
    for (var i = _cars.length - 1; i >= 0; i--) {
      if (_cars[i] === car) { _cars.splice(i, 1); break; }
    }
  }

  // ── Enter / Exit ────────────────────────────────────────────
  function enter() {
    // Find nearest car to player
    if (!_gameCam) return;
    var px = _gameCam.position.x, pz = _gameCam.position.z;
    var nearest = null, nearestDist = 1e9;
    for (var i = 0; i < _cars.length; i++) {
      var car = _cars[i];
      if (car.exploded) continue;
      var dx = car.group.position.x - px;
      var dz = car.group.position.z - pz;
      var d  = Math.sqrt(dx * dx + dz * dz);
      if (d < ENTER_DIST && d < nearestDist) {
        nearestDist = d;
        nearest = car;
      }
    }
    if (!nearest) return; // no car in range
    _current = nearest;
    _active  = true;
    window._playerInVehicle = true;
    _ensureChaseCam();
    try { if (window.GameManager) window.GameManager.__driveableCarCam = _chaseCam; } catch (e) {}
    try {
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast('CAR — W/S: drive  A/D: steer  SPACE: handbrake  E: exit', 4000, '#ccddaa');
      }
    } catch (e) {}
  }

  function exit() {
    if (!_active || !_current) return;
    var car = _current;
    _active  = false;
    _current = null;
    window._playerInVehicle = false;
    window._vehicleSpeed    = 0;
    try { if (window.GameManager) window.GameManager.__driveableCarCam = null; } catch (e) {}
    // Place player beside the car
    try {
      if (_gameCam) {
        var vp = car.group.position;
        _gameCam.position.set(vp.x + 2.5, vp.y + 1.7, vp.z);
      }
    } catch (e) {}
    _hudEl && (_hudEl.style.display = 'none');
  }

  function isActive() { return _active; }

  // ── Spawn API ───────────────────────────────────────────────
  // Call this from game-manager or level-setup to place cars in the world
  function spawnAt(pos) {
    if (!_scene) {
      _scene = (typeof window !== 'undefined' && window._gameScene) ||
               (typeof window !== 'undefined' && window.GameManager && window.GameManager.getScene && window.GameManager.getScene()) || null;
    }
    if (!_gameCam && typeof window !== 'undefined' && window.GameManager && window.GameManager.getCamera) {
      _gameCam = window.GameManager.getCamera();
    }
    if (!_scene) return null;
    return _spawnCar(pos);
  }

  // ── Input ────────────────────────────────────────────────────
  function _onKeyDown(ev) {
    if (!_active) return;
    if (ev.code === 'KeyW') _key.w = true;
    else if (ev.code === 'KeyS') _key.s = true;
    else if (ev.code === 'KeyA') _key.a = true;
    else if (ev.code === 'KeyD') _key.d = true;
    else if (ev.code === 'Space') { _key.space = true; ev.preventDefault(); }
    else if (ev.code === 'KeyE' && !ev.repeat) exit();
    else if (ev.code === 'Escape') exit();
  }
  function _onKeyUp(ev) {
    if (ev.code === 'KeyW')     _key.w     = false;
    else if (ev.code === 'KeyS') _key.s    = false;
    else if (ev.code === 'KeyA') _key.a    = false;
    else if (ev.code === 'KeyD') _key.d    = false;
    else if (ev.code === 'Space') _key.space = false;
  }

  function _bind() {
    if (_bound) return;
    _bound = true;
    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup',   _onKeyUp);
  }

  // ── Main update ──────────────────────────────────────────────
  function update(dt) {
    if (!dt || dt <= 0) return;

    // Update all cars (smoke/fire even when not driving)
    for (var ci = 0; ci < _cars.length; ci++) {
      var car = _cars[ci];
      if (car.exploded) continue;

      // Check damage thresholds for visual effects
      car.smoking = (car.hp <= SMOKE_HP && car.hp > 0);
      car.onFire  = (car.hp <= FIRE_HP  && car.hp > 0);

      if (car.onFire) {
        car.fireTimer += dt;
        // Simple fire: flash emissive on group
        if (car.fireTimer > 0.08) {
          car.fireTimer = 0;
          // Tint body orange intermittently
          try {
            car.group.traverse(function(obj) {
              if (obj.isMesh && obj.material && obj.material.emissive) {
                obj.material.emissive.setHex(Math.random() > 0.5 ? 0xff4400 : 0x000000);
                obj.material.emissiveIntensity = 0.6;
              }
            });
          } catch (e) {}
        }
      } else if (car.smoking) {
        car.smokeTimer += dt;
      }

      // Only drive if player is in this car
      if (car !== _current || !_active) continue;

      // Driving physics
      var fwdInput  = (_key.w ? 1 : 0) - (_key.s ? 1 : 0);
      var turnInput = (_key.a ? 1 : 0) - (_key.d ? 1 : 0);
      var handbrake = _key.space;

      // Speed-proportional turn rate (faster = wider turns)
      var spd = Math.sqrt(car.vx * car.vx + car.vz * car.vz);
      var speedRatio = Math.min(1, spd / DRIVE_MAX);
      var turnRate = TURN_RATE_BASE - speedRatio * (TURN_RATE_BASE - TURN_RATE_MIN);
      // Only steer if moving
      if (spd > 0.3) {
        var steerDir = fwdInput >= 0 ? 1 : -1;
        car.yaw += turnInput * turnRate * dt * steerDir;
      }
      car.group.rotation.y = car.yaw;

      // Forward direction
      var fx = -Math.sin(car.yaw);
      var fz = -Math.cos(car.yaw);

      // Accelerate
      if (fwdInput !== 0) {
        car.vx += fx * fwdInput * DRIVE_ACCEL * dt;
        car.vz += fz * fwdInput * DRIVE_ACCEL * dt;
      }

      // Speed cap
      if (spd > DRIVE_MAX) {
        var overRatio = DRIVE_MAX / spd;
        car.vx *= overRatio;
        car.vz *= overRatio;
      }

      // Friction
      var fric;
      if (handbrake) {
        fric = HAND_BRAKE_FRIC * dt;
        // Handbrake drift: lateral velocity not aligned with heading decays slower
        // — apply friction more aggressively
      } else if (_key.s && fwdInput < 0 && spd > 0.5) {
        fric = BRAKE_FRICTION * dt;
      } else {
        fric = DRIVE_FRICTION * dt;
      }

      if (spd > fric) {
        var decel = fric / spd;
        car.vx -= car.vx * decel;
        car.vz -= car.vz * decel;
      } else {
        car.vx = 0;
        car.vz = 0;
      }

      // Move
      car.group.position.x += car.vx * dt;
      car.group.position.z += car.vz * dt;

      // Terrain snap
      try {
        if (window.VoxelWorld && VoxelWorld.getTerrainHeight) {
          var th = VoxelWorld.getTerrainHeight(car.group.position.x, car.group.position.z);
          if (typeof th === 'number') car.group.position.y = th;
        }
      } catch (e) {}

      // Spin wheels proportional to speed (roll around X axis)
      var spdNow = Math.sqrt(car.vx * car.vx + car.vz * car.vz);
      _wheelSpin += spdNow * dt * 2.5 * (fwdInput < 0 ? -1 : 1);
      for (var wi = 0; wi < car.wheels.length; wi++) {
        car.wheels[wi].rotation.x = _wheelSpin;
      }

      // Ram collision check
      _checkRamCollision(car, dt);

      // Chase camera
      var cam = _ensureChaseCam();
      var camTargetX = car.group.position.x + Math.sin(car.yaw) * CAM_BACK;
      var camTargetY = car.group.position.y + CAM_UP;
      var camTargetZ = car.group.position.z + Math.cos(car.yaw) * CAM_BACK;
      cam.position.lerp(new THREE.Vector3(camTargetX, camTargetY, camTargetZ), 0.18);
      var lookAt = new THREE.Vector3(car.group.position.x, car.group.position.y + 0.9, car.group.position.z);
      cam.lookAt(lookAt);

      // Sync main camera position so enemy AI tracks player
      try {
        if (_gameCam) {
          _gameCam.position.set(car.group.position.x, car.group.position.y + 1.5, car.group.position.z);
        }
      } catch (e) {}

      // Update globals
      window._vehicleSpeed = spdNow;

      // Explosion at 0 HP
      if (car.hp <= 0) {
        _triggerExplosion(car);
        break;
      }
    }

    _updateHUD();
  }

  // ── Reset (called between levels) ───────────────────────────
  function reset() {
    // Remove all cars
    for (var i = 0; i < _cars.length; i++) {
      try { if (_scene) _scene.remove(_cars[i].group); } catch (e) {}
    }
    _cars.length = 0;
    _current = null;
    _active  = false;
    window._playerInVehicle = false;
    window._vehicleSpeed    = 0;
    _wheelSpin = 0;
    _key.w = _key.s = _key.a = _key.d = _key.space = false;
    try { if (window.GameManager) window.GameManager.__driveableCarCam = null; } catch (e) {}
    _hudEl && (_hudEl.style.display = 'none');
  }

  // ── External damage hook ─────────────────────────────────────
  function takeDamage(amount, car) {
    var target = car || _current;
    if (!target) return;
    target.hp = Math.max(0, target.hp - amount);
  }

  // ── Init ─────────────────────────────────────────────────────
  function init(scene, camera, controls) {
    _scene    = scene;
    _gameCam  = camera;
    _controls = controls;
    _cars.length = 0;
    _current = null;
    _active  = false;
    _wheelSpin = 0;
    _key.w = _key.s = _key.a = _key.d = _key.space = false;
    window._playerInVehicle = false;
    window._vehicleSpeed    = 0;
    _bind();
    _createHUD();

    // Spawn 2 cars at fixed road positions (relative to origin)
    // Game-manager may also call spawnAt() explicitly for level-specific spots
    var pos1 = new THREE.Vector3(12, 0, 8);
    var pos2 = new THREE.Vector3(-15, 0, 22);
    try {
      if (window.VoxelWorld && VoxelWorld.getTerrainHeight) {
        pos1.y = VoxelWorld.getTerrainHeight(pos1.x, pos1.z) || 0;
        pos2.y = VoxelWorld.getTerrainHeight(pos2.x, pos2.z) || 0;
      }
    } catch (e) {}
    _spawnCar(pos1);
    _spawnCar(pos2);
  }

  // ── Proximity check helper (for game-manager E key handler) ──
  function getNearestCar(playerPos) {
    if (!playerPos) return null;
    var nearest = null, nearestDist = ENTER_DIST;
    for (var i = 0; i < _cars.length; i++) {
      var car = _cars[i];
      if (car.exploded) continue;
      var dx = car.group.position.x - playerPos.x;
      var dz = car.group.position.z - playerPos.z;
      var d  = Math.sqrt(dx * dx + dz * dz);
      if (d < nearestDist) { nearestDist = d; nearest = car; }
    }
    return nearest;
  }

  return {
    init:          init,
    update:        update,
    enter:         enter,
    exit:          exit,
    reset:         reset,
    isActive:      isActive,
    spawnAt:       spawnAt,
    takeDamage:    takeDamage,
    getNearestCar: getNearestCar,
    getCars:       function() { return _cars; }
  };
})();
