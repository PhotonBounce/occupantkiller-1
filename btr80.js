// ============================================================
//  btr80.js — BTR-80 Armored Personnel Carrier (player-driveable)
//
//  Real-world reference (BTR-80):
//    - Main armament: 14.5mm KPV heavy machine gun (~600 rpm)
//    - Coax: PKT 7.62mm machine gun (not modeled separately)
//    - 8x8 wheeled, amphibious, ~80 km/h road / 9 km/h water
//    - Crew 2 + 7 dismounts
//    - Turret: KPVT in small one-man tower
//
//  Controls (while driving):
//    WASD  = drive (W/S throttle, A/D steer)
//    Mouse = aim turret (yaw + pitch)
//    LMB   = 14.5mm KPV (hold to fire; overheat system)
//    H     = horn
//    V     = swap FP/TP view
//    E     = exit vehicle
//
//  Public API: init(scene,camera,controls), update(dt), clear(),
//              spawnAt(pos), enter(), exit(), isActive(), getHealth()
// ============================================================
window.BTR80 = (function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────
  var _scene = null, _gameCam = null, _controls = null;
  var _bound = false;
  var _vehicle = null;       // { group, turret, gunMount, barrel, vx, vz, yaw, hp }
  var _active = false;       // player is driving
  var _chaseCam = null;      // 3rd-person camera
  var _camYaw = 0, _camPitch = -0.18;
  var _turretYaw = 0, _turretPitch = 0;
  var _fpvMode = false;      // true = 1st-person, false = chase
  var _fpvOverlay = null;    // KPV sight crosshair DOM element
  var _hud = null;           // bottom-left HUD

  // Weapon state
  var _kpvCool    = 0;       // per-shot cooldown (0.09s = ~667 rpm)
  var _heatLevel  = 0;       // 0–100; jams at 100
  var _overheated = false;   // true while cooling down
  var _heatCoolTimer = 0;    // counts down 8s after overheat
  var _firingKpv  = false;

  // Input
  var _key = { w: false, s: false, a: false, d: false, h: false };

  // Constants
  var KPV_INTERVAL    = 0.09;   // ~667 rpm cyclic
  var KPV_DMG         = 45;
  var KPV_HEAT_PER_SHOT = 4;    // +4 per shot
  var KPV_HEAT_COOL   = 20;     // -20/s passive
  var KPV_OVERHEAT_CD = 8.0;    // seconds to cool after jam
  var BURST_MAX_HEAT  = 100;    // jam threshold
  var DRIVE_ACCEL     = 8.0;
  var DRIVE_MAX       = 20;     // m/s (~72 km/h, BTR is fast)
  var DRIVE_FRICTION  = 3.5;
  var TURN_RATE       = 1.8;    // rad/s (good maneuverability)
  var BARREL_LEN      = 1.8;    // KPV barrel length
  var ARMOR_MITIGATION = 0.40;  // 40% damage reduction

  // ── Mesh: procedural BTR-80 ───────────────────────────────
  function _build() {
    var g = new THREE.Group();

    var hullMat  = new THREE.MeshLambertMaterial({ color: 0x4a5738 }); // dark olive
    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x888888 }); // gray wheels
    var darkMat  = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var pipeMat  = new THREE.MeshLambertMaterial({ color: 0x333333 });

    // ── Hull body (longer than T-72, higher profile for 8 troops) ──
    var hull = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 5.2), hullMat);
    hull.position.y = 1.0;
    g.add(hull);

    // Front V-slope (BTR-80 characteristic angled hull nose)
    var noseL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 0.9), hullMat);
    noseL.position.set(-0.6, 1.0, -2.9);
    noseL.rotation.x = -0.4;
    noseL.rotation.y =  0.18;
    g.add(noseL);
    var noseR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 0.9), hullMat);
    noseR.position.set( 0.6, 1.0, -2.9);
    noseR.rotation.x = -0.4;
    noseR.rotation.y = -0.18;
    g.add(noseR);

    // Hull rear (troop door area)
    var rear = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.0, 0.3), hullMat);
    rear.position.set(0, 0.95, 2.62);
    g.add(rear);

    // ── 8 Wheels (4 per side, BTR-80 is 8×8) ──
    for (var side = 0; side < 2; side++) {
      var wx = (side === 0) ? -1.3 : 1.3;
      for (var w = 0; w < 4; w++) {
        // Wheel axle spacing: spread across 5.0 hull length
        var wz = -1.8 + w * 1.2;
        var wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.35, 0.28, 14),
          wheelMat
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.55, wz);
        g.add(wheel);
        // Tire outer ring (slightly larger, darker)
        var tire = new THREE.Mesh(
          new THREE.CylinderGeometry(0.38, 0.38, 0.20, 14),
          new THREE.MeshLambertMaterial({ color: 0x222222 })
        );
        tire.rotation.z = Math.PI / 2;
        tire.position.set(wx + (side === 0 ? -0.06 : 0.06), 0.55, wz);
        g.add(tire);
      }
    }

    // ── Turret group (yaws independently) ──
    var turret = new THREE.Group();
    turret.position.set(0, 1.72, -0.5);
    g.add(turret);

    // Small one-man KPV turret box
    var turBox = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 1.0), hullMat);
    turret.add(turBox);

    // Turret hatch/ring
    var hatchRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.38, 0.12, 10),
      hullMat
    );
    hatchRing.position.set(0, 0.36, 0);
    turret.add(hatchRing);

    // ── Gun mount (pitches) ──
    var gunMount = new THREE.Group();
    gunMount.position.set(0, 0.1, 0.3);
    turret.add(gunMount);

    // Small mantlet
    var mantlet = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), hullMat);
    gunMount.add(mantlet);

    // 14.5mm KPV barrel
    var barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.055, BARREL_LEN, 10),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0, BARREL_LEN / 2 + 0.17);
    gunMount.add(barrel);

    // Muzzle flash suppressor (small box at barrel tip)
    var muzzleBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.12),
      darkMat
    );
    muzzleBox.position.set(0, 0, BARREL_LEN + 0.12);
    gunMount.add(muzzleBox);

    // ── Exhaust pipes (2 on rear-right) ──
    for (var ep = 0; ep < 2; ep++) {
      var pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.55, 8),
        pipeMat
      );
      pipe.position.set(0.65 + ep * 0.22, 1.45, 2.65);
      pipe.rotation.x = 0.15;
      g.add(pipe);
      // Exhaust cap (angled)
      var cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.06, 8),
        darkMat
      );
      cap.position.set(0.65 + ep * 0.22, 1.72, 2.78);
      cap.rotation.x = 0.6;
      g.add(cap);
    }

    // Hull side vision ports / hatches
    for (var vp = 0; vp < 3; vp++) {
      var portL = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.18, 0.28),
        darkMat
      );
      portL.position.set(-1.22, 1.1, -1.0 + vp * 0.9);
      g.add(portL);
      var portR = portL.clone();
      portR.position.x = 1.22;
      g.add(portR);
    }

    // Antenna
    var ant = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.02, 1.8, 6),
      new THREE.MeshLambertMaterial({ color: 0x111111 })
    );
    ant.position.set(-0.6, 2.15, 0.4);
    g.add(ant);

    g.castShadow = false;
    g.receiveShadow = false;

    return { group: g, turret: turret, gunMount: gunMount, barrel: barrel };
  }

  function _spawnVehicle(pos) {
    var built = _build();
    var p = pos || new THREE.Vector3(0, 0, 0);
    built.group.position.copy(p);
    // Ground-snap at spawn: per-frame terrain follow only runs while driven, so
    // an idle-spawned APC would otherwise keep a wrong/zero Y and sink.
    try {
      if (window.VoxelWorld && VoxelWorld.getTerrainHeight) {
        var gy = VoxelWorld.getTerrainHeight(p.x, p.z);
        if (typeof gy === 'number' && !isNaN(gy)) built.group.position.y = Math.max(0, gy);
      }
    } catch (e) {}
    _scene.add(built.group);
    _vehicle = {
      group:    built.group,
      turret:   built.turret,
      gunMount: built.gunMount,
      barrel:   built.barrel,
      vx: 0, vz: 0, yaw: 0,
      hp: 1200, maxHp: 1200
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
    _kpvCool = 0;
    _heatLevel = 0;
    _overheated = false;
    _heatCoolTimer = 0;
    return _spawnVehicle(pos);
  }

  function _ensureChaseCam() {
    if (_chaseCam) return _chaseCam;
    _chaseCam = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);
    return _chaseCam;
  }

  // ── HUD ─────────────────────────────────────────────────────
  function _createHud() {
    if (_hud) return;
    var d = document.createElement('div');
    d.id = 'btr80-hud';
    d.style.cssText = 'position:fixed;bottom:18px;left:18px;background:rgba(0,0,0,0.6);color:#88cc44;' +
      'font-family:monospace;font-size:13px;padding:6px 12px;border:1px solid rgba(136,204,68,0.4);' +
      'border-radius:4px;pointer-events:none;display:none;z-index:160;';
    document.body.appendChild(d);
    _hud = d;
  }

  function _updateHud() {
    if (!_hud) _createHud();
    if (!_hud) return;
    _hud.style.display = _active ? 'block' : 'none';
    if (_active) {
      var heatStr;
      if (_overheated) {
        heatStr = 'OVERHEAT ' + _heatCoolTimer.toFixed(1) + 's';
      } else {
        heatStr = 'Heat: ' + Math.round(_heatLevel) + '%';
      }
      _hud.textContent = '🟢 BTR-80 | KPV: ' + heatStr + ' | Seats: 7 troops';
    }
  }

  function enter() {
    if (!_vehicle) {
      var px = _gameCam ? _gameCam.position.x : 0;
      var pz = _gameCam ? _gameCam.position.z : 0;
      var py = 0;
      try { if (window.VoxelWorld && VoxelWorld.getTerrainHeight) py = VoxelWorld.getTerrainHeight(px, pz) || 0; } catch (e) {}
      _spawnVehicle(new THREE.Vector3(px, py, pz - 7));
    }
    _active = true;
    _fpvMode = false;
    // group.rotation now carries terrain pitch/roll too, so read the authoritative yaw.
    _camYaw = (_vehicle.yaw != null) ? _vehicle.yaw : _vehicle.group.rotation.y;
    _camPitch = -0.18;
    _turretYaw = 0; _turretPitch = 0;
    _ensureChaseCam();
    try {
      if (window.GameManager) window.GameManager.__btr80Cam = _chaseCam;
    } catch (e) {}
    try {
      window.HUD && window.HUD.showToast && window.HUD.showToast(
        '🚌 BTR-80 | [WASD] drive [MOUSE] turret [LMB] KPV [H] horn [V] FP/TP view [E] exit',
        5500, '#88dd66'
      );
    } catch (e) {}
    try {
      if (window.AudioSystem && window.AudioSystem.playVehicleIdle) {
        _vehicle.idleHandle = window.AudioSystem.playVehicleIdle(900);
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
    try { if (window.GameManager) window.GameManager.__btr80Cam = null; } catch (e) {}
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

  // 40% armor mitigation
  function takeDamage(amount) {
    if (!_vehicle) return;
    var mitigated = _active ? amount * (1 - ARMOR_MITIGATION) : amount;
    _vehicle.hp = Math.max(0, _vehicle.hp - mitigated);
    if (_vehicle.hp <= 0 && _active) {
      try { window.HUD && window.HUD.showToast && window.HUD.showToast('💥 BTR-80 DESTROYED', 3500, '#ff5555'); } catch (e) {}
      try {
        if (window.Tracers && window.Tracers.spawnExplosion) {
          window.Tracers.spawnExplosion(_vehicle.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 7.0);
        }
        if (window.AudioSystem && window.AudioSystem.playExplosion) window.AudioSystem.playExplosion(1.6, true);
      } catch (e) {}
      exit();
    }
  }

  // ── Horn ────────────────────────────────────────────────────
  function _playHorn() {
    // Try AudioSystem first, fall back to Web Audio API oscillator
    try {
      if (window.AudioSystem && window.AudioSystem.playHorn) {
        window.AudioSystem.playHorn();
        return;
      }
    } catch (e) {}
    // Fallback: oscillator beep
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.65);
    } catch (e) {}
  }

  // ── Firing ──────────────────────────────────────────────────
  function _muzzleWorld() {
    if (!_vehicle) return new THREE.Vector3();
    var v = new THREE.Vector3(0, 0, BARREL_LEN + 0.18);
    v.applyMatrix4(_vehicle.gunMount.matrixWorld);
    return v;
  }

  function _aimDirWorld() {
    if (!_vehicle) return new THREE.Vector3(0, 0, 1);
    var d = new THREE.Vector3(0, 0, 1);
    d.applyQuaternion(_vehicle.gunMount.getWorldQuaternion(new THREE.Quaternion()));
    return d.normalize();
  }

  function _fireKpv() {
    if (_kpvCool > 0 || !_vehicle || _overheated) return;
    _kpvCool = KPV_INTERVAL;

    // Heat buildup
    _heatLevel += KPV_HEAT_PER_SHOT;
    if (_heatLevel >= BURST_MAX_HEAT) {
      _heatLevel = BURST_MAX_HEAT;
      _overheated = true;
      _heatCoolTimer = KPV_OVERHEAT_CD;
      _firingKpv = false;
      try {
        window.HUD && window.HUD.showToast && window.HUD.showToast(
          '🔥 KPV OVERHEATED — cooling 8s', 3000, '#ff8800'
        );
      } catch (e) {}
      return;
    }

    var origin = _muzzleWorld();
    var dir    = _aimDirWorld();

    try {
      if (window.Tracers && window.Tracers.spawnTracer) {
        window.Tracers.spawnTracer(origin.clone(), dir.clone(), 0xffdd44, 250);
      }
      if (window.Tracers && window.Tracers.spawnMuzzleFlash) {
        window.Tracers.spawnMuzzleFlash(origin.clone(), dir.clone());
      }
    } catch (e) {}

    var hitPos = _hitscan(origin, dir, 250);
    if (hitPos) {
      try {
        if (window.Tracers && window.Tracers.spawnExplosion) {
          window.Tracers.spawnExplosion(hitPos, 1.2);
        }
        if (window.Enemies && window.Enemies.damageInRadius) {
          window.Enemies.damageInRadius(hitPos, 0.8, KPV_DMG, 'BULLET');
        }
      } catch (e) {}
    }

    // Audio
    try {
      if (window.AudioSystem && window.AudioSystem.playBTR80Fire) {
        window.AudioSystem.playBTR80Fire();
      } else if (window.AudioSystem && window.AudioSystem.playGunshot) {
        window.AudioSystem.playGunshot('heavy');
      }
    } catch (e) {}

    // Recoil (small, KPV is lighter than 125mm)
    _vehicle.gunMount.rotation.x += 0.025;
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
      if (perp > 1.5) continue;
      if (t < bestT) { bestT = t; bestPos = e.mesh.position.clone(); }
    }
    return bestPos;
  }

  // ── FPV Overlay (KPV gun sight) ─────────────────────────────
  function _createFPVOverlay() {
    if (_fpvOverlay) return;
    var d = document.createElement('div');
    d.id = 'btr80-fpv-overlay';
    d.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;display:none;z-index:150;';
    d.innerHTML = '<svg width="100%" height="100%" style="position:absolute;top:0;left:0">' +
      // Center cross (olive/green for BTR)
      '<line x1="50%" y1="44%" x2="50%" y2="48%" stroke="#88dd44" stroke-width="1.5" opacity="0.95"/>' +
      '<line x1="50%" y1="52%" x2="50%" y2="56%" stroke="#88dd44" stroke-width="1.5" opacity="0.95"/>' +
      '<line x1="44%" y1="50%" x2="48%" y2="50%" stroke="#88dd44" stroke-width="1.5" opacity="0.95"/>' +
      '<line x1="52%" y1="50%" x2="56%" y2="50%" stroke="#88dd44" stroke-width="1.5" opacity="0.95"/>' +
      // Center dot
      '<circle cx="50%" cy="50%" r="1%" fill="none" stroke="#88dd44" stroke-width="1" opacity="0.85"/>' +
      // Outer ring
      '<circle cx="50%" cy="50%" r="4.5%" fill="none" stroke="#88dd44" stroke-width="0.5" opacity="0.3"/>' +
      // Ranging stadia
      '<line x1="50%" y1="47%" x2="51%" y2="47%" stroke="#88dd44" stroke-width="0.9" opacity="0.55"/>' +
      '<line x1="50%" y1="49%" x2="50.5%" y2="49%" stroke="#88dd44" stroke-width="0.9" opacity="0.55"/>' +
      '<line x1="50%" y1="51%" x2="50.5%" y2="51%" stroke="#88dd44" stroke-width="0.9" opacity="0.55"/>' +
      '<line x1="50%" y1="53%" x2="51%" y2="53%" stroke="#88dd44" stroke-width="0.9" opacity="0.55"/>' +
      // Corner brackets
      '<line x1="39%" y1="39%" x2="43%" y2="39%" stroke="#88dd44" stroke-width="1" opacity="0.28"/>' +
      '<line x1="39%" y1="39%" x2="39%" y2="43%" stroke="#88dd44" stroke-width="1" opacity="0.28"/>' +
      '<line x1="61%" y1="39%" x2="57%" y2="39%" stroke="#88dd44" stroke-width="1" opacity="0.28"/>' +
      '<line x1="61%" y1="39%" x2="61%" y2="43%" stroke="#88dd44" stroke-width="1" opacity="0.28"/>' +
      '<line x1="39%" y1="61%" x2="43%" y2="61%" stroke="#88dd44" stroke-width="1" opacity="0.28"/>' +
      '<line x1="39%" y1="61%" x2="39%" y2="57%" stroke="#88dd44" stroke-width="1" opacity="0.28"/>' +
      '<line x1="61%" y1="61%" x2="57%" y2="61%" stroke="#88dd44" stroke-width="1" opacity="0.28"/>' +
      '<line x1="61%" y1="61%" x2="61%" y2="57%" stroke="#88dd44" stroke-width="1" opacity="0.28"/>' +
      // HUD text
      '<text x="64%" y="62%" font-family="monospace" font-size="12" fill="#88dd44" opacity="0.85" id="btr80fpv-gun">14.5mm KPV</text>' +
      '<text x="64%" y="65%" font-family="monospace" font-size="10" fill="#aaddaa" opacity="0.65" id="btr80fpv-heat">Heat: 0%</text>' +
      '</svg>';
    document.body.appendChild(d);
    _fpvOverlay = d;
  }

  function _showFPVOverlay(show) {
    if (!_fpvOverlay) _createFPVOverlay();
    if (_fpvOverlay) _fpvOverlay.style.display = show ? 'block' : 'none';
    if (show && _fpvOverlay) {
      var heatEl = _fpvOverlay.querySelector('#btr80fpv-heat');
      if (heatEl) {
        if (_overheated) {
          heatEl.textContent = 'OVERHEAT ' + _heatCoolTimer.toFixed(1) + 's';
          heatEl.setAttribute('fill', '#ff8800');
        } else {
          heatEl.textContent = 'Heat: ' + Math.round(_heatLevel) + '%';
          heatEl.setAttribute('fill', _heatLevel > 70 ? '#ff8800' : '#aaddaa');
        }
      }
    }
  }

  function toggleViewMode() {
    if (!_active) return;
    _fpvMode = !_fpvMode;
    _showFPVOverlay(_fpvMode);
    try {
      if (window.HUD && window.HUD.notifyPickup) {
        window.HUD.notifyPickup(_fpvMode ? '🔭 KPV SIGHT — first person' : '🎥 THIRD PERSON VIEW', '#88cc44');
      }
    } catch (e) {}
  }

  function getActiveCamera() {
    if (_fpvMode) return null;
    return _chaseCam;
  }

  // ── Main update tick ───────────────────────────────────────
  function update(dt) {
    if (_kpvCool > 0) _kpvCool -= dt;

    // Passive heat cooling
    if (_overheated) {
      _heatCoolTimer -= dt;
      if (_heatCoolTimer <= 0) {
        _overheated = false;
        _heatCoolTimer = 0;
        _heatLevel = 0;
        try {
          window.HUD && window.HUD.showToast && window.HUD.showToast('✅ KPV cooled — ready', 1500, '#88dd44');
        } catch (e) {}
      }
    } else if (_heatLevel > 0) {
      _heatLevel = Math.max(0, _heatLevel - KPV_HEAT_COOL * dt);
    }

    if (!_active || !_vehicle) return;

    // Drive
    var fwdInput  = (_key.w ? 1 : 0) - (_key.s ? 1 : 0);
    var turnInput = (_key.a ? 1 : 0) - (_key.d ? 1 : 0);
    _vehicle.yaw += turnInput * TURN_RATE * dt * (Math.abs(fwdInput) > 0.05 ? 1 : 0.6);
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

    // Conform to terrain (BTR-80 is amphibious — accepts crossing water).
    // A single centre sample kept the hull level on slopes, burying one end and
    // floating the other; alignToTerrain uses the footprint corners instead.
    try {
      if (window.Vehicles && Vehicles.alignToTerrain) {
        Vehicles.alignToTerrain(_vehicle.group, 3.4, 1.5, _vehicle.yaw);
        if (_vehicle.group.position.y < 0) _vehicle.group.position.y = 0; // float
      } else if (window.VoxelWorld && VoxelWorld.getTerrainHeight) {
        var th = VoxelWorld.getTerrainHeight(_vehicle.group.position.x, _vehicle.group.position.z);
        if (typeof th === 'number') _vehicle.group.position.y = Math.max(0, th);
      }
    } catch (e) {}

    // Idle audio rpm
    try {
      if (_vehicle.idleHandle && _vehicle.idleHandle.setRpm) {
        var rpm = 800 + Math.min(1, spd / DRIVE_MAX) * 1600;
        _vehicle.idleHandle.setRpm(rpm);
      }
    } catch (e) {}

    // Turret follows camera
    _turretYaw   = _camYaw - _vehicle.yaw;
    _turretPitch = Math.max(-0.22, Math.min(0.55, _camPitch + 0.05));
    _vehicle.turret.rotation.y   = _turretYaw;
    _vehicle.gunMount.rotation.x = -_turretPitch;

    // Auto-fire
    if (_firingKpv) _fireKpv();

    // HUD + FPV overlay
    _updateHud();

    if (_fpvMode && _gameCam && _vehicle) {
      var turWPos = new THREE.Vector3();
      _vehicle.turret.getWorldPosition(turWPos);
      _gameCam.position.set(turWPos.x, turWPos.y + 0.6, turWPos.z);
      var totalYaw = _vehicle.yaw + _turretYaw;
      _gameCam.rotation.set(0, 0, 0, 'YXZ');
      _gameCam.rotation.y = totalYaw + Math.PI;
      _gameCam.rotation.x = _turretPitch * 0.85;
      _showFPVOverlay(true);
    } else {
      _showFPVOverlay(false);
      // Chase cam: 6 back, 2.5 up
      var cam = _ensureChaseCam();
      var s = Math.sin(_camYaw), c = Math.cos(_camYaw);
      var camPos = new THREE.Vector3(
        _vehicle.group.position.x + 6.0 * s,
        _vehicle.group.position.y + 2.5,
        _vehicle.group.position.z + 6.0 * c
      );
      cam.position.lerp(camPos, 0.25);
      var look = new THREE.Vector3(_vehicle.group.position.x, _vehicle.group.position.y + 1.2, _vehicle.group.position.z);
      cam.lookAt(look);
      cam.updateProjectionMatrix();
    }

    // Sync main cam
    try {
      if (_gameCam && !_fpvMode) {
        _gameCam.position.set(_vehicle.group.position.x, _vehicle.group.position.y + 1.5, _vehicle.group.position.z);
      }
    } catch (e) {}

    // Recoil restore
    if (_vehicle.gunMount.rotation.x > -_turretPitch) {
      _vehicle.gunMount.rotation.x -= dt * 1.8;
    }
  }

  function clear() {
    if (_vehicle) try { _scene.remove(_vehicle.group); } catch (e) {}
    _vehicle = null; _active = false;
    if (_hud) _hud.style.display = 'none';
    try { if (window.GameManager) window.GameManager.__btr80Cam = null; } catch (e) {}
  }

  // ── Input ───────────────────────────────────────────────────
  function _onKeyDown(ev) {
    if (!_active) return;
    if      (ev.code === 'KeyW') _key.w = true;
    else if (ev.code === 'KeyS') _key.s = true;
    else if (ev.code === 'KeyA') _key.a = true;
    else if (ev.code === 'KeyD') _key.d = true;
    else if (ev.code === 'KeyH' && !ev.repeat) _playHorn();
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
    if (_camPitch >  0.50) _camPitch =  0.50;
  }
  function _onMouseDown(ev) {
    if (!_active) return;
    if (ev.button === 0) _firingKpv = true;
  }
  function _onMouseUp(ev) {
    if (ev.button === 0) _firingKpv = false;
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
    _key.w = _key.s = _key.a = _key.d = _key.h = false;
    _firingKpv = false;
    _kpvCool = 0; _heatLevel = 0;
    _overheated = false; _heatCoolTimer = 0;
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
