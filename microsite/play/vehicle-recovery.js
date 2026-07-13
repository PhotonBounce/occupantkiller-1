/* ───────────────────────────────────────────────────────────────────────────
   vehicle-recovery.js — Battlefield Vehicle Recovery & Field Repair Under Fire
   API: window.VehicleRecovery = { init, update, reset }
   Controls:
     V + R (together)    → launch Vehicle Recovery mission
     W / A / S / D       → drive recovery truck (when aboard)
     T                   → attach/detach tow cable to nearest disabled vehicle
     J                   → jack up tipped vehicle (Supply Truck)
     W (hold)            → weld damaged component (when near vehicle + have parts)
     F                   → call suppression fire (10-round burst, 15s cooldown)
   ─────────────────────────────────────────────────────────────────────────── */
window.VehicleRecovery = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _active        = false;
  var _score         = 0;
  var _vehiclesSaved = 0;
  var _missionClear  = false;
  var _missionTimer  = 0;       // seconds elapsed
  var _MISSION_TIME  = 480;     // 8 minutes

  /* ── Input state ───────────────────────────────────────────────────────── */
  var _keys = {};
  var _vrPressTime = { V: 0, R: 0 };
  var VR_WINDOW    = 0.35;

  /* ── Recovery truck (player vehicle) ──────────────────────────────────── */
  var _recoveryTruck      = null;
  var _truckHP            = 300;
  var _truckSpeed         = 8;
  var _playerAboard       = true;
  var _craneMesh          = null;
  var _hookMesh           = null;

  /* ── Tow cable ─────────────────────────────────────────────────────────── */
  var _towCable           = null;   // LineSegments
  var _towTarget          = null;   // disabled vehicle object being towed
  var _towCooldown        = 0;

  /* ── Jack ──────────────────────────────────────────────────────────────── */
  var _jackMesh           = null;
  var _jackActive         = false;
  var _jackTarget         = null;
  var _jackTimer          = 0;
  var _jackDuration       = 5;

  /* ── Welding ───────────────────────────────────────────────────────────── */
  var _weldActive         = false;
  var _weldTarget         = null;
  var _weldTimer          = 0;
  var _weldDuration       = 5;
  var _weldSparks         = [];    // { mesh, life, vel }
  var _weldLight          = null;

  /* ── Supply caches & parts ─────────────────────────────────────────────── */
  var _supplyCaches       = [];    // { mesh, collected }
  var _partsCount         = 0;

  /* ── Disabled vehicles ─────────────────────────────────────────────────── */
  var _disabledVehicles   = [];
  /*
    Each entry: {
      group, type ('bradley'|'truck'|'heli'),
      repaired, towed, saved,
      missingPart (mesh or null),
      crewNPCs [],
      originalRotZ,
      hp
    }
  */

  /* ── Recovery zone ─────────────────────────────────────────────────────── */
  var _recoveryZone       = null;

  /* ── Enemies ───────────────────────────────────────────────────────────── */
  var _enemies            = [];
  /*
    Each entry: { group, hp, fireTimer, alive, bullet: [] }
  */
  var _enemyBullets       = [];   // { mesh, vel, life }

  /* ── Suppression fire ──────────────────────────────────────────────────── */
  var _suppCooldown       = 0;
  var _SUPP_COOLDOWN      = 15;
  var _suppRounds         = [];   // { mesh, vel, life }

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hud                = null;

  /* ── Internal timer ────────────────────────────────────────────────────── */
  var _lastTime           = 0;

  /* ════════════════════════════════════════════════════════════════════════
     UTILITIES
  ════════════════════════════════════════════════════════════════════════ */

  function dist3(a, b) {
    var dx = a.position.x - b.position.x;
    var dy = a.position.y - b.position.y;
    var dz = a.position.z - b.position.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function dist3v(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function lerpAngle(a, b, t) {
    return a + (b - a) * t;
  }

  /* ════════════════════════════════════════════════════════════════════════
     MESH BUILDERS
  ════════════════════════════════════════════════════════════════════════ */

  function buildBradley(pos) {
    var group = new THREE.Group();

    /* Hull */
    var hullGeo = new THREE.BoxGeometry(5, 2, 3);
    var hullMat = new THREE.MeshLambertMaterial({ color: 0x445544 });
    var hull    = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 1;
    group.add(hull);

    /* Turret */
    var turGeo = new THREE.BoxGeometry(1.8, 0.8, 1.8);
    var turMat = new THREE.MeshLambertMaterial({ color: 0x3A4A3A });
    var turret = new THREE.Mesh(turGeo, turMat);
    turret.position.set(0.2, 2.4, 0);
    group.add(turret);

    /* Cannon */
    var canGeo = new THREE.CylinderGeometry(0.1, 0.1, 2.5, 6);
    var canMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var cannon = new THREE.Mesh(canGeo, canMat);
    cannon.rotation.z = Math.PI / 2;
    cannon.position.set(1.8, 2.5, 0);
    group.add(cannon);

    /* Left track (intact) */
    var trackGeo = new THREE.BoxGeometry(5.2, 0.4, 0.5);
    var trackMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var trackL   = new THREE.Mesh(trackGeo, trackMat);
    trackL.position.set(0, 0.2, -1.6);
    group.add(trackL);

    /* Right track — missing (RPG damage): show broken stub via LineSegments */
    var trackPts = [
      new THREE.Vector3(-2.5, 0.2, 1.6),
      new THREE.Vector3(-1,   0.2, 1.6),
      new THREE.Vector3(-0.8, 0.2, 1.7)
    ];
    var trackBuf = new THREE.BufferGeometry().setFromPoints(trackPts);
    var trackLineMat = new THREE.LineBasicMaterial({ color: 0x884422 });
    var trackBroken  = new THREE.LineSegments(trackBuf, trackLineMat);
    group.add(trackBroken);

    group.position.copy(pos);
    group.position.y = 0.2;
    _scene.add(group);

    return {
      group:       group,
      type:        'bradley',
      repaired:    false,
      towed:       false,
      saved:       false,
      missingPart: trackBroken,   // the broken track LineSegments
      crewNPCs:    [],
      originalRotZ: 0,
      hp:          100
    };
  }

  function buildSupplyTruck(pos) {
    var group = new THREE.Group();

    /* Body */
    var bodyGeo = new THREE.BoxGeometry(5, 2, 2.5);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x6B6B4A });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.25;
    group.add(body);

    /* Cab */
    var cabGeo = new THREE.BoxGeometry(1.8, 1.2, 2.3);
    var cabMat = new THREE.MeshLambertMaterial({ color: 0x5A5A3A });
    var cab    = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(-1.8, 2.35, 0);
    group.add(cab);

    /* Intact wheels */
    var wGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 10);
    var wMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var wheelPositions = [
      new THREE.Vector3(-1.6, 0.5, -1.4),
      new THREE.Vector3( 1.6, 0.5, -1.4),
      new THREE.Vector3(-1.6, 0.5,  1.4)
    ];
    for (var wi = 0; wi < wheelPositions.length; wi++) {
      var wm = new THREE.Mesh(wGeo, wMat);
      wm.rotation.z = Math.PI / 2;
      wm.position.copy(wheelPositions[wi]);
      group.add(wm);
    }

    /* Blown wheel — 45° angle, right-rear */
    var blownWheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 10);
    var blownWheelMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var blownWheel    = new THREE.Mesh(blownWheelGeo, blownWheelMat);
    blownWheel.rotation.z = Math.PI / 2;
    blownWheel.rotation.x = Math.PI / 4;   /* 45° angle — blown */
    blownWheel.position.set(1.6, 0.3, 1.4);
    group.add(blownWheel);

    group.position.copy(pos);
    group.position.y = 0;
    group.rotation.z = 0.18;   /* tipped slightly from blown wheel */
    _scene.add(group);

    return {
      group:        group,
      type:         'truck',
      repaired:     false,
      towed:        false,
      saved:        false,
      missingPart:  blownWheel,
      crewNPCs:     [],
      originalRotZ: 0.18,
      hp:           100
    };
  }

  function buildHelicopter(pos) {
    var group = new THREE.Group();

    /* Fuselage */
    var fuseGeo = new THREE.BoxGeometry(4, 1, 2);
    var fuseMat = new THREE.MeshLambertMaterial({ color: 0x4A4A5A });
    var fuse    = new THREE.Mesh(fuseGeo, fuseMat);
    fuse.position.y = 0.5;
    group.add(fuse);

    /* Tail boom */
    var tailGeo = new THREE.BoxGeometry(3, 0.4, 0.4);
    var tailMat = new THREE.MeshLambertMaterial({ color: 0x3A3A4A });
    var tail    = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(-3, 0.6, 0);
    group.add(tail);

    /* Cockpit */
    var cockGeo = new THREE.BoxGeometry(1.2, 0.9, 1.6);
    var cockMat = new THREE.MeshLambertMaterial({ color: 0x223344, transparent: true, opacity: 0.7 });
    var cock    = new THREE.Mesh(cockGeo, cockMat);
    cock.position.set(1.8, 0.95, 0);
    group.add(cock);

    /* Rotor head (cracked) */
    var rotorHeadGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.4, 8);
    var rotorHeadMat = new THREE.MeshLambertMaterial({ color: 0x885533 });
    var rotorHead    = new THREE.Mesh(rotorHeadGeo, rotorHeadMat);
    rotorHead.position.set(0, 1.4, 0);
    group.add(rotorHead);

    /* Main rotors — non-spinning, static (crashed) */
    var rotorGeo = new THREE.BoxGeometry(7, 0.08, 0.3);
    var rotorMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var rotorA   = new THREE.Mesh(rotorGeo, rotorMat);
    rotorA.position.set(0, 1.6, 0);
    rotorA.rotation.y = 0.3;
    group.add(rotorA);

    var rotorB = new THREE.Mesh(rotorGeo, rotorMat);
    rotorB.position.set(0, 1.65, 0);
    rotorB.rotation.y = 0.3 + Math.PI / 2;
    group.add(rotorB);

    /* Tail rotor (also static) */
    var tailRotorGeo = new THREE.BoxGeometry(0.1, 1.5, 0.15);
    var tailRotorMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var tailRotor    = new THREE.Mesh(tailRotorGeo, tailRotorMat);
    tailRotor.position.set(-4.4, 0.7, 0.3);
    group.add(tailRotor);

    /* Landing skid */
    var skidGeo = new THREE.BoxGeometry(3, 0.1, 0.15);
    var skidMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var skidL   = new THREE.Mesh(skidGeo, skidMat);
    skidL.position.set(0, 0, -0.9);
    group.add(skidL);
    var skidR = new THREE.Mesh(skidGeo, skidMat);
    skidR.position.set(0, 0, 0.9);
    group.add(skidR);

    group.position.copy(pos);
    group.position.y = 0.1;
    group.rotation.z = 0.4;    /* crashed — landed awkwardly */
    group.rotation.y = 0.6;
    _scene.add(group);

    return {
      group:        group,
      type:         'heli',
      repaired:     false,
      towed:        false,
      saved:        false,
      missingPart:  rotorHead,   /* cracked rotor head */
      crewNPCs:     [],
      originalRotZ: 0,
      hp:           100
    };
  }

  function buildRecoveryTruck() {
    var group = new THREE.Group();

    /* Body */
    var bodyGeo = new THREE.BoxGeometry(6, 2, 2.5);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x556644 });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.25;
    group.add(body);

    /* Cab */
    var cabGeo = new THREE.BoxGeometry(2, 1.5, 2.3);
    var cabMat = new THREE.MeshLambertMaterial({ color: 0x445533 });
    var cab    = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(2.2, 2.5, 0);
    group.add(cab);

    /* Wheels */
    var wGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.35, 10);
    var wMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var wps  = [
      new THREE.Vector3(-1.8, 0.55, -1.5),
      new THREE.Vector3( 1.8, 0.55, -1.5),
      new THREE.Vector3(-1.8, 0.55,  1.5),
      new THREE.Vector3( 1.8, 0.55,  1.5)
    ];
    for (var i = 0; i < wps.length; i++) {
      var wm = new THREE.Mesh(wGeo, wMat);
      wm.rotation.z = Math.PI / 2;
      wm.position.copy(wps[i]);
      group.add(wm);
    }

    /* Crane arm */
    var craneGeo = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
    var craneMat = new THREE.MeshLambertMaterial({ color: 0xAAAA55 });
    _craneMesh   = new THREE.Mesh(craneGeo, craneMat);
    _craneMesh.position.set(-1.5, 3.8, 0);
    _craneMesh.rotation.z = -Math.PI / 5;
    group.add(_craneMesh);

    /* Hook */
    var hookGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    var hookMat = new THREE.MeshLambertMaterial({ color: 0xCCAA00 });
    _hookMesh   = new THREE.Mesh(hookGeo, hookMat);
    _hookMesh.position.set(-2.8, 2.8, 0);
    group.add(_hookMesh);

    group.position.set(0, 0, 15);
    _scene.add(group);
    return group;
  }

  function buildEnemy(pos) {
    var group = new THREE.Group();

    var bodyGeo = new THREE.BoxGeometry(0.6, 1.7, 0.5);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x663322 });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.85;
    group.add(body);

    var headGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.4, 8);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xCC8844 });
    var head    = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2;
    group.add(head);

    var gunGeo = new THREE.BoxGeometry(0.1, 0.1, 0.8);
    var gunMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var gun    = new THREE.Mesh(gunGeo, gunMat);
    gun.position.set(0.35, 1.3, -0.5);
    group.add(gun);

    group.position.copy(pos);
    _scene.add(group);

    return {
      group:     group,
      hp:        60,
      fireTimer: 1.5 + Math.random() * 2,
      alive:     true,
      bullets:   []
    };
  }

  function buildCrewNPC(pos) {
    var group = new THREE.Group();

    var bodyGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0xCC8844 });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.4;
    group.add(body);

    var headGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.25, 8);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xCC8844 });
    var head    = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1;
    group.add(head);

    group.position.copy(pos);
    /* Crouching */
    group.rotation.x = 0.4;
    _scene.add(group);
    return group;
  }

  function buildRecoveryZone() {
    var geo = new THREE.CylinderGeometry(6, 6, 0.15, 32);
    var mat = new THREE.MeshLambertMaterial({
      color:       0x00FF88,
      transparent: true,
      opacity:     0.45,
      emissive:    0x00FF88,
      emissiveIntensity: 0.3
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 0.08, 0);
    _scene.add(mesh);
    return mesh;
  }

  function buildSupplyCache(pos) {
    var geo  = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var mat  = new THREE.MeshLambertMaterial({ color: 0x4A9A4A, emissive: 0x007700, emissiveIntensity: 0.4 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.position.y = 0.25;
    _scene.add(mesh);
    return { mesh: mesh, collected: false };
  }

  function buildTowCable(from, to) {
    var pts = [
      new THREE.Vector3(from.x, from.y + 1, from.z),
      new THREE.Vector3(to.x,   to.y   + 1, to.z)
    ];
    var geo  = new THREE.BufferGeometry().setFromPoints(pts);
    var mat  = new THREE.LineBasicMaterial({ color: 0xDDAA44, linewidth: 2 });
    var line = new THREE.LineSegments(geo, mat);
    _scene.add(line);
    return line;
  }

  function updateTowCablePositions() {
    if (!_towCable || !_towTarget) return;
    var fp = _recoveryTruck.position;
    var tp = _towTarget.group.position;
    var pts = [
      new THREE.Vector3(fp.x, fp.y + 1, fp.z),
      new THREE.Vector3(tp.x, tp.y + 1, tp.z)
    ];
    _towCable.geometry.setFromPoints(pts);
  }

  function buildJackMesh(pos) {
    var geo  = new THREE.BoxGeometry(0.6, 1.2, 0.6);
    var mat  = new THREE.MeshLambertMaterial({ color: 0xDD4400 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.position.y = 0.6;
    _scene.add(mesh);
    return mesh;
  }

  /* ════════════════════════════════════════════════════════════════════════
     LAUNCH
  ════════════════════════════════════════════════════════════════════════ */

  function launchMission() {
    if (_active) return;
    _active        = true;
    _score         = 0;
    _vehiclesSaved = 0;
    _missionClear  = false;
    _missionTimer  = 0;
    _truckHP       = 300;
    _playerAboard  = true;
    _towCable      = null;
    _towTarget     = null;
    _jackActive    = false;
    _jackTarget    = null;
    _jackTimer     = 0;
    _weldActive    = false;
    _weldTarget    = null;
    _weldTimer     = 0;
    _partsCount    = 0;
    _suppCooldown  = 0;
    _weldSparks    = [];
    _disabledVehicles = [];
    _supplyCaches  = [];
    _enemies       = [];
    _enemyBullets  = [];
    _suppRounds    = [];

    /* Recovery truck */
    _recoveryTruck = buildRecoveryTruck();

    /* Disabled vehicles */
    _disabledVehicles.push(buildBradley(new THREE.Vector3(-20, 0, -18)));
    _disabledVehicles.push(buildSupplyTruck(new THREE.Vector3(22, 0, -10)));
    _disabledVehicles.push(buildHelicopter(new THREE.Vector3(5, 0, -35)));

    /* Crew NPCs beside each disabled vehicle */
    var crewOffsets = [
      [new THREE.Vector3(-22, 0, -16), new THREE.Vector3(-18, 0, -20)],
      [new THREE.Vector3(20,  0, -8)],
      [new THREE.Vector3(7,   0, -33), new THREE.Vector3(3, 0, -37)]
    ];
    for (var vi = 0; vi < _disabledVehicles.length; vi++) {
      var dv = _disabledVehicles[vi];
      var offsets = crewOffsets[vi];
      for (var ci = 0; ci < offsets.length; ci++) {
        var npc = buildCrewNPC(offsets[ci]);
        dv.crewNPCs.push(npc);
      }
    }

    /* Supply caches */
    _supplyCaches.push(buildSupplyCache(new THREE.Vector3(-10, 0, -5)));
    _supplyCaches.push(buildSupplyCache(new THREE.Vector3(15,  0, -25)));
    _supplyCaches.push(buildSupplyCache(new THREE.Vector3(-5,  0, -42)));

    /* Recovery zone (safe zone ring) */
    _recoveryZone = buildRecoveryZone();

    /* Enemies — 4, approaching from outside */
    var enemyPositions = [
      new THREE.Vector3(-35, 0, -5),
      new THREE.Vector3( 35, 0, -15),
      new THREE.Vector3( 10, 0, -55),
      new THREE.Vector3(-15, 0, -52)
    ];
    for (var ei = 0; ei < 4; ei++) {
      _enemies.push(buildEnemy(enemyPositions[ei]));
    }

    /* Position camera */
    if (_camera) {
      _camera.position.set(0, 18, 30);
      _camera.lookAt(0, 0, 0);
    }

    _buildHUD();
    _updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ════════════════════════════════════════════════════════════════════════ */

  function _buildHUD() {
    if (_hud) {
      document.body.removeChild(_hud);
      _hud = null;
    }
    _hud = document.createElement('div');
    _hud.id = 'vr-hud';
    _hud.style.cssText = [
      'position:fixed',
      'bottom:18px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.72)',
      'color:#00FF88',
      'font:bold 13px monospace',
      'padding:7px 18px',
      'border:1px solid #00FF88',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'letter-spacing:0.05em',
      'text-shadow:0 0 6px #00FF88'
    ].join(';');
    document.body.appendChild(_hud);
  }

  function _updateHUD() {
    if (!_hud || !_active) return;
    var threatCount = 0;
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].alive) threatCount++;
    }
    var towStatus = _towTarget ? 'CONNECTED' : 'DISCONNECTED';
    var suppStr   = _suppCooldown > 0
      ? ('SUPP: ' + Math.ceil(_suppCooldown) + 's')
      : 'SUPP: READY';
    _hud.textContent = [
      'RECOVERY',
      '[VEHICLES: ' + _vehiclesSaved + '/3]',
      '[PARTS: ' + _partsCount + ']',
      '[THREATS: ' + threatCount + ']',
      '| TOW: ' + towStatus,
      '| TRUCK HP: ' + _truckHP,
      '| ' + suppStr
    ].join('  ');
  }

  /* ════════════════════════════════════════════════════════════════════════
     TOW CABLE
  ════════════════════════════════════════════════════════════════════════ */

  function tryAttachTow() {
    if (_towTarget) {
      /* Detach */
      if (_towCable) {
        _scene.remove(_towCable);
        _towCable = null;
      }
      _towTarget = null;
      return;
    }
    /* Find nearest disabled, not-yet-saved vehicle within 8 units */
    var best = null;
    var bestDist = 8;
    for (var i = 0; i < _disabledVehicles.length; i++) {
      var dv = _disabledVehicles[i];
      if (dv.saved) continue;
      var d = dist3(_recoveryTruck, dv.group);
      if (d < bestDist) {
        bestDist = d;
        best     = dv;
      }
    }
    if (!best) return;
    _towTarget = best;
    _towCable  = buildTowCable(_recoveryTruck.position, _towTarget.group.position);
  }

  /* ════════════════════════════════════════════════════════════════════════
     JACK
  ════════════════════════════════════════════════════════════════════════ */

  function tryJack() {
    if (_jackActive) return;
    /* Only works on Supply Truck */
    for (var i = 0; i < _disabledVehicles.length; i++) {
      var dv = _disabledVehicles[i];
      if (dv.type !== 'truck') continue;
      if (dv.repaired) continue;
      if (dist3(_recoveryTruck, dv.group) > 8) continue;
      _jackActive  = true;
      _jackTarget  = dv;
      _jackTimer   = 0;
      _jackMesh    = buildJackMesh(new THREE.Vector3(
        dv.group.position.x + 1,
        dv.group.position.y,
        dv.group.position.z
      ));
      return;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     WELDING
  ════════════════════════════════════════════════════════════════════════ */

  function tryStartWeld() {
    if (_weldActive) return;
    if (_partsCount <= 0) return;
    /* Find nearest un-repaired vehicle within range */
    for (var i = 0; i < _disabledVehicles.length; i++) {
      var dv = _disabledVehicles[i];
      if (dv.repaired) continue;
      if (dist3(_recoveryTruck, dv.group) > 9) continue;
      _weldActive = true;
      _weldTarget = dv;
      _weldTimer  = 0;
      _partsCount--;
      _weldLight  = new THREE.PointLight(0xFFDD00, 2, 8);
      _weldLight.position.copy(dv.group.position);
      _weldLight.position.y += 1.5;
      _scene.add(_weldLight);
      return;
    }
  }

  function _spawnWeldSpark(pos) {
    var geo  = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    var mat  = new THREE.MeshLambertMaterial({ color: 0xFFDD00, emissive: 0xFFCC00, emissiveIntensity: 1 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.position.y += 1 + Math.random() * 0.5;
    var vel = new THREE.Vector3(
      (Math.random() - 0.5) * 3,
      Math.random() * 4 + 1,
      (Math.random() - 0.5) * 3
    );
    _scene.add(mesh);
    _weldSparks.push({ mesh: mesh, life: 0.4 + Math.random() * 0.4, vel: vel });
  }

  /* ════════════════════════════════════════════════════════════════════════
     SUPPRESSION FIRE
  ════════════════════════════════════════════════════════════════════════ */

  function callSuppressionFire() {
    if (_suppCooldown > 0) return;
    _suppCooldown = _SUPP_COOLDOWN;

    /* Find nearest alive enemy */
    var nearest = null;
    var nearestDist = Infinity;
    for (var i = 0; i < _enemies.length; i++) {
      if (!_enemies[i].alive) continue;
      var d = dist3(_recoveryTruck, _enemies[i].group);
      if (d < nearestDist) {
        nearestDist = d;
        nearest     = _enemies[i];
      }
    }
    if (!nearest) return;

    /* Fire 10 rounds (spread) */
    var roundGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.4, 6);
    var roundMat = new THREE.MeshLambertMaterial({ color: 0xFFAA00, emissive: 0xFF6600, emissiveIntensity: 0.8 });
    for (var r = 0; r < 10; r++) {
      var mesh = new THREE.Mesh(roundGeo, roundMat);
      mesh.position.copy(_recoveryTruck.position);
      mesh.position.y += 1.5;
      var dir = new THREE.Vector3(
        nearest.group.position.x - _recoveryTruck.position.x + (Math.random() - 0.5) * 4,
        0,
        nearest.group.position.z - _recoveryTruck.position.z + (Math.random() - 0.5) * 4
      ).normalize();
      dir.multiplyScalar(22);
      mesh.rotation.z = Math.PI / 2;
      _scene.add(mesh);
      _suppRounds.push({ mesh: mesh, vel: dir, life: 1.2 });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ENEMY BULLETS
  ════════════════════════════════════════════════════════════════════════ */

  function _enemyFireBullet(enemy) {
    var bulletGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 5);
    var bulletMat = new THREE.MeshLambertMaterial({ color: 0xFF4400 });
    var mesh      = new THREE.Mesh(bulletGeo, bulletMat);
    mesh.position.copy(enemy.group.position);
    mesh.position.y += 1.2;

    /* Aim at recovery truck with slight spread */
    var dir = new THREE.Vector3(
      _recoveryTruck.position.x - enemy.group.position.x + (Math.random() - 0.5) * 3,
      0,
      _recoveryTruck.position.z - enemy.group.position.z + (Math.random() - 0.5) * 3
    ).normalize();
    dir.multiplyScalar(18);
    mesh.rotation.z = Math.PI / 2;
    _scene.add(mesh);
    _enemyBullets.push({ mesh: mesh, vel: dir, life: 1.5 });
  }

  /* ════════════════════════════════════════════════════════════════════════
     RESCUE CHECK
  ════════════════════════════════════════════════════════════════════════ */

  function _checkRecoveryZone(dv) {
    if (dv.saved) return;
    if (!dv.repaired) return;
    var d = dist3v(dv.group.position, _recoveryZone.position);
    if (d < 8) {
      dv.saved = true;
      dv.towed = true;
      _vehiclesSaved++;
      _score += 500;

      /* Move crew NPCs to safety (near recovery zone) */
      for (var i = 0; i < dv.crewNPCs.length; i++) {
        dv.crewNPCs[i].position.set(
          _recoveryZone.position.x + (Math.random() - 0.5) * 4,
          0,
          _recoveryZone.position.z + (Math.random() - 0.5) * 4
        );
        dv.crewNPCs[i].rotation.x = 0; /* Stand up — saved */
      }

      /* Detach tow cable if this was the tow target */
      if (_towTarget === dv) {
        if (_towCable) {
          _scene.remove(_towCable);
          _towCable = null;
        }
        _towTarget = null;
      }

      if (_vehiclesSaved >= 3) {
        _missionClear = true;
        if (_missionTimer <= _MISSION_TIME) {
          _score += 1000; /* Time bonus */
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     UPDATE LOOP
  ════════════════════════════════════════════════════════════════════════ */

  function update(nowMs) {
    if (!_active) {
      /* Check V+R combo to launch */
      var now = nowMs / 1000;
      if (_keys['v'] || _keys['V']) _vrPressTime.V = now;
      if (_keys['r'] || _keys['R']) _vrPressTime.R = now;
      if ((_keys['v'] || _keys['V']) && (_keys['r'] || _keys['R'])) {
        if (Math.abs(_vrPressTime.V - _vrPressTime.R) < VR_WINDOW) {
          launchMission();
        }
      }
      _lastTime = now;
      return;
    }

    var now = nowMs / 1000;
    var dt  = Math.min(now - _lastTime, 0.1);
    _lastTime = now;

    _missionTimer += dt;
    _suppCooldown = Math.max(0, _suppCooldown - dt);

    /* ── Recovery truck movement (WASD) ──────────────────────────────────── */
    if (_playerAboard && _recoveryTruck && _truckHP > 0) {
      var spd = _truckSpeed * dt;
      if (_keys['w'] || _keys['W']) {
        if (!_weldActive) {
          _recoveryTruck.position.z -= spd;
        }
      }
      if (_keys['s'] || _keys['S']) {
        _recoveryTruck.position.z += spd;
      }
      if (_keys['a'] || _keys['A']) {
        _recoveryTruck.position.x -= spd;
        _recoveryTruck.rotation.y = Math.PI / 2;
      }
      if (_keys['d'] || _keys['D']) {
        _recoveryTruck.position.x += spd;
        _recoveryTruck.rotation.y = -Math.PI / 2;
      }
      if ((_keys['w'] || _keys['W']) && (_keys['d'] || _keys['D'])) {
        _recoveryTruck.rotation.y = -Math.PI / 4;
      }
      if ((_keys['w'] || _keys['W']) && (_keys['a'] || _keys['A'])) {
        _recoveryTruck.rotation.y = Math.PI / 4;
      }
      if ((_keys['s'] || _keys['S']) && !(_keys['a'] || _keys['A']) && !(_keys['d'] || _keys['D'])) {
        _recoveryTruck.rotation.y = Math.PI;
      }
      if ((_keys['w'] || _keys['W']) && !(_keys['a'] || _keys['A']) && !(_keys['d'] || _keys['D'])) {
        _recoveryTruck.rotation.y = 0;
      }
    }

    /* ── Camera follow recovery truck ────────────────────────────────────── */
    if (_camera && _recoveryTruck) {
      _camera.position.x += (_recoveryTruck.position.x - _camera.position.x) * 0.08;
      _camera.position.z += (_recoveryTruck.position.z + 22 - _camera.position.z) * 0.08;
      _camera.position.y = 18;
      _camera.lookAt(_recoveryTruck.position.x, 0, _recoveryTruck.position.z);
    }

    /* ── Tow cable — drag disabled vehicle ───────────────────────────────── */
    if (_towTarget && _recoveryTruck) {
      var tp  = _towTarget.group.position;
      var rkp = _recoveryTruck.position;
      var dx  = rkp.x - tp.x;
      var dz  = rkp.z - tp.z;
      var tdist = Math.sqrt(dx * dx + dz * dz);
      if (tdist > 5) {
        var towSpd = 4 * dt;
        _towTarget.group.position.x += (dx / tdist) * towSpd;
        _towTarget.group.position.z += (dz / tdist) * towSpd;
      }
      updateTowCablePositions();
      _checkRecoveryZone(_towTarget);
    }

    /* ── Jack animation ──────────────────────────────────────────────────── */
    if (_jackActive && _jackTarget) {
      _jackTimer += dt;
      var jt    = Math.min(_jackTimer / _jackDuration, 1);
      _jackTarget.group.rotation.z = lerpAngle(_jackTarget.originalRotZ, 0, jt);
      if (_jackTimer >= _jackDuration) {
        _jackActive = false;
        /* Remove jack mesh */
        if (_jackMesh) {
          _scene.remove(_jackMesh);
          _jackMesh = null;
        }
        /* Truck is now level — mark the wheel as fixed (hide missingPart) */
        if (_jackTarget.missingPart) {
          _jackTarget.missingPart.visible = false;
        }
        _jackTarget.repaired = true;
        _jackTarget = null;
      }
    }

    /* ── Weld animation ──────────────────────────────────────────────────── */
    if (_weldActive && _weldTarget) {
      _weldTimer += dt;
      /* Spawn sparks */
      if (Math.random() < 0.6) {
        _spawnWeldSpark(_weldTarget.group.position);
      }
      /* Update sparks */
      for (var si = _weldSparks.length - 1; si >= 0; si--) {
        var sp = _weldSparks[si];
        sp.life -= dt;
        sp.mesh.position.x += sp.vel.x * dt;
        sp.mesh.position.y += sp.vel.y * dt - 9.8 * dt * dt;
        sp.mesh.position.z += sp.vel.z * dt;
        if (sp.life <= 0) {
          _scene.remove(sp.mesh);
          _weldSparks.splice(si, 1);
        }
      }
      if (_weldTimer >= _weldDuration) {
        _weldActive = false;
        /* Repair the component */
        if (_weldTarget.missingPart) {
          _weldTarget.missingPart.visible = false;
        }
        _weldTarget.repaired = true;
        /* Clean up weld light */
        if (_weldLight) {
          _scene.remove(_weldLight);
          _weldLight = null;
        }
        /* Clear remaining sparks */
        for (var sri = _weldSparks.length - 1; sri >= 0; sri--) {
          _scene.remove(_weldSparks[sri].mesh);
        }
        _weldSparks = [];
        _weldTarget = null;
      }
    }

    /* ── Supply caches — collect ─────────────────────────────────────────── */
    for (var sci = 0; sci < _supplyCaches.length; sci++) {
      var sc = _supplyCaches[sci];
      if (sc.collected) continue;
      if (dist3(_recoveryTruck, sc.mesh) < 3) {
        sc.collected = true;
        sc.mesh.visible = false;
        _partsCount++;
      }
    }

    /* ── Enemies ─────────────────────────────────────────────────────────── */
    for (var eni = 0; eni < _enemies.length; eni++) {
      var en = _enemies[eni];
      if (!en.alive) continue;

      /* Approach recovery truck */
      var exd = _recoveryTruck.position.x - en.group.position.x;
      var ezd = _recoveryTruck.position.z - en.group.position.z;
      var ed  = Math.sqrt(exd * exd + ezd * ezd);
      if (ed > 12) {
        var eMoveSpd = 3 * dt;
        en.group.position.x += (exd / ed) * eMoveSpd;
        en.group.position.z += (ezd / ed) * eMoveSpd;
      }

      /* Fire at player */
      en.fireTimer -= dt;
      if (en.fireTimer <= 0) {
        _enemyFireBullet(en);
        en.fireTimer = 1.5 + Math.random() * 2.5;
      }
    }

    /* ── Enemy bullets ───────────────────────────────────────────────────── */
    for (var ebi = _enemyBullets.length - 1; ebi >= 0; ebi--) {
      var eb = _enemyBullets[ebi];
      eb.life -= dt;
      eb.mesh.position.x += eb.vel.x * dt;
      eb.mesh.position.z += eb.vel.z * dt;
      /* Hit check on recovery truck */
      if (_recoveryTruck && dist3(eb.mesh, _recoveryTruck) < 2) {
        _truckHP -= 12;
        _scene.remove(eb.mesh);
        _enemyBullets.splice(ebi, 1);
        continue;
      }
      if (eb.life <= 0) {
        _scene.remove(eb.mesh);
        _enemyBullets.splice(ebi, 1);
      }
    }

    /* ── Suppression rounds ──────────────────────────────────────────────── */
    for (var sri2 = _suppRounds.length - 1; sri2 >= 0; sri2--) {
      var sr = _suppRounds[sri2];
      sr.life -= dt;
      sr.mesh.position.x += sr.vel.x * dt;
      sr.mesh.position.z += sr.vel.z * dt;
      /* Hit check on enemies */
      for (var ehi = 0; ehi < _enemies.length; ehi++) {
        var ehe = _enemies[ehi];
        if (!ehe.alive) continue;
        if (dist3(sr.mesh, ehe.group) < 2) {
          ehe.hp -= 40;
          if (ehe.hp <= 0) {
            ehe.alive = false;
            _scene.remove(ehe.group);
            _score += 100;
          }
          _scene.remove(sr.mesh);
          _suppRounds.splice(sri2, 1);
          break;
        }
      }
      if (sri2 < _suppRounds.length && sr.life <= 0) {
        _scene.remove(sr.mesh);
        _suppRounds.splice(sri2, 1);
      }
    }

    /* ── Bounce supply caches (visual) ──────────────────────────────────── */
    for (var sbi = 0; sbi < _supplyCaches.length; sbi++) {
      var sb = _supplyCaches[sbi];
      if (!sb.collected) {
        sb.mesh.position.y = 0.25 + Math.sin(now * 2 + sbi) * 0.08;
        sb.mesh.rotation.y = now * 0.8;
      }
    }

    /* ── Check all vehicles in recovery zone ─────────────────────────────── */
    for (var rzi = 0; rzi < _disabledVehicles.length; rzi++) {
      var rvd = _disabledVehicles[rzi];
      if (!rvd.saved && rvd.repaired && rvd.towed) {
        _checkRecoveryZone(rvd);
      }
    }

    /* ── Recovery zone pulse ─────────────────────────────────────────────── */
    if (_recoveryZone) {
      _recoveryZone.material.opacity = 0.35 + Math.sin(now * 2) * 0.15;
    }

    _updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT HANDLERS
  ════════════════════════════════════════════════════════════════════════ */

  function _onKeyDown(e) {
    _keys[e.key] = true;

    if (!_active) return;

    /* T — tow cable */
    if (e.key === 't' || e.key === 'T') {
      tryAttachTow();
    }

    /* J — jack */
    if (e.key === 'j' || e.key === 'J') {
      tryJack();
    }

    /* W — weld (hold W near vehicle with parts) */
    if ((e.key === 'w' || e.key === 'W') && _partsCount > 0 && !_weldActive) {
      /* Check if near a damaged vehicle */
      for (var i = 0; i < _disabledVehicles.length; i++) {
        var dv = _disabledVehicles[i];
        if (dv.repaired) continue;
        if (dist3(_recoveryTruck, dv.group) <= 9) {
          tryStartWeld();
          break;
        }
      }
    }

    /* F — suppression fire */
    if (e.key === 'f' || e.key === 'F') {
      callSuppressionFire();
    }
  }

  function _onKeyUp(e) {
    _keys[e.key] = false;
  }

  /* ════════════════════════════════════════════════════════════════════════
     RESET
  ════════════════════════════════════════════════════════════════════════ */

  function reset() {
    _active = false;

    /* Remove disabled vehicles */
    for (var vi = 0; vi < _disabledVehicles.length; vi++) {
      var dv = _disabledVehicles[vi];
      _scene.remove(dv.group);
      for (var ci = 0; ci < dv.crewNPCs.length; ci++) {
        _scene.remove(dv.crewNPCs[ci]);
      }
    }
    _disabledVehicles = [];

    /* Remove recovery truck */
    if (_recoveryTruck) {
      _scene.remove(_recoveryTruck);
      _recoveryTruck = null;
    }

    /* Remove tow cable */
    if (_towCable) {
      _scene.remove(_towCable);
      _towCable = null;
    }
    _towTarget = null;

    /* Remove jack */
    if (_jackMesh) {
      _scene.remove(_jackMesh);
      _jackMesh = null;
    }

    /* Remove weld light */
    if (_weldLight) {
      _scene.remove(_weldLight);
      _weldLight = null;
    }

    /* Remove sparks */
    for (var si = 0; si < _weldSparks.length; si++) {
      _scene.remove(_weldSparks[si].mesh);
    }
    _weldSparks = [];

    /* Remove supply caches */
    for (var sci = 0; sci < _supplyCaches.length; sci++) {
      _scene.remove(_supplyCaches[sci].mesh);
    }
    _supplyCaches = [];

    /* Remove enemies */
    for (var ei = 0; ei < _enemies.length; ei++) {
      _scene.remove(_enemies[ei].group);
    }
    _enemies = [];

    /* Remove bullets */
    for (var ebi = 0; ebi < _enemyBullets.length; ebi++) {
      _scene.remove(_enemyBullets[ebi].mesh);
    }
    _enemyBullets = [];

    /* Remove suppression rounds */
    for (var sri = 0; sri < _suppRounds.length; sri++) {
      _scene.remove(_suppRounds[sri].mesh);
    }
    _suppRounds = [];

    /* Remove recovery zone */
    if (_recoveryZone) {
      _scene.remove(_recoveryZone);
      _recoveryZone = null;
    }

    /* Remove HUD */
    if (_hud) {
      document.body.removeChild(_hud);
      _hud = null;
    }

    _score         = 0;
    _vehiclesSaved = 0;
    _missionClear  = false;
    _missionTimer  = 0;
    _truckHP       = 300;
    _partsCount    = 0;
    _suppCooldown  = 0;
    _jackActive    = false;
    _weldActive    = false;
  }

  /* ════════════════════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;
    _keys   = {};
    _active = false;

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
  }

  /* ── Public API ────────────────────────────────────────────────────────── */
  return { init: init, update: update, reset: reset };

}());
