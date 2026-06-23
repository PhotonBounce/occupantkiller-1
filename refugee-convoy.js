/* ───────────────────────────────────────────────────────────────────────────
   refugee-convoy.js — Refugee Convoy Escort Mini-Game
   API: window.RefugeeConvoy = { init, update, reset }
   Controls:
     R + F keys together  → activate module (400ms window)
     WASD                 → drive escort motorcycle
     Space                → shoot threats
     Q                    → call air support (CAS) — 60s cooldown
     E                    → treat injured civilians (when adjacent)
     C                    → detonate C4 on roadblock (1 charge)
   ─────────────────────────────────────────────────────────────────────────── */
window.RefugeeConvoy = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;

  /* ── Mission state ─────────────────────────────────────────────────────── */
  var _active        = false;
  var _missionDone   = false;
  var _missionFailed = false;
  var _score         = 0;
  var _lastTime      = 0;
  var _missionTimer  = 0;

  /* ── R+F activation tracking ────────────────────────────────────────────── */
  var _rPressTime    = 0;
  var _fPressTime    = 0;
  var RF_WINDOW      = 0.4;

  /* ── Input ─────────────────────────────────────────────────────────────── */
  var _keys = {};

  /* ── Waypoints ──────────────────────────────────────────────────────────── */
  var WAYPOINTS = [
    new THREE.Vector3(  0, 0,   0),
    new THREE.Vector3(  0, 0,  40),
    new THREE.Vector3(  0, 0,  80),
    new THREE.Vector3(  0, 0, 120)
  ];
  var _waypointStructures = [];
  var _currentWaypoint    = 0;

  /* ── Safe Zone ──────────────────────────────────────────────────────────── */
  var _safeZoneMesh  = null;
  var SAFE_ZONE_POS  = new THREE.Vector3(0, 0, 160);

  /* ── Buses ──────────────────────────────────────────────────────────────── */
  var BUS_SPEED      = 5;
  var BUS_HP_MAX     = 200;
  var BUS_COUNT      = 3;
  var _buses         = [];
  /* each bus: { group, hp, burning, burnLight, civilians, saved, destroyed } */

  /* ── Civilians ──────────────────────────────────────────────────────────── */
  var CIVS_PER_BUS   = 5;
  var _scatteredCivs = [];
  /* each scattered civ: { group, hp, maxHp, alive, runDir, treated } */
  var _totalCivsSaved   = 0;
  var _totalCivsLost    = 0;
  var _totalCivs        = 15; /* 3 buses × 5 */

  /* ── Medical supply crate ───────────────────────────────────────────────── */
  var _medCrateMesh  = null;
  var _medCrateUsed  = false;

  /* ── Player motorcycle ──────────────────────────────────────────────────── */
  var _playerGroup   = null;
  var _playerPos     = new THREE.Vector3(-6, 1, 0);
  var _playerVel     = new THREE.Vector3(0, 0, 0);
  var _playerYaw     = 0;
  var _playerHP      = 100;
  var PLAYER_SPEED   = 18;
  var PLAYER_ACCEL   = 20;
  var PLAYER_FRICTION= 0.88;

  /* ── Shooting ────────────────────────────────────────────────────────────── */
  var _bullets       = [];
  var _shootCooldown = 0;
  var SHOOT_RATE     = 0.12; /* seconds between shots */

  /* ── Enemies ────────────────────────────────────────────────────────────── */
  var _enemies       = [];
  /* each enemy: { group, hp, alive, type, fireTimer, suppressTimer,
                   muzzleFlash, pos, target, vehicleMesh } */
  /* types: 'sniper', 'infantry', 'vehicle' */

  /* ── Roadblock ───────────────────────────────────────────────────────────── */
  var _roadblockGroup    = null;
  var _roadblockBarriers = [];
  /* each barrier: { mesh, hp } */
  var _roadblockCleared  = false;
  var _c4Available       = true;

  /* ── Air support ─────────────────────────────────────────────────────────── */
  var _casCooldown   = 0;
  var CAS_COOLDOWN   = 60;
  var _casActive     = false;
  var _casAircraft   = null;
  var _casTimer      = 0;
  var CAS_DURATION   = 6;

  /* ── HUD ─────────────────────────────────────────────────────────────────── */
  var _hudEl         = null;

  /* ── Explosion FX pool ───────────────────────────────────────────────────── */
  var _explosions    = [];

  /* ════════════════════════════════════════════════════════════════════════════
     GEOMETRY HELPERS
  ════════════════════════════════════════════════════════════════════════════ */

  function _makeMesh(geo, color, wireframe) {
    var mat = new THREE.MeshLambertMaterial({ color: color, wireframe: !!wireframe });
    return new THREE.Mesh(geo, mat);
  }

  function _makeLines(geo, color) {
    var mat = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(geo, mat);
  }

  /* ════════════════════════════════════════════════════════════════════════════
     BUILD SCENE OBJECTS
  ════════════════════════════════════════════════════════════════════════════ */

  function _buildGround() {
    var geo  = new THREE.BoxGeometry(60, 0.2, 200);
    var mesh = _makeMesh(geo, 0x556655);
    mesh.position.set(0, -0.1, 80);
    _scene.add(mesh);

    /* road strip */
    var roadGeo = new THREE.BoxGeometry(8, 0.22, 200);
    var road    = _makeMesh(roadGeo, 0x333333);
    road.position.set(0, -0.09, 80);
    _scene.add(road);
  }

  function _buildWaypointStructure(wp, index) {
    var group = new THREE.Group();
    /* arch left post */
    var postGeo = new THREE.BoxGeometry(0.6, 6, 0.6);
    var lPost   = _makeMesh(postGeo, 0x667788);
    lPost.position.set(-5, 3, 0);
    group.add(lPost);
    /* arch right post */
    var rPost = _makeMesh(postGeo.clone(), 0x667788);
    rPost.position.set(5, 3, 0);
    group.add(rPost);
    /* arch top */
    var topGeo = new THREE.BoxGeometry(10.6, 0.6, 0.6);
    var top    = _makeMesh(topGeo, 0x667788);
    top.position.set(0, 6.3, 0);
    group.add(top);
    /* waypoint sign */
    var signGeo  = new THREE.BoxGeometry(3, 1, 0.15);
    var sign     = _makeMesh(signGeo, 0xFFFF00);
    sign.position.set(0, 4.5, 0);
    group.add(sign);

    group.position.copy(wp);
    group.userData.index = index;
    _scene.add(group);
    _waypointStructures.push(group);
  }

  function _buildSafeZone() {
    var geo  = new THREE.BoxGeometry(15, 0.3, 15);
    var mat  = new THREE.MeshLambertMaterial({ color: 0x00FF44, transparent: true, opacity: 0.55 });
    _safeZoneMesh = new THREE.Mesh(geo, mat);
    _safeZoneMesh.position.copy(SAFE_ZONE_POS);
    _safeZoneMesh.position.y = 0.15;
    _scene.add(_safeZoneMesh);

    /* border box */
    var borderGeo = new THREE.BoxGeometry(15, 4, 15);
    var borderMat = new THREE.MeshLambertMaterial({ color: 0x00FF44, transparent: true, opacity: 0.15 });
    var border    = new THREE.Mesh(borderGeo, borderMat);
    border.position.copy(SAFE_ZONE_POS);
    border.position.y = 2;
    _scene.add(border);
  }

  function _buildBus(index) {
    var group = new THREE.Group();

    /* bus body */
    var bodyGeo  = new THREE.BoxGeometry(8, 3, 3);
    var bodyMesh = _makeMesh(bodyGeo, 0xFFFFDD);
    bodyMesh.position.set(0, 1.5, 0);
    group.add(bodyMesh);

    /* wheels (4) */
    var wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 8);
    var wheelPositions = [
      new THREE.Vector3(-2.8, 0.6, 1.6),
      new THREE.Vector3( 2.8, 0.6, 1.6),
      new THREE.Vector3(-2.8, 0.6,-1.6),
      new THREE.Vector3( 2.8, 0.6,-1.6)
    ];
    for (var w = 0; w < wheelPositions.length; w++) {
      var wheel = _makeMesh(wheelGeo.clone(), 0x222222);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.copy(wheelPositions[w]);
      group.add(wheel);
    }

    /* window outlines (LineSegments) — front and back faces */
    var winPositions = [-2.5, -0.5, 0.5, 1.5];
    for (var wi = 0; wi < winPositions.length; wi++) {
      var wx = winPositions[wi];
      var winGeo = new THREE.BoxGeometry(0.9, 0.8, 0.1);
      var winLines = _makeLines(new THREE.EdgesGeometry(winGeo), 0x88CCFF);
      winLines.position.set(wx, 1.9, 1.51);
      group.add(winLines);
      var winLinesB = _makeLines(new THREE.EdgesGeometry(winGeo), 0x88CCFF);
      winLinesB.position.set(wx, 1.9, -1.51);
      group.add(winLinesB);
    }

    /* headlights */
    var hlGeo = new THREE.BoxGeometry(0.3, 0.3, 0.1);
    var hlL   = _makeMesh(hlGeo.clone(), 0xFFFF99);
    hlL.position.set(-3, 1.4, 1.51);
    group.add(hlL);
    var hlR = _makeMesh(hlGeo.clone(), 0xFFFF99);
    hlR.position.set(-3, 1.4, -1.51);
    group.add(hlR);

    /* civilian passengers visible through windows */
    var civMeshes = [];
    for (var c = 0; c < CIVS_PER_BUS; c++) {
      var civGeo  = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 6);
      var civMesh = _makeMesh(civGeo, 0xFFAA88);
      var cx = -3 + c * 1.4;
      civMesh.position.set(cx, 1.55, 0);
      group.add(civMesh);
      civMeshes.push(civMesh);
    }

    /* starting positions: staggered behind each other along Z */
    group.position.set(0, 0, -12 * index);
    group.rotation.y = 0;

    _scene.add(group);

    var busObj = {
      group:    group,
      hp:       BUS_HP_MAX,
      burning:  false,
      burnLight:null,
      civilians:civMeshes,
      civCount: CIVS_PER_BUS,
      saved:    false,
      destroyed:false,
      hitTimer: 0
    };
    _buses.push(busObj);

    /* medical crate in bus 0 */
    if (index === 0) {
      var crateGeo   = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      _medCrateMesh  = _makeMesh(crateGeo, 0xCC2222);
      _medCrateMesh.position.set(3, 0.4, 0);
      group.add(_medCrateMesh);
    }
  }

  function _buildPlayer() {
    var group = new THREE.Group();

    /* motorcycle body */
    var bodyGeo = new THREE.BoxGeometry(3, 1, 1.5);
    var body    = _makeMesh(bodyGeo, 0x444444);
    body.position.set(0, 0.5, 0);
    group.add(body);

    /* handlebars */
    var barGeo = new THREE.BoxGeometry(1.6, 0.15, 0.15);
    var bars   = _makeMesh(barGeo, 0x666666);
    bars.position.set(-1.1, 1.1, 0);
    group.add(bars);

    /* wheels */
    var wGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.25, 8);
    var fw   = _makeMesh(wGeo.clone(), 0x222222);
    fw.rotation.z = Math.PI / 2;
    fw.position.set(-1.2, 0.5, 0);
    group.add(fw);
    var rw = _makeMesh(wGeo.clone(), 0x222222);
    rw.rotation.z = Math.PI / 2;
    rw.position.set(1.2, 0.5, 0);
    group.add(rw);

    /* rider */
    var riderGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 6);
    var rider    = _makeMesh(riderGeo, 0x334455);
    rider.position.set(0.3, 1.6, 0);
    group.add(rider);

    /* rider head */
    var headGeo = new THREE.SphereGeometry(0.3, 6, 6);
    var head    = _makeMesh(headGeo, 0xFFCC99);
    head.position.set(0.3, 2.5, 0);
    group.add(head);

    group.position.copy(_playerPos);
    _scene.add(group);
    _playerGroup = group;
  }

  function _buildEnemySniper(x, z) {
    var group = new THREE.Group();

    /* body */
    var bodyGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.5, 6);
    var body    = _makeMesh(bodyGeo, 0x3A4A2A);
    body.position.set(0, 0.75, 0);
    group.add(body);

    /* head */
    var headGeo = new THREE.SphereGeometry(0.3, 6, 6);
    var head    = _makeMesh(headGeo, 0x5A4A3A);
    head.position.set(0, 1.65, 0);
    group.add(head);

    /* rifle (LineSegments) */
    var rifleGeo   = new THREE.BoxGeometry(2.0, 0.1, 0.1);
    var rifleLines = _makeLines(new THREE.EdgesGeometry(rifleGeo), 0x888888);
    rifleLines.position.set(0, 1.1, 0);
    group.add(rifleLines);

    /* muzzle flash (hidden by default) */
    var flashGeo  = new THREE.SphereGeometry(0.25, 4, 4);
    var flash     = _makeMesh(flashGeo, 0xFFFF44);
    flash.position.set(-1.1, 1.1, 0);
    flash.visible  = false;
    group.add(flash);

    group.position.set(x, 0, z);
    _scene.add(group);

    return {
      group:         group,
      hp:            60,
      alive:         true,
      type:          'sniper',
      fireTimer:     2 + Math.random() * 3,
      suppressTimer: 0,
      muzzleFlash:   flash,
      flashTimer:    0,
      pos:           group.position
    };
  }

  function _buildEnemyInfantry(x, z) {
    var group = new THREE.Group();

    var bodyGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.4, 6);
    var body    = _makeMesh(bodyGeo, 0x4A3A2A);
    body.position.set(0, 0.7, 0);
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.28, 6, 6);
    var head    = _makeMesh(headGeo, 0x5A4A3A);
    head.position.set(0, 1.55, 0);
    group.add(head);

    /* weapon */
    var wGeo  = new THREE.BoxGeometry(1.2, 0.1, 0.1);
    var wLine = _makeLines(new THREE.EdgesGeometry(wGeo), 0x777777);
    wLine.position.set(0, 1.0, 0);
    group.add(wLine);

    group.position.set(x, 0, z);
    _scene.add(group);

    return {
      group:         group,
      hp:            40,
      alive:         true,
      type:          'infantry',
      fireTimer:     1 + Math.random() * 2,
      suppressTimer: 0,
      muzzleFlash:   null,
      flashTimer:    0,
      pos:           group.position
    };
  }

  function _buildEnemyVehicle(x, z) {
    var group = new THREE.Group();

    /* jeep body */
    var bodyGeo = new THREE.BoxGeometry(3.5, 1.2, 2);
    var body    = _makeMesh(bodyGeo, 0x445533);
    body.position.set(0, 0.9, 0);
    group.add(body);

    /* gun mount */
    var gunBaseGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    var gunBase    = _makeMesh(gunBaseGeo, 0x223322);
    gunBase.position.set(0.5, 1.8, 0);
    group.add(gunBase);

    var barrelGeo  = new THREE.BoxGeometry(1.5, 0.2, 0.2);
    var barrel     = _makeMesh(barrelGeo, 0x333333);
    barrel.position.set(1.2, 1.8, 0);
    group.add(barrel);

    /* wheels */
    var wGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 8);
    var wps  = [
      new THREE.Vector3(-1.2, 0.5,  1.1),
      new THREE.Vector3( 1.2, 0.5,  1.1),
      new THREE.Vector3(-1.2, 0.5, -1.1),
      new THREE.Vector3( 1.2, 0.5, -1.1)
    ];
    for (var wi = 0; wi < wps.length; wi++) {
      var wm = _makeMesh(wGeo.clone(), 0x222222);
      wm.rotation.z = Math.PI / 2;
      wm.position.copy(wps[wi]);
      group.add(wm);
    }

    group.position.set(x, 0, z);
    _scene.add(group);

    return {
      group:      group,
      hp:         120,
      alive:      true,
      type:       'vehicle',
      fireTimer:  3 + Math.random() * 2,
      suppressTimer: 0,
      muzzleFlash: null,
      flashTimer:  0,
      pos:         group.position
    };
  }

  function _buildRoadblock() {
    _roadblockGroup    = new THREE.Group();
    _roadblockBarriers = [];

    var bGeo = new THREE.BoxGeometry(3, 1.2, 0.6);
    var positions = [-3, 0, 3];
    for (var i = 0; i < positions.length; i++) {
      var barrier = _makeMesh(bGeo.clone(), 0x8B1A1A);
      barrier.position.set(positions[i], 0.6, 0);
      _roadblockGroup.add(barrier);
      _roadblockBarriers.push({ mesh: barrier, hp: 2 });
    }

    /* stripes */
    var stripeGeo = new THREE.BoxGeometry(10, 0.3, 0.1);
    var stripe    = _makeMesh(stripeGeo, 0xFFFF00);
    stripe.position.set(0, 1.0, 0);
    _roadblockGroup.add(stripe);

    _roadblockGroup.position.copy(WAYPOINTS[1]);
    _roadblockGroup.position.z += 2;
    _roadblockGroup.position.y  = 0;
    _scene.add(_roadblockGroup);
  }

  function _buildScatteredCiv(busPos) {
    var group  = new THREE.Group();
    var civGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 6);
    var civ    = _makeMesh(civGeo, 0xFFAA88);
    civ.position.set(0, 0.6, 0);
    group.add(civ);

    /* head */
    var hGeo = new THREE.SphereGeometry(0.25, 5, 5);
    var head = _makeMesh(hGeo, 0xFFCC99);
    head.position.set(0, 1.45, 0);
    group.add(head);

    /* arms */
    var armGeo = new THREE.BoxGeometry(0.15, 0.7, 0.15);
    var armL   = _makeMesh(armGeo.clone(), 0xFFAA88);
    armL.position.set(-0.4, 0.9, 0);
    armL.rotation.z = 0.4;
    group.add(armL);
    var armR = _makeMesh(armGeo.clone(), 0xFFAA88);
    armR.position.set(0.4, 0.9, 0);
    armR.rotation.z = -0.4;
    group.add(armR);

    var offsetX = (Math.random() - 0.5) * 4;
    var offsetZ = (Math.random() - 0.5) * 3;
    group.position.set(busPos.x + offsetX, 0, busPos.z + offsetZ);

    _scene.add(group);

    var runDir = new THREE.Vector3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2).normalize();

    return {
      group:   group,
      hp:      60,
      maxHp:   60,
      alive:   true,
      runDir:  runDir,
      treated: false,
      bobTimer:0
    };
  }

  function _buildCASAircraft() {
    var group = new THREE.Group();

    /* fuselage */
    var fGeo = new THREE.BoxGeometry(6, 0.8, 1.0);
    var f    = _makeMesh(fGeo, 0x778899);
    f.position.set(0, 0, 0);
    group.add(f);

    /* wings */
    var wGeo = new THREE.BoxGeometry(1.5, 0.2, 6);
    var wing = _makeMesh(wGeo, 0x667788);
    wing.position.set(0, 0, 0);
    group.add(wing);

    /* nose */
    var nGeo = new THREE.ConeGeometry(0.4, 1.5, 6);
    var nose = _makeMesh(nGeo, 0x556677);
    nose.rotation.z = -Math.PI / 2;
    nose.position.set(3.7, 0, 0);
    group.add(nose);

    group.position.set(-40, 30, 80);
    _scene.add(group);
    return group;
  }

  function _spawnExplosion(pos, color, scale) {
    var geo  = new THREE.SphereGeometry(scale || 1, 6, 6);
    var mat  = new THREE.MeshLambertMaterial({ color: color || 0xFF6600, transparent: true, opacity: 1.0 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.position.y += 0.5;
    _scene.add(mesh);
    _explosions.push({ mesh: mesh, mat: mat, life: 0.5, maxLife: 0.5 });
  }

  /* ════════════════════════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════════════════════════ */

  function _buildScene() {
    _buildGround();

    for (var i = 0; i < WAYPOINTS.length; i++) {
      _buildWaypointStructure(WAYPOINTS[i], i);
    }
    _buildSafeZone();

    for (var b = 0; b < BUS_COUNT; b++) {
      _buildBus(b);
    }

    _buildPlayer();
    _buildRoadblock();

    /* 6 snipers spread along route flanks */
    var sniperDefs = [
      { x: -18, z: 15 }, { x: 18, z: 20 },
      { x: -20, z: 55 }, { x: 22, z: 60 },
      { x: -17, z: 95 }, { x: 19, z: 100 }
    ];
    for (var s = 0; s < sniperDefs.length; s++) {
      _enemies.push(_buildEnemySniper(sniperDefs[s].x, sniperDefs[s].z));
    }

    /* 4 infantry at waypoint 2 roadblock area */
    var infDefs = [
      { x: -4, z: 43 }, { x: 4, z: 43 },
      { x: -4, z: 47 }, { x: 4, z: 47 }
    ];
    for (var ii = 0; ii < infDefs.length; ii++) {
      _enemies.push(_buildEnemyInfantry(infDefs[ii].x, infDefs[ii].z));
    }

    /* 2 enemy vehicles */
    _enemies.push(_buildEnemyVehicle(-14, 70));
    _enemies.push(_buildEnemyVehicle(15,  90));
  }

  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'refugee-convoy-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#EEFFCC',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 14px',
      'border:1px solid #445533',
      'border-radius:4px',
      'z-index:1000',
      'pointer-events:none',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;

    var busesAlive = 0;
    for (var b = 0; b < _buses.length; b++) {
      if (!_buses[b].destroyed && !_buses[b].saved) busesAlive++;
      if (_buses[b].saved) busesAlive++; /* count saved too */
    }
    var busesSaved = 0;
    for (var bs = 0; bs < _buses.length; bs++) {
      if (_buses[bs].saved) busesSaved++;
    }

    var civsLive = _totalCivs;
    for (var sc = 0; sc < _scatteredCivs.length; sc++) {
      if (!_scatteredCivs[sc].alive) civsLive--;
    }

    var threatsLeft = 0;
    for (var e = 0; e < _enemies.length; e++) {
      if (_enemies[e].alive) threatsLeft++;
    }

    /* ETA calculation */
    var leadZ   = _buses.length > 0 ? _buses[0].group.position.z : 0;
    var distLeft= Math.max(0, SAFE_ZONE_POS.z - leadZ);
    var eta     = BUS_SPEED > 0 ? Math.ceil(distLeft / BUS_SPEED) : 999;
    var etaMM   = Math.floor(eta / 60);
    var etaSS   = eta % 60;
    var etaStr  = (etaMM < 10 ? '0' : '') + etaMM + ':' + (etaSS < 10 ? '0' : '') + etaSS;

    var casStr = _casCooldown > 0
      ? ' | CAS: ' + Math.ceil(_casCooldown) + 's'
      : ' | CAS: READY [Q]';

    var c4Str  = _c4Available ? ' | C4: ARMED [C]' : ' | C4: USED';
    var hpStr  = ' | HP: ' + Math.max(0, _playerHP);

    _hudEl.textContent = 'CONVOY [BUSES: ' + busesSaved + '/' + BUS_COUNT +
      '] [CIVILIANS: ' + civsLive + '/' + _totalCivs +
      '] [WAYPOINT: ' + (_currentWaypoint + 1) + '/' + WAYPOINTS.length +
      '] [THREATS: ' + threatsLeft + ']' +
      ' | ETA SAFE ZONE: ' + etaStr +
      casStr + c4Str + hpStr;
  }

  /* ════════════════════════════════════════════════════════════════════════════
     CLEANUP
  ════════════════════════════════════════════════════════════════════════════ */

  function _removeAll() {
    /* remove buses */
    for (var b = 0; b < _buses.length; b++) {
      if (_buses[b].group && _buses[b].group.parent) {
        _scene.remove(_buses[b].group);
      }
      if (_buses[b].burnLight && _buses[b].burnLight.parent) {
        _buses[b].group.remove(_buses[b].burnLight);
      }
    }
    _buses = [];

    /* remove enemies */
    for (var e = 0; e < _enemies.length; e++) {
      if (_enemies[e].group && _enemies[e].group.parent) {
        _scene.remove(_enemies[e].group);
      }
    }
    _enemies = [];

    /* remove scattered civs */
    for (var sc = 0; sc < _scatteredCivs.length; sc++) {
      if (_scatteredCivs[sc].group && _scatteredCivs[sc].group.parent) {
        _scene.remove(_scatteredCivs[sc].group);
      }
    }
    _scatteredCivs = [];

    /* remove bullets */
    for (var bl = 0; bl < _bullets.length; bl++) {
      if (_bullets[bl].mesh && _bullets[bl].mesh.parent) {
        _scene.remove(_bullets[bl].mesh);
      }
    }
    _bullets = [];

    /* remove explosions */
    for (var ex = 0; ex < _explosions.length; ex++) {
      if (_explosions[ex].mesh && _explosions[ex].mesh.parent) {
        _scene.remove(_explosions[ex].mesh);
      }
    }
    _explosions = [];

    /* remove roadblock */
    if (_roadblockGroup && _roadblockGroup.parent) {
      _scene.remove(_roadblockGroup);
    }
    _roadblockGroup    = null;
    _roadblockBarriers = [];

    /* remove player */
    if (_playerGroup && _playerGroup.parent) {
      _scene.remove(_playerGroup);
    }
    _playerGroup = null;

    /* remove waypoint structures */
    for (var wp = 0; wp < _waypointStructures.length; wp++) {
      if (_waypointStructures[wp].parent) {
        _scene.remove(_waypointStructures[wp]);
      }
    }
    _waypointStructures = [];

    /* remove safe zone */
    if (_safeZoneMesh && _safeZoneMesh.parent) {
      _scene.remove(_safeZoneMesh);
    }
    _safeZoneMesh = null;

    /* remove CAS aircraft */
    if (_casAircraft && _casAircraft.parent) {
      _scene.remove(_casAircraft);
    }
    _casAircraft = null;

    /* remove ground/road — they are added anonymously; skip for brevity */
  }

  /* ════════════════════════════════════════════════════════════════════════════
     PLAYER MOVEMENT
  ════════════════════════════════════════════════════════════════════════════ */

  function _updatePlayer(dt) {
    if (!_playerGroup) return;

    /* steering */
    if (_keys['KeyA'] || _keys['ArrowLeft'])  _playerYaw += 1.8 * dt;
    if (_keys['KeyD'] || _keys['ArrowRight']) _playerYaw -= 1.8 * dt;

    var forward = new THREE.Vector3(-Math.sin(_playerYaw), 0, -Math.cos(_playerYaw));

    if (_keys['KeyW'] || _keys['ArrowUp']) {
      _playerVel.addScaledVector(forward, PLAYER_ACCEL * dt);
    }
    if (_keys['KeyS'] || _keys['ArrowDown']) {
      _playerVel.addScaledVector(forward, -PLAYER_ACCEL * 0.5 * dt);
    }

    /* friction */
    _playerVel.multiplyScalar(Math.pow(PLAYER_FRICTION, dt * 60));

    /* clamp speed */
    var speed = _playerVel.length();
    if (speed > PLAYER_SPEED) {
      _playerVel.multiplyScalar(PLAYER_SPEED / speed);
    }

    _playerPos.addScaledVector(_playerVel, dt);

    /* clamp to world bounds */
    _playerPos.x = Math.max(-28, Math.min(28, _playerPos.x));
    _playerPos.z = Math.max(-20, Math.min(175, _playerPos.z));

    _playerGroup.position.copy(_playerPos);
    _playerGroup.rotation.y = _playerYaw;

    /* shooting */
    _shootCooldown -= dt;
    if (_keys['Space'] && _shootCooldown <= 0) {
      _fireBullet();
      _shootCooldown = SHOOT_RATE;
    }

    /* treat nearby injured civilians with E */
    if (_keys['KeyE']) {
      _tryTreatCivilian();
    }

    /* C4 on roadblock */
    if (_keys['KeyC'] && _c4Available && !_roadblockCleared) {
      _useC4();
    }
  }

  function _fireBullet() {
    var geo    = new THREE.SphereGeometry(0.15, 4, 4);
    var mesh   = _makeMesh(geo, 0xFFFF00);
    mesh.position.copy(_playerPos);
    mesh.position.y += 1.0;
    _scene.add(mesh);

    var dir = new THREE.Vector3(-Math.sin(_playerYaw), 0, -Math.cos(_playerYaw));

    _bullets.push({
      mesh:  mesh,
      dir:   dir,
      speed: 40,
      life:  2.0,
      fromPlayer: true
    });
  }

  /* ════════════════════════════════════════════════════════════════════════════
     BUSES
  ════════════════════════════════════════════════════════════════════════════ */

  function _updateBuses(dt) {
    for (var b = 0; b < _buses.length; b++) {
      var bus = _buses[b];
      if (bus.destroyed || bus.saved) continue;

      var pos = bus.group.position;

      /* check if reached safe zone */
      if (pos.z >= SAFE_ZONE_POS.z - 6) {
        bus.saved = true;
        _totalCivsSaved += bus.civCount;
        continue;
      }

      /* check if player is too far ahead — halt if >30 units ahead */
      var playerAhead = _playerPos.z - pos.z;
      if (playerAhead > 30) {
        continue; /* halt bus */
      }

      /* check roadblock at waypoint 1 area */
      var blockedByRoadblock = false;
      if (!_roadblockCleared && pos.z >= WAYPOINTS[1].z - 2 && pos.z <= WAYPOINTS[1].z + 5) {
        blockedByRoadblock = true;
      }
      if (blockedByRoadblock) continue;

      /* move forward */
      pos.z += BUS_SPEED * dt;

      /* update waypoint tracking */
      for (var wp = _currentWaypoint; wp < WAYPOINTS.length; wp++) {
        if (pos.z >= WAYPOINTS[wp].z) {
          _currentWaypoint = Math.max(_currentWaypoint, wp);
        }
      }

      /* maintain formation: bus 1 and 2 stay 12 units behind the one ahead */
      if (b > 0) {
        var aheadBus = _buses[b - 1];
        var minZ     = aheadBus.group.position.z - 13;
        if (pos.z > minZ) {
          pos.z = minZ;
        }
      }

      /* burning */
      if (bus.burning) {
        if (bus.burnLight) {
          bus.burnLight.intensity = 1.5 + Math.random() * 0.8;
        }
      }

      /* hit flash */
      if (bus.hitTimer > 0) {
        bus.hitTimer -= dt;
      }
    }
  }

  function _damageBus(busIndex, dmg) {
    var bus = _buses[busIndex];
    if (!bus || bus.destroyed || bus.saved) return;

    bus.hp -= dmg;
    bus.hitTimer = 0.2;

    if (bus.hp <= 0 && !bus.destroyed) {
      bus.destroyed = true;
      bus.hp = 0;

      /* set on fire */
      bus.burning = true;
      var light = new THREE.PointLight(0xFF4400, 2.0, 12);
      light.position.set(0, 3, 0);
      bus.group.add(light);
      bus.burnLight = light;

      /* scatter civilians */
      var civCount = bus.civCount;
      for (var c = 0; c < civCount; c++) {
        var sciv = _buildScatteredCiv(bus.group.position);
        _scatteredCivs.push(sciv);
        /* hide the mesh inside the bus */
        if (bus.civilians[c]) bus.civilians[c].visible = false;
      }
      bus.civCount = 0;

      _spawnExplosion(bus.group.position, 0xFF4400, 2.5);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════════
     SCATTERED CIVILIANS
  ════════════════════════════════════════════════════════════════════════════ */

  function _updateScatteredCivs(dt) {
    for (var i = 0; i < _scatteredCivs.length; i++) {
      var civ = _scatteredCivs[i];
      if (!civ.alive) continue;

      /* run away */
      civ.group.position.addScaledVector(civ.runDir, 2.0 * dt);

      /* wobble animation */
      civ.bobTimer += dt * 6;
      civ.group.position.y = Math.abs(Math.sin(civ.bobTimer)) * 0.08;

      /* if out of bounds, kill */
      if (Math.abs(civ.group.position.x) > 35 || civ.group.position.z > 180) {
        civ.alive = false;
        _totalCivsLost++;
        civ.group.visible = false;
      }

      /* take sniper fire occasionally */
      /* (handled in enemy fire section) */
    }
  }

  function _tryTreatCivilian() {
    if (_medCrateUsed) return;
    if (!_buses[0] || _buses[0].destroyed) return; /* crate destroyed with bus */

    /* check proximity to civ */
    for (var i = 0; i < _scatteredCivs.length; i++) {
      var civ  = _scatteredCivs[i];
      if (!civ.alive || civ.treated) continue;

      var dist = _playerPos.distanceTo(civ.group.position);
      if (dist < 5) {
        civ.hp      = Math.min(civ.maxHp, civ.hp + 30);
        civ.treated = true;
        _medCrateUsed = true;

        /* change colour to show treated */
        if (civ.group.children[0]) {
          civ.group.children[0].material.color.setHex(0xAAFFAA);
        }
        break;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════════
     ENEMIES
  ════════════════════════════════════════════════════════════════════════════ */

  function _updateEnemies(dt) {
    for (var e = 0; e < _enemies.length; e++) {
      var enemy = _enemies[e];
      if (!enemy.alive) continue;

      /* suppression countdown */
      if (enemy.suppressTimer > 0) {
        enemy.suppressTimer -= dt;
        if (enemy.muzzleFlash) enemy.muzzleFlash.visible = false;
        continue;
      }

      enemy.fireTimer -= dt;
      if (enemy.fireTimer <= 0) {
        _enemyFire(enemy);
        enemy.flashTimer = 0.12;

        if (enemy.type === 'sniper') {
          enemy.fireTimer = 3 + Math.random() * 4;
        } else if (enemy.type === 'infantry') {
          enemy.fireTimer = 1.5 + Math.random() * 2;
        } else {
          enemy.fireTimer = 2 + Math.random() * 2;
        }
      }

      /* muzzle flash visibility */
      if (enemy.muzzleFlash) {
        if (enemy.flashTimer > 0) {
          enemy.muzzleFlash.visible = true;
          enemy.flashTimer -= dt;
        } else {
          enemy.muzzleFlash.visible = false;
        }
      }

      /* infantry: face nearest bus */
      if (enemy.type === 'infantry' || enemy.type === 'vehicle') {
        var nearBus = _getNearestBus(enemy.pos);
        if (nearBus) {
          var dx = nearBus.group.position.x - enemy.pos.x;
          var dz = nearBus.group.position.z - enemy.pos.z;
          enemy.group.rotation.y = Math.atan2(dx, dz);
        }
      }
      /* sniper: face convoy */
      if (enemy.type === 'sniper') {
        enemy.group.rotation.y = Math.atan2(-enemy.pos.x, SAFE_ZONE_POS.z - enemy.pos.z);
      }
    }
  }

  function _getNearestBus(pos) {
    var best   = null;
    var bestD  = Infinity;
    for (var b = 0; b < _buses.length; b++) {
      if (_buses[b].destroyed || _buses[b].saved) continue;
      var d = pos.distanceTo(_buses[b].group.position);
      if (d < bestD) { bestD = d; best = _buses[b]; }
    }
    return best;
  }

  function _enemyFire(enemy) {
    /* find target: sniper targets buses at up to 50 units */
    var targetBus = _getNearestBus(enemy.pos);
    if (!targetBus) return;

    var distToBus = enemy.pos.distanceTo(targetBus.group.position);

    if (enemy.type === 'sniper') {
      if (distToBus <= 50) {
        /* deal damage to nearest bus */
        var busIndex = _buses.indexOf(targetBus);
        _damageBus(busIndex, 5);
        /* also shoot at scattered civilians occasionally */
        if (Math.random() < 0.25) {
          for (var sc = 0; sc < _scatteredCivs.length; sc++) {
            if (_scatteredCivs[sc].alive && !_scatteredCivs[sc].treated) {
              _scatteredCivs[sc].hp -= 15;
              if (_scatteredCivs[sc].hp <= 0) {
                _scatteredCivs[sc].alive = false;
                _totalCivsLost++;
                _scatteredCivs[sc].group.visible = false;
              }
              break;
            }
          }
        }
      }
    } else if (enemy.type === 'infantry') {
      if (distToBus <= 25) {
        var biInf = _buses.indexOf(targetBus);
        _damageBus(biInf, 8);
      }
    } else if (enemy.type === 'vehicle') {
      if (distToBus <= 40) {
        var biVeh = _buses.indexOf(targetBus);
        _damageBus(biVeh, 15);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════════
     BULLETS
  ════════════════════════════════════════════════════════════════════════════ */

  function _updateBullets(dt) {
    for (var i = _bullets.length - 1; i >= 0; i--) {
      var bl = _bullets[i];
      bl.life -= dt;
      bl.mesh.position.addScaledVector(bl.dir, bl.speed * dt);

      if (bl.life <= 0) {
        _scene.remove(bl.mesh);
        _bullets.splice(i, 1);
        continue;
      }

      if (!bl.fromPlayer) continue;

      /* check hit on enemies */
      for (var e = 0; e < _enemies.length; e++) {
        var enemy = _enemies[e];
        if (!enemy.alive) continue;
        var dist = bl.mesh.position.distanceTo(enemy.pos);
        if (dist < 2.0) {
          enemy.hp -= 20;

          /* check suppression: rapid fire near sniper */
          if (enemy.type === 'sniper' && dist < 5) {
            enemy.suppressTimer = 5.0;
          }

          if (enemy.hp <= 0) {
            enemy.alive = false;
            enemy.group.visible = false;
          }

          _spawnExplosion(bl.mesh.position.clone(), 0xFF8800, 0.4);
          _scene.remove(bl.mesh);
          _bullets.splice(i, 1);
          break;
        }
      }

      if (i >= _bullets.length) continue;
      bl = _bullets[i];
      if (!bl) continue;

      /* check hit on roadblock barriers */
      if (!_roadblockCleared) {
        var hitBarrier = false;
        for (var rb = 0; rb < _roadblockBarriers.length; rb++) {
          var barrier = _roadblockBarriers[rb];
          if (barrier.hp <= 0) continue;
          var bPos = new THREE.Vector3();
          _roadblockGroup.localToWorld(bPos.copy(barrier.mesh.position));
          var bDist = bl.mesh.position.distanceTo(bPos);
          if (bDist < 2.0) {
            barrier.hp--;
            _spawnExplosion(bl.mesh.position.clone(), 0xFF4400, 0.3);
            if (barrier.hp <= 0) {
              barrier.mesh.visible = false;
            }
            _scene.remove(bl.mesh);
            _bullets.splice(i, 1);
            hitBarrier = true;
            break;
          }
        }

        /* check if all barriers cleared */
        var allClear = true;
        for (var rc = 0; rc < _roadblockBarriers.length; rc++) {
          if (_roadblockBarriers[rc].hp > 0) { allClear = false; break; }
        }
        if (allClear) {
          _roadblockCleared = true;
          if (_roadblockGroup) _roadblockGroup.visible = false;
        }

        if (hitBarrier) continue;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════════
     C4 / ROADBLOCK
  ════════════════════════════════════════════════════════════════════════════ */

  function _useC4() {
    _c4Available = false;
    /* check proximity to roadblock */
    if (!_roadblockGroup) return;
    var rbPos = _roadblockGroup.position;
    var dist  = _playerPos.distanceTo(rbPos);
    if (dist > 20) return;

    /* blow up all barriers */
    for (var rb = 0; rb < _roadblockBarriers.length; rb++) {
      _roadblockBarriers[rb].hp = 0;
      _roadblockBarriers[rb].mesh.visible = false;
      _spawnExplosion(rbPos.clone(), 0xFF6600, 1.5);
    }
    _roadblockCleared = true;
    if (_roadblockGroup) _roadblockGroup.visible = false;
  }

  /* ════════════════════════════════════════════════════════════════════════════
     AIR SUPPORT (CAS)
  ════════════════════════════════════════════════════════════════════════════ */

  function _callCAS() {
    if (_casCooldown > 0 || _casActive) return;
    _casActive  = true;
    _casTimer   = 0;
    _casAircraft = _buildCASAircraft();

    /* pick 3 alive enemies to eliminate */
    var kills = 0;
    for (var e = 0; e < _enemies.length && kills < 3; e++) {
      if (_enemies[e].alive) {
        _enemies[e].alive = false;
        _enemies[e].group.visible = false;
        _spawnExplosion(_enemies[e].pos.clone(), 0xFF4400, 1.2);
        kills++;
      }
    }
  }

  function _updateCAS(dt) {
    if (_casCooldown > 0) {
      _casCooldown -= dt;
      if (_casCooldown < 0) _casCooldown = 0;
    }

    if (!_casActive || !_casAircraft) return;

    _casTimer += dt;

    /* fly across */
    _casAircraft.position.x += 30 * dt;
    _casAircraft.position.z += 10 * dt;

    if (_casTimer >= CAS_DURATION) {
      _casActive = false;
      _casCooldown = CAS_COOLDOWN;
      if (_casAircraft.parent) _scene.remove(_casAircraft);
      _casAircraft = null;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════════
     EXPLOSIONS
  ════════════════════════════════════════════════════════════════════════════ */

  function _updateExplosions(dt) {
    for (var i = _explosions.length - 1; i >= 0; i--) {
      var ex = _explosions[i];
      ex.life -= dt;
      var t = 1.0 - (ex.life / ex.maxLife);
      ex.mat.opacity = 1.0 - t;
      ex.mesh.scale.setScalar(1.0 + t * 2.0);
      if (ex.life <= 0) {
        _scene.remove(ex.mesh);
        _explosions.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════════
     CAMERA
  ════════════════════════════════════════════════════════════════════════════ */

  function _updateCamera() {
    if (!_camera || !_playerGroup) return;
    var target = new THREE.Vector3(
      _playerPos.x,
      _playerPos.y + 8,
      _playerPos.z + 14
    );
    _camera.position.lerp(target, 0.08);
    _camera.lookAt(_playerPos.x, _playerPos.y + 1, _playerPos.z);
  }

  /* ════════════════════════════════════════════════════════════════════════════
     WIN / LOSE
  ════════════════════════════════════════════════════════════════════════════ */

  function _checkEndConditions() {
    /* win: at least 1 bus saved */
    var savedCount = 0;
    var allDone    = true;
    for (var b = 0; b < _buses.length; b++) {
      if (_buses[b].saved) savedCount++;
      if (!_buses[b].saved && !_buses[b].destroyed) allDone = false;
    }

    if (savedCount > 0 && allDone) {
      _missionDone = true;
      if (_hudEl) {
        _hudEl.textContent = 'CONVOY MISSION COMPLETE! ' + savedCount + '/' + BUS_COUNT + ' buses reached safety.';
        _hudEl.style.color = '#00FF88';
      }
    }

    /* fail: all buses destroyed with 0 civs */
    var allDestroyed = true;
    for (var bd = 0; bd < _buses.length; bd++) {
      if (!_buses[bd].destroyed && !_buses[bd].saved) { allDestroyed = false; break; }
      if (_buses[bd].saved) { allDestroyed = false; break; }
    }
    if (allDestroyed && savedCount === 0) {
      _missionFailed = true;
      if (_hudEl) {
        _hudEl.textContent = 'CONVOY FAILED. All buses destroyed.';
        _hudEl.style.color = '#FF4444';
      }
    }

    /* player dead */
    if (_playerHP <= 0) {
      _missionFailed = true;
      if (_hudEl) {
        _hudEl.textContent = 'ESCORT KIA. Mission failed.';
        _hudEl.style.color = '#FF4444';
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════════
     KEY HANDLERS
  ════════════════════════════════════════════════════════════════════════════ */

  function _onKeyDown(e) {
    _keys[e.code] = true;

    /* R+F activation */
    if (e.code === 'KeyR') _rPressTime = performance.now() / 1000;
    if (e.code === 'KeyF') _fPressTime = performance.now() / 1000;

    var now = performance.now() / 1000;
    if (_keys['KeyR'] && _keys['KeyF']) {
      if (Math.abs(_rPressTime - _fPressTime) <= RF_WINDOW) {
        if (!_active && !_missionDone && !_missionFailed) {
          _activate();
        }
      }
    }

    if (!_active) return;

    /* CAS */
    if (e.code === 'KeyQ') {
      _callCAS();
    }
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
  }

  /* ════════════════════════════════════════════════════════════════════════════
     ACTIVATE
  ════════════════════════════════════════════════════════════════════════════ */

  function _activate() {
    _active      = true;
    _missionDone = false;
    _missionFailed = false;
    _missionTimer  = 0;
    _score         = 0;

    /* reset state */
    _currentWaypoint   = 0;
    _casCooldown       = 0;
    _casActive         = false;
    _c4Available       = true;
    _roadblockCleared  = false;
    _totalCivsSaved    = 0;
    _totalCivsLost     = 0;
    _medCrateUsed      = false;
    _playerHP          = 100;
    _playerYaw         = 0;
    _playerPos.set(-6, 1, 0);
    _playerVel.set(0, 0, 0);

    _buildScene();
    _buildHUD();

    if (_hudEl) {
      _hudEl.style.color = '#EEFFCC';
    }
  }

  /* ════════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
  }

  function update(delta) {
    var now = performance.now() / 1000;
    var dt  = Math.min(delta || (now - _lastTime), 0.05);
    _lastTime = now;

    if (!_active || _missionDone || _missionFailed) return;

    _missionTimer += dt;

    _updatePlayer(dt);
    _updateBuses(dt);
    _updateScatteredCivs(dt);
    _updateEnemies(dt);
    _updateBullets(dt);
    _updateCAS(dt);
    _updateExplosions(dt);
    _updateCamera();
    _updateHUD();
    _checkEndConditions();
  }

  function reset() {
    _active        = false;
    _missionDone   = false;
    _missionFailed = false;

    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup',   _onKeyUp);

    _removeAll();

    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
    }
    _hudEl = null;
    _keys  = {};

    /* re-attach listeners for future activation */
    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
  }

  return { init: init, update: update, reset: reset };

}());
