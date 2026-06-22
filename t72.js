// ============================================================
//  t72.js — T-72B3 Main Battle Tank (player-capturable)
//
//  Real-world reference (T-72B3):
//    - Main gun: 2A46M 125mm smoothbore cannon
//      (APFSDS, HEAT, HE-FRAG, 9M119 Refleks ATGM)
//    - Coax:    PKT 7.62mm machine gun (~800 rpm)
//    - Crew 3, tracked, ~60–72 km/h road
//    - Kontakt-5 ERA (Explosive Reactive Armor) blocks on hull & turret
//
//  Controls (while driving):
//    WASD  = drive (W/S throttle, A/D steer)
//    Mouse = aim turret (yaw + pitch)
//    LMB   = 125mm cannon (primary)
//    RMB   = PKT coax 7.62mm (secondary)
//    V     = swap FP/TP view
//    E     = exit vehicle
//
//  Public API: init(scene,camera,controls), update(dt), clear(),
//              spawnAt(pos), enter(), exit(), isActive(), getHealth()
// ============================================================
window.T72 = (function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────
  var _scene = null, _gameCam = null, _controls = null;
  var _bound = false;
  var _vehicle = null;       // { group, turret, gunMount, barrel, vx, vz, yaw, hp }
  var _active = false;       // player is driving
  var _chaseCam = null;      // 3rd-person camera
  var _camYaw = 0, _camPitch = -0.18;
  var _turretYaw = 0, _turretPitch = 0;
  var _fpvMode = false;      // true = gunner sight view, false = 3rd-person chase
  var _fpvOverlay = null;    // turret-sight crosshair DOM element
  var _hud = null;           // bottom-left HUD element

  // Fire timing
  var _cannonCool = 0;       // 2.5s reload
  var _pktCool = 0;          // 0.12s cyclic
  var _firingCannon = false, _firingPkt = false;
  var _cannonAmmo = 32;      // onboard rounds

  // Screen shake
  var _shakeTimer = 0;
  var _shakeAmount = 0;

  // Visual extras
  var _muzzleFlashes = [];   // { mesh, life }
  var _projectiles = [];     // fast-moving shells

  // Input
  var _key = { w: false, s: false, a: false, d: false };

  // Constants
  var CANNON_RELOAD   = 2.5;   // seconds between shots
  var PKT_INTERVAL    = 0.12;  // ~500 rpm
  var CANNON_DMG      = 500;
  var PKT_DMG         = 25;
  var DRIVE_ACCEL     = 5.0;
  var DRIVE_MAX       = 12;    // m/s (~43 km/h, realistic for tank)
  var DRIVE_FRICTION  = 2.5;
  var TURN_RATE       = 1.2;   // rad/s
  var BARREL_LEN      = 3.5;   // 125mm barrel length
  var ARMOR_MITIGATION = 0.80; // 80% damage reduction when player is inside

  // ── Mesh: procedural T-72B3 ──────────────────────────────
  function _build() {
    var g = new THREE.Group();

    var hullMat   = new THREE.MeshLambertMaterial({ color: 0x5c6b40 }); // Russian green
    var darkMat   = new THREE.MeshLambertMaterial({ color: 0x1a1a1a }); // black/very dark
    var eraMat    = new THREE.MeshLambertMaterial({ color: 0x6a7a4a }); // ERA tile green

    // ── Hull ──
    var hull = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 4.0), hullMat);
    hull.position.y = 0.75;
    g.add(hull);

    // Front slope (glacis — T-72 has very pronounced front slope)
    var glacis = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.85, 1.0), hullMat);
    glacis.position.set(0, 0.78, -2.1);
    glacis.rotation.x = -0.65;
    g.add(glacis);

    // Rear hull extension
    var rear = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 0.4), hullMat);
    rear.position.set(0, 0.6, 2.15);
    g.add(rear);

    // ── Tracks (left / right) ──
    var trackMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    for (var t = 0; t < 2; t++) {
      var tx = (t === 0) ? -1.3 : 1.3;
      var trk = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.55, 4.2), trackMat);
      trk.position.set(tx, 0.38, 0);
      g.add(trk);
      // Road wheels — T-72 has 6 per side
      for (var w = 0; w < 6; w++) {
        var wh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.38, 0.38, 0.32, 10),
          new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
        );
        wh.rotation.z = Math.PI / 2;
        wh.position.set(tx, 0.38, -2.0 + w * 0.82);
        g.add(wh);
      }
    }

    // ── ERA tiles on hull sides (Kontakt-5) ──
    for (var side = 0; side < 2; side++) {
      var ex = (side === 0) ? -1.28 : 1.28;
      for (var row = 0; row < 2; row++) {
        for (var col = 0; col < 4; col++) {
          var era = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.06, 0.35), eraMat);
          era.position.set(ex, 0.72 + row * 0.16, -1.2 + col * 0.8);
          era.rotation.z = (side === 0) ? -0.12 : 0.12;
          g.add(era);
        }
      }
    }

    // ERA tiles on front hull
    for (var fe = 0; fe < 3; fe++) {
      var feBlock = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.06, 0.35), eraMat);
      feBlock.position.set(-0.5 + fe * 0.5, 1.1, -2.3);
      feBlock.rotation.x = -0.65;
      g.add(feBlock);
    }

    // ── Turret group (yaws independently) ──
    var turret = new THREE.Group();
    turret.position.set(0, 1.35, -0.3);
    g.add(turret);

    // Turret box — T-72 has a distinctive rounded/squat turret
    var turBox = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 2.0), hullMat);
    turret.add(turBox);

    // ERA on turret front face
    for (var te = 0; te < 4; te++) {
      var teBlock = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.06, 0.35), eraMat);
      teBlock.position.set(-0.55 + te * 0.35, 0.0, -1.05);
      teBlock.rotation.x = -0.1;
      turret.add(teBlock);
    }

    // ERA on turret sides
    for (var ts = 0; ts < 2; ts++) {
      var tsx = (ts === 0) ? -0.94 : 0.94;
      for (var tb = 0; tb < 3; tb++) {
        var tsb = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.35), eraMat);
        tsb.position.set(tsx, 0.05, -0.4 + tb * 0.5);
        turret.add(tsb);
      }
    }

    // Commander's hatch (small box on turret top)
    var hatch = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.55), hullMat);
    hatch.position.set(0.3, 0.46, -0.3);
    turret.add(hatch);

    // Cupola vision blocks
    var cupolaRing = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.18, 10), hullMat);
    cupolaRing.position.set(0.3, 0.5, -0.3);
    turret.add(cupolaRing);

    // Ventilator dome (T-72 characteristic feature on turret)
    var vent = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.18, 8), hullMat);
    vent.position.set(-0.4, 0.46, 0.2);
    turret.add(vent);

    // ── Gun mount group (pitches independently) ──
    var gunMount = new THREE.Group();
    gunMount.position.set(0, 0.0, 0.5);
    turret.add(gunMount);

    // Mantlet
    var mantlet = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.5), hullMat);
    gunMount.add(mantlet);

    // 125mm main barrel — CylinderGeometry rotated to point forward
    var barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.09, BARREL_LEN, 12),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.0, BARREL_LEN / 2 + 0.22);
    gunMount.add(barrel);

    // Bore evacuator (T-72 distinctive mid-barrel bulge)
    var evacuator = new THREE.Mesh(
      new THREE.CylinderGeometry(0.115, 0.115, 0.45, 10),
      new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
    );
    evacuator.rotation.x = Math.PI / 2;
    evacuator.position.set(0, 0.0, BARREL_LEN * 0.35 + 0.22);
    gunMount.add(evacuator);

    // PKT coaxial machine gun (right of mantlet)
    var pkt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.045, 1.5, 8),
      new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
    );
    pkt.rotation.x = Math.PI / 2;
    pkt.position.set(0.28, -0.1, 1.0);
    gunMount.add(pkt);

    // Smoke grenade dischargers (left side of turret, 3 tubes each side)
    for (var sg = 0; sg < 3; sg++) {
      var dL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.25, 8),
        new THREE.MeshLambertMaterial({ color: 0x222222 })
      );
      dL.position.set(-0.94, 0.25, -0.3 - sg * 0.22);
      dL.rotation.x = -0.4; dL.rotation.z = -0.2;
      turret.add(dL);

      var dR = dL.clone();
      dR.position.x = 0.94; dR.rotation.z = 0.2;
      turret.add(dR);
    }

    // Antenna
    var ant = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.022, 2.0, 6),
      new THREE.MeshLambertMaterial({ color: 0x111111 })
    );
    ant.position.set(-0.7, 1.05, 0.6);
    turret.add(ant);

    g.castShadow = false;
    g.receiveShadow = false;

    return { group: g, turret: turret, gunMount: gunMount, barrel: barrel };
  }

  function _spawnVehicle(pos) {
    var built = _build();
    built.group.position.copy(pos || new THREE.Vector3(0, 0, 0));
    _scene.add(built.group);
    _vehicle = {
      group: built.group,
      turret: built.turret,
      gunMount: built.gunMount,
      barrel: built.barrel,
      vx: 0, vz: 0, yaw: 0,
      hp: 1800, maxHp: 1800
    };
    return _vehicle;
  }

  function spawnAt(pos) {
    if (!_scene) {
      _scene = (typeof window !== 'undefined' && window._gameScene) ||
               (typeof window !== 'undefined' && window.GameManager && window.GameManager.getScene && window.GameManager.getScene()) || null;
    }
    if (!_gameCam && typeof window !== 'undefined' && window.GameManager && window.GameManager.getCamera) {
      _gameCam = window.GameManager.getCamera();
    }
    if (!_scene) return null;
    if (_vehicle) try { _scene.remove(_vehicle.group); } catch (e) {}
    _cannonAmmo = 32;
    _cannonCool = 0;
    _pktCool = 0;
    return _spawnVehicle(pos);
  }

  function _ensureChaseCam() {
    if (_chaseCam) return _chaseCam;
    _chaseCam = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);
    return _chaseCam;
  }

  // ── HUD ────────────────────────────────────────────────────
  function _createHud() {
    if (_hud) return;
    var d = document.createElement('div');
    d.id = 't72-hud';
    d.style.cssText = 'position:fixed;bottom:18px;left:18px;background:rgba(0,0,0,0.6);color:#ff4444;' +
      'font-family:monospace;font-size:13px;padding:6px 12px;border:1px solid rgba(255,68,68,0.4);' +
      'border-radius:4px;pointer-events:none;display:none;z-index:160;';
    document.body.appendChild(d);
    _hud = d;
  }

  function _updateHud() {
    if (!_hud) _createHud();
    if (!_hud) return;
    _hud.style.display = _active ? 'block' : 'none';
    if (_active) {
      var reloading = _cannonCool > 0 ? ' [' + _cannonCool.toFixed(1) + 's]' : '';
      _hud.textContent = '🔴 T-72 | Shell: ' + _cannonAmmo + reloading + ' | PKT: ∞';
    }
  }

  function enter() {
    if (!_vehicle) {
      var px = _gameCam ? _gameCam.position.x : 0;
      var pz = _gameCam ? _gameCam.position.z : 0;
      var py = 0;
      try { if (window.VoxelWorld && VoxelWorld.getTerrainHeight) py = VoxelWorld.getTerrainHeight(px, pz) || 0; } catch (e) {}
      _spawnVehicle(new THREE.Vector3(px, py, pz - 6));
    }
    _active = true;
    _fpvMode = false;
    _camYaw = _vehicle.group.rotation.y;
    _camPitch = -0.18;
    _turretYaw = 0; _turretPitch = 0;
    _ensureChaseCam();
    try {
      if (window.GameManager) window.GameManager.__t72Cam = _chaseCam;
    } catch (e) {}
    try {
      window.HUD && window.HUD.showToast && window.HUD.showToast(
        '🛡️ T-72 CAPTURED! [WASD] drive [MOUSE] turret [LMB] cannon [RMB] PKT [V] FP/TP view [E] exit',
        5500, '#ff8888'
      );
    } catch (e) {}
    try {
      if (window.AudioSystem && window.AudioSystem.playVehicleIdle) {
        _vehicle.idleHandle = window.AudioSystem.playVehicleIdle(600);
      }
    } catch (e) {}
    _createHud();
    _updateHud();
  }

  function exit() {
    if (!_active) return;
    _active = false;
    _fpvMode = false;
    _showFPVOverlay(false);
    if (_hud) _hud.style.display = 'none';
    try { if (_vehicle && _vehicle.idleHandle && _vehicle.idleHandle.stop) _vehicle.idleHandle.stop(); } catch (e) {}
    try { if (window.GameManager) window.GameManager.__t72Cam = null; } catch (e) {}
    try {
      if (_vehicle && _gameCam) {
        var vp = _vehicle.group.position;
        _gameCam.position.set(vp.x + 3, vp.y + 1.8, vp.z);
      }
    } catch (e) {}
  }

  function isActive() { return _active; }
  function getHealth() { return _vehicle ? _vehicle.hp : 0; }
  function getVehicle() { return _vehicle; }

  // Armor mitigation: player takes 20% of incoming damage
  function takeDamage(amount) {
    if (!_vehicle) return;
    var mitigated = _active ? amount * (1 - ARMOR_MITIGATION) : amount;
    _vehicle.hp = Math.max(0, _vehicle.hp - mitigated);
    if (_vehicle.hp <= 0 && _active) {
      try { window.HUD && window.HUD.showToast && window.HUD.showToast('💥 T-72 DESTROYED', 3500, '#ff5555'); } catch (e) {}
      try {
        if (window.Tracers && window.Tracers.spawnExplosion) {
          window.Tracers.spawnExplosion(_vehicle.group.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 8.0);
        }
        if (window.AudioSystem && window.AudioSystem.playExplosion) window.AudioSystem.playExplosion(2.0, true);
      } catch (e) {}
      exit();
    }
  }

  // ── Firing ─────────────────────────────────────────────────
  function _muzzleWorld() {
    if (!_vehicle) return new THREE.Vector3();
    var v = new THREE.Vector3(0, 0, BARREL_LEN + 0.25);
    v.applyMatrix4(_vehicle.gunMount.matrixWorld);
    return v;
  }

  function _aimDirWorld() {
    if (!_vehicle) return new THREE.Vector3(0, 0, 1);
    var d = new THREE.Vector3(0, 0, 1);
    d.applyQuaternion(_vehicle.gunMount.getWorldQuaternion(new THREE.Quaternion()));
    return d.normalize();
  }

  function _fireCannon() {
    if (_cannonCool > 0 || !_vehicle || _cannonAmmo <= 0) return;
    _cannonCool = CANNON_RELOAD;
    _cannonAmmo = Math.max(0, _cannonAmmo - 1);

    var origin = _muzzleWorld();
    var dir = _aimDirWorld();

    // Large muzzle flash sphere
    var flashMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.9 })
    );
    flashMesh.position.copy(origin);
    _scene.add(flashMesh);
    _muzzleFlashes.push({ mesh: flashMesh, life: 0.2 });

    // Tracer/projectile
    try {
      if (window.Tracers && window.Tracers.spawnTracer) {
        window.Tracers.spawnTracer(origin.clone(), dir.clone(), 0xffaa00, 150);
      }
      if (window.Tracers && window.Tracers.spawnMuzzleFlash) {
        window.Tracers.spawnMuzzleFlash(origin.clone(), dir.clone());
      }
    } catch (e) {}

    // Hitscan with large AOE
    var hitPos = _hitscan(origin, dir, 150);
    if (hitPos) {
      try {
        if (window.Tracers && window.Tracers.spawnExplosion) {
          window.Tracers.spawnExplosion(hitPos, 5.5);
        }
        if (window.Enemies && window.Enemies.damageInRadius) {
          window.Enemies.damageInRadius(hitPos, 5.5, CANNON_DMG, 'EXPLOSIVE');
        }
      } catch (e) {}
    }

    // Screen shake
    _shakeTimer = 0.1;
    _shakeAmount = 0.15;

    // Audio
    try {
      if (window.AudioSystem && window.AudioSystem.playT72Cannon) {
        window.AudioSystem.playT72Cannon();
      } else if (window.AudioSystem && window.AudioSystem.playExplosion) {
        window.AudioSystem.playExplosion(1.2, false);
      }
    } catch (e) {}

    // Recoil
    _vehicle.gunMount.rotation.x += 0.08;

    _updateHud();
  }

  function _firePkt() {
    if (_pktCool > 0 || !_vehicle) return;
    _pktCool = PKT_INTERVAL;

    var origin = _muzzleWorld();
    origin.x += 0.3; // slight offset for coax
    var dir = _aimDirWorld();

    try {
      if (window.Tracers && window.Tracers.spawnTracer) {
        window.Tracers.spawnTracer(origin.clone(), dir.clone(), 0xffcc44, 200);
      }
    } catch (e) {}

    var hitPos = _hitscan(origin, dir, 200);
    if (hitPos && window.Enemies && window.Enemies.damageInRadius) {
      try { window.Enemies.damageInRadius(hitPos, 0.5, PKT_DMG, 'BULLET'); } catch (e) {}
    }
  }

  function _hitscan(origin, dir, maxDist) {
    if (!window.Enemies || !window.Enemies.getAll) return null;
    var all = window.Enemies.getAll();
    var bestT = 1e9, bestPos = null;
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (!e || e.dead || !e.mesh) continue;
      var to = e.mesh.position.clone().sub(origin);
      var t = to.dot(dir);
      if (t < 0 || t > maxDist) continue;
      var perp = to.sub(dir.clone().multiplyScalar(t)).length();
      if (perp > 1.6) continue;
      if (t < bestT) { bestT = t; bestPos = e.mesh.position.clone(); }
    }
    return bestPos;
  }

  // ── FPV Overlay (gunner sight) ─────────────────────────────
  function _createFPVOverlay() {
    if (_fpvOverlay) return;
    var d = document.createElement('div');
    d.id = 't72-fpv-overlay';
    d.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;display:none;z-index:150;';
    // T-72 gunner's sight reticle — simpler than Bradley, Soviet style
    d.innerHTML = '<svg width="100%" height="100%" style="position:absolute;top:0;left:0">' +
      // Center cross
      '<line x1="50%" y1="43%" x2="50%" y2="47%" stroke="#ff4400" stroke-width="1.8" opacity="0.95"/>' +
      '<line x1="50%" y1="53%" x2="50%" y2="57%" stroke="#ff4400" stroke-width="1.8" opacity="0.95"/>' +
      '<line x1="43%" y1="50%" x2="47%" y2="50%" stroke="#ff4400" stroke-width="1.8" opacity="0.95"/>' +
      '<line x1="53%" y1="50%" x2="57%" y2="50%" stroke="#ff4400" stroke-width="1.8" opacity="0.95"/>' +
      // Small center dot
      '<circle cx="50%" cy="50%" r="1%" fill="none" stroke="#ff4400" stroke-width="1.2" opacity="0.9"/>' +
      // Outer range circle
      '<circle cx="50%" cy="50%" r="5%" fill="none" stroke="#ff4400" stroke-width="0.5" opacity="0.35"/>' +
      // Range stadia marks
      '<line x1="50%" y1="46%" x2="51.5%" y2="46%" stroke="#ff4400" stroke-width="0.9" opacity="0.6"/>' +
      '<line x1="50%" y1="48%" x2="51%" y2="48%" stroke="#ff4400" stroke-width="0.9" opacity="0.6"/>' +
      '<line x1="50%" y1="52%" x2="51%" y2="52%" stroke="#ff4400" stroke-width="0.9" opacity="0.6"/>' +
      '<line x1="50%" y1="54%" x2="51.5%" y2="54%" stroke="#ff4400" stroke-width="0.9" opacity="0.6"/>' +
      // Corner brackets
      '<line x1="38%" y1="38%" x2="42%" y2="38%" stroke="#ff4400" stroke-width="1" opacity="0.3"/>' +
      '<line x1="38%" y1="38%" x2="38%" y2="42%" stroke="#ff4400" stroke-width="1" opacity="0.3"/>' +
      '<line x1="62%" y1="38%" x2="58%" y2="38%" stroke="#ff4400" stroke-width="1" opacity="0.3"/>' +
      '<line x1="62%" y1="38%" x2="62%" y2="42%" stroke="#ff4400" stroke-width="1" opacity="0.3"/>' +
      '<line x1="38%" y1="62%" x2="42%" y2="62%" stroke="#ff4400" stroke-width="1" opacity="0.3"/>' +
      '<line x1="38%" y1="62%" x2="38%" y2="58%" stroke="#ff4400" stroke-width="1" opacity="0.3"/>' +
      '<line x1="62%" y1="62%" x2="58%" y2="62%" stroke="#ff4400" stroke-width="1" opacity="0.3"/>' +
      '<line x1="62%" y1="62%" x2="62%" y2="58%" stroke="#ff4400" stroke-width="1" opacity="0.3"/>' +
      // Ammo readout
      '<text x="64%" y="62%" font-family="monospace" font-size="12" fill="#ff6644" opacity="0.85" id="t72fpv-ammo">125mm</text>' +
      '<text x="64%" y="65%" font-family="monospace" font-size="10" fill="#ff8866" opacity="0.65" id="t72fpv-rld">RDY</text>' +
      '</svg>';
    document.body.appendChild(d);
    _fpvOverlay = d;
  }

  function _showFPVOverlay(show) {
    if (!_fpvOverlay) _createFPVOverlay();
    if (_fpvOverlay) _fpvOverlay.style.display = show ? 'block' : 'none';
    if (show && _fpvOverlay) {
      var rldEl = _fpvOverlay.querySelector('#t72fpv-rld');
      if (rldEl) rldEl.textContent = _cannonCool > 0 ? 'RELOADING ' + _cannonCool.toFixed(1) + 's' : _cannonAmmo + ' RDY';
    }
  }

  function toggleViewMode() {
    if (!_active) return;
    _fpvMode = !_fpvMode;
    _showFPVOverlay(_fpvMode);
    try {
      if (window.HUD && window.HUD.notifyPickup) {
        window.HUD.notifyPickup(_fpvMode ? '🔭 GUNNER SIGHT — first person' : '🎥 THIRD PERSON VIEW', '#ff8844');
      }
    } catch (e) {}
  }

  function getActiveCamera() {
    if (_fpvMode) return null;
    return _chaseCam;
  }

  // ── Main update tick ───────────────────────────────────────
  function update(dt) {
    if (_cannonCool > 0) _cannonCool -= dt;
    if (_pktCool    > 0) _pktCool    -= dt;

    // Muzzle flash fadeout
    for (var fi = _muzzleFlashes.length - 1; fi >= 0; fi--) {
      var fl = _muzzleFlashes[fi];
      fl.life -= dt;
      if (fl.life <= 0) {
        _scene.remove(fl.mesh);
        _muzzleFlashes.splice(fi, 1);
      } else {
        fl.mesh.material.opacity = fl.life / 0.2 * 0.9;
        fl.mesh.scale.setScalar(1.0 + (0.2 - fl.life) * 3.0);
      }
    }

    if (!_active || !_vehicle) return;

    // Drive
    var fwdInput  = (_key.w ? 1 : 0) - (_key.s ? 1 : 0);
    var turnInput = (_key.a ? 1 : 0) - (_key.d ? 1 : 0);
    _vehicle.yaw += turnInput * TURN_RATE * dt * (Math.abs(fwdInput) > 0.05 ? 1 : 0.5);
    _vehicle.group.rotation.y = _vehicle.yaw;
    var fx = -Math.sin(_vehicle.yaw), fz = -Math.cos(_vehicle.yaw);
    _vehicle.vx += fx * fwdInput * DRIVE_ACCEL * dt;
    _vehicle.vz += fz * fwdInput * DRIVE_ACCEL * dt;

    var spd = Math.sqrt(_vehicle.vx * _vehicle.vx + _vehicle.vz * _vehicle.vz);
    if (spd > DRIVE_MAX) {
      _vehicle.vx = _vehicle.vx / spd * DRIVE_MAX;
      _vehicle.vz = _vehicle.vz / spd * DRIVE_MAX;
    }
    var fric = DRIVE_FRICTION * dt;
    if (Math.abs(_vehicle.vx) > fric) _vehicle.vx -= Math.sign(_vehicle.vx) * fric; else _vehicle.vx = 0;
    if (Math.abs(_vehicle.vz) > fric) _vehicle.vz -= Math.sign(_vehicle.vz) * fric; else _vehicle.vz = 0;
    _vehicle.group.position.x += _vehicle.vx * dt;
    _vehicle.group.position.z += _vehicle.vz * dt;

    // Snap to terrain
    try {
      if (window.VoxelWorld && VoxelWorld.getTerrainHeight) {
        var th = VoxelWorld.getTerrainHeight(_vehicle.group.position.x, _vehicle.group.position.z);
        if (typeof th === 'number') _vehicle.group.position.y = th;
      }
    } catch (e) {}

    // Idle audio rpm
    try {
      if (_vehicle.idleHandle && _vehicle.idleHandle.setRpm) {
        var rpm = 600 + Math.min(1, spd / DRIVE_MAX) * 1200;
        _vehicle.idleHandle.setRpm(rpm);
      }
    } catch (e) {}

    // Turret follows camera
    _turretYaw   = _camYaw - _vehicle.yaw;
    _turretPitch = Math.max(-0.15, Math.min(0.35, _camPitch + 0.05));
    _vehicle.turret.rotation.y   = _turretYaw;
    _vehicle.gunMount.rotation.x = -_turretPitch;

    // Auto-fire
    if (_firingCannon) _fireCannon();
    if (_firingPkt)    _firePkt();

    // Screen shake application
    if (_shakeTimer > 0) {
      _shakeTimer -= dt;
      if (_gameCam) {
        _gameCam.position.y += _shakeAmount * Math.sin(_shakeTimer * Math.PI / 0.1);
      }
    }

    // Update reload HUD readout
    _updateHud();

    if (_fpvMode && _gameCam && _vehicle) {
      // FPV: gunner's sight, slightly below commander hatch
      var turWPos = new THREE.Vector3();
      _vehicle.turret.getWorldPosition(turWPos);
      _gameCam.position.set(turWPos.x, turWPos.y + 0.7, turWPos.z);
      var totalYaw = _vehicle.yaw + _turretYaw;
      _gameCam.rotation.set(0, 0, 0, 'YXZ');
      _gameCam.rotation.y = totalYaw + Math.PI;
      _gameCam.rotation.x = _turretPitch * 0.9;
      _showFPVOverlay(true);
    } else {
      _showFPVOverlay(false);
      // 3rd-person chase: 8 units back, 3 units up
      var cam = _ensureChaseCam();
      var s = Math.sin(_camYaw), c = Math.cos(_camYaw);
      var camPos = new THREE.Vector3(
        _vehicle.group.position.x + 8.0 * s,
        _vehicle.group.position.y + 3.0,
        _vehicle.group.position.z + 8.0 * c
      );
      cam.position.lerp(camPos, 0.22);
      var look = new THREE.Vector3(_vehicle.group.position.x, _vehicle.group.position.y + 1.4, _vehicle.group.position.z);
      cam.lookAt(look);
      cam.updateProjectionMatrix();
    }

    // Sync main cam position so enemy AI tracks this vehicle
    try {
      if (_gameCam && !_fpvMode) {
        _gameCam.position.set(_vehicle.group.position.x, _vehicle.group.position.y + 1.5, _vehicle.group.position.z);
      }
    } catch (e) {}

    // Recoil restore
    if (_vehicle.gunMount.rotation.x > -_turretPitch) {
      _vehicle.gunMount.rotation.x -= dt * 1.5;
    }
  }

  function clear() {
    if (_vehicle) try { _scene.remove(_vehicle.group); } catch (e) {}
    _vehicle = null; _active = false;
    for (var fi = 0; fi < _muzzleFlashes.length; fi++) {
      try { _scene.remove(_muzzleFlashes[fi].mesh); } catch (e) {}
    }
    _muzzleFlashes.length = 0;
    if (_hud) _hud.style.display = 'none';
    try { if (window.GameManager) window.GameManager.__t72Cam = null; } catch (e) {}
  }

  // ── Input ───────────────────────────────────────────────────
  function _onKeyDown(ev) {
    if (!_active) return;
    if      (ev.code === 'KeyW') _key.w = true;
    else if (ev.code === 'KeyS') _key.s = true;
    else if (ev.code === 'KeyA') _key.a = true;
    else if (ev.code === 'KeyD') _key.d = true;
    else if (ev.code === 'KeyV' && !ev.repeat) toggleViewMode();
    else if (ev.code === 'KeyE' && !ev.repeat) exit();
    else if (ev.code === 'Escape') exit();
  }
  function _onKeyUp(ev) {
    if (ev.code === 'KeyW') _key.w = false;
    else if (ev.code === 'KeyS') _key.s = false;
    else if (ev.code === 'KeyA') _key.a = false;
    else if (ev.code === 'KeyD') _key.d = false;
  }
  function _onMouseMove(ev) {
    if (!_active) return;
    var dx = ev.movementX || 0, dy = ev.movementY || 0;
    _camYaw   -= dx * 0.0022;
    _camPitch -= dy * 0.0018;
    if (_camPitch < -0.55) _camPitch = -0.55;
    if (_camPitch >  0.42) _camPitch =  0.42;
  }
  function _onMouseDown(ev) {
    if (!_active) return;
    if      (ev.button === 0) _firingCannon = true;
    else if (ev.button === 2) _firingPkt    = true;
  }
  function _onMouseUp(ev) {
    if (ev.button === 0) _firingCannon = false;
    else if (ev.button === 2) _firingPkt = false;
  }

  function _bind() {
    if (_bound) return;
    _bound = true;
    window.addEventListener('keydown',     _onKeyDown);
    window.addEventListener('keyup',       _onKeyUp);
    window.addEventListener('mousemove',   _onMouseMove);
    window.addEventListener('mousedown',   _onMouseDown);
    window.addEventListener('mouseup',     _onMouseUp);
    window.addEventListener('contextmenu', function (e) { if (_active) e.preventDefault(); });
  }

  function init(scene, camera, controls) {
    _scene = scene; _gameCam = camera; _controls = controls;
    _vehicle = null; _active = false;
    _fpvMode = false;
    _muzzleFlashes.length = 0;
    _key.w = _key.s = _key.a = _key.d = false;
    _firingCannon = _firingPkt = false;
    _cannonCool = 0; _pktCool = 0;
    _cannonAmmo = 32;
    _bind();
  }

  return {
    init: init, update: update, clear: clear,
    spawnAt: spawnAt, enter: enter, exit: exit,
    isActive: isActive, getHealth: getHealth, getVehicle: getVehicle,
    takeDamage: takeDamage,
    toggleViewMode: toggleViewMode, getActiveCamera: getActiveCamera,
    isFPV: function () { return _fpvMode; }
  };
})();
