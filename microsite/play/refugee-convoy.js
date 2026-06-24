/* ───────────────────────────────────────────────────────────────────────────
   refugee-convoy.js — Refugee Convoy Escort (FPS Module)
   API: window.RefugeeConvoy = { init, update, reset }
   Controls:
     R + C keys together (within 400ms) → activate module
     WASD                → move player on foot
     E (tap)             → board / exit escort vehicle | open border gate
     E (hold 5s)         → defuse IED | repair nearest damaged bus | open border gate
     C                   → detonate C4 on roadblock barriers
     Space               → shoot
   ─────────────────────────────────────────────────────────────────────────── */
window.RefugeeConvoy = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;

  /* ── Mission state ─────────────────────────────────────────────────────── */
  var _active          = false;
  var _missionDone     = false;
  var _missionFailed   = false;
  var _score           = 0;
  var _lastTime        = 0;
  var _missionTimer    = 0;
  var MISSION_TIME_MAX = 600; /* 10 minutes */

  /* ── R+C activation tracking ─────────────────────────────────────────── */
  var _rPressTime  = 0;
  var _cKeyPressTime = 0;
  var RC_WINDOW    = 0.4;

  /* ── Input ────────────────────────────────────────────────────────────── */
  var _keys        = {};
  var _eHeldTimer  = 0;
  var _eTapped     = false;
  var _cTapped     = false;
  var _spaceTapped = false;

  /* ── Convoy / road ────────────────────────────────────────────────────── */
  var CONVOY_SPEED   = 3;      /* units/s along Z */
  var BUS_HP_MAX     = 200;
  var BUS_COUNT      = 5;
  var BUS_GAP        = 10;     /* spacing between buses along Z */
  var ROAD_LENGTH    = 320;

  var _buses         = [];
  /* each bus: { group, hp, destroyed, hitFlashTimer, civCount } */

  /* ── Convoy movement state ───────────────────────────────────────────── */
  var _convoyZ           = 0;    /* leading edge z position */
  var _convoyHalted      = false;
  var _checkpointTimer   = 0;
  var CHECKPOINT_DURATION= 10;   /* seconds halted at each checkpoint */
  var _checkpoint1Passed = false;
  var _checkpoint2Passed = false;
  var _checkpoint1Triggered = false;
  var _checkpoint2Triggered = false;
  var _borderGateOpen    = false;
  var _borderGateOpenTimer = 0;
  var _borderCrossed     = false;

  /* ── Escort vehicles ─────────────────────────────────────────────────── */
  var _escortTrucks = [];
  /* each: { group, fireTimer } */

  /* ── Player ───────────────────────────────────────────────────────────── */
  var _playerGroup   = null;
  var _playerPos     = new THREE.Vector3(-8, 1, 0);
  var _playerVel     = new THREE.Vector3(0, 0, 0);
  var _playerYaw     = 0;
  var _playerHP      = 100;
  var PLAYER_SPEED   = 14;
  var PLAYER_FRICTION= 0.85;
  var _playerBoarded = false;   /* boarding escort vehicle */
  var _boardedTruck  = null;

  /* ── Shooting ─────────────────────────────────────────────────────────── */
  var _bullets       = [];
  var _shootCooldown = 0;
  var SHOOT_RATE     = 0.15;

  /* ── Enemies ──────────────────────────────────────────────────────────── */
  var _enemies       = [];
  /* each: { group, hp, alive, type, fireTimer, pos, muzzleFlash, flashTimer,
             patrolDir, patrolTimer } */
  /* types: 'sniper', 'militia', 'mortar', 'apc' */

  /* ── Zone structures ──────────────────────────────────────────────────── */
  var _ruins         = [];      /* zone 1 rubble cover */
  var _barriers      = [];      /* zone 2 roadblock barriers */
  var _barriersCleared = false;
  var _allMilitiaDead  = false;
  var _iedObjects    = [];      /* { mesh, pos, triggered, defused, defuseTimer } */
  var _mortarTeam    = null;    /* { members[], fireTimer, active } */
  var _mortarShells  = [];      /* { mesh, vel, pos, life } */
  var _apcObj        = null;    /* { group, hp, alive, patrolZ, patrolDir, fireTimer } */

  /* ── Checkpoints & border ────────────────────────────────────────────── */
  var _checkpoint1Group = null;
  var _checkpoint2Group = null;
  var _borderGroup      = null;
  var _borderGateMesh   = null;

  /* ── Repair kits ─────────────────────────────────────────────────────── */
  var _repairKits    = [];
  /* each: { mesh, pos, used } */
  var _repairKitCount= 3;
  var _eRepairTarget = null;

  /* ── HUD ──────────────────────────────────────────────────────────────── */
  var _hudEl         = null;
  var _alertLines    = [];      /* { text, timer } */

  /* ── Explosion FX ─────────────────────────────────────────────────────── */
  var _explosions    = [];

  /* ── Zone tracking ────────────────────────────────────────────────────── */
  var _currentZone   = 1;

  /* ════════════════════════════════════════════════════════════════════════
     GEOMETRY HELPERS
  ════════════════════════════════════════════════════════════════════════ */

  function _makeMesh(geo, color, transparent, opacity) {
    var mat = new THREE.MeshLambertMaterial({
      color: color,
      transparent: !!transparent,
      opacity: transparent ? (opacity || 0.7) : 1.0
    });
    return new THREE.Mesh(geo, mat);
  }

  function _makeLines(geo, color) {
    var mat = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(geo, mat);
  }

  function _edgeLines(geo, color) {
    return _makeLines(new THREE.EdgesGeometry(geo), color);
  }

  /* ════════════════════════════════════════════════════════════════════════
     SCENE BUILDING
  ════════════════════════════════════════════════════════════════════════ */

  function _buildGround() {
    /* terrain */
    var geo  = new THREE.BoxGeometry(80, 0.2, ROAD_LENGTH);
    var mesh = _makeMesh(geo, 0x4A5A3A);
    mesh.position.set(0, -0.1, ROAD_LENGTH / 2);
    _scene.add(mesh);

    /* road */
    var roadGeo = new THREE.BoxGeometry(12, 0.22, ROAD_LENGTH);
    var road    = _makeMesh(roadGeo, 0x2A2A2A);
    road.position.set(0, -0.09, ROAD_LENGTH / 2);
    _scene.add(road);

    /* road markings every 10u */
    for (var i = 0; i < 30; i++) {
      var markGeo  = new THREE.BoxGeometry(0.3, 0.23, 4);
      var mark     = _makeMesh(markGeo, 0xCCCC44);
      mark.position.set(0, -0.08, 5 + i * 10);
      _scene.add(mark);
    }
  }

  function _buildBus(index) {
    var group = new THREE.Group();

    /* body: 6×2.5×2 */
    var bodyGeo  = new THREE.BoxGeometry(6, 2.5, 2);
    var bodyMesh = _makeMesh(bodyGeo, 0x557744);
    bodyMesh.position.set(0, 1.25, 0);
    group.add(bodyMesh);

    /* window lines */
    for (var w = -2; w <= 2; w++) {
      var wg  = new THREE.BoxGeometry(1.0, 0.7, 0.05);
      var wlF = _edgeLines(wg, 0xAADDFF);
      wlF.position.set(w * 1.1, 1.6, 1.01);
      group.add(wlF);
      var wlB = _edgeLines(wg.clone(), 0xAADDFF);
      wlB.position.set(w * 1.1, 1.6, -1.01);
      group.add(wlB);
    }

    /* wheels */
    var wGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.35, 8);
    var wPos = [
      [-2.0, 0.55,  1.1],
      [ 2.0, 0.55,  1.1],
      [-2.0, 0.55, -1.1],
      [ 2.0, 0.55, -1.1]
    ];
    for (var wi = 0; wi < wPos.length; wi++) {
      var wm = _makeMesh(wGeo.clone(), 0x222222);
      wm.rotation.z = Math.PI / 2;
      wm.position.set(wPos[wi][0], wPos[wi][1], wPos[wi][2]);
      group.add(wm);
    }

    /* 10 civilian silhouettes inside */
    for (var c = 0; c < 10; c++) {
      var cGeo  = new THREE.CylinderGeometry(0.15, 0.15, 0.7, 5);
      var cMesh = _makeMesh(cGeo, 0xFFBB99);
      var cx = -2.2 + (c % 5) * 1.1;
      var cz = (c < 5) ? 0.5 : -0.5;
      cMesh.position.set(cx, 1.4, cz);
      group.add(cMesh);
    }

    /* position: convoy starts at z=0, buses staggered */
    group.position.set(0, 0, -(index * BUS_GAP));
    _scene.add(group);

    _buses.push({
      group:        group,
      hp:           BUS_HP_MAX,
      destroyed:    false,
      hitFlashTimer:0,
      civCount:     10,
      index:        index
    });
  }

  function _buildEscortTruck(offsetX) {
    var group = new THREE.Group();

    /* body: BoxGeometry 3×2×1.5 color 0x334433 */
    var bodyGeo = new THREE.BoxGeometry(3, 2, 1.5);
    var body    = _makeMesh(bodyGeo, 0x334433);
    body.position.set(0, 1.0, 0);
    group.add(body);

    /* turret */
    var tGeo = new THREE.BoxGeometry(1.0, 0.6, 1.0);
    var turr = _makeMesh(tGeo, 0x223322);
    turr.position.set(0, 2.3, 0);
    group.add(turr);

    /* barrel */
    var bGeo   = new THREE.BoxGeometry(1.2, 0.2, 0.2);
    var barrel = _makeMesh(bGeo, 0x333333);
    barrel.position.set(0.8, 2.3, 0);
    group.add(barrel);

    /* wheels */
    var wGeo2 = new THREE.CylinderGeometry(0.45, 0.45, 0.3, 8);
    var wPt = [[-1.0, 0.45, 0.8],[1.0, 0.45, 0.8],[-1.0, 0.45,-0.8],[1.0, 0.45,-0.8]];
    for (var wi2 = 0; wi2 < wPt.length; wi2++) {
      var wm2 = _makeMesh(wGeo2.clone(), 0x222222);
      wm2.rotation.z = Math.PI / 2;
      wm2.position.set(wPt[wi2][0], wPt[wi2][1], wPt[wi2][2]);
      group.add(wm2);
    }

    group.position.set(offsetX, 0, -(BUS_COUNT * BUS_GAP) - 5);
    _scene.add(group);

    _escortTrucks.push({ group: group, fireTimer: 1.5 });
  }

  function _buildPlayerVehicle() {
    var group = new THREE.Group();

    /* body: BoxGeometry 3×2×1.5 color 0x334455 */
    var bodyGeo = new THREE.BoxGeometry(3, 2, 1.5);
    var body    = _makeMesh(bodyGeo, 0x334455);
    body.position.set(0, 1.0, 0);
    group.add(body);

    /* light bar on top */
    var lbGeo = new THREE.BoxGeometry(2.5, 0.3, 0.5);
    var lb    = _makeMesh(lbGeo, 0xFFFFFF);
    lb.position.set(0, 2.15, 0);
    group.add(lb);

    /* wheels */
    var wGeo3 = new THREE.CylinderGeometry(0.45, 0.45, 0.3, 8);
    var wPt3  = [[-1.0,0.45,0.8],[1.0,0.45,0.8],[-1.0,0.45,-0.8],[1.0,0.45,-0.8]];
    for (var wi3 = 0; wi3 < wPt3.length; wi3++) {
      var wm3 = _makeMesh(wGeo3.clone(), 0x222222);
      wm3.rotation.z = Math.PI / 2;
      wm3.position.set(wPt3[wi3][0], wPt3[wi3][1], wPt3[wi3][2]);
      group.add(wm3);
    }

    group.position.set(-8, 0, 0);
    group.visible = true;
    _scene.add(group);
    return group;
  }

  function _buildPlayer() {
    var group = new THREE.Group();

    /* torso */
    var tGeo = new THREE.BoxGeometry(0.6, 0.9, 0.35);
    var torso = _makeMesh(tGeo, 0x334455);
    torso.position.set(0, 0.95, 0);
    group.add(torso);

    /* head */
    var hGeo = new THREE.SphereGeometry(0.28, 6, 6);
    var head = _makeMesh(hGeo, 0xFFCC99);
    head.position.set(0, 1.7, 0);
    group.add(head);

    /* helmet */
    var helmGeo = new THREE.SphereGeometry(0.32, 6, 6);
    var helm    = _makeMesh(helmGeo, 0x334422);
    helm.position.set(0, 1.85, 0);
    group.add(helm);

    /* weapon */
    var wepGeo  = new THREE.BoxGeometry(0.9, 0.12, 0.12);
    var wepLine = _edgeLines(wepGeo, 0x888888);
    wepLine.position.set(0.45, 1.1, 0);
    group.add(wepLine);

    group.position.copy(_playerPos);
    _scene.add(group);
    _playerGroup = group;
  }

  function _buildEnemy(x, z, type) {
    var group = new THREE.Group();

    /* body shape by type */
    if (type === 'sniper') {
      var bGeo = new THREE.BoxGeometry(0.55, 1.5, 0.45);
      var body = _makeMesh(bGeo, 0x553322);
      body.position.set(0, 0.75, 0);
      group.add(body);

      var hGeo = new THREE.SphereGeometry(0.25, 6, 6);
      var head = _makeMesh(hGeo, 0x664433);
      head.position.set(0, 1.65, 0);
      group.add(head);

      /* rifle */
      var rGeo  = new THREE.BoxGeometry(1.8, 0.1, 0.08);
      var rifle = _edgeLines(rGeo, 0x777777);
      rifle.position.set(0.8, 1.1, 0);
      group.add(rifle);

      var flash = _makeMesh(new THREE.SphereGeometry(0.22, 4, 4), 0xFFFF44);
      flash.position.set(1.6, 1.1, 0);
      flash.visible = false;
      group.add(flash);

      group.position.set(x, 0, z);
      _scene.add(group);
      return {
        group: group, hp: 80, alive: true, type: 'sniper',
        fireTimer: 3 + Math.random() * 2, muzzleFlash: flash, flashTimer: 0,
        pos: group.position, patrolDir: 0, patrolTimer: 0
      };

    } else if (type === 'militia') {
      var b2Geo = new THREE.BoxGeometry(0.55, 1.4, 0.45);
      var body2 = _makeMesh(b2Geo, 0x554433);
      body2.position.set(0, 0.7, 0);
      group.add(body2);

      var h2Geo = new THREE.SphereGeometry(0.24, 6, 6);
      var head2 = _makeMesh(h2Geo, 0x665544);
      head2.position.set(0, 1.55, 0);
      group.add(head2);

      var w2Geo  = new THREE.BoxGeometry(1.2, 0.1, 0.08);
      var weap2  = _edgeLines(w2Geo, 0x777777);
      weap2.position.set(0.6, 1.0, 0);
      group.add(weap2);

      group.position.set(x, 0, z);
      _scene.add(group);
      return {
        group: group, hp: 60, alive: true, type: 'militia',
        fireTimer: 1.5 + Math.random() * 1.5, muzzleFlash: null, flashTimer: 0,
        pos: group.position, patrolDir: 0, patrolTimer: 0
      };

    } else if (type === 'mortar') {
      var b3Geo = new THREE.BoxGeometry(0.55, 1.4, 0.45);
      var body3 = _makeMesh(b3Geo, 0x443322);
      body3.position.set(0, 0.7, 0);
      group.add(body3);

      var h3Geo = new THREE.SphereGeometry(0.24, 6, 6);
      var head3 = _makeMesh(h3Geo, 0x554433);
      head3.position.set(0, 1.55, 0);
      group.add(head3);

      group.position.set(x, 0, z);
      _scene.add(group);
      return {
        group: group, hp: 60, alive: true, type: 'mortar',
        fireTimer: 8, muzzleFlash: null, flashTimer: 0,
        pos: group.position, patrolDir: 0, patrolTimer: 0
      };

    } else if (type === 'apc') {
      /* APC: BoxGeometry 0x445533, 250HP */
      var apcGeo = new THREE.BoxGeometry(5, 2.5, 2.5);
      var apcMesh = _makeMesh(apcGeo, 0x445533);
      apcMesh.position.set(0, 1.25, 0);
      group.add(apcMesh);

      /* gun */
      var gGeo   = new THREE.BoxGeometry(2.5, 0.3, 0.3);
      var gun    = _makeMesh(gGeo, 0x334422);
      gun.position.set(1.5, 2.65, 0);
      group.add(gun);

      /* tracks */
      var trkGeo = new THREE.BoxGeometry(5, 0.5, 0.35);
      var trkL   = _makeMesh(trkGeo, 0x222222);
      trkL.position.set(0, 0.25, 1.3);
      group.add(trkL);
      var trkR   = _makeMesh(trkGeo.clone(), 0x222222);
      trkR.position.set(0, 0.25, -1.3);
      group.add(trkR);

      group.position.set(x, 0, z);
      _scene.add(group);
      return {
        group: group, hp: 250, alive: true, type: 'apc',
        fireTimer: 2.5 + Math.random(), muzzleFlash: null, flashTimer: 0,
        pos: group.position, patrolDir: 1, patrolTimer: 0
      };
    }
    return null;
  }

  function _buildRuin(x, z, w, h, d) {
    var group = new THREE.Group();

    /* main ruin box */
    var rGeo = new THREE.BoxGeometry(w, h, d);
    var rMesh = _makeMesh(rGeo, 0x665544);
    rMesh.position.set(0, h / 2, 0);
    group.add(rMesh);

    /* rubble chunks */
    for (var ri = 0; ri < 3; ri++) {
      var chGeo  = new THREE.BoxGeometry(0.8 + Math.random(), 0.5, 0.8 + Math.random());
      var chMesh = _makeMesh(chGeo, 0x554433);
      chMesh.position.set(
        (Math.random() - 0.5) * w,
        0.25,
        (Math.random() - 0.5) * d
      );
      group.add(chMesh);
    }

    group.position.set(x, 0, z);
    _scene.add(group);
    _ruins.push(group);
    return group;
  }

  function _buildRoadbarrier(x, z) {
    var geo  = new THREE.BoxGeometry(2.5, 1.5, 0.7);
    var mesh = _makeMesh(geo, 0x553311);
    mesh.position.set(x, 0.75, z);
    _scene.add(mesh);
    _barriers.push({ mesh: mesh, alive: true });
    return mesh;
  }

  function _buildIED(x, z) {
    /* PlaneGeometry — buried, barely visible, only shows within 3u */
    var geo  = new THREE.BoxGeometry(0.6, 0.04, 0.6);
    var mesh = _makeMesh(geo, 0x443322);
    mesh.position.set(x, 0.02, z);
    mesh.visible = false; /* hidden until player is close */
    _scene.add(mesh);

    var iedObj = { mesh: mesh, pos: new THREE.Vector3(x, 0, z),
                   triggered: false, defused: false, defuseTimer: 0 };
    _iedObjects.push(iedObj);
    return iedObj;
  }

  function _buildMortarTeam() {
    var members = [];
    var baseZ   = 210;
    var positions = [[-6, baseZ], [0, baseZ + 4], [6, baseZ]];
    for (var mi = 0; mi < 3; mi++) {
      var enemy = _buildEnemy(positions[mi][0], positions[mi][1], 'mortar');
      members.push(enemy);
      _enemies.push(enemy);
    }

    /* mortar tube */
    var tubeGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 6);
    var tubeMesh = _makeMesh(tubeGeo, 0x333333);
    tubeMesh.rotation.x = -0.4;
    tubeMesh.position.set(0, 0.75, baseZ + 2);
    _scene.add(tubeMesh);

    _mortarTeam = { members: members, fireTimer: 8, tube: tubeMesh, active: true };
  }

  function _buildCheckpoint(z, isUn) {
    var group = new THREE.Group();

    /* left post */
    var pGeo = new THREE.BoxGeometry(0.5, 5, 0.5);
    var pL   = _makeMesh(pGeo, 0x334455);
    pL.position.set(-7, 2.5, 0);
    group.add(pL);
    var pR = _makeMesh(pGeo.clone(), 0x334455);
    pR.position.set(7, 2.5, 0);
    group.add(pR);

    /* crossbar */
    var cbGeo  = new THREE.BoxGeometry(14, 0.4, 0.4);
    var cb     = _makeMesh(cbGeo, 0x334455);
    cb.position.set(0, 5.2, 0);
    group.add(cb);

    /* UN flag (blue box) */
    var flagGeo  = new THREE.BoxGeometry(1.5, 1.0, 0.08);
    var flagMesh = _makeMesh(flagGeo, 0x4477CC);
    flagMesh.position.set(7, 5.8, 0);
    group.add(flagMesh);

    /* barrier arm */
    var armGeo = new THREE.BoxGeometry(6, 0.25, 0.25);
    var arm    = _makeMesh(armGeo, 0xFF4444);
    arm.position.set(3.5, 4.0, 0);
    group.add(arm);

    /* guard post */
    var gpGeo  = new THREE.BoxGeometry(2, 3, 2);
    var gpMesh = _makeMesh(gpGeo, 0x334455);
    gpMesh.position.set(-9, 1.5, 0);
    group.add(gpMesh);

    group.position.set(0, 0, z);
    _scene.add(group);
    return group;
  }

  function _buildBorderCrossing() {
    var group = new THREE.Group();

    /* guard posts */
    var gpGeo = new THREE.BoxGeometry(3, 4, 3);
    var gpL   = _makeMesh(gpGeo, 0x334455);
    gpL.position.set(-10, 2, 0);
    group.add(gpL);
    var gpR = _makeMesh(gpGeo.clone(), 0x334455);
    gpR.position.set(10, 2, 0);
    group.add(gpR);

    /* gate bar — LineSegments */
    var pts = [];
    pts.push(new THREE.Vector3(-8, 4, 0));
    pts.push(new THREE.Vector3( 8, 4, 0));
    pts.push(new THREE.Vector3(-8, 0.5, 0));
    pts.push(new THREE.Vector3( 8, 0.5, 0));
    pts.push(new THREE.Vector3(-8, 4, 0));
    pts.push(new THREE.Vector3(-8, 0.5, 0));
    pts.push(new THREE.Vector3( 8, 4, 0));
    pts.push(new THREE.Vector3( 8, 0.5, 0));
    var geoLine = new THREE.BufferGeometry().setFromPoints(pts);
    var gateLine = _makeLines(geoLine, 0xFFFF00);
    group.add(gateLine);

    /* solid gate bar */
    var gBarGeo  = new THREE.BoxGeometry(16, 0.4, 0.4);
    _borderGateMesh = _makeMesh(gBarGeo, 0xFF3333);
    _borderGateMesh.position.set(0, 2.2, 0);
    group.add(_borderGateMesh);

    /* UN sign */
    var signGeo  = new THREE.BoxGeometry(4, 1.5, 0.15);
    var signMesh = _makeMesh(signGeo, 0x4477CC);
    signMesh.position.set(0, 5, 0);
    group.add(signMesh);

    /* safe zone ground */
    var szGeo  = new THREE.BoxGeometry(20, 0.25, 10);
    var szMesh = _makeMesh(szGeo, 0x55AA55, true, 0.5);
    szMesh.position.set(0, 0.12, 6);
    group.add(szMesh);

    group.position.set(0, 0, 305);
    _scene.add(group);
    _borderGroup = group;
  }

  function _buildRepairKit(x, z) {
    var geo  = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    var mesh = _makeMesh(geo, 0xFF6600);
    mesh.position.set(x, 0.4, z);
    _scene.add(mesh);
    _repairKits.push({ mesh: mesh, pos: new THREE.Vector3(x, 0, z), used: false });
  }

  function _buildSupplyCache(x, z) {
    var geo  = new THREE.BoxGeometry(2, 1.5, 1.5);
    var mesh = _makeMesh(geo, 0x334455);
    mesh.position.set(x, 0.75, z);
    _scene.add(mesh);
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD ENTIRE SCENE
  ════════════════════════════════════════════════════════════════════════ */

  function _buildScene() {
    _buildGround();

    /* convoy: 5 buses */
    for (var b = 0; b < BUS_COUNT; b++) {
      _buildBus(b);
    }

    /* escort trucks flanking rear of convoy */
    _buildEscortTruck(-5);
    _buildEscortTruck(5);

    /* player vehicle (parked to side initially) */
    var pVehGroup = _buildPlayerVehicle();
    /* store as third escort truck slot or separate */
    _playerVehicleGroup = pVehGroup;

    _buildPlayer();

    /* ── Zone 1 (0–100u): snipers in bombed buildings ── */
    _buildRuin(-18, 20, 6, 4, 4);
    _buildRuin( 18, 25, 5, 3, 4);
    _buildRuin(-20, 60, 7, 5, 4);
    _buildRuin( 22, 55, 6, 4, 3);

    /* 4 snipers in ruins */
    _enemies.push(_buildEnemy(-18, 20, 'sniper'));
    _enemies.push(_buildEnemy( 18, 28, 'sniper'));
    _enemies.push(_buildEnemy(-20, 60, 'sniper'));
    _enemies.push(_buildEnemy( 22, 58, 'sniper'));

    /* ── Zone 2 (100–200u): militia roadblock + IEDs ── */
    /* roadblock barriers across road at z=115 */
    _buildRoadbarrier(-4, 115);
    _buildRoadbarrier( 0, 115);
    _buildRoadbarrier( 4, 115);

    /* 8 militia around roadblock */
    _enemies.push(_buildEnemy(-6,  112, 'militia'));
    _enemies.push(_buildEnemy(-3,  112, 'militia'));
    _enemies.push(_buildEnemy( 3,  112, 'militia'));
    _enemies.push(_buildEnemy( 6,  112, 'militia'));
    _enemies.push(_buildEnemy(-8,  120, 'militia'));
    _enemies.push(_buildEnemy(-5,  120, 'militia'));
    _enemies.push(_buildEnemy( 5,  120, 'militia'));
    _enemies.push(_buildEnemy( 8,  120, 'militia'));

    /* IEDs buried in road */
    _buildIED( 1, 130);
    _buildIED(-2, 155);
    _buildIED( 2, 175);

    /* ── Zone 3 (200–300u): mortar team + APC ── */
    _buildMortarTeam();

    var apcEnt = _buildEnemy(0, 240, 'apc');
    _apcObj = apcEnt;
    _enemies.push(apcEnt);

    /* ── Checkpoints at 100u and 200u ── */
    _checkpoint1Group = _buildCheckpoint(100, true);
    _checkpoint2Group = _buildCheckpoint(200, true);

    /* ── Border crossing at 300u ── */
    _buildBorderCrossing();

    /* ── Supply caches with repair kits ── */
    _buildSupplyCache(-15, 80);
    _buildRepairKit(-15, 80);

    _buildSupplyCache(18, 160);
    _buildRepairKit(18, 160);

    _buildSupplyCache(-16, 250);
    _buildRepairKit(-16, 250);
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ════════════════════════════════════════════════════════════════════════ */

  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'refugee-convoy-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#EEE',
      'font:bold 13px monospace',
      'padding:7px 14px',
      'border-radius:5px',
      'pointer-events:none',
      'z-index:9999',
      'text-align:center',
      'min-width:520px',
      'line-height:1.6'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;

    var busesAlive   = 0;
    var busesDestroyed = 0;
    for (var i = 0; i < _buses.length; i++) {
      if (!_buses[i].destroyed) busesAlive++;
      else busesDestroyed++;
    }

    var dist    = Math.round(_convoyZ);
    var enemies = 0;
    for (var ei = 0; ei < _enemies.length; ei++) {
      if (_enemies[ei].alive) enemies++;
    }
    var repairLeft = 0;
    for (var ri = 0; ri < _repairKits.length; ri++) {
      if (!_repairKits[ri].used) repairLeft++;
    }

    var iedStatus = 'CLEAR';
    for (var ii = 0; ii < _iedObjects.length; ii++) {
      var ied = _iedObjects[ii];
      if (!ied.defused && !ied.triggered) {
        var dx = _playerPos.x - ied.pos.x;
        var dz = _playerPos.z - ied.pos.z;
        var dist2 = Math.sqrt(dx * dx + dz * dz);
        if (dist2 < 6) { iedStatus = 'DETECTED'; break; }
      }
    }

    var timeLeft = Math.max(0, MISSION_TIME_MAX - _missionTimer);
    var mins     = Math.floor(timeLeft / 60);
    var secs     = Math.floor(timeLeft % 60);
    var timeStr  = mins + ':' + (secs < 10 ? '0' : '') + secs;

    var eHold = _eHeldTimer > 0 ? ' [E:' + Math.round(_eHeldTimer * 10) / 10 + 's]' : '';

    var line1 = 'REFUGEE CONVOY [BUSES: ' + busesAlive + '/5] [ZONE: ' + _currentZone + '/3] [DISTANCE: ' + dist + 'm] [ENEMIES: ' + enemies + '] | REPAIR KITS: ' + repairLeft + '  IED: ' + iedStatus;
    var line2 = 'TIME: ' + timeStr + ' | HP: ' + _playerHP + eHold;

    var alertHtml = '';
    for (var al = 0; al < _alertLines.length; al++) {
      alertHtml += '<br><span style="color:#FF6644">' + _alertLines[al].text + '</span>';
    }

    if (_missionDone) {
      _hudEl.innerHTML = '<span style="color:#44FF88;font-size:16px">CONVOY REACHED SAFETY! MISSION COMPLETE</span><br>Buses saved: ' + busesAlive + '/5 | Score: ' + _score;
    } else if (_missionFailed) {
      _hudEl.innerHTML = '<span style="color:#FF4444;font-size:16px">MISSION FAILED</span><br>' + (busesDestroyed >= 3 ? '3 buses destroyed' : 'Time expired');
    } else {
      _hudEl.innerHTML = line1 + '<br>' + line2 + alertHtml;
    }
  }

  function _addAlert(text) {
    _alertLines.push({ text: text, timer: 4.0 });
    if (_alertLines.length > 3) _alertLines.shift();
  }

  /* ════════════════════════════════════════════════════════════════════════
     SHOOTING
  ════════════════════════════════════════════════════════════════════════ */

  function _shoot() {
    var dir = new THREE.Vector3(Math.sin(_playerYaw), 0, Math.cos(_playerYaw));
    var startPos = _playerPos.clone();
    startPos.y = 1.2;

    var bGeo  = new THREE.SphereGeometry(0.12, 4, 4);
    var bMesh = _makeMesh(bGeo, 0xFFEE44);
    bMesh.position.copy(startPos);
    _scene.add(bMesh);

    _bullets.push({
      mesh: bMesh,
      pos:  startPos.clone(),
      vel:  dir.multiplyScalar(40),
      life: 1.5
    });
    _shootCooldown = SHOOT_RATE;
  }

  function _spawnExplosion(pos, color, scale) {
    var geo  = new THREE.SphereGeometry(scale || 1.2, 6, 6);
    var mat  = new THREE.MeshLambertMaterial({
      color: color || 0xFF6600,
      transparent: true,
      opacity: 1.0
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.position.y += 0.5;
    _scene.add(mesh);
    _explosions.push({ mesh: mesh, mat: mat, life: 0.6, maxLife: 0.6 });
  }

  function _areaBombardment(pos, radius, damage, color) {
    _spawnExplosion(pos, color || 0xFF4400, 2.5);

    /* damage buses in radius */
    for (var i = 0; i < _buses.length; i++) {
      var bus = _buses[i];
      if (bus.destroyed) continue;
      var bpos = bus.group.position;
      var dx = bpos.x - pos.x;
      var dz = bpos.z - pos.z;
      if (Math.sqrt(dx * dx + dz * dz) < radius) {
        _damageBus(i, damage);
      }
    }

    /* damage player */
    var pdx = _playerPos.x - pos.x;
    var pdz = _playerPos.z - pos.z;
    if (Math.sqrt(pdx * pdx + pdz * pdz) < radius) {
      _playerHP -= damage;
      if (_playerHP < 0) _playerHP = 0;
    }
  }

  function _damageBus(index, dmg) {
    var bus = _buses[index];
    if (bus.destroyed) return;
    bus.hp -= dmg;
    bus.hitFlashTimer = 0.3;
    _addAlert('BUS ' + (index + 1) + ' HIT - CIVILIANS PANICKING');
    if (bus.hp <= 0) {
      bus.hp = 0;
      bus.destroyed = true;
      bus.group.visible = false;
      _spawnExplosion(bus.group.position, 0xFF2200, 3);
      _addAlert('BUS ' + (index + 1) + ' DESTROYED! PASSENGER LOSS: ' + bus.civCount + ' CIVILIANS');
      _score -= bus.civCount * 100;
      bus.civCount = 0;
      _checkFailCondition();
    }
  }

  function _checkFailCondition() {
    var destroyed = 0;
    for (var i = 0; i < _buses.length; i++) {
      if (_buses[i].destroyed) destroyed++;
    }
    if (destroyed >= 3) {
      _missionFailed = true;
      _addAlert('MISSION FAILED: 3 OR MORE BUSES DESTROYED');
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ENEMY AI
  ════════════════════════════════════════════════════════════════════════ */

  function _getNearestConvoyTarget() {
    /* returns position of nearest living bus or player */
    var nearest = null;
    var nearDist = 999999;
    for (var i = 0; i < _buses.length; i++) {
      if (_buses[i].destroyed) continue;
      var bpos = _buses[i].group.position;
      var d = bpos.z; /* approximate by z pos */
      if (d < nearDist) { nearDist = d; nearest = bpos; }
    }
    if (!nearest) nearest = _playerPos;
    return nearest;
  }

  function _enemyFire(enemy, dt) {
    if (!enemy.alive) return;
    enemy.fireTimer -= dt;
    if (enemy.fireTimer > 0) return;

    /* determine target */
    var target = _getNearestConvoyTarget();
    /* aim at player if closer */
    var pdx = _playerPos.x - enemy.pos.x;
    var pdz = _playerPos.z - enemy.pos.z;
    var playerDist = Math.sqrt(pdx * pdx + pdz * pdz);

    if (enemy.type === 'sniper') {
      enemy.fireTimer = 3 + Math.random() * 1;
      /* fire at convoy or player within 60u */
      if (playerDist < 60) {
        _playerHP -= 40;
        if (_playerHP < 0) _playerHP = 0;
        _addAlert('SNIPER HIT! -40 HP');
      } else if (target) {
        /* find which bus is nearest */
        for (var bi = 0; bi < _buses.length; bi++) {
          if (_buses[bi].destroyed) continue;
          var bdx = _buses[bi].group.position.x - enemy.pos.x;
          var bdz = _buses[bi].group.position.z - enemy.pos.z;
          if (Math.sqrt(bdx * bdx + bdz * bdz) < 60) {
            _damageBus(bi, 40);
            break;
          }
        }
      }
      if (enemy.muzzleFlash) {
        enemy.muzzleFlash.visible = true;
        enemy.flashTimer = 0.12;
      }

    } else if (enemy.type === 'militia') {
      enemy.fireTimer = 1.5 + Math.random() * 1.5;
      if (playerDist < 30) {
        _playerHP -= 20;
        if (_playerHP < 0) _playerHP = 0;
      } else {
        for (var bi2 = 0; bi2 < _buses.length; bi2++) {
          if (_buses[bi2].destroyed) continue;
          var bdx2 = _buses[bi2].group.position.x - enemy.pos.x;
          var bdz2 = _buses[bi2].group.position.z - enemy.pos.z;
          if (Math.sqrt(bdx2 * bdx2 + bdz2 * bdz2) < 35) {
            _damageBus(bi2, 20);
            break;
          }
        }
      }

    } else if (enemy.type === 'mortar') {
      enemy.fireTimer = 8;
      /* fire handled by mortar team logic below */

    } else if (enemy.type === 'apc') {
      enemy.fireTimer = 2.0 + Math.random();
      /* APC machine gun: hits player or convoy in range */
      if (playerDist < 50) {
        _playerHP -= 25;
        if (_playerHP < 0) _playerHP = 0;
        _addAlert('APC MACHINE GUN - TAKE COVER!');
      } else {
        for (var bi3 = 0; bi3 < _buses.length; bi3++) {
          if (_buses[bi3].destroyed) continue;
          var bdx3 = _buses[bi3].group.position.x - enemy.pos.x;
          var bdz3 = _buses[bi3].group.position.z - enemy.pos.z;
          if (Math.sqrt(bdx3 * bdx3 + bdz3 * bdz3) < 50) {
            _damageBus(bi3, 25);
            break;
          }
        }
      }
    }
  }

  function _updateMortarTeam(dt) {
    if (!_mortarTeam || !_mortarTeam.active) return;

    /* check if all members dead */
    var anyAlive = false;
    for (var mi = 0; mi < _mortarTeam.members.length; mi++) {
      if (_mortarTeam.members[mi].alive) { anyAlive = true; break; }
    }
    if (!anyAlive) {
      _mortarTeam.active = false;
      return;
    }

    _mortarTeam.fireTimer -= dt;
    if (_mortarTeam.fireTimer <= 0) {
      _mortarTeam.fireTimer = 8;

      /* launch mortar shell toward convoy */
      var targetBus = null;
      for (var bi = 0; bi < _buses.length; bi++) {
        if (!_buses[bi].destroyed) { targetBus = _buses[bi]; break; }
      }
      if (!targetBus) return;

      var startPos = _mortarTeam.members[1].pos.clone();
      startPos.y   = 1;
      var endPos   = targetBus.group.position.clone();
      endPos.x    += (Math.random() - 0.5) * 8;
      endPos.z    += (Math.random() - 0.5) * 8;

      var shellGeo  = new THREE.SphereGeometry(0.35, 6, 6);
      var shellMesh = _makeMesh(shellGeo, 0x444444);
      shellMesh.position.copy(startPos);
      _scene.add(shellMesh);

      /* arc velocity */
      var dx  = endPos.x - startPos.x;
      var dz  = endPos.z - startPos.z;
      var dist2 = Math.sqrt(dx * dx + dz * dz);
      var tFlight = dist2 / 20;
      var vy  = (4 + tFlight * 2);

      _mortarShells.push({
        mesh:    shellMesh,
        pos:     startPos.clone(),
        vel:     new THREE.Vector3(dx / tFlight, vy, dz / tFlight),
        endPos:  endPos,
        life:    tFlight + 2
      });

      _addAlert('INCOMING MORTAR!');
    }
  }

  function _updateMortarShells(dt) {
    var GRAVITY = -9.8;
    for (var i = _mortarShells.length - 1; i >= 0; i--) {
      var s = _mortarShells[i];
      s.vel.y += GRAVITY * dt;
      s.pos.addScaledVector(s.vel, dt);
      s.mesh.position.copy(s.pos);
      s.life -= dt;

      if (s.pos.y <= 0 || s.life <= 0) {
        /* impact */
        _scene.remove(s.mesh);
        _areaBombardment(s.pos, 6, 60, 0xFF4400);
        _mortarShells.splice(i, 1);
      }
    }
  }

  function _updateAPC(dt) {
    if (!_apcObj || !_apcObj.alive) return;

    /* patrol road section 220-260 */
    _apcObj.patrolTimer += dt;
    _apcObj.pos.z += _apcObj.patrolDir * 5 * dt;
    _apcObj.group.position.z = _apcObj.pos.z;

    if (_apcObj.pos.z > 265) _apcObj.patrolDir = -1;
    if (_apcObj.pos.z < 220) _apcObj.patrolDir =  1;

    _enemyFire(_apcObj, dt);
  }

  /* ════════════════════════════════════════════════════════════════════════
     ESCORT TRUCKS AUTO-FIRE
  ════════════════════════════════════════════════════════════════════════ */

  function _updateEscortTrucks(dt) {
    for (var ti = 0; ti < _escortTrucks.length; ti++) {
      var truck = _escortTrucks[ti];
      truck.fireTimer -= dt;
      if (truck.fireTimer > 0) continue;
      truck.fireTimer = 1.2;

      /* find nearest alive enemy within 40u */
      var bestEnemy = null;
      var bestDist  = 40;
      var trPos     = truck.group.position;

      for (var ei = 0; ei < _enemies.length; ei++) {
        var en = _enemies[ei];
        if (!en.alive) continue;
        var edx = en.pos.x - trPos.x;
        var edz = en.pos.z - trPos.z;
        var ed  = Math.sqrt(edx * edx + edz * edz);
        if (ed < bestDist) { bestDist = ed; bestEnemy = en; }
      }

      if (bestEnemy) {
        bestEnemy.hp -= 30;
        if (bestEnemy.hp <= 0) {
          bestEnemy.alive = false;
          bestEnemy.group.visible = false;
          _spawnExplosion(bestEnemy.pos, 0xFF6600, 1);
          _score += 50;
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     CONVOY MOVEMENT
  ════════════════════════════════════════════════════════════════════════ */

  function _updateConvoy(dt) {
    /* check roadblock cleared for zone 2 passage */
    var barriersAlive = 0;
    for (var bi = 0; bi < _barriers.length; bi++) {
      if (_barriers[bi].alive) barriersAlive++;
    }
    var militiaAlive = 0;
    for (var ei = 0; ei < _enemies.length; ei++) {
      if (_enemies[ei].type === 'militia' && _enemies[ei].alive) militiaAlive++;
    }
    _barriersCleared = (barriersAlive === 0);
    _allMilitiaDead  = (militiaAlive === 0);

    var canAdvance = true;

    if (_convoyHalted) {
      _checkpointTimer -= dt;
      if (_checkpointTimer <= 0) {
        _convoyHalted = false;
        _addAlert('CONVOY MOVING - RESUME ESCORT');
      }
      return;
    }

    /* checkpoint 1 at z=100 */
    if (!_checkpoint1Triggered && _convoyZ >= 98) {
      _checkpoint1Triggered = true;
      _convoyHalted = true;
      _checkpointTimer = CHECKPOINT_DURATION;
      _addAlert('UN CHECKPOINT 1 - CONVOY HALTED - HOLD POSITION 10s');
    }

    /* checkpoint 2 at z=200 */
    if (!_checkpoint2Triggered && _convoyZ >= 198) {
      _checkpoint2Triggered = true;
      _convoyHalted = true;
      _checkpointTimer = CHECKPOINT_DURATION;
      _addAlert('UN CHECKPOINT 2 - CONVOY HALTED - HOLD POSITION 10s');
    }

    /* roadblock at z=115 blocks until cleared */
    if (_convoyZ >= 110 && _convoyZ < 120 && !_barriersCleared && !_allMilitiaDead) {
      canAdvance = false;
      _addAlert('ROADBLOCK! CLEAR MILITIA OR USE C4 (C key)');
    }

    /* border gate check */
    if (_convoyZ >= 300 && !_borderGateOpen) {
      canAdvance = false;
    }

    if (canAdvance) {
      _convoyZ += CONVOY_SPEED * dt;

      /* move buses */
      for (var i = 0; i < _buses.length; i++) {
        if (!_buses[i].destroyed) {
          _buses[i].group.position.z = _convoyZ - i * BUS_GAP;
        }
      }

      /* move escort trucks */
      for (var ti2 = 0; ti2 < _escortTrucks.length; ti2++) {
        var tx = _escortTrucks[ti2].group.position.x;
        _escortTrucks[ti2].group.position.z = _convoyZ - BUS_COUNT * BUS_GAP - 8;
        _escortTrucks[ti2].group.position.x = tx;
      }

      /* move player vehicle if not boarded */
      if (_playerVehicleGroup && !_playerBoarded) {
        /* vehicle stays parked; no auto-move */
      }
    }

    /* update zone */
    if (_convoyZ < 100) _currentZone = 1;
    else if (_convoyZ < 200) _currentZone = 2;
    else _currentZone = 3;

    /* check border crossing */
    if (_convoyZ >= 305 && !_borderCrossed) {
      _borderCrossed = true;
      var survived = 0;
      for (var si = 0; si < _buses.length; si++) {
        if (!_buses[si].destroyed) survived++;
      }
      if (survived >= 3) {
        _missionDone = true;
        _score += survived * 500;
        _addAlert('CONVOY REACHED SAFETY! ' + survived + ' BUSES MADE IT!');
      } else {
        _missionFailed = true;
        _addAlert('MISSION FAILED: NOT ENOUGH BUSES REACHED SAFETY');
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     IED LOGIC
  ════════════════════════════════════════════════════════════════════════ */

  function _updateIEDs(dt) {
    for (var i = 0; i < _iedObjects.length; i++) {
      var ied = _iedObjects[i];
      if (ied.triggered || ied.defused) continue;

      /* show IED if player within 3u */
      var pdx = _playerPos.x - ied.pos.x;
      var pdz = _playerPos.z - ied.pos.z;
      var pDist = Math.sqrt(pdx * pdx + pdz * pdz);
      ied.mesh.visible = (pDist < 3);

      /* check if convoy bus drives over it */
      for (var bi = 0; bi < _buses.length; bi++) {
        if (_buses[bi].destroyed) continue;
        var bPos = _buses[bi].group.position;
        var bdx  = bPos.x - ied.pos.x;
        var bdz  = bPos.z - ied.pos.z;
        if (Math.sqrt(bdx * bdx + bdz * bdz) < 4) {
          ied.triggered = true;
          ied.mesh.visible = false;
          _areaBombardment(ied.pos, 5, 100, 0xFF5500);
          _addAlert('IED DETONATED! 100 DMG RADIUS 5u');
          break;
        }
      }

      /* defuse with E hold */
      if (pDist < 3 && _eHeldTimer >= 5.0 && !ied.defused) {
        ied.defused = true;
        ied.mesh.visible = false;
        _addAlert('IED DEFUSED!');
        _score += 200;
        _eHeldTimer = 0;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     REPAIR KIT LOGIC
  ════════════════════════════════════════════════════════════════════════ */

  function _updateRepairKits(dt) {
    _eRepairTarget = null;

    for (var i = 0; i < _repairKits.length; i++) {
      var kit = _repairKits[i];
      if (kit.used) continue;

      /* bob animation */
      kit.mesh.position.y = 0.4 + Math.sin(Date.now() * 0.003) * 0.1;

      /* player near kit */
      var pdx = _playerPos.x - kit.pos.x;
      var pdz = _playerPos.z - kit.pos.z;
      var pDist = Math.sqrt(pdx * pdx + pdz * pdz);
      if (pDist < 4) {
        /* find nearest damaged bus */
        var nearBus  = null;
        var nearDist = 20;
        for (var bi = 0; bi < _buses.length; bi++) {
          var bus = _buses[bi];
          if (bus.destroyed || bus.hp >= BUS_HP_MAX) continue;
          var bPos = bus.group.position;
          var bdx  = bPos.x - _playerPos.x;
          var bdz  = bPos.z - _playerPos.z;
          var bd   = Math.sqrt(bdx * bdx + bdz * bdz);
          if (bd < nearDist) { nearDist = bd; nearBus = bi; }
        }
        if (nearBus !== null) {
          _eRepairTarget = nearBus;
          if (_eHeldTimer >= 5.0) {
            kit.used       = true;
            kit.mesh.visible = false;
            _buses[nearBus].hp = Math.min(BUS_HP_MAX, _buses[nearBus].hp + 80);
            _addAlert('BUS ' + (nearBus + 1) + ' REPAIRED +80 HP');
            _score += 100;
            _eHeldTimer = 0;
          }
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BULLET UPDATE
  ════════════════════════════════════════════════════════════════════════ */

  function _updateBullets(dt) {
    for (var i = _bullets.length - 1; i >= 0; i--) {
      var b = _bullets[i];
      b.pos.addScaledVector(b.vel, dt);
      b.mesh.position.copy(b.pos);
      b.life -= dt;

      var hit = false;

      /* check enemy hits */
      for (var ei = 0; ei < _enemies.length; ei++) {
        var en = _enemies[ei];
        if (!en.alive) continue;
        var edx = en.pos.x - b.pos.x;
        var edz = en.pos.z - b.pos.z;
        if (Math.sqrt(edx * edx + edz * edz) < 1.2 && Math.abs(b.pos.y - 1.0) < 1.5) {
          en.hp -= 35;
          if (en.hp <= 0) {
            en.alive = false;
            en.group.visible = false;
            _spawnExplosion(en.pos, 0xFF4400, 0.8);
            _score += 100;
          }
          hit = true;
          break;
        }
      }

      /* check barrier hits */
      if (!hit) {
        for (var bi2 = 0; bi2 < _barriers.length; bi2++) {
          var bar = _barriers[bi2];
          if (!bar.alive) continue;
          var bdx = bar.mesh.position.x - b.pos.x;
          var bdz = bar.mesh.position.z - b.pos.z;
          if (Math.sqrt(bdx * bdx + bdz * bdz) < 1.8 && b.pos.y < 2.0) {
            _scene.remove(bar.mesh);
            bar.alive = false;
            hit = true;
            break;
          }
        }
      }

      if (b.life <= 0 || hit) {
        _scene.remove(b.mesh);
        _bullets.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER UPDATE
  ════════════════════════════════════════════════════════════════════════ */

  function _updatePlayer(dt) {
    if (_missionDone || _missionFailed) return;

    /* rotation from mouse / A-D */
    if (_keys['a'] || _keys['A'] || _keys['ArrowLeft'])  _playerYaw += 1.8 * dt;
    if (_keys['d'] || _keys['D'] || _keys['ArrowRight']) _playerYaw -= 1.8 * dt;

    /* forward / back */
    var fwd = new THREE.Vector3(Math.sin(_playerYaw), 0, Math.cos(_playerYaw));
    var right = new THREE.Vector3(Math.cos(_playerYaw), 0, -Math.sin(_playerYaw));

    if (_keys['w'] || _keys['W'] || _keys['ArrowUp']) {
      _playerVel.addScaledVector(fwd, PLAYER_SPEED * dt);
    }
    if (_keys['s'] || _keys['S'] || _keys['ArrowDown']) {
      _playerVel.addScaledVector(fwd, -PLAYER_SPEED * dt);
    }

    _playerVel.multiplyScalar(PLAYER_FRICTION);
    _playerPos.addScaledVector(_playerVel, dt);
    _playerPos.y = 1.0;

    /* clamp to terrain */
    if (_playerPos.x < -35) _playerPos.x = -35;
    if (_playerPos.x >  35) _playerPos.x =  35;
    if (_playerPos.z <  -5) _playerPos.z = -5;
    if (_playerPos.z > 315) _playerPos.z = 315;

    _playerGroup.position.copy(_playerPos);
    _playerGroup.rotation.y = _playerYaw;

    /* if boarded, sync to vehicle */
    if (_playerBoarded && _boardedTruck) {
      _boardedTruck.group.position.x = _playerPos.x;
      _boardedTruck.group.position.z = _playerPos.z;
    }

    /* E hold timer */
    if (_keys['e'] || _keys['E']) {
      _eHeldTimer += dt;
    } else {
      _eHeldTimer = 0;
    }

    /* border gate open: E hold near gate */
    if (!_borderGateOpen) {
      var gdx = _playerPos.x - 0;
      var gdz = _playerPos.z - 305;
      if (Math.sqrt(gdx * gdx + gdz * gdz) < 8 && _eHeldTimer >= 5.0) {
        _borderGateOpen = true;
        if (_borderGateMesh) _borderGateMesh.visible = false;
        _addAlert('BORDER GATE OPEN - CONVOY CAN PASS!');
        _eHeldTimer = 0;
      }
    }

    /* C key: detonate C4 on barriers */
    if (_cTapped) {
      var cleared = 0;
      for (var bi = 0; bi < _barriers.length; bi++) {
        if (_barriers[bi].alive) {
          _scene.remove(_barriers[bi].mesh);
          _barriers[bi].alive = false;
          cleared++;
        }
      }
      if (cleared > 0) {
        _spawnExplosion(new THREE.Vector3(0, 0.5, 115), 0xFF5500, 2);
        _addAlert('C4 DETONATED - ROADBLOCK CLEARED!');
        _score += 150;
      }
    }

    /* shoot */
    if (_shootCooldown > 0) _shootCooldown -= dt;
    if ((_keys[' '] || _keys['Space']) && _shootCooldown <= 0) {
      _shoot();
    }

    /* board / exit vehicle: E tap */
    if (_eTapped) {
      if (!_playerBoarded) {
        /* check if near escort truck */
        for (var ti = 0; ti < _escortTrucks.length; ti++) {
          var tr = _escortTrucks[ti];
          var tdx = tr.group.position.x - _playerPos.x;
          var tdz = tr.group.position.z - _playerPos.z;
          if (Math.sqrt(tdx * tdx + tdz * tdz) < 5) {
            _playerBoarded = true;
            _boardedTruck  = tr;
            _addAlert('BOARDED ESCORT VEHICLE');
            break;
          }
        }
        /* check player vehicle */
        if (!_playerBoarded && _playerVehicleGroup) {
          var pvdx = _playerVehicleGroup.position.x - _playerPos.x;
          var pvdz = _playerVehicleGroup.position.z - _playerPos.z;
          if (Math.sqrt(pvdx * pvdx + pvdz * pvdz) < 5) {
            _playerBoarded = true;
            _boardedTruck  = { group: _playerVehicleGroup, fireTimer: 0 };
            _addAlert('BOARDED ESCORT VEHICLE - CONVOY SPEED');
          }
        }
      } else {
        _playerBoarded = false;
        _boardedTruck  = null;
        _addAlert('DISMOUNTED');
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     EXPLOSION POOL UPDATE
  ════════════════════════════════════════════════════════════════════════ */

  function _updateExplosions(dt) {
    for (var i = _explosions.length - 1; i >= 0; i--) {
      var ex = _explosions[i];
      ex.life -= dt;
      ex.mat.opacity = ex.life / ex.maxLife;
      ex.mesh.scale.setScalar(1 + (1 - ex.life / ex.maxLife) * 2);
      if (ex.life <= 0) {
        _scene.remove(ex.mesh);
        _explosions.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ALERT TICKER
  ════════════════════════════════════════════════════════════════════════ */

  function _updateAlerts(dt) {
    for (var i = _alertLines.length - 1; i >= 0; i--) {
      _alertLines[i].timer -= dt;
      if (_alertLines[i].timer <= 0) {
        _alertLines.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     CAMERA
  ════════════════════════════════════════════════════════════════════════ */

  function _updateCamera() {
    if (!_camera) return;
    var camOffset = new THREE.Vector3(
      -Math.sin(_playerYaw) * 12,
      8,
      -Math.cos(_playerYaw) * 12
    );
    _camera.position.lerp(_playerPos.clone().add(camOffset), 0.1);
    _camera.lookAt(_playerPos.clone().add(new THREE.Vector3(0, 1, 0)));
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT HANDLERS
  ════════════════════════════════════════════════════════════════════════ */

  function _onKeyDown(e) {
    _keys[e.key] = true;

    /* activation: R + C within 400ms */
    if (e.key === 'r' || e.key === 'R') {
      _rPressTime = performance.now() / 1000;
    }
    if (e.key === 'c' || e.key === 'C') {
      _cKeyPressTime = performance.now() / 1000;
      _cTapped = true;
    }
    if (e.key === 'e' || e.key === 'E') {
      _eTapped = true;
    }
    if (e.key === ' ') {
      _spaceTapped = true;
    }

    /* check activation */
    if (!_active) {
      var now = performance.now() / 1000;
      var rAge = now - _rPressTime;
      var cAge = now - _cKeyPressTime;
      if (rAge < RC_WINDOW && cAge < RC_WINDOW &&
          (_rPressTime > 0 || _cKeyPressTime > 0)) {
        /* activated */
      }
    }
  }

  function _onKeyUp(e) {
    _keys[e.key] = false;
  }

  /* ════════════════════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════════════════════ */

  var _playerVehicleGroup = null;

  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);

    _buildScene();
    _buildHUD();

    /* ambient light if none */
    var hasAmbient = false;
    _scene.traverse(function(obj) {
      if (obj.isAmbientLight) hasAmbient = true;
    });
    if (!hasAmbient) {
      _scene.add(new THREE.AmbientLight(0x666666));
    }
    var hasDir = false;
    _scene.traverse(function(obj) {
      if (obj.isDirectionalLight) hasDir = true;
    });
    if (!hasDir) {
      var dLight = new THREE.DirectionalLight(0xFFFFDD, 0.9);
      dLight.position.set(30, 60, 20);
      _scene.add(dLight);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     UPDATE (called every frame)
  ════════════════════════════════════════════════════════════════════════ */

  function update(timestamp) {
    var now = timestamp / 1000;
    var dt  = Math.min(now - _lastTime, 0.1);
    _lastTime = now;

    /* check R+C activation */
    if (!_active) {
      var rAge2 = now - _rPressTime;
      var cAge2 = now - _cKeyPressTime;
      if (_rPressTime > 0 && _cKeyPressTime > 0 &&
          Math.abs(rAge2 - cAge2) < RC_WINDOW &&
          rAge2 < RC_WINDOW * 2) {
        _active = true;
        _lastTime = now;
        _addAlert('REFUGEE CONVOY MISSION ACTIVATED - ESCORT TO BORDER!');
      }
      /* consume tapped flags */
      _eTapped = false;
      _cTapped = false;
      _spaceTapped = false;
      _updateHUD();
      return;
    }

    if (_missionDone || _missionFailed) {
      _updateHUD();
      _eTapped = false;
      _cTapped = false;
      _spaceTapped = false;
      return;
    }

    _missionTimer += dt;
    if (_missionTimer >= MISSION_TIME_MAX && !_missionDone) {
      _missionFailed = true;
      _addAlert('TIME EXPIRED - MISSION FAILED');
    }

    _updateConvoy(dt);
    _updatePlayer(dt);
    _updateBullets(dt);

    /* enemy AI */
    for (var ei = 0; ei < _enemies.length; ei++) {
      var en = _enemies[ei];
      if (!en.alive) continue;
      if (en.type !== 'apc' && en.type !== 'mortar') {
        _enemyFire(en, dt);
      }
      /* muzzle flash */
      if (en.muzzleFlash && en.muzzleFlash.visible) {
        en.flashTimer -= dt;
        if (en.flashTimer <= 0) {
          en.muzzleFlash.visible = false;
        }
      }
      /* face convoy */
      var lead = _buses[0];
      if (lead && !lead.destroyed) {
        var lfx = lead.group.position.x - en.pos.x;
        var lfz = lead.group.position.z - en.pos.z;
        en.group.rotation.y = Math.atan2(lfx, lfz);
      }
    }

    _updateMortarTeam(dt);
    _updateMortarShells(dt);
    _updateAPC(dt);
    _updateEscortTrucks(dt);
    _updateIEDs(dt);
    _updateRepairKits(dt);
    _updateExplosions(dt);
    _updateAlerts(dt);

    /* bus hit flash */
    for (var bi = 0; bi < _buses.length; bi++) {
      var bus = _buses[bi];
      if (bus.hitFlashTimer > 0) {
        bus.hitFlashTimer -= dt;
        /* flash red by adjusting material color */
        bus.group.traverse(function(child) {
          if (child.isMesh && child.material) {
            child.material.emissive = new THREE.Color(0xFF0000);
            child.material.emissiveIntensity = 0.6;
          }
        });
      } else {
        bus.group.traverse(function(child) {
          if (child.isMesh && child.material) {
            child.material.emissiveIntensity = 0;
          }
        });
      }
    }

    /* player death */
    if (_playerHP <= 0) {
      _playerHP = 0;
      _missionFailed = true;
      _addAlert('PLAYER KIA - MISSION FAILED');
    }

    _updateCamera();
    _updateHUD();

    /* clear one-shot flags */
    _eTapped     = false;
    _cTapped     = false;
    _spaceTapped = false;
  }

  /* ════════════════════════════════════════════════════════════════════════
     RESET
  ════════════════════════════════════════════════════════════════════════ */

  function reset() {
    /* remove all scene objects we added */
    if (_scene) {
      /* remove buses */
      for (var i = 0; i < _buses.length; i++) {
        _scene.remove(_buses[i].group);
      }
      /* remove enemies */
      for (var ei = 0; ei < _enemies.length; ei++) {
        _scene.remove(_enemies[ei].group);
      }
      /* remove barriers */
      for (var bi = 0; bi < _barriers.length; bi++) {
        _scene.remove(_barriers[bi].mesh);
      }
      /* remove repair kits */
      for (var ri = 0; ri < _repairKits.length; ri++) {
        _scene.remove(_repairKits[ri].mesh);
      }
      /* remove IEDs */
      for (var ii = 0; ii < _iedObjects.length; ii++) {
        _scene.remove(_iedObjects[ii].mesh);
      }
      /* remove mortar shells */
      for (var ms = 0; ms < _mortarShells.length; ms++) {
        _scene.remove(_mortarShells[ms].mesh);
      }
      /* remove explosions */
      for (var ex = 0; ex < _explosions.length; ex++) {
        _scene.remove(_explosions[ex].mesh);
      }
      /* remove bullets */
      for (var bl = 0; bl < _bullets.length; bl++) {
        _scene.remove(_bullets[bl].mesh);
      }
      if (_playerGroup)  _scene.remove(_playerGroup);
      if (_borderGroup)  _scene.remove(_borderGroup);
      if (_checkpoint1Group) _scene.remove(_checkpoint1Group);
      if (_checkpoint2Group) _scene.remove(_checkpoint2Group);
      if (_playerVehicleGroup) _scene.remove(_playerVehicleGroup);
      for (var ti = 0; ti < _escortTrucks.length; ti++) {
        _scene.remove(_escortTrucks[ti].group);
      }
      if (_ruins) {
        for (var rui = 0; rui < _ruins.length; rui++) {
          _scene.remove(_ruins[rui]);
        }
      }
    }

    /* remove event listeners */
    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup',   _onKeyUp);

    /* remove HUD */
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
    }

    /* reset all state */
    _active          = false;
    _missionDone     = false;
    _missionFailed   = false;
    _score           = 0;
    _lastTime        = 0;
    _missionTimer    = 0;
    _buses           = [];
    _enemies         = [];
    _barriers        = [];
    _repairKits      = [];
    _iedObjects      = [];
    _mortarShells    = [];
    _explosions      = [];
    _bullets         = [];
    _escortTrucks    = [];
    _ruins           = [];
    _alertLines      = [];
    _convoyZ         = 0;
    _convoyHalted    = false;
    _checkpoint1Passed = false;
    _checkpoint2Passed = false;
    _checkpoint1Triggered = false;
    _checkpoint2Triggered = false;
    _borderGateOpen  = false;
    _borderCrossed   = false;
    _playerHP        = 100;
    _playerPos       = new THREE.Vector3(-8, 1, 0);
    _playerVel       = new THREE.Vector3(0, 0, 0);
    _playerYaw       = 0;
    _playerBoarded   = false;
    _boardedTruck    = null;
    _playerGroup     = null;
    _borderGroup     = null;
    _borderGateMesh  = null;
    _checkpoint1Group= null;
    _checkpoint2Group= null;
    _playerVehicleGroup = null;
    _mortarTeam      = null;
    _apcObj          = null;
    _barriersCleared = false;
    _allMilitiaDead  = false;
    _hudEl           = null;
    _eHeldTimer      = 0;
    _eTapped         = false;
    _cTapped         = false;
    _spaceTapped     = false;
    _shootCooldown   = 0;
    _rPressTime      = 0;
    _cKeyPressTime   = 0;
    _currentZone     = 1;
    _eRepairTarget   = null;
    _repairKitCount  = 3;
    _scene           = null;
    _camera          = null;
  }

  return { init: init, update: update, reset: reset };

}());
