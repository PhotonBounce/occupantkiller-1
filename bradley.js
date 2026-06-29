// ============================================================
//  bradley.js — M2A2 Bradley IFV (drivable) — Ukrainian 47th Mech Bde
//
//  Real-world reference (M2A2 ODS-SA Bradley in Ukraine):
//    - Main gun: M242 Bushmaster 25mm chain gun (200 rpm cyclic,
//      dual-feed alternating HE-T M792 / APDS-T M791)
//    - Coax:    M240C 7.62mm machine gun (~700 rpm, 1000+ rd belt)
//    - ATGM:    BGM-71 TOW-2 (2-tube launcher, right-side turret, 4.5km range)
//    - Smoke:   M250 smoke grenade launchers (8-tube, 2 banks of 4)
//    - Crew 3 + 6 dismounts, tracked, ~61 km/h road
//    - Upgraded in Ukraine: ERA tiles, anti-drone netting, counter-UAS EW
//
//  Controls (while mounted):
//    WASD       = drive (W/S throttle, A/D steer) — DRIVER position
//    Mouse      = aim turret (yaw + pitch) — GUNNER position
//    LMB        = M242 Bushmaster 25mm  (alt HE/AP)
//    RMB        = M240 coax 7.62mm (hold — overheats after 8s sustained)
//    Key 3 / T  = TOW-2 anti-tank missile (2 missiles, slow reload, guided)
//    Key 4 / X  = Smoke grenade screen (4 charges, 10s duration)
//    Key 1      = Switch to DRIVER position
//    Key 2      = Switch to GUNNER position (default)
//    Key 3      = Switch to COMMANDER position (TOW + spotting)
//    B          = enter / exit vehicle
//    V          = swap shoulder camera
//    M          = call Ukrainian mortar support (1 per 30s)
//
//  Public API: init(scene,camera,controls), update(dt), clear(),
//              spawnAt(pos), enter(), exit(), isActive(), getHealth(),
//              fireTOW(), launchSmoke(), callMortar()
// ============================================================
window.Bradley = (function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────
  var _scene = null, _gameCam = null, _controls = null;
  var _bound = false;
  var _vehicle = null;          // { group, hull, turret, barrel, coax, towL, towR, vx, vz, yaw, hp }
  var _active = false;          // player is driving
  var _chaseCam = null;         // 3rd-person camera
  var _camYaw = 0, _camPitch = -0.18;
  var _turretYaw = 0, _turretPitch = 0;
  var _shoulderSide = 1;        // +1 right, -1 left
  // Crew positions: 0=driver, 1=gunner(default), 2=commander
  var _crewPosition = 1;
  // Fire timing
  var _bushCool = 0;            // 0.30s cyclic = 200 rpm
  var _coaxCool = 0;            // 0.085s = 700 rpm
  var _firingBush = false, _firingCoax = false;
  var _heAp = 0;                // alt 0=HE, 1=AP
  var _rapidFire = false;       // arcade ~800 rpm "gatling" mode (enabled per-stage)
  var _rapidShot = 0;           // shot counter to throttle screen shake in rapid mode
  // TOW missile
  var _towAmmo = 2;
  var _towMaxAmmo = 2;
  var _towReloadTimer = 0;
  var _towReloadTime = 6.0;     // 6 seconds to reload tubes
  var _towReloading = false;
  var _towMissiles = [];        // active TOW missiles in flight
  // Smoke grenades
  var _smokeCharges = 4;
  var _smokeMaxCharges = 4;
  var _smokeCooldown = 0;
  var _smokeParticles = [];       // active smoke clouds
  // Coax MG overheating
  var _coaxHeat = 0;            // 0-1 heat level
  var _coaxOverheated = false;
  var _coaxHeatRate = 0.125;    // heat per second of firing
  var _coaxCoolRate = 0.35;     // heat dissipation per second
  var _coaxOverheatThreshold = 0.92;
  // Mortar support
  var _mortarCooldown = 0;
  var _mortarCooldownTime = 30.0;
  // Visual extras
  var _casings = [];
  var _projectiles = [];        // bushmaster shells (visible tracer + impact)
  // Input state
  var _key = { w: false, s: false, a: false, d: false };

  var BUSH_RPM_INTERVAL = 0.30;   // 200 rpm cyclic (authentic)
  var BUSH_RPM_RAPID    = 0.075;  // ~800 rpm arcade "gatling" mode
  var COAX_RPM_INTERVAL = 0.085;  // ~700 rpm
  var BUSH_DMG_HE = 70, BUSH_AOE = 2.6;
  var BUSH_DMG_AP = 95;
  var COAX_DMG = 20;
  var TOW_DMG = 600;              // one-shot kill on tanks
  var TOW_SPEED = 35;             // m/s
  var TOW_RANGE = 220;            // max effective range in game units
  var DRIVE_ACCEL = 7.5, DRIVE_MAX = 14, DRIVE_FRICTION = 3.0;
  var TURN_RATE = 1.2; // rad/s at full input
  var BARREL_LEN = 2.6;

  // ── Helpers ────────────────────────────────────────────────
  function _terrainY(x, z) {
    try { if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) return VoxelWorld.getTerrainHeight(x, z) || 0; } catch (e) {}
    return 0;
  }
  function _notify(msg, color, time) {
    try { if (window.HUD && window.HUD.showToast) window.HUD.showToast(msg, time || 3000, color || '#ffffff'); } catch (e) {}
  }

  // ── Mesh: procedural M2A2 ODS-SA (Ukraine variant) ───────
  function _build() {
    var g = new THREE.Group();

    // Hull — sloped armor body (olive drab, Ukrainian ERA)
    var hullMat = new THREE.MeshLambertMaterial({ color: 0x4a5530 });
    var hull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.6, 6.5), hullMat);
    hull.position.y = 1.05;
    g.add(hull);
    // Front glacis (sloped plate)
    var glacis = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.0, 1.6), hullMat);
    glacis.position.set(0, 1.05, -3.6);
    glacis.rotation.x = -0.55;
    g.add(glacis);
    // Rear ramp
    var ramp = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.4, 0.2), hullMat);
    ramp.position.set(0, 1.0, 3.3);
    g.add(ramp);
    // ERA blocks (Bradley Reactive Armor Tiles — Ukraine upgrade)
    var skirtMat = new THREE.MeshLambertMaterial({ color: 0x5a6540 });
    for (var sx = 0; sx < 2; sx++) {
      var x = sx === 0 ? -1.7 : 1.7;
      for (var b = 0; b < 6; b++) {
        var sk = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.85), skirtMat);
        sk.position.set(x, 0.95, -2.6 + b * 1.05);
        g.add(sk);
      }
    }
    // Anti-drone netting (cage armor on roof — common Ukraine mod)
    var cageMat = new THREE.MeshBasicMaterial({ color: 0x444444, wireframe: true, transparent: true, opacity: 0.35 });
    var cage = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.4, 5.0), cageMat);
    cage.position.set(0, 2.0, 0.2);
    g.add(cage);
    // Tracks (left/right)
    var trackMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    for (var t = 0; t < 2; t++) {
      var tx = t === 0 ? -1.85 : 1.85;
      var trk = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.6, 6.3), trackMat);
      trk.position.set(tx, 0.45, 0);
      g.add(trk);
      // Road wheels (6 per side)
      for (var w = 0; w < 6; w++) {
        var wh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.45, 0.45, 0.35, 12),
          new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
        );
        wh.rotation.z = Math.PI / 2;
        wh.position.set(tx, 0.45, -2.6 + w * 1.05);
        g.add(wh);
      }
    }

    // ── Turret group (yaws independently) ──
    var turret = new THREE.Group();
    turret.position.set(0, 1.85, -0.4);
    g.add(turret);

    var turMat = new THREE.MeshLambertMaterial({ color: 0x4a5530 });
    var turBox = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.85, 2.4), turMat);
    turret.add(turBox);
    // Commander's hatch + cupola
    var cupola = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 0.3, 12), turMat);
    cupola.position.set(0.5, 0.55, -0.2);
    turret.add(cupola);
    var hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.06, 12), new THREE.MeshLambertMaterial({ color: 0x2a3318 }));
    hatch.position.set(0.5, 0.73, -0.2);
    turret.add(hatch);
    // Gunner's sight (left side of turret)
    var sight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.35), new THREE.MeshLambertMaterial({ color: 0x222222 }));
    sight.position.set(-0.45, 0.35, 0.7);
    turret.add(sight);
    // Smoke grenade dischargers (2 banks of 4)
    for (var sgBank = 0; sgBank < 2; sgBank++) {
      for (var sg = 0; sg < 4; sg++) {
        var d = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.22, 8), new THREE.MeshLambertMaterial({ color: 0x222222 }));
        d.position.set(-0.75 + sgBank * 1.5 + sg * 0.16, 0.42, -1.15);
        d.rotation.x = -0.45;
        turret.add(d);
      }
    }
    // ── M242 Bushmaster 25mm chain gun (barrel pivots in pitch) ──
    var gunMount = new THREE.Group();
    gunMount.position.set(0, 0.05, 0.6);
    turret.add(gunMount);

    var mantlet = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.6), turMat);
    mantlet.position.set(0, 0, 0);
    gunMount.add(mantlet);

    var barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.085, BARREL_LEN, 12),
      new THREE.MeshLambertMaterial({ color: 0x111111 })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.05, BARREL_LEN / 2 + 0.25);
    gunMount.add(barrel);
    // Muzzle brake (slotted)
    var brake = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.22, 12), new THREE.MeshLambertMaterial({ color: 0x0a0a0a }));
    brake.rotation.x = Math.PI / 2;
    brake.position.set(0, 0.05, BARREL_LEN + 0.18);
    gunMount.add(brake);

    // ── M240C coax 7.62 (mounted on left of mantlet) ──
    var coax = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.05, 1.4, 10),
      new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
    );
    coax.rotation.x = Math.PI / 2;
    coax.position.set(-0.35, 0.0, 0.95);
    gunMount.add(coax);

    // ── BGM-71 TOW launcher (2-tube box on right of turret) ──
    var towGroup = new THREE.Group();
    towGroup.position.set(1.0, 0.25, 0.0);
    turret.add(towGroup);
    var towHousing = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 1.4), new THREE.MeshLambertMaterial({ color: 0x3a4528 }));
    towGroup.add(towHousing);
    var towL = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.5, 10), new THREE.MeshLambertMaterial({ color: 0x222222 }));
    towL.rotation.x = Math.PI / 2;
    towL.position.set(0, 0.12, 0.05);
    towGroup.add(towL);
    var towR = towL.clone();
    towR.position.y = -0.12;
    towGroup.add(towR);
    // Tube covers (open when loaded, closed when empty)
    var towCoverL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.02), new THREE.MeshLambertMaterial({ color: 0x333333 }));
    towCoverL.position.set(0, 0.12, 0.82);
    towGroup.add(towCoverL);
    var towCoverR = towCoverL.clone();
    towCoverR.position.y = -0.12;
    towGroup.add(towCoverR);
    towGroup.userData.towCoverL = towCoverL;
    towGroup.userData.towCoverR = towCoverR;

    // Antenna whips (2 — comms + counter-UAS EW)
    var ant1 = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.025, 1.8, 6), new THREE.MeshLambertMaterial({ color: 0x111111 }));
    ant1.position.set(-0.85, 0.95, -0.9);
    turret.add(ant1);
    var ant2 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 1.4, 6), new THREE.MeshLambertMaterial({ color: 0x222244 }));
    ant2.position.set(0.6, 0.95, -1.0);
    turret.add(ant2);

    g.castShadow = false; g.receiveShadow = false;
    return { group: g, turret: turret, gunMount: gunMount, barrel: barrel, brake: brake, towGroup: towGroup, towL: towL, towR: towR };
  }

  function _spawnVehicle(pos) {
    var built = _build();
    built.group.position.copy(pos || new THREE.Vector3(0, 0, 0));
    _scene.add(built.group);
    _vehicle = {
      group: built.group, turret: built.turret, gunMount: built.gunMount,
      barrel: built.barrel, brake: built.brake, towGroup: built.towGroup,
      towL: built.towL, towR: built.towR,
      vx: 0, vz: 0, yaw: 0, hp: 800, maxHp: 800,
      crew: { driver: true, gunner: true, commander: true }
    };
    _towAmmo = _towMaxAmmo;
    _smokeCharges = _smokeMaxCharges;
    _coaxHeat = 0;
    _coaxOverheated = false;
    _towReloading = false;
    _towReloadTimer = 0;
    _mortarCooldown = 0;
    _crewPosition = 1;
    return _vehicle;
  }

  function spawnAt(pos) {
    if (!_scene && typeof window !== 'undefined' && window.GameManager && GameManager.getScene) _scene = GameManager.getScene();
    if (!_scene) return null;
    if (_vehicle) try { _scene.remove(_vehicle.group); } catch (e) {}
    return _spawnVehicle(pos);
  }

  function _ensureChaseCam() {
    if (_chaseCam) return _chaseCam;
    _chaseCam = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1500);
    return _chaseCam;
  }

  function enter() {
    if (!_vehicle) {
      if (window.VehicleSystem && VehicleSystem.getNearestVehicle) {
        const playerPos = _gameCam ? _gameCam.position : {x:0,y:0,z:0};
        const nearest = VehicleSystem.getNearestVehicle('bradley', playerPos);
        if (nearest) { _vehicle = nearest; }
        else { _spawnVehicle(new THREE.Vector3(playerPos.x, _terrainY(playerPos.x, playerPos.z), playerPos.z - 6)); }
      } else {
        var px = _gameCam.position.x, pz = _gameCam.position.z;
        _spawnVehicle(new THREE.Vector3(px, _terrainY(px, pz), pz - 6));
      }
    }
    _active = true;
    _camYaw = _vehicle.group.rotation.y;
    _camPitch = -0.22;
    _turretYaw = 0; _turretPitch = 0;
    _crewPosition = 1; // default to gunner
    _ensureChaseCam();
    if (_gameCam && _vehicle && _vehicle.group) {
      _gameCam.position.copy(_vehicle.group.position).add(new THREE.Vector3(0, 1.25, -2.1));
      _gameCam.lookAt(_vehicle.group.position.x, _vehicle.group.position.y + 1.25, _vehicle.group.position.z + 4);
      if (!_vehicle.viewportSlit) {
        const slitGeo = new THREE.BoxGeometry(1.2, 0.12, 0.02);
        const slitMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const slit = new THREE.Mesh(slitGeo, slitMat);
        slit.position.set(0, 1.18, 2.7);
        slit.renderOrder = 9999;
        _vehicle.group.add(slit);
        _vehicle.viewportSlit = slit;
      }
    }
    try { if (window.GameManager) window.GameManager.__bradleyCam = _chaseCam; } catch (e) {}
    _showCrewHUD();
    try { window.AudioSystem && window.AudioSystem.playVehicleIdle && (_vehicle.idleHandle = window.AudioSystem.playVehicleIdle(800)); } catch (e) {}
  }

  function _showCrewHUD() {
    var posName = ['DRIVER', 'GUNNER', 'COMMANDER'][_crewPosition];
    var towStatus = _towAmmo > 0 ? (_towAmmo + 'x TOW') : (_towReloading ? 'RELOADING TOW...' : 'NO TOW');
    var smokeStatus = _smokeCharges + '/4 SMK';
    var heatStr = _coaxOverheated ? '🔥 OVERHEAT!' : ('HEAT ' + Math.round(_coaxHeat * 100) + '%');
    var mortarStr = _mortarCooldown <= 0 ? 'MORTAR READY [M]' : ('MORTAR ' + Math.ceil(_mortarCooldown) + 's');
    var msg = '🚛 BRADLEY — POS: ' + posName + ' | 25mm [LMB] | Coax [RMB] (' + heatStr + ') | TOW [3] (' + towStatus + ') | Smoke [4] (' + smokeStatus + ') | ' + mortarStr;
    try { if (window.HUD && window.HUD.showToast) window.HUD.showToast(msg, 5000, '#88ff88'); } catch (e) {}
  }

  function exit() {
    if (!_active) return;
    _active = false;
    try { if (_vehicle && _vehicle.idleHandle && _vehicle.idleHandle.stop) _vehicle.idleHandle.stop(); } catch (e) {}
    try { if (window.GameManager) window.GameManager.__bradleyCam = null; } catch (e) {}
    try {
      if (_vehicle && _gameCam) {
        var vp = _vehicle.group.position;
        _gameCam.position.set(vp.x + 3, vp.y + 1.7, vp.z);
      }
    } catch (e) {}
  }

  function isActive() { return _active; }
  function getHealth() { return _vehicle ? _vehicle.hp : 0; }
  function getVehicle() { return _vehicle; }
  function setRapidFire(on) { _rapidFire = !!on; }
  function getRapidFire() { return _rapidFire; }

  // ── Damage hook (called by external systems) ──
  function takeDamage(amount) {
    if (!_vehicle) return;
    // ERA blocks reduce damage from shaped charges (RPG/ATGM) by 40%
    var dmg = amount;
    if (amount > 60) dmg = amount * 0.65; // ERA vs heavy AT
    _vehicle.hp = Math.max(0, _vehicle.hp - dmg);
    if (_vehicle.hp <= 0 && _active) {
      _notify('💥 BRADLEY DESTROYED — CREW BAIL OUT!', '#ff5555', 3500);
      try {
        if (window.Tracers && window.Tracers.spawnExplosion) {
          window.Tracers.spawnExplosion(_vehicle.group.position.clone().add(new THREE.Vector3(0, 1, 0)), 6.5);
        }
        if (window.AudioSystem && window.AudioSystem.playExplosion) window.AudioSystem.playExplosion(1.5, true);
      } catch (e) {}
      exit();
    }
  }

  // ── Crew position switching ──
  function _switchCrewPosition(pos) {
    if (!_active || !_vehicle) return;
    if (pos < 0 || pos > 2) return;
    _crewPosition = pos;
    var names = ['DRIVER', 'GUNNER', 'COMMANDER'];
    _notify('👤 CREW: ' + names[pos], '#88ccff', 2000);
    // Commander gets spotting HUD markers
    if (pos === 2) {
      try { if (window.HUD && window.HUD.showToast) window.HUD.showToast('👁️ COMMANDER: Spotting mode — enemy markers visible. TOW [3] ready.', 3000, '#aaddff'); } catch (e) {}
    }
  }

  // ── TOW Missile ──
  function fireTOW() {
    if (!_active || !_vehicle || _towAmmo <= 0 || _towReloading) {
      if (_towAmmo <= 0) _notify('⚠️ NO TOW MISSILES — wait for reload', '#ffaa00', 2000);
      else if (_towReloading) _notify('⚠️ TOW TUBES RELOADING...', '#ffaa00', 2000);
      return;
    }
    _towAmmo--;
    var origin = _muzzleWorld();
    var dir = _aimDirWorld();
    // Launch from TOW tube (offset to right of turret)
    var launchOffset = new THREE.Vector3(1.0, 0.25, 0.0).applyMatrix4(_vehicle.turret.matrixWorld);
    origin.copy(launchOffset);
    // Find target — lock onto nearest enemy in front cone
    var target = _findTOWTarget(origin, dir);
    // Build missile mesh
    var mMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8),
      new THREE.MeshLambertMaterial({ color: 0xccaa44 })
    );
    mMesh.rotation.x = Math.PI / 2;
    mMesh.position.copy(origin);
    mMesh.lookAt(origin.clone().add(dir));
    _scene.add(mMesh);
    // Tracer glow
    var glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xff6600 })
    );
    glow.position.copy(origin);
    _scene.add(glow);
    _towMissiles.push({
      mesh: mMesh, glow: glow, pos: origin.clone(), dir: dir.clone(),
      speed: TOW_SPEED * 0.6, target: target, life: 8.0, arming: 0.3
    });
    // Backblast effect
    try { if (window.Tracers && window.Tracers.spawnExplosion) window.Tracers.spawnExplosion(origin.clone().add(new THREE.Vector3(0, 0.2, 0)), 2.0); } catch (e) {}
    try { if (window.AudioSystem && window.AudioSystem.playExplosion) window.AudioSystem.playExplosion(0.5, false); } catch (e) {}
    // Recoil
    _vehicle.gunMount.rotation.x += 0.12;
    _notify('🚀 TOW-' + (_towAmmo === 1 ? '2' : '1') + ' LAUNCHED | ' + _towAmmo + ' remain', '#ffcc44', 2500);
    // Reload when empty
    if (_towAmmo <= 0) { _towReloading = true; _towReloadTimer = _towReloadTime; }
    // Update tube covers
    if (_vehicle.towGroup) {
      if (_vehicle.towGroup.userData.towCoverL) _vehicle.towGroup.userData.towCoverL.visible = (_towAmmo >= 1);
      if (_vehicle.towGroup.userData.towCoverR) _vehicle.towGroup.userData.towCoverR.visible = (_towAmmo >= 2);
    }
  }

  function _findTOWTarget(origin, dir) {
    if (!window.Enemies || !window.Enemies.getAll) return null;
    var best = null, bestScore = -1;
    var all = window.Enemies.getAll();
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (!e || e.dead || !e.mesh) continue;
      var to = e.mesh.position.clone().sub(origin);
      var dist = to.length();
      if (dist < 8 || dist > TOW_RANGE) continue;
      to.normalize();
      var dot = to.dot(dir);
      if (dot < 0.5) continue; // must be within 60° cone
      // Prefer tanks/armor, then closer targets
      var score = dot * 100 + (dist < 40 ? 50 : 0) + (e.typeName === 'TANK' || e.typeName === 'BTR' ? 200 : 0);
      if (score > bestScore) { bestScore = score; best = e; }
    }
    return best;
  }

  function _updateTOWMissiles(dt) {
    for (var i = _towMissiles.length - 1; i >= 0; i--) {
      var m = _towMissiles[i];
      m.life -= dt;
      m.arming -= dt;
      // Guidance: steer toward target if locked
      if (m.target && m.target.mesh && !m.target.dead && m.arming <= 0) {
        var toTarget = m.target.mesh.position.clone().sub(m.pos).normalize();
        m.dir.lerp(toTarget, 0.08).normalize();
      }
      m.pos.add(m.dir.clone().multiplyScalar(m.speed * dt));
      m.mesh.position.copy(m.pos);
      m.glow.position.copy(m.pos);
      m.mesh.lookAt(m.pos.clone().add(m.dir));
      // Accelerate to terminal speed
      if (m.speed < TOW_SPEED) m.speed += 20 * dt;
      // Proximity detonation
      if (m.life <= 0 || (m.target && m.target.mesh && m.pos.distanceTo(m.target.mesh.position) < 2.5)) {
        // Explosion
        try {
          if (window.Tracers && window.Tracers.spawnExplosion) window.Tracers.spawnExplosion(m.pos, 5.5);
          if (window.Enemies && window.Enemies.damageInRadius) window.Enemies.damageInRadius(m.pos, 5.0, TOW_DMG, 'EXPLOSIVE');
          if (window.AudioSystem && window.AudioSystem.playExplosion) window.AudioSystem.playExplosion(1.0, true);
        } catch (e) {}
        // Direct hit on target
        if (m.target && !m.target.dead && m.pos.distanceTo(m.target.mesh.position) < 3.5) {
          try { if (window.Enemies && window.Enemies.damage) window.Enemies.damage(m.target, TOW_DMG); } catch (e) {}
        }
        _scene.remove(m.mesh); _scene.remove(m.glow);
        _towMissiles.splice(i, 1);
        continue;
      }
      // Ground hit
      var groundH = _terrainY(m.pos.x, m.pos.z);
      if (m.pos.y < groundH + 0.5) {
        try {
          if (window.Tracers && window.Tracers.spawnExplosion) window.Tracers.spawnExplosion(m.pos, 4.0);
          if (window.Enemies && window.Enemies.damageInRadius) window.Enemies.damageInRadius(m.pos, 4.0, TOW_DMG * 0.5, 'EXPLOSIVE');
        } catch (e) {}
        _scene.remove(m.mesh); _scene.remove(m.glow);
        _towMissiles.splice(i, 1);
      }
    }
  }

  // ── Smoke Grenade Screen ──
  function launchSmoke() {
    if (!_active || !_vehicle) return;
    if (_smokeCharges <= 0 || _smokeCooldown > 0) {
      _notify('⚠️ NO SMOKE CHARGES', '#ffaa00', 2000);
      return;
    }
    _smokeCharges--;
    _smokeCooldown = 3.0;
    var vp = _vehicle.group.position.clone();
    // Spawn smoke clouds in an arc around vehicle
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      var dist = 4 + Math.random() * 6;
      var sx = vp.x + Math.cos(angle) * dist;
      var sz = vp.z + Math.sin(angle) * dist;
      var sy = _terrainY(sx, sz) + 0.5 + Math.random() * 1.5;
      var cloud = new THREE.Mesh(
        new THREE.SphereGeometry(1.5 + Math.random() * 2.5, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.35 + Math.random() * 0.25 })
      );
      cloud.position.set(sx, sy, sz);
      _scene.add(cloud);
      _smokeParticles.push({ mesh: cloud, life: 10.0 + Math.random() * 4.0, grow: 0.3 + Math.random() * 0.4 });
    }
    _notify('💨 SMOKE SCREEN DEPLOYED — ' + _smokeCharges + '/4 remain', '#aaddaa', 2500);
    try { if (window.AudioSystem && window.AudioSystem.playExplosion) window.AudioSystem.playExplosion(0.2, false); } catch (e) {}
  }

  function _updateSmokeParticles(dt) {
    for (var i = _smokeParticles.length - 1; i >= 0; i--) {
      var sp = _smokeParticles[i];
      sp.life -= dt;
      sp.mesh.scale.x += sp.grow * dt;
      sp.mesh.scale.y += sp.grow * dt * 0.5;
      sp.mesh.scale.z += sp.grow * dt;
      sp.mesh.position.y += 0.4 * dt; // drift up
      sp.mesh.material.opacity = Math.max(0, (sp.life / 14) * 0.5);
      if (sp.life <= 0) { _scene.remove(sp.mesh); _smokeParticles.splice(i, 1); }
    }
  }

  // ── Mortar Support Call ──
  function callMortar() {
    if (!_active || !_vehicle) return;
    if (_mortarCooldown > 0) {
      _notify('⚠️ MORTAR COOLDOWN: ' + Math.ceil(_mortarCooldown) + 's', '#ffaa00', 2000);
      return;
    }
    _mortarCooldown = _mortarCooldownTime;
    var vp = _vehicle.group.position.clone();
    var aimDir = _aimDirWorld();
    var target = vp.clone().add(aimDir.clone().multiplyScalar(40 + Math.random() * 20));
    // 3-round mortar burst
    for (var i = 0; i < 3; i++) {
      (function(idx) {
        setTimeout(function() {
          if (!_scene) return;
          var mx = target.x + (Math.random() - 0.5) * 8;
          var mz = target.z + (Math.random() - 0.5) * 8;
          var my = _terrainY(mx, mz);
          try {
            if (window.Tracers && window.Tracers.spawnExplosion) window.Tracers.spawnExplosion(new THREE.Vector3(mx, my + 1, mz), 5.0);
            if (window.Enemies && window.Enemies.damageInRadius) window.Enemies.damageInRadius(new THREE.Vector3(mx, my + 1, mz), 6.0, 120, 'EXPLOSIVE');
            if (window.AudioSystem && window.AudioSystem.playExplosion) window.AudioSystem.playExplosion(0.8, true);
          } catch (e) {}
        }, idx * 800);
      })(i);
    }
    _notify('🎯 UKRAINIAN MORTAR SUPPORT INCOMING — 3 rounds', '#44aaff', 3000);
  }

  // ── Firing ─────────────────────────────────────────────────
  function _muzzleWorld() {
    if (!_vehicle) return new THREE.Vector3();
    var v = new THREE.Vector3(0, 0, BARREL_LEN + 0.35);
    v.applyMatrix4(_vehicle.gunMount.matrixWorld);
    return v;
  }
  function _aimDirWorld() {
    if (!_vehicle) return new THREE.Vector3(0, 0, 1);
    var d = new THREE.Vector3(0, 0, 1);
    d.applyQuaternion(_vehicle.gunMount.getWorldQuaternion(new THREE.Quaternion()));
    return d.normalize();
  }

  function _fireBushmaster() {
    if (_bushCool > 0 || !_vehicle) return;
    _bushCool = _rapidFire ? BUSH_RPM_RAPID : BUSH_RPM_INTERVAL;
    var origin = _muzzleWorld();
    var dir = _aimDirWorld();
    var isHE = (_heAp++ % 2 === 0);
    var color = isHE ? 0xff8833 : 0xfff066;
    try {
      if (window.Tracers && window.Tracers.spawnTracer) window.Tracers.spawnTracer(origin.clone(), dir.clone(), color, 220);
      if (window.Tracers && window.Tracers.spawnMuzzleFlash) window.Tracers.spawnMuzzleFlash(origin.clone(), dir.clone());
    } catch (e) {}
    var hitPos = _hitscan(origin, dir, 220, isHE);
    if (hitPos) {
      try {
        if (isHE) {
          if (window.Tracers && window.Tracers.spawnExplosion) window.Tracers.spawnExplosion(hitPos, BUSH_AOE * 1.3);
          if (window.Enemies && window.Enemies.damageInRadius) window.Enemies.damageInRadius(hitPos, BUSH_AOE, BUSH_DMG_HE, 'EXPLOSIVE');
        }
      } catch (e) {}
    }
    // Rake the treeline: fell destructible trees along the line of fire
    try {
      if (window.WorldFeatures && WorldFeatures.findTreeNear && WorldFeatures.damageTree) {
        var _probe = origin.clone().add(dir.clone().multiplyScalar(16 + Math.random() * 64));
        var _tree = WorldFeatures.findTreeNear(_probe.x, _probe.y, _probe.z, 3.5);
        if (_tree) WorldFeatures.damageTree(_tree, isHE ? 30 : 18);
      }
    } catch (e) {}
    try { if (window.AudioSystem && window.AudioSystem.playExplosion) window.AudioSystem.playExplosion(0.35, false); } catch (e) {}
    _ejectCasing(true);
    _vehicle.gunMount.rotation.x += 0.04;
    if (_rapidFire) {
      _rapidShot++;
      if ((_rapidShot % 3) === 0) {
        try { if (window.Feedback && window.Feedback.screenShake) window.Feedback.screenShake(0.25); } catch (e) {}
      }
      try { if (window.Tracers && window.Tracers.spawnMuzzleFlash) window.Tracers.spawnMuzzleFlash(origin.clone(), dir.clone()); } catch (e) {}
    }
  }

  function _fireCoax() {
    if (_coaxCool > 0 || !_vehicle || _coaxOverheated) return;
    _coaxCool = COAX_RPM_INTERVAL;
    _coaxHeat += _coaxHeatRate * COAX_RPM_INTERVAL;
    if (_coaxHeat >= _coaxOverheatThreshold) {
      _coaxOverheated = true;
      _notify('🔥 M240 COAX OVERHEATED — wait to cool', '#ff4444', 2000);
    }
    var origin = _muzzleWorld(); origin.x -= 0.2;
    var dir = _aimDirWorld();
    try {
      if (window.Tracers && window.Tracers.spawnTracer) window.Tracers.spawnTracer(origin.clone(), dir.clone(), 0xffaa44, 260);
    } catch (e) {}
    var hp = _hitscan(origin, dir, 200, false);
    if (hp && window.Enemies && window.Enemies.damageInRadius) {
      try { window.Enemies.damageInRadius(hp, 0.6, COAX_DMG, 'BULLET'); } catch (e) {}
    }
    _ejectCasing(false);
  }

  function _hitscan(origin, dir, maxDist, isHE) {
    if (!window.Enemies || !window.Enemies.getAll) return null;
    var all = window.Enemies.getAll();
    var best = null, bestT = 1e9, bestPos = null;
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (!e || e.dead || !e.mesh) continue;
      var to = e.mesh.position.clone().sub(origin);
      var t = to.dot(dir);
      if (t < 0 || t > maxDist) continue;
      var perp = to.sub(dir.clone().multiplyScalar(t)).length();
      if (perp > 1.4) continue;
      if (t < bestT) { bestT = t; best = e; bestPos = e.mesh.position.clone(); }
    }
    if (best) return bestPos;
    return null;
  }

  function _ejectCasing(isBush) {
    if (!_vehicle) return;
    var size = isBush ? 0.18 : 0.06;
    var len  = isBush ? 0.4 : 0.12;
    var col  = isBush ? 0xddaa55 : 0xc0985a;
    var c = new THREE.Mesh(
      new THREE.CylinderGeometry(size * 0.4, size * 0.4, len, 6),
      new THREE.MeshLambertMaterial({ color: col })
    );
    var origin = new THREE.Vector3(0.4, 0.1, 0.5).applyMatrix4(_vehicle.turret.matrixWorld);
    c.position.copy(origin);
    var sideDir = new THREE.Vector3(1, 0, 0).applyQuaternion(_vehicle.turret.getWorldQuaternion(new THREE.Quaternion()));
    _scene.add(c);
    _casings.push({
      mesh: c,
      vx: sideDir.x * 4 + (Math.random() - 0.5),
      vy: 4 + Math.random() * 2,
      vz: sideDir.z * 4 + (Math.random() - 0.5),
      life: 1.5,
      spin: (Math.random() - 0.5) * 18
    });
  }

  // ── Main update tick ──────────────────────────────────────
  function update(dt) {
    if (_bushCool > 0) _bushCool -= dt;
    if (_coaxCool > 0) _coaxCool -= dt;
    if (_smokeCooldown > 0) _smokeCooldown -= dt;
    if (_mortarCooldown > 0) _mortarCooldown -= dt;

    // Coax heat management
    if (_coaxHeat > 0) {
      _coaxHeat -= _coaxCoolRate * dt;
      if (_coaxHeat < 0) _coaxHeat = 0;
      if (_coaxOverheated && _coaxHeat < 0.3) {
        _coaxOverheated = false;
        _notify('✓ M240 COAX COOLED — ready to fire', '#88ff88', 1500);
      }
    }

    // TOW reload
    if (_towReloading) {
      _towReloadTimer -= dt;
      if (_towReloadTimer <= 0) {
        _towReloading = false;
        _towAmmo = _towMaxAmmo;
        _notify('✓ TOW TUBES RELOADED — 2x missiles ready', '#88ff88', 2000);
        if (_vehicle.towGroup) {
          if (_vehicle.towGroup.userData.towCoverL) _vehicle.towGroup.userData.towCoverL.visible = true;
          if (_vehicle.towGroup.userData.towCoverR) _vehicle.towGroup.userData.towCoverR.visible = true;
        }
      }
    }

    // Update TOW missiles
    _updateTOWMissiles(dt);
    // Update smoke
    _updateSmokeParticles(dt);

    // Casings physics
    for (var i = _casings.length - 1; i >= 0; i--) {
      var ca = _casings[i];
      ca.life -= dt;
      ca.vy -= 18 * dt;
      ca.mesh.position.x += ca.vx * dt;
      ca.mesh.position.y += ca.vy * dt;
      ca.mesh.position.z += ca.vz * dt;
      ca.mesh.rotation.x += ca.spin * dt;
      if (ca.mesh.position.y < 0.05) { ca.mesh.position.y = 0.05; ca.vy = 0; ca.vx *= 0.4; ca.vz *= 0.4; }
      if (ca.life <= 0) { _scene.remove(ca.mesh); _casings.splice(i, 1); }
    }

    if (!_active || !_vehicle) return;

    // Drive (only if driver position or gunner with override)
    var fwdInput = (_key.w ? 1 : 0) - (_key.s ? 1 : 0);
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
    try {
      if (window.VoxelWorld && VoxelWorld.getTerrainHeight) {
        var th = VoxelWorld.getTerrainHeight(_vehicle.group.position.x, _vehicle.group.position.z);
        if (typeof th === 'number') _vehicle.group.position.y = th;
      }
    } catch (e) {}

    // Idle audio rpm
    try {
      if (_vehicle.idleHandle && _vehicle.idleHandle.setRpm) {
        var rpm = 700 + Math.min(1, spd / DRIVE_MAX) * 1400;
        _vehicle.idleHandle.setRpm(rpm);
      }
    } catch (e) {}

    // Turret aim from camYaw/camPitch (only in gunner or commander position)
    if (_crewPosition === 1 || _crewPosition === 2) {
      _turretYaw = _camYaw - _vehicle.yaw;
      _turretPitch = Math.max(-0.18, Math.min(0.4, _camPitch + 0.05));
      _vehicle.turret.rotation.y = _turretYaw;
      _vehicle.gunMount.rotation.x = -_turretPitch;
    }

    // Auto-fire while held
    if (_firingBush) _fireBushmaster();
    if (_firingCoax) _fireCoax();

    // Chase camera
    var cam = _ensureChaseCam();
    var off = new THREE.Vector3(_shoulderSide * 1.3, 3.2, 7.0);
    var s = Math.sin(_camYaw), c = Math.cos(_camYaw);
    var camPos = new THREE.Vector3(
      _vehicle.group.position.x + off.x * c + off.z * s,
      _vehicle.group.position.y + off.y,
      _vehicle.group.position.z - off.x * s + off.z * c
    );
    cam.position.lerp(camPos, 0.25);
    var look = new THREE.Vector3(_vehicle.group.position.x, _vehicle.group.position.y + 1.6, _vehicle.group.position.z);
    cam.lookAt(look);
    cam.updateProjectionMatrix();
    try {
      if (_gameCam) {
        _gameCam.position.set(_vehicle.group.position.x, _vehicle.group.position.y + 1.5, _vehicle.group.position.z);
      }
    } catch (e) {}

    // Recoil restore
    if (_vehicle.gunMount.rotation.x > -_turretPitch) {
      _vehicle.gunMount.rotation.x -= dt * 1.2;
    }
  }

  function clear() {
    if (_vehicle) try { _scene.remove(_vehicle.group); } catch (e) {}
    _vehicle = null; _active = false; _rapidFire = false;
    for (var i = 0; i < _casings.length; i++) try { _scene.remove(_casings[i].mesh); } catch (e) {}
    _casings.length = 0;
    for (var i = 0; i < _towMissiles.length; i++) { try { _scene.remove(_towMissiles[i].mesh); } catch (e) {} try { _scene.remove(_towMissiles[i].glow); } catch (e) {} }
    _towMissiles.length = 0;
    for (var i = 0; i < _smokeParticles.length; i++) try { _scene.remove(_smokeParticles[i].mesh); } catch (e) {}
    _smokeParticles.length = 0;
    try { if (window.GameManager) window.GameManager.__bradleyCam = null; } catch (e) {}
  }

  // ── Input ──────────────────────────────────────────────────
  function _onKeyDown(ev) {
    if (!_active) return;
    if (ev.code === 'KeyW') _key.w = true;
    else if (ev.code === 'KeyS') _key.s = true;
    else if (ev.code === 'KeyA') _key.a = true;
    else if (ev.code === 'KeyD') _key.d = true;
    else if (ev.code === 'KeyV' && !ev.repeat) _shoulderSide = -_shoulderSide;
    else if (ev.code === 'Escape') exit();
    else if (ev.code === 'Digit1') _switchCrewPosition(0);
    else if (ev.code === 'Digit2') _switchCrewPosition(1);
    else if (ev.code === 'Digit3') _switchCrewPosition(2);
    else if (ev.code === 'KeyT' && !ev.repeat) { if (_crewPosition === 2) fireTOW(); else _switchCrewPosition(2); }
    else if (ev.code === 'KeyX' && !ev.repeat) launchSmoke();
    else if (ev.code === 'KeyM' && !ev.repeat) callMortar();
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
    _camYaw -= dx * 0.0022;
    _camPitch -= dy * 0.0018;
    if (_camPitch < -0.55) _camPitch = -0.55;
    if (_camPitch > 0.45) _camPitch = 0.45;
  }
  function _onMouseDown(ev) {
    if (!_active) { return; }
    if (ev.button === 0) _firingBush = true;
    else if (ev.button === 2) _firingCoax = true;
  }
  function _onMouseUp(ev) {
    if (ev.button === 0) _firingBush = false;
    else if (ev.button === 2) _firingCoax = false;
  }

  function _bind() {
    if (_bound) return;
    _bound = true;
    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup', _onKeyUp);
    window.addEventListener('mousemove', _onMouseMove);
    window.addEventListener('mousedown', _onMouseDown);
    window.addEventListener('mouseup', _onMouseUp);
    window.addEventListener('contextmenu', function (e) { if (_active) e.preventDefault(); });
  }

  function init(scene, camera, controls) {
    _scene = scene; _gameCam = camera; _controls = controls;
    _active = false;
    _casings.length = 0; _projectiles.length = 0; _towMissiles.length = 0; _smokeParticles.length = 0;
    _key.w = _key.s = _key.a = _key.d = false;
    _firingBush = _firingCoax = false;
    _bushCool = _coaxCool = 0;
    _rapidFire = false; _rapidShot = 0;
    _coaxHeat = 0; _coaxOverheated = false;
    _towAmmo = _towMaxAmmo; _towReloading = false; _towReloadTimer = 0;
    _smokeCharges = _smokeMaxCharges; _smokeCooldown = 0;
    _mortarCooldown = 0;
    _bind();
  }

  return {
    init: init, update: update, clear: clear,
    spawnAt: spawnAt, enter: enter, exit: exit,
    isActive: isActive, getHealth: getHealth, getVehicle: getVehicle,
    takeDamage: takeDamage, setRapidFire: setRapidFire, getRapidFire: getRapidFire,
    fireTOW: fireTOW, launchSmoke: launchSmoke, callMortar: callMortar,
    getTOWAmmo: function() { return _towAmmo; },
    getSmokeCharges: function() { return _smokeCharges; },
    getCoaxHeat: function() { return _coaxHeat; },
    getMortarCooldown: function() { return _mortarCooldown; }
  };
})();
